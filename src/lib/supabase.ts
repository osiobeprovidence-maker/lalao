import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { shouldUseSupabaseBackend } from './backendMode';

export type SupabaseAccessTokenProvider = () => Promise<string | null>;
export type SupabasePublicConfig = { url: string; publishableKey: string };

/** Validate browser-safe Supabase settings without revealing their values. */
export function validateSupabasePublicConfig(url: string | undefined, publishableKey: string | undefined): boolean {
  if (!url?.trim() || !publishableKey?.trim()) return false;
  try {
    const parsedUrl = new URL(url.trim());
    if (parsedUrl.protocol !== 'https:' && parsedUrl.hostname !== 'localhost' && parsedUrl.hostname !== '127.0.0.1') return false;
    if (parsedUrl.pathname !== '/' || parsedUrl.username || parsedUrl.password || parsedUrl.search || parsedUrl.hash) return false;
    if (parsedUrl.hostname === 'your-project.supabase.co' || parsedUrl.hostname.includes('your-project')) return false;
  } catch {
    return false;
  }

  const key = publishableKey.trim();
  if (/^(your[-_]|replace[-_]|placeholder)/i.test(key) || key.startsWith('sb_secret_')) return false;
  if (key.startsWith('sb_publishable_')) return key.length > 'sb_publishable_'.length;
  // Legacy Supabase anon keys are JWTs. Explicitly reject a service-role key
  // accidentally placed in a browser variable without logging or returning it.
  const segments = key.split('.');
  if (segments.length === 3) {
    try {
      const payload = JSON.parse(atob(segments[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload?.role === 'anon';
    } catch {
      return false;
    }
  }
  return false;
}

const viteEnv: Record<string, string | undefined> =
  ((import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {}) as Record<string, string | undefined>;

let accessTokenProvider: SupabaseAccessTokenProvider = async () => null;
let client: SupabaseClient | null = null;
let clientConfigKey: string | null = null;
export const CURRENT_USER_PROFILE_UPDATED_EVENT = 'lalao:current-user-profile-updated';

export function notifyCurrentUserProfileUpdated(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CURRENT_USER_PROFILE_UPDATED_EVENT));
}

/** Provide the existing Firebase/Playsole JWT to Supabase without creating a second login session. */
export function setSupabaseAccessTokenProvider(provider: SupabaseAccessTokenProvider | null): void {
  accessTokenProvider = provider ?? (async () => null);
}

export function createLalaoSupabaseClient(
  config: SupabasePublicConfig,
  tokenProvider: SupabaseAccessTokenProvider,
): SupabaseClient {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(config.url);
  } catch {
    throw new Error('A valid Supabase URL is required.');
  }
  if (parsedUrl.protocol !== 'https:' && parsedUrl.hostname !== 'localhost' && parsedUrl.hostname !== '127.0.0.1') {
    throw new Error('Supabase URL must use HTTPS outside local development.');
  }
  if (!validateSupabasePublicConfig(config.url, config.publishableKey)) {
    throw new Error('A valid Supabase URL and public publishable key are required.');
  }

  return createClient(config.url, config.publishableKey, {
    accessToken: tokenProvider,
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function isSupabaseConfigured(): boolean {
  return validateSupabasePublicConfig(viteEnv.VITE_SUPABASE_URL, viteEnv.VITE_SUPABASE_PUBLISHABLE_KEY);
}

/** Return a validated Convex endpoint for isolated features, without enabling the legacy app. */
export function getConvexDeploymentUrl(): string | null {
  if (!viteEnv.VITE_CONVEX_URL?.trim()) return null;
  try {
    const url = new URL(viteEnv.VITE_CONVEX_URL.trim());
    const isValid = url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname));
    return isValid ? url.toString() : null;
  } catch {
    return null;
  }
}

/** The complete legacy application remains opt-in, separate from isolated Convex features. */
export function hasConvexDeployment(): boolean {
  return viteEnv.VITE_ENABLE_LEGACY_CONVEX_FEATURES === 'true' && getConvexDeploymentUrl() !== null;
}

export function isSupabaseDataBackendEnabled(configured = isSupabaseConfigured()): boolean {
  return shouldUseSupabaseBackend(configured, viteEnv.VITE_CURRENT_USER_BACKEND);
}

export function isSupabaseProfileReadsBackendEnabled(): boolean {
  return shouldUseSupabaseBackend(isSupabaseConfigured(), viteEnv.VITE_PROFILE_READS_BACKEND);
}

export function isSupabasePeopleDiscoveryBackendEnabled(): boolean {
  return shouldUseSupabaseBackend(isSupabaseConfigured(), viteEnv.VITE_PEOPLE_DISCOVERY_BACKEND);
}

export function isSupabaseNotificationsBackendEnabled(): boolean {
  return shouldUseSupabaseBackend(isSupabaseConfigured(), viteEnv.VITE_NOTIFICATIONS_BACKEND);
}

export function isSupabaseSocialInteractionsBackendEnabled(): boolean {
  return shouldUseSupabaseBackend(isSupabaseConfigured(), viteEnv.VITE_SOCIAL_INTERACTIONS_BACKEND);
}

export function isSupabaseHomeFeedBackendEnabled(): boolean {
  return shouldUseSupabaseBackend(isSupabaseConfigured(), viteEnv.VITE_HOME_FEED_BACKEND);
}

function getClient(): SupabaseClient {
  const url = viteEnv.VITE_SUPABASE_URL;
  const publishableKey = viteEnv.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!validateSupabasePublicConfig(url, publishableKey)) {
    throw new Error('Supabase configuration is missing or invalid. Configure a valid project URL and public publishable key.');
  }

  const configKey = `${url}\n${publishableKey}`;
  if (!client || clientConfigKey !== configKey) {
    client = createLalaoSupabaseClient({ url, publishableKey }, () => accessTokenProvider());
    clientConfigKey = configKey;
  }
  return client;
}

/** Invoke an authenticated Edge Function. Never accepts or sends a service-role key. */
export async function invokeSupabaseFunction<T>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<T> {
  if (!/^[a-z][a-z0-9-]*$/.test(functionName)) throw new Error('Invalid Supabase function name.');
  const { data, error } = await getClient().functions.invoke<T>(functionName, { body });
  if (error) {
    // Edge functions may return safe user-facing JSON errors. Do not log the SDK error or request headers.
    let message = 'Supabase request failed. Please try again.';
    if ('context' in error && error.context instanceof Response) {
      try {
        const payload = await error.context.clone().json();
        if (typeof payload?.error === 'string') message = payload.error;
      } catch {
        // Keep the generic message when the server response is not safe JSON.
      }
    }
    throw new Error(message);
  }
  return data as T;
}

/** Provision the signed-in profile in the selected backend without allowing client-supplied identity claims. */
export async function ensureCurrentUserRecord(
  profileHints: { email?: string; name?: string; avatarUrl?: string },
): Promise<string> {
  // The Edge Function ignores profileHints and derives identity fields from
  // the verified provider JWT. Keep this argument for existing call-site compatibility.
  void profileHints;
  const userId = await invokeSupabaseFunction<string>('app-user', { operation: 'createUserRecord' });
  notifyCurrentUserProfileUpdated();
  return userId;
}
