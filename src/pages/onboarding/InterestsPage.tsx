import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { OnboardingLayout } from './OnboardingLayout';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

const INTERESTS = [
  { id: 'anime', label: 'Anime' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'stem', label: 'STEM' },
  { id: 'drama', label: 'Drama' },
  { id: 'community', label: 'Community' },
  { id: 'events', label: 'Events' },
  { id: 'shopping', label: 'Local Shopping' },
  { id: 'food', label: 'Food' },
  { id: 'music', label: 'Music' },
  { id: 'sports', label: 'Sports' },
  { id: 'esports', label: 'Esports' },
  { id: 'rallies', label: 'Rallies' },
  { id: 'cycling', label: 'Cycling' },
  { id: 'business', label: 'Business' },
  { id: 'education', label: 'Education' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'volunteering', label: 'Volunteering' },
  { id: 'technology', label: 'Technology' },
  { id: 'arts', label: 'Arts & Culture' },
];

export const InterestsPage: React.FC = () => {
  const navigate = useNavigate();
  const updateInterests = useMutation(api.users.updateInterests);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const MIN_REQUIRED = 3;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canContinue = selected.size >= MIN_REQUIRED;

  const handleContinue = async () => {
    if (!canContinue) return;
    setIsLoading(true);
    try {
      await updateInterests({ interests: Array.from(selected) });
      navigate('/onboarding/complete');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout 
      step={5} 
      totalSteps={6} 
      title="What are you into?" 
      subtitle="Pick a few interests so we can personalize your Lalao experience." 
      backTo="/onboarding/location"
    >
      <div className="space-y-6">
        
        {/* Selection count */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-neutral-500">
            {selected.size} selected 
            {selected.size < MIN_REQUIRED && (
              <span className="text-neutral-400 font-medium ml-1">
                (Select at least {MIN_REQUIRED - selected.size} more)
              </span>
            )}
          </span>
          {selected.size >= MIN_REQUIRED && (
            <span className="text-xs font-bold text-[#3823A4] bg-[#F8F7FF] px-2.5 py-1 rounded-full border border-indigo-100">
              ✓ Good to go
            </span>
          )}
        </div>

        {/* Interests grid */}
        <div className="flex flex-wrap gap-2.5">
          {INTERESTS.map(({ id, label }) => {
            const isSelected = selected.has(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                className={`px-4 py-2.5 rounded-full border-2 text-sm font-bold transition-all cursor-pointer active:scale-[0.97] ${
                  isSelected
                    ? 'border-[#3823A4] bg-[#3823A4] text-white shadow-md shadow-[#3823A4]/20'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue || isLoading}
          className="w-full py-4 rounded-xl bg-[#3823A4] hover:bg-[#25167A] text-white font-black text-base flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-[#3823A4]/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-8"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>
              <span>Continue</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </OnboardingLayout>
  );
};
