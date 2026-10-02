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
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { EventsView } from '../events/EventsView';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { PostItem } from '../feed/PostItem';
import {
  calculateDistanceMeters,
  getCoordinatesForLocation,
  formatDistance,
  getProximityCategory,
} from '../../utils/locationUtils';
import { User } from '../../types';
import { useQuery } from 'convex/react';
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
  } = useLalao();

  const rawUsers = useQuery(api.social.listUsersForExplore);
  const users = rawUsers || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'people' | 'pages' | 'shop' | 'events'>('people');
  const [locationMode, setLocationMode] = useState<'current' | 'selected' | 'global'>('current');
  const [isLocationModeMenuOpen, setIsLocationModeMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Actual backend search query
  const searchResults = useQuery(api.search.globalSearch, {
    query: debouncedQuery,
    filter: activeFilter,
  });

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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50/90 hover:bg-indigo-100 text-xs font-bold text-[#5E43F3] border border-indigo-200/80 active:scale-95 transition-all shrink-0 cursor-pointer shadow-xs"
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
                      setIsLocationModalOpen(true);
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
          {['people', 'pages', 'shop', 'events'].map((filter) => (
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
            
            {activeFilter === 'trending' ? (
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
                            onClick={() => setActiveUserProfile(user)}
                            className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                          >
                            <Avatar src={user?.avatar} alt={user?.name || 'User'} size="md" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-sm text-theme-primary truncate">{user.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-theme-tertiary mt-0.5">
                                <span className="truncate">@{user.username}</span>
                                {user.location && (
                                  <>
                                    <span>·</span>
                                    <span>{user.location}</span>
                                  </>
                                )}
                              </div>
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
                      {searchResults.pages.map((page: any) => (
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
                            <Avatar src={user?.avatar} alt={user?.name || 'User'} size="md" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-sm text-theme-primary truncate">{user.name}</span>
                                {(user as any).badge && <Badge type={(user as any).badge} />}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-theme-tertiary mt-0.5">
                                <span className="truncate">@{user.username}</span>
                                <span>·</span>
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
                      ({activeFilter === 'pages' ? filteredPages.length : filteredShop.length})
                    </span>
                  </div>
                </div>

                {(activeFilter === 'pages' ? filteredPages : filteredShop).length > 0 ? (
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
          </>
        )}
      </div>
    </div>
  );
};
