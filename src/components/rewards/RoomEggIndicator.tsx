import React from 'react';
import { EggJarVisual } from './EggJarVisual';

interface RoomEggIndicatorProps {
  points: number;
  nairaValue: number;
  progressPercent: number;
  eggState: 'empty' | 'filling' | 'almost_full' | 'reward_ready' | 'reward_redeemed';
  onClick: () => void;
}

export const RoomEggIndicator: React.FC<RoomEggIndicatorProps> = ({
  points,
  nairaValue,
  progressPercent,
  eggState,
  onClick,
}) => {
  const isReady = eggState === 'reward_ready';

  const clampedProgress = Math.min(100, Math.max(0, Math.round(progressPercent)));

  return (
    <button
      type="button"
      onClick={onClick}
      id="btn-room-egg-indicator"
      className={`relative flex h-9 w-auto max-w-[152px] sm:max-w-[196px] shrink-0 items-center gap-2 overflow-hidden rounded-full border px-2.5 py-1 transition-all cursor-pointer select-none active:scale-95 group ${
        isReady
          ? 'bg-[#5E43F3]/15 border-[#5E43F3]/50 shadow-sm shadow-[#5E43F3]/20 hover:border-[#5E43F3]'
          : 'bg-theme-surface border-theme-divider hover:border-[#5E43F3]/50 hover:bg-theme-surface-hover'
      }`}
      title={`LaLao Egg Rewards — ${points.toLocaleString()} pts (₦${nairaValue.toLocaleString()}) · ${clampedProgress}% daily progress`}
      aria-label="LaLao Egg Rewards"
    >
      {/* Compact Egg Jar */}
      <div className="flex shrink-0 items-center justify-center">
        <EggJarVisual
          progressPercent={progressPercent}
          points={points}
          nairaValue={nairaValue}
          eggState={eggState}
          size="xs"
        />
      </div>

      {/* Points, Reward Value & Daily Progress */}
      <div className="flex min-w-0 flex-col justify-center gap-1 text-left">
        <div className="flex min-w-0 items-baseline gap-1.5 whitespace-nowrap leading-none">
          <span className="truncate text-[11px] font-bold tabular-nums text-theme-primary tracking-tight">
            {points.toLocaleString()}
          </span>
          <span className="shrink-0 text-[10px] font-semibold tabular-nums text-[#5E43F3]">
            ₦{nairaValue.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-1.5 leading-none">
          <div className="h-1.5 w-11 sm:w-14 shrink-0 overflow-hidden rounded-full bg-theme-divider-strong">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isReady
                  ? 'bg-[#5E43F3]'
                  : 'bg-gradient-to-r from-[#5E43F3] to-[#818CF8]'
              }`}
              style={{ width: `${clampedProgress > 0 ? Math.max(6, clampedProgress) : 0}%` }}
            />
          </div>
          <span className="shrink-0 text-[10px] font-semibold tabular-nums text-theme-tertiary">
            {clampedProgress}%
          </span>
        </div>
      </div>

      {/* Ready Badge Ping */}
      {isReady && (
        <span className="absolute right-1 top-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5E43F3] opacity-40" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#5E43F3]" />
        </span>
      )}
    </button>
  );
};
