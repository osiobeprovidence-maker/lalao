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
import { PushNotificationSettings } from './PushNotificationSettings';

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

  const safeNotifications = notifications || [];
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
      <div className="sticky top-0 z-20 bg-theme-base/95 backdrop-blur-md border-b border-theme-divider/80 px-4 py-2.5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black tracking-tight text-theme-primary font-sans">Notifications</h1>
          <button
            type="button"
            onClick={markAllNotificationsRead}
            className="p-2 rounded-full text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors cursor-pointer"
            title="Mark all as read"
            aria-label="Mark all notifications as read"
          >
            <CheckCheck className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
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
                  ? 'bg-theme-inverse text-theme-text-inverse'
                  : 'bg-theme-surface-hover text-theme-secondary hover:bg-theme-surface-active/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Push notification settings banner */}
      <PushNotificationSettings />

      <div className="px-4 pt-4 space-y-4">
        {(activeFilter === 'all' || activeFilter === 'suggested') && visibleSuggested.length > 0 && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold text-theme-primary tracking-tight">Suggested for you</h2>
              <span className="text-[11px] text-theme-tertiary">{visibleSuggested.length}</span>
            </div>

            <div className="divide-y divide-theme-divider/80">
              {visibleSuggested.map((user) => (
                <div key={user.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar src={user.avatar} alt={user.name} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-theme-primary truncate">{user.name}</p>
                      <p className="text-[11px] text-theme-tertiary truncate">@{user.username}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      toggleFollowUser(user.id);
                    }}
                    className="px-3 py-1.5 rounded-full bg-[#5E43F3] text-[11px] font-bold text-white hover:bg-[#4E34E0] transition-colors cursor-pointer"
                  >
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {shouldShowActivity && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold text-theme-primary tracking-tight">Recent Activity</h2>
              <span className="text-[11px] text-theme-tertiary">{notifications.length}</span>
            </div>

            {todayNotifs.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-theme-tertiary">Today</div>
                <div className="divide-y divide-theme-divider/80">
                  {todayNotifs.map((notif) => (
                    <button
                      key={notif.id}
                      type="button"
                      onClick={() => handleNotificationClick(notif)}
                      className={`w-full text-left py-3 flex items-start gap-3 ${!notif.isRead ? 'bg-[#5E43F3]/10 -mx-1 px-1 rounded-xl' : ''}`}
                    >
                      <div className="relative shrink-0">
                        <Avatar src={notif.actor?.avatar} alt={notif.actor?.name || 'User'} size="md" />
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-theme-surface shadow-sm flex items-center justify-center">
                          {getNotifIcon(notif.type)}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-theme-primary leading-snug">
                          <span className="font-bold text-theme-primary">{notif.actor?.name || 'Lalao'}</span>{' '}
                          {notif.text}
                        </p>
                        {notif.targetExcerpt && (
                          <p className="mt-1 text-[11px] text-theme-tertiary bg-theme-surface-hover px-2 py-1 rounded-md line-clamp-1">
                            “{notif.targetExcerpt}”
                          </p>
                        )}
                        <span className="mt-1 block text-[10px] text-theme-tertiary">{notif.timestamp}</span>
                      </div>

                      {!notif.isRead && <span className="mt-2 w-2 h-2 rounded-full bg-[#5E43F3] shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {earlierNotifs.length > 0 && (
              <div className="space-y-2 mt-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-theme-tertiary">Earlier</div>
                <div className="divide-y divide-theme-divider/80">
                  {earlierNotifs.map((notif) => (
                    <button
                      key={notif.id}
                      type="button"
                      onClick={() => handleNotificationClick(notif)}
                      className={`w-full text-left py-3 flex items-start gap-3 ${!notif.isRead ? 'bg-[#5E43F3]/10 -mx-1 px-1 rounded-xl' : ''}`}
                    >
                      <div className="relative shrink-0">
                        <Avatar src={notif.actor?.avatar} alt={notif.actor?.name || 'User'} size="md" />
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-theme-surface shadow-sm flex items-center justify-center">
                          {getNotifIcon(notif.type)}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-theme-primary leading-snug">
                          <span className="font-bold text-theme-primary">{notif.actor?.name || 'Lalao'}</span>{' '}
                          {notif.text}
                        </p>
                        {notif.targetExcerpt && (
                          <p className="mt-1 text-[11px] text-theme-tertiary bg-theme-surface-hover px-2 py-1 rounded-md line-clamp-1">
                            “{notif.targetExcerpt}”
                          </p>
                        )}
                        <span className="mt-1 block text-[10px] text-theme-tertiary">{notif.timestamp}</span>
                      </div>

                      {!notif.isRead && <span className="mt-2 w-2 h-2 rounded-full bg-[#5E43F3] shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {notifications.length === 0 && (
              <div className="flex min-h-[46vh] items-center justify-center px-4">
                <div className="max-w-xs text-center space-y-2.5">
                  <div className="w-12 h-12 rounded-full bg-theme-surface-hover text-theme-tertiary flex items-center justify-center mx-auto">
                    <Bell className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-theme-primary">No notifications yet</h3>
                  <p className="text-xs text-theme-tertiary leading-relaxed">
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
