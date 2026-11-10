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
      className={`relative flex items-center gap-2 px-2.5 py-1.5 rounded-full border transition-all cursor-pointer select-none active:scale-95 group ${
        isReady
          ? 'bg-[#5E43F3]/25 border-cyan-400/50 shadow-md shadow-[#5E43F3]/30 hover:border-cyan-300'
          : 'bg-[#0B0F19]/80 border-white/10 hover:border-[#5E43F3]/50 hover:bg-[#161B26]'
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
          size="sm"
        />
      </div>

      {/* Points & Progress Pill */}
      <div className="flex flex-col text-left pr-1 min-w-0">
        <div className="flex items-center gap-1 leading-none">
          <span className="text-[11px] font-bold text-white tracking-tight">
            {points.toLocaleString()}
          </span>
          <span className="text-[9px] font-medium text-cyan-300 font-mono">
            ₦{nairaValue}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          {/* Mini progress bar */}
          <div className="w-12 h-1 rounded-full bg-white/10 overflow-hidden shrink-0">
            <div
              className={`h-full transition-all duration-500 ${
                isReady
                  ? 'bg-gradient-to-r from-cyan-400 to-[#5E43F3]'
                  : 'bg-gradient-to-r from-[#5E43F3] to-[#818CF8]'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
            />
          </div>
          <span className="text-[9px] text-neutral-400 font-medium">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Ready Badge Ping */}
      {isReady && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
        </span>
      )}
    </button>
  );
};
