import React from 'react';
import { ConvexProviderWithAuth } from 'convex/react';
import { useAuth } from '../../context/AuthContext';
import { useOptionalConvexClient } from '../../context/OptionalConvexClientContext';
import { ErrorBoundary } from './ErrorBoundary';

/** Mounts only a room feature under Convex while retaining the existing auth token bridge. */
export function ConvexRoomsBoundary({ children }: { children: React.ReactNode }) {
  const client = useOptionalConvexClient();
  if (!client) {
    return (
      <section className="rounded-2xl border border-theme-divider bg-theme-surface p-6 text-center">
        <h2 className="font-semibold text-theme-primary">Live Rooms are unavailable</h2>
        <p className="mt-2 text-sm text-theme-tertiary">The room service is not configured for this deployment.</p>
      </section>
    );
  }

  return <ConvexProviderWithAuth client={client} useAuth={useAuth}>
    <ErrorBoundary fallback={<section className="rounded-2xl border border-theme-divider bg-theme-surface p-6 text-center"><h2 className="font-semibold text-theme-primary">Live Rooms could not connect</h2><p className="mt-2 text-sm text-theme-tertiary">The rest of Lalao remains available. Try again later.</p></section>}>
      {children}
    </ErrorBoundary>
  </ConvexProviderWithAuth>;
}
