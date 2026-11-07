import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { invokeSupabaseFunction, isSupabaseDataBackendEnabled, notifyCurrentUserProfileUpdated } from '../lib/supabase';
import { useOptionalConvexMutation } from '../context/OptionalConvexClientContext';

/** Route supported signed-in user mutations through configured Supabase. */
export function useUserBackendMutation(
  mutationReference: any,
  operation: string,
  functionName = 'app-user',
) {
  const { isAuthenticated } = useAuth();
  const convexMutation = useOptionalConvexMutation(mutationReference);
  return useCallback(async (args: Record<string, unknown> = {}) => {
    if (!isSupabaseDataBackendEnabled()) {
      if (!convexMutation) throw new Error('This operation requires the Convex backend.');
      return convexMutation(args);
    }
    if (!isAuthenticated) throw new Error('Sign in before changing your Lalao profile.');
    const result = await invokeSupabaseFunction<any>(functionName, { operation, payload: args });
    notifyCurrentUserProfileUpdated();
    return result;
  }, [convexMutation, functionName, isAuthenticated, operation]);
}
