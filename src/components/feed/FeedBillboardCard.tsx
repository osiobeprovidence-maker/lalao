import React from 'react';
import { Megaphone, Sparkles, ArrowRight } from 'lucide-react';

interface FeedBillboardCardProps {
  onAdvertise: () => void;
}

export const FeedBillboardCard: React.FC<FeedBillboardCardProps> = ({ onAdvertise }) => {
  return (
    <div
      id="feed-advertising-billboard"
      className="relative overflow-hidden rounded-2xl border border-theme-divider bg-theme-surface p-5 sm:p-6 shadow-xs transition-all hover:border-[#5E43F3]/40"
    >
      {/* Subtle native accent glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-[#5E43F3]/10 blur-2xl"
      />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-[#5E43F3]/12 border border-[#5E43F3]/25 text-[#5E43F3] flex items-center justify-center shrink-0">
            <Megaphone className="w-5 h-5" />
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Available Placement
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-theme-tertiary">
                <Sparkles className="w-3 h-3 text-[#5E43F3]" />
                For You Billboard
              </span>
            </div>

            <h3 className="text-base font-black text-theme-primary tracking-tight leading-snug">
              Your brand deserves attention.
            </h3>

            <p className="text-xs sm:text-[13px] text-theme-secondary leading-relaxed max-w-md">
              Reach people across the Lalao feed with a native sponsored placement. Upload your creative, choose a duration, and track live impressions and clicks.
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <button
            id="btn-billboard-advertise-here"
            type="button"
            onClick={onAdvertise}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold text-white bg-[#5E43F3] hover:bg-[#4E34E0] transition-colors cursor-pointer shadow-xs"
          >
            <span>Advertise Here</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
