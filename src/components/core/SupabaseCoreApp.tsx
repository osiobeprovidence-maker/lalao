import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Heart, Home, LogIn, MessageCircle, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCurrentUserQuery } from '../../hooks/useCurrentUserQuery';
import { invokeSupabaseFunction } from '../../lib/supabase';
import type { Post, User } from '../../types';
import { ConvexRoomsBoundary } from '../common/ConvexRoomsBoundary';
import { LiveRoomsView } from '../discover/LiveRoomsView';

type CoreTab = 'home' | 'discover' | 'notifications' | 'profile';

export const SUPABASE_CORE_OPERATIONS = {
  currentUser: { functionName: 'app-user', operation: 'getCurrentUser' },
  feed: { functionName: 'app-social', operation: 'listFeedPosts' },
  discover: { functionName: 'app-social', operation: 'getDiscoverablePeople' },
  notifications: { functionName: 'app-social', operation: 'listNotifications' },
  markNotificationRead: { functionName: 'app-social', operation: 'markNotificationRead' },
  likePost: { functionName: 'app-social', operation: 'toggleLikePost' },
  followPerson: { functionName: 'app-social', operation: 'toggleFollowUser' },
} as const;

export const SUPABASE_CORE_EXPLORE_SECTIONS = ['People', 'Live Rooms'] as const;

/** Actual Supabase-backed core route, intentionally outside the Convex app provider tree. */
export function SupabaseCoreApp() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, authError } = useAuth();
  const { data: rawUser, error: userError, retry } = useCurrentUserQuery();
  const [tab, setTab] = useState<CoreTab>('home');
  const [discoverSection, setDiscoverSection] = useState<'people' | 'rooms'>('people');
  const [posts, setPosts] = useState<Post[]>([]);
  const [people, setPeople] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || tab === 'profile') return;
    if (tab === 'discover' && discoverSection === 'rooms') {
      setLoading(false);
      setError(null);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    const operation = tab === 'home' ? SUPABASE_CORE_OPERATIONS.feed.operation
      : tab === 'discover' ? SUPABASE_CORE_OPERATIONS.discover.operation : SUPABASE_CORE_OPERATIONS.notifications.operation;
    const payload = tab === 'home' ? { feedType: 'for_you' } : tab === 'discover' ? { limit: 25 } : {};
    const functionName = tab === 'home' ? SUPABASE_CORE_OPERATIONS.feed.functionName
      : tab === 'discover' ? SUPABASE_CORE_OPERATIONS.discover.functionName : SUPABASE_CORE_OPERATIONS.notifications.functionName;
    invokeSupabaseFunction<any[]>(functionName, { operation, payload })
      .then((data) => {
        if (!active) return;
        if (!Array.isArray(data)) throw new Error('The service returned an invalid response.');
        if (tab === 'home') setPosts(data);
        else if (tab === 'discover') setPeople(data);
        else setNotifications(data);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load this screen.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isAuthenticated, tab, discoverSection]);

  const user = rawUser && typeof rawUser === 'object' ? rawUser as Record<string, any> : null;
  const currentUser: User | null = user ? {
    id: user._id,
    name: user.name || 'User',
    username: user.username || '',
    avatar: user.avatarUrl || user.avatar || '',
    userType: user.userType || 'person',
    bio: user.bio || '',
    location: user.locationName || user.location || '',
    followersCount: Number(user.followersCount || 0),
    followingCount: Number(user.followingCount || 0),
    isVerified: Boolean(user.isVerified),
    verificationTier: user.verificationTier || 'none',
  } : null;

  const toggleLike = async (post: Post) => {
    try {
      await invokeSupabaseFunction(SUPABASE_CORE_OPERATIONS.likePost.functionName, {
        operation: SUPABASE_CORE_OPERATIONS.likePost.operation, payload: { postId: post.id },
      });
      setPosts((current) => current.map((item) => item.id === post.id
        ? { ...item, isLiked: !item.isLiked, likesCount: Math.max(0, item.likesCount + (item.isLiked ? -1 : 1)) }
        : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update this like.');
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      await invokeSupabaseFunction(SUPABASE_CORE_OPERATIONS.markNotificationRead.functionName, {
        operation: SUPABASE_CORE_OPERATIONS.markNotificationRead.operation,
        payload: { id: notificationId },
      });
      setNotifications((current) => current.map((notification) => notification.id === notificationId
        ? { ...notification, isRead: true } : notification));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update this notification.');
    }
  };

  const toggleFollow = async (person: User) => {
    try {
      const result = await invokeSupabaseFunction<{ following: boolean }>(SUPABASE_CORE_OPERATIONS.followPerson.functionName, {
        operation: SUPABASE_CORE_OPERATIONS.followPerson.operation,
        payload: { targetUserId: person.id },
      });
      setPeople((current) => current.map((item) => item.id === person.id
        ? { ...item, isFollowing: result.following } : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update this follow.');
    }
  };

  const nav: { id: CoreTab; label: string; icon: typeof Home }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'discover', label: 'Explore', icon: Compass },
    { id: 'notifications', label: 'Notifications', icon: Heart },
    { id: 'profile', label: 'Profile', icon: UserRound },
  ];

  return <div className="min-h-screen bg-theme-base text-theme-primary">
    <header className="sticky top-0 z-20 border-b border-theme-divider bg-theme-surface/95 px-5 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <a href="/app" className="lalao-wordmark text-2xl">lalao</a>
        {(user?.role === 'admin' || user?.role === 'super_admin') && <button type="button" onClick={() => navigate('/admin/chat-rooms')} className="rounded-xl border border-theme-divider px-3 py-2 text-sm text-theme-primary">Manage Rooms</button>}
        {!isAuthenticated && <button className="inline-flex items-center gap-2 rounded-xl bg-[#5E43F3] px-4 py-2 text-white" onClick={() => navigate('/login')}><LogIn size={17}/> Sign in</button>}
      </div>
    </header>
    <div className="mx-auto grid max-w-6xl lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="hidden border-r border-theme-divider p-4 lg:block">
        <nav aria-label="Main navigation" className="sticky top-20 space-y-2">
          {nav.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ${tab === id ? 'bg-[#5E43F3]/10 text-[#5E43F3]' : 'hover:bg-theme-surface-hover'}`}><Icon size={19}/>{label}</button>)}
          <button type="button" disabled aria-disabled="true" title="Messaging is not available in Supabase-only mode" className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3 text-left text-theme-tertiary opacity-60"><MessageCircle size={19}/>Messages <span className="text-xs">Unavailable</span></button>
        </nav>
      </aside>
      <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6 lg:px-8" aria-live="polite">
        <h1 className="mb-5 text-2xl font-bold">{nav.find((item) => item.id === tab)?.label}</h1>
        {tab === 'discover' && <div role="group" aria-label="Explore sections" className="mb-5 flex gap-2">{SUPABASE_CORE_EXPLORE_SECTIONS.map((label) => {
          const section = label === 'People' ? 'people' : 'rooms';
          return <button key={label} type="button" onClick={() => setDiscoverSection(section)} aria-pressed={discoverSection === section} className={`rounded-xl px-4 py-2 text-sm font-medium ${discoverSection === section ? 'bg-[#5E43F3] text-white' : 'border border-theme-divider text-theme-secondary'}`}>{label}</button>;
        })}</div>}
        {authLoading || (isAuthenticated && rawUser === undefined)
          ? <div className="py-8 text-center text-theme-tertiary" role="status">Loading Lalao…</div>
          : !isAuthenticated ? <section className="rounded-2xl border border-theme-divider bg-theme-surface p-6">{authError && <p role="alert" className="mb-3 text-sm text-rose-400">{authError}</p>}<p>Sign in to see your Lalao feed, discover people, and manage your profile.</p><button className="mt-4 rounded-xl bg-[#5E43F3] px-4 py-2 text-white" onClick={() => navigate('/login')}>Sign in</button></section>
          : userError ? <section className="rounded-2xl border border-theme-divider bg-theme-surface p-6"><p>Your Lalao profile could not be loaded.</p><button className="mt-3 text-[#5E43F3]" onClick={retry}>Try again</button></section>
          : tab === 'profile' ? currentUser && <section className="rounded-2xl border border-theme-divider bg-theme-surface p-6"><img className="mb-4 h-20 w-20 rounded-full object-cover" src={currentUser.avatar} alt=""/><h2 className="text-xl font-semibold">{currentUser.name}</h2><p className="text-theme-tertiary">@{currentUser.username}</p>{currentUser.bio && <p className="mt-3">{currentUser.bio}</p>}<p className="mt-4">{currentUser.followersCount} followers · {currentUser.followingCount} following</p></section>
          : tab === 'discover' && discoverSection === 'rooms' ? <ConvexRoomsBoundary><LiveRoomsView /></ConvexRoomsBoundary>
          : <>
            {error && <div role="alert" className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm">{error}</div>}
            {loading && <div role="status" className="py-8 text-center text-theme-tertiary">Loading from Supabase…</div>}
            {!loading && !error && tab === 'home' && (posts.length ? posts.map((post) => <article key={post.id} className="mb-4 rounded-2xl border border-theme-divider bg-theme-surface p-5"><div className="flex items-center gap-3"><img className="h-10 w-10 rounded-full object-cover" src={post.author?.avatar} alt=""/><div><strong>{post.author?.name}</strong><p className="text-sm text-theme-tertiary">@{post.author?.username} · {post.createdAt}</p></div></div><p className="my-4 whitespace-pre-wrap">{post.text}</p>{post.mediaUrl && <img className="max-h-[32rem] w-full rounded-xl object-cover" src={post.mediaUrl} alt="Post media"/>}<button onClick={() => void toggleLike(post)} aria-pressed={post.isLiked} className="mt-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-theme-surface-hover"><Heart size={18} fill={post.isLiked ? 'currentColor' : 'none'}/>{post.likesCount} Likes</button></article>) : <p className="rounded-2xl border border-theme-divider p-6 text-theme-tertiary">No posts are available in your feed yet.</p>)}
            {!loading && !error && tab === 'discover' && (people.length ? <div className="space-y-3">{people.map((person: User) => <article key={person.id} className="flex items-center gap-3 rounded-2xl border border-theme-divider bg-theme-surface p-4"><img className="h-12 w-12 rounded-full object-cover" src={person.avatar} alt=""/><div className="min-w-0 flex-1"><strong>{person.name}</strong><p className="text-sm text-theme-tertiary">@{person.username}</p></div><button onClick={() => void toggleFollow(person)} aria-pressed={Boolean(person.isFollowing)} className="rounded-lg border border-theme-divider px-3 py-2 text-sm">{person.isFollowing ? 'Following' : 'Follow'}</button></article>)}</div> : <p className="rounded-2xl border border-theme-divider p-6 text-theme-tertiary">No people to show right now.</p>)}
            {!loading && !error && tab === 'notifications' && (notifications.length ? <div className="space-y-3">{notifications.map((notification: any) => <article key={notification.id} className="rounded-2xl border border-theme-divider bg-theme-surface p-4"><strong>{notification.actor?.name || 'Lalao'}</strong> {notification.text}<p className="mt-1 text-sm text-theme-tertiary">{notification.timestamp}</p>{!notification.isRead && <button onClick={() => void markNotificationRead(notification.id)} className="mt-2 text-sm text-[#5E43F3]">Mark as read</button>}</article>)}</div> : <p className="rounded-2xl border border-theme-divider p-6 text-theme-tertiary">You’re all caught up.</p>)}
          </>}
      </main>
    </div>
    <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-theme-divider bg-theme-surface p-2 lg:hidden">{nav.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined} className={`flex flex-col items-center gap-1 p-2 text-xs ${tab === id ? 'text-[#5E43F3]' : 'text-theme-tertiary'}`}><Icon size={21}/>{label}</button>)}</nav>
  </div>;
}
