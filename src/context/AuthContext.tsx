import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  getPlaysoleSession,
  refreshPlaysoleTokenIfNeeded,
  logoutPlaysole,
  PlaysoleSession,
} from '../lib/playsoleAuth';

export interface UnifiedAuthUser {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  provider: 'firebase' | 'playsole';
  getIdToken?: (forceRefresh?: boolean) => Promise<string | null>;
  [key: string]: any;
}

interface AuthContextType {
  user: ((User | UnifiedAuthUser) & { id?: string; role?: string; [key: string]: any }) | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPlaysoleAuth: boolean;
  fetchAccessToken: (args: { forceRefreshToken: boolean }) => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isPlaysoleAuth: false,
  fetchAccessToken: async () => null,
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [playsoleSession, setPlaysoleSession] = useState<PlaysoleSession | null>(() => getPlaysoleSession());
  const [isLoading, setIsLoading] = useState(true);

  // Sync Playsole session state on local storage / custom events
  useEffect(() => {
    const handlePlaysoleChange = () => {
      setPlaysoleSession(getPlaysoleSession());
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

  // Determine active user (Firebase prioritized if present, otherwise Playsole)
  const isPlaysole = !firebaseUser && !!playsoleSession;
  const unifiedUser: User | UnifiedAuthUser | null = firebaseUser
    ? firebaseUser
    : playsoleSession
    ? {
        uid: playsoleSession.user.sub,
        email: playsoleSession.user.email ?? null,
        displayName: playsoleSession.user.name ?? null,
        photoURL: playsoleSession.user.picture ?? null,
        provider: 'playsole',
        getIdToken: async () => refreshPlaysoleTokenIfNeeded(),
      }
    : null;

  const fetchAccessToken = async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
    // 1. If Firebase user is active
    if (firebaseUser ?? auth.currentUser) {
      try {
        const u = firebaseUser ?? auth.currentUser;
        return await u!.getIdToken(forceRefreshToken);
      } catch (error) {
        console.warn('Error fetching Firebase token:', error);
      }
    }

    // 2. If Playsole One session is active
    if (playsoleSession) {
      try {
        const token = await refreshPlaysoleTokenIfNeeded();
        return token;
      } catch (error) {
        console.warn('Error fetching Playsole token:', error);
      }
    }

    return null;
  };

  const logout = async () => {
    try {
      const { getCurrentWebPushSubscription } = await import('../lib/push');
      const sub = await getCurrentWebPushSubscription();
      if (sub) {
        const convexUrl = import.meta.env.VITE_CONVEX_URL;
        if (convexUrl) {
          // Direct fetch to Convex HTTP mutation or client action
          const { ConvexHttpClient } = await import('convex/browser');
          const { api } = await import('../../convex/_generated/api');
          const client = new ConvexHttpClient(convexUrl);
          await client.mutation(api.push.deactivateWebPushSubscription, {
            endpoint: sub.endpoint,
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
    } catch (e) {
      console.warn('Playsole logout error:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: unifiedUser,
        isLoading,
        isAuthenticated: !!unifiedUser,
        isPlaysoleAuth: isPlaysole,
        fetchAccessToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
