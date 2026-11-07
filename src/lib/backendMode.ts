/** Supabase is authoritative whenever configured; overrides cannot route data around it. */
export function shouldUseSupabaseBackend(configured: boolean, override?: string): boolean {
  void override;
  return configured;
}

export type ApplicationBackendMode = 'supabase' | 'unavailable';

/** Choose the required application backend. Convex availability never selects the data backend. */
export function getApplicationBackendMode(
  supabaseConfigured: boolean,
  _convexUrl?: string,
): ApplicationBackendMode {
  return supabaseConfigured ? 'supabase' : 'unavailable';
}
