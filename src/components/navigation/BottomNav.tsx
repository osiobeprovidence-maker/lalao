import React from 'react';
import { Home, Compass, Plus, MessageCircle, User } from 'lucide-react';
import { useLalao, NavTab } from '../../context/LalaoContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, setIsCreateSheetOpen } = useLalao();

  const navItems: { id: NavTab; label: string; icon: typeof Home }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'create', label: 'Create', icon: Plus },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav
      id="lalao-bottom-nav"
      className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-lg border-t border-neutral-100 px-6 py-2 flex items-center justify-between"
    >
      {navItems.map((item) => {
        const isCenter = item.id === 'create';
        const isActive = activeTab === item.id;
        const Icon = item.icon;

        if (isCenter) {
          return (
            <div key={item.id} className="relative -top-4 flex items-center justify-center">
              <button
                id="btn-nav-create-center"
                onClick={() => setIsCreateSheetOpen(true)}
                className="w-13 h-13 rounded-full bg-[#5E43F3] text-white flex items-center justify-center shadow-lg shadow-[#5E43F3]/30 hover:bg-[#4E34E0] active:scale-90 transition-transform cursor-pointer focus:outline-none"
                aria-label="Create Post, Rally or Page"
              >
                <Plus className="w-7 h-7 stroke-[2.4]" />
              </button>
            </div>
          );
        }

        return (
          <button
            key={item.id}
            id={`btn-nav-${item.id}`}
            onClick={() => {
              setActiveTab(item.id);
              const mainEl = document.querySelector('main');
              if (mainEl) {
                mainEl.scrollTo({ top: 0, behavior: 'instant' });
              }
              window.scrollTo({ top: 0, behavior: 'instant' });
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer relative ${
              isActive ? 'text-[#5E43F3]' : 'text-neutral-500 hover:text-neutral-900'
            }`}
            aria-label={item.label}
          >
            <Icon
              className={`w-6 h-6 transition-transform ${
                isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.8]'
              }`}
            />
            {isActive && (
              <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[#5E43F3]" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
