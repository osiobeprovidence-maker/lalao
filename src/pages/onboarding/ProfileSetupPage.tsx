import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { OnboardingLayout } from './OnboardingLayout';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export const ProfileSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const updateProfile = useMutation(api.users.updateProfile);
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateProfile({ bio: bio.trim() || undefined });
      navigate('/onboarding/pronouns');
    } catch {
      // bio is optional — navigate anyway
      navigate('/onboarding/pronouns');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => navigate('/onboarding/pronouns');

  return (
    <OnboardingLayout 
      step={2} 
      totalSteps={6} 
      title="Tell us a little about yourself" 
      subtitle="Help your community get to know you." 
      backTo="/onboarding/name"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-neutral-500 tracking-wider uppercase">Bio</label>
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              {bio.length}/150
            </span>
          </div>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 150))}
            placeholder="Tell people a little about yourself..."
            rows={5}
            className="w-full px-4 py-3.5 rounded-xl border-2 border-neutral-200 bg-white text-base text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3823A4] focus:ring-4 focus:ring-[#3823A4]/10 transition-all resize-none"
            autoFocus
          />
        </div>

        <div className="space-y-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-xl bg-[#3823A4] text-white font-black text-base flex items-center justify-center gap-3 transition-transform active:scale-[0.98] shadow-lg shadow-[#3823A4]/25 hover:bg-[#25167A] cursor-pointer disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={handleSkip}
            className="w-full py-3.5 rounded-xl bg-transparent text-neutral-500 font-bold text-sm flex items-center justify-center hover:bg-neutral-50 hover:text-neutral-700 transition-colors cursor-pointer"
          >
            Skip for now
          </button>
        </div>
      </form>
    </OnboardingLayout>
  );
};
