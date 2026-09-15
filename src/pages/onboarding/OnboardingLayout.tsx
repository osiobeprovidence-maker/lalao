import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Zap } from 'lucide-react';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  backTo?: string;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  step,
  totalSteps,
  title,
  subtitle,
  backTo,
}) => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-neutral-100 px-6 py-4">
        <div className="max-w-md mx-auto flex items-center gap-4">
          {/* Back */}
          <div className="w-8">
            {backTo && (
              <Link to={backTo} className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-all inline-flex">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Progress */}
          <div className="flex-1 flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${i < step ? 'bg-[#5E43F3]' : 'bg-neutral-100'}`}
              />
            ))}
          </div>

          {/* Step count */}
          <span className="text-xs font-bold text-neutral-400 w-10 text-right">
            {step}/{totalSteps}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-6 py-8 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-black text-neutral-950 tracking-tight">{title}</h1>
            {subtitle && <p className="text-neutral-500 text-sm leading-relaxed">{subtitle}</p>}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};
