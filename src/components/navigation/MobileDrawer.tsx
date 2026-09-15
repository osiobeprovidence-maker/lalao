import React from 'react';
import {
  X,
  User as UserIcon,
  Compass,
  MessageSquare,
  Hand,
  Building,
  Heart,
  MapPin,
  EyeOff,
  Shield,
  ChevronRight,
  ExternalLink,
  Edit3,
  Trophy,
  Wallet,
  ShoppingBag,
  Plus,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    setIsEditProfileOpen,
    setIsNotificationsOpen,
    unreadNotifsCount,
    location,
    locationPrivacy,
    setIsLocationModalOpen,
    setIsCreateSheetOpen,
    setCreateFlowType,
    setIsPermissionsModalOpen,
    openHonorOfKingsPage,
    setIsWalletModalOpen,
    setIsShoppingHistoryOpen,
    userOrders,
    pages,
    setActivePageId,
  } = useLalao();

  if (!isOpen) return null;

  const ownedPages = pages.filter(
    (p) => p.isOwner || p.ownerId === currentUser.id
  );

  const followedPages = pages.filter(
    (p) => !p.isOwner && p.ownerId !== currentUser.id && p.id !== 'page_honorofkings'
  );

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <aside
        id="mobile-navigation-drawer"
        className="relative w-[300px] max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-250 overflow-y-auto"
      >
        {/* Header with Close */}
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-xl font-black tracking-tight text-neutral-950 font-sans">
              lalao
            </span>
            <span className="w-2 h-2 rounded-full bg-[#5E43F3]" />
          </div>
          <button
            id="btn-close-mobile-drawer"
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Card */}
        <div className="p-4 bg-neutral-50 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <Avatar src={currentUser.avatar} alt={currentUser.name} size="lg" />
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-neutral-900 text-sm truncate">{currentUser.name}</h3>
              <p className="text-xs text-neutral-500 truncate">@{currentUser.username}</p>
              <div className="flex items-center gap-1 text-[11px] text-[#5E43F3] font-semibold mt-0.5">
                <MapPin className="w-3 h-3" />
                <span>{currentUser.location || location.name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-neutral-600">
            <div>
              <strong className="font-bold text-neutral-900">{currentUser.followingCount || 142}</strong>{' '}
              <span className="text-neutral-400">Following</span>
            </div>
            <div>
              <strong className="font-bold text-neutral-900">{currentUser.followersCount || 289}</strong>{' '}
              <span className="text-neutral-400">Followers</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={() => {
                setActiveTab('profile');
                onClose();
              }}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-100 text-center transition-colors cursor-pointer"
            >
              My Profile
            </button>
            <button
              onClick={() => {
                setIsEditProfileOpen(true);
                onClose();
              }}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#5E43F3] bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-center transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit</span>
            </button>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="py-2 flex-1">
          <div className="px-4 py-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            Navigation
          </div>

          <button
            onClick={() => {
              setActiveTab('home');
              onClose();
            }}
            className={`w-full px-4 py-2.5 flex items-center justify-between text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'home'
                ? 'text-[#5E43F3] bg-indigo-50/70 border-r-2 border-[#5E43F3]'
                : 'text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <UserIcon className="w-4 h-4 text-neutral-400" />
              <span>Home Feed</span>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-300" />
          </button>

          <button
            onClick={() => {
              setActiveTab('discover');
              onClose();
            }}
            className={`w-full px-4 py-2.5 flex items-center justify-between text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'discover'
                ? 'text-[#5E43F3] bg-indigo-50/70 border-r-2 border-[#5E43F3]'
                : 'text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Compass className="w-4 h-4 text-neutral-400" />
              <span>Explore & Discover</span>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-300" />
          </button>

          <button
            onClick={() => {
              setActiveTab('messages');
              onClose();
            }}
            className={`w-full px-4 py-2.5 flex items-center justify-between text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'messages'
                ? 'text-[#5E43F3] bg-indigo-50/70 border-r-2 border-[#5E43F3]'
                : 'text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-neutral-400" />
              <span>Messages & Status</span>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-300" />
          </button>

          <button
            onClick={() => {
              setIsNotificationsOpen(true);
              onClose();
            }}
            className="w-full px-4 py-2.5 flex items-center justify-between text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4 text-neutral-400" />
              <span>Notifications</span>
            </div>
            {unreadNotifsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#5E43F3] text-white">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {/* 1. My Pages (Owned) */}
          <div className="my-2 border-t border-neutral-100" />
          <div className="px-4 py-1.5 flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            <span>My Pages</span>
            <button
              onClick={() => {
                setCreateFlowType('page');
                setIsCreateSheetOpen(true);
                onClose();
              }}
              className="text-[#5E43F3] hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
              <span>New</span>
            </button>
          </div>

          {ownedPages.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActivePageId(p.id);
                onClose();
              }}
              className="w-full px-4 py-2.5 flex items-center justify-between text-sm font-semibold text-neutral-800 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={p.avatar}
                  alt={p.name}
                  className="w-5 h-5 rounded-full object-cover shrink-0 ring-1 ring-[#5E43F3]/30"
                />
                <span className="truncate text-xs font-bold text-neutral-900">{p.name}</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-violet-100 text-[#5E43F3]">
                MANAGE
              </span>
            </button>
          ))}

          {/* 2. Following & Shopping */}
          <div className="my-2 border-t border-neutral-100" />
          <div className="px-4 py-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            Following & Shopping
          </div>

          {/* Honor of Kings Esports Org Page */}
          <button
            id="drawer-nav-honor-of-kings"
            onClick={() => {
              openHonorOfKingsPage();
              onClose();
            }}
            className="w-full px-4 py-2.5 flex items-center justify-between text-sm font-semibold text-neutral-800 hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="truncate text-xs">Honor of Kings</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-violet-100 text-[#5E43F3]">
              Esports
            </span>
          </button>

          {followedPages.slice(0, 2).map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActivePageId(p.id);
                onClose();
              }}
              className="w-full px-4 py-2 flex items-center justify-between text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={p.avatar}
                  alt={p.name}
                  className="w-4 h-4 rounded-full object-cover shrink-0"
                />
                <span className="truncate text-xs font-semibold text-neutral-800">{p.name}</span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                {p.badge || 'PAGE'}
              </span>
            </button>
          ))}

          {/* 3. Finances & Orders */}
          <div className="my-2 border-t border-neutral-100" />
          <div className="px-4 py-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            Finances & Orders
          </div>

          <button
            id="drawer-nav-wallet"
            onClick={() => {
              setIsWalletModalOpen(true);
              onClose();
            }}
            className="w-full px-4 py-2.5 flex items-center gap-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <Wallet className="w-4 h-4 text-neutral-500" />
            <span>My Wallet</span>
          </button>

          <button
            id="drawer-nav-orders"
            onClick={() => {
              setIsShoppingHistoryOpen(true);
              onClose();
            }}
            className="w-full px-4 py-2.5 flex items-center justify-between text-sm font-semibold text-neutral-800 hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-4 h-4 text-neutral-500" />
              <span>My Orders</span>
            </div>
            {userOrders.length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-neutral-200 text-neutral-700">
                {userOrders.length}
              </span>
            )}
          </button>

          <div className="my-2 border-t border-neutral-100" />

          {/* Quick Actions */}
          <div className="px-4 py-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            Quick Actions
          </div>

          <button
            onClick={() => {
              setCreateFlowType('rally');
              setIsCreateSheetOpen(true);
              onClose();
            }}
            className="w-full px-4 py-2 flex items-center gap-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <Hand className="w-4 h-4 text-[#5E43F3]" />
            <span>Create Urgent Rally</span>
          </button>

          <button
            onClick={() => {
              setCreateFlowType('page');
              setIsCreateSheetOpen(true);
              onClose();
            }}
            className="w-full px-4 py-2 flex items-center gap-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <Building className="w-4 h-4 text-emerald-600" />
            <span>Create Business Page</span>
          </button>

          <div className="my-2 border-t border-neutral-100" />

          {/* Location & Radius settings */}
          <div className="px-4 py-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            Location & Privacy
          </div>

          <button
            onClick={() => {
              setIsLocationModalOpen(true);
              onClose();
            }}
            className="w-full px-4 py-2.5 flex items-center justify-between text-left text-xs text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#5E43F3] shrink-0" />
              <div>
                <p className="font-bold text-neutral-900">{location.name}</p>
                <p className="text-[11px] text-neutral-500">Radius: {location.radiusKm} km</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#5E43F3] hover:underline">Change</span>
          </button>

          <button
            id="drawer-btn-permissions"
            onClick={() => {
              setIsPermissionsModalOpen(true);
              onClose();
            }}
            className="w-full px-4 py-2 flex items-center justify-between text-xs text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#5E43F3] shrink-0" />
              <span>Device Permissions</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-neutral-100 rounded-full text-neutral-600 font-medium">
              Manage
            </span>
          </button>

          {locationPrivacy?.ghostMode && (
            <div className="mx-4 my-1 p-2 rounded-lg bg-purple-50 border border-purple-100 flex items-center gap-2 text-[11px] text-purple-900">
              <EyeOff className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>Ghost Mode is currently active</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 text-[11px] text-neutral-400 flex items-center justify-between">
          <span>Lalao Hyperlocal v1.0</span>
          <span>Delta, Nigeria</span>
        </div>
      </aside>
    </div>
  );
};
