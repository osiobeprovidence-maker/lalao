import React from 'react';
import {
  Bell,
  Bookmark,
  Compass,
  Heart,
  Home,
  LogOut,
  MessageCircle,
  Plus,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';

export const DesktopSidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setIsNotificationsOpen,
    unreadNotifsCount,
    currentUser,
    location,
    setIsLocationModalOpen,
    setIsCreateSheetOpen,
    setCreateFlowType,
    conversations,
  } = useLalao();
  const { logout, isAuthenticated } = useAuth();

  const unreadMessagesCount = conversations.reduce(
    (acc, conv) => acc + (conv.unreadCount || 0),
    0
  );

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      action: () => {
        setActiveTab('home');
        const mainEl = document.querySelector('main');
        if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'instant' });
      },
      isActive: activeTab === 'home',
      badge: undefined,
    },
    {
      id: 'discover',
      label: 'Explore',
      icon: Compass,
      action: () => {
        setActiveTab('discover');
        const mainEl = document.querySelector('main');
        if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'instant' });
      },
      isActive: activeTab === 'discover',
      badge: undefined,
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: MessageCircle,
      action: () => {
        setActiveTab('messages');
        const mainEl = document.querySelector('main');
        if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'instant' });
      },
      isActive: activeTab === 'messages',
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      action: () => {
        setActiveTab('notifications');
        setIsNotificationsOpen(false);
      },
      isActive: activeTab === 'notifications',
      badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: UserIcon,
      action: () => {
        setActiveTab('profile');
        const mainEl = document.querySelector('main');
        if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'instant' });
      },
      isActive: activeTab === 'profile',
      badge: undefined,
    },
  ] as const;

  const secondaryNav = [
    { id: 'following', label: 'Following', icon: Users },
    { id: 'saved', label: 'Saved', icon: Bookmark },
    { id: 'liked', label: 'Liked', icon: Heart },
  ] as const;

  return (
    <aside
      id="desktop-navigation-sidebar"
      className="hidden lg:flex flex-col h-screen sticky top-0 shrink-0 w-[220px] xl:w-[240px] bg-[#f6f3ee] border-r border-neutral-200/80 px-4 py-5 select-none z-30"
    >
      <div className="flex flex-col gap-6 h-full">
        <div className="flex items-center justify-between px-2 pt-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('home');
              const mainEl = document.querySelector('main');
              if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'instant' });
            }}
            className="text-left cursor-pointer"
            aria-label="Go to home feed"
          >
            <span className="lalao-wordmark text-[28px] text-neutral-950">lalao</span>
          </button>

          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setCreateFlowType(null);
                setIsCreateSheetOpen(false);
                setActiveTab('create-post');
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-[#f9f7f4] text-neutral-700 transition hover:border-neutral-300 hover:text-neutral-950 cursor-pointer"
              aria-label="Create post"
              title="Create"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsLocationModalOpen(true)}
          className="flex items-center justify-between border-b border-neutral-200/80 px-2 pb-3 text-left cursor-pointer"
          aria-label="Change location"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5E43F3] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#5E43F3]" />
            </span>
            <span className="truncate text-[11px] font-bold text-neutral-900">{location.name}</span>
          </div>
          <span className="rounded-full bg-[#5E43F3]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#5E43F3]">
            {location.radiusKm}km
          </span>
        </button>

        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className={`group flex items-center justify-between rounded-full px-3 py-2.5 text-left transition cursor-pointer ${
                  item.isActive
                    ? 'bg-[#5E43F3] text-white shadow-sm shadow-[#5E43F3]/20'
                    : 'text-neutral-700 hover:bg-[#f8f6f3] hover:text-neutral-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${item.isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
                  <span className="text-[15px] font-medium">{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${item.isActive ? 'bg-white text-[#5E43F3]' : 'bg-[#5E43F3] text-white'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="pt-2">
          <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
            Discover
          </div>
          <div className="space-y-1.5">
            {secondaryNav.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setActiveTab(id);
                  const mainEl = document.querySelector('main');
                  if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'instant' });
                }}
                className={`flex w-full items-center gap-3 rounded-full px-3 py-2 text-left transition cursor-pointer ${
                  activeTab === id
                    ? 'bg-[#5E43F3]/10 text-[#5E43F3]'
                    : 'text-neutral-600 hover:bg-[#f8f6f3] hover:text-neutral-950'
                }`}
              >
                <Icon className="h-4 w-4 stroke-[1.8]" />
                <span className="text-[14px] font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-neutral-200/80">
          {isAuthenticated ? (
            <>
              <div className="flex w-full items-center justify-between gap-2 rounded-full px-2 py-2 transition hover:bg-[#f8f6f3]">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('profile');
                    const mainEl = document.querySelector('main');
                    if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'instant' });
                  }}
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left cursor-pointer"
                >
                  <Avatar src={currentUser?.avatar} alt={currentUser?.name} size="sm" />
                  <div className="min-w-0">
                    <div className="truncate text-[12px] font-bold text-neutral-900">{currentUser?.name}</div>
                    <div className="truncate text-[11px] text-neutral-500">@{currentUser?.username}</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                  }}
                  className="flex shrink-0 h-8 w-8 items-center justify-center rounded-full text-rose-500 transition hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                  aria-label="Log out"
                  title="Log out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => window.location.href = '/login'}
                className="w-full rounded-full bg-[#5E43F3] px-4 py-2.5 text-[14px] font-bold text-white transition hover:bg-[#5E43F3]/90"
              >
                Sign In / Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
