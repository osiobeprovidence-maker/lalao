import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { invokeSupabaseFunction, isSupabaseDataBackendEnabled } from '../lib/supabase';
import { useOptionalConvexMutation } from '../context/OptionalConvexClientContext';

/** Route supported authenticated social mutations through configured Supabase. */
export function useSocialBackendMutation(
  mutationReference: any,
  operation: string,
  functionName = 'app-social',
  backendEnabled = isSupabaseDataBackendEnabled(),
) {
  const { isAuthenticated } = useAuth();
  const convexMutation = useOptionalConvexMutation(mutationReference);
  return useCallback(async (args: Record<string, unknown> = {}) => {
    if (!backendEnabled || !isAuthenticated) {
      if (!convexMutation) throw new Error('This operation requires the Convex backend.');
      return convexMutation(args);
    }
    return invokeSupabaseFunction<any>(functionName, { operation, payload: args });
  }, [backendEnabled, convexMutation, functionName, isAuthenticated, operation]);
}
