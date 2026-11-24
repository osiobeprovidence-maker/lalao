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
      className={`flex h-8 shrink-0 items-center gap-2 overflow-hidden rounded-full border px-2.5 transition-all cursor-pointer select-none active:scale-95 ${
        isReady
          ? 'bg-[#5E43F3]/12 border-[#5E43F3]/45 hover:border-[#5E43F3]'
          : 'bg-theme-surface border-theme-divider hover:border-[#5E43F3]/50 hover:bg-theme-surface-hover'
      }`}
      title={`LaLao Egg Rewards (${clampedProgress}%)`}
      aria-label={`LaLao Egg Rewards ${clampedProgress}%`}
    >
      {/* Animated Egg */}
      <div className="flex shrink-0 items-center justify-center">
        <EggJarVisual
          progressPercent={progressPercent}
          points={points}
          nairaValue={nairaValue}
          eggState={eggState}
          size="xs"
        />
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-12 sm:w-16 shrink-0 overflow-hidden rounded-full bg-theme-divider-strong">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isReady
              ? 'bg-[#5E43F3]'
              : 'bg-gradient-to-r from-[#5E43F3] to-[#818CF8]'
          }`}
          style={{ width: `${clampedProgress > 0 ? Math.max(6, clampedProgress) : 0}%` }}
        />
      </div>

      {/* Percentage */}
      <span className="shrink-0 text-[11px] font-semibold leading-none tabular-nums text-theme-secondary">
        {clampedProgress}%
      </span>
    </button>
  );
};
