import { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { useAuth } from '../context/AuthContext';
import { invokeSupabaseFunction, isSupabaseDataBackendEnabled } from '../lib/supabase';

type QueryState<T> = { key: string; data: T | undefined; error: Error | null };

/** Route supported authenticated social reads through Supabase when configured. */
export function useSocialBackendQuery<T>(
  queryReference: any,
  operation: string,
  args: Record<string, unknown> | 'skip' = {},
  refreshIntervalMs = 0,
  backendEnabled = isSupabaseDataBackendEnabled(),
): { data: T | undefined; error: Error | null } {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const useSupabase = backendEnabled && isAuthenticated;
  const payloadKey = JSON.stringify(args === 'skip' ? null : args);
  const requestKey = `${user?.uid ?? ''}:${operation}:${payloadKey}`;
  const convexData = useQuery(
    queryReference,
    useSupabase || args === 'skip' ? 'skip' : args,
  );
  const [state, setState] = useState<QueryState<T>>({
    key: '',
    data: undefined,
    error: null,
  });

  useEffect(() => {
    if (!useSupabase || args === 'skip' || authLoading || !isAuthenticated) {
      setState({ key: requestKey, data: undefined, error: null });
      return;
    }

    let active = true;
    let pending = false;
    let loaded = false;
    const payload = JSON.parse(payloadKey) as Record<string, unknown> | null;
    setState({ key: requestKey, data: undefined, error: null });
    const load = async () => {
      if (pending) return;
      pending = true;
      try {
        const data = await invokeSupabaseFunction<T>('app-social', {
          operation,
          payload: payload ?? {},
        });
        if (active) setState({ key: requestKey, data, error: null });
        loaded = true;
      } catch (error: unknown) {
        if (active) {
          const message = error instanceof Error ? error : new Error('Could not load social data.');
          setState((previous) => ({
            key: requestKey,
            data: loaded && previous.key === requestKey ? previous.data : undefined,
            error: message,
          }));
        }
      } finally {
        pending = false;
      }
    };
    void load();
    const interval = refreshIntervalMs > 0 ? setInterval(() => { void load(); }, refreshIntervalMs) : null;

    return () => {
      active = false;
      if (interval !== null) clearInterval(interval);
    };
  }, [useSupabase, args === 'skip', authLoading, isAuthenticated, user?.uid, operation, payloadKey, requestKey, refreshIntervalMs]);

  if (!useSupabase) return { data: args === 'skip' ? undefined : convexData, error: null };
  return state.key === requestKey
    ? { data: state.data, error: state.error }
    : { data: undefined, error: null };
}
