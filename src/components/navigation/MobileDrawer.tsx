import React from 'react';
import {
  Plus,
  ShoppingBag,
  Wallet,
  X,
  Calendar,
  Building2,
  Users,
  Bookmark,
  Heart,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const {
    setIsCreateSheetOpen,
    setCreateFlowType,
    setIsWalletModalOpen,
    setIsShoppingHistoryOpen,
    setActiveTab,
  } = useLalao();

  if (!isOpen) return null;

  const accountItems = [
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'orders', label: 'Order History', icon: ShoppingBag },
  ] as const;

  const myPagesItems = [
    { id: 'my-pages', label: 'My Pages', icon: Building2 },
    { id: 'create-page', label: 'Create Page', icon: Plus },
  ] as const;

  const discoverItems = [
    { id: 'following', label: 'Following', icon: Users },
    { id: 'saved', label: 'Saved', icon: Bookmark },
    { id: 'liked', label: 'Liked', icon: Heart },
  ] as const;

  const handleWalletAction = () => {
    setIsWalletModalOpen(true);
    onClose();
  };

  const handleOrdersAction = () => {
    setIsShoppingHistoryOpen(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="fixed inset-0 bg-slate-900/35 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      <aside
        id="mobile-navigation-drawer"
        className="relative z-10 flex h-full w-[85vw] max-w-[360px] flex-col overflow-y-auto border-r border-theme-divider bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.08),_transparent_42%),linear-gradient(180deg,#ffffff_0%,#f9f7ff_100%)] shadow-2xl transition-transform duration-300 ease-out animate-in slide-in-from-left"
      >
        <div className="sticky top-0 z-20 border-b border-theme-divider/80 bg-theme-surface/90 px-4 pb-4 pt-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="lalao-wordmark text-[22px] text-theme-primary">lalao</span>

            <button
              id="btn-close-mobile-drawer"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-theme-divider bg-theme-surface text-theme-secondary transition hover:bg-theme-surface-hover hover:text-theme-primary"
              aria-label="Close navigation drawer"
              title="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col px-4 py-4 space-y-6">
          <div>
            <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-theme-tertiary">
              Account
            </div>
            <div className="rounded-2xl border border-theme-divider/80 bg-theme-surface/80 p-2 shadow-sm space-y-1">
              {accountItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    if (id === 'wallet') {
                      handleWalletAction();
                      return;
                    }
                    if (id === 'orders') {
                      handleOrdersAction();
                      return;
                    }
                  }}
                  className="flex w-full items-center rounded-xl px-3 py-2 text-left transition hover:bg-theme-base"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-theme-secondary" />
                    <span className="text-sm font-medium text-theme-secondary">{label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-theme-tertiary">
              My Pages
            </div>
            <div className="rounded-2xl border border-theme-divider/80 bg-theme-surface/80 p-2 shadow-sm space-y-1">
              {myPagesItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setActiveTab(id);
                    onClose();
                  }}
                  className="flex w-full items-center rounded-xl px-3 py-2 text-left transition hover:bg-theme-base"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-theme-secondary" />
                    <span className="text-sm font-medium text-theme-secondary">{label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-theme-tertiary">
              Discover
            </div>
            <div className="rounded-2xl border border-theme-divider/80 bg-theme-surface/80 p-2 shadow-sm space-y-1">
              {discoverItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setActiveTab(id);
                    onClose();
                  }}
                  className="flex w-full items-center rounded-xl px-3 py-2 text-left transition hover:bg-theme-base"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-theme-secondary" />
                    <span className="text-sm font-medium text-theme-secondary">{label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

      </aside>
    </div>
  );
};
