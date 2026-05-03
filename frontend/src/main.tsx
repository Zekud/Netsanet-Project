// main.tsx — Application entry point.
// Wraps App with AuthProvider and TanStack Query provider.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/ToastProvider';
import { queryClient } from './lib/queryClient';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
