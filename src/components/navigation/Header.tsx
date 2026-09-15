import React, { useState } from 'react';
import { Heart, Menu } from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { MobileDrawer } from './MobileDrawer';

export const Header: React.FC = () => {
  const {
    setIsNotificationsOpen,
    unreadNotifsCount,
  } = useLalao();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header
        id="lalao-header"
        className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-2.5 flex items-center justify-between transition-all"
      >
        {/* Left: Mobile Hamburger Menu */}
        <div className="flex items-center justify-start">
          <button
            id="btn-mobile-menu-open"
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 rounded-full text-neutral-800 hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer"
            title="Menu"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5 stroke-[2]" />
          </button>
        </div>

        {/* Lalao Brand Logo - Centered */}
        <div className="flex items-center justify-center select-none flex-1 text-center">
          <span className="text-xl font-black tracking-tight text-neutral-950 font-sans">
            lalao
          </span>
        </div>

        {/* Right controls: Notifications */}
        <div className="flex items-center justify-end">
          <button
            id="btn-notifications-open"
            onClick={() => setIsNotificationsOpen(true)}
            className="relative p-1.5 rounded-full text-neutral-800 hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer"
            title="Notifications & Activity"
          >
            <Heart className="w-5 h-5 stroke-[1.8]" />
            {unreadNotifsCount > 0 && (
              <span
                id="badge-unread-notif"
                className="absolute top-1 right-1 w-2 h-2 bg-[#5E43F3] rounded-full ring-2 ring-white"
              />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Side Navigation Drawer */}
      <MobileDrawer isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  );
};
