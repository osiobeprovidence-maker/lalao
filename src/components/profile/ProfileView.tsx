import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Calendar,
  Share2,
  Settings,
  Heart,
  Plus,
  Clock,
  Users,
  Search,
  X,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  Building2,
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { PostItem } from '../feed/PostItem';
import { User } from '../../types';
import { SuggestCommunityModal } from './SuggestCommunityModal';

type ProfileTab = 'posts' | 'replies' | 'media' | 'reposts';
type ConnectionTab = 'community' | 'followers' | 'following';

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    posts,
    cycles,
    openCycleStory,
    setIsCreateCycleOpen,
    triggerShareToast,
    setIsEditProfileOpen,
    setIsNotificationsOpen,
    setActiveTab,
    unreadNotifsCount,
    setActiveUserProfile,
    toggleFollowUser,
  } = useLalao();

  const [profileTab, setProfileTab] = useState<ProfileTab>('posts');
  const [isConnectionsOpen, setIsConnectionsOpen] = useState(false);
  const [connectionTab, setConnectionTab] = useState<ConnectionTab>('community');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch this user's posts directly — querying strictly posts authored by this profile
  const myPostsQuery = useQuery(
    api.social.listUserPosts,
    currentUser?.id
      ? { userId: currentUser.id, username: currentUser.username }
      : {}
  );
  const backendPosts = (myPostsQuery as any[]) ?? [];
  const isPostsLoading = myPostsQuery === undefined;

  // Merge backend posts with any locally created posts authored by currentUser
  const userPosts = useMemo(() => {
    const backendIds = new Set(backendPosts.map((p) => p.id));
    const localPosts = (posts || []).filter(
      (p) =>
        (p.author?.id === currentUser?.id ||
         p.author?.username === currentUser?.username) &&
        !backendIds.has(p.id)
    );
    return [...localPosts, ...backendPosts];
  }, [backendPosts, posts, currentUser?.id, currentUser?.username]);

  const userMediaPosts = userPosts.filter((p: any) => Boolean(p.mediaUrl));
  const userReposts = userPosts.filter((p: any) => p.isReposted);

  // User's total cumulative likes across all authored posts & comments
  const myLikesQuery = useQuery(
    (api.users as any).getUserTotalLikes,
    currentUser?.id ? { userId: currentUser.id, username: currentUser.username } : {}
  );
  const myTotalLikes = myLikesQuery?.totalLikes ?? 0;

  const formatLikes = (count: number) => {
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (count >= 1_000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    return count.toLocaleString();
  };


  const myCycle = cycles.find(
    (c) => c.user?.id === currentUser.id || c.id === 'cycle_user_me'
  );
  const myHasItems = myCycle && myCycle.items && myCycle.items.length > 0;

  const [isSuggestOpen, setIsSuggestOpen] = useState(false);

  // Real connection data from Convex
  const myFollowers = useQuery(api.social.getMyFollowers) ?? [];
  const myFollowing = useQuery(api.social.getMyFollowing);
  const followingData = myFollowing ?? { people: [], pages: [], peopleCt: 0, pagesCt: 0 };
  const totalFollowingCount = followingData.peopleCt + followingData.pagesCt;

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'posts', label: 'Posts' },
    { id: 'replies', label: 'Replies' },
    { id: 'media', label: 'Media' },
    { id: 'reposts', label: 'Reposts' },
  ];

  // Context-aware search placeholder
  const searchPlaceholder = connectionTab === 'community'
    ? 'Search communities...'
    : connectionTab === 'followers'
    ? 'Search followers...'
    : 'Search people and Pages...';

  const handleOpenUserProfile = (user: User) => {
    setIsConnectionsOpen(false);
    setActiveUserProfile(user);
  };

  return (
    <div id="profile-view-container" className="min-h-screen bg-[#f6f3ee] pb-24">
      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-[#f6f3ee]/95 backdrop-blur-md border-b border-neutral-200/80 px-4 py-2.5 flex items-center justify-between">
        <h1 className="text-xl font-black tracking-tight text-neutral-950 font-sans">
          Profile
        </h1>
        <div className="flex items-center gap-1">
          {/* Browse Community Profiles Button */}
          <button
            id="btn-profile-browse-community"
            onClick={() => {
              setConnectionTab('community');
              setIsConnectionsOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold text-[#5E43F3] bg-[#5E43F3]/10 hover:bg-[#5E43F3]/20 transition-colors cursor-pointer"
            title="Discover community profiles"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Community</span>
          </button>

          {/* Notifications Button */}
          <button
            id="btn-profile-notifications"
            onClick={() => {
              setIsNotificationsOpen(false);
              setActiveTab('notifications');
            }}
            className="relative p-2 rounded-full text-neutral-800 hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer"
            title="Notifications & Activity"
          >
            <Heart className="w-5 h-5 stroke-[1.8]" />
            {unreadNotifsCount > 0 && (
              <span
                id="badge-profile-unread-notif"
                className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#5E43F3] rounded-full ring-2 ring-white"
              />
            )}
          </button>

          <button
            onClick={() => triggerShareToast('Profile link copied to clipboard')}
            className="p-2 rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
            title="Share profile"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsEditProfileOpen(true)}
            className="p-2 rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
            title="Settings / Edit profile"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Profile Info Card */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div>
              <h2 className="text-xl font-bold text-neutral-950 leading-tight">
                {currentUser.name}
              </h2>
              <p className="text-xs text-neutral-500 font-medium">
                @{currentUser.username}
              </p>
            </div>

            {/* Bio */}
            <p className="text-xs text-neutral-800 leading-relaxed">
              {currentUser.bio || 'No bio yet. Add a few details to introduce yourself.'}
            </p>

            {/* Location & Metadata */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 pt-0.5">
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#5E43F3]" />
                <span>{currentUser.location || 'Location not added yet'}</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <span>Profile ready</span>
              </div>
            </div>

            {/* Follower Stats & Total Likes */}
            <div className="flex items-center gap-4 text-xs pt-0.5">
              <button
                id="btn-profile-open-followers"
                type="button"
                onClick={() => {
                  setConnectionTab('followers');
                  setIsConnectionsOpen(true);
                }}
                className="text-neutral-500 hover:text-neutral-950 transition-colors cursor-pointer"
              >
                <strong className="text-neutral-900 font-bold">{currentUser.followersCount}</strong>{' '}
                followers
              </button>
              <button
                id="btn-profile-open-following"
                type="button"
                onClick={() => {
                  setConnectionTab('following');
                  setIsConnectionsOpen(true);
                }}
                className="text-neutral-500 hover:text-neutral-950 transition-colors cursor-pointer"
              >
                <strong className="text-neutral-900 font-bold">{currentUser.followingCount}</strong>{' '}
                following
              </button>
              <span className="text-neutral-500">
                <strong className="text-neutral-900 font-bold">{formatLikes(myTotalLikes)}</strong>{' '}
                {myTotalLikes === 1 ? 'Like' : 'Likes'}
              </span>
            </div>
          </div>

          {/* 24-hour Cycle Avatar ring */}
          <div className="relative shrink-0 pt-0.5">
            <div
              onClick={() => {
                if (myHasItems) openCycleStory('cycle_user_me', 0);
                else setIsCreateCycleOpen(true);
              }}
              className="cursor-pointer group relative"
              title={myHasItems ? 'View your 24h Cycle' : 'Add status to your Cycle'}
            >
              <div
                className={`p-[2.5px] rounded-full transition-all duration-300 ${
                  myHasItems
                    ? 'bg-gradient-to-tr from-[#5E43F3] via-fuchsia-500 to-amber-400 group-hover:scale-105 shadow-md shadow-[#5E43F3]/20'
                    : 'border-2 border-dashed border-neutral-300 group-hover:border-[#5E43F3]'
                }`}
              >
                <div className="bg-white p-[2px] rounded-full">
                  <Avatar
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    size="lg"
                    className="w-16 h-16"
                  />
                </div>
              </div>

              <div
                className={`absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-black shadow-md ${
                  myHasItems ? 'bg-[#5E43F3]' : 'bg-neutral-900'
                }`}
              >
                {myHasItems ? <Clock className="w-3 h-3" /> : <Plus className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>
          </div>
        </div>

        {/* Buttons: Edit Profile & Share Profile */}
        <div className="pt-2 grid grid-cols-2 gap-2.5">
          <button
            id="btn-edit-profile"
            onClick={() => setIsEditProfileOpen(true)}
            className="w-full py-2 px-4 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-xs font-bold text-neutral-900 transition-colors cursor-pointer"
          >
            Edit Profile
          </button>
          <button
            id="btn-share-profile"
            onClick={() => triggerShareToast('Profile link copied!')}
            className="w-full py-2 px-4 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-xs font-bold text-neutral-900 transition-colors cursor-pointer"
          >
            Share Profile
          </button>
        </div>

        {/* Community Profiles Carousel */}
        <div className="pt-2 border-t border-neutral-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-900">Community</span>
            <button
              onClick={() => {
                setConnectionTab('community');
                setIsConnectionsOpen(true);
              }}
              className="text-[11px] font-bold text-[#5E43F3] hover:underline cursor-pointer"
            >
              Explore
            </button>
          </div>
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-center text-[11px] text-neutral-500">
            You haven&apos;t joined any communities yet.
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-100 flex items-center justify-around px-2 mt-2">
        {tabs.map((tab) => {
          const isActive = profileTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setProfileTab(tab.id)}
              className={`flex-1 py-3 text-center text-xs font-bold transition-all relative cursor-pointer ${
                isActive ? 'text-neutral-950' : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-neutral-950 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="divide-y divide-neutral-100">
        {profileTab === 'posts' && (
          isPostsLoading ? (
            <div className="flex justify-center p-10">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#5E43F3]" />
            </div>
          ) : userPosts.length > 0 ? (
            userPosts.map((post: any) => <PostItem key={post.id} post={post} />)
          ) : (
            <div className="p-8 text-center text-neutral-400 text-xs">
              You haven&apos;t posted yet. Tap the center + button to share with your local community.
            </div>
          )
        )}

        {profileTab === 'replies' && (
          <div className="p-4 space-y-3">
            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100 text-xs space-y-1">
              <p className="font-bold text-neutral-800">
                Replied to @subteenwear in Udu Express Junction:
              </p>
              <p className="text-neutral-600 italic">
                &ldquo;The cut on the sage green version is top tier! Coming by after work.&rdquo;
              </p>
            </div>
          </div>
        )}

        {profileTab === 'media' && (
          userMediaPosts.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 p-3">
              {userMediaPosts.map((p) => (
                <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden bg-neutral-100">
                  <img
                    src={p.mediaUrl}
                    alt="User media"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-neutral-400 text-xs">
              No photos or videos shared yet.
            </div>
          )
        )}

        {profileTab === 'reposts' && (
          userReposts.length > 0 ? (
            userReposts.map((post) => <PostItem key={post.id} post={post} />)
          ) : (
            <div className="p-8 text-center text-neutral-400 text-xs">
              No reposts yet.
            </div>
          )
        )}
      </div>

      {isConnectionsOpen && (
        <div
          id="community-page-overlay"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
          onClick={() => setIsConnectionsOpen(false)}
        >
          <div
            id="community-page-screen"
            className="bg-white w-full sm:max-w-md md:max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 relative z-10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                id="btn-back-community-page"
                type="button"
                onClick={() => setIsConnectionsOpen(false)}
                className="p-1.5 -ml-1 rounded-full text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer"
                title="Go back"
                aria-label="Back"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <h1 className="font-bold text-base text-neutral-950">Community</h1>
                <p className="text-[11px] text-neutral-500">Your communities, profiles and connections</p>
              </div>
            </div>

            <button
              id="btn-close-community-page"
              type="button"
              onClick={() => setIsConnectionsOpen(false)}
              className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 max-w-xl mx-auto w-full p-4 sm:p-6 space-y-5 pb-24 overflow-y-auto">
            {/* Tabs */}
            <div className="flex border-b border-neutral-100">
              <button
                onClick={() => { setConnectionTab('community'); setSearchQuery(''); }}
                className={`py-2.5 px-3 text-xs font-bold transition-all relative cursor-pointer ${
                  connectionTab === 'community'
                    ? 'text-[#5E43F3]'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Community (0)
                {connectionTab === 'community' && (
                  <span className="absolute bottom-0 inset-x-3 h-0.5 bg-[#5E43F3] rounded-full" />
                )}
              </button>

              <button
                onClick={() => { setConnectionTab('followers'); setSearchQuery(''); }}
                className={`py-2.5 px-3 text-xs font-bold transition-all relative cursor-pointer ${
                  connectionTab === 'followers'
                    ? 'text-[#5E43F3]'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Followers ({myFollowers.length})
                {connectionTab === 'followers' && (
                  <span className="absolute bottom-0 inset-x-3 h-0.5 bg-[#5E43F3] rounded-full" />
                )}
              </button>

              <button
                onClick={() => { setConnectionTab('following'); setSearchQuery(''); }}
                className={`py-2.5 px-3 text-xs font-bold transition-all relative cursor-pointer ${
                  connectionTab === 'following'
                    ? 'text-[#5E43F3]'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Following ({totalFollowingCount})
                {connectionTab === 'following' && (
                  <span className="absolute bottom-0 inset-x-3 h-0.5 bg-[#5E43F3] rounded-full" />
                )}
              </button>
            </div>

            {/* Search */}
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-neutral-400 hover:text-neutral-600 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* === COMMUNITY TAB === */}
            {connectionTab === 'community' && (
              <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-xs text-neutral-500">
                <Users className="w-8 h-8 mx-auto text-neutral-300 mb-3" />
                <p className="font-bold text-neutral-700">You haven&apos;t joined any communities yet.</p>
                <p className="mt-1 text-neutral-500">Discover communities and people around you to get started.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('discover')}
                  className="mt-4 inline-flex rounded-full bg-[#5E43F3] px-4 py-2.5 text-[11px] font-bold text-white cursor-pointer hover:bg-[#4E34E0] transition-colors"
                >
                  Explore Communities
                </button>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setIsSuggestOpen(true)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 hover:text-[#5E43F3] transition-colors cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    Suggest a Community
                  </button>
                </div>
              </div>
            )}

            {/* === FOLLOWERS TAB === */}
            {connectionTab === 'followers' && (
              <div className="space-y-2">
                {(() => {
                  const sq = searchQuery.toLowerCase();
                  const filtered = sq
                    ? myFollowers.filter((u: any) =>
                        u.name.toLowerCase().includes(sq) ||
                        u.username.toLowerCase().includes(sq) ||
                        (u.bio && u.bio.toLowerCase().includes(sq))
                      )
                    : myFollowers;

                  if (filtered.length === 0) {
                    return (
                      <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-xs text-neutral-500">
                        <Users className="w-8 h-8 mx-auto text-neutral-300 mb-3" />
                        <p className="font-bold text-neutral-700">
                          {sq ? 'No followers matching your search.' : "You don't have any followers yet."}
                        </p>
                      </div>
                    );
                  }

                  return filtered.map((user: any) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-3 transition-colors hover:bg-neutral-50"
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenUserProfile(user as User)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer"
                      >
                        <div className="relative">
                          <Avatar src={user.avatar} alt={user.name} size="md" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="truncate text-xs sm:text-sm font-bold text-neutral-950 block">{user.name}</span>
                          <span className="block truncate text-[11px] text-neutral-400">@{user.username}{user.location ? ` · ${user.location}` : ''}</span>
                          {user.bio && <p className="mt-0.5 line-clamp-1 text-[11px] text-neutral-600">{user.bio}</p>}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFollowUser(user.id)}
                        className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shrink-0 ${
                          user.isFollowing
                            ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                            : 'bg-[#5E43F3] text-white hover:bg-[#4E34E0]'
                        }`}
                      >
                        {user.isFollowing ? 'Following' : 'Follow back'}
                      </button>
                    </div>
                  ));
                })()}
              </div>
            )}

            {/* === FOLLOWING TAB === */}
            {connectionTab === 'following' && (
              <div className="space-y-4">
                {totalFollowingCount === 0 ? (
                  <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-xs text-neutral-500">
                    <Users className="w-8 h-8 mx-auto text-neutral-300 mb-3" />
                    <p className="font-bold text-neutral-700">You&apos;re not following anyone yet.</p>
                    <p className="mt-1 text-neutral-500">Follow people, Pages, or communities to build your Lalao circle.</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('discover')}
                      className="mt-4 inline-flex rounded-full bg-[#5E43F3] px-4 py-2.5 text-[11px] font-bold text-white cursor-pointer hover:bg-[#4E34E0] transition-colors"
                    >
                      Explore
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Breakdown */}
                    <div className="flex items-center gap-3 text-[11px] text-neutral-500 font-medium">
                      <span>{totalFollowingCount} total</span>
                      <span>·</span>
                      <span>People {followingData.peopleCt}</span>
                      <span>·</span>
                      <span>Pages {followingData.pagesCt}</span>
                    </div>

                    {/* People section */}
                    {followingData.people.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">People</h4>
                        {(() => {
                          const sq = searchQuery.toLowerCase();
                          const filtered = sq
                            ? followingData.people.filter((u: any) =>
                                u.name.toLowerCase().includes(sq) ||
                                u.username.toLowerCase().includes(sq)
                              )
                            : followingData.people;
                          return filtered.map((user: any) => (
                            <div
                              key={user.id}
                              className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-3 transition-colors hover:bg-neutral-50"
                            >
                              <button
                                type="button"
                                onClick={() => handleOpenUserProfile(user as User)}
                                className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer"
                              >
                                <Avatar src={user.avatar} alt={user.name} size="md" />
                                <div className="min-w-0 flex-1">
                                  <span className="truncate text-xs sm:text-sm font-bold text-neutral-950 block">{user.name}</span>
                                  <span className="block truncate text-[11px] text-neutral-400">@{user.username}</span>
                                </div>
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleFollowUser(user.id)}
                                className="rounded-full px-3 py-1.5 text-xs font-bold bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-all cursor-pointer shrink-0"
                              >
                                Following
                              </button>
                            </div>
                          ));
                        })()}
                      </div>
                    )}

                    {/* Pages section */}
                    {followingData.pages.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Pages</h4>
                        {(() => {
                          const sq = searchQuery.toLowerCase();
                          const filtered = sq
                            ? followingData.pages.filter((p: any) =>
                                p.name.toLowerCase().includes(sq) ||
                                p.username.toLowerCase().includes(sq)
                              )
                            : followingData.pages;
                          return filtered.map((page: any) => (
                            <div
                              key={page.id}
                              className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-3 transition-colors hover:bg-neutral-50"
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-3">
                                <Avatar src={page.avatar} alt={page.name} size="md" />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="truncate text-xs sm:text-sm font-bold text-neutral-950">{page.name}</span>
                                    {page.badge && <Badge type={page.badge} />}
                                  </div>
                                  <span className="block truncate text-[11px] text-neutral-400">@{page.username}{page.location ? ` · ${page.location}` : ''}</span>
                                  <span className="text-[10px] text-neutral-400">{page.followersCount} followers</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="rounded-full px-3 py-1.5 text-xs font-bold bg-neutral-100 text-neutral-700">
                                  Following
                                </span>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Suggest a Community Modal */}
      <SuggestCommunityModal isOpen={isSuggestOpen} onClose={() => setIsSuggestOpen(false)} />
    </div>
  );
};
