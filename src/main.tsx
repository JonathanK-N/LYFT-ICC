import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppStateProvider } from './contexts/AppStateContext';
import { DesignProvider } from './theme/DesignProvider';
import { queryClient } from './lib/queryClient';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <DesignProvider>
        <LanguageProvider>
          <ThemeProvider>
            <AppStateProvider>
              <App />
            </AppStateProvider>
          </ThemeProvider>
        </LanguageProvider>
      </DesignProvider>
    </QueryClientProvider>
  </StrictMode>,
);
