import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, Check } from 'lucide-react';
import { OnboardingLayout } from './OnboardingLayout';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

const PRONOUN_OPTIONS = [
  { id: 'he', label: 'He / Him' },
  { id: 'she', label: 'She / Her' },
  { id: 'they', label: 'They / Them' },
  { id: 'other', label: 'Other' },
  { id: 'none', label: 'Prefer not to say' },
];

export const PronounsPage: React.FC = () => {
  const navigate = useNavigate();
  const updatePronouns = useMutation(api.users.updatePronouns);
  const [selected, setSelected] = useState<string | null>(null);
  const [customPronoun, setCustomPronoun] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) {
      setError('Please select an option to continue.');
      return;
    }
    if (selected === 'other' && !customPronoun.trim()) {
      setError('Please enter your preferred pronouns.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const pronounValue = selected === 'other' ? customPronoun.trim() : selected;
      await updatePronouns({ pronouns: pronounValue });
      navigate('/onboarding/location');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout 
      step={3} 
      totalSteps={6} 
      title="What are your pronouns?" 
      subtitle="Choose the pronouns you'd like people to use when referring to you."
      backTo="/onboarding/profile"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {PRONOUN_OPTIONS.map((option) => {
            const isSelected = selected === option.id;
            return (
              <div key={option.id} className="space-y-3">
                <button
                  type="button"
                  onClick={() => setSelected(option.id)}
                  className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-[#3823A4] bg-[#F8F7FF]' 
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <span className={`font-bold text-base ${isSelected ? 'text-[#3823A4]' : 'text-neutral-700'}`}>
                    {option.label}
                  </span>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected ? 'border-[#3823A4] bg-[#3823A4]' : 'border-neutral-300'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </div>
                </button>
                
                {isSelected && option.id === 'other' && (
                  <div className="animate-in slide-in-from-top-2 fade-in duration-200 pl-2">
                    <input
                      type="text"
                      value={customPronoun}
                      onChange={(e) => setCustomPronoun(e.target.value)}
                      placeholder="e.g. Ze / Zir"
                      className="w-full px-4 py-3.5 rounded-xl border-2 border-neutral-200 bg-white text-base text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3823A4] focus:ring-4 focus:ring-[#3823A4]/10 transition-all"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 rounded-xl bg-[#3823A4] text-white font-black text-base flex items-center justify-center gap-3 transition-transform active:scale-[0.98] shadow-lg shadow-[#3823A4]/25 hover:bg-[#25167A] cursor-pointer disabled:opacity-70 mt-6"
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
