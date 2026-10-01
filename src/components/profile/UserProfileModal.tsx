import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  Share2,
  Bell,
  BellRing,
  MoreHorizontal,
  CheckCircle,
  MapPin,
  MessageSquare,
  AtSign,
  Plus,
  Check,
  Heart,
  MessageCircle,
  Repeat2,
  X,
  Flame,
  Clock,
  Sparkles,
  Users,
  Copy,
  VolumeX,
  ShieldAlert,
  Compass,
  UserPlus,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { PostItem } from '../feed/PostItem';
import { Post, Rally } from '../../types';

type ProfileTab = 'posts' | 'replies' | 'media' | 'rallies';

export const UserProfileModal: React.FC = () => {
  const {
    activeUserProfile,
    setActiveUserProfile,
    currentUser,
    posts,
    cycles,
    rallies,
    openCycleStory,
    openChatWithUser,
    toggleFollowUser,
    toggleLikePost,
    toggleRepostPost,
    toggleJoinRally,
    joinRally,
    setCreateFlowType,
    setComposerInitialText,
    triggerShareToast,
    setIsEditProfileOpen,
    setActiveCommentsPostId,
  } = useLalao();

  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; alt?: string } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Only query relationship if the ID looks like a real Convex ID (no hyphens, usually ~32 chars)
  const isValidConvexId = activeUserProfile?.id && !activeUserProfile.id.includes('-');

  const liveRelationship = useQuery(
    api.social.getRelationship,
    activeUserProfile && isValidConvexId ? { targetUserId: activeUserProfile.id as any } : "skip"
  );

  const displayedRelationship = liveRelationship?.relationship || activeUserProfile?.relationship || 'none';
  const isFollowing = liveRelationship?.isFollowing ?? activeUserProfile?.isFollowing ?? false;

  useEffect(() => {
    if (activeUserProfile) {
      containerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [activeUserProfile?.id]);

  const isOwnProfile = activeUserProfile?.id === currentUser.id;

  // Active 24-hour cycle for this user
  const userCycle = cycles.find(
    (c) =>
      c.user?.id === activeUserProfile?.id ||
      c.name === activeUserProfile?.name ||
      c.user?.username === activeUserProfile?.username
  );
  const hasActiveCycle = Boolean(userCycle && userCycle.items && userCycle.items.length > 0);

  // User's posts — fetched directly by author id & username, not from the feed window
  const userPostsQuery = useQuery(
    api.social.listUserPosts,
    activeUserProfile && isValidConvexId
      ? { userId: activeUserProfile.id, username: activeUserProfile.username }
      : "skip"
  );
  const backendUserPosts = (userPostsQuery as Post[]) ?? [];
  const isPostsLoading = userPostsQuery === undefined;

  // Merge backend posts with any local posts authored by activeUserProfile
  const userPosts: Post[] = useMemo(() => {
    if (!activeUserProfile) return [];
    const backendIds = new Set(backendUserPosts.map((p) => p.id));
    const localPosts = (posts || []).filter(
      (p) =>
        (p.author?.id === activeUserProfile.id ||
         p.author?.username === activeUserProfile.username) &&
        !backendIds.has(p.id)
    );
    return [...localPosts, ...backendUserPosts];
  }, [backendUserPosts, posts, activeUserProfile]);

  // User's total cumulative likes across all posts & comments (live real-time subscription)
  const userLikesQuery = useQuery(
    (api.users as any).getUserTotalLikes,
    activeUserProfile && isValidConvexId ? { userId: activeUserProfile.id, username: activeUserProfile.username } : "skip"
  );
  const totalLikes = userLikesQuery?.totalLikes ?? 0;


  // User's media posts (photos/videos)
  const userMediaPosts = useMemo(() => {
    return userPosts.filter((p) => Boolean(p.mediaUrl));
  }, [userPosts]);

  // User's replies across posts
  const userReplies = useMemo(() => {
    if (!activeUserProfile) return [];
    const repliesList: Array<{
      id: string;
      post: Post;
      text: string;
      createdAt: string;
      likesCount: number;
      isLiked?: boolean;
    }> = [];

    posts.forEach((p) => {
      p.comments?.forEach((c) => {
        if (c.author.id === activeUserProfile.id || c.author.username === activeUserProfile.username) {
          repliesList.push({
            id: c.id,
            post: p,
            text: c.text,
            createdAt: c.createdAt,
            likesCount: c.likesCount,
            isLiked: c.isLiked,
          });
        }
        c.replies?.forEach((r) => {
          if (r.author.id === activeUserProfile.id || r.author.username === activeUserProfile.username) {
            repliesList.push({
              id: r.id,
              post: p,
              text: r.text,
              createdAt: r.createdAt,
              likesCount: r.likesCount,
              isLiked: r.isLiked,
            });
          }
        });
      });
    });

    return repliesList;
  }, [posts, activeUserProfile]);

  // User's rallies (created or joined)
  const userRallies = useMemo(() => {
    if (!activeUserProfile) return [];
    return rallies.filter(
      (r) =>
        r.creator.id === activeUserProfile.id ||
        r.creator.username === activeUserProfile.username ||
        r.interestedUsers?.some((u) => u.id === activeUserProfile.id || u.username === activeUserProfile.username)
    );
  }, [rallies, activeUserProfile]);

  // Filtered lists if search is active
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return userPosts;
    const q = searchQuery.toLowerCase();
    return userPosts.filter((p) => p.text.toLowerCase().includes(q) || p.location?.toLowerCase().includes(q));
  }, [userPosts, searchQuery]);

  const filteredReplies = useMemo(() => {
    if (!searchQuery.trim()) return userReplies;
    const q = searchQuery.toLowerCase();
    return userReplies.filter(
      (r) => r.text.toLowerCase().includes(q) || r.post.text.toLowerCase().includes(q)
    );
  }, [userReplies, searchQuery]);

  const filteredMedia = useMemo(() => {
    if (!searchQuery.trim()) return userMediaPosts;
    const q = searchQuery.toLowerCase();
    return userMediaPosts.filter((m) => m.text.toLowerCase().includes(q));
  }, [userMediaPosts, searchQuery]);

  if (!activeUserProfile) return null;

  const formatFollowers = (count?: number) => {
    if (count === undefined || count === null) return '0';
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (count >= 10_000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    return count.toLocaleString();
  };

  const formatLikes = (count?: number) => {
    if (count === undefined || count === null) return '0';
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (count >= 1_000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    return count.toLocaleString();
  };


  // Actions
  const handleFollowToggle = () => {
    toggleFollowUser(activeUserProfile.id);
  };

  const handleMessage = () => {
    openChatWithUser(activeUserProfile);
    setActiveUserProfile(null);
  };

  const handleMention = () => {
    setComposerInitialText(`@${activeUserProfile.username} `);
    setCreateFlowType('post');
    setActiveUserProfile(null);
  };

  const handleOpenCycleStory = () => {
    if (userCycle) {
      openCycleStory(userCycle.id, 0);
    }
  };

  const handleShareProfile = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${activeUserProfile.name} on Lalao`,
          text: `Check out ${activeUserProfile.name} (@${activeUserProfile.username}) on Lalao!`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      triggerShareToast(`Copied profile link for @${activeUserProfile.username}`);
    }
    setIsMoreMenuOpen(false);
  };

  const handleToggleNotifications = () => {
    const nextState = !isNotificationsEnabled;
    setIsNotificationsEnabled(nextState);
    triggerShareToast(
      nextState
        ? `You will now receive alerts when @${activeUserProfile.username} posts`
        : `Turned off post alerts for @${activeUserProfile.username}`
    );
    setIsMoreMenuOpen(false);
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
    triggerShareToast(
      !isMuted
        ? `Muted posts from @${activeUserProfile.username}`
        : `Unmuted @${activeUserProfile.username}`
    );
    setIsMoreMenuOpen(false);
  };

  return (
    <div
      id="user-profile-overlay"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={() => setActiveUserProfile(null)}
    >
      <div
        ref={containerRef}
        id="user-profile-screen"
        className="bg-theme-surface w-full sm:max-w-md md:max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 relative z-10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full flex-1 flex flex-col bg-theme-surface">
        {/* Sticky Top Header Bar */}
        <header className="sticky top-0 z-30 bg-theme-surface/95 backdrop-blur-md border-b border-theme-divider-light px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              id="btn-profile-back"
              onClick={() => setActiveUserProfile(null)}
              className="p-1.5 -ml-1.5 rounded-full text-theme-primary hover:bg-theme-surface-hover active:scale-95 transition-all cursor-pointer"
              title="Back"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-theme-primary tracking-tight">
                {activeUserProfile.username}
              </span>
              {activeUserProfile.isVerified && (
                <CheckCircle className="w-3.5 h-3.5 text-[#5E43F3] fill-[#5E43F3]/20" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Search Posts */}
            <button
              id="btn-profile-search"
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                if (isSearchOpen) setSearchQuery('');
              }}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                isSearchOpen ? 'bg-[#5E43F3]/10 text-[#5E43F3]' : 'text-theme-secondary hover:bg-theme-surface-hover'
              }`}
              title="Search profile"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Share / Link */}
            <button
              id="btn-profile-share"
              onClick={handleShareProfile}
              className="p-2 rounded-full text-theme-secondary hover:bg-theme-surface-hover transition-colors cursor-pointer"
              title="Share profile"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Post Notification Alert Bell (For others) */}
            {!isOwnProfile && (
              <button
                id="btn-profile-bell"
                onClick={handleToggleNotifications}
                className={`p-2 rounded-full transition-colors cursor-pointer relative ${
                  isNotificationsEnabled
                    ? 'text-[#5E43F3] bg-[#5E43F3]/10'
                    : 'text-theme-secondary hover:bg-theme-surface-hover'
                }`}
                title={isNotificationsEnabled ? 'Post alerts enabled' : 'Turn on post alerts'}
              >
                {isNotificationsEnabled ? (
                  <BellRing className="w-4 h-4" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
                {isNotificationsEnabled && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#5E43F3]" />
                )}
              </button>
            )}

            {/* Overflow More Options Menu */}
            <button
              id="btn-profile-more"
              onClick={() => setIsMoreMenuOpen(true)}
              className="p-2 rounded-full text-theme-secondary hover:bg-theme-surface-hover transition-colors cursor-pointer"
              title="More actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* In-Profile Search Bar Overlay */}
        {isSearchOpen && (
          <div className="bg-theme-base px-4 py-2 border-b border-theme-divider animate-in slide-in-from-top-2 duration-150">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-theme-tertiary absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search @${activeUserProfile.username}'s posts, media & replies...`}
                autoFocus
                className="w-full bg-theme-surface border border-theme-divider rounded-full pl-9 pr-8 py-1.5 text-xs text-theme-primary placeholder:text-theme-tertiary focus:outline-none focus:border-[#5E43F3] focus:ring-1 focus:ring-[#5E43F3]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 p-1 rounded-full text-theme-tertiary hover:text-theme-secondary"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Scrollable Profile Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Main User Card (Matching screenshot layout) */}
          <div className="px-5 pt-4 pb-3 space-y-3 border-b border-theme-divider-light">
            {/* Top Identity Row: Name/Stats on Left, Big Avatar on Right */}
            <div className="flex items-start justify-between gap-4">
              {/* Left Column: Name, Username, Stats */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="text-[22px] sm:text-2xl font-black text-theme-primary tracking-tight leading-tight">
                    {activeUserProfile.name}
                  </h1>
                  {activeUserProfile.isVerified && (
                    <CheckCircle className="w-4 h-4 text-[#5E43F3] fill-[#5E43F3]/20 shrink-0" />
                  )}
                </div>

                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs sm:text-[13px] font-medium text-theme-tertiary">
                    @{activeUserProfile.username}
                  </span>
                  {activeUserProfile.badge && <Badge type={activeUserProfile.badge} />}
                </div>

                {/* Follower Count and Total Likes Count (reactive real-time sum) */}
                <div className="flex items-center gap-1.5 text-xs text-theme-tertiary mt-2 font-medium">
                  <span className="text-theme-primary font-bold">
                    {formatFollowers(activeUserProfile.followersCount)}
                  </span>
                  <span>followers</span>
                  <span>·</span>
                  <span className="text-theme-primary font-bold">
                    {formatLikes(totalLikes)}
                  </span>
                  <span>{totalLikes === 1 ? 'Like' : 'Likes'}</span>
                </div>
              </div>

              {/* Right Column: Prominent Circular Avatar with 24h Cycle Ring */}
              <div className="shrink-0 pt-0.5">
                {hasActiveCycle ? (
                  <div
                    onClick={handleOpenCycleStory}
                    className="p-[3px] rounded-full bg-gradient-to-tr from-[#5E43F3] via-fuchsia-500 to-amber-400 cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md relative group"
                    title="Tap to watch 24h Cycle Story"
                  >
                    <div className="bg-theme-surface p-[2px] rounded-full">
                      <Avatar
                        src={activeUserProfile.avatar}
                        alt={activeUserProfile.name}
                        size="lg"
                        className="w-16 h-16 sm:w-18 sm:h-18"
                      />
                    </div>
                    {/* Pulsing indicator badge */}
                    <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-gradient-to-tr from-[#5E43F3] to-fuchsia-500 border-2 border-white flex items-center justify-center text-[8px] text-white font-black shadow-xs">
                      <Flame className="w-2.5 h-2.5 fill-current" />
                    </span>
                  </div>
                ) : (
                  <div
                    onClick={() =>
                      setLightboxMedia({
                        url: activeUserProfile.avatar,
                        alt: activeUserProfile.name,
                      })
                    }
                    className="cursor-pointer hover:opacity-95 transition-opacity"
                    title="Tap to view photo"
                  >
                    <Avatar
                      src={activeUserProfile.avatar}
                      alt={activeUserProfile.name}
                      size="lg"
                      className="w-16 h-16 sm:w-18 sm:h-18 ring-2 ring-neutral-100"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            {activeUserProfile.bio && (
              <p className="text-[13px] sm:text-sm text-theme-primary leading-relaxed pt-0.5">
                {activeUserProfile.bio}
              </p>
            )}

            {/* Location & Mutual Connections Footprint */}
            <div className="space-y-1.5 text-xs text-theme-tertiary pt-0.5">
              {activeUserProfile.location && (() => {
                const cleanLoc = activeUserProfile.location.replace(/\s*\(Detected\)\s*/i, '').replace(/^GPS Detected$/i, '').trim();
                return cleanLoc ? (
                  <div className="flex items-center gap-1.5 text-theme-secondary font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#5E43F3] shrink-0" />
                    <span>{cleanLoc}</span>
                  </div>
                ) : null;
              })()}

              {activeUserProfile.mutualInfo ? (
                <div className="flex items-center gap-1.5 text-theme-tertiary text-[11px]">
                  <Users className="w-3.5 h-3.5 text-theme-tertiary shrink-0" />
                  <span>{activeUserProfile.mutualInfo}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-theme-tertiary text-[11px]">
                  <Compass className="w-3 h-3 text-[#5E43F3]" />
                  <span>Connected via Lalao West Africa Community</span>
                </div>
              )}
            </div>

            {/* Active 24h Cycle Quick-Banner (Lalao Exclusive) */}
            {hasActiveCycle && (
              <div
                onClick={handleOpenCycleStory}
                className="mt-2 p-2.5 rounded-2xl bg-gradient-to-r from-[#5E43F3]/10 via-fuchsia-50 to-amber-50/80 border border-[#5E43F3]/25 flex items-center justify-between cursor-pointer hover:border-[#5E43F3]/40 active:scale-[0.99] transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#5E43F3] to-fuchsia-500 flex items-center justify-center text-white shadow-2xs">
                    <Flame className="w-4 h-4 fill-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-theme-primary">
                        24h Cycle Active
                      </span>
                      <span className="text-[10px] font-bold text-[#5E43F3] bg-[#5E43F3]/15 px-1.5 py-0.2 rounded-full">
                        {userCycle?.items?.length || 0} updates
                      </span>
                    </div>
                    <p className="text-[11px] text-theme-secondary truncate max-w-[200px]">
                      {userCycle?.items?.[0]?.caption ||
                        userCycle?.items?.[0]?.text ||
                        'Tap to watch daily moments'}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-[#5E43F3] group-hover:translate-x-0.5 transition-transform">
                  Watch &rarr;
                </span>
              </div>
            )}

            {/* Call to Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              {isOwnProfile ? (
                <>
                  <button
                    id="btn-profile-edit-self"
                    onClick={() => setIsEditProfileOpen(true)}
                    className="flex-1 py-2 px-4 rounded-xl bg-theme-inverse hover:bg-theme-inverse text-theme-text-inverse text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    Edit profile
                  </button>
                  <button
                    id="btn-profile-share-self"
                    onClick={handleShareProfile}
                    className="flex-1 py-2 px-4 rounded-xl border border-theme-divider-strong hover:bg-theme-base text-theme-primary text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share profile
                  </button>
                </>
              ) : (
                <>
                  {/* Follow Button (Toggles between Friends, Follow Back, Following, Follow) */}
                  <button
                    id="btn-profile-follow"
                    onClick={handleFollowToggle}
                    className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                      displayedRelationship === 'friends'
                        ? 'bg-theme-surface-hover hover:bg-theme-surface-active text-theme-primary border border-theme-divider'
                        : displayedRelationship === 'follower'
                        ? 'bg-[#5E43F3] hover:bg-[#4E34E0] text-white'
                        : isFollowing
                        ? 'bg-theme-surface-hover hover:bg-theme-surface-active text-theme-primary border border-theme-divider'
                        : 'bg-theme-inverse hover:bg-theme-inverse text-theme-text-inverse'
                    }`}
                  >
                    {displayedRelationship === 'friends' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-theme-secondary" />
                        <span>Friends</span>
                      </>
                    ) : displayedRelationship === 'follower' ? (
                      <>
                        <UserPlus className="w-3.5 h-3.5 text-white" />
                        <span>Follow Back</span>
                      </>
                    ) : isFollowing ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-theme-secondary" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 text-white" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>

                  {/* Message Button (Opens ChatModal directly!) */}
                  <button
                    id="btn-profile-message"
                    onClick={handleMessage}
                    className="flex-1 py-2 px-3 rounded-xl border border-theme-divider-strong hover:bg-theme-base text-theme-primary text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Send direct message"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-theme-secondary" />
                    <span>Message</span>
                  </button>

                  {/* Mention Button */}
                  <button
                    id="btn-profile-mention"
                    onClick={handleMention}
                    className="py-2 px-3 rounded-xl border border-theme-divider-strong hover:bg-theme-base text-theme-primary text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    title={`Mention @${activeUserProfile.username} in a post`}
                  >
                    <AtSign className="w-3.5 h-3.5 text-theme-secondary" />
                    <span className="hidden xs:inline">Mention</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Navigation Tabs (Posts, Replies, Media, Rallies & Cycles) */}
          <div className="sticky top-0 z-20 bg-theme-surface border-b border-theme-divider-light flex items-center px-2">
            {(
              [
                { id: 'posts', label: 'Posts', count: userPosts.length },
                { id: 'replies', label: 'Replies', count: userReplies.length },
                { id: 'media', label: 'Media', count: userMediaPosts.length },
                { id: 'rallies', label: 'Rallies', count: userRallies.length },
              ] as const
            ).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-profile-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 text-center text-xs sm:text-[13px] font-bold transition-all relative cursor-pointer ${
                    isActive ? 'text-theme-primary' : 'text-theme-tertiary hover:text-theme-secondary'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                          isActive
                            ? 'bg-theme-inverse text-theme-text-inverse'
                            : 'bg-theme-surface-hover text-theme-tertiary'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </div>
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-theme-inverse rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content Section */}
          <div className="pb-16 bg-theme-surface min-h-[320px]">
            {/* 1. POSTS TAB */}
            {activeTab === 'posts' && (
              <div>
                {isPostsLoading ? (
                  <div className="flex justify-center p-10">
                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#5E43F3]" />
                  </div>
                ) : filteredPosts.length > 0 ? (
                  <div className="divide-y divide-neutral-100">
                    {filteredPosts.map((post) => (
                      <PostItem key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 px-4 text-center">
                    <p className="text-sm font-semibold text-theme-primary">
                      {searchQuery ? 'No matching posts found' : 'No posts yet'}
                    </p>
                    <p className="text-xs text-theme-tertiary mt-1">
                      {searchQuery
                        ? 'Try searching with different keywords'
                        : isOwnProfile
                        ? "You haven't posted yet. Tap the center + button to share with your local community."
                        : `When @${activeUserProfile.username} posts, their thoughts will show up here.`}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 2. REPLIES TAB */}
            {activeTab === 'replies' && (
              <div>
                {filteredReplies.length > 0 ? (
                  <div className="divide-y divide-neutral-100">
                    {filteredReplies.map((reply) => (
                      <div
                        key={reply.id}
                        className="p-4 hover:bg-theme-base/40 transition-colors"
                      >
                        {/* Reference to parent post */}
                        <div className="text-[11px] text-theme-tertiary flex items-center gap-1 mb-2 font-medium">
                          <span>Replied to</span>
                          <span className="font-bold text-theme-secondary">
                            @{reply.post.author.username}
                          </span>
                          <span>&middot;</span>
                          <span className="text-theme-tertiary truncate max-w-[200px]">
                            &ldquo;{reply.post.text}&rdquo;
                          </span>
                        </div>

                        <div className="flex items-start gap-3">
                          <Avatar
                            src={activeUserProfile.avatar}
                            alt={activeUserProfile.name}
                            size="sm"
                            className="shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-theme-primary">
                                {activeUserProfile.name}
                              </span>
                              <span className="text-[11px] text-theme-tertiary">
                                {reply.createdAt}
                              </span>
                            </div>
                            <p className="text-xs text-theme-primary mt-1 leading-relaxed whitespace-pre-line">
                              {reply.text}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-[11px] text-theme-tertiary">
                              <button
                                onClick={() => setActiveCommentsPostId(reply.post.id)}
                                className="flex items-center gap-1 hover:text-[#5E43F3] transition-colors cursor-pointer"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>View thread</span>
                              </button>
                              <span className="flex items-center gap-1">
                                <Heart className="w-3.5 h-3.5 text-rose-500" />
                                <span>{reply.likesCount}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 px-4 text-center">
                    <p className="text-sm font-semibold text-theme-primary">
                      {searchQuery ? 'No matching replies' : 'No replies yet'}
                    </p>
                    <p className="text-xs text-theme-tertiary mt-1">
                      Discussions and community comments will appear here.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 3. MEDIA TAB (Photo / Video Grid) */}
            {activeTab === 'media' && (
              <div>
                {filteredMedia.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1 p-1">
                    {filteredMedia.map((item) => (
                      <div
                        key={item.id}
                        onClick={() =>
                          setLightboxMedia({
                            url: item.mediaUrl!,
                            alt: item.text,
                          })
                        }
                        className="aspect-square relative overflow-hidden bg-theme-surface-hover cursor-pointer group rounded-lg"
                      >
                        <img
                          src={item.mediaUrl}
                          alt={item.text}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-xs font-bold">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 fill-white" />
                            <span>{item.likesCount}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5 fill-white" />
                            <span>{item.commentsCount}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 px-4 text-center">
                    <p className="text-sm font-semibold text-theme-primary">No media yet</p>
                    <p className="text-xs text-theme-tertiary mt-1">
                      Photos and videos posted by @{activeUserProfile.username} will appear here.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 4. RALLIES & CYCLES TAB (Lalao Hyper-Local Specialty) */}
            {activeTab === 'rallies' && (
              <div className="p-4 space-y-4">
                {/* Active Cycle Status preview if available */}
                {hasActiveCycle && userCycle && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary mb-2 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-[#5E43F3]" />
                      <span>Active 24-Hour Cycle</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {userCycle.items.map((item, idx) => (
                        <div
                          key={item.id}
                          onClick={() => openCycleStory(userCycle.id, idx)}
                          className="aspect-3/4 rounded-2xl overflow-hidden relative cursor-pointer group shadow-xs border border-theme-divider-light"
                        >
                          {item.mediaUrl ? (
                            <img
                              src={item.mediaUrl}
                              alt="Story snapshot"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div
                              className={`w-full h-full bg-gradient-to-tr ${
                                item.backgroundColor || 'from-[#5E43F3] to-fuchsia-600'
                              } p-3 flex flex-col justify-between text-white`}
                            >
                              <Sparkles className="w-4 h-4 opacity-80" />
                              <p className="text-xs font-bold line-clamp-3 leading-snug">
                                {item.text}
                              </p>
                              <div />
                            </div>
                          )}
                          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur-xs text-[10px] font-semibold text-white flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{item.timeRemaining || '24h'}</span>
                          </div>
                          {item.caption && (
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-[11px] truncate">
                              {item.caption}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Community Rallies Organized or Joined */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#5E43F3]" />
                    <span>Community Movements & Rallies</span>
                  </h3>
                  {userRallies.length > 0 ? (
                    <div className="space-y-2.5">
                      {userRallies.map((rally) => (
                        <div
                          key={rally.id}
                          className="p-3.5 rounded-2xl bg-theme-base border border-theme-divider-light hover:border-theme-divider transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-bold text-[#5E43F3] uppercase tracking-wide">
                                {rally.category} &middot; {rally.timeDate}
                              </span>
                              <h4 className="text-xs sm:text-sm font-bold text-theme-primary mt-0.5">
                                {rally.title}
                              </h4>
                              <p className="text-xs text-theme-secondary mt-1 line-clamp-2">
                                {rally.description}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-theme-tertiary mt-2">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-[#5E43F3]" />
                                  {rally.location}
                                </span>
                                <span>&middot;</span>
                                <span className="font-semibold text-theme-primary">
                                  {rally.joinedUsersCount} joined
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => joinRally(rally.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                rally.isJoined
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-[#5E43F3] text-white hover:bg-[#4d35db]'
                              }`}
                            >
                              {rally.isJoined ? 'Attending' : 'Join'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center bg-theme-base rounded-2xl border border-theme-divider-light">
                      <p className="text-xs font-semibold text-theme-secondary">
                        No active rallies
                      </p>
                      <p className="text-[11px] text-theme-tertiary mt-0.5">
                        Local meetups, sports rallies, and causes will be listed here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* More Actions Bottom Sheet Modal */}
        {isMoreMenuOpen && (
          <div
            className="fixed inset-0 z-60 bg-black/40 backdrop-blur-2xs flex items-end justify-center animate-in fade-in"
            onClick={() => setIsMoreMenuOpen(false)}
          >
            <div
              className="w-full max-w-md bg-theme-surface rounded-t-3xl p-4 space-y-2 shadow-2xl animate-in slide-in-from-bottom duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full bg-theme-divider-strong mx-auto mb-3" />

              <button
                onClick={handleShareProfile}
                className="w-full p-3 rounded-2xl hover:bg-theme-surface-hover flex items-center gap-3 text-xs font-bold text-theme-primary transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-theme-secondary" />
                <span>Share profile</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard?.writeText?.(`@${activeUserProfile.username}`);
                  triggerShareToast(`Copied @${activeUserProfile.username} to clipboard`);
                  setIsMoreMenuOpen(false);
                }}
                className="w-full p-3 rounded-2xl hover:bg-theme-surface-hover flex items-center gap-3 text-xs font-bold text-theme-primary transition-colors cursor-pointer"
              >
                <Copy className="w-4 h-4 text-theme-secondary" />
                <span>Copy Lalao handle</span>
              </button>

              {!isOwnProfile && (
                <>
                  <button
                    onClick={handleToggleNotifications}
                    className="w-full p-3 rounded-2xl hover:bg-theme-surface-hover flex items-center gap-3 text-xs font-bold text-theme-primary transition-colors cursor-pointer"
                  >
                    <Bell className="w-4 h-4 text-theme-secondary" />
                    <span>
                      {isNotificationsEnabled
                        ? 'Turn off post notifications'
                        : 'Turn on post notifications'}
                    </span>
                  </button>

                  <button
                    onClick={handleMute}
                    className="w-full p-3 rounded-2xl hover:bg-theme-surface-hover flex items-center gap-3 text-xs font-bold text-theme-primary transition-colors cursor-pointer"
                  >
                    <VolumeX className="w-4 h-4 text-theme-secondary" />
                    <span>{isMuted ? `Unmute @${activeUserProfile.username}` : `Mute @${activeUserProfile.username}`}</span>
                  </button>

                  <button
                    onClick={() => {
                      triggerShareToast(`Report submitted for @${activeUserProfile.username}`);
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full p-3 rounded-2xl hover:bg-rose-50 flex items-center gap-3 text-xs font-bold text-rose-600 transition-colors cursor-pointer"
                  >
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Report or Block user</span>
                  </button>
                </>
              )}

              <div className="pt-2">
                <button
                  onClick={() => setIsMoreMenuOpen(false)}
                  className="w-full py-2.5 rounded-2xl bg-theme-surface-hover text-xs font-bold text-theme-secondary hover:bg-theme-surface-active transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full Screen Lightbox Preview for Photos */}
        {lightboxMedia && (
          <div
            className="fixed inset-0 z-70 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
            onClick={() => setLightboxMedia(null)}
          >
            <button
              onClick={() => setLightboxMedia(null)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-theme-surface/10 text-white hover:bg-theme-surface/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxMedia.url}
              alt={lightboxMedia.alt || 'Enlarged photo'}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
