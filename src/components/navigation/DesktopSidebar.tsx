import React from 'react';
import {
  Bell,
  Bookmark,
  Compass,
  Heart,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  User as UserIcon,
  Users,
  Building2,
  Wallet,
  ShoppingBag,
  X,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
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
    setIsWalletModalOpen,
    setIsShoppingHistoryOpen,
  } = useLalao();
  const { logout, isAuthenticated } = useAuth();

  const unreadMessagesCount = conversations.reduce(
    (acc, conv) => acc + (conv.unreadCount || 0),
    0
  );

  // Hamburger menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isMenuOpen]);

  // Close menu on Escape
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isMenuOpen]);

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
      badge: undefined as number | undefined,
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
      badge: undefined as number | undefined,
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
      badge: undefined as number | undefined,
    },
  ];

  const myPagesNav = [
    { id: 'my-pages', label: 'My Pages', icon: Building2 },
    { id: 'create-page', label: 'Create Page', icon: Plus },
  ] as const;

  // Items that live only in the hamburger menu
  const discoverNav = [
    { id: 'following', label: 'Following', icon: Users },
    { id: 'saved', label: 'Saved', icon: Bookmark },
    { id: 'liked', label: 'Liked', icon: Heart },
  ] as const;

  const accountNav = [
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'orders', label: 'Order History', icon: ShoppingBag },
  ] as const;

  const isMenuItemActive = (id: string) =>
    ['following', 'saved', 'liked'].includes(id) && activeTab === id;

  return (
    <aside
      id="desktop-navigation-sidebar"
      className="hidden lg:flex flex-col h-screen sticky top-0 shrink-0 w-[220px] xl:w-[240px] bg-[#f6f3ee] border-r border-neutral-200/80 px-4 py-5 select-none z-30"
    >
      <div className="flex flex-col gap-6 h-full">

        {/* ── TOP HEADER: logo · + · hamburger ── */}
        <div className="flex items-center justify-between px-2 pt-1 relative">
          {/* Logo — leftmost */}
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
            <span className="lalao-wordmark text-[26px] text-neutral-950">lalao</span>
          </button>

          {/* Right side controls: + and Hamburger */}
          <div className="flex items-center gap-2">
            {/* Create post button */}
            <button
              type="button"
              onClick={() => {
                setCreateFlowType(null);
                setIsCreateSheetOpen(false);
                setActiveTab('create-post');
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-[#f9f7f4] text-neutral-700 transition hover:border-neutral-300 hover:text-neutral-950 cursor-pointer"
              aria-label="Create post"
              title="Create"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
            </button>

            {/* Hamburger */}
            <button
              ref={hamburgerRef}
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition cursor-pointer ${
                isMenuOpen
                  ? 'bg-[#5E43F3]/10 text-[#5E43F3]'
                  : 'text-neutral-500 hover:bg-neutral-200/70 hover:text-neutral-900'
              }`}
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
              aria-haspopup="true"
            >
              {isMenuOpen ? (
                <X className="h-4 w-4 stroke-[2]" />
              ) : (
                <Menu className="h-4 w-4 stroke-[2]" />
              )}
            </button>
          </div>

          {/* ── HAMBURGER POPOVER MENU ── */}
          {isMenuOpen && (
            <div
              ref={menuRef}
              role="menu"
              aria-label="Secondary navigation"
              className="absolute top-full left-0 mt-2 w-52 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-neutral-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              {/* DISCOVER section */}
              <div className="px-3 pb-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                  Discover
                </div>
                <div className="space-y-0.5">
                  {discoverNav.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setActiveTab(id);
                        const mainEl = document.querySelector('main');
                        if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'instant' });
                        setIsMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition cursor-pointer ${
                        isMenuItemActive(id)
                          ? 'bg-[#5E43F3]/10 text-[#5E43F3]'
                          : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0 stroke-[1.8]" />
                      <span className="text-[14px] font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="my-2 mx-3 border-t border-neutral-100" />

              {/* ACCOUNT section */}
              <div className="px-3 pt-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                  Account
                </div>
                <div className="space-y-0.5">
                  {accountNav.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        if (id === 'wallet') setIsWalletModalOpen(true);
                        if (id === 'orders') setIsShoppingHistoryOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition cursor-pointer text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950"
                    >
                      <Icon className="h-4 w-4 shrink-0 stroke-[1.8]" />
                      <span className="text-[14px] font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── LOCATION SELECTOR ── */}
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

        {/* ── PRIMARY NAVIGATION ── */}
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

        {/* ── MY PAGES ── */}
        <div className="space-y-1">
          <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
            My Pages
          </div>
          {myPagesNav.map(({ id, label, icon: Icon }) => (
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

        {/* ── USER FOOTER ── */}
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
                  onClick={async () => { await logout(); }}
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
                onClick={() => (window.location.href = '/login')}
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
