import React from 'react';
import { ConvexProviderWithAuth } from 'convex/react';
import { DynamicBranding } from './DynamicBranding';
import { ConvexFeatureBoundary } from './ConvexFeatureBoundary';
import { hasConvexDeployment } from '../../lib/supabase';
import { useOptionalConvexClient } from '../../context/OptionalConvexClientContext';
import { useAuth } from '../../context/AuthContext';

const ConvexFeatureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const client = useOptionalConvexClient();
  if (!client) return null;
  return (
    <ConvexProviderWithAuth client={client} useAuth={useAuth}>
      <DynamicBranding />
      {children}
    </ConvexProviderWithAuth>
  );
};

export const ConvexAppBoundary: React.FC<{
  children: React.ReactNode;
  feature?: string;
  unavailableFallback?: React.ReactNode;
}> = ({ children, feature = 'Lalao app', unavailableFallback }) => (
  <ConvexFeatureBoundary
    feature={feature}
    available={hasConvexDeployment()}
    unavailableFallback={unavailableFallback}
  >
    <ConvexFeatureProvider>{children}</ConvexFeatureProvider>
  </ConvexFeatureBoundary>
);
