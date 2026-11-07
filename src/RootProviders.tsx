import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ConvexReactClient } from 'convex/react';
import { ThemeProvider } from './context/ThemeContext';
import { PWAProvider } from './hooks/usePWA';
import { CurrentUserQueryProvider } from './hooks/useCurrentUserQuery';
import { OptionalConvexClientProvider } from './context/OptionalConvexClientContext';
import { getApplicationBackendMode } from './lib/backendMode';

type ApplicationProvidersProps = {
  children: React.ReactNode;
  convexUrl?: string;
  convexClient?: InstanceType<typeof ConvexReactClient>;
  supabaseConfigured: boolean;
  AuthenticationProvider: React.ComponentType<{ children: React.ReactNode }>;
  useAuthHook: (...args: any[]) => any;
  Router?: React.ComponentType<any>;
  routerProps?: Record<string, unknown>;
};

function ConfigurationRequired() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] text-white p-6 font-sans">
      <div className="max-w-md w-full bg-[#161B26] p-8 rounded-2xl border border-white/10 text-center space-y-3 shadow-2xl">
        <h2 className="text-xl font-bold tracking-tight">Backend configuration required</h2>
        <p className="text-sm text-neutral-400 leading-relaxed">
          Configure a valid Supabase project URL and public publishable key before opening Lalao.
        </p>
      </div>
    </div>
  );
}

/** Shared Supabase root. Legacy Convex features are mounted under their own feature boundaries. */
export function ApplicationProviders({
  children,
  convexClient,
  supabaseConfigured,
  AuthenticationProvider,
  Router = BrowserRouter,
  routerProps = {},
}: ApplicationProvidersProps) {
  const mode = getApplicationBackendMode(supabaseConfigured);
  if (mode === 'unavailable') return <ConfigurationRequired />;

  const routedApp = (
    <OptionalConvexClientProvider client={convexClient ?? null}>
      <CurrentUserQueryProvider supabaseConfigured={supabaseConfigured}>
        <ThemeProvider>
          <Router {...routerProps}>
            <PWAProvider>{children}</PWAProvider>
          </Router>
        </ThemeProvider>
      </CurrentUserQueryProvider>
    </OptionalConvexClientProvider>
  );

  return <AuthenticationProvider>{routedApp}</AuthenticationProvider>;
}
