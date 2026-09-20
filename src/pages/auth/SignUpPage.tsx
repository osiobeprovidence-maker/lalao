import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, MapPin, Users, Calendar, Chrome, Loader2 } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const createUserRecord = useMutation(api.users.createUserRecord);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter a valid email and password.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const readyUser = userCredential.user ?? auth.currentUser;
      if (!readyUser) {
        throw new Error('Authentication is still loading. Please try again.');
      }
      await readyUser.getIdToken(true);
      
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

      navigate('/onboarding/name');
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Panel: Brand & Benefits */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 bg-[#F8F7FF] flex-col p-12 xl:p-16 justify-between border-r border-indigo-50">
        
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2 mb-16">
            <div className="w-10 h-10 rounded-xl bg-[#3823A4] flex items-center justify-center">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="lalao-wordmark text-2xl text-neutral-900">lalao</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black text-neutral-950 tracking-tight leading-tight mb-4">
            Join your community.
          </h1>
          <p className="text-lg text-neutral-600 mb-12 max-w-md">
            Create your account and discover people, places, events and opportunities around you.
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100/80 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-[#3823A4]" />
              </div>
              <span className="text-neutral-700 font-medium">Discover what's happening around you</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100/80 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-[#3823A4]" />
              </div>
              <span className="text-neutral-700 font-medium">Connect with your community</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100/80 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-[#3823A4]" />
              </div>
              <span className="text-neutral-700 font-medium">Find local events, businesses and activities</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-neutral-400">© 2026 Lalao Inc.</p>
      </div>

      {/* Right Panel: Registration Form */}
      <div className="flex-1 flex flex-col px-6 py-8 sm:px-12 lg:px-16 xl:px-24 justify-center items-center relative">
        
        {/* Mobile Header */}
        <div className="lg:hidden w-full max-w-sm mb-10 flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[#3823A4] flex items-center justify-center">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="lalao-wordmark text-2xl text-neutral-900">lalao</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-3xl font-black text-neutral-950 tracking-tight mb-2">Create your account</h2>
            <p className="text-neutral-500 text-sm mb-8">Join Lalao and start connecting with your community.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 text-red-600 text-sm font-semibold border border-red-100">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 tracking-wider uppercase">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-neutral-200 bg-white text-base text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3823A4] focus:ring-4 focus:ring-[#3823A4]/10 transition-all"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 tracking-wider uppercase">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-neutral-200 bg-white text-base text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3823A4] focus:ring-4 focus:ring-[#3823A4]/10 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-xl bg-[#3823A4] text-white font-black text-base flex items-center justify-center gap-3 transition-transform active:scale-[0.98] shadow-lg shadow-[#3823A4]/25 hover:bg-[#25167A] cursor-pointer disabled:opacity-70 mt-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-neutral-200" />
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-neutral-200" />
            </div>

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

                  navigate('/onboarding/name');
                } catch (err: any) {
                  setError(err.message || 'Google sign-up failed.');
                }
              }}
              className="w-full py-3.5 rounded-xl border-2 border-neutral-200 bg-white text-neutral-700 font-bold text-base flex items-center justify-center gap-3 hover:bg-neutral-50 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Chrome className="w-5 h-5" />
              <span>Continue with Google</span>
            </button>

            <p className="text-center text-sm font-semibold text-neutral-500 mt-8">
              Already have an account?{' '}
              <Link to="/login" className="text-[#3823A4] hover:text-[#25167A] transition-colors">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
