import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  CURRENT_USER_PROFILE_UPDATED_EVENT,
  invokeSupabaseFunction,
  isSupabaseDataBackendEnabled,
} from '../lib/supabase';

export type CurrentUserQueryResult = {
  data: any | null | undefined;
  error: Error | null;
  retry: () => void;
};

const CurrentUserQueryContext = createContext<CurrentUserQueryResult | null>(null);

/** Current-user identity is always resolved through the Supabase app-user function. */
export const CurrentUserQueryProvider: React.FC<{
  children: React.ReactNode;
  supabaseConfigured?: boolean;
}> = ({ children, supabaseConfigured }) => {
  if (isSupabaseDataBackendEnabled(supabaseConfigured)) {
    return React.createElement(SupabaseCurrentUserProvider, null, children);
  }
  return React.createElement(CurrentUserQueryContext.Provider, { value: {
      data: undefined,
      error: new Error('Current-user data is unavailable because Supabase is not configured.'),
      retry: () => undefined,
    } }, children);
};

function SupabaseCurrentUserProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<{ data: any | null | undefined; error: Error | null }>({ data: undefined, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (authLoading) {
      setState({ data: undefined, error: null });
      return;
    }
    if (!isAuthenticated) {
      setState({ data: null, error: null });
      return;
    }

    let active = true;
    setState({ data: undefined, error: null });
    invokeSupabaseFunction<any | null>('app-user', { operation: 'getCurrentUser' })
      .then((data) => { if (active) setState({ data, error: null }); })
      .catch((error: unknown) => {
        if (active) setState({
          data: undefined,
          error: error instanceof Error ? error : new Error('Could not load your Lalao profile.'),
        });
      });
    return () => { active = false; };
  }, [isAuthenticated, authLoading, user?.uid, attempt]);

  useEffect(() => {
    const refreshProfile = () => setAttempt((value) => value + 1);
    window.addEventListener(CURRENT_USER_PROFILE_UPDATED_EVENT, refreshProfile);
    return () => window.removeEventListener(CURRENT_USER_PROFILE_UPDATED_EVENT, refreshProfile);
  }, []);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return React.createElement(CurrentUserQueryContext.Provider, { value: { ...state, retry } }, children);
}

export function useCurrentUserQuery(): CurrentUserQueryResult {
  const result = useContext(CurrentUserQueryContext);
  if (!result) throw new Error('useCurrentUserQuery must be used within CurrentUserQueryProvider.');
  return result;
}
