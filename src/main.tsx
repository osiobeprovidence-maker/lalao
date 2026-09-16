import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import App from './App.tsx';
import './index.css';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ConvexProviderWithAuth client={convex} useAuth={useAuth}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ConvexProviderWithAuth>
    </AuthProvider>
  </StrictMode>,
);
