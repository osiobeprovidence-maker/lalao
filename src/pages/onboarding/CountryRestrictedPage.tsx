import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Loader2, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export const CountryRestrictedPage: React.FC = () => {
  const { logout } = useAuth();
  const joinWaitlist = useMutation(api.users.joinWaitlist);
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState('');

  const handleJoinWaitlist = async () => {
    setIsLoading(true);
    setError('');
    try {
      await joinWaitlist();
      setIsJoined(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F7FF] px-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl shadow-indigo-100 border border-indigo-50 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#3823A4]/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-[#3823A4] flex items-center justify-center mb-6 shadow-sm border border-indigo-100">
            <Globe className="w-8 h-8" />
          </div>

          <h1 className="text-2xl font-black text-neutral-950 tracking-tight mb-3">
            Lalao isn't available in your country yet.
          </h1>
          
          <p className="text-neutral-600 mb-8 leading-relaxed">
            Lalao is currently available only in Nigeria. Join the waitlist and we'll notify you when Lalao becomes available in your country.
          </p>

          {error && (
            <div className="w-full px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium mb-6">
              {error}
            </div>
          )}

          {isJoined ? (
            <div className="w-full px-4 py-4 rounded-xl bg-green-50 border border-green-100 text-green-800 text-sm font-semibold mb-6">
              You're on the list! We'll notify you when we expand to your country.
            </div>
          ) : (
            <button
              onClick={handleJoinWaitlist}
              disabled={isLoading}
              className="w-full py-4 rounded-xl bg-[#3823A4] text-white font-black text-base flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-lg shadow-[#3823A4]/25 hover:bg-[#25167A] cursor-pointer disabled:opacity-70 mb-4"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Join Waitlist"}
            </button>
          )}

          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 text-sm font-semibold text-neutral-500 hover:text-neutral-800 transition-colors py-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
