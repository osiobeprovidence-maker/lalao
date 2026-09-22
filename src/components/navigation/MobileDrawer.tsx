import React from 'react';
import {
  Plus,
  ShoppingBag,
  Wallet,
  X,
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
    { id: 'pages', label: 'Add Pages', icon: Plus },
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
        className="relative z-10 flex h-full w-[85vw] max-w-[360px] flex-col overflow-y-auto border-r border-neutral-200 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.08),_transparent_42%),linear-gradient(180deg,#ffffff_0%,#f9f7ff_100%)] shadow-2xl transition-transform duration-300 ease-out animate-in slide-in-from-left"
      >
        <div className="sticky top-0 z-20 border-b border-neutral-200/80 bg-white/90 px-4 pb-4 pt-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="lalao-wordmark text-[22px] text-neutral-950">lalao</span>

            <button
              id="btn-close-mobile-drawer"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
              aria-label="Close navigation drawer"
              title="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col px-4 py-4">
          <div className="rounded-2xl border border-neutral-200/80 bg-white/80 p-2 shadow-sm">
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
                  setCreateFlowType(null);
                  setIsCreateSheetOpen(false);
                  setActiveTab('create-post');
                  onClose();
                }}
                className="flex w-full items-center rounded-xl px-3 py-3 text-left transition hover:bg-neutral-50"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-neutral-600" />
                  <span className="text-sm font-medium text-neutral-700">{label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

      </aside>
    </div>
  );
};
