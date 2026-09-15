import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { OnboardingLayout } from './OnboardingLayout';

export const CompletePage: React.FC = () => {
  const navigate = useNavigate();

  const handleContinue = () => {
    // Navigate to the main app feed
    navigate('/app');
  };

  return (
    <OnboardingLayout 
      step={6} 
      totalSteps={6} 
      title="You're all set!" 
      subtitle="Welcome to Lalao. Your community is waiting."
    >
      <div className="flex flex-col items-center justify-center py-10 space-y-8">
        
        <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center animate-in zoom-in duration-500">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>

        <button
          type="button"
          onClick={handleContinue}
          className="w-full py-4 rounded-xl bg-[#3823A4] hover:bg-[#25167A] text-white font-black text-base flex items-center justify-center gap-3 transition-transform active:scale-[0.98] shadow-lg shadow-[#3823A4]/25 cursor-pointer"
        >
          <span>Explore Lalao</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </OnboardingLayout>
  );
};
