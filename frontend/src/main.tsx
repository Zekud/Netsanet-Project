// main.tsx — Application entry point.
// Wraps App with ThemeProvider, AuthProvider, and TanStack Query provider.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';

import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/ToastProvider';
import { queryClient } from './lib/queryClient';
import App from './App';
import './lib/i18n'; // boot i18next (cookie-based language detection)
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
);
