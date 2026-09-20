
import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao, FeedTab } from '../../context/LalaoContext';
import { Post } from '../../types';
import { PostItem } from './PostItem';
import { HomePushBanner } from '../notifications/HomePushBanner';
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
  Users,
} from 'lucide-react';

export interface HomeFeedProps {
  forceTab?: FeedTab;
  hideTabs?: boolean;
  headerTitle?: string;
  headerSubtitle?: string;
}

export const HomeFeed: React.FC<HomeFeedProps> = ({ 
  forceTab, 
  hideTabs = false, 
  headerTitle, 
  headerSubtitle 
}) => {
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
    isFeedLoading,
    activeTopics,
  } = useLalao();

  // Pull to refresh state
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

  // Determine active feed tab
  const currentTab = forceTab || feedTab;

  // Real-time tab query directly targeting the active feed tab (re-executes on tab or location/radius change)
  const tabPostsQuery = useQuery(api.social.listFeedPosts, {
    feedType: currentTab,
    latitude: location.latitude,
    longitude: location.longitude,
    radiusKm: location.radiusKm,
    locationName: location.name,
  });

  const activePosts: Post[] = (tabPostsQuery as any[]) ?? posts;
  const isCurrentFeedLoading = tabPostsQuery === undefined;

  // Proximity or chronological sort
  const sortedPosts = useMemo(() => {
    if (currentTab === 'nearby' && nearbySort === 'closest') {
      return [...activePosts].sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));
    }
    return activePosts;
  }, [activePosts, currentTab, nearbySort]);


  const dynamicTopicTabs = (activeTopics || [])
    .filter((topic: any) => {
      if (!topic.homeEnabled) return false;
      const isInterested = topic.defaultEnabled || currentUser.interests?.includes(topic.slug);
      if (!isInterested) return false;
      const userPref = currentUser.homeFeedPreferences?.[topic.slug];
      if (userPref === false) return false;
      return true;
    })
    .map((topic: any) => ({
      id: topic.slug,
      label: topic.displayName,
    }));

  const tabs: { id: FeedTab; label: string }[] = [
    { id: 'for_you', label: 'For You' },
    { id: 'following', label: 'Following' },
    ...dynamicTopicTabs,
    { id: 'nearby', label: 'Nearby' },
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
      className="min-h-screen bg-[#f6f3ee] pb-20 relative select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Sticky Feed Sub-Tabs or Custom Header */}
      {hideTabs && headerTitle ? (
        <div className="px-4 pt-6 pb-3 border-b border-neutral-200/80 mb-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5E43F3]">Lalao</p>
          <h1 className="mt-1 text-2xl font-black tracking-[-0.03em] text-neutral-950">{headerTitle}</h1>
          {headerSubtitle && <p className="mt-1 text-sm text-neutral-600">{headerSubtitle}</p>}
        </div>
      ) : !hideTabs ? (
        <div className="sticky top-0 z-20 bg-[#f6f3ee]/95 backdrop-blur-md border-b border-neutral-200/80 flex items-center justify-around px-2">
          {tabs.map((tab) => {
            const isActive = (forceTab || feedTab) === tab.id;
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
                isActive ? 'text-neutral-950' : 'text-neutral-400 hover:text-neutral-700'
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
      ) : null}

      {/* Pull-to-Refresh Visual Indicator Banner */}
      <div
        style={{
          height: `${effectiveOffset}px`,
          opacity: effectiveOffset > 4 ? 1 : 0,
        }}
        className={`w-full overflow-hidden bg-gradient-to-b from-[#f8f5f1] to-[#f6f3ee] border-b border-neutral-200/80 flex items-center justify-center transition-[height,opacity] ${
          isPulling ? 'duration-0' : 'duration-300 ease-out'
        }`}
      >
        <div className="flex items-center gap-2.5 text-xs font-semibold text-neutral-600">
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

      {/* Nearby Feed Discovery Scope Bar */}
      {currentTab === 'nearby' && (
        <div
          id="nearby-feed-scope-bar"
          className="bg-[#f6f3ee] border-b border-neutral-200/80 px-3.5 py-2.5 transition-all shadow-none"
        >
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            {/* Left Controls: Location Button + Radius Drawer Trigger + Custom Button */}
            <div className="flex items-center gap-2 shrink-0">
              {/* 1. Location Selector (Moved to this line) */}
              <button
                type="button"
                id="btn-nearby-location-trigger"
                onClick={() => setIsLocationModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-50 hover:bg-indigo-50/70 border border-neutral-200/80 hover:border-indigo-200 active:scale-95 transition-all cursor-pointer group min-w-0"
                title={`Change neighborhood (${location.name})`}
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5E43F3] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5E43F3]" />
                </span>
                <span className="text-xs font-bold text-neutral-900 truncate max-w-[120px] sm:max-w-[170px]">
                  {location.name}
                </span>
              </button>

              {/* 2. Radius Drawer Selector */}
              <button
                type="button"
                id="btn-radius-drawer-trigger"
                onClick={() => setIsRadiusDrawerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50/90 hover:bg-indigo-100 text-[#5E43F3] border border-indigo-200/80 active:scale-95 transition-all cursor-pointer font-bold text-xs shadow-2xs"
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-50 hover:bg-neutral-100/90 text-neutral-600 hover:text-neutral-900 border border-neutral-200/80 active:scale-95 transition-all cursor-pointer font-semibold text-xs"
                title="Open custom radius & location settings"
              >
                <SlidersHorizontal className="w-3 h-3 text-neutral-500" />
                <span>Custom</span>
              </button>
            </div>

            {/* Right: Sort Segmented Control */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-semibold text-neutral-400 hidden lg:inline">
                {sortedPosts.length} {sortedPosts.length === 1 ? 'post' : 'posts'}
              </span>

              <div className="flex items-center bg-neutral-100/90 p-0.5 rounded-full border border-neutral-200/60">
                <button
                  type="button"
                  id="btn-sort-closest"
                  onClick={() => setNearbySort('closest')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    nearbySort === 'closest'
                      ? 'bg-white text-[#5E43F3] shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800'
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
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-800'
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
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-250 border-t sm:border border-neutral-200"
          >
            {/* Grab Handle for mobile */}
            <div className="w-10 h-1 bg-neutral-300 rounded-full mx-auto sm:hidden" />

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-neutral-950 font-sans">
                  Feed Distance Radius
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Showing posts from <strong className="text-neutral-800">{location.name}</strong>
                </p>
              </div>
              <button
                type="button"
                id="btn-close-radius-drawer"
                onClick={() => setIsRadiusDrawerOpen(false)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
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
                        : 'bg-neutral-50 hover:bg-neutral-100/90 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-12 text-center py-1 rounded-lg text-xs font-black shrink-0 ${
                          isSelected
                            ? 'bg-[#5E43F3] text-white'
                            : 'bg-neutral-200/70 text-neutral-800'
                        }`}
                      >
                        {r} km
                      </span>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-[#5E43F3]' : 'text-neutral-800'}`}>
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
            <div className="pt-1 border-t border-neutral-100">
              <button
                type="button"
                id="btn-radius-drawer-custom"
                onClick={() => {
                  setIsRadiusDrawerOpen(false);
                  setIsLocationModalOpen(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200/70 text-neutral-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-600" />
                <span>Custom Distance Slider & Location</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Web Push Notification Onboarding Banner */}
      <HomePushBanner />

      {/* Posts Stream */}
      {isCurrentFeedLoading ? (
        <div className="flex justify-center p-8 pt-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5E43F3]"></div>
        </div>
      ) : sortedPosts.length > 0 ? (
        <div className="divide-y divide-neutral-100">
          {sortedPosts.map((post) => (
            <PostItem key={post.id} post={post} />
          ))}
        </div>
      ) : currentTab === 'following' ? (
        /* Empty State: Following Tab */
        <div className="min-h-[58vh] flex items-center justify-center px-6 pb-8 pt-10">
          <div className="flex max-w-sm flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center shadow-xs">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-neutral-900 text-base leading-snug">
              Follow users to see their posts here
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-[280px]">
              When you follow creators, friends, or local pages, their latest posts will appear here.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setActiveTab('explore')}
                className="px-4 py-2 rounded-full bg-[#5E43F3] text-xs font-bold text-white hover:bg-[#4E34E0] active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                Discover People
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('discover')}
                className="px-4 py-2 rounded-full border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer"
              >
                Browse Communities
              </button>
            </div>
          </div>
        </div>
      ) : currentTab === 'nearby' ? (
        /* Empty State: Nearby Tab */
        <div className="min-h-[58vh] flex items-center justify-center px-6 pb-8 pt-10">
          <div className="flex max-w-sm flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
              <MapPin className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-neutral-900 text-base leading-snug">
              No posts found within {location.radiusKm} km of {location.name}
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-[280px]">
              Try expanding your neighborhood discovery radius or be the first to share an update from this area.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => updateRadius(Math.min(50, (location.radiusKm || 5) * 2))}
                className="px-4 py-2 rounded-full border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer"
              >
                Expand Radius ({Math.min(50, (location.radiusKm || 5) * 2)} km)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreateFlowType(null);
                  setIsCreateSheetOpen(false);
                  setActiveTab('create-post');
                }}
                className="px-4 py-2 rounded-full bg-[#5E43F3] text-xs font-bold text-white hover:bg-[#4E34E0] active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                Create Local Post
              </button>
            </div>
          </div>
        </div>
      ) : !['for_you', 'following', 'nearby'].includes(currentTab) ? (
        /* Empty State: Topic / Interest Tab */
        <div className="min-h-[58vh] flex items-center justify-center px-6 pb-8 pt-10">
          <div className="flex max-w-sm flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
              <Compass className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-neutral-900 text-base leading-snug">
              No {tabs.find((t) => t.id === currentTab)?.label || 'topic'} posts yet
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-[280px]">
              Be the first to share a post about {tabs.find((t) => t.id === currentTab)?.label || 'this topic'} or tag your post with #{currentTab}!
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setCreateFlowType(null);
                  setIsCreateSheetOpen(false);
                  setActiveTab('create-post');
                }}
                className="px-4 py-2 rounded-full bg-[#5E43F3] text-xs font-bold text-white hover:bg-[#4E34E0] active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                Post in {tabs.find((t) => t.id === currentTab)?.label || 'Topic'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State: For You Tab */
        <div className="min-h-[58vh] flex items-center justify-center px-6 pb-8 pt-10">
          <div className="flex max-w-sm flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center shadow-xs">
              <Compass className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-neutral-900 text-base leading-snug">
              Welcome to Lalao
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-[280px]">
              No posts to show right now. Share an update, rally your neighbors, or explore communities.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setCreateFlowType(null);
                  setIsCreateSheetOpen(false);
                  setActiveTab('create-post');
                }}
                className="px-4 py-2 rounded-full bg-[#5E43F3] text-xs font-bold text-white hover:bg-[#4E34E0] active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                Create First Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
