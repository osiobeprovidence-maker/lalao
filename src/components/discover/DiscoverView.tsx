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
  } = useLalao();

  const rawUsers = useQuery(api.social.listUsersForExplore);
  const users = rawUsers || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'people' | 'pages' | 'video' | 'trending'>('all');
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

    if (!activeCoords.lat || !activeCoords.lng) return [];

    return users
      .filter((user) => user.id !== currentUser?.id)
      .map((user) => {
        let uLat = user.latitude;
        let uLng = user.longitude;
        
        // Fallback to resolving the location name if no exact coordinates
        if (!uLat || !uLng) {
            if (user.location) {
                const fallbackCoords = getCoordinatesForLocation(user.location);
                uLat = fallbackCoords.lat;
                uLng = fallbackCoords.lng;
            }
        }

        if (!uLat || !uLng) return null;

        const distance = calculateDistanceMeters(
          activeCoords.lat,
          activeCoords.lng,
          uLat,
          uLng
        );
        return { ...user, distanceMeters: distance };
      })
      .filter((user): user is User & { distanceMeters: number } => user !== null && user.distanceMeters <= maxRadiusMeters)
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
  const filteredPages = useMemo(() => {
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

  const nearbyPosts = useMemo(() => {
    return (posts || [])
      .filter((post) => post.distanceMeters <= maxRadiusMeters)
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, 2);
  }, [posts, maxRadiusMeters]);

  const videoPosts = useMemo(() => {
    return (posts || []).filter(
      (post) => post.mediaType === 'video' && post.distanceMeters <= maxRadiusMeters
    );
  }, [posts, maxRadiusMeters]);

  const isSearching = debouncedQuery.length > 0;

  return (
    <div id="discover-view-container" className="min-h-screen bg-[#f6f3ee] pb-24">
      {/* Top Search Header */}
      <div className="sticky top-0 z-20 bg-[#f6f3ee]/95 backdrop-blur-md border-b border-neutral-200/80 px-4 py-2.5 space-y-2">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
            <input
              id="input-discover-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search people, content, pages...`}
              className="w-full pl-9 pr-9 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200/60 focus:bg-white focus:ring-2 focus:ring-[#5E43F3]/20 focus:border-[#5E43F3] border border-transparent text-sm text-neutral-900 placeholder:text-neutral-400 transition-all outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-1 rounded-full text-neutral-400 hover:text-neutral-600 cursor-pointer"
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
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-neutral-100 overflow-hidden z-50">
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => {
                      setLocationMode('current');
                      setIsLocationModeMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      locationMode === 'current' ? 'bg-[#5E43F3]/10 text-[#5E43F3]' : 'text-neutral-700 hover:bg-neutral-50'
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
                      locationMode === 'selected' ? 'bg-[#5E43F3]/10 text-[#5E43F3]' : 'text-neutral-700 hover:bg-neutral-50'
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
                      locationMode === 'global' ? 'bg-[#5E43F3]/10 text-[#5E43F3]' : 'text-neutral-700 hover:bg-neutral-50'
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
          {['all', 'people', 'pages', 'video', 'trending'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === filter
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'bg-white text-neutral-600 border border-neutral-200/80 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1).replace('pages', 'Pages & Businesses')}
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

      {/* Roomy Banner - Only show if not searching */}
      {!isSearching && (
        <div className="px-4 mt-4">
          <div 
            onClick={() => {
              navigate('/app/page/roomy');
            }}
            className="bg-gradient-to-br from-[#5E43F3] to-[#4E34E0] rounded-2xl p-5 cursor-pointer hover:shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center justify-between group overflow-hidden relative"
          >
            {/* Background decoration */}
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
            
            <div>
              <h3 className="text-white font-black text-xl mb-1 flex items-center gap-2">
                <Home className="w-5 h-5" />
                Roomy
              </h3>
              <p className="text-indigo-100 text-xs max-w-[200px] leading-relaxed">
                Find rooms, roommates, and housing around you.
              </p>
            </div>
            
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm group-hover:bg-white/30 transition-colors">
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
              <h2 className="text-sm font-bold text-neutral-900">Search results for "{debouncedQuery}"</h2>
            </div>
            
            {activeFilter === 'trending' ? (
              <div className="px-4 py-8 text-center space-y-2">
                 <p className="text-sm font-bold text-neutral-900">Search for this type of content isn't available yet.</p>
                 <p className="text-xs text-neutral-500">We're working on bringing Trending searches to Lalao.</p>
              </div>
            ) : searchResults === undefined ? (
              <div className="flex justify-center p-8">
                <div className="w-6 h-6 border-2 border-[#5E43F3] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (searchResults.people.length === 0 && searchResults.content.length === 0 && searchResults.pages.length === 0) ? (
              <div className="px-4 py-8 text-center space-y-2">
                <p className="text-sm font-bold text-neutral-900">No results found for "{debouncedQuery}".</p>
                <p className="text-xs text-neutral-500">Try searching for a different name, username, or keyword.</p>
              </div>
            ) : (
              <>
                {/* Search Results: People */}
                {(activeFilter === 'all' || activeFilter === 'people') && searchResults.people.length > 0 && (
                  <section className="px-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Users className="w-4 h-4 text-[#5E43F3]" />
                      <h2 className="text-sm font-bold text-neutral-900 tracking-tight">People</h2>
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
                                <span className="font-bold text-sm text-neutral-900 truncate">{user.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-0.5">
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
                                ? 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                                : user.relationship === 'follower'
                                ? 'bg-[#5E43F3] hover:bg-[#4E34E0] text-white'
                                : user.isFollowing
                                ? 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                                : 'bg-neutral-950 text-white hover:bg-neutral-800'
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

                {/* Search Results: Content / Video */}
                {(activeFilter === 'all' || activeFilter === 'video') && searchResults.content.length > 0 && (
                  <section className="px-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Search className="w-4 h-4 text-[#5E43F3]" />
                      <h2 className="text-sm font-bold text-neutral-900 tracking-tight">Content</h2>
                    </div>
                    <div className="divide-y divide-neutral-100">
                      {searchResults.content.map((post: any) => (
                        <PostItem key={post.id} post={post} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Search Results: Pages */}
                {(activeFilter === 'all' || activeFilter === 'pages') && searchResults.pages.length > 0 && (
                  <section className="px-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Building className="w-4 h-4 text-[#5E43F3]" />
                      <h2 className="text-sm font-bold text-neutral-900 tracking-tight">Pages & Businesses</h2>
                    </div>
                    <div className="divide-y divide-neutral-200/80">
                      {searchResults.pages.map((page: any) => (
                        <div 
                          key={page.id} 
                          className="py-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-neutral-50/50 transition-colors"
                          onClick={() => navigate('/app/page/' + page.id)}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar src={page?.avatar} alt={page?.name || 'Page'} size="md" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-bold text-sm text-neutral-900 truncate">{page.name}</h3>
                                {page.badge && <Badge type={page.badge} />}
                              </div>
                              <p className="text-xs text-neutral-400 truncate">@{page.username}</p>
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
                                ? 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
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
            {/* Trending Section */}
            {(activeFilter === 'all' || activeFilter === 'trending') && trendingTopics.length > 0 && (
              <section className="px-4">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-[#5E43F3]" />
                    <h2 className="text-sm font-bold text-neutral-900 tracking-tight">Trending Near You</h2>
                  </div>
                  <span className="text-xs text-neutral-400">{location.name}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {trendingTopics.map((topic, i) => (
                    <div
                      key={i}
                      onClick={() => setSearchQuery(topic.tag.replace('#', ''))}
                      className="p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors border border-neutral-100/80 cursor-pointer"
                    >
                      <p className="text-xs font-semibold text-neutral-500">{topic.location}</p>
                      <p className="font-bold text-sm text-neutral-900 truncate mt-0.5">{topic.tag}</p>
                      <p className="text-[11px] text-neutral-400 mt-1">{topic.postsCount}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* People Near You */}
            {(activeFilter === 'all' || activeFilter === 'people') && (
              <section className="px-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#5E43F3]" />
                    <h2 className="text-sm font-bold text-neutral-900 tracking-tight">People Near You</h2>
                    <span className="text-xs text-neutral-400">({filteredPeople.length})</span>
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
                                <span className="font-bold text-sm text-neutral-900 truncate">{user.name}</span>
                                {user.badge && <Badge type={user.badge} />}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-0.5">
                                <span className="truncate">@{user.username}</span>
                                <span>·</span>
                                <span className="inline-flex items-center gap-1 text-neutral-600 font-semibold text-[11px]">
                                  <span className={`w-1.5 h-1.5 rounded-full ${prox.dotColor}`} />
                                  {distFormatted}
                                </span>
                              </div>
                              {user.bio && (
                                <p className="text-xs text-neutral-600 truncate mt-0.5 max-w-[200px]">{user.bio}</p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => toggleFollowUser(user.id)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ml-2 flex items-center gap-1 ${
                              user.relationship === 'friends'
                                ? 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                                : user.relationship === 'follower'
                                ? 'bg-[#5E43F3] hover:bg-[#4E34E0] text-white'
                                : user.isFollowing
                                ? 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                                : 'bg-neutral-950 text-white hover:bg-neutral-800'
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
                  <div className="p-5 rounded-2xl bg-neutral-50 text-center border border-neutral-100 space-y-2">
                    <p className="text-xs text-neutral-600">
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

            {/* Local Pages & Businesses */}
            {(activeFilter === 'all' || activeFilter === 'pages') && (
              <section className="px-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-[#5E43F3]" />
                    <h2 className="text-sm font-bold text-neutral-900 tracking-tight">Local Pages & Businesses</h2>
                    <span className="text-xs text-neutral-400">({filteredPages.length})</span>
                  </div>
                </div>

                {filteredPages.length > 0 ? (
                  <div className="divide-y divide-neutral-200/80">
                    {filteredPages.map((page) => {
                      const distFormatted =
                        page.distanceMeters !== undefined
                          ? formatDistance(page.distanceMeters, locationPrivacy?.approximateDistance)
                          : null;
                      const prox =
                        page.distanceMeters !== undefined ? getProximityCategory(page.distanceMeters) : null;

                      return (
                        <div 
                          key={page.id} 
                          className="py-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-neutral-50/50 transition-colors"
                          onClick={() => navigate('/app/page/' + page.id)}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar src={page?.avatar} alt={page?.name || 'Page'} size="md" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-bold text-sm text-neutral-900 truncate">{page.name}</h3>
                                {page.badge && <Badge type={page.badge} />}
                              </div>
                              <p className="text-xs text-neutral-400 truncate">@{page.username}</p>
                              <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mt-0.5 flex-wrap">
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
                                ? 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
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
                  <div className="p-5 rounded-2xl bg-neutral-50 text-center border border-neutral-100 space-y-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-white flex items-center justify-center mb-1 border border-neutral-100 shadow-sm">
                      <Building className="w-5 h-5 text-[#5E43F3]" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-neutral-900 mb-1">
                        No local Stands found
                      </p>
                      <p className="text-[11px] text-neutral-500 leading-relaxed max-w-[280px] mx-auto">
                        No local Stands found within {location.radiusKm} km of {location.name}.
                        <br/><br/>
                        Be the first to create a Stand in your area and let people nearby discover you.
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
                        Create a Stand
                      </button>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => setLocationMode('global')}
                      className="block mx-auto text-[11px] font-bold text-[#5E43F3] hover:underline"
                    >
                      Show pages everywhere
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* Video Section */}
            {(activeFilter === 'all' || activeFilter === 'video') && videoPosts.length > 0 && (
              <section className="px-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Play className="w-4 h-4 text-[#5E43F3]" />
                    <h2 className="text-sm font-bold text-neutral-900 tracking-tight">Video</h2>
                    <span className="text-xs text-neutral-400">({videoPosts.length})</span>
                  </div>
                </div>

                <div className="divide-y divide-neutral-200/80">
                  {videoPosts.map((post) => (
                    <div 
                      key={post.id} 
                      onClick={() => setActiveCommentsPostId(post.id)}
                      className="py-3 flex items-center gap-3 cursor-pointer hover:bg-neutral-100/60 p-2 rounded-xl transition-colors"
                    >
                      <div className="relative h-16 w-24 rounded-xl overflow-hidden bg-neutral-200 shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-neutral-300 via-neutral-200 to-neutral-100" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                            <Play className="w-3.5 h-3.5 text-[#5E43F3] fill-current" />
                          </div>
                        </div>
                        {post.mediaUrl && (
                          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-white">
                            {post.mediaType === 'video' ? 'Video' : 'Post'}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-neutral-900 line-clamp-2">{post.text}</p>
                        <p className="text-[11px] text-neutral-500 mt-1">
                          {post.likesCount} likes · {post.commentsCount} comments
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Popular Posts Section */}
            {activeFilter === 'all' && (
              <section className="pt-2">
                <div className="px-4 mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-bold text-neutral-900 tracking-tight">Popular Posts Nearby</h2>
                  </div>
                  <span className="text-xs text-neutral-400">Within {location.radiusKm} km</span>
                </div>

                {nearbyPosts.length > 0 ? (
                  <div className="divide-y divide-neutral-100">
                    {nearbyPosts.map((post) => (
                      <PostItem key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="mx-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-center text-xs text-neutral-600">
                    No popular posts nearby yet. Try changing your location radius or check back later.
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};
