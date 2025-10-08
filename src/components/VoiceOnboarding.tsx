import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiHeadphones, FiPlay, FiRefreshCw, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import './VoiceOnboarding.css';

const STORAGE_KEY = 'lyft-icc.voice-onboarding.v1';

export default function VoiceOnboarding() {
  const { language, translate } = useLanguage();
  const { voiceEnabled } = useTheme();
  const [visible, setVisible] = useState(false);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);

  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  const assistant = useVoiceAssistant(locale, { rate: 0.98, pitch: 1 });

  const script = useMemo(() => {
    if (language === 'fr') {
      return [
        'Bienvenue sur Lyft ICC. Activez votre profil depuis la page Authentification pour accéder aux trajets vérifiés.',
        'Sur la page Carte, sélectionnez un trajet proposé ou démarrez le vôtre en tant que conducteur.',
        'Consultez vos notifications dans le panneau supérieur et soutenez Impact Centre Chrétien via l’onglet Profil.',
      ];
    }
    return [
      'Welcome to Lyft ICC. Create or confirm your profile from the Auth page to join verified rides.',
      'Use the Map page to pick a ride near you or start your own journey as a driver.',
      'Check the notification tray for updates and support Impact Centre Chrétien through the Profile tab.',
    ];
  }, [language]);

  const handlePlay = useCallback(() => {
    if (!assistant.available) {
      return;
    }
    assistant.speakSequence(script);
  }, [assistant, script]);

  const handleClose = useCallback(() => {
    assistant.cancel();
    setVisible(false);
  }, [assistant]);

  useEffect(() => {
    if (!voiceEnabled) {
      assistant.cancel();
      setVisible(false);
      return;
    }
    const alreadySeen =
      typeof window !== 'undefined' && window.localStorage
        ? localStorage.getItem(STORAGE_KEY)
        : '0';
    setVisible(true);
    if (!alreadySeen && assistant.available && !hasAutoPlayed) {
      assistant.speakSequence(script);
      setHasAutoPlayed(true);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, '1');
      }
    }
  }, [assistant, script, voiceEnabled, hasAutoPlayed]);

  if (!voiceEnabled) {
    return null;
  }

  return (
    <AnimatePresence>
      {visible ? (
        <motion.aside
          className="voice-onboarding"
          initial={{ opacity: 0, translateY: -12 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: -12 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <header className="voice-onboarding__header">
            <span className="badge">
              <FiHeadphones /> {translate('voice_support')}
            </span>
            <button type="button" className="close-btn" onClick={handleClose} aria-label="Fermer l’onboarding vocal">
              <FiX />
            </button>
          </header>
          <div className="voice-onboarding__content">
            <p>
              {language === 'fr'
                ? 'Appuyez sur lecture pour écouter les étapes clés de la PWA.'
                : 'Tap play to hear the key steps of the experience.'}
            </p>
            <ol>
              {script.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
          <footer className="voice-onboarding__actions">
            <button type="button" onClick={handlePlay} disabled={!assistant.available}>
              <FiPlay /> {language === 'fr' ? 'Écouter' : 'Listen'}
            </button>
            <button type="button" className="ghost" onClick={handlePlay} disabled={!assistant.available}>
              <FiRefreshCw /> {language === 'fr' ? 'Relancer' : 'Replay'}
            </button>
          </footer>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
