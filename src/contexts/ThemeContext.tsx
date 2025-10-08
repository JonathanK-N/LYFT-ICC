import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

interface ThemeContextValue {
  isDark: boolean;
  fontScale: number;
  voiceEnabled: boolean;
  toggleDarkMode: () => void;
  setFontScale: (scale: number) => void;
  toggleVoice: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const DARK_CLASS = 'theme-dark';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [fontScale, setFontScale] = useState<number>(1);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(false);

  useEffect(() => {
    document.body.classList.toggle(DARK_CLASS, isDark);
  }, [isDark]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--font-scale',
      fontScale.toString(),
    );
  }, [fontScale]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      isDark,
      fontScale,
      voiceEnabled,
      toggleDarkMode: () => setIsDark((prev) => !prev),
      setFontScale,
      toggleVoice: () => setVoiceEnabled((prev) => !prev),
    }),
    [isDark, fontScale, voiceEnabled],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
