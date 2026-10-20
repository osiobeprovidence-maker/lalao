import React from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../context/AuthContext';

/**
 * Wraps onboarding routes. If the user has already completed onboarding
 * (onboardingStep === 'complete') they are redirected to /app so the browser
 * back button can never return them to any onboarding screen.
 * While auth / user data is still loading we show nothing to avoid a flash.
 */
export const OnboardingGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const currentUser = useQuery(api.users.getCurrentUser);

  // Still loading – render nothing so we don't flash the wrong page
  if (isAuthLoading || (isAuthenticated && currentUser === undefined)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-surface">
        <div className="w-8 h-8 rounded-full border-4 border-theme-divider border-t-[#5E43F3] animate-spin" />
      </div>
    );
  }

  // If the user is authenticated and onboarding is done, kick them to /app
  if (isAuthenticated && currentUser?.onboardingStep === 'complete') {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
};
