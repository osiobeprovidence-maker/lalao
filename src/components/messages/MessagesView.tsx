import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  Search,
  Plus,
  ChevronRight,
  X,
  MessageSquare,
  Check,
  CheckCheck,
  RotateCw,
  ArrowDown,
  CheckCircle2,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';

export const MessagesView: React.FC = () => {
  const {
    conversations,
    cycles,
    setActiveChatId,
    openCycleStory,
    setIsCreateCycleOpen,
    currentUser,
    triggerShareToast,
  } = useLalao();

  const [searchQuery, setSearchQuery] = useState('');

  // Pull to refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  const startYRef = useRef<number | null>(null);
  const pullThreshold = 56;
  const maxPullDistance = 84;

  const handleRefresh = useCallback(() => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshSuccess(false);

    // Simulate network sync for direct messages and 24h stories
    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshSuccess(true);
      triggerShareToast('Messages and status updated!');

      setTimeout(() => {
        setRefreshSuccess(false);
        setPullDistance(0);
      }, 600);
    }, 900);
  }, [isRefreshing, triggerShareToast]);

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 2 && !isRefreshing) {
      startYRef.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startYRef.current || isRefreshing) return;

    if (window.scrollY <= 2) {
      const currentY = e.touches[0].clientY;
      const diff = currentY - startYRef.current;

      if (diff > 0) {
        const pull = Math.min(maxPullDistance, diff * 0.45);
        setPullDistance(pull);
      }
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  const handleTouchEnd = () => {
    if (!isPulling || isRefreshing) return;
    setIsPulling(false);
    startYRef.current = null;

    if (pullDistance >= pullThreshold) {
      handleRefresh();
    } else {
      setPullDistance(0);
    }
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (window.scrollY <= 2 && !isRefreshing) {
      startYRef.current = e.clientY;
      setIsPulling(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!startYRef.current || isRefreshing || !isPulling) return;
    const diff = e.clientY - startYRef.current;
    if (diff > 0 && window.scrollY <= 2) {
      const pull = Math.min(maxPullDistance, diff * 0.4);
      setPullDistance(pull);
    }
  };

  const handleMouseUp = () => {
    if (!isPulling || isRefreshing) return;
    setIsPulling(false);
    startYRef.current = null;
    if (pullDistance >= pullThreshold) {
      handleRefresh();
    } else {
      setPullDistance(0);
    }
  };

  // Current user's cycle
  const myCycle = cycles.find(
    (c) => c.user?.id === currentUser.id || c.id === 'cycle_user_me'
  );
  const myHasItems = myCycle && myCycle.items && myCycle.items.length > 0;

  // Other community cycles
  const otherCycles = cycles.filter(
    (c) => c.user?.id !== currentUser.id && c.id !== 'cycle_user_me' && c.items && c.items.length > 0
  );

  const filteredConversations = useMemo(() => {
    return conversations.filter(
      (c) =>
        c.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  const effectiveOffset = isRefreshing ? 54 : pullDistance;
  const isReadyToRelease = pullDistance >= pullThreshold;

  return (
    <div
      id="messages-view-container"
      className="min-h-screen bg-white pb-24 relative select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <div
            onClick={handleRefresh}
            className="cursor-pointer group flex items-center gap-1.5"
            title="Tap to refresh messages"
          >
            <h1 className="text-xl font-black tracking-tight text-neutral-950 font-sans group-hover:text-[#5E43F3] transition-colors">
              Messages
            </h1>
          </div>
        </div>

        {/* Search */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
          <input
            id="input-messages-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages & contacts..."
            className="w-full pl-9 pr-9 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200/60 focus:bg-white focus:ring-2 focus:ring-[#5E43F3]/20 focus:border-[#5E43F3] border border-transparent text-sm text-neutral-900 placeholder:text-neutral-400 transition-all outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-1 rounded-full text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Pull-to-Refresh Visual Indicator Banner */}
      <div
        style={{
          height: `${effectiveOffset}px`,
          opacity: effectiveOffset > 4 ? 1 : 0,
        }}
        className={`w-full overflow-hidden bg-gradient-to-b from-neutral-50 to-white border-b border-neutral-100 flex items-center justify-center transition-[height,opacity] ${
          isPulling ? 'duration-0' : 'duration-300 ease-out'
        }`}
      >
        <div className="flex items-center gap-2.5 text-xs font-semibold text-neutral-600">
          {isRefreshing ? (
            <>
              <div className="w-5 h-5 rounded-full bg-[#5E43F3]/10 flex items-center justify-center">
                <RotateCw className="w-3.5 h-3.5 text-[#5E43F3] animate-spin" />
              </div>
              <span className="text-[#5E43F3] font-bold">Syncing messages & status...</span>
            </>
          ) : refreshSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700 font-bold">Messages up to date</span>
            </>
          ) : (
            <>
              <div
                style={{
                  transform: `rotate(${Math.min(180, (pullDistance / pullThreshold) * 180)}deg)`,
                }}
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-transform ${
                  isReadyToRelease ? 'bg-[#5E43F3] text-white' : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                <ArrowDown className="w-3 h-3 stroke-[2.5]" />
              </div>
              <span className={isReadyToRelease ? 'text-[#5E43F3] font-bold' : 'text-neutral-500'}>
                {isReadyToRelease ? 'Release to refresh' : 'Pull down to update'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Status / Story Cycles Section */}
      <div className="pt-3 pb-3 border-b border-neutral-100">
        <div className="px-4 flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              Status
            </h2>
          </div>
        </div>

        {/* Story Scroll Ribbon - Perfectly Aligned Row */}
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar px-4 py-1">
          {/* User's Own Status */}
          <div
            onClick={() => {
              if (myHasItems && myCycle) {
                openCycleStory(myCycle.id, 0);
              } else {
                setIsCreateCycleOpen(true);
              }
            }}
            className="w-16 flex flex-col items-center shrink-0 cursor-pointer group text-center"
          >
            <div className="relative w-14 h-14">
              <div
                className={`w-full h-full rounded-full flex items-center justify-center transition-transform group-hover:scale-105 p-[2.5px] ${
                  myHasItems
                    ? 'bg-gradient-to-tr from-[#5E43F3] via-fuchsia-500 to-amber-400'
                    : 'bg-neutral-200'
                }`}
              >
                <div className="w-full h-full bg-white p-[1.5px] rounded-full flex items-center justify-center">
                  <Avatar src={currentUser.avatar} alt={currentUser.name} size="md" className="w-full h-full" />
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCreateCycleOpen(true);
                }}
                className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-[#5E43F3] text-white flex items-center justify-center border-2 border-white shadow-xs hover:bg-[#4E34E0]"
                title="Post to Cycle"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
              </button>
            </div>
            <span className="text-[11px] font-bold text-neutral-900 mt-1.5 truncate w-full text-center block leading-tight">
              {myHasItems ? 'My Status' : 'Add Status'}
            </span>
          </div>

          {/* Other Users' Active Cycles */}
          {otherCycles.map((cycle) => {
            const user = cycle.user;
            const firstName = user?.name ? user.name.split(' ')[0] : (cycle.name || 'Resident');

            return (
              <div
                key={cycle.id}
                onClick={() => openCycleStory(cycle.id, 0)}
                className="w-16 flex flex-col items-center shrink-0 cursor-pointer group text-center"
              >
                <div className="relative w-14 h-14">
                  <div
                    className={`w-full h-full rounded-full flex items-center justify-center transition-transform group-hover:scale-105 ${
                      cycle.hasUnseen
                        ? 'p-[2.5px] bg-gradient-to-tr from-[#5E43F3] via-fuchsia-500 to-pink-500 shadow-xs'
                        : 'p-[2.5px] bg-neutral-300'
                    }`}
                  >
                    <div className="w-full h-full bg-white p-[1.5px] rounded-full flex items-center justify-center">
                      <Avatar
                        src={user?.avatar || cycle.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
                        alt={user?.name || cycle.name || 'User'}
                        size="md"
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                  {cycle.hasUnseen && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#5E43F3] rounded-full border-2 border-white" />
                  )}
                </div>
                <span className="text-[11px] font-bold text-neutral-800 mt-1.5 truncate w-full text-center block leading-tight">
                  {firstName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chats Section */}
      <div className="pt-3">
        <div className="px-4 mb-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-600">
            Direct Chats
          </h2>
        </div>

        <div className="divide-y divide-neutral-100">
          {filteredConversations.map((conv) => {
            const lastMsg = conv.messages && conv.messages.length > 0 ? conv.messages[conv.messages.length - 1] : null;
            const isLastMine = lastMsg?.isMine;

            return (
              <div
                key={conv.id}
                id={`conv-item-${conv.id}`}
                onClick={() => setActiveChatId(conv.id)}
                className="p-4 flex items-center justify-between hover:bg-neutral-50/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    src={conv.participant?.avatar}
                    alt={conv.participant?.name || 'Contact'}
                    size="md"
                    online
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-neutral-900 truncate">
                        {conv.participant?.name}
                      </span>
                      {conv.participant?.isVerified && (
                        <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#0095F6] text-white shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                        </span>
                      )}
                      {conv.participant?.badge && <Badge type={conv.participant.badge} />}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-neutral-500 truncate mt-0.5 max-w-[220px]">
                      {isLastMine && (
                        <span className="shrink-0" title={lastMsg?.status === 'read' ? 'Read' : lastMsg?.status === 'delivered' ? 'Delivered' : 'Sent'}>
                          {lastMsg?.status === 'read' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-sky-500 stroke-[2.4]" />
                          ) : lastMsg?.status === 'delivered' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-neutral-400 stroke-[2.2]" />
                          ) : (
                            <Check className="w-3 h-3 text-neutral-400 stroke-[2.2]" />
                          )}
                        </span>
                      )}
                      <span className="truncate">{conv.lastMessage}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <div className="text-right">
                    <span className="text-[11px] text-neutral-400 block">{conv.timestamp}</span>
                    {conv.unreadCount > 0 && (
                      <span className="inline-block mt-1 w-2 h-2 rounded-full bg-[#5E43F3]" />
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-300" />
                </div>
              </div>
            );
          })}

          {filteredConversations.length === 0 && (
            <div className="p-8 text-center text-neutral-400 space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-neutral-300" />
              <p className="text-xs font-semibold">No chats found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
