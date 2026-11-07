import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexReactClient } from 'convex/react';
import { ApplicationProviders } from './RootProviders';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getConvexDeploymentUrl, isSupabaseConfigured } from './lib/supabase';
import App from './App.tsx';
import './index.css';

// Keep one optional client available for isolated Convex features (such as Live Rooms).
// This does not enable the legacy Convex application route.
const convexUrl = getConvexDeploymentUrl() ?? undefined;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : undefined;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApplicationProviders
      convexUrl={convexUrl}
      convexClient={convex}
      supabaseConfigured={isSupabaseConfigured()}
      AuthenticationProvider={AuthProvider}
      useAuthHook={useAuth}
    >
      <App />
    </ApplicationProviders>
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
