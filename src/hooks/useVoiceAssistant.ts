import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface VoiceAssistantOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
}

interface VoiceAssistant {
  speak: (message: string) => void;
  speakSequence: (messages: string[]) => void;
  cancel: () => void;
  isSpeaking: boolean;
  available: boolean;
}

const DEFAULT_OPTIONS: VoiceAssistantOptions = {
  rate: 1,
  pitch: 1,
  volume: 1,
};

function resolveSynth(): SpeechSynthesis | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.speechSynthesis ?? null;
}

export function useVoiceAssistant(locale: string, options?: VoiceAssistantOptions): VoiceAssistant {
  const synthRef = useRef<SpeechSynthesis | null>(resolveSynth());
  const queueRef = useRef<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const settings = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options]);

  const cancel = useCallback(() => {
    const synth = synthRef.current;
    if (!synth) {
      return;
    }
    synth.cancel();
    queueRef.current = [];
    setIsSpeaking(false);
  }, []);

  const flushQueue = useCallback(() => {
    const synth = synthRef.current;
    if (!synth) {
      return;
    }
    if (queueRef.current.length === 0) {
      setIsSpeaking(false);
      return;
    }
    const message = queueRef.current.shift();
    if (!message) {
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = locale;
    utterance.pitch = settings.pitch ?? 1;
    utterance.rate = settings.rate ?? 1;
    utterance.volume = settings.volume ?? 1;
    utterance.onend = () => flushQueue();
    utterance.onerror = () => flushQueue();
    setIsSpeaking(true);
    synth.speak(utterance);
  }, [locale, settings]);

  const speak = useCallback(
    (message: string) => {
      if (!message.trim()) {
        return;
      }
      cancel();
      queueRef.current = [message];
      flushQueue();
    },
    [cancel, flushQueue],
  );

  const speakSequence = useCallback(
    (messages: string[]) => {
      const content = messages.filter((text) => text && text.trim().length > 0);
      if (content.length === 0) {
        return;
      }
      cancel();
      queueRef.current = [...content];
      flushQueue();
    },
    [cancel, flushQueue],
  );

  useEffect(() => cancel, [cancel]);

  return {
    speak,
    speakSequence,
    cancel,
    isSpeaking,
    available: Boolean(synthRef.current),
  };
}
