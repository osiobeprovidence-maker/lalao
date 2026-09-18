import React from 'react';
import { Home, Heart, Plus, MessageCircle, User } from 'lucide-react';
import { useLalao, NavTab } from '../../context/LalaoContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, setIsCreateSheetOpen, setCreateFlowType, unreadNotifsCount } = useLalao();

  const navItems: { id: NavTab; label: string; icon: typeof Home }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'create', label: 'Create', icon: Plus },
    { id: 'notifications', label: 'Likes', icon: Heart },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav
      id="lalao-bottom-nav"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-100 bg-white/95 px-6 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,23,42,0.06)] backdrop-blur-lg flex items-center justify-between"
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
                onClick={() => {
                  setCreateFlowType(null);
                  setIsCreateSheetOpen(false);
                  setActiveTab('create-post');
                }}
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
            {item.id === 'notifications' && unreadNotifsCount > 0 && (
              <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            )}
            {isActive && (
              <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[#5E43F3]" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
