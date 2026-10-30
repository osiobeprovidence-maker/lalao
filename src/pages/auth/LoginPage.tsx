import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { AppIcon } from '../../components/common/AppIcon';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { initiatePlaysoleLogin } from '../../lib/playsoleAuth';

const POST_LOGIN_REDIRECT_KEY = 'lalao_post_login_redirect';

function safeRedirect(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/app';
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = safeRedirect(searchParams.get('redirect'));
  const signupPath = redirectTo !== '/app' ? `/signup?redirect=${encodeURIComponent(redirectTo)}` : '/signup';
  const createUserRecord = useMutation(api.users.createUserRecord);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, identifier.trim(), password);
      const readyUser = userCredential.user ?? auth.currentUser;
      if (!readyUser) {
        throw new Error('Authentication is still loading. Please try again.');
      }
      await readyUser.getIdToken(true);
      
      // Retry loop to ensure Convex receives the auth token
      let attempts = 0;
      while (attempts < 15) {
        try {
          await createUserRecord({ 
            email: readyUser.email ?? undefined,
            name: readyUser.displayName ?? undefined,
            avatarUrl: readyUser.photoURL ?? undefined,
          });
          break;
        } catch (e: any) {
          if (e.message?.includes("Not authenticated")) {
            await new Promise(r => setTimeout(r, 500));
            attempts++;
          } else {
            throw e;
          }
        }
      }
      if (attempts >= 15) throw new Error('Server authentication timeout.');

      navigate(redirectTo);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-theme-surface">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-b from-[#1148eb] via-[#0f45eb] to-[#0c2bd7] flex-col justify-between p-10 xl:p-14">
        {/* 3D Community Hero Artwork Layer */}
        <div className="absolute top-0 inset-x-0 pointer-events-none select-none z-10 flex flex-col items-center">
          <img 
            src="/login-hero-artwork-fade.webp" 
            alt="Lalao 3D Community" 
            className="w-full max-w-[660px] h-auto object-contain"
          />
        </div>

        {/* Logo */}
        <div className="relative z-20 flex items-center gap-2.5">
          <AppIcon className="w-8 h-8 rounded-full overflow-hidden object-cover shrink-0 shadow-md" fallbackClassName="text-white fill-white" />
          <span className="lalao-wordmark text-white text-2xl tracking-wide drop-shadow-sm">lalao</span>
        </div>

        {/* Hero copy */}
        <div className="relative z-20 space-y-6 max-w-lg mt-auto pb-4">
          <div className="space-y-3">
            <h1 className="text-4xl xl:text-[46px] font-black text-white leading-[1.12] tracking-tight drop-shadow-md">
              Your community,<br />
              <span className="text-white drop-shadow-md">closer than ever.</span>
            </h1>
            <p className="text-base xl:text-lg text-white/85 leading-relaxed drop-shadow-sm max-w-md">
              Connect with people around you, join rallies, discover local events and grow together.
            </p>
          </div>

          {/* Social proof row */}
          <div className="flex items-center gap-3.5 pt-1">
            <div className="flex -space-x-2">
              {[
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80',
              ].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="user"
                  className="w-9 h-9 rounded-full border-2 border-white/60 object-cover shadow-sm"
                />
              ))}
              <div className="w-9 h-9 rounded-full border-2 border-white/60 bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xs font-bold shadow-sm">
                +
              </div>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight drop-shadow-sm">12,400+ members</p>
              <p className="text-white/75 text-xs leading-tight">across Delta State &amp; beyond</p>
            </div>
          </div>
        </div>

        {/* Bottom tag */}
        <p className="relative z-20 text-white/50 text-xs">© 2026 Lalao · Udu, Delta State</p>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 sm:px-12 bg-theme-surface">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          <AppIcon className="w-8 h-8 rounded-full overflow-hidden object-cover shrink-0" fallbackClassName="text-[#5E43F3] fill-[#5E43F3]" />
          <span className="lalao-wordmark text-2xl text-theme-primary">lalao</span>
        </div>

        <div className="w-full max-w-sm space-y-8">
          {/* Heading */}
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-black text-theme-primary tracking-tight">Welcome back</h2>
            <p className="text-theme-tertiary text-sm">Sign in to your Lalao account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="identifier" className="text-xs font-bold text-theme-secondary tracking-wide uppercase">
                Email or Phone
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@example.com or 080..."
                className="w-full px-4 py-3 rounded-xl border border-theme-divider bg-theme-base text-sm text-theme-primary placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/30 focus:border-[#5E43F3] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-bold text-theme-secondary tracking-wide uppercase">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-[#5E43F3] hover:text-[#4E34E0] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-theme-divider bg-theme-base text-sm text-theme-primary placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/30 focus:border-[#5E43F3] transition-all pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-tertiary hover:text-theme-secondary transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 shadow-lg shadow-[#5E43F3]/25 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-theme-surface-hover" />
            <span className="text-xs text-theme-tertiary font-medium">or</span>
            <div className="flex-1 h-px bg-theme-surface-hover" />
          </div>

          {/* Social auth options */}
          <div className="space-y-2.5">
            <button 
              type="button"
              onClick={() => {
                try {
                  if (redirectTo !== '/app') {
                    sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, redirectTo);
                  } else {
                    sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
                  }
                } catch {
                  // sessionStorage may be unavailable in privacy-restricted browsers.
                }
                initiatePlaysoleLogin();
              }}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-black/10 dark:border-white/15 bg-black text-white hover:bg-neutral-900 text-sm font-semibold transition-all cursor-pointer active:scale-[0.98] shadow-sm"
            >
              <img 
                src="https://one.playsole.xyz/brand/playsole-logo.png" 
                alt="Playsole" 
                className="w-4 h-4 object-contain" 
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://one.playsole.xyz/brand/playsole-logo.png';
                }} 
              />
              <span>Sign in with Playsole</span>
            </button>

            <button 
              type="button"
              onClick={async () => {
                try {
                  const provider = new GoogleAuthProvider();
                  const credential = await signInWithPopup(auth, provider);
                  await credential.user.getIdToken(true);
                  
                  let attempts = 0;
                  while (attempts < 15) {
                    try {
                      await createUserRecord({ 
                        email: credential.user.email ?? undefined,
                        name: credential.user.displayName ?? undefined,
                        avatarUrl: credential.user.photoURL ?? undefined,
                      });
                      break;
                    } catch (e: any) {
                      if (e.message?.includes("Not authenticated")) {
                        await new Promise(r => setTimeout(r, 500));
                        attempts++;
                      } else {
                        throw e;
                      }
                    }
                  }
                  if (attempts >= 15) throw new Error('Server authentication timeout.');

                  navigate(redirectTo);
                } catch (err: any) {
                  setError(err.message || 'Google sign-in failed.');
                }
              }}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-theme-divider bg-theme-surface hover:bg-theme-base text-sm font-semibold text-theme-primary transition-all cursor-pointer active:scale-[0.98]"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
              <span>Sign in with Google</span>
            </button>
          </div>

          {/* Sign up link */}
          <p className="text-center text-sm text-theme-tertiary">
            Don't have an account?{' '}
            <Link to={signupPath} className="font-bold text-[#5E43F3] hover:text-[#4E34E0] transition-colors">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
