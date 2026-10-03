
import React, { useState, useRef, useCallback } from 'react';
import { useLalao, FeedTab } from '../../context/LalaoContext';
import { PostItem } from './PostItem';
import {
  MapPin,
  ArrowUpDown,
  SlidersHorizontal,
  Compass,
  RotateCw,
  ArrowDown,
  CheckCircle2,
  Clock,
  ChevronDown,
  X,
  Check,
} from 'lucide-react';

import { CommunityDirectory } from './CommunityDirectory';
import { useEventDistribution } from '../../services/events/EventDistributionContext';
import { EventFeedCard } from '../events/EventFeedCard';


export const HomeFeed: React.FC = () => {
  const {
    posts,
    pages,
    feedTab,
    setFeedTab,
    setActiveTab,
    location,
    currentUser,
    setIsCreateSheetOpen,
    setCreateFlowType,
    setIsLocationModalOpen,
    updateRadius,
    nearbySort,
    setNearbySort,
    triggerShareToast,
    featureFlags,
    isFeedLoading,
  } = useLalao();

const FeedSkeleton: React.FC = () => {
  return (
    <div className="divide-y divide-neutral-100 pb-8 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 sm:p-5 bg-theme-surface">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-theme-surface-active shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-3.5 bg-theme-surface-active rounded w-1/3" />
              <div className="h-2.5 bg-theme-surface-hover rounded w-1/4" />
            </div>
            <div className="w-6 h-6 rounded-full bg-theme-surface-hover shrink-0" />
          </div>
          <div className="space-y-2 mb-3">
            <div className="h-3.5 bg-theme-surface-active rounded w-full" />
            <div className="h-3.5 bg-theme-surface-active rounded w-5/6" />
          </div>
          <div className="w-full h-64 bg-theme-surface-hover rounded-[12px] mb-3" />
          <div className="flex items-center gap-6 mt-3">
            <div className="w-12 h-6 bg-theme-surface-hover rounded-full" />
            <div className="w-12 h-6 bg-theme-surface-hover rounded-full" />
            <div className="w-12 h-6 bg-theme-surface-hover rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
};

  const { externalEvents } = useEventDistribution();
  const activeEvents = externalEvents.filter(e => e.status === 'active');

  // Pull to refresh state
  const [followingSubTab, setFollowingSubTab] = useState<string>('All');
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');
  const [isRadiusDrawerOpen, setIsRadiusDrawerOpen] = useState(false);

  const startYRef = useRef<number | null>(null);
  const pullThreshold = 56;
  const maxPullDistance = 84;

  const handleRefresh = useCallback(() => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshSuccess(false);

    // Simulate network feed refresh & timestamp sync
    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshSuccess(true);
      const now = new Date();
      setLastUpdated(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
      triggerShareToast('Feed refreshed! Up to date with latest posts');

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

    // Only pull if user is at the top of the page
    if (window.scrollY <= 2) {
      const currentY = e.touches[0].clientY;
      const diff = currentY - startYRef.current;

      if (diff > 0) {
        // Apply resistance curve
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

  // Mouse Drag Handlers for Desktop Simulation
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

  const joinedCommunityIds = pages
    .filter((page) => page.isFollowing || page.ownerId === currentUser.id)
    .map((page) => page.id);

  const hasJoinedCommunities = joinedCommunityIds.length > 0;

  // Filter posts according to feed tab
  const filteredPosts = posts
    .filter((post) => {
      if (feedTab === 'following') {
        const isFollowedPersonOrPage = post.author.isFollowing || post.author.id === currentUser?.id;
        
        if (!isFollowedPersonOrPage) return false;

        if (followingSubTab !== 'All') {
          const postTopics = post.contentTopics || [];
          return postTopics.includes(followingSubTab);
        }
        
        return true;
      }
      if (feedTab === 'nearby') {
        const maxMeters = location.radiusKm * 1000;
        return (post.distanceMeters ?? 0) <= maxMeters;
      }
      if (feedTab === 'community') {
        // Handled separately, but if we render posts here just in case:
        return post.pageRefId !== undefined;
      }
      
      // For 'for_you', the backend already filtered the posts
      return true;
    })
    .sort((a, b) => {
      if (feedTab === 'nearby' && nearbySort === 'closest') {
        return (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0);
      }
      return 0; // preserve original chronological order
    });

  const activeTopicTabs = (currentUser?.interests || []).map((t: string) => ({
    id: t,
    label: t.charAt(0).toUpperCase() + t.slice(1)
  }));

  const tabs: { id: FeedTab; label: string }[] = [
    { id: 'for_you', label: 'For You' },
    { id: 'following', label: 'Following' },
    ...(featureFlags?.communityEnabled ? [{ id: 'community' as FeedTab, label: 'Community' }] : []),
    { id: 'nearby', label: 'Nearby' },
    ...activeTopicTabs,
  ];

  const radiusPresets = [1, 3, 5, 10, 25, 50];
  const radiusDescriptions: Record<number, string> = {
    1: 'Immediate walking distance & neighbors',
    3: 'Local neighborhood & streets',
    5: 'District & town reach (Recommended)',
    10: 'Cross-town & adjacent communities',
    25: 'Metropolitan perimeter',
    50: 'Regional wide delta coverage',
  };
  const effectiveOffset = isRefreshing ? 54 : pullDistance;
  const isReadyToRelease = pullDistance >= pullThreshold;

  return (
    <div
      id="home-feed-container"
      className="min-h-screen bg-theme-base pb-20 relative select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Sticky Feed Sub-Tabs with manual refresh indicator */}
      <div className="sticky top-0 z-20 bg-theme-base/95 backdrop-blur-md border-b border-theme-divider/80 flex items-center justify-around px-2">
        {tabs.map((tab) => {
          const isActive = feedTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-feed-${tab.id}`}
              onClick={() => {
                if (isActive) {
                  handleRefresh();
                } else {
                  setFeedTab(tab.id);
                  const mainEl = document.querySelector('main');
                  if (mainEl) {
                    mainEl.scrollTo({ top: 0, behavior: 'instant' });
                  }
                  window.scrollTo({ top: 0, behavior: 'instant' });
                }
              }}
              className={`flex-1 py-2.5 text-center text-sm font-bold transition-all relative cursor-pointer ${
                isActive ? 'text-theme-primary' : 'text-theme-tertiary hover:text-theme-secondary'
              }`}
              title={isActive ? 'Tap to refresh feed' : tab.label}
            >
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-[#5E43F3] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Sub-filters for Following Tab Interests - Removed per user request */}
      <div
        style={{
          height: `${effectiveOffset}px`,
          opacity: effectiveOffset > 4 ? 1 : 0,
        }}
        className={`w-full overflow-hidden bg-gradient-to-b from-[#f8f5f1] to-[#f6f3ee] border-b border-theme-divider/80 flex items-center justify-center transition-[height,opacity] ${
          isPulling ? 'duration-0' : 'duration-300 ease-out'
        }`}
      >
        <div className="flex items-center gap-2.5 text-xs font-semibold text-theme-secondary">
          {isRefreshing ? (
            <>
              <div className="w-5 h-5 rounded-full bg-[#5E43F3]/10 flex items-center justify-center">
                <RotateCw className="w-3.5 h-3.5 text-[#5E43F3] animate-spin" />
              </div>
              <span className="text-[#5E43F3] font-bold">Refreshing feed...</span>
            </>
          ) : refreshSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700 font-bold">Feed up to date</span>
            </>
          ) : (
            <>
              <div
                style={{
                  transform: `rotate(${Math.min(180, (pullDistance / pullThreshold) * 180)}deg)`,
                }}
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-transform ${
                  isReadyToRelease ? 'bg-[#5E43F3] text-white' : 'bg-theme-surface-active text-theme-secondary'
                }`}
              >
                <ArrowDown className="w-3 h-3 stroke-[2.5]" />
              </div>
              <span className={isReadyToRelease ? 'text-[#5E43F3] font-bold' : 'text-theme-tertiary'}>
                {isReadyToRelease ? 'Release to refresh' : 'Pull down to update'}
              </span>
            </>
          )}
        </div>
      </div>


      {/* Nearby Feed Discovery Scope Bar */}
      {feedTab === 'nearby' && (
        <div
          id="nearby-feed-scope-bar"
          className="bg-theme-base border-b border-theme-divider/80 px-3.5 py-2.5 transition-all shadow-none"
        >
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            {/* Left Controls: Location Button + Radius Drawer Trigger + Custom Button */}
            <div className="flex items-center gap-2 shrink-0">
              {/* 1. Location Selector (Moved to this line) */}
              <button
                type="button"
                id="btn-nearby-location-trigger"
                onClick={() => setIsLocationModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-theme-base hover:bg-indigo-50/70 border border-theme-divider/80 hover:border-indigo-200 active:scale-95 transition-all cursor-pointer group min-w-0"
                title={`Change neighborhood (${location.name})`}
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5E43F3] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5E43F3]" />
                </span>
                <span className="text-xs font-bold text-theme-primary truncate max-w-[120px] sm:max-w-[170px]">
                  {location.name}
                </span>
              </button>

              {/* 2. Radius Drawer Selector */}
              <button
                type="button"
                id="btn-radius-drawer-trigger"
                onClick={() => setIsRadiusDrawerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#5E43F3]/10 hover:bg-[#5E43F3]/20 text-[#5E43F3] border border-[#5E43F3]/30 active:scale-95 transition-all cursor-pointer font-bold text-xs shadow-2xs"
                title="Select distance radius from drawer"
              >
                <span>{location.radiusKm} km</span>
                <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              {/* 3. Custom Button (Next to the Drawer) */}
              <button
                type="button"
                id="btn-radius-more-options"
                onClick={() => setIsLocationModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-theme-base hover:bg-theme-surface-hover/90 text-theme-secondary hover:text-theme-primary border border-theme-divider/80 active:scale-95 transition-all cursor-pointer font-semibold text-xs"
                title="Open custom radius & location settings"
              >
                <SlidersHorizontal className="w-3 h-3 text-theme-tertiary" />
                <span>Custom</span>
              </button>
            </div>

            {/* Right: Sort Segmented Control */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-semibold text-theme-tertiary hidden lg:inline">
                {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
              </span>

              <div className="flex items-center bg-theme-surface-hover/90 p-0.5 rounded-full border border-theme-divider/60">
                <button
                  type="button"
                  id="btn-sort-closest"
                  onClick={() => setNearbySort('closest')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    nearbySort === 'closest'
                      ? 'bg-theme-surface text-[#5E43F3] shadow-xs'
                      : 'text-theme-tertiary hover:text-theme-primary'
                  }`}
                  title="Sort by nearest distance first"
                >
                  <MapPin className="w-3 h-3" />
                  <span>Closest</span>
                </button>
                <button
                  type="button"
                  id="btn-sort-recent"
                  onClick={() => setNearbySort('recent')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    nearbySort === 'recent'
                      ? 'bg-theme-surface text-theme-primary shadow-xs'
                      : 'text-theme-tertiary hover:text-theme-primary'
                  }`}
                  title="Sort by newest posts first"
                >
                  <Clock className="w-3 h-3" />
                  <span>Recent</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Radius Selection Drawer / Bottom Sheet */}
      {isRadiusDrawerOpen && (
        <div
          id="radius-drawer-backdrop"
          onClick={() => setIsRadiusDrawerOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity animate-in fade-in duration-200"
        >
          <div
            id="radius-drawer-modal"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-theme-surface rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-250 border-t sm:border border-theme-divider"
          >
            {/* Grab Handle for mobile */}
            <div className="w-10 h-1 bg-theme-divider-strong rounded-full mx-auto sm:hidden" />

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-theme-primary font-sans">
                  Feed Distance Radius
                </h3>
                <p className="text-xs text-theme-tertiary mt-0.5">
                  Showing posts from <strong className="text-theme-primary">{location.name}</strong>
                </p>
              </div>
              <button
                type="button"
                id="btn-close-radius-drawer"
                onClick={() => setIsRadiusDrawerOpen(false)}
                className="p-1.5 rounded-full text-theme-tertiary hover:text-theme-secondary hover:bg-theme-surface-hover transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Radius Options List */}
            <div className="space-y-1.5 pt-1">
              {radiusPresets.map((r) => {
                const isSelected = location.radiusKm === r;
                return (
                  <button
                    key={r}
                    type="button"
                    id={`radius-drawer-option-${r}`}
                    onClick={() => {
                      updateRadius(r);
                      setIsRadiusDrawerOpen(false);
                    }}
                    className={`w-full p-3 rounded-xl transition-all text-left flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/80 border-2 border-[#5E43F3]'
                        : 'bg-theme-base hover:bg-theme-surface-hover/90 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-12 text-center py-1 rounded-lg text-xs font-black shrink-0 ${
                          isSelected
                            ? 'bg-[#5E43F3] text-white'
                            : 'bg-theme-surface-active/70 text-theme-primary'
                        }`}
                      >
                        {r} km
                      </span>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-[#5E43F3]' : 'text-theme-primary'}`}>
                          {radiusDescriptions[r] || `${r} kilometers away`}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#5E43F3] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Option inside Drawer */}
            <div className="pt-1 border-t border-theme-divider-light">
              <button
                type="button"
                id="btn-radius-drawer-custom"
                onClick={() => {
                  setIsRadiusDrawerOpen(false);
                  setIsLocationModalOpen(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-theme-surface-hover hover:bg-theme-surface-active/70 text-theme-primary text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-theme-secondary" />
                <span>Custom Distance Slider & Location</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      {feedTab === 'community' ? (
        <CommunityDirectory />
      ) : isFeedLoading ? (
        <FeedSkeleton />
      ) : (
        <>
          {/* Posts Stream */}
          {filteredPosts.length > 0 ? (
            <div className="divide-y divide-neutral-100 pb-8">
              {filteredPosts.map((post, index) => (
                <React.Fragment key={post.id}>
                  <PostItem post={post} />
                  {/* Inject an event card every 4 posts if there are active events */
                  index === 1 && activeEvents.length > 0 && feedTab === 'for_you' && (
                    <div className="pt-6 pb-2 px-2 sm:px-0">
                      <EventFeedCard event={activeEvents[Math.floor(Math.random() * activeEvents.length)]} />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="min-h-[62vh] flex items-center justify-center px-6 pb-8 pt-10">
              <div className="flex max-w-sm flex-col items-center text-center gap-2.5">
                <div className="w-11 h-11 rounded-full bg-theme-surface-hover text-theme-tertiary flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-theme-primary text-sm leading-snug">
                  No posts found within {location.radiusKm} km of {location.name}
                </h3>
                <p className="text-[11px] text-theme-tertiary leading-relaxed">
                  Try expanding your discovery radius to 10 km or 25 km, or share the first update from this neighborhood.
                </p>
                <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => updateRadius(Math.min(50, (location.radiusKm || 5) * 2))}
                    className="px-3.5 py-2 rounded-full border border-theme-divider-strong text-[11px] font-semibold text-theme-secondary hover:bg-theme-surface-hover cursor-pointer"
                  >
                    Expand Radius ({Math.min(50, (location.radiusKm || 5) * 2)} km)
                  </button>
                  <button
                    onClick={() => {
                      setCreateFlowType(null);
                      setIsCreateSheetOpen(false);
                      setActiveTab('create-post');
                    }}
                    className="px-3.5 py-2 rounded-full bg-[#5E43F3] text-[11px] font-bold text-white hover:bg-[#4E34E0] cursor-pointer"
                  >
                    Create Post
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
