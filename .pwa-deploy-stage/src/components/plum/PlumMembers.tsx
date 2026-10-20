import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutGrid,
  List,
  Filter,
  Sparkles,
  MapPin,
  Heart,
  Bookmark,
  SlidersHorizontal,
  X,
  Search,
  Zap,
  Gift,
  Lock,
  User,
  Edit3,
  Eye,
  EyeOff,
  Shield,
  Star,
  Compass,
  MessageCircle,
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import { PlumMemberModal } from './PlumMemberModal';
import { DATING_GOAL_OPTIONS, getDatingGoalOption } from './datingGoals';

interface PlumMembersProps {
  onOpenChat: () => void;
  onEditProfile?: () => void;
  onViewOnMap?: (userId: string) => void;
  onSelectMember?: (userId: string) => void;
  myProfile?: any;
}

export const PlumMembers: React.FC<PlumMembersProps> = ({
  onOpenChat,
  onEditProfile,
  onViewOnMap,
  onSelectMember,
  myProfile: propsMyProfile,
}) => {
  const { openChatWithUser } = useLalao();

  // Display mode toggle: Grid vs List (persisted in localStorage)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('plum_members_view_mode');
      if (saved === 'list' || saved === 'grid') {
        setViewMode(saved);
      }
    } catch {
      // Ignore localStorage access issues
    }
  }, []);

  const handleSetViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    try {
      localStorage.setItem('plum_members_view_mode', mode);
    } catch {
      // Ignore localStorage failure
    }
  };

  // Filter drawer states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [goalFilter, setGoalFilter] = useState<string>('all');
  const [intentionsFilter, setIntentionsFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [minAge, setMinAge] = useState<number>(18);
  const [maxAge, setMaxAge] = useState<number>(60);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch current authenticated user's own profile separately
  const eligibility = useQuery(api.plum.getPlumEligibility);
  const myProfile = propsMyProfile ?? eligibility?.profile;
  const currentUserId = eligibility?.userId || myProfile?.userId;

  // 2. Query other eligible members with backend preferences filtering (never returns self)
  const members = useQuery(api.plum.listPlumMembers, {
    genderFilter: genderFilter !== 'all' ? genderFilter : undefined,
    intentionsFilter: intentionsFilter !== 'all' ? intentionsFilter : undefined,
    goalFilter: goalFilter !== 'all' ? goalFilter : undefined,
    minAge,
    maxAge,
  });

  // Client-side filtering: search field, location filter, favorites shortcut, AND defensive exclusion of own user ID
  const filteredMembers = useMemo(() => {
    if (!members) return [];
    let list = members;

    // Defensively exclude authenticated user's own profile by stable account/user ID
    if (currentUserId) {
      list = list.filter((m: any) => m.userId !== currentUserId);
    }

    // Filter by favorites only if toggle active
    if (favoritesOnly) {
      list = list.filter((m: any) => Boolean(m.isFavorited));
    }

    // Filter by location input if entered
    if (locationFilter.trim()) {
      const locQ = locationFilter.trim().toLowerCase();
      list = list.filter((m: any) => m.broadLocation?.toLowerCase().includes(locQ));
    }

    // Filter by text search query (display name, bio, dating goal, interests, location)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m: any) =>
          m.displayName?.toLowerCase().includes(q) ||
          m.bio?.toLowerCase().includes(q) ||
          m.broadLocation?.toLowerCase().includes(q) ||
          m.datingGoal?.toLowerCase().includes(q) ||
          m.interests?.some((i: string) => i.toLowerCase().includes(q))
      );
    }

    return list;
  }, [members, currentUserId, favoritesOnly, locationFilter, searchQuery]);

  // Active filters count badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (genderFilter !== 'all') count++;
    if (goalFilter !== 'all') count++;
    if (intentionsFilter !== 'all') count++;
    if (locationFilter.trim()) count++;
    if (minAge > 18 || maxAge < 60) count++;
    return count;
  }, [genderFilter, goalFilter, intentionsFilter, locationFilter, minAge, maxAge]);

  const handleCardClick = (targetUserId: string) => {
    if (onSelectMember) {
      onSelectMember(targetUserId);
    }
  };

  const handleChatClick = (e: React.MouseEvent, member: any) => {
    e.stopPropagation();
    openChatWithUser(
      {
        id: member.userId,
        name: member.displayName,
        username: member.displayName.toLowerCase().replace(/\s+/g, '_'),
        avatar: member.mainPhoto || '',
      } as any,
      `Hi ${member.displayName}, saw your profile on Plum!`
    );
    onOpenChat();
  };

  // Current user's dating goal metadata
  const myGoalOption = getDatingGoalOption(myProfile?.datingGoal);
  const myMainPhoto =
    myProfile?.mainPhoto ||
    (myProfile?.publicPhotos && myProfile.publicPhotos[0]) ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';

  return (
    <div className="w-full px-3 sm:px-4 py-3 space-y-4 animate-in fade-in duration-200">
      
      {/* ── SECTION 1: COMPACT YOUR PROFILE BAR (Clean, non-intrusive) ── */}
      {myProfile && (
        <section aria-label="Your Plum Dating Profile" className="rounded-2xl bg-theme-surface/70 border border-theme-divider-light p-2.5 sm:px-3 sm:py-2">
          <div className="flex items-center justify-between gap-3">
            <div
              onClick={() => myProfile?.userId && handleCardClick(myProfile.userId)}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-pink-500/30 bg-black/10">
                <img
                  src={myMainPhoto}
                  alt={myProfile.displayName || 'You'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-bold text-theme-primary group-hover:text-pink-500 truncate transition-colors">
                  {myProfile.displayName}
                </span>
                <span className="text-[10px] font-semibold text-pink-500/80">({myProfile.age})</span>
                <span className="text-[10px] text-theme-tertiary hidden sm:inline truncate">
                  · {myGoalOption.badgeLabel}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Profile discovery visibility indicator */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                  myProfile.profileVisibility === 'active'
                    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}
              >
                {myProfile.profileVisibility === 'active' ? (
                  <>
                    <Eye className="w-2.5 h-2.5" />
                    <span className="hidden xs:inline">Visible</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-2.5 h-2.5" />
                    <span className="hidden xs:inline">Hidden</span>
                  </>
                )}
              </span>

              {onEditProfile && (
                <button
                  id="btn-plum-edit-own-profile"
                  type="button"
                  onClick={onEditProfile}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 text-[11px] font-semibold border border-pink-500/20 transition-all cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION 2: DISCOVER MEMBERS (Primary browsing content) ── */}
      <section aria-label="Discover Members" className="space-y-3.5">
        
        {/* Section Header */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-theme-primary">
              Discover Members
            </h2>
            <p className="text-[11px] text-theme-tertiary">
              Browse compatible people matching your dating goals & preferences.
            </p>
          </div>

          {/* Members count indicator */}
          {members && (
            <span className="text-[11px] font-bold text-theme-tertiary">
              {filteredMembers.length} member{filteredMembers.length === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {/* ── 2.1 DISCOVERY TOOLBAR ── */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-tertiary" />
              <input
                id="input-plum-member-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, goals, interests, location (e.g. Warri)..."
                className="w-full pl-9 pr-8 py-2 rounded-2xl bg-theme-surface border border-theme-divider-light text-theme-primary text-xs focus:outline-none focus:border-pink-500 shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-tertiary hover:text-theme-primary p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Pinned / Favorites Shortcut Pill */}
            <button
              id="btn-plum-favorites-filter"
              type="button"
              onClick={() => setFavoritesOnly(!favoritesOnly)}
              title={favoritesOnly ? 'Show all members' : 'Show pinned favorites only'}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                favoritesOnly
                  ? 'bg-pink-500/15 border-pink-500/40 text-pink-600 dark:text-pink-400 shadow-xs'
                  : 'bg-theme-surface border-theme-divider-light text-theme-secondary hover:text-theme-primary'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-pink-500 text-pink-500' : ''}`} />
              <span className="hidden sm:inline">Favorites</span>
            </button>

            {/* Filters Button */}
            <button
              id="btn-plum-open-filters"
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold border transition-colors cursor-pointer ${
                isFilterOpen || activeFiltersCount > 0
                  ? 'bg-pink-500/10 border-pink-500/30 text-pink-600 dark:text-pink-400'
                  : 'bg-theme-surface border-theme-divider-light text-theme-secondary hover:text-theme-primary'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-pink-500 text-white text-[9px] font-black">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Grid vs List View Controls */}
            <div className="flex items-center p-0.5 rounded-2xl bg-theme-surface border border-theme-divider-light">
              <button
                id="btn-plum-view-grid"
                type="button"
                onClick={() => handleSetViewMode('grid')}
                title="Grid View"
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-pink-500 text-white shadow-xs'
                    : 'text-theme-secondary hover:text-theme-primary'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-plum-view-list"
                type="button"
                onClick={() => handleSetViewMode('list')}
                title="List View"
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-pink-500 text-white shadow-xs'
                    : 'text-theme-secondary hover:text-theme-primary'
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── FILTERS DRAWER ── */}
        {isFilterOpen && (
          <div className="p-4 rounded-3xl bg-theme-surface border border-theme-divider-light space-y-3 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-theme-divider-light">
              <span className="text-xs font-bold text-theme-primary flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-pink-500" /> Discovery Filters
              </span>
              <button
                type="button"
                onClick={() => {
                  setGenderFilter('all');
                  setGoalFilter('all');
                  setLocationFilter('');
                  setFavoritesOnly(false);
                  setMinAge(18);
                  setMaxAge(60);
                }}
                className="text-[11px] font-semibold text-pink-500 hover:underline cursor-pointer"
              >
                Reset all
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Dating Goal Filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-theme-secondary">Dating Goal</label>
                <select
                  id="select-plum-goal-filter"
                  value={goalFilter}
                  onChange={(e) => setGoalFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-theme-base border border-theme-divider-light text-theme-primary text-xs focus:outline-none"
                >
                  <option value="all">All Dating Goals</option>
                  {DATING_GOAL_OPTIONS.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Gender Filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-theme-secondary">Gender</label>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-theme-base border border-theme-divider-light text-theme-primary text-xs focus:outline-none"
                >
                  <option value="all">All Genders</option>
                  <option value="woman">Women</option>
                  <option value="man">Men</option>
                  <option value="non-binary">Non-binary</option>
                </select>
              </div>

              {/* Location Filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-theme-secondary">Location / Area</label>
                <input
                  type="text"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="e.g. Udu, Warri, Lagos..."
                  className="w-full px-3 py-2 rounded-xl bg-theme-base border border-theme-divider-light text-theme-primary text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Age range */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] font-semibold text-theme-secondary">
                <span>Age Range: {minAge} - {maxAge}</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={18}
                  max={50}
                  value={minAge}
                  onChange={(e) => setMinAge(Math.min(parseInt(e.target.value), maxAge - 1))}
                  className="w-full accent-pink-600"
                />
                <input
                  type="range"
                  min={20}
                  max={80}
                  value={maxAge}
                  onChange={(e) => setMaxAge(Math.max(parseInt(e.target.value), minAge + 1))}
                  className="w-full accent-pink-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {members === undefined && (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full border-3 border-pink-500/30 border-t-pink-500 animate-spin" />
            <p className="text-xs text-theme-tertiary">Discovering compatible members...</p>
          </div>
        )}

        {/* Empty State for other members */}
        {members !== undefined && filteredMembers.length === 0 && (
          <div className="py-12 px-4 text-center rounded-2xl bg-theme-surface border border-theme-divider-light space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-theme-primary">
              {favoritesOnly
                ? 'No Pinned Favorites'
                : 'No Members Match Your Criteria'}
            </h3>
            <p className="text-xs text-theme-secondary max-w-[360px] mx-auto leading-relaxed">
              {favoritesOnly
                ? 'You have not favorited any profiles yet. Tap the bookmark icon on any member card to save them here.'
                : 'No members currently match your active filters or search terms. Try clearing filters or broadening your search.'}
            </p>
            {(searchQuery || activeFiltersCount > 0 || favoritesOnly) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFavoritesOnly(false);
                  setGenderFilter('all');
                  setGoalFilter('all');
                  setLocationFilter('');
                  setMinAge(18);
                  setMaxAge(60);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 text-xs font-semibold border border-pink-500/20 hover:bg-pink-500/20 transition-all cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* ── 2.2 MEMBER GRID VIEW (Responsive Grid Cards) ── */}
        {viewMode === 'grid' && filteredMembers.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {filteredMembers.map((member: any) => {
              const goalOption = getDatingGoalOption(member.datingGoal);
              return (
                <div
                  key={member._id}
                  onClick={() => handleCardClick(member.userId)}
                  className="group relative rounded-2xl overflow-hidden bg-theme-surface border border-theme-divider-light shadow-xs hover:border-pink-500/40 transition-all duration-200 cursor-pointer flex flex-col"
                >
                  {/* Photo Area */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/10">
                    <img
                      src={
                        member.mainPhoto ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={member.displayName}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                    {/* Top Badges: Location & Favorite status */}
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 z-10">
                      {member.broadLocation ? (
                        <div className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-medium flex items-center gap-1 truncate max-w-[110px] shadow-xs">
                          <MapPin className="w-2.5 h-2.5 text-pink-400 shrink-0" />
                          <span className="truncate">{member.broadLocation}</span>
                        </div>
                      ) : <span />}

                      {member.isFavorited && (
                        <div className="p-1 rounded-full bg-pink-600/90 text-white shadow-xs backdrop-blur-xs">
                          <Bookmark className="w-2.5 h-2.5 fill-white text-white" />
                        </div>
                      )}
                    </div>

                    {/* Private Vault Badge */}
                    {member.privatePhotosCount > 0 && (
                      <div className="absolute top-7 right-2 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs border border-white/20 text-white text-[9px] font-bold flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5 text-pink-400" />
                        <span>+{member.privatePhotosCount}</span>
                      </div>
                    )}

                    {/* Name, Age, Dating Goal, & Bio Overlay */}
                    <div className="absolute bottom-2 left-2 right-2 text-white space-y-1">
                      <div className="flex items-baseline gap-1.5">
                        <h3 className="font-bold text-sm sm:text-base truncate">{member.displayName}</h3>
                        <span className="text-xs sm:text-sm font-semibold opacity-90">{member.age}</span>
                      </div>

                      {/* Dating Goal Badge */}
                      <div className="flex items-center gap-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-500/80 backdrop-blur-xs text-white text-[10px] font-bold truncate max-w-full">
                          <Heart className="w-2.5 h-2.5 fill-white" />
                          <span className="truncate">{goalOption.badgeLabel}</span>
                        </span>
                      </div>

                      {member.bio && (
                        <p className="text-[11px] text-white/80 line-clamp-1 leading-snug">
                          {member.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Actions Footer: View Profile & Chat Button */}
                  <div className="p-2 sm:p-2.5 flex items-center justify-between gap-1.5 bg-theme-surface border-t border-theme-divider-light">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(member.userId);
                      }}
                      className="flex-1 py-1 px-2 rounded-xl bg-theme-base hover:bg-theme-surface-hover text-theme-primary text-[11px] font-semibold border border-theme-divider-light transition-colors text-center cursor-pointer truncate"
                    >
                      View Profile
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleChatClick(e, member)}
                      title={`Chat with ${member.displayName}`}
                      className="py-1 px-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs transition-colors shrink-0 cursor-pointer"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span className="hidden xs:inline">Chat</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── 2.3 MEMBER LIST VIEW (Horizontal Rows) ── */}
        {viewMode === 'list' && filteredMembers.length > 0 && (
          <div className="space-y-2">
            {filteredMembers.map((member: any) => {
              const goalOption = getDatingGoalOption(member.datingGoal);
              return (
                <div
                  key={member._id}
                  onClick={() => handleCardClick(member.userId)}
                  className="p-2.5 sm:p-3 rounded-2xl bg-theme-surface border border-theme-divider-light hover:border-pink-500/30 transition-all cursor-pointer flex items-center gap-3 group"
                >
                  {/* Photo using Main Photo */}
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-black/10 border border-theme-divider-light">
                    <img
                      src={
                        member.mainPhoto ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={member.displayName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {member.privatePhotosCount > 0 && (
                      <div className="absolute bottom-1 right-1 p-0.5 rounded-md bg-black/70 text-pink-400">
                        <Lock className="w-2.5 h-2.5" />
                      </div>
                    )}
                    {member.isFavorited && (
                      <div className="absolute top-1 left-1 p-0.5 rounded-md bg-pink-600 text-white shadow-xs">
                        <Bookmark className="w-2.5 h-2.5 fill-white" />
                      </div>
                    )}
                  </div>

                  {/* Details Area */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-sm font-bold text-theme-primary truncate">
                        {member.displayName}
                      </h3>
                      <span className="text-xs font-semibold text-pink-500">{member.age}</span>

                      {/* Dating Goal compact badge */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 text-[10px] font-semibold border border-pink-500/20">
                        <Heart className="w-2.5 h-2.5 fill-pink-500 text-pink-500" />
                        <span>{goalOption.badgeLabel}</span>
                      </span>

                      {member.broadLocation && (
                        <span className="text-[10px] text-theme-tertiary flex items-center gap-0.5 truncate hidden sm:inline-flex">
                          · <MapPin className="w-2.5 h-2.5 text-pink-500" /> {member.broadLocation}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-theme-secondary line-clamp-1 mt-0.5">
                      {member.bio || 'Say hello on Plum!'}
                    </p>

                    {member.interests && member.interests.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1 overflow-hidden">
                        {member.interests.slice(0, 3).map((item: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full bg-theme-base text-[9px] font-medium text-theme-secondary border border-theme-divider-light truncate"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(member.userId);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-theme-base hover:bg-theme-surface-hover text-theme-primary text-xs font-semibold border border-theme-divider-light transition-colors hidden sm:inline-block cursor-pointer"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleChatClick(e, member)}
                      className="px-3 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
