import { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../context/AuthContext';
import { invokeSupabaseFunction, isSupabaseDataBackendEnabled } from '../lib/supabase';

const RECENT_SEARCHES_UPDATED_EVENT = 'lalao:recent-searches-updated';

function notifyRecentSearchesUpdated(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(RECENT_SEARCHES_UPDATED_EVENT));
}

/** Route the complete personal-search lifecycle through configured Supabase, with Convex fallback. */
export function useRecentSearches(limit: number) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const supabaseEnabled = isSupabaseDataBackendEnabled();
  const convexSearches = useQuery(
    api.search.getRecentSearches,
    { limit },
    !supabaseEnabled && isAuthenticated ? {} : 'skip',
  );
  const convexRecord = useMutation(api.search.recordRecentSearch);
  const convexRemove = useMutation(api.search.removeRecentSearch);
  const convexClear = useMutation(api.search.clearAllRecentSearches);
  const [remote, setRemote] = useState<{ data: any[] | undefined; error: Error | null }>({ data: undefined, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!supabaseEnabled) return;
    if (authLoading) {
      setRemote({ data: undefined, error: null });
      return;
    }
    if (!isAuthenticated) {
      setRemote({ data: [], error: null });
      return;
    }
    let active = true;
    setRemote((state) => ({ ...state, data: undefined, error: null }));
    invokeSupabaseFunction<any[]>('app-search', { operation: 'getRecentSearches', payload: { limit } })
      .then((data) => { if (active) setRemote({ data: Array.isArray(data) ? data : [], error: null }); })
      .catch((error: unknown) => {
        if (active) setRemote({ data: undefined, error: error instanceof Error ? error : new Error('Could not load recent searches.') });
      });
    return () => { active = false; };
  }, [supabaseEnabled, isAuthenticated, authLoading, limit, attempt]);

  useEffect(() => {
    const refresh = () => setAttempt((value) => value + 1);
    window.addEventListener(RECENT_SEARCHES_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(RECENT_SEARCHES_UPDATED_EVENT, refresh);
  }, []);

  const recordSearch = useCallback(async (args: Record<string, unknown>) => {
    if (!supabaseEnabled) return convexRecord(args as any);
    if (!isAuthenticated) return null;
    const result = await invokeSupabaseFunction<string | null>('app-search', { operation: 'recordRecentSearch', payload: args });
    notifyRecentSearchesUpdated();
    return result;
  }, [supabaseEnabled, isAuthenticated, convexRecord]);

  const removeSearch = useCallback(async (args: { id: string }) => {
    if (!supabaseEnabled) return convexRemove(args as any);
    if (!isAuthenticated) throw new Error('Unauthenticated');
    const result = await invokeSupabaseFunction<{ success: boolean }>('app-search', { operation: 'removeRecentSearch', payload: args });
    notifyRecentSearchesUpdated();
    return result;
  }, [supabaseEnabled, isAuthenticated, convexRemove]);

  const clearAllSearches = useCallback(async (args: Record<string, never> = {}) => {
    if (!supabaseEnabled) return convexClear(args as any);
    if (!isAuthenticated) return { count: 0 };
    const result = await invokeSupabaseFunction<{ count: number }>('app-search', { operation: 'clearAllRecentSearches' });
    notifyRecentSearchesUpdated();
    return result;
  }, [supabaseEnabled, isAuthenticated, convexClear]);

  return {
    data: supabaseEnabled ? authLoading ? undefined : !isAuthenticated ? [] : remote.data : isAuthenticated ? convexSearches : [],
    error: supabaseEnabled ? remote.error : null,
    recordSearch,
    removeSearch,
    clearAllSearches,
  };
}
