import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  getPlaysoleSession,
  refreshPlaysoleTokenIfNeeded,
  logoutPlaysole,
  PlaysoleSession,
} from '../lib/playsoleAuth';
import {
  invokeSupabaseFunction,
  isSupabaseNotificationsBackendEnabled,
  setSupabaseAccessTokenProvider,
} from '../lib/supabase';
import { getTokenForSelectedIdentity } from '../lib/selectedIdentityToken';

export interface UnifiedAuthUser {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  provider: 'firebase' | 'playsole';
  lastSignInProvider?: 'firebase' | 'playsole';
  getIdToken?: (forceRefresh?: boolean) => Promise<string | null>;
  [key: string]: any;
}

interface AuthContextType {
  user: ((User | UnifiedAuthUser) & { id?: string; role?: string; [key: string]: any }) | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPlaysoleAuth: boolean;
  authError: string | null;
  fetchAccessToken: (args: { forceRefreshToken: boolean }) => Promise<string | null>;
  selectFirebaseIdentity: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isPlaysoleAuth: false,
  authError: null,
  fetchAccessToken: async () => null,
  selectFirebaseIdentity: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [playsoleSession, setPlaysoleSession] = useState<PlaysoleSession | null>(() => getPlaysoleSession());
  const [playsoleAuthError, setPlaysoleAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync Playsole session state on local storage / custom events
  useEffect(() => {
    const handlePlaysoleChange = () => {
      const nextSession = getPlaysoleSession();
      setPlaysoleSession(nextSession);
      // A newly established Playsole session clears a failed Playsole identity
      // lock. Firebase cannot silently take over.
      if (nextSession) setPlaysoleAuthError(null);
    };

    window.addEventListener('playsole_auth_changed', handlePlaysoleChange);
    window.addEventListener('storage', handlePlaysoleChange);

    return () => {
      window.removeEventListener('playsole_auth_changed', handlePlaysoleChange);
      window.removeEventListener('storage', handlePlaysoleChange);
    };
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Once Playsole is selected, refresh failure keeps that identity selected
  // until Playsole reauthentication or an explicit logout.
  const playsoleSelected = !!playsoleSession || !!playsoleAuthError;
  const unifiedUser: User | UnifiedAuthUser | null = playsoleSelected
    ? (playsoleSession && !playsoleAuthError ? {
        uid: playsoleSession.user.sub,
        email: playsoleSession.user.email ?? null,
        displayName: playsoleSession.user.name ?? null,
        photoURL: playsoleSession.user.picture ?? null,
        provider: 'playsole',
        lastSignInProvider: 'playsole',
        getIdToken: async () => {
          try {
            const token = await refreshPlaysoleTokenIfNeeded();
            if (!token) setPlaysoleAuthError('Your Playsole session expired or could not be refreshed. Sign in with Playsole again.');
            return token;
          } catch {
            setPlaysoleAuthError('Your Playsole session could not be refreshed. Sign in with Playsole again.');
            return null;
          }
        },
      } : null)
    : firebaseUser;

  const fetchAccessToken = useCallback(async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
    // A selected Playsole identity must never fall through to Firebase.
    return getTokenForSelectedIdentity({
      playsoleSelected,
      getPlaysoleToken: async () => {
        if (playsoleAuthError) return null;
        try {
          const token = await refreshPlaysoleTokenIfNeeded();
          if (token) return token;
          setPlaysoleAuthError('Your Playsole session expired or could not be refreshed. Sign in with Playsole again.');
          return null;
        } catch {
          console.warn('Error fetching Playsole token. Reauthentication is required.');
          setPlaysoleAuthError('Your Playsole session could not be refreshed. Sign in with Playsole again.');
          return null;
        }
      },
      getFirebaseToken: async () => {
        if (!(firebaseUser ?? auth.currentUser)) return null;
        try {
          const u = firebaseUser ?? auth.currentUser;
          return await u!.getIdToken(forceRefreshToken);
        } catch (error) {
          console.warn('Error fetching Firebase token:', error);
          return null;
        }
      },
    });
  }, [playsoleSelected, playsoleAuthError, playsoleSession, firebaseUser]);

  useEffect(() => {
    setSupabaseAccessTokenProvider(async () => fetchAccessToken({ forceRefreshToken: false }));
    return () => setSupabaseAccessTokenProvider(null);
  }, [fetchAccessToken]);

  const selectFirebaseIdentity = useCallback(async () => {
    // This is called only from an explicit Firebase sign-in action. It permits
    // an intentional provider switch without ever substituting tokens silently.
    if (playsoleSession || playsoleAuthError) await logoutPlaysole();
    setPlaysoleSession(null);
    setPlaysoleAuthError(null);
  }, [playsoleSession, playsoleAuthError]);

  const logout = useCallback(async () => {
    try {
      const { getCurrentWebPushSubscription } = await import('../lib/push');
      const sub = await getCurrentWebPushSubscription();
      if (sub) {
        if (isSupabaseNotificationsBackendEnabled() && (firebaseUser || playsoleSession)) {
          await invokeSupabaseFunction<boolean>('app-social', {
            operation: 'deactivateWebPushSubscription',
            payload: { endpoint: sub.endpoint },
          });
        }
      }
    } catch (e) {
      console.warn('[AuthContext] Failed to deactivate push subscription on logout:', e);
    }

    try {
      if (firebaseUser) {
        await signOut(auth);
      }
    } catch (e) {
      console.warn('Firebase signout error:', e);
    }

    try {
      await logoutPlaysole();
      setPlaysoleSession(null);
      setPlaysoleAuthError(null);
    } catch (e) {
      console.warn('Playsole logout error:', e);
    }

    try {
      const { clearOneSignalUser } = await import('../lib/onesignal');
      await clearOneSignalUser();
    } catch (e) {
      console.warn('[AuthContext] OneSignal logout error:', e);
    }
  }, [firebaseUser, playsoleSession]);

  const contextValue = useMemo(() => ({
    user: unifiedUser,
    isLoading,
    isAuthenticated: !!unifiedUser,
    isPlaysoleAuth: playsoleSelected,
    authError: playsoleAuthError,
    fetchAccessToken,
    selectFirebaseIdentity,
    logout,
  }), [unifiedUser, isLoading, playsoleSelected, playsoleAuthError, fetchAccessToken, selectFirebaseIdentity, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
