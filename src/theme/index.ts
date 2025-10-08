import { useEffect } from 'react';
import { gradients, layout, palette, radius, typography } from './tokens';

const cssVariables: Record<string, string> = {
  '--icc-color-night': palette.night,
  '--icc-color-midnight': palette.midnight,
  '--icc-color-deep-blue': palette.deepBlue,
  '--icc-color-cobalt': palette.cobalt,
  '--icc-color-sky': palette.sky,
  '--icc-color-aqua': palette.aqua,
  '--icc-color-gold': palette.gold,
  '--icc-color-amber': palette.amber,
  '--icc-color-soft-white': palette.softWhite,
  '--icc-color-muted': palette.muted,
  '--icc-color-success': palette.success,
  '--icc-color-danger': palette.danger,
  '--icc-gradient-primary': gradients.primary,
  '--icc-gradient-accent': gradients.accent,
  '--icc-gradient-glass': gradients.glass,
  '--icc-gradient-overlay': gradients.overlay,
  '--icc-radius-xs': radius.xs,
  '--icc-radius-sm': radius.sm,
  '--icc-radius-md': radius.md,
  '--icc-radius-lg': radius.lg,
  '--icc-radius-xl': radius.xl,
  '--icc-radius-pill': radius.pill,
  '--icc-max-width': layout.maxWidth,
  '--icc-gutter': layout.gutter,
  '--icc-safe-inset': layout.safeInset,
  '--icc-font-display': typography.family.display,
  '--icc-font-body': typography.family.body,
};

export function useDesignTokens() {
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(cssVariables).forEach(([token, value]) => {
      root.style.setProperty(token, value);
    });
  }, []);
}
