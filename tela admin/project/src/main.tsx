import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { SupabaseProvider } from './lib/supabase-provider';
import { Toaster } from 'react-hot-toast';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SupabaseProvider>
        <App />
        <Toaster position="top-right" toastOptions={{
          style: {
            background: '#46342e',
            color: '#fff',
          },
        }} />
      </SupabaseProvider>
    </BrowserRouter>
  </StrictMode>
);