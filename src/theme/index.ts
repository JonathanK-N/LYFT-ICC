import { useEffect } from 'react';
import { designTokens } from './tokens';

const cssVariables: Record<string, string> = {
  '--color-primary': designTokens.colors.primary,
  '--color-primary-dark': designTokens.colors.primaryDark,
  '--color-primary-light': designTokens.colors.primaryLight,
  '--color-secondary': designTokens.colors.secondary,
  '--color-background': designTokens.colors.background,
  '--color-surface': designTokens.colors.surface,
  '--color-text': designTokens.colors.text.primary,
  '--color-text-muted': designTokens.colors.text.muted,
  '--color-border': designTokens.colors.border,
  '--shadow-sm': designTokens.shadows.sm,
  '--shadow-md': designTokens.shadows.md,
  '--shadow-lg': designTokens.shadows.lg,
};

export function useDesignTokens() {
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(cssVariables).forEach(([token, value]) => {
      root.style.setProperty(token, value);
    });
  }, []);
}