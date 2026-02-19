import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx';
import './index.css';
import { HostelModeProvider } from './hooks/useHostelMode';
import { ThemeProvider } from './hooks/useTheme.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster position="top-center" />
    <ThemeProvider>
      <HostelModeProvider>
        <App />
      </HostelModeProvider>
    </ThemeProvider>
  </StrictMode>
);
