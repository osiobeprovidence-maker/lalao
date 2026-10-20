import React, { useState, useMemo, useEffect } from 'react';
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
  Sparkles,
  Crown,
  Clock,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { EventsView } from '../events/EventsView';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { VerificationBadge } from '../common/VerificationBadge';
import { getPublicIdentityLabel } from '../common/UserIdentity';
import { CreatorRankingsView } from '../creators/CreatorRankingsView';
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
    setActiveUserProfile,
    posts,
    setIsNotificationsOpen,
    unreadNotifsCount,
    toggleFollowUser,
    setActiveCommentsPostId,
    featureFlags,
    discoverSearchQuery,
    setDiscoverSearchQuery,
  } = useLalao();

  const rawUsers = useQuery(api.social.listUsersForExplore);
  const users = rawUsers || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'people' | 'pages' | 'shop' | 'events' | 'ranking'>('people');
  const [locationMode, setLocationMode] = useState<'current' | 'selected' | 'global'>('current');
  const [isLocationModeMenuOpen, setIsLocationModeMenuOpen] = useState(false);
  const [isPlumMenuOpen, setIsPlumMenuOpen] = useState(false);
  const navigate = useNavigate();

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
    filter: activeFilter,
  });

  // Recent searches integration
  const recentSearches = useQuery(api.search.getRecentSearches, { limit: 10 });
  const recordSearch = useMutation(api.search.recordRecentSearch);
  const removeSearch = useMutation(api.search.removeRecentSearch);

  // Automatically save keyword searches when query is typed and settles
  useEffect(() => {
    const clean = debouncedQuery.trim();
    if (clean.length >= 2) {
      recordSearch({
        query: clean,
        type: 'keyword',
      }).catch(() => {});
    }
  }, [debouncedQuery, recordSearch]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const clean = searchQuery.trim();
      if (clean.length > 0) {
        setDebouncedQuery(clean);
        recordSearch({
          query: clean,
          type: 'keyword',
        }).catch(() => {});
      }
    }
  };

  const handleSelectPerson = (user: any) => {
    const displayName = getPublicIdentityLabel(user) || user.name || 'User';
    recordSearch({
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
    recordSearch({
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
    recordSearch({
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
          {['people', 'pages', 'shop', 'events', 'ranking'].map((filter) => (
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
                    removeSearch({ id: item._id });
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

      {/* Roomy Banner - Only show if not searching and roomyEnabled is true */}
      {!isSearching && featureFlags.roomyEnabled && (
        <div className="px-4 mt-4">
          <div 
            onClick={() => {
              navigate('/app/page/roomy');
            }}
            className="bg-gradient-to-br from-[#5E43F3] to-[#4E34E0] rounded-2xl p-5 cursor-pointer hover:shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center justify-between group overflow-hidden relative"
          >
            {/* Background decoration */}
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-theme-surface opacity-10 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
            
            <div>
              <h3 className="text-white font-black text-xl mb-1 flex items-center gap-2">
                <Home className="w-5 h-5" />
                Roomy
              </h3>
              <p className="text-indigo-100 text-xs max-w-[200px] leading-relaxed">
                Find rooms, roommates, and housing around you.
              </p>
            </div>
            
            <div className="w-10 h-10 rounded-full bg-theme-surface/20 flex items-center justify-center shrink-0 backdrop-blur-sm group-hover:bg-theme-surface/30 transition-colors">
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      )}

      {/* JointheQ Subscriptions Banner */}
      {!isSearching && (
        <div className="px-4 mt-3">
          <div 
            onClick={() => {
              navigate('/app/page/jointheq');
            }}
            className="bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#4338CA] rounded-2xl p-5 cursor-pointer hover:shadow-lg hover:shadow-indigo-900/30 transition-all flex items-center justify-between group overflow-hidden relative border border-indigo-500/20"
          >
            {/* Background decoration */}
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#818CF8] opacity-15 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Shared Subscriptions
                </span>
              </div>
              <h3 className="text-white font-black text-xl mb-1 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                JointheQ
              </h3>
              <p className="text-indigo-200 text-xs max-w-[220px] leading-relaxed">
                Spotify, Netflix & Apple Music groups at group rates.
              </p>
            </div>
            
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 backdrop-blur-sm group-hover:bg-white/20 transition-colors relative z-10">
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </div>
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
                {/* Search Results: People */}
                {activeFilter === 'people' && searchResults.people.length > 0 && (
                  <section className="px-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Users className="w-4 h-4 text-[#5E43F3]" />
                      <h2 className="text-sm font-bold text-theme-primary tracking-tight">People</h2>
                    </div>
                    <div className="divide-y divide-neutral-200/80">
                      {searchResults.people.map((user: any) => (
                        <div key={user.id} className="py-3.5 flex items-center justify-between gap-3">
                          <div
                            onClick={() => handleSelectPerson(user)}
                            className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                          >
                            <Avatar src={user?.avatar} alt={getPublicIdentityLabel(user)} size="md" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-sm text-theme-primary truncate">{getPublicIdentityLabel(user)}</span>
                                <VerificationBadge user={user} size="xs" />
                              </div>
                              {user.location && (
                                <div className="flex items-center gap-1.5 text-xs text-theme-tertiary mt-0.5">
                                  <span>{user.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => toggleFollowUser(user.id)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ml-2 flex items-center gap-1 ${
                              user.relationship === 'friends'
                                ? 'border border-theme-divider-strong text-theme-secondary hover:bg-theme-surface-hover'
                                : user.relationship === 'follower'
                                ? 'bg-[#5E43F3] hover:bg-[#4E34E0] text-white'
                                : user.isFollowing
                                ? 'border border-theme-divider-strong text-theme-secondary hover:bg-theme-surface-hover'
                                : 'bg-theme-inverse text-theme-text-inverse hover:bg-theme-inverse'
                            }`}
                          >
                            {user.relationship === 'friends' ? (
                              <>
                                Friends <Check className="w-3 h-3" />
                              </>
                            ) : user.relationship === 'follower' ? (
                              <>
                                Follow Back <UserPlus className="w-3 h-3" />
                              </>
                            ) : user.isFollowing ? (
                              'Following'
                            ) : (
                              'Follow'
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

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
              </>
            )}
          </div>
        ) : (
          /* =========================================
             DISCOVERY STATE (Existing Nearby logic)
             ========================================= */
          <>


            {/* People Near You */}
            {activeFilter === 'people' && (
              <section className="px-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#5E43F3]" />
                    <h2 className="text-sm font-bold text-theme-primary tracking-tight">People Near You</h2>
                    <span className="text-xs text-theme-tertiary">({filteredPeople.length})</span>
                  </div>
                </div>

                {filteredPeople.length > 0 ? (
                  <div className="divide-y divide-neutral-200/80">
                    {filteredPeople.map((user) => {
                      const distFormatted = formatDistance(user.distanceMeters, locationPrivacy?.approximateDistance);
                      const prox = getProximityCategory(user.distanceMeters);

                      return (
                        <div key={user.id} className="py-3.5 flex items-center justify-between gap-3">
                          <div
                            onClick={() => setActiveUserProfile(user)}
                            className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                          >
                            <Avatar src={user?.avatar} alt={getPublicIdentityLabel(user)} size="md" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-sm text-theme-primary truncate">{getPublicIdentityLabel(user)}</span>
                                <VerificationBadge user={user} size="xs" />
                                {(user as any).badge && <Badge type={(user as any).badge} />}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-theme-tertiary mt-0.5">
                                <span className="inline-flex items-center gap-1 text-theme-secondary font-semibold text-[11px]">
                                  <span className={`w-1.5 h-1.5 rounded-full ${prox.dotColor}`} />
                                  {distFormatted}
                                </span>
                              </div>
                              {user.bio && (
                                <p className="text-xs text-theme-secondary truncate mt-0.5 max-w-[200px]">{user.bio}</p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => toggleFollowUser(user.id)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ml-2 flex items-center gap-1 ${
                              user.relationship === 'friends'
                                ? 'border border-theme-divider-strong text-theme-secondary hover:bg-theme-surface-hover'
                                : user.relationship === 'follower'
                                ? 'bg-[#5E43F3] hover:bg-[#4E34E0] text-white'
                                : user.isFollowing
                                ? 'border border-theme-divider-strong text-theme-secondary hover:bg-theme-surface-hover'
                                : 'bg-theme-inverse text-theme-text-inverse hover:bg-theme-inverse'
                            }`}
                          >
                            {user.relationship === 'friends' ? (
                              <>
                                Friends <Check className="w-3 h-3" />
                              </>
                            ) : user.relationship === 'follower' ? (
                              <>
                                Follow Back <UserPlus className="w-3 h-3" />
                              </>
                            ) : user.isFollowing ? (
                              'Following'
                            ) : (
                              'Follow'
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-theme-base text-center border border-theme-divider-light space-y-2">
                    <p className="text-xs text-theme-secondary">
                      No people found within {location.radiusKm} km of {location.name}.
                    </p>
                    <button
                      type="button"
                      onClick={() => setLocationMode('global')}
                      className="text-xs font-bold text-[#5E43F3] hover:underline cursor-pointer"
                    >
                      Show people everywhere
                    </button>
                  </div>
                )}
              </section>
            )}

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
            {activeFilter === 'events' && <EventsView locationMode={locationMode} maxRadiusMeters={maxRadiusMeters} />}
            {activeFilter === 'ranking' && <CreatorRankingsView />}
          </>
        )}
      </div>
    </div>
  );
};

