import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  X,
  TrendingUp,
  Users,
  Building,
  EyeOff,
  Filter,
  SlidersHorizontal,
  Compass,
  Heart,
  Flame,
  UserPlus,
  Check,
  Play,
  Plus,
  Home,
  ChevronRight,
  MoreVertical,
  ShieldAlert,
  Crown,
  Clock,
  MessageSquare,
  Gamepad2,
  Lightbulb,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { EventsView } from '../events/EventsView';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { VerificationBadge } from '../common/VerificationBadge';
import { getPublicIdentityLabel } from '../common/UserIdentity';
import { CreatorRankingsView } from '../creators/CreatorRankingsView';
import { VideosDiscoveryView } from './VideosDiscoveryView';
import { PostItem } from '../feed/PostItem';
import {
  calculateDistanceMeters,
  getCoordinatesForLocation,
  formatDistance,
  getProximityCategory,
} from '../../utils/locationUtils';
import { User } from '../../types';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export const DiscoverView: React.FC = () => {
  const {
    currentUser,
    location,
    locationPrivacy,
    setIsLocationModalOpen,
    setActiveTab,
    setIsCreateSheetOpen,
    setCreateFlowType,
    pages,
    toggleFollowPage,
    setActivePageId,
    setActiveGroupId,
    setActiveChatId,
    setActiveUserProfile,
    showAuthPrompt,
    posts,
    setIsNotificationsOpen,
    unreadNotifsCount,
    toggleFollowUser,
    setActiveCommentsPostId,
    featureFlags,
    discoverSearchQuery,
    setDiscoverSearchQuery,
    setActiveVideoFeedPostId,
  } = useLalao();

  const rawUsers = useQuery(api.social.listUsersForExplore);
  const users = rawUsers || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ranking' | 'pages' | 'shop' | 'events' | 'videos' | 'rooms'>('ranking');
  const [chatroomCategory, setChatroomCategory] = useState<string>('All');
  const [locationMode, setLocationMode] = useState<'current' | 'selected' | 'global'>('current');
  const [isLocationModeMenuOpen, setIsLocationModeMenuOpen] = useState(false);
  const [isPlumMenuOpen, setIsPlumMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Chatrooms query from backend
  const chatrooms = useQuery(api.groups.listDiscoverableGroups, {
    isChatroom: true,
    search: debouncedQuery || undefined,
    category: chatroomCategory !== 'All' ? chatroomCategory : undefined,
  });

  // Plum Page Discovery Preference ("I'm not interested" / "Hide this page")
  const plumHiddenPref = useQuery(api.plum.getPageDiscoveryPreference, { pageSlugOrId: 'plum' });
  const setPageDiscoveryPref = useMutation(api.plum.setPageDiscoveryPreference);
  const [localPlumHidden, setLocalPlumHidden] = useState<boolean | null>(null);
  const isPlumHidden = localPlumHidden !== null ? localPlumHidden : !!plumHiddenPref?.isHidden;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync external search query (e.g. from Recent Searches page)
  useEffect(() => {
    if (discoverSearchQuery) {
      setSearchQuery(discoverSearchQuery);
      setDebouncedQuery(discoverSearchQuery);
      setDiscoverSearchQuery('');
    }
  }, [discoverSearchQuery, setDiscoverSearchQuery]);

  // Actual backend search query
  const searchResults = useQuery(api.search.globalSearch, {
    query: debouncedQuery,
    filter: activeFilter === 'rooms' ? 'pages' : activeFilter,
  });

  // Recent searches integration
  const recentSearches = useQuery(api.search.getRecentSearches, { limit: 10 });
  const recordSearch = useMutation(api.search.recordRecentSearch);
  const removeSearch = useMutation(api.search.removeRecentSearch);
  const requestToJoinRoom = useMutation(api.groups.requestToJoin);

  const recordSearchAndMirror = useCallback(async (args: any) => {
    await recordSearch(args);
  }, [recordSearch]);

  const removeSearchAndMirror = useCallback(async (id: any) => {
    await removeSearch({ id });
  }, [removeSearch]);

  // Automatically save keyword searches when query is typed and settles
  useEffect(() => {
    const clean = debouncedQuery.trim();
    if (clean.length >= 2) {
      recordSearchAndMirror({
        query: clean,
        type: 'keyword',
      }).catch(() => {});
    }
  }, [debouncedQuery, recordSearchAndMirror]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const clean = searchQuery.trim();
      if (clean.length > 0) {
        setDebouncedQuery(clean);
        recordSearchAndMirror({
          query: clean,
          type: 'keyword',
        }).catch(() => {});
      }
    }
  };

  const handleSelectPerson = (user: any) => {
    const displayName = getPublicIdentityLabel(user) || user.name || 'User';
    recordSearchAndMirror({
      query: displayName,
      type: 'person',
      entityId: user.id || user._id,
      title: displayName,
      subtitle: user.username ? `@${user.username}` : undefined,
      avatarUrl: user.avatar,
      isVerified: user.isVerified,
      verificationTier: user.verificationTier,
    }).catch(() => {});
    setActiveUserProfile(user);
  };

  const handleSelectPage = (page: any) => {
    recordSearchAndMirror({
      query: page.name || 'Page',
      type: 'page',
      entityId: page.id || page._id,
      title: page.name,
      subtitle: page.category || (page.username ? `@${page.username}` : undefined),
      avatarUrl: page.avatar,
    }).catch(() => {});
    navigate('/app/page/' + (page.id || page._id));
  };

  const handleSelectPlum = () => {
    recordSearchAndMirror({
      query: 'Plum',
      type: 'page',
      entityId: 'plum',
      title: 'Plum',
      subtitle: 'Dating & Connections (18+)',
    }).catch(() => {});
    setActiveTab('plum');
  };

  // Removed local toggleFollowUser and people state.
  // Using global toggleFollowUser and users from context.

  const trendingTopics = useMemo(() => {
    const topicMap = new Map<string, { count: number; location: string }>();

    posts.forEach((post) => {
      const matches = post.text.match(/#[A-Za-z0-9_]+/g);
      if (matches) {
        matches.forEach((tag: string) => {
          const key = tag.toLowerCase();
          const entry = topicMap.get(key) ?? { count: 0, location: post.location || location.name };
          entry.count += 1;
          entry.location = post.location || entry.location;
          topicMap.set(key, entry);
        });
      }
    });

    return Array.from(topicMap.entries())
      .map(([tag, data]) => ({
        tag,
        postsCount: `${data.count} post${data.count === 1 ? '' : 's'}`,
        location: data.location,
      }))
      .sort((a, b) => b.postsCount.localeCompare(a.postsCount))
      .slice(0, 4);
  }, [posts, location.name]);

  const userCoords = useMemo(() => {
    return {
      lat: location.latitude ?? getCoordinatesForLocation(location.name).lat,
      lng: location.longitude ?? getCoordinatesForLocation(location.name).lng,
    };
  }, [location.name, location.latitude, location.longitude]);

  const maxRadiusMeters = location.radiusKm * 1000;

  // Compute distance for people
  const nearbyPeople = useMemo(() => {
    if (!users || !location) return [];

    const activeCoords = {
      lat: location.latitude ?? getCoordinatesForLocation(location.name).lat,
      lng: location.longitude ?? getCoordinatesForLocation(location.name).lng,
    };

    const viewerLocLower = location.name.toLowerCase().trim();

    return users
      .filter((user) => user.id !== currentUser?.id)
      .map((user) => {
        let uLat = user.latitude;
        let uLng = user.longitude;

        // If the user has GPS coordinates, compute exact distance
        if (uLat && uLng && activeCoords.lat && activeCoords.lng) {
          const distance = calculateDistanceMeters(activeCoords.lat, activeCoords.lng, uLat, uLng);
          return { ...user, distanceMeters: distance };
        }

        // Fallback 1: resolve locationName to known hub coordinates
        if (user.location) {
          const fallbackCoords = getCoordinatesForLocation(user.location);
          if (fallbackCoords.lat && fallbackCoords.lng && activeCoords.lat && activeCoords.lng) {
            const distance = calculateDistanceMeters(activeCoords.lat, activeCoords.lng, fallbackCoords.lat, fallbackCoords.lng);
            return { ...user, distanceMeters: distance };
          }

          // Fallback 2: string overlap match — same city/area = treat as nearby
          const userLocLower = user.location.toLowerCase().trim();
          if (
            userLocLower &&
            viewerLocLower &&
            (userLocLower.includes(viewerLocLower) || viewerLocLower.includes(userLocLower))
          ) {
            // Same location name — treat as same area (200m nominal distance)
            return { ...user, distanceMeters: 200 };
          }
        }

        // No usable location data — return with Infinity distance so they show up in global mode at the end
        return { ...user, distanceMeters: Infinity };
      })
      .filter((user): user is any => user !== null)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }, [users, location, currentUser?.id, maxRadiusMeters]);


  const filteredPeople = useMemo(() => {
    return (nearbyPeople || [])
      .filter((p) => {
        if (locationMode === 'global') return true;
        return p.distanceMeters <= maxRadiusMeters;
      })
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }, [nearbyPeople, locationMode, maxRadiusMeters]);

  // Filtered lists based on discovery radius
  const baseFilteredPages = useMemo(() => {
    return (pages || [])
      .filter((p: any) => {
        // Global or national businesses are always visible
        if (locationMode === 'global' || p.globalDiscoveryStatus === "global" || p.globalDiscoveryStatus === "national") {
          return true;
        }
        // Online businesses might be globally visible too
        if (p.isOnlineBusiness) {
          return true;
        }

        if (p.distanceMeters !== undefined) {
          return p.distanceMeters <= maxRadiusMeters;
        }
        return true;
      })
      .sort((a: any, b: any) => {
        // Boost local/nearby businesses, but also show global ones
        const aDist = a.distanceMeters ?? Infinity;
        const bDist = b.distanceMeters ?? Infinity;
        return aDist - bDist;
      });
  }, [pages, locationMode, maxRadiusMeters]);

  const filteredPages = useMemo(() => baseFilteredPages.filter((p: any) => p.type !== 'business'), [baseFilteredPages]);
  const filteredShop = useMemo(() => baseFilteredPages.filter((p: any) => p.type === 'business'), [baseFilteredPages]);

  const nearbyPosts = useMemo(() => {
    return (posts || [])
      .filter((post) => locationMode === 'global' || post.distanceMeters <= maxRadiusMeters)
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, 2);
  }, [posts, locationMode, maxRadiusMeters]);

  const videoPosts = useMemo(() => {
    return (posts || []).filter(
      (post) => post.mediaType === 'video' && (locationMode === 'global' || post.distanceMeters <= maxRadiusMeters)
    );
  }, [posts, locationMode, maxRadiusMeters]);

  const isSearching = debouncedQuery.length > 0;

  return (
    <div id="discover-view-container" className="min-h-screen bg-theme-base pb-24">
      {/* Top Search Header */}
      <div className="sticky top-0 z-20 bg-theme-base/95 backdrop-blur-md border-b border-theme-divider/80 px-4 py-2.5 space-y-2">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-theme-tertiary absolute left-3 pointer-events-none" />
            <input
              id="input-discover-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={`Search people, content, pages...`}
              className="w-full pl-9 pr-9 py-2 rounded-full bg-theme-surface-hover hover:bg-theme-surface-active/60 focus:bg-theme-surface focus:ring-2 focus:ring-[#5E43F3]/20 focus:border-[#5E43F3] border border-transparent text-sm text-theme-primary placeholder:text-theme-tertiary transition-all outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-1 rounded-full text-theme-tertiary hover:text-theme-secondary cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              id="btn-discover-location-mode"
              onClick={() => setIsLocationModeMenuOpen(!isLocationModeMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#5E43F3]/10 hover:bg-[#5E43F3]/20 text-xs font-bold text-[#5E43F3] border border-[#5E43F3]/30 active:scale-95 transition-all shrink-0 cursor-pointer shadow-xs"
            >
              {locationMode === 'global' ? (
                <Compass className="w-3.5 h-3.5 text-[#5E43F3] shrink-0" />
              ) : (
                <MapPin className="w-3.5 h-3.5 text-[#5E43F3] shrink-0" />
              )}
              <span className="font-bold tracking-tight">
                {locationMode === 'global' ? 'Global' : locationMode === 'selected' ? 'Selected Area' : `≤ ${location.radiusKm} km`}
              </span>
            </button>

            {isLocationModeMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-theme-surface rounded-xl shadow-xl border border-theme-divider-light overflow-hidden z-50">
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => {
                      setLocationMode('current');
                      setIsLocationModeMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      locationMode === 'current' ? 'bg-[#5E43F3]/10 text-[#5E43F3]' : 'text-theme-secondary hover:bg-theme-base'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>Nearby (≤ {location.radiusKm} km)</span>
                    </div>
                    {locationMode === 'current' && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => {
                      setLocationMode('selected');
                      setIsLocationModeMenuOpen(false);
                      setActiveTab('location');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      locationMode === 'selected' ? 'bg-[#5E43F3]/10 text-[#5E43F3]' : 'text-theme-secondary hover:bg-theme-base'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      <span>Custom Area</span>
                    </div>
                    {locationMode === 'selected' && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => {
                      setLocationMode('global');
                      setIsLocationModeMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      locationMode === 'global' ? 'bg-[#5E43F3]/10 text-[#5E43F3]' : 'text-theme-secondary hover:bg-theme-base'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4" />
                      <span>Global</span>
                    </div>
                    {locationMode === 'global' && <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {['ranking', 'pages', 'shop', 'events', 'videos', 'rooms'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === filter
                  ? 'bg-theme-inverse text-theme-text-inverse shadow-sm'
                  : 'bg-theme-surface text-theme-secondary border border-theme-divider/80 hover:bg-theme-base hover:text-theme-primary'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Searches Section (when not actively searching) */}
      {!isSearching && recentSearches && recentSearches.length > 0 && (
        <div id="discover-recent-searches-section" className="px-4 mt-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-theme-tertiary" />
              <span className="text-xs font-bold text-theme-primary">Recent Searches</span>
            </div>
            <button
              id="btn-discover-view-all-recent"
              type="button"
              onClick={() => setActiveTab('recent-searches')}
              className="text-[11px] font-bold text-[#5E43F3] hover:text-[#4E34E0] transition-colors cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {recentSearches.slice(0, 8).map((item) => (
              <div
                key={item._id}
                id={`quick-recent-${item._id}`}
                onClick={() => {
                  if (item.type === 'person') {
                    setActiveUserProfile({
                      id: item.entityId,
                      _id: item.entityId,
                      name: item.title || item.query,
                      username: (item.subtitle || '').replace(/^@/, ''),
                      avatar: item.avatarUrl,
                      isVerified: item.isVerified,
                      verificationTier: item.verificationTier,
                    } as any);
                  } else if (item.type === 'page' || item.type === 'shop') {
                    if (item.entityId === 'plum') {
                      setActiveTab('plum');
                    } else if (item.entityId) {
                      navigate(`/app/page/${item.entityId}`);
                    } else {
                      setSearchQuery(item.query);
                      setDebouncedQuery(item.query);
                    }
                  } else {
                    setSearchQuery(item.query);
                    setDebouncedQuery(item.query);
                  }
                }}
                className="group flex items-center gap-2 pl-2 pr-1.5 py-1.5 rounded-full bg-theme-surface hover:bg-theme-surface-hover border border-theme-divider/80 transition-all cursor-pointer shrink-0 shadow-2xs"
              >
                {item.type === 'person' ? (
                  <Avatar src={item.avatarUrl} alt={item.title || item.query} size="xs" />
                ) : item.type === 'page' && item.avatarUrl ? (
                  <Avatar src={item.avatarUrl} alt={item.title || item.query} size="xs" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center">
                    <Clock className="w-3 h-3" />
                  </div>
                )}
                <span className="text-xs font-semibold text-theme-primary max-w-[120px] truncate">
                  {item.title || item.query}
                </span>
                <button
                  type="button"
                  id={`btn-remove-quick-search-${item._id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    void removeSearchAndMirror(item._id).catch(() => {});
                  }}
                  className="w-4 h-4 rounded-full flex items-center justify-center text-theme-tertiary hover:text-red-500 hover:bg-red-500/10 transition-colors ml-0.5 cursor-pointer"
                  title="Remove"
                >
                  <X className="w-3 h-3 stroke-[2.5]" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ghost Mode Notice if active and NOT searching */}
      {locationPrivacy?.ghostMode && !isSearching && (
        <div className="mx-4 mt-3 p-2.5 rounded-xl bg-purple-50 border border-purple-100 flex items-center gap-2 text-xs text-purple-900">
          <EyeOff className="w-4 h-4 text-purple-600 shrink-0" />
          <span>
            <strong>Ghost Mode is active:</strong> You are invisible in &ldquo;People Near You&rdquo; while exploring.
          </span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="space-y-6 pt-3">
        {/* =========================================
            SEARCH STATE 
            ========================================= */}
        {isSearching ? (
          <div className="space-y-6">
            <div className="px-4 pb-2">
              <h2 className="text-sm font-bold text-theme-primary">Search results for "{debouncedQuery}"</h2>
            </div>
            
            {(activeFilter as any) === 'trending' ? (
              <div className="px-4 py-8 text-center space-y-2">
                 <p className="text-sm font-bold text-theme-primary">Search for this type of content isn't available yet.</p>
                 <p className="text-xs text-theme-tertiary">We're working on bringing Trending searches to Lalao.</p>
              </div>
            ) : searchResults === undefined ? (
              <div className="flex justify-center p-8">
                <div className="w-6 h-6 border-2 border-[#5E43F3] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (searchResults.people.length === 0 && searchResults.content.length === 0 && searchResults.pages.length === 0) ? (
              <div className="px-4 py-8 text-center space-y-2">
                <p className="text-sm font-bold text-theme-primary">No results found for "{debouncedQuery}".</p>
                <p className="text-xs text-theme-tertiary">Try searching for a different name, username, or keyword.</p>
              </div>
            ) : (
              <>
                {/* Search Results: Pages & Shop */}
                {(activeFilter === 'pages' || activeFilter === 'shop') && searchResults.pages.length > 0 && (
                  <section className="px-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Building className="w-4 h-4 text-[#5E43F3]" />
                      <h2 className="text-sm font-bold text-theme-primary tracking-tight">Pages & Businesses</h2>
                    </div>
                    <div className="divide-y divide-neutral-200/80">
                      {/* Explicit Search Match for Plum */}
                      {'plum'.includes(debouncedQuery.toLowerCase()) || 'dating'.includes(debouncedQuery.toLowerCase()) ? (
                        <div 
                          className="py-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-theme-base/50 transition-colors"
                          onClick={handleSelectPlum}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7B1FA2] via-[#C2185B] to-[#FF4081] flex items-center justify-center text-white shrink-0 shadow-sm">
                              <Flame className="w-5 h-5 stroke-[2.2]" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-bold text-sm text-theme-primary truncate">Plum</h3>
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-pink-500/10 text-pink-500 border border-pink-500/20">
                                  18+ DATING
                                </span>
                              </div>
                              <p className="text-xs text-theme-tertiary truncate">@plum</p>
                              <p className="text-[11px] text-[#5E43F3] mt-0.5">Dating & Connections</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab('plum');
                            }}
                            className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer bg-[#5E43F3] text-white hover:bg-[#4E34E0]"
                          >
                            Enter
                          </button>
                        </div>
                      ) : null}

                      {searchResults.pages.map((page: any) => (
                        <div 
                          key={page.id} 
                          className="py-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-theme-base/50 transition-colors"
                          onClick={() => handleSelectPage(page)}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar src={page?.avatar} alt={page?.name || 'Page'} size="md" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-bold text-sm text-theme-primary truncate">{page.name}</h3>
                                {page.badge && <Badge type={page.badge} />}
                              </div>
                              <p className="text-xs text-theme-tertiary truncate">@{page.username}</p>
                              {page.category && <p className="text-[11px] text-[#5E43F3] mt-0.5">{page.category}</p>}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFollowPage(page.id);
                            }}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              page.isFollowing
                                ? 'border border-theme-divider-strong text-theme-secondary hover:bg-theme-surface-hover'
                                : 'bg-[#5E43F3] text-white hover:bg-[#4E34E0]'
                            }`}
                          >
                            {page.isFollowing ? 'Following' : 'Follow'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Search Results: Videos */}
                {activeFilter === 'videos' && searchResults.content.length > 0 && (
                  <section className="px-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Play className="w-4 h-4 text-[#5E43F3]" />
                      <h2 className="text-sm font-bold text-theme-primary tracking-tight">Videos</h2>
                      <span className="text-xs text-theme-tertiary">({searchResults.content.length})</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {searchResults.content.map((post: any) => {
                        const thumbnailUrl = post.muxPlaybackId
                          ? `https://image.mux.com/${post.muxPlaybackId}/thumbnail.jpg?time=0`
                          : post.mediaUrl;
                        return (
                          <div
                            key={post.id}
                            onClick={() => setActiveVideoFeedPostId(post.id)}
                            className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-theme-surface border border-theme-divider/70 cursor-pointer shadow-2xs hover:shadow-md hover:border-[#5E43F3]/50 transition-all"
                          >
                            {thumbnailUrl ? (
                              <img
                                src={thumbnailUrl}
                                alt={post.text || 'Video'}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-black/80 flex items-center justify-center">
                                <Play className="w-10 h-10 text-white/40" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10 group-hover:from-black/90 transition-colors pointer-events-none" />
                            <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white shadow-sm group-hover:bg-[#5E43F3] group-hover:scale-110 transition-all pointer-events-none">
                              <Play className="w-3.5 h-3.5 fill-white translate-x-0.5" />
                            </div>
                            <div className="absolute inset-x-0 bottom-0 p-2.5 text-white pointer-events-none">
                              {post.author && (
                                <div className="flex items-center gap-1.5 mb-1 min-w-0">
                                  <Avatar src={post.author.avatar} alt={getPublicIdentityLabel(post.author)} size="xs" />
                                  <span className="text-[11px] font-semibold text-white/95 truncate">{getPublicIdentityLabel(post.author)}</span>
                                </div>
                              )}
                              {post.text && <p className="text-[11px] text-white/80 line-clamp-2 leading-tight mb-1 font-normal">{post.text}</p>}
                              <div className="flex items-center gap-3 text-[10px] text-white/75 font-medium">
                                <div className="flex items-center gap-1">
                                  <Heart className="w-3 h-3 fill-white/60 text-white/60" />
                                  <span>{post.likesCount || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        ) : (
          /* =========================================
             DISCOVERY STATE (Existing Nearby logic)
             ========================================= */
          <>


            {/* Local Pages or Shop */}
            {(activeFilter === 'pages' || activeFilter === 'shop') && (
              <section className="px-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-[#5E43F3]" />
                    <h2 className="text-sm font-bold text-theme-primary tracking-tight">
                      {activeFilter === 'pages' ? 'Local Pages' : 'Local Shops & Businesses'}
                    </h2>
                    <span className="text-xs text-theme-tertiary">
                      ({activeFilter === 'pages' ? (filteredPages.length + (isPlumHidden ? 0 : 1)) : filteredShop.length})
                    </span>
                  </div>
                </div>

                {/* FEATURED / RECOMMENDATION: PLUM DATING PAGE (when activeFilter is 'pages' and not hidden) */}
                {activeFilter === 'pages' && !isPlumHidden && (
                  <div className="mb-4 overflow-hidden rounded-2xl border border-pink-500/25 bg-gradient-to-br from-[#2a0845]/15 via-theme-surface to-theme-surface shadow-md hover:border-pink-500/40 transition-all">
                    {/* Plum Card Banner */}
                    <div 
                      onClick={() => setActiveTab('plum')}
                      className="relative h-28 sm:h-32 w-full cursor-pointer bg-gradient-to-r from-[#8E24AA] via-[#E91E63] to-[#FF4081] overflow-hidden"
                    >
                      <img
                        src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&auto=format&fit=crop&q=80"
                        alt="Plum Dating Cover"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover opacity-80 hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-pink-400 border border-pink-500/30">
                          <Flame className="w-3 h-3 text-pink-400" /> 18+ Dating
                        </span>

                        {/* Three dot context menu for "I'm not interested" */}
                        <div className="relative">
                          <button
                            id="btn-plum-card-more-menu"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsPlumMenuOpen((prev) => !prev);
                            }}
                            className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md shadow-sm transition-all cursor-pointer"
                            title="Page options"
                            aria-label="Plum options"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {isPlumMenuOpen && (
                            <div 
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-8 z-30 w-44 rounded-xl border border-theme-divider bg-theme-surface p-1 shadow-xl animate-in fade-in zoom-in-95"
                            >
                              <button
                                id="btn-plum-not-interested"
                                type="button"
                                onClick={async () => {
                                  setIsPlumMenuOpen(false);
                                  setLocalPlumHidden(true);
                                  try {
                                    await setPageDiscoveryPref({ pageSlugOrId: 'plum', hidden: true });
                                  } catch (e) {
                                    console.error('Failed to hide Plum from recommendations', e);
                                  }
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer text-left"
                              >
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>I'm not interested</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Plum Card Info */}
                    <div 
                      onClick={() => setActiveTab('plum')}
                      className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7B1FA2] via-[#C2185B] to-[#FF4081] flex items-center justify-center text-white shadow-md shadow-pink-500/20 shrink-0 ring-2 ring-pink-500/20">
                          <Flame className="w-6 h-6 stroke-[2.2]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-black text-sm text-theme-primary truncate">Plum</h3>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-pink-500/10 text-pink-500 border border-pink-500/20">
                              PAGE
                            </span>
                          </div>
                          <p className="text-xs text-theme-secondary line-clamp-1 mt-0.5">
                            Meet genuine connections, date, and discover compatible partners in LaLao.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab('plum');
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#8E24AA] via-[#E91E63] to-[#FF4081] shadow-md shadow-pink-500/20 hover:opacity-95 active:scale-95 transition-all cursor-pointer shrink-0"
                      >
                        Enter Plum
                      </button>
                    </div>
                  </div>
                )}

                {(filteredPages.length > 0 || (activeFilter === 'pages' && !isPlumHidden)) ? (
                  <div className="divide-y divide-neutral-200/80">
                    {(activeFilter === 'pages' ? filteredPages : filteredShop).map((page) => {
                      const distFormatted =
                        page.distanceMeters !== undefined
                          ? formatDistance(page.distanceMeters, locationPrivacy?.approximateDistance)
                          : null;
                      const prox =
                        page.distanceMeters !== undefined ? getProximityCategory(page.distanceMeters) : null;

                      return (
                        <div 
                          key={page.id} 
                          className="py-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-theme-base/50 transition-colors"
                          onClick={() => navigate('/app/page/' + page.id)}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar src={page?.avatar} alt={page?.name || 'Page'} size="md" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-bold text-sm text-theme-primary truncate">{page.name}</h3>
                                {page.badge && <Badge type={page.badge} />}
                              </div>
                              <p className="text-xs text-theme-tertiary truncate">@{page.username}</p>
                              <div className="flex items-center gap-1.5 text-[11px] text-theme-tertiary mt-0.5 flex-wrap">
                                {prox && <span className={`w-1.5 h-1.5 rounded-full ${prox.dotColor}`} />}
                                <MapPin className="w-3 h-3 text-[#5E43F3]" />
                                <span>{page.location}</span>
                                {distFormatted && <span>· {distFormatted}</span>}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFollowPage(page.id);
                            }}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              page.isFollowing
                                ? 'border border-theme-divider-strong text-theme-secondary hover:bg-theme-surface-hover'
                                : 'bg-[#5E43F3] text-white hover:bg-[#4E34E0]'
                            }`}
                          >
                            {page.isFollowing ? 'Following' : 'Follow'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-theme-base text-center border border-theme-divider-light space-y-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-theme-surface flex items-center justify-center mb-1 border border-theme-divider-light shadow-sm">
                      <Building className="w-5 h-5 text-[#5E43F3]" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-theme-primary mb-1">
                        No local {activeFilter === 'pages' ? 'Pages' : 'Shops'} found
                      </p>
                      <p className="text-[11px] text-theme-tertiary leading-relaxed max-w-[280px] mx-auto">
                        No local {activeFilter === 'pages' ? 'Pages' : 'Shops'} found within {location.radiusKm} km of {location.name}.
                        <br/><br/>
                        Be the first to create one in your area and let people nearby discover you.
                      </p>
                    </div>
                    
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('create-page');
                        }}
                        className="w-full max-w-[220px] mx-auto py-2.5 rounded-xl bg-[#5E43F3] text-white text-xs font-bold hover:bg-[#4E34E0] transition-colors"
                      >
                        Create a {activeFilter === 'pages' ? 'Page' : 'Shop'}
                      </button>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => setLocationMode('global')}
                      className="block mx-auto text-[11px] font-bold text-[#5E43F3] hover:underline"
                    >
                      Show everywhere
                    </button>
                  </div>
                )}
              </section>
            )}
            {/* CHATROOMS SECTION */}
            {activeFilter === 'rooms' && (
              <section className="px-4 space-y-4">
                {/* Header & Short Description */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#5E43F3]/10 flex items-center justify-center text-[#5E43F3]">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-black text-theme-primary tracking-tight">
                        LaLao Chatrooms
                      </h2>
                      <p className="text-[11px] text-theme-tertiary">
                        Join open community spaces, talk with friends, and discover lively discussions.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Category Pills for Chatrooms */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {['All', 'General', 'Social', 'Entertainment', 'Discussion', 'Nigeria'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setChatroomCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        chatroomCategory === cat
                          ? 'bg-[#5E43F3] text-white shadow-xs'
                          : 'bg-theme-surface text-theme-secondary border border-theme-divider hover:bg-theme-base'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Room List States */}
                {chatrooms === undefined ? (
                  <div className="flex justify-center p-10">
                    <div className="w-6 h-6 border-2 border-[#5E43F3] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : chatrooms.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-theme-surface text-center border border-theme-divider space-y-2">
                    <p className="text-sm font-bold text-theme-primary">No chatrooms found</p>
                    <p className="text-xs text-theme-tertiary">Try searching with a different room name or category.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chatrooms.map((room: any) => {
                      const getRoomIcon = (iconName?: string) => {
                        switch (iconName) {
                          case 'Users':
                            return <Users className="w-5 h-5 text-[#5E43F3]" />;
                          case 'UserPlus':
                            return <UserPlus className="w-5 h-5 text-emerald-400" />;
                          case 'Gamepad2':
                            return <Gamepad2 className="w-5 h-5 text-purple-400" />;
                          case 'Lightbulb':
                            return <Lightbulb className="w-5 h-5 text-amber-400" />;
                          case 'MapPin':
                            return <MapPin className="w-5 h-5 text-rose-400" />;
                          default:
                            return <MessageSquare className="w-5 h-5 text-[#5E43F3]" />;
                        }
                      };

                      return (
                        <div
                          key={room.id}
                          id={`chatroom-card-${room.id}`}
                          onClick={() => {
                            setActiveGroupId(room.id);
                          }}
                          className="group relative overflow-hidden rounded-2xl border border-theme-divider bg-theme-surface hover:border-[#5E43F3]/50 transition-all cursor-pointer shadow-xs hover:shadow-md"
                        >
                          {/* Banner Cover */}
                          <div className="relative h-24 w-full bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 overflow-hidden">
                            {room.coverImage && (
                              <img
                                src={room.coverImage}
                                alt={room.name}
                                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                            <div className="absolute top-2.5 right-2.5">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-[#5E43F3] border border-[#5E43F3]/30">
                                {room.category}
                              </span>
                            </div>
                          </div>

                          {/* Content Body */}
                          <div className="p-3.5 sm:p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-11 h-11 rounded-2xl bg-black/40 border border-theme-divider flex items-center justify-center shrink-0 shadow-sm">
                                  {getRoomIcon(room.roomIcon)}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-black text-sm text-theme-primary truncate">
                                      {room.name}
                                    </h3>
                                    {room.isMember && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        JOINED
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-theme-tertiary font-mono">@{room.username}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {room.isMember ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveGroupId(room.id);
                                    }}
                                    className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-theme-surface border border-theme-divider hover:bg-theme-surface-hover transition-colors shrink-0 cursor-pointer shadow-xs"
                                  >
                                    View Room
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (!currentUser) {
                                        showAuthPrompt('Sign in to join this room');
                                        return;
                                      }
                                      try {
                                        const res = await requestToJoinRoom({ groupId: room.id });
                                        if (res.conversationId) {
                                          setActiveChatId(res.conversationId);
                                        } else {
                                          setActiveGroupId(room.id);
                                        }
                                      } catch (err: any) {
                                        console.error(err);
                                      }
                                    }}
                                    className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-[#5E43F3] hover:bg-[#4E34E0] transition-colors shrink-0 cursor-pointer shadow-xs"
                                  >
                                    Join Room
                                  </button>
                                )}
                              </div>
                            </div>

                            {room.description && (
                              <p className="text-xs text-theme-secondary mt-2.5 line-clamp-2 leading-relaxed">
                                {room.description}
                              </p>
                            )}

                            {/* Genuine Member count */}
                            <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-theme-divider text-[11px] text-theme-tertiary">
                              <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-theme-tertiary" />
                                <span>
                                  <strong className="text-theme-primary font-bold">{room.memberCount}</strong> {room.memberCount === 1 ? 'member' : 'members'}
                                </span>
                              </div>
                              <span>·</span>
                              <span className="text-emerald-500 font-semibold">Active Room</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
            {activeFilter === 'events' && <EventsView locationMode={locationMode} maxRadiusMeters={maxRadiusMeters} />}
            {activeFilter === 'ranking' && <CreatorRankingsView />}
            {activeFilter === 'videos' && <VideosDiscoveryView />}
          </>
        )}
      </div>
    </div>
  );
};

