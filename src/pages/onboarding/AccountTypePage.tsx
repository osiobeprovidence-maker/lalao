import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Building2, Users, Shield, HeartHandshake, ArrowRight, Check, Zap } from 'lucide-react';
import { OnboardingLayout } from './OnboardingLayout';

type AccountType = 'person' | 'business' | 'organization' | 'club' | 'community';

const types: {
  id: AccountType;
  label: string;
  badge?: string;
  icon: React.FC<{ className?: string }>;
  desc: string;
  examples: string;
  color: string;
  bg: string;
}[] = [
  {
    id: 'person',
    label: 'Person',
    icon: User,
    desc: 'Share your life, connect locally, join rallies and events.',
    examples: 'Creator, student, professional, everyday user',
    color: 'text-[#5E43F3]',
    bg: 'bg-indigo-50',
  },
  {
    id: 'business',
    label: 'Business',
    badge: 'BIZ',
    icon: Building2,
    desc: 'Sell products, promote services, and reach local customers.',
    examples: 'Store, restaurant, salon, brand',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    id: 'organization',
    label: 'Organization',
    badge: 'ORG',
    icon: Shield,
    desc: 'Run campaigns, host events, and coordinate large communities.',
    examples: 'NGO, government body, association',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    id: 'club',
    label: 'Club',
    badge: 'CLUB',
    icon: Users,
    desc: 'Manage your team, rally members, and track activities.',
    examples: 'Football club, gaming squad, hobby group',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    id: 'community',
    label: 'Community',
    badge: 'COM',
    icon: HeartHandshake,
    desc: 'Build a neighborhood network, run local initiatives.',
    examples: 'Street association, local movement, forum',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
  },
];

export const AccountTypePage: React.FC = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<AccountType>('person');

  return (
    <OnboardingLayout step={1} totalSteps={5} title="What are you?" subtitle="Choose the account type that best describes you.">
      <div className="space-y-2.5">
        {types.map(({ id, label, badge, icon: Icon, desc, examples, color, bg }) => {
          const isSelected = selected === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSelected(id)}
              className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-left cursor-pointer ${
                isSelected ? 'border-[#5E43F3] bg-indigo-50/50 shadow-sm' : 'border-neutral-150 bg-neutral-50 hover:border-neutral-250'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#5E43F3]' : bg}`}>
                <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`font-bold text-sm ${isSelected ? 'text-[#5E43F3]' : 'text-neutral-900'}`}>{label}</span>
                  {badge && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-[#5E43F3] text-white' : 'bg-neutral-200 text-neutral-600'}`}>
                      {badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 leading-snug">{desc}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5 font-medium italic">{examples}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${isSelected ? 'border-[#5E43F3] bg-[#5E43F3]' : 'border-neutral-300'}`}>
                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          );
        })}
      </div>

      <button
        id="btn-onboard-account-type-continue"
        onClick={() => navigate('/onboarding/profile')}
        className="w-full py-4 rounded-2xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-[#5E43F3]/25 cursor-pointer mt-2"
      >
        <span>Continue</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </OnboardingLayout>
  );
};
