import React from 'react';
import {
  Home,
  Compass,
  MessageCircle,
  Heart,
  User as UserIcon,
  Trophy,
  ShoppingBag,
  Wallet,
  MapPin,
  Settings,
  Sparkles,
  Plus,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { useLalao, NavTab } from '../../context/LalaoContext';
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
    setIsEditProfileOpen,
    openHonorOfKingsPage,
    setIsShoppingHistoryOpen,
    userOrders,
    setIsCartOpen,
    cartCount,
    conversations,
    pages,
    setActivePageId,
    setIsWalletModalOpen,
    setCreateFlowType,
    setIsCreateSheetOpen,
  } = useLalao();

  const unreadMessagesCount = conversations.reduce(
    (acc, conv) => acc + (conv.unreadCount || 0),
    0
  );

  const ownedPages = pages.filter(
    (p) => p.isOwner || p.ownerId === currentUser.id
  );

  const followedPages = pages.filter(
    (p) => !p.isOwner && p.ownerId !== currentUser.id && p.id !== 'page_honorofkings'
  );

  const navItems: {
    id: NavTab | 'notifications' | 'orders' | 'honorofkings';
    label: string;
    icon: typeof Home;
    badge?: number;
    badgeText?: string;
    badgeColor?: string;
    action: () => void;
    isActive: boolean;
  }[] = [
    {
      id: 'home',
      label: 'Home Feed',
      icon: Home,
      action: () => {
        setActiveTab('home');
        const mainEl = document.querySelector('main');
        if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'instant' });
      },
      isActive: activeTab === 'home',
    },
    {
      id: 'discover',
      label: 'Explore & Radar',
      icon: Compass,
      action: () => {
        setActiveTab('discover');
        const mainEl = document.querySelector('main');
        if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'instant' });
      },
      isActive: activeTab === 'discover',
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: MessageCircle,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
      badgeColor: 'bg-[#5E43F3] text-white',
      action: () => {
        setActiveTab('messages');
        const mainEl = document.querySelector('main');
        if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'instant' });
      },
      isActive: activeTab === 'messages',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Heart,
      badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
      action: () => {
        setIsNotificationsOpen(true);
      },
      isActive: false,
    },
    {
      id: 'profile',
      label: 'My Profile',
      icon: UserIcon,
      action: () => {
        setActiveTab('profile');
        const mainEl = document.querySelector('main');
        if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'instant' });
      },
      isActive: activeTab === 'profile',
    },
  ];

  return (
    <aside
      id="desktop-navigation-sidebar"
      className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 h-screen sticky top-0 bg-white border-r border-neutral-200/80 p-4 xl:p-5 justify-between select-none z-30 overflow-y-auto"
    >
      {/* Top Header & Navigation */}
      <div className="flex flex-col gap-5">
        {/* Brand Logo & Location Radar Pill */}
        <div className="flex flex-col gap-2.5 px-2">
          <div className="flex items-center justify-between">
            <button
              id="btn-desktop-brand-logo"
              type="button"
              onClick={() => {
                setActiveTab('home');
                const mainEl = document.querySelector('main');
                if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'instant' });
              }}
              className="flex items-center gap-1.5 text-left group cursor-pointer focus:outline-none"
            >
              <span className="text-2xl font-black tracking-tight text-neutral-950 font-sans group-hover:text-[#5E43F3] transition-colors">
                lalao
              </span>
            </button>

            {cartCount > 0 && (
              <button
                id="btn-desktop-cart-quick"
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors cursor-pointer"
                title="Shopping Cart"
              >
                <ShoppingBag className="w-4 h-4 text-[#5E43F3]" />
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#5E43F3] text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white">
                  {cartCount}
                </span>
              </button>
            )}
          </div>

          {/* Active Neighborhood Tag */}
          <button
            id="btn-desktop-location-pill"
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/70 text-xs font-semibold text-neutral-700 transition-colors cursor-pointer group"
            title="Change active location & radius"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5E43F3] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5E43F3]" />
              </span>
              <span className="truncate font-bold text-neutral-900 text-[11px]">
                {location.name}
              </span>
            </div>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#5E43F3]/10 text-[#5E43F3] shrink-0">
              {location.radiusKm}km
            </span>
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex flex-col gap-4">
          {/* 1. Core Menu */}
          <div className="flex flex-col gap-1">
            <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
              Menu
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  id={`btn-desktop-nav-${item.id}`}
                  type="button"
                  onClick={item.action}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    item.isActive
                      ? 'bg-[#5E43F3] text-white shadow-md shadow-[#5E43F3]/25 scale-[1.01]'
                      : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-5 h-5 ${
                        item.isActive ? 'stroke-[2.5]' : 'stroke-[1.8] text-neutral-500'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        item.isActive
                          ? 'bg-white text-[#5E43F3]'
                          : item.badgeColor || 'bg-[#5E43F3] text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 2. My Pages (Owned & Managed by You) */}
          <div className="flex flex-col gap-1 pt-2 border-t border-neutral-100">
            <div className="flex items-center justify-between px-3 pb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                My Pages
              </span>
              <button
                id="btn-desktop-create-page-shortcut"
                type="button"
                onClick={() => {
                  setCreateFlowType('page');
                  setIsCreateSheetOpen(true);
                }}
                className="text-[10px] font-bold text-[#5E43F3] hover:text-[#4E34E0] flex items-center gap-0.5 transition-colors cursor-pointer px-1 py-0.5 rounded hover:bg-violet-50"
                title="Create a new business, club or community page"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
                <span>Create</span>
              </button>
            </div>

            {ownedPages.map((p) => (
              <button
                key={p.id}
                id={`btn-desktop-nav-owned-page-${p.id}`}
                type="button"
                onClick={() => setActivePageId(p.id)}
                className="flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-semibold text-neutral-800 hover:text-neutral-950 hover:bg-violet-50/60 transition-colors cursor-pointer group"
                title={`Manage & view ${p.name}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={p.avatar}
                    alt={p.name}
                    className="w-5 h-5 rounded-full object-cover shrink-0 ring-1.5 ring-[#5E43F3]/30"
                  />
                  <span className="truncate text-xs font-bold text-neutral-900 group-hover:text-[#5E43F3] transition-colors">
                    {p.name}
                  </span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-100 text-[#5E43F3] shrink-0">
                  MANAGE
                </span>
              </button>
            ))}

            {ownedPages.length === 0 && (
              <button
                type="button"
                onClick={() => {
                  setCreateFlowType('page');
                  setIsCreateSheetOpen(true);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-500 hover:text-[#5E43F3] hover:bg-neutral-50 transition-colors text-left cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-neutral-400 shrink-0" />
                <span>Create your first page</span>
              </button>
            )}
          </div>

          {/* 3. Pages You Follow & Shopping */}
          <div className="flex flex-col gap-1 pt-2 border-t border-neutral-100">
            <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
              Following & Shopping
            </div>

            <button
              id="btn-desktop-nav-honor-of-kings"
              type="button"
              onClick={openHonorOfKingsPage}
              className="flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-semibold text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Trophy className="w-4 h-4 text-amber-500 stroke-[1.8] group-hover:scale-110 transition-transform shrink-0" />
                <span className="truncate text-xs font-semibold text-neutral-800 group-hover:text-neutral-950">
                  Honor of Kings
                </span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-100 text-[#5E43F3] shrink-0">
                ESPORTS
              </span>
            </button>

            {followedPages.slice(0, 3).map((p) => (
              <button
                key={p.id}
                id={`btn-desktop-nav-page-${p.id}`}
                type="button"
                onClick={() => setActivePageId(p.id)}
                className="flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-semibold text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer group"
                title={`Open ${p.name}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={p.avatar}
                    alt={p.name}
                    className="w-5 h-5 rounded-full object-cover shrink-0 border border-neutral-200"
                  />
                  <span className="truncate text-xs font-semibold text-neutral-800 group-hover:text-neutral-950">
                    {p.name}
                  </span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 shrink-0">
                  {p.badge || 'PAGE'}
                </span>
              </button>
            ))}
          </div>

          {/* 4. Finances & Orders */}
          <div className="flex flex-col gap-1 pt-2 border-t border-neutral-100">
            <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
              Finances & Orders
            </div>

            <button
              id="btn-desktop-nav-wallet"
              type="button"
              onClick={() => setIsWalletModalOpen(true)}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <Wallet className="w-5 h-5 text-neutral-500 stroke-[1.8]" />
              <span>My Wallet</span>
            </button>

            <button
              id="btn-desktop-nav-orders"
              type="button"
              onClick={() => setIsShoppingHistoryOpen(true)}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-neutral-500 stroke-[1.8]" />
                <span>My Orders</span>
              </div>
              {userOrders.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-neutral-200 text-neutral-700">
                  {userOrders.length}
                </span>
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* Bottom Profile Bar */}
      <div className="pt-4 border-t border-neutral-100">
        <div className="p-2.5 rounded-2xl bg-neutral-50 border border-neutral-200/70 flex items-center justify-between gap-2.5">
          <button
            id="btn-desktop-profile-card"
            type="button"
            onClick={() => {
              setActiveTab('profile');
              const mainEl = document.querySelector('main');
              if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'instant' });
            }}
            className="flex items-center gap-2.5 min-w-0 text-left flex-1 cursor-pointer group"
          >
            <Avatar
              src={currentUser.avatar}
              alt={currentUser.name}
              size="sm"
              className="ring-2 ring-neutral-200 group-hover:ring-[#5E43F3] transition-all"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-neutral-900 truncate group-hover:text-[#5E43F3] transition-colors">
                {currentUser.name}
              </h4>
              <p className="text-[11px] text-neutral-400 truncate">@{currentUser.username}</p>
            </div>
          </button>

          <button
            id="btn-desktop-open-settings"
            type="button"
            onClick={() => setIsEditProfileOpen(true)}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-800 hover:bg-neutral-200/70 transition-colors cursor-pointer"
            title="Edit Profile & Settings"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
