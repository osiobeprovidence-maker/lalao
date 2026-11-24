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

  return (
    <button
      type="button"
      onClick={onClick}
      id="btn-room-egg-indicator"
      className={`relative flex h-7 max-w-[92px] sm:max-w-[108px] shrink-0 items-center gap-1.5 px-2 py-0.5 rounded-full border transition-all cursor-pointer select-none active:scale-95 group ${
        isReady
          ? 'bg-[#5E43F3]/15 border-[#5E43F3]/50 shadow-sm shadow-[#5E43F3]/20 hover:border-[#5E43F3]'
          : 'bg-theme-surface border-theme-divider hover:border-[#5E43F3]/50 hover:bg-theme-surface-hover'
      }`}
      title="View LaLao Egg Rewards"
      aria-label="LaLao Egg Rewards"
    >
      {/* Compact Egg Jar */}
      <div className="shrink-0">
        <EggJarVisual
          progressPercent={progressPercent}
          points={points}
          nairaValue={nairaValue}
          eggState={eggState}
          size="xs"
        />
      </div>

      {/* Points & Progress Pill */}
      <div className="flex min-w-0 flex-col pr-0.5 text-left">
        <div className="flex min-w-0 items-center gap-0.5 leading-none">
          <span className="truncate text-[9px] font-bold text-theme-primary tracking-tight">
            {points.toLocaleString()}
          </span>
          <span className="shrink-0 text-[8px] font-medium text-[#5E43F3] font-mono">
            ₦{nairaValue}
          </span>
        </div>
        <div className="flex items-center gap-0.5 mt-0.5">
          {/* Mini progress bar */}
          <div className="w-7 h-1 rounded-full bg-theme-divider-strong overflow-hidden shrink-0">
            <div
              className={`h-full transition-all duration-500 ${
                isReady
                  ? 'bg-[#5E43F3]'
                  : 'bg-gradient-to-r from-[#5E43F3] to-[#818CF8]'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
            />
          </div>
          <span className="text-[8px] text-theme-tertiary font-medium">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Ready Badge Ping */}
      {isReady && (
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5E43F3] opacity-40" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#5E43F3]" />
        </span>
      )}
    </button>
  );
};
