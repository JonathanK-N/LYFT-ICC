// Couleurs basées sur le logo ICC (tons dorés/oranges)
export const designTokens = {
  colors: {
    primary: '#D4A574', // Or principal du logo
    primaryDark: '#B8935F',
    primaryLight: '#E8C49A',
    
    secondary: '#8B4513', // Brun du logo
    secondaryDark: '#6B3410',
    secondaryLight: '#A0522D',
    
    accent: '#F4E4BC', // Crème doré
    
    background: '#FEFCF8', // Blanc cassé chaleureux
    surface: '#FFFFFF',
    surfaceElevated: '#FFF9F0',
    
    text: {
      primary: '#2C1810',
      secondary: '#5D4037',
      muted: '#8D6E63',
      inverse: '#FFFFFF',
    },
    
    border: '#E8D5B7',
    borderLight: '#F0E6D2',
    
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  },
  
  shadows: {
    sm: '0 2px 8px rgba(212, 165, 116, 0.1)',
    md: '0 4px 16px rgba(212, 165, 116, 0.15)',
    lg: '0 8px 32px rgba(212, 165, 116, 0.2)',
  },
  
  typography: {
    fontFamily: {
      primary: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      heading: 'Poppins, Inter, sans-serif',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '2rem',
    },
  },
};