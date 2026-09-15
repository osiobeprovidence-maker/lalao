import React from 'react';
import { Plus } from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';

interface CycleStoriesTrayProps {
  className?: string;
  variant?: 'feed' | 'compact';
}

export const CycleStoriesTray: React.FC<CycleStoriesTrayProps> = ({
  className = '',
  variant = 'feed',
}) => {
  const {
    currentUser,
    cycles,
    openCycleStory,
    setIsCreateCycleOpen,
  } = useLalao();

  // Find current user's cycle
  const myCycle = cycles.find(
    (c) => c.user?.id === currentUser.id || c.id === 'cycle_user_me'
  );
  const myHasItems = myCycle && myCycle.items && myCycle.items.length > 0;

  // Other users' cycles
  const otherCycles = cycles.filter(
    (c) => c.user?.id !== currentUser.id && c.id !== 'cycle_user_me' && c.items && c.items.length > 0
  );

  return (
    <div
      id="cycle-stories-tray"
      className={`border-b border-neutral-100 bg-white py-2.5 ${className}`}
    >
      <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar px-4">
        {/* 1. Current User's Cycle */}
        <div className="flex flex-col items-center shrink-0">
          <div className="relative cursor-pointer group">
            <button
              id="btn-my-cycle"
              onClick={() => {
                if (myHasItems && myCycle) {
                  openCycleStory(myCycle.id, 0);
                } else {
                  setIsCreateCycleOpen(true);
                }
              }}
              className="relative block focus:outline-none"
            >
              <div
                className={`p-[2px] rounded-full transition-transform active:scale-95 ${
                  myHasItems
                    ? 'bg-gradient-to-tr from-[#5E43F3] via-fuchsia-500 to-amber-400 p-[2.5px]'
                    : 'bg-neutral-200'
                }`}
              >
                <div className="bg-white p-[1.5px] rounded-full">
                  <Avatar
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    size="md"
                    className="w-13 h-13"
                  />
                </div>
              </div>
            </button>

            {/* Plus badge to add to cycle */}
            <button
              id="btn-add-cycle-status"
              onClick={(e) => {
                e.stopPropagation();
                setIsCreateCycleOpen(true);
              }}
              className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#5E43F3] text-white flex items-center justify-center border-2 border-white shadow-xs hover:bg-[#4E34E0] active:scale-90 transition-all cursor-pointer"
              title="Add status to your Cycle"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
            </button>
          </div>

          <span className="text-[11px] font-semibold text-neutral-800 mt-1.5 truncate max-w-[62px] text-center">
            {myHasItems ? 'Your Cycle' : 'Add Status'}
          </span>
          <span className="text-[9px] text-neutral-400 -mt-0.5 leading-tight">
            {myHasItems ? `${myCycle?.items?.length || 0} active` : '24h cycle'}
          </span>
        </div>

        {/* 2. Other Community Members' Cycles */}
        {otherCycles.map((cycle) => {
          const user = cycle.user;
          const firstName = user?.name ? user.name.split(' ')[0] : (cycle.name || 'Resident');

          return (
            <div
              key={cycle.id}
              className="flex flex-col items-center shrink-0 cursor-pointer group"
              onClick={() => openCycleStory(cycle.id, 0)}
            >
              <div className="relative">
                <div
                  className={`rounded-full transition-all duration-200 group-hover:scale-105 active:scale-95 ${
                    cycle.hasUnseen
                      ? 'p-[2.5px] bg-gradient-to-tr from-[#5E43F3] via-fuchsia-500 to-pink-500 shadow-xs'
                      : 'p-[2px] bg-neutral-300/80'
                  }`}
                >
                  <div className="bg-white p-[1.5px] rounded-full">
                    <Avatar
                      src={user?.avatar || cycle.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
                      alt={user?.name || cycle.name || 'User'}
                      size="md"
                      className="w-13 h-13"
                    />
                  </div>
                </div>

                {/* Unseen indicator dot */}
                {cycle.hasUnseen && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#5E43F3] rounded-full border-2 border-white ring-1 ring-[#5E43F3]/30" />
                )}
              </div>

              <span className="text-[11px] font-semibold text-neutral-800 mt-1.5 truncate max-w-[68px] text-center">
                {firstName}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
