/**
 * Firebase environment configuration resolver.
 *
 * Production keeps using the existing `uselalaoapp` Firebase project by
 * setting `VITE_FIREBASE_USE_PROD=true` in the Production Vercel scope.
 * Preview requires its own Firebase credentials; if they are missing,
 * Firebase is explicitly disabled and never falls back to Production.
 *
 * Resolution order (no silent Production fallback):
 *   1. `VITE_FIREBASE_USE_PROD=true`                -> Production config
 *   2. `VITE_FIREBASE_API_KEY` + `VITE_FIREBASE_AUTH_DOMAIN` +
 *      `VITE_FIREBASE_PROJECT_ID`                   -> Preview config
 *   3. otherwise                                     -> null (Firebase disabled)
 */
export type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

const PROD_CONFIG: FirebaseClientConfig = {
  apiKey: 'AIzaSyBv_Cf6i4RvL2pikdVhGb8cHUDKYpjjSRA',
  authDomain: 'uselalaoapp.firebaseapp.com',
  projectId: 'uselalaoapp',
  storageBucket: 'uselalaoapp.appspot.com',
  messagingSenderId: '853680775586',
  appId: '1:853680775586:web:1d3beaf2dd0c8dec35d2fb',
};

function readEnv(key: string): string | undefined {
  const value = import.meta.env[key as any] as string | undefined;
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

export function buildFirebaseConfig(): FirebaseClientConfig | null {
  if (readEnv('VITE_FIREBASE_USE_PROD') === 'true') {
    return { ...PROD_CONFIG };
  }

  const apiKey = readEnv('VITE_FIREBASE_API_KEY');
  const authDomain = readEnv('VITE_FIREBASE_AUTH_DOMAIN');
  const projectId = readEnv('VITE_FIREBASE_PROJECT_ID');
  if (apiKey && authDomain && projectId) {
    const storageBucket =
      readEnv('VITE_FIREBASE_STORAGE_BUCKET') ?? `${projectId}.appspot.com`;
    const messagingSenderId = readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') ?? '';
    const appId = readEnv('VITE_FIREBASE_APP_ID') ?? '';
    return { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId };
  }

  return null;
}

/** True only when Firebase is configured (prod flag set or preview vars complete). */
export function isFirebaseEnabled(): boolean {
  return buildFirebaseConfig() !== null;
}
