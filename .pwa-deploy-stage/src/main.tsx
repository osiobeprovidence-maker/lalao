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

const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl) {
  createRoot(document.getElementById('root')!).render(
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] text-white p-6 font-sans">
      <div className="max-w-md w-full bg-[#161B26] p-8 rounded-2xl border border-white/10 text-center space-y-5 shadow-2xl">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center font-bold text-xl">
          ⚡
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight">Convex URL Missing</h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Your frontend cannot connect to Convex because <code className="text-indigo-400 bg-white/5 px-1.5 py-0.5 rounded text-xs">VITE_CONVEX_URL</code> is not configured.
          </p>
        </div>
        <div className="bg-[#0B0F19] p-4 rounded-xl border border-white/10 text-left space-y-2">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Run in your terminal:</p>
          <code className="block text-sm font-mono text-indigo-300 select-all">npx convex dev</code>
        </div>
        <p className="text-xs text-neutral-500">
          This will link your backend deployment and generate your <code className="text-neutral-400">.env.local</code> file automatically.
        </p>
      </div>
    </div>
  );
} else {
  const convex = new ConvexReactClient(convexUrl);

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
}

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
