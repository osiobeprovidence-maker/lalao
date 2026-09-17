import React, { useState, useMemo } from 'react';
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
  Play,
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

export const DiscoverView: React.FC = () => {
  const {
    location,
    locationPrivacy,
    setIsLocationModalOpen,
    pages,
    toggleFollowPage,
    setActivePageId,
    setActiveUserProfile,
    posts,
    setIsNotificationsOpen,
    unreadNotifsCount,
  } = useLalao();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'people' | 'pages' | 'video' | 'trending'>('all');
  const [nearbyOnly, setNearbyOnly] = useState(true);

  // Real app data only. Empty until the app has actual nearby user records to display.
  const [people, setPeople] = useState<User[]>([]);

  const toggleFollowUser = (userId: string) => {
    setPeople((prev) =>
      prev.map((user) => {
        if (user.id === userId) {
          const isFollowing = !user.isFollowing;
          return {
            ...user,
            isFollowing,
            followersCount: isFollowing ? user.followersCount + 1 : user.followersCount - 1,
          };
        }
        return user;
      })
    );
  };

  const trendingTopics = [
    { tag: '#UduFootballLeague', postsCount: '1.4k posts', location: 'Udu' },
    { tag: '#DeltaFounders', postsCount: '890 posts', location: 'Warri' },
    { tag: '#RiverbankCleanUp', postsCount: '620 posts', location: 'Udu Bridge' },
    { tag: '#SubteenStudioDrop', postsCount: '410 posts', location: 'Express Junction' },
  ];

  const userCoords = useMemo(() => {
    return {
      lat: location.latitude ?? getCoordinatesForLocation(location.name).lat,
      lng: location.longitude ?? getCoordinatesForLocation(location.name).lng,
    };
  }, [location.name, location.latitude, location.longitude]);

  const maxRadiusMeters = location.radiusKm * 1000;

  // Compute distance for people
  const peopleWithDistance = useMemo(() => {
    return people.map((person) => {
      const coords =
        person.latitude && person.longitude
          ? { lat: person.latitude, lng: person.longitude }
          : getCoordinatesForLocation(person.location || person.name);
      const dist = calculateDistanceMeters(userCoords.lat, userCoords.lng, coords.lat, coords.lng);
      return { ...person, distanceMeters: dist };
    });
  }, [people, userCoords]);

  // Filtered lists based on search query AND discovery radius
  const filteredPages = useMemo(() => {
    return pages
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.location.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;
        if (nearbyOnly && p.distanceMeters !== undefined) {
          return p.distanceMeters <= maxRadiusMeters;
        }
        return true;
      })
      .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));
  }, [pages, searchQuery, nearbyOnly, maxRadiusMeters]);

  const filteredPeople = useMemo(() => {
    return peopleWithDistance
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.bio && p.bio.toLowerCase().includes(searchQuery.toLowerCase()));
        if (!matchesSearch) return false;
        if (nearbyOnly) {
          return p.distanceMeters <= maxRadiusMeters;
        }
        return true;
      })
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }, [peopleWithDistance, searchQuery, nearbyOnly, maxRadiusMeters]);

  const nearbyPosts = useMemo(() => {
    return posts
      .filter((post) => post.distanceMeters <= maxRadiusMeters)
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, 2);
  }, [posts, maxRadiusMeters]);

  const videoPosts = useMemo(() => {
    return posts.filter(
      (post) => post.mediaType === 'video' && post.distanceMeters <= maxRadiusMeters
    );
  }, [posts, maxRadiusMeters]);

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
              placeholder={`Search people, pages & cycles in ${location.name}...`}
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

          {/* Location & Radius Scope Selector (Replaces notification icon) */}
          <button
            type="button"
            id="btn-discover-location-radius"
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50/90 hover:bg-indigo-100 text-xs font-bold text-[#5E43F3] border border-indigo-200/80 active:scale-95 transition-all shrink-0 cursor-pointer shadow-xs"
            title={`Location: ${location.name} (≤ ${location.radiusKm} km). Tap to change location or radius.`}
          >
            <MapPin className="w-3.5 h-3.5 text-[#5E43F3] shrink-0" />
            <span className="font-bold tracking-tight">≤ {location.radiusKm} km</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'people', label: 'People' },
              { id: 'pages', label: 'Pages & Businesses' },
              { id: 'video', label: 'Video' },
              { id: 'trending', label: 'Trending' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === f.id
                  ? 'bg-neutral-950 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ghost Mode Notice if active */}
      {locationPrivacy?.ghostMode && (
        <div className="mx-4 mt-3 p-2.5 rounded-xl bg-purple-50 border border-purple-100 flex items-center gap-2 text-xs text-purple-900">
          <EyeOff className="w-4 h-4 text-purple-600 shrink-0" />
          <span>
            <strong>Ghost Mode is active:</strong> You are invisible in &ldquo;People Near You&rdquo; while exploring.
          </span>
        </div>
      )}

      {/* Content Feed */}
      <div className="space-y-6 pt-3">
        {/* Trending Section */}
        {(activeFilter === 'all' || activeFilter === 'trending') && !searchQuery && (
          <section className="px-4">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#5E43F3]" />
                <h2 className="text-sm font-bold text-neutral-900 tracking-tight">
                  Trending Near You
                </h2>
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
                <h2 className="text-sm font-bold text-neutral-900 tracking-tight">
                  People Near You
                </h2>
                <span className="text-xs text-neutral-400">({filteredPeople.length})</span>
              </div>
            </div>

            {filteredPeople.length > 0 ? (
              <div className="divide-y divide-neutral-200/80">
                {filteredPeople.map((user) => {
                  const distFormatted = formatDistance(
                    user.distanceMeters,
                    locationPrivacy?.approximateDistance
                  );
                  const prox = getProximityCategory(user.distanceMeters);

                  return (
                    <div
                      key={user.id}
                      className="py-3.5 flex items-center justify-between gap-3"
                    >
                      <div
                        onClick={() => setActiveUserProfile(user)}
                        className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                      >
                        <Avatar src={user?.avatar} alt={user?.name || 'User'} size="md" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-sm text-neutral-900 truncate">
                              {user.name}
                            </span>
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
                            <p className="text-xs text-neutral-600 truncate mt-0.5 max-w-[200px]">
                              {user.bio}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        id={`btn-follow-user-${user.id}`}
                        onClick={() => toggleFollowUser(user.id)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ml-2 ${
                          user.isFollowing
                            ? 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                            : 'bg-neutral-950 text-white hover:bg-neutral-800'
                        }`}
                      >
                        {user.isFollowing ? 'Following' : 'Follow'}
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
                  onClick={() => setNearbyOnly(false)}
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
                <h2 className="text-sm font-bold text-neutral-900 tracking-tight">
                  Local Pages & Businesses
                </h2>
                <span className="text-xs text-neutral-400">({filteredPages.length})</span>
              </div>
            </div>

            {filteredPages.length > 0 ? (
              <div className="divide-y divide-neutral-200/80">
                {filteredPages.map((page) => {
                  const distFormatted = page.distanceMeters !== undefined
                    ? formatDistance(page.distanceMeters, locationPrivacy?.approximateDistance)
                    : null;
                  const prox = page.distanceMeters !== undefined
                    ? getProximityCategory(page.distanceMeters)
                    : null;

                  return (
                    <div
                      key={page.id}
                      className="py-3.5 flex items-center justify-between gap-3"
                    >
                      <div
                        onClick={() => setActivePageId(page.id)}
                        className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                      >
                        <Avatar
                          src={page?.avatar}
                          alt={page?.name || 'Page'}
                          size="md"
                        />
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
                        id={`btn-follow-page-${page.id}`}
                        onClick={() => toggleFollowPage(page.id)}
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
              <div className="p-5 rounded-2xl bg-neutral-50 text-center border border-neutral-100 space-y-2">
                <p className="text-xs text-neutral-600">
                  No local pages found within {location.radiusKm} km of {location.name}.
                </p>
                <button
                  type="button"
                  onClick={() => setNearbyOnly(false)}
                  className="text-xs font-bold text-[#5E43F3] hover:underline cursor-pointer"
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
                <h2 className="text-sm font-bold text-neutral-900 tracking-tight">
                  Video
                </h2>
                <span className="text-xs text-neutral-400">({videoPosts.length})</span>
              </div>
            </div>

            <div className="divide-y divide-neutral-200/80">
              {videoPosts.map((post) => (
                <div key={post.id} className="py-3 flex items-center gap-3">
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
        {activeFilter === 'all' && !searchQuery && (
          <section className="pt-2">
            <div className="px-4 mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#5E43F3]" />
                <h2 className="text-sm font-bold text-neutral-900 tracking-tight">
                  Popular Posts Nearby
                </h2>
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
      </div>
    </div>
  );
};
