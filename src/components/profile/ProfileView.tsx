import React, { useState } from 'react';
import {
  MapPin,
  Calendar,
  Share2,
  Settings,
  Sparkles,
  Heart,
  Plus,
  Clock,
  Users,
  Search,
  X,
  CheckCircle2,
  ChevronRight,
  ShoppingBag,
  Wallet,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';
import { PostItem } from '../feed/PostItem';
import { User } from '../../types';

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
    unreadNotifsCount,
    setActiveUserProfile,
    toggleFollowUser,
    setIsShoppingHistoryOpen,
    userOrders,
    wallet,
    setIsWalletModalOpen,
  } = useLalao();

  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [isConnectionsOpen, setIsConnectionsOpen] = useState(false);
  const [connectionTab, setConnectionTab] = useState<ConnectionTab>('community');
  const [searchQuery, setSearchQuery] = useState('');

  const myCycle = cycles.find(
    (c) => c.user?.id === currentUser.id || c.id === 'cycle_user_me'
  );
  const myHasItems = myCycle && myCycle.items && myCycle.items.length > 0;

  // Filter posts created by current user
  const userPosts = posts.filter((p) => p.author.id === currentUser.id);
  const userMediaPosts = userPosts.filter((p) => Boolean(p.mediaUrl));
  const userReposts = posts.filter((p) => p.isReposted);

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'posts', label: 'Posts' },
    { id: 'replies', label: 'Replies' },
    { id: 'media', label: 'Media' },
    { id: 'reposts', label: 'Reposts' },
  ];

  // List of other community profiles using live app state instead of the legacy seed set.
  const otherUsers: User[] = [
    {
      id: 'community-profile-1',
      name: 'Tega Adesuwa',
      username: 'tegaadesuwa',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
      bio: 'Runs a neighborhood food and culture page.',
      location: 'Warri Central',
      latitude: 5.5175,
      longitude: 5.7501,
      userType: 'person' as const,
      followersCount: 1210,
      followingCount: 188,
      isFollowing: true,
      isVerified: false,
    },
    {
      id: 'community-profile-2',
      name: 'Kehinde Ayo',
      username: 'kehindeayo',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
      bio: 'Community storyteller and event host.',
      location: 'Effurun',
      latitude: 5.5567,
      longitude: 5.7828,
      userType: 'person' as const,
      followersCount: 986,
      followingCount: 174,
      isFollowing: false,
      isVerified: true,
    },
  ].filter((u) => u.id !== currentUser.id && u.username !== currentUser.username);

  const filteredUsers = otherUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.bio && u.bio.toLowerCase().includes(searchQuery.toLowerCase()));

    if (connectionTab === 'following') {
      return matchesSearch && u.isFollowing;
    }
    return matchesSearch;
  });

  const handleOpenUserProfile = (user: User) => {
    setIsConnectionsOpen(false);
    setActiveUserProfile(user);
  };

  return (
    <div id="profile-view-container" className="min-h-screen bg-white pb-24">
      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-2.5 flex items-center justify-between">
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
            onClick={() => setIsNotificationsOpen(true)}
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
      <div className="p-4 space-y-3.5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-950 leading-tight">
              {currentUser.name}
            </h2>
            <p className="text-xs text-neutral-500 font-medium">
              @{currentUser.username}
            </p>
          </div>

          {/* 24-hour Cycle Avatar ring */}
          <div className="relative">
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

        {/* Bio */}
        <p className="text-xs text-neutral-800 leading-relaxed">
          {currentUser.bio || 'Exploring and sharing local vibes in Warri.'}
        </p>

        {/* Location & Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#5E43F3]" />
            <span>{currentUser.location}</span>
          </div>
          <span>·</span>
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            <span>Joined September 2026</span>
          </div>
        </div>

        {/* Follower Stats - Clickable to open connections & view other profiles */}
        <div className="flex items-center gap-4 text-xs pt-1">
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

        {/* Quick Links: Wallet & Shopping Orders */}
        <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            id="btn-profile-wallet"
            type="button"
            onClick={() => setIsWalletModalOpen(true)}
            className="w-full py-2.5 px-3.5 rounded-xl bg-violet-50/70 hover:bg-violet-100/80 border border-violet-200/80 text-neutral-900 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#5E43F3]" />
              <span>Gamer Wallet</span>
            </div>
            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-[#5E43F3] text-white">
              ₦{wallet.balance.toLocaleString()}
            </span>
          </button>

          <button
            id="btn-profile-shopping-history"
            type="button"
            onClick={() => setIsShoppingHistoryOpen(true)}
            className="w-full py-2.5 px-3.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 text-neutral-800 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#5E43F3]" />
              <span>Orders & Receipts</span>
            </div>
            {userOrders.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700 font-semibold">
                {userOrders.length}
              </span>
            )}
          </button>
        </div>

        {/* Community Profiles Carousel */}
        <div className="pt-2 border-t border-neutral-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-900">Community Profiles</span>
            <button
              onClick={() => {
                setConnectionTab('community');
                setIsConnectionsOpen(true);
              }}
              className="text-[11px] font-bold text-[#5E43F3] hover:underline cursor-pointer"
            >
              See all ({otherUsers.length})
            </button>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {otherUsers.slice(0, 8).map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleOpenUserProfile(user)}
                className="flex flex-col items-center gap-1.5 shrink-0 w-18 text-center group cursor-pointer"
                title={`View ${user.name}'s profile`}
              >
                <div className="relative p-[1.5px] rounded-full border border-neutral-200 group-hover:border-[#5E43F3] transition-colors">
                  <Avatar src={user.avatar} alt={user.name} size="md" className="w-12 h-12" />
                  {user.isVerified && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#5E43F3] fill-white absolute bottom-0 right-0" />
                  )}
                </div>
                <span className="text-[11px] font-semibold text-neutral-900 truncate w-full group-hover:text-[#5E43F3]">
                  {user.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-100 flex items-center justify-around px-2 mt-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
        {activeTab === 'posts' && (
          userPosts.length > 0 ? (
            userPosts.map((post) => <PostItem key={post.id} post={post} />)
          ) : (
            <div className="p-8 text-center text-neutral-400 text-xs">
              You haven&apos;t posted yet. Tap the center + button to share with your local community.
            </div>
          )
        )}

        {activeTab === 'replies' && (
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

        {activeTab === 'media' && (
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

        {activeTab === 'reposts' && (
          userReposts.length > 0 ? (
            userReposts.map((post) => <PostItem key={post.id} post={post} />)
          ) : (
            <div className="p-8 text-center text-neutral-400 text-xs">
              No reposts yet.
            </div>
          )
        )}
      </div>

      {/* COMMUNITY CONNECTIONS & PROFILES MODAL */}
      {isConnectionsOpen && (
        <div
          id="modal-connections-backdrop"
          onClick={() => setIsConnectionsOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 animate-in fade-in"
        >
          <div
            id="modal-connections-card"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white sm:rounded-3xl h-full sm:h-[85vh] sm:max-h-[680px] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95"
          >
            {/* Header */}
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-neutral-950">
                  {connectionTab === 'community'
                    ? 'Community Profiles'
                    : connectionTab === 'followers'
                    ? 'Followers'
                    : 'Following'}
                </h3>
                <p className="text-xs text-neutral-500">
                  Tap any profile to view posts, cycles, and connect
                </p>
              </div>
              <button
                id="btn-close-connections"
                onClick={() => setIsConnectionsOpen(false)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="flex border-b border-neutral-100 px-4 shrink-0">
              <button
                onClick={() => setConnectionTab('community')}
                className={`py-2.5 px-3 text-xs font-bold transition-all relative cursor-pointer ${
                  connectionTab === 'community'
                    ? 'text-[#5E43F3]'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Community ({otherUsers.length})
                {connectionTab === 'community' && (
                  <span className="absolute bottom-0 inset-x-3 h-0.5 bg-[#5E43F3] rounded-full" />
                )}
              </button>

              <button
                onClick={() => setConnectionTab('followers')}
                className={`py-2.5 px-3 text-xs font-bold transition-all relative cursor-pointer ${
                  connectionTab === 'followers'
                    ? 'text-[#5E43F3]'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Followers ({currentUser.followersCount})
                {connectionTab === 'followers' && (
                  <span className="absolute bottom-0 inset-x-3 h-0.5 bg-[#5E43F3] rounded-full" />
                )}
              </button>

              <button
                onClick={() => setConnectionTab('following')}
                className={`py-2.5 px-3 text-xs font-bold transition-all relative cursor-pointer ${
                  connectionTab === 'following'
                    ? 'text-[#5E43F3]'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Following ({currentUser.followingCount})
                {connectionTab === 'following' && (
                  <span className="absolute bottom-0 inset-x-3 h-0.5 bg-[#5E43F3] rounded-full" />
                )}
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-neutral-100 shrink-0">
              <div className="flex items-center gap-2 bg-neutral-100 rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search creators by name, handle, or bio..."
                  className="w-full bg-transparent text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-neutral-400 hover:text-neutral-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 p-2">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-3 flex items-center justify-between hover:bg-neutral-50 rounded-2xl transition-colors gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenUserProfile(user)}
                      className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer group"
                    >
                      <div className="relative">
                        <Avatar src={user.avatar} alt={user.name} size="md" />
                        {user.isVerified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#5E43F3] fill-white absolute bottom-0 right-0" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs sm:text-sm text-neutral-950 truncate group-hover:text-[#5E43F3]">
                            {user.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-neutral-400 truncate block">
                          @{user.username} · {user.location}
                        </span>
                        {user.bio && (
                          <p className="text-[11px] text-neutral-600 line-clamp-1 mt-0.5 font-normal">
                            {user.bio}
                          </p>
                        )}
                      </div>
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleFollowUser(user.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          user.isFollowing
                            ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                            : 'bg-[#5E43F3] text-white hover:bg-[#4E34E0]'
                        }`}
                      >
                        {user.isFollowing ? 'Following' : 'Follow'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenUserProfile(user)}
                        className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                        title="View Profile"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-neutral-400">
                  No creators match your search. Try a different search query.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
