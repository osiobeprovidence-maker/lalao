import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DynamicBranding } from './components/common/DynamicBranding';
import { ThemeProvider } from './context/ThemeContext';
import { PWAProvider } from './hooks/usePWA';
import App from './App.tsx';
import './index.css';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ConvexProviderWithAuth client={convex} useAuth={useAuth}>
        <DynamicBranding />
        <ThemeProvider>
          <BrowserRouter>
            <PWAProvider>
              <App />
            </PWAProvider>
          </BrowserRouter>
        </ThemeProvider>
      </ConvexProviderWithAuth>
    </AuthProvider>
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(
        (registration) => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        },
        (err) => {
          console.log('ServiceWorker registration failed: ', err);
        }
      );
    });
  } else {
    // In development, ensure any previously registered service workers and caches are purged
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      if (registrations.length > 0) {
        Promise.all(registrations.map((r) => r.unregister())).then(() => {
          if (typeof caches !== 'undefined') {
            caches.keys().then((keys) => {
              Promise.all(keys.map((k) => caches.delete(k))).then(() => {
                globalThis.location?.reload();
              });
            });
          } else {
            globalThis.location?.reload();
          }
        });
      }
    });
  }
}
