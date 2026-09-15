import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { OnboardingLayout } from './OnboardingLayout';

const INTERESTS = [
  { id: 'gaming', label: 'Gaming & Esports', emoji: '🎮' },
  { id: 'football', label: 'Football', emoji: '⚽' },
  { id: 'sports', label: 'Sports & Fitness', emoji: '🏃' },
  { id: 'fashion', label: 'Fashion & Style', emoji: '👗' },
  { id: 'tech', label: 'Tech & Startups', emoji: '💻' },
  { id: 'music', label: 'Music & Entertainment', emoji: '🎵' },
  { id: 'food', label: 'Food & Drinks', emoji: '🍔' },
  { id: 'arts', label: 'Arts & Culture', emoji: '🎨' },
  { id: 'civic', label: 'Civic & Community', emoji: '🏛️' },
  { id: 'business', label: 'Business & Trade', emoji: '💼' },
  { id: 'education', label: 'Education', emoji: '📚' },
  { id: 'health', label: 'Health & Wellness', emoji: '💪' },
  { id: 'travel', label: 'Travel & Adventure', emoji: '✈️' },
  { id: 'photography', label: 'Photography', emoji: '📸' },
  { id: 'real-estate', label: 'Real Estate', emoji: '🏠' },
  { id: 'environment', label: 'Environment', emoji: '🌿' },
  { id: 'film', label: 'Film & TV', emoji: '🎬' },
  { id: 'crypto', label: 'Crypto & Finance', emoji: '₿' },
];

export const InterestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<string>>(new Set());
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

  return (
    <OnboardingLayout step={4} totalSteps={5} title="What are you into?" subtitle={`Pick at least ${MIN_REQUIRED} interests to personalize your feed.`} backTo="/onboarding/location">
      <div className="space-y-6">
        {/* Selection count */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-500">
            {selected.size} selected {selected.size < MIN_REQUIRED && <span className="text-[#5E43F3] font-semibold">(need {MIN_REQUIRED - selected.size} more)</span>}
          </span>
          {selected.size >= MIN_REQUIRED && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              ✓ Good to go!
            </span>
          )}
        </div>

        {/* Interests grid */}
        <div className="flex flex-wrap gap-2.5">
          {INTERESTS.map(({ id, label, emoji }) => {
            const isSelected = selected.has(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border-2 text-sm font-bold transition-all cursor-pointer active:scale-[0.95] ${
                  isSelected
                    ? 'border-[#5E43F3] bg-[#5E43F3] text-white shadow-md shadow-[#5E43F3]/20'
                    : 'border-neutral-150 bg-neutral-50 text-neutral-800 hover:border-neutral-300 hover:bg-neutral-100'
                }`}
              >
                <span className="text-base leading-none">{emoji}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick select row */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSelected(new Set(INTERESTS.slice(0, 5).map(i => i.id)))}
            className="text-xs font-semibold text-neutral-500 hover:text-[#5E43F3] transition-colors cursor-pointer"
          >
            Select popular
          </button>
          {selected.size > 0 && (
            <>
              <span className="text-neutral-200">·</span>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="text-xs font-semibold text-neutral-500 hover:text-red-500 transition-colors cursor-pointer"
              >
                Clear all
              </button>
            </>
          )}
        </div>

        <button
          id="btn-onboard-interests-continue"
          type="button"
          onClick={() => { if (canContinue) navigate('/onboarding/suggestions'); }}
          disabled={!canContinue}
          className="w-full py-4 rounded-2xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-[#5E43F3]/25 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <span>Continue</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </OnboardingLayout>
  );
};
