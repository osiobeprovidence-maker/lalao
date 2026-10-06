import React, { useMemo, useState } from 'react';
import {
  Bell,
  CheckCheck,
  Heart,
  MessageCircle,
  UserPlus,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';
import { NotificationItem } from '../../types';
import { SEED_NOTIFICATIONS } from '../../data/seedData';

export const NotificationsView: React.FC = () => {
  const {
    currentUser,
    suggestedUsers,
    notifications,
    markAllNotificationsRead,
    markNotificationRead,
    setActiveUserProfile,
    setActiveCommentsPostId,
    setActiveTab,
    toggleFollowUser,
    triggerShareToast,
  } = useLalao();

  const [activeFilter, setActiveFilter] = useState<'all' | 'suggested' | 'activity'>('all');

  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  const safeNotifications = (notifications && notifications.length > 0) ? notifications : SEED_NOTIFICATIONS;
  const todayNotifs = safeNotifications.filter((n) => {
    if (n.createdAt) return now - n.createdAt < oneDayMs;
    return n.timestamp.includes('m ago') || n.timestamp.includes('h ago');
  });

  const earlierNotifs = safeNotifications.filter((n) => {
    if (n.createdAt) return now - n.createdAt >= oneDayMs;
    return !n.timestamp.includes('m ago') && !n.timestamp.includes('h ago');
  });

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />;
      case 'reply':
        return <MessageCircle className="w-3.5 h-3.5 text-[#5E43F3]" />;
      case 'follow':
        return <UserPlus className="w-3.5 h-3.5 text-emerald-600" />;
      case 'rally_join':
        return <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />;
      case 'message':
      case 'mention':
        return <MessageCircle className="w-3.5 h-3.5 text-blue-500 fill-blue-500/20" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-theme-tertiary" />;
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markNotificationRead(item.id);
    }
    
    if (item.type === 'follow') {
      setActiveUserProfile(item.actor);
      setActiveTab('profile');
      return;
    }

    if (item.type === 'rally_join') {
      setActiveTab('home');
      return;
    }

    if (item.type === 'like' || item.type === 'reply') {
      setActiveTab('home');
      if (item.targetId) {
        setActiveCommentsPostId(item.targetId);
      }
      return;
    }

    setActiveTab('home');
  };

  const visibleSuggested = (activeFilter === 'suggested' || activeFilter === 'all') ? (suggestedUsers || []) : [];
  const shouldShowActivity = activeFilter === 'activity' || activeFilter === 'all';

  return (
    <div id="notifications-view-container" className="min-h-screen bg-theme-base pb-24">
      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-theme-base/95 backdrop-blur-md border-b border-black/[0.04] dark:border-white/[0.06] px-4 py-2.5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black tracking-tight text-theme-primary font-sans">Notifications</h1>
          <button
            type="button"
            onClick={markAllNotificationsRead}
            className="p-2 rounded-full text-[#707070] dark:text-[#707070] hover:text-[#5E43F3] dark:hover:text-[#7C65F6] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
            title="Mark all as read"
            aria-label="Mark all notifications as read"
          >
            <CheckCheck className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All' },
            { id: 'suggested', label: 'Suggested for you' },
            { id: 'activity', label: 'Recent Activity' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as 'all' | 'suggested' | 'activity')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-theme-inverse text-theme-text-inverse shadow-xs'
                  : 'bg-black/[0.03] dark:bg-white/[0.04] text-theme-secondary hover:bg-black/[0.06] dark:hover:bg-white/[0.07] hover:text-theme-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Suggested For You */}
        {(activeFilter === 'all' || activeFilter === 'suggested') && visibleSuggested.length > 0 && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold text-theme-primary tracking-tight">Suggested for you</h2>
              <span className="text-[11px] text-[#707070] dark:text-[#707070]">{visibleSuggested.length}</span>
            </div>

            <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
              {visibleSuggested.map((user) => (
                <div key={user.id} className="flex items-center justify-between gap-3 py-3 px-1 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar src={user.avatar} alt={user.name} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-theme-primary truncate">{user.name}</p>
                      <p className="text-[11px] text-[#707070] dark:text-[#707070] truncate">@{user.username}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      toggleFollowUser(user.id);
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-[#5E43F3] text-[11px] font-bold text-white hover:bg-[#4E34E0] shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent Activity */}
        {shouldShowActivity && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-theme-primary tracking-tight">Recent Activity</h2>
              <span className="text-[11px] text-[#707070] dark:text-[#707070]">{notifications.length}</span>
            </div>

            {/* Today */}
            {todayNotifs.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#707070] dark:text-[#707070] px-1">
                  Today
                </div>
                <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                  {todayNotifs.map((notif) => {
                    const isLikeCard = notif.type === 'like';
                    return (
                      <button
                        key={notif.id}
                        type="button"
                        onClick={() => handleNotificationClick(notif)}
                        className={`w-full text-left py-3.5 px-3 flex items-start gap-3.5 rounded-2xl transition-all cursor-pointer ${
                          isLikeCard
                            ? 'bg-[#5E43F3]/[0.08] dark:bg-[#171326] border border-[#5E43F3]/20 shadow-xs my-1'
                            : 'bg-transparent hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="relative shrink-0 mt-0.5">
                          <Avatar src={notif.actor?.avatar} alt={notif.actor?.name || 'User'} size="md" />
                          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-theme-surface dark:bg-[#141414] border border-black/[0.04] dark:border-white/[0.06] shadow-xs flex items-center justify-center">
                            {getNotifIcon(notif.type)}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs leading-snug">
                            <span className="font-bold text-theme-primary">{notif.actor?.name || 'Lalao'}</span>{' '}
                            <span className="text-theme-secondary">{notif.text}</span>
                          </p>
                          {notif.targetExcerpt && (
                            <div className="mt-1.5">
                              <span className="inline-block text-[11px] text-theme-secondary bg-[#EBE6DF] dark:bg-[#181818] border border-transparent dark:border-white/[0.04] px-2.5 py-1 rounded-lg line-clamp-1 max-w-full">
                                “{notif.targetExcerpt}”
                              </span>
                            </div>
                          )}
                          <span className="mt-1.5 block text-[10px] text-[#707070] dark:text-[#707070] font-medium">
                            {notif.timestamp}
                          </span>
                        </div>

                        {!notif.isRead && (
                          <span className="mt-2.5 w-2 h-2 rounded-full bg-[#5E43F3] shadow-[0_0_8px_rgba(94,67,243,0.5)] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Earlier */}
            {earlierNotifs.length > 0 && (
              <div className="space-y-2 mt-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#707070] dark:text-[#707070] px-1">
                  Earlier
                </div>
                <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                  {earlierNotifs.map((notif) => {
                    const isLikeCard = notif.type === 'like';
                    return (
                      <button
                        key={notif.id}
                        type="button"
                        onClick={() => handleNotificationClick(notif)}
                        className={`w-full text-left py-3.5 px-3 flex items-start gap-3.5 rounded-2xl transition-all cursor-pointer ${
                          isLikeCard
                            ? 'bg-[#5E43F3]/[0.08] dark:bg-[#171326] border border-[#5E43F3]/20 shadow-xs my-1'
                            : 'bg-transparent hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="relative shrink-0 mt-0.5">
                          <Avatar src={notif.actor?.avatar} alt={notif.actor?.name || 'User'} size="md" />
                          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-theme-surface dark:bg-[#141414] border border-black/[0.04] dark:border-white/[0.06] shadow-xs flex items-center justify-center">
                            {getNotifIcon(notif.type)}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs leading-snug">
                            <span className="font-bold text-theme-primary">{notif.actor?.name || 'Lalao'}</span>{' '}
                            <span className="text-theme-secondary">{notif.text}</span>
                          </p>
                          {notif.targetExcerpt && (
                            <div className="mt-1.5">
                              <span className="inline-block text-[11px] text-theme-secondary bg-[#EBE6DF] dark:bg-[#181818] border border-transparent dark:border-white/[0.04] px-2.5 py-1 rounded-lg line-clamp-1 max-w-full">
                                “{notif.targetExcerpt}”
                              </span>
                            </div>
                          )}
                          <span className="mt-1.5 block text-[10px] text-[#707070] dark:text-[#707070] font-medium">
                            {notif.timestamp}
                          </span>
                        </div>

                        {!notif.isRead && (
                          <span className="mt-2.5 w-2 h-2 rounded-full bg-[#5E43F3] shadow-[0_0_8px_rgba(94,67,243,0.5)] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {safeNotifications.length === 0 && (
              <div className="flex min-h-[46vh] items-center justify-center px-4">
                <div className="max-w-xs text-center space-y-2.5">
                  <div className="w-12 h-12 rounded-full bg-black/[0.03] dark:bg-white/[0.04] text-[#707070] flex items-center justify-center mx-auto">
                    <Bell className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-theme-primary">No notifications yet</h3>
                  <p className="text-xs text-[#707070] dark:text-[#707070] leading-relaxed">
                    Likes, replies, follows, and local activity will appear here when they happen.
                  </p>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};
