import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { OnboardingLayout } from './OnboardingLayout';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export const NameSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const updateName = useMutation(api.users.updateName);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      // username: use displayName if provided, else lowercase firstName
      const username = displayName.trim()
        ? displayName.trim().toLowerCase().replace(/\s+/g, '_')
        : firstName.trim().toLowerCase();
      await updateName({ name: fullName, username });
      navigate('/onboarding/profile');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout 
      step={1} 
      totalSteps={6} 
      title="What's your name?" 
      subtitle="Tell us what you'd like people on Lalao to call you."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 col-span-1">
            <label className="text-xs font-bold text-neutral-500 tracking-wider uppercase">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Jane"
              className="w-full px-4 py-3.5 rounded-xl border-2 border-neutral-200 bg-white text-base text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3823A4] focus:ring-4 focus:ring-[#3823A4]/10 transition-all"
              autoFocus
            />
          </div>
          
          <div className="space-y-1.5 col-span-1">
            <label className="text-xs font-bold text-neutral-500 tracking-wider uppercase">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Doe"
              className="w-full px-4 py-3.5 rounded-xl border-2 border-neutral-200 bg-white text-base text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3823A4] focus:ring-4 focus:ring-[#3823A4]/10 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-neutral-500 tracking-wider uppercase">Display Name</label>
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Optional</span>
          </div>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="How should we display your name?"
            className="w-full px-4 py-3.5 rounded-xl border-2 border-neutral-200 bg-white text-base text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3823A4] focus:ring-4 focus:ring-[#3823A4]/10 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 rounded-xl bg-[#3823A4] text-white font-black text-base flex items-center justify-center gap-3 transition-transform active:scale-[0.98] shadow-lg shadow-[#3823A4]/25 hover:bg-[#25167A] cursor-pointer disabled:opacity-70 mt-4"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>
              <span>Continue</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </OnboardingLayout>
  );
};
