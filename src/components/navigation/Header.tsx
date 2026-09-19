import React, { useState } from 'react';
import { Menu, Search, Crown } from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { MobileDrawer } from './MobileDrawer';

export const Header: React.FC = () => {
  const {
    setActiveTab,
    setIsMySubscriptionsOpen
  } = useLalao();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header
        id="lalao-header"
        className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/95 px-4 py-2.5 backdrop-blur-md transition-all"
      >
        <div className="relative flex items-center justify-between gap-3">
          <button
            id="btn-mobile-menu-open"
            onClick={() => setIsMobileMenuOpen(true)}
            className="relative z-10 rounded-full p-2 text-neutral-800 transition hover:bg-neutral-100 active:scale-95"
            title="Menu"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5 stroke-[2.2]" />
          </button>

          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none">
            <span className="lalao-wordmark text-xl text-neutral-950">lalao</span>
          </div>

          <div className="flex items-center gap-1 z-10">
            <button
              onClick={() => setIsMySubscriptionsOpen(true)}
              className="relative rounded-full p-2 text-[#5E43F3] transition hover:bg-[#5E43F3]/10 active:scale-95"
              title="My Subscriptions"
              aria-label="Open my subscriptions"
            >
              <Crown className="h-5 w-5 stroke-[2.2]" />
            </button>
            <button
              id="btn-explore-open"
              onClick={() => setActiveTab('discover')}
              className="relative rounded-full p-2 text-neutral-800 transition hover:bg-neutral-100 active:scale-95"
              title="Explore"
              aria-label="Open explore"
            >
              <Search className="h-5 w-5 stroke-[2.2]" />
            </button>
          </div>
      </header>

      <MobileDrawer isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  );
};
