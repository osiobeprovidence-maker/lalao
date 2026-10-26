import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAction } from 'convex/react';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../convex/_generated/api';
import { handlePlaysoleCallback, initiatePlaysoleLogin, PLAYSOLE_CONFIG, savePlaysoleSession } from '../../lib/playsoleAuth';
import { AppIcon } from '../../components/common/AppIcon';
import { Loader2, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';

export const PlaysoleCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const exchangeAuthCode = useAction((api as any).playsole?.exchangeAuthCode || 'skip');

  const [statusMessage, setStatusMessage] = useState('Verifying credentials with Playsole One...');
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isLinkFlow, setIsLinkFlow] = useState(false);
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
      const linkChallenge = sessionStorage.getItem(PLAYSOLE_CONFIG.linkChallengeKey);
      setIsLinkFlow(Boolean(linkChallenge));

      if (errorParam) {
        if (linkChallenge) sessionStorage.removeItem(PLAYSOLE_CONFIG.linkChallengeKey);
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

        sessionStorage.removeItem(PLAYSOLE_CONFIG.linkChallengeKey);
        const session = await handlePlaysoleCallback(code, state || '', exchangeFn, {
          persist: false,
          intent: linkChallenge ? 'link' : 'login',
        });
        if (!linkChallenge && session.loginStatus === 'link_required') {
          setError('A Lalao account may already use this sign-in email. Sign in to that account first, then link Playsole from Security & Authentication.');
          return;
        }
        if (!linkChallenge && session.loginStatus === 'email_verification_required') {
          setError('Verify your email with Playsole One before using it to sign in to Lalao.');
          return;
        }
        const convexUrl = import.meta.env.VITE_CONVEX_URL;
        if (!convexUrl) throw new Error('Lalao authentication is temporarily unavailable. Please try again later.');

        const client = new ConvexHttpClient(convexUrl);
        client.setAuth(session.idToken);

        // The single-use challenge was created under the existing account's
        // authenticated session. This mutation separately validates Playsole.
        if (linkChallenge) {
          setStatusMessage('Verifying the additional sign-in method...');
          await client.mutation(api.playsole.completeAuthLink, { challenge: linkChallenge });
          setStatusMessage('Sign-in method linked. Returning to Lalao...');
          setIsComplete(true);
          return;
        }

        setStatusMessage('Checking your Lalao account...');
        const result = await client.mutation(api.playsole.resolvePlaysoleLogin, {});
        if (result.status === 'link_required') {
          setError('A Lalao account may already use this sign-in email. Sign in to that account first, then link Playsole from Security & Authentication.');
          return;
        }
        if (result.status === 'email_verification_required') {
          setError('Verify your email with Playsole One before using it to sign in to Lalao.');
          return;
        }

        savePlaysoleSession(session);
        setStatusMessage('Welcome! Redirecting to Lalao...');
        navigate('/app', { replace: true });
      } catch (err: any) {
        // Keep provider tokens and authentication internals out of browser logs.
        setError(err?.message || 'An unexpected error occurred during Playsole One authentication.');
      }
    };

    processAuth();
  }, [searchParams, navigate]);

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
            <div className="pt-2 space-y-2.5">
              {isLinkFlow && (
                <button type="button" onClick={() => navigate('/app', { replace: true })} className="w-full py-2.5 rounded-xl bg-[#5E43F3] text-white text-sm font-semibold">
                  Return to account settings
                </button>
              )}
              <button
                type="button"
                onClick={() => initiatePlaysoleLogin()}
                className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-black/10 dark:border-white/15 bg-black text-white hover:bg-neutral-900 text-sm font-semibold transition-all cursor-pointer active:scale-[0.98] shadow-md"
              >
                <img src="https://one.playsole.xyz/brand/playsole-logo.png" alt="Playsole" className="w-4 h-4 object-contain" />
                <span>Re-authorize with Playsole</span>
              </button>

              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-theme-divider hover:bg-theme-surface-hover text-theme-secondary text-sm font-medium transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </div>
        ) : isComplete ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-theme-primary">Sign-in method linked</h2>
              <p className="text-sm text-theme-secondary mt-1">Playsole One can now access this Lalao account.</p>
            </div>
            <button type="button" onClick={() => navigate('/app', { replace: true })} className="w-full py-3 rounded-xl bg-[#5E43F3] text-white text-sm font-semibold">
              Return to Lalao
            </button>
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
