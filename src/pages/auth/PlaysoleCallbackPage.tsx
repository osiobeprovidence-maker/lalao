import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { handlePlaysoleCallback } from '../../lib/playsoleAuth';
import { AppIcon } from '../../components/common/AppIcon';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

export const PlaysoleCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const createUserRecord = useMutation(api.users.createUserRecord);
  const exchangeAuthCode = useAction((api as any).playsole?.exchangeAuthCode || 'skip');

  const [statusMessage, setStatusMessage] = useState('Verifying credentials with Playsole One...');
  const [error, setError] = useState<string | null>(null);
  const executionStartedRef = useRef(false);

  useEffect(() => {
    // Avoid double execution in React StrictMode
    if (executionStartedRef.current) return;
    executionStartedRef.current = true;

    const processAuth = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');
      const errorDesc = searchParams.get('error_description');

      if (errorParam) {
        if (errorParam === 'access_denied') {
          setError('Authorization was cancelled.');
        } else {
          setError(errorDesc || `Authentication failed (${errorParam}).`);
        }
        return;
      }

      if (!code) {
        setError('Missing authorization code from Playsole One.');
        return;
      }

      try {
        setStatusMessage('Exchanging authorization code...');
        const exchangeFn = typeof exchangeAuthCode === 'function'
          ? (args: any) => exchangeAuthCode(args)
          : undefined;

        const session = await handlePlaysoleCallback(code, state || '', exchangeFn);

        setStatusMessage('Syncing your account with Lalao...');

        // Populate local state immediately for instant app responsiveness
        if (session.user) {
          try {
            const currentUser = {
              id: (session as any).userRecord?._id || session.user.sub,
              name: session.user.name || 'Playsole User',
              email: session.user.email || '',
              avatarUrl: session.user.picture || '',
              username: session.user.email ? session.user.email.split('@')[0] : 'user',
              role: 'user',
            };
            localStorage.setItem('lalao_current_user', JSON.stringify(currentUser));
          } catch {
            // ignore storage errors
          }
        }

        // Best-effort client mutation in case WebSocket identity has completed
        try {
          await createUserRecord({
            email: session.user.email ?? undefined,
            name: session.user.name ?? undefined,
            avatarUrl: session.user.picture ?? undefined,
          });
        } catch {
          // Ignore - the user record is already created and indexed on the server by exchangeAuthCode
        }

        setStatusMessage('Welcome! Redirecting to Lalao...');
        navigate('/app', { replace: true });
      } catch (err: any) {
        console.error('Playsole auth error:', err);
        setError(err.message || 'An unexpected error occurred during Playsole One authentication.');
      }
    };

    processAuth();
  }, [searchParams, createUserRecord, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-surface px-4 py-12">
      <div className="w-full max-w-md p-8 rounded-2xl bg-theme-base border border-theme-divider shadow-xl text-center space-y-6">
        {/* Brand header */}
        <div className="flex items-center justify-center gap-3">
          <AppIcon className="w-10 h-10 rounded-full overflow-hidden object-cover shadow-sm" fallbackClassName="text-[#5E43F3] fill-[#5E43F3]" />
          <div className="text-sm font-semibold text-theme-tertiary">×</div>
          <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center p-1.5 shadow-sm border border-white/10">
            <img src="https://one.playsole.xyz/logo.svg" alt="Playsole One" className="w-full h-full object-contain" onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = 'https://one.playsole.xyz/brand/logo-icon-256.png';
            }} />
          </div>
        </div>

        {error ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-theme-primary">Sign-In Failed</h2>
              <p className="text-sm text-theme-secondary mt-1 max-w-xs mx-auto">{error}</p>
            </div>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white text-sm font-semibold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex justify-center">
              <Loader2 className="w-8 h-8 text-[#5E43F3] animate-spin" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-theme-primary">Signing in with Playsole One</h2>
              <p className="text-sm text-theme-secondary mt-1">{statusMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
