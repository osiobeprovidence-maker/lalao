import React from 'react';
import {
  Plus,
  ShoppingBag,
  Wallet,
  X,
  Building2,
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
    myPages,
    setActivePageId,
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

          <div className="mt-6 rounded-2xl border border-neutral-200/80 bg-white/80 p-3 shadow-sm">
            <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
              My Page
            </div>
            <div className="space-y-1.5">
              {(!myPages || myPages.length === 0) ? (
                <div className="py-3 bg-neutral-50 rounded-xl border border-neutral-100 flex flex-col items-center justify-center text-center">
                  <span className="text-xs text-neutral-500 mb-2">You don't have a Page yet.</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('create-page');
                      onClose();
                    }}
                    className="text-[13px] font-bold text-[#5E43F3] hover:underline cursor-pointer"
                  >
                    Create a Page
                  </button>
                </div>
              ) : (
                myPages.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setActivePageId(p.id);
                      onClose();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition cursor-pointer text-neutral-700 hover:bg-[#f8f6f3] hover:text-neutral-950"
                  >
                    <img src={p.avatar} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-bold text-neutral-900 flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-neutral-400 shrink-0" />
                        <span className="truncate">{p.name}</span>
                      </div>
                      <div className="truncate text-[11px] text-neutral-500">@{p.username}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

      </aside>
    </div>
  );
};
