import { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../context/AuthContext';
import { invokeSupabaseFunction, isSupabaseProfileReadsBackendEnabled } from '../lib/supabase';

type PublicUserProfileState = {
  data: Record<string, any> | null | undefined;
  error: Error | null;
};

/** Uses the authenticated public-profile Edge Function when enabled; otherwise preserves the Convex query path. */
export function useUserByUsernameQuery(username: string | undefined): PublicUserProfileState {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const useSupabase = isSupabaseProfileReadsBackendEnabled() && isAuthenticated;
  const convexProfile = useQuery(
    api.users.getUserByUsername,
    username && !useSupabase && !authLoading ? { username } : 'skip',
  );
  const [supabaseState, setSupabaseState] = useState<PublicUserProfileState>({ data: undefined, error: null });

  useEffect(() => {
    if (!useSupabase) {
      setSupabaseState({ data: undefined, error: null });
      return;
    }
    if (!username) {
      setSupabaseState({ data: null, error: null });
      return;
    }

    let active = true;
    setSupabaseState({ data: undefined, error: null });
    invokeSupabaseFunction<Record<string, any> | null>('app-user', {
      operation: 'getUserByUsername',
      payload: { username },
    }).then((data) => {
      if (active) setSupabaseState({ data, error: null });
    }).catch((error: unknown) => {
      if (active) {
        setSupabaseState({
          data: undefined,
          error: error instanceof Error ? error : new Error('Could not load this public profile.'),
        });
      }
    });
    return () => { active = false; };
  }, [useSupabase, username]);

  if (isSupabaseProfileReadsBackendEnabled() && authLoading) return { data: undefined, error: null };
  if (useSupabase) return supabaseState;
  return { data: convexProfile as Record<string, any> | null | undefined, error: null };
}
