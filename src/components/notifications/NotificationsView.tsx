import React, { useMemo, useState } from 'react';
import {
  Bell,
  CheckCheck,
  Heart,
  MessageCircle,
  UserPlus,
  Zap,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';
import { NotificationItem } from '../../types';

export const NotificationsView: React.FC = () => {
  const {
    notifications,
    markNotificationsAsRead,
    setActiveUserProfile,
    setActiveCommentsPostId,
    setActiveTab,
    permissions,
    setActivePermissionPrompt,
    triggerShareToast,
  } = useLalao();

  const [activeFilter, setActiveFilter] = useState<'all' | 'suggested' | 'activity'>('all');

  const suggestedUsers = useMemo(() => {
    const users = notifications
      .map((n) => n.actor)
      .filter((actor, index, arr) => arr.findIndex((item) => item.id === actor.id) === index);

    return users.slice(0, 4);
  }, [notifications]);

  const todayNotifs = notifications.filter(
    (n) => n.timestamp.includes('m ago') || n.timestamp.includes('h ago')
  );
  const earlierNotifs = notifications.filter(
    (n) => !n.timestamp.includes('m ago') && !n.timestamp.includes('h ago')
  );

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
      default:
        return <Sparkles className="w-3.5 h-3.5 text-[#5E43F3]" />;
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
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

  const visibleSuggested = activeFilter === 'suggested' || activeFilter === 'all' ? suggestedUsers : [];
  const shouldShowActivity = activeFilter === 'activity' || activeFilter === 'all';

  return (
    <div id="notifications-view-container" className="min-h-screen bg-[#f6f3ee] pb-24">
      <div className="sticky top-0 z-20 bg-[#f6f3ee]/95 backdrop-blur-md border-b border-neutral-200/80 px-4 py-2.5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black tracking-tight text-neutral-950 font-sans">Notifications</h1>
          <button
            type="button"
            onClick={markNotificationsAsRead}
            className="p-2 rounded-full text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors cursor-pointer"
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
                  ? 'bg-neutral-950 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {permissions.notifications !== 'granted' && (
        <div className="mx-4 mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <p className="text-[11px] text-rose-900 leading-snug">
              Turn on alerts for likes, replies, and local activity.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActivePermissionPrompt('notifications')}
            className="px-2.5 py-1.5 rounded-full bg-[#5E43F3] text-white text-[10px] font-bold hover:bg-[#4E34E0] transition-colors cursor-pointer shrink-0"
          >
            Enable
          </button>
        </div>
      )}

      <div className="px-4 pt-4 space-y-4">
        {(activeFilter === 'all' || activeFilter === 'suggested') && visibleSuggested.length > 0 && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold text-neutral-900 tracking-tight">Suggested for you</h2>
              <span className="text-[11px] text-neutral-400">{visibleSuggested.length}</span>
            </div>

            <div className="divide-y divide-neutral-200/80">
              {visibleSuggested.map((user) => (
                <div key={user.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar src={user.avatar} alt={user.name} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-neutral-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-neutral-500 truncate">@{user.username}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      triggerShareToast(`Followed ${user.name}`);
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
              <h2 className="text-sm font-bold text-neutral-900 tracking-tight">Recent Activity</h2>
              <span className="text-[11px] text-neutral-400">{notifications.length}</span>
            </div>

            {todayNotifs.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">Today</div>
                <div className="divide-y divide-neutral-200/80">
                  {todayNotifs.map((notif) => (
                    <button
                      key={notif.id}
                      type="button"
                      onClick={() => handleNotificationClick(notif)}
                      className={`w-full text-left py-3 flex items-start gap-3 ${!notif.isRead ? 'bg-indigo-50/30 -mx-1 px-1 rounded-xl' : ''}`}
                    >
                      <div className="relative shrink-0">
                        <Avatar src={notif.actor?.avatar} alt={notif.actor?.name || 'User'} size="md" />
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center">
                          {getNotifIcon(notif.type)}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-neutral-800 leading-snug">
                          <span className="font-bold text-neutral-900">{notif.actor?.name || 'Lalao'}</span>{' '}
                          {notif.text}
                        </p>
                        {notif.targetExcerpt && (
                          <p className="mt-1 text-[11px] text-neutral-500 bg-neutral-100 px-2 py-1 rounded-md line-clamp-1">
                            “{notif.targetExcerpt}”
                          </p>
                        )}
                        <span className="mt-1 block text-[10px] text-neutral-400">{notif.timestamp}</span>
                      </div>

                      {!notif.isRead && <span className="mt-2 w-2 h-2 rounded-full bg-[#5E43F3] shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {earlierNotifs.length > 0 && (
              <div className="space-y-2 mt-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">Earlier</div>
                <div className="divide-y divide-neutral-200/80">
                  {earlierNotifs.map((notif) => (
                    <button
                      key={notif.id}
                      type="button"
                      onClick={() => handleNotificationClick(notif)}
                      className={`w-full text-left py-3 flex items-start gap-3 ${!notif.isRead ? 'bg-indigo-50/30 -mx-1 px-1 rounded-xl' : ''}`}
                    >
                      <div className="relative shrink-0">
                        <Avatar src={notif.actor?.avatar} alt={notif.actor?.name || 'User'} size="md" />
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center">
                          {getNotifIcon(notif.type)}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-neutral-800 leading-snug">
                          <span className="font-bold text-neutral-900">{notif.actor?.name || 'Lalao'}</span>{' '}
                          {notif.text}
                        </p>
                        {notif.targetExcerpt && (
                          <p className="mt-1 text-[11px] text-neutral-500 bg-neutral-100 px-2 py-1 rounded-md line-clamp-1">
                            “{notif.targetExcerpt}”
                          </p>
                        )}
                        <span className="mt-1 block text-[10px] text-neutral-400">{notif.timestamp}</span>
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
                  <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center mx-auto">
                    <Bell className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900">No notifications yet</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">
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
