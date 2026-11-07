import React, { createContext, useCallback, useContext } from 'react';
import { ConvexReactClient } from 'convex/react';

type OptionalConvexClient = InstanceType<typeof ConvexReactClient> | null;

const OptionalConvexClientContext = createContext<OptionalConvexClient>(null);

export const OptionalConvexClientProvider: React.FC<{
  client: OptionalConvexClient;
  children: React.ReactNode;
}> = ({ client, children }) => (
  <OptionalConvexClientContext.Provider value={client}>{children}</OptionalConvexClientContext.Provider>
);

export function useOptionalConvexClient(): OptionalConvexClient {
  return useContext(OptionalConvexClientContext);
}

/** Calls Convex only when an actual client is supplied by the Convex root. */
export function useOptionalConvexMutation(mutationReference: any) {
  const client = useOptionalConvexClient();
  const mutate = useCallback((args: Record<string, unknown> = {}) => {
    if (!client) throw new Error('This operation requires the Convex backend.');
    return client.mutation(mutationReference, args as any);
  }, [client, mutationReference]);
  return client ? mutate : null;
}

/** Calls a Convex action only when an actual client is supplied by the Convex root. */
export function useOptionalConvexAction(actionReference: any) {
  const client = useOptionalConvexClient();
  const invoke = useCallback((args: Record<string, unknown> = {}) => {
    if (!client) throw new Error('This operation requires the Convex backend.');
    return client.action(actionReference, args as any);
  }, [client, actionReference]);
  return client ? invoke : null;
}
