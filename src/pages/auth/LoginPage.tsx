import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Loader2, Zap } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../lib/firebase';
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
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
      await readyUser.getIdToken(true);
      
      // Retry loop to ensure Convex receives the auth token
      let attempts = 0;
      while (attempts < 15) {
        try {
          await createUserRecord({ email: readyUser.email ?? undefined });
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

      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#5E43F3] flex-col justify-between p-12">
        {/* Animated orbs */}
        <div className="absolute top-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-[-60px] right-[-60px] w-[300px] h-[300px] rounded-full bg-[#3B28C2]/60 blur-2xl" />
        <div className="absolute top-1/2 left-1/3 w-[200px] h-[200px] rounded-full bg-white/4 blur-2xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="lalao-wordmark text-white text-2xl">lalao</span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <h1 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
              Your community,<br />
              <span className="text-white/70">closer than ever.</span>
            </h1>
            <p className="text-lg text-white/60 leading-relaxed max-w-xs">
              Connect with people around you, join rallies, discover local events and grow together.
            </p>
          </div>

          {/* Social proof row */}
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {[
                'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80',
              ].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="user"
                  className="w-9 h-9 rounded-full border-2 border-[#5E43F3] object-cover"
                />
              ))}
            </div>
            <div>
              <p className="text-white font-bold text-sm">12,400+ members</p>
              <p className="text-white/50 text-xs">across Delta State & beyond</p>
            </div>
          </div>
        </div>

        {/* Bottom tag */}
        <p className="relative z-10 text-white/30 text-xs">© 2026 Lalao · Udu, Delta State</p>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 sm:px-12 bg-white">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl bg-[#5E43F3] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="lalao-wordmark text-xl text-neutral-900">lalao</span>
        </div>

        <div className="w-full max-w-sm space-y-8">
          {/* Heading */}
          <div className="space-y-1.5">
            <h2 className="text-3xl font-black text-neutral-950 tracking-tight">Welcome back</h2>
            <p className="text-neutral-500 text-sm">Sign in to your Lalao account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="identifier" className="text-xs font-bold text-neutral-700 tracking-wide uppercase">
                Email or Phone
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@example.com or 080..."
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/30 focus:border-[#5E43F3] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-bold text-neutral-700 tracking-wide uppercase">
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
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/30 focus:border-[#5E43F3] transition-all pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
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
            <div className="flex-1 h-px bg-neutral-100" />
            <span className="text-xs text-neutral-400 font-medium">or</span>
            <div className="flex-1 h-px bg-neutral-100" />
          </div>

          {/* Social auth placeholders */}
          <div className="grid grid-cols-2 gap-3">
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
                      await createUserRecord({ email: credential.user.email ?? undefined });
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

                  navigate('/app');
                } catch (err: any) {
                  setError(err.message || 'Google sign-in failed.');
                }
              }}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-sm font-semibold text-neutral-800 transition-all cursor-pointer active:scale-[0.98]"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
              <span>Google</span>
            </button>
            <button type="button" className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-sm font-semibold text-neutral-800 transition-all cursor-pointer active:scale-[0.98]">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.167 6.839 9.49.5.09.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.091-.646.35-1.087.636-1.337-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              <span>GitHub</span>
            </button>
          </div>

          {/* Sign up link */}
          <p className="text-center text-sm text-neutral-500">
            Don't have an account?{' '}
            <Link to="/signup" className="font-bold text-[#5E43F3] hover:text-[#4E34E0] transition-colors">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
