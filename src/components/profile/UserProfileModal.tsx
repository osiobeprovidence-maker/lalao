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

  const liveRelationship = useQuery(
    api.social.getRelationship,
    activeUserProfile ? { targetUserId: activeUserProfile.id as any } : "skip"
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

  // User's posts — fetched directly by author id, not from the feed window
  const userPostsQuery = useQuery(
    api.social.listUserPosts,
    activeUserProfile ? { userId: activeUserProfile.id } : "skip"
  );
  const userPosts: Post[] = (userPostsQuery as any[]) ?? [];
  const isPostsLoading = userPostsQuery === undefined;

  // User's total cumulative likes across all posts & comments (live real-time subscription)
  const userLikesQuery = useQuery(
    (api.users as any).getUserTotalLikes,
    activeUserProfile ? { userId: activeUserProfile.id, username: activeUserProfile.username } : "skip"
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

  // Numbers formatter
  const formatFollowers = (count: number) => {
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (count >= 10_000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    return count.toLocaleString();
  };

  const formatLikes = (count: number) => {
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
        className="bg-white w-full sm:max-w-md md:max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 relative z-10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full flex-1 flex flex-col bg-white">
        {/* Sticky Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              id="btn-profile-back"
              onClick={() => setActiveUserProfile(null)}
              className="p-1.5 -ml-1.5 rounded-full text-neutral-800 hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer"
              title="Back"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-neutral-900 tracking-tight">
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
                isSearchOpen ? 'bg-[#5E43F3]/10 text-[#5E43F3]' : 'text-neutral-700 hover:bg-neutral-100'
              }`}
              title="Search profile"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Share / Link */}
            <button
              id="btn-profile-share"
              onClick={handleShareProfile}
              className="p-2 rounded-full text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
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
                    : 'text-neutral-700 hover:bg-neutral-100'
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
              className="p-2 rounded-full text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              title="More actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* In-Profile Search Bar Overlay */}
        {isSearchOpen && (
          <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200 animate-in slide-in-from-top-2 duration-150">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search @${activeUserProfile.username}'s posts, media & replies...`}
                autoFocus
                className="w-full bg-white border border-neutral-200 rounded-full pl-9 pr-8 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#5E43F3] focus:ring-1 focus:ring-[#5E43F3]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 p-1 rounded-full text-neutral-400 hover:text-neutral-700"
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
          <div className="px-5 pt-4 pb-3 space-y-3 border-b border-neutral-100">
            {/* Top Identity Row: Name/Stats on Left, Big Avatar on Right */}
            <div className="flex items-start justify-between gap-4">
              {/* Left Column: Name, Username, Stats */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="text-[22px] sm:text-2xl font-black text-neutral-950 tracking-tight leading-tight">
                    {activeUserProfile.name}
                  </h1>
                  {activeUserProfile.isVerified && (
                    <CheckCircle className="w-4 h-4 text-[#5E43F3] fill-[#5E43F3]/20 shrink-0" />
                  )}
                </div>

                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs sm:text-[13px] font-medium text-neutral-500">
                    @{activeUserProfile.username}
                  </span>
                  {activeUserProfile.badge && <Badge type={activeUserProfile.badge} />}
                </div>

                {/* Follower Count and Total Likes Count (reactive real-time sum) */}
                <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-2 font-medium">
                  <span className="text-neutral-900 font-bold">
                    {formatFollowers(activeUserProfile.followersCount)}
                  </span>
                  <span>followers</span>
                  <span>·</span>
                  <span className="text-neutral-900 font-bold">
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
                    <div className="bg-white p-[2px] rounded-full">
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
              <p className="text-[13px] sm:text-sm text-neutral-800 leading-relaxed pt-0.5">
                {activeUserProfile.bio}
              </p>
            )}

            {/* Location & Mutual Connections Footprint */}
            <div className="space-y-1.5 text-xs text-neutral-500 pt-0.5">
              {activeUserProfile.location && (
                <div className="flex items-center gap-1.5 text-neutral-600 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#5E43F3] shrink-0" />
                  <span>{activeUserProfile.location}</span>
                </div>
              )}

              {activeUserProfile.mutualInfo ? (
                <div className="flex items-center gap-1.5 text-neutral-500 text-[11px]">
                  <Users className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>{activeUserProfile.mutualInfo}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-neutral-400 text-[11px]">
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
                      <span className="text-xs font-bold text-neutral-950">
                        24h Cycle Active
                      </span>
                      <span className="text-[10px] font-bold text-[#5E43F3] bg-[#5E43F3]/15 px-1.5 py-0.2 rounded-full">
                        {userCycle?.items?.length || 0} updates
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-600 truncate max-w-[200px]">
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
                    className="flex-1 py-2 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    Edit profile
                  </button>
                  <button
                    id="btn-profile-share-self"
                    onClick={handleShareProfile}
                    className="flex-1 py-2 px-4 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-neutral-900 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
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
                        ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200'
                        : displayedRelationship === 'follower'
                        ? 'bg-[#5E43F3] hover:bg-[#4E34E0] text-white'
                        : isFollowing
                        ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200'
                        : 'bg-neutral-950 hover:bg-neutral-800 text-white'
                    }`}
                  >
                    {displayedRelationship === 'friends' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-neutral-700" />
                        <span>Friends</span>
                      </>
                    ) : displayedRelationship === 'follower' ? (
                      <>
                        <UserPlus className="w-3.5 h-3.5 text-white" />
                        <span>Follow Back</span>
                      </>
                    ) : isFollowing ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-neutral-700" />
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
                    className="flex-1 py-2 px-3 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-neutral-900 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Send direct message"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-neutral-700" />
                    <span>Message</span>
                  </button>

                  {/* Mention Button */}
                  <button
                    id="btn-profile-mention"
                    onClick={handleMention}
                    className="py-2 px-3 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-neutral-900 text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    title={`Mention @${activeUserProfile.username} in a post`}
                  >
                    <AtSign className="w-3.5 h-3.5 text-neutral-700" />
                    <span className="hidden xs:inline">Mention</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Navigation Tabs (Posts, Replies, Media, Rallies & Cycles) */}
          <div className="sticky top-0 z-20 bg-white border-b border-neutral-100 flex items-center px-2">
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
                    isActive ? 'text-neutral-950' : 'text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                          isActive
                            ? 'bg-neutral-900 text-white'
                            : 'bg-neutral-100 text-neutral-500'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </div>
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-neutral-950 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content Section */}
          <div className="pb-16 bg-white min-h-[320px]">
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
                      <article
                        key={post.id}
                        id={`user-post-${post.id}`}
                        className="p-4 hover:bg-neutral-50/40 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {/* Author Avatar with mini Story Ring if active */}
                          <Avatar
                            src={post.author.avatar}
                            alt={post.author.name}
                            size="md"
                            className="shrink-0"
                          />

                          <div className="flex-1 min-w-0">
                            {/* Author Row */}
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-sm text-neutral-900">
                                  {post.author.name}
                                </span>
                                {post.author.isVerified && (
                                  <CheckCircle className="w-3.5 h-3.5 text-[#5E43F3] fill-[#5E43F3]/20" />
                                )}
                                <span className="text-xs text-neutral-400">
                                  @{post.author.username}
                                </span>
                                <span className="text-xs text-neutral-400">·</span>
                                <span className="text-xs text-neutral-400">
                                  {post.createdAt}
                                </span>
                              </div>

                              <button
                                onClick={() => triggerShareToast('Post link copied')}
                                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-full"
                              >
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Post Text */}
                            <p className="text-sm text-neutral-900 mt-1.5 leading-relaxed whitespace-pre-line">
                              {post.text}
                            </p>

                            {/* Location Tag */}
                            {post.location && (
                              <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-[11px] font-medium">
                                <MapPin className="w-2.5 h-2.5 text-[#5E43F3]" />
                                <span>{post.location}</span>
                              </div>
                            )}

                            {/* Attached Image / Media */}
                            {post.mediaUrl && (
                              <div className="mt-2.5 rounded-2xl overflow-hidden border border-neutral-100 shadow-2xs max-h-[360px] bg-neutral-100">
                                <img
                                  src={post.mediaUrl}
                                  alt="Post attachment"
                                  className="w-full h-auto object-cover max-h-[360px] cursor-pointer hover:scale-[1.01] transition-transform"
                                  loading="lazy"
                                  onClick={() =>
                                    setLightboxMedia({
                                      url: post.mediaUrl!,
                                      alt: post.text,
                                    })
                                  }
                                />
                              </div>
                            )}

                            {/* Interaction Bar */}
                            <div className="flex items-center gap-6 mt-3 pt-1 text-neutral-500">
                              {/* Love / Heart */}
                              <button
                                onClick={() => toggleLikePost(post.id)}
                                className={`flex items-center gap-1.5 text-xs font-semibold transition-colors group cursor-pointer ${
                                  post.isLiked ? 'text-rose-600' : 'hover:text-rose-600'
                                }`}
                              >
                                <Heart
                                  className={`w-4 h-4 transition-transform group-active:scale-125 ${
                                    post.isLiked ? 'fill-rose-600' : ''
                                  }`}
                                />
                                <span>{post.likesCount}</span>
                              </button>

                              {/* Comment */}
                              <button
                                onClick={() => setActiveCommentsPostId(post.id)}
                                className="flex items-center gap-1.5 text-xs font-semibold hover:text-[#5E43F3] transition-colors cursor-pointer"
                              >
                                <MessageCircle className="w-4 h-4" />
                                <span>{post.commentsCount}</span>
                              </button>

                              {/* Repost */}
                              <button
                                onClick={() => toggleRepostPost(post.id)}
                                className={`flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                                  post.isReposted ? 'text-emerald-600' : 'hover:text-emerald-600'
                                }`}
                              >
                                <Repeat2 className="w-4 h-4" />
                                <span>{post.repostsCount}</span>
                              </button>

                              {/* Share */}
                              <button
                                onClick={() => triggerShareToast('Post shared to clipboard')}
                                className="flex items-center gap-1.5 text-xs font-semibold hover:text-neutral-900 transition-colors cursor-pointer ml-auto"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 px-4 text-center">
                    <p className="text-sm font-semibold text-neutral-800">
                      {searchQuery ? 'No matching posts found' : 'No posts yet'}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {searchQuery
                        ? 'Try searching with different keywords'
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
                        className="p-4 hover:bg-neutral-50/40 transition-colors"
                      >
                        {/* Reference to parent post */}
                        <div className="text-[11px] text-neutral-400 flex items-center gap-1 mb-2 font-medium">
                          <span>Replied to</span>
                          <span className="font-bold text-neutral-700">
                            @{reply.post.author.username}
                          </span>
                          <span>&middot;</span>
                          <span className="text-neutral-400 truncate max-w-[200px]">
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
                              <span className="font-bold text-xs text-neutral-900">
                                {activeUserProfile.name}
                              </span>
                              <span className="text-[11px] text-neutral-400">
                                {reply.createdAt}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-800 mt-1 leading-relaxed whitespace-pre-line">
                              {reply.text}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-[11px] text-neutral-400">
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
                    <p className="text-sm font-semibold text-neutral-800">
                      {searchQuery ? 'No matching replies' : 'No replies yet'}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
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
                        className="aspect-square relative overflow-hidden bg-neutral-100 cursor-pointer group rounded-lg"
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
                    <p className="text-sm font-semibold text-neutral-800">No media yet</p>
                    <p className="text-xs text-neutral-400 mt-1">
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
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-[#5E43F3]" />
                      <span>Active 24-Hour Cycle</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {userCycle.items.map((item, idx) => (
                        <div
                          key={item.id}
                          onClick={() => openCycleStory(userCycle.id, idx)}
                          className="aspect-3/4 rounded-2xl overflow-hidden relative cursor-pointer group shadow-xs border border-neutral-100"
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
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#5E43F3]" />
                    <span>Community Movements & Rallies</span>
                  </h3>
                  {userRallies.length > 0 ? (
                    <div className="space-y-2.5">
                      {userRallies.map((rally) => (
                        <div
                          key={rally.id}
                          className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100 hover:border-neutral-200 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-bold text-[#5E43F3] uppercase tracking-wide">
                                {rally.category} &middot; {rally.timeDate}
                              </span>
                              <h4 className="text-xs sm:text-sm font-bold text-neutral-900 mt-0.5">
                                {rally.title}
                              </h4>
                              <p className="text-xs text-neutral-600 mt-1 line-clamp-2">
                                {rally.description}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-2">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-[#5E43F3]" />
                                  {rally.location}
                                </span>
                                <span>&middot;</span>
                                <span className="font-semibold text-neutral-800">
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
                    <div className="py-8 text-center bg-neutral-50 rounded-2xl border border-neutral-100">
                      <p className="text-xs font-semibold text-neutral-700">
                        No active rallies
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
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
              className="w-full max-w-md bg-white rounded-t-3xl p-4 space-y-2 shadow-2xl animate-in slide-in-from-bottom duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full bg-neutral-300 mx-auto mb-3" />

              <button
                onClick={handleShareProfile}
                className="w-full p-3 rounded-2xl hover:bg-neutral-100 flex items-center gap-3 text-xs font-bold text-neutral-900 transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-neutral-600" />
                <span>Share profile</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard?.writeText?.(`@${activeUserProfile.username}`);
                  triggerShareToast(`Copied @${activeUserProfile.username} to clipboard`);
                  setIsMoreMenuOpen(false);
                }}
                className="w-full p-3 rounded-2xl hover:bg-neutral-100 flex items-center gap-3 text-xs font-bold text-neutral-900 transition-colors cursor-pointer"
              >
                <Copy className="w-4 h-4 text-neutral-600" />
                <span>Copy Lalao handle</span>
              </button>

              {!isOwnProfile && (
                <>
                  <button
                    onClick={handleToggleNotifications}
                    className="w-full p-3 rounded-2xl hover:bg-neutral-100 flex items-center gap-3 text-xs font-bold text-neutral-900 transition-colors cursor-pointer"
                  >
                    <Bell className="w-4 h-4 text-neutral-600" />
                    <span>
                      {isNotificationsEnabled
                        ? 'Turn off post notifications'
                        : 'Turn on post notifications'}
                    </span>
                  </button>

                  <button
                    onClick={handleMute}
                    className="w-full p-3 rounded-2xl hover:bg-neutral-100 flex items-center gap-3 text-xs font-bold text-neutral-900 transition-colors cursor-pointer"
                  >
                    <VolumeX className="w-4 h-4 text-neutral-600" />
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
                  className="w-full py-2.5 rounded-2xl bg-neutral-100 text-xs font-bold text-neutral-700 hover:bg-neutral-200 transition-colors cursor-pointer"
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
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
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
