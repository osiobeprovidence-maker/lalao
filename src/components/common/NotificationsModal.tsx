import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  X,
  Heart,
  Check,
  Infinity,
  MessageCircle,
  UserPlus,
  Zap,
  CheckCheck,
  Bell,
  Sparkles,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from './Avatar';
import { NotificationItem } from '../../types';

interface SuggestedAccount {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isVerified: boolean;
  mutualCount: number;
  mutualAvatars: string[];
  ringColor?: string;
}





export const NotificationsModal: React.FC = () => {
  const {
    isNotificationsOpen,
    setIsNotificationsOpen,
    notifications,
    markNotificationsAsRead,
    setActiveUserProfile,
    setActiveCommentsPostId,
    setActiveTab,
    permissions,
    setActivePermissionPrompt,
    triggerShareToast,
    suggestedUsers,
    toggleFollowUser,
  } = useLalao();

  const [suggestions, setSuggestions] = useState<SuggestedAccount[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [isFeaturedDismissed, setIsFeaturedDismissed] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'suggested' | 'activity'>('all');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (suggestedUsers) {
      setSuggestions(suggestedUsers.map(u => ({
        id: u.id,
        name: u.name,
        username: u.username,
        avatar: u.avatar || '',
        isVerified: u.isVerified || false,
        mutualCount: 2,
        mutualAvatars: [],
      })));
    }
  }, [suggestedUsers]);

  useEffect(() => {
    if (isNotificationsOpen) {
      containerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [isNotificationsOpen, activeFilter]);

  if (!isNotificationsOpen) return null;

  const handleToggleFollow = (user: SuggestedAccount) => {
    toggleFollowUser(user.id);
    const nextState = !followingMap[user.id];
    setFollowingMap((prev) => ({ ...prev, [user.id]: nextState }));
    if (nextState) {
      triggerShareToast(`Followed ${user.name}`);
    } else {
      triggerShareToast(`Unfollowed ${user.name}`);
    }
  };

  const handleDismissSuggestion = (id: string, name: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
    triggerShareToast(`Removed suggestion for ${name}`);
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (item.type === 'follow') {
      setActiveUserProfile(item.actor);
      setIsNotificationsOpen(false);
    } else if (item.type === 'rally_join') {
      setIsNotificationsOpen(false);
      setActiveTab('home');
    } else if (item.type === 'like' || item.type === 'reply') {
      setIsNotificationsOpen(false);
      setActiveTab('home');
      if (item.targetId) {
        setActiveCommentsPostId(item.targetId);
      }
    }
  };

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
        return <Heart className="w-3.5 h-3.5 text-[#5E43F3] fill-[#5E43F3]/20" />;
    }
  };

  // Group notifications into Today vs Earlier
  const todayNotifs = notifications.filter(
    (n) => n.timestamp.includes('m ago') || n.timestamp.includes('h ago')
  );
  const earlierNotifs = notifications.filter(
    (n) => !n.timestamp.includes('m ago') && !n.timestamp.includes('h ago')
  );

  return (
    <div
      id="notifications-screen"
      className="absolute inset-0 z-40 bg-theme-surface flex flex-col min-h-full overflow-hidden animate-in fade-in slide-in-from-right-4 duration-250"
    >
      <div className="w-full max-w-xl mx-auto flex-1 flex flex-col bg-theme-surface overflow-hidden">
        {/* Instagram Inspo Header with Back Arrow & Bold Title */}
        <div className="pt-4 pb-3 px-4 bg-theme-surface border-b border-theme-divider-light flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button
              id="btn-notifications-back"
              type="button"
              onClick={() => setIsNotificationsOpen(false)}
              className="p-1 -ml-1 text-theme-primary hover:text-theme-secondary active:scale-95 transition-transform cursor-pointer"
              aria-label="Go back"
            >
              <ArrowLeft className="w-6 h-6 stroke-[2.4]" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-theme-primary tracking-tight">
              Notifications
            </h1>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={markNotificationsAsRead}
              className="p-2 rounded-full text-theme-tertiary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
              title="Mark all as read"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
            <div className="p-1.5 rounded-full text-rose-500" title="Activity & Love">
              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            </div>
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div className="px-4 py-2 bg-theme-base/60 border-b border-theme-divider-light flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-theme-inverse text-theme-text-inverse'
                : 'bg-theme-surface text-theme-secondary border border-theme-divider/70 hover:bg-theme-surface-hover'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('suggested')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === 'suggested'
                ? 'bg-theme-inverse text-theme-text-inverse'
                : 'bg-theme-surface text-theme-secondary border border-theme-divider/70 hover:bg-theme-surface-hover'
            }`}
          >
            Suggested for you
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('activity')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === 'activity'
                ? 'bg-theme-inverse text-theme-text-inverse'
                : 'bg-theme-surface text-theme-secondary border border-theme-divider/70 hover:bg-theme-surface-hover'
            }`}
          >
            Recent Activity
          </button>
        </div>

        {/* Push Notification Alert Banner */}
        {permissions.notifications !== 'granted' && (
          <div className="p-3 bg-rose-50/60 border-b border-rose-100 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Heart className="w-3.5 h-3.5 fill-rose-600" />
              </div>
              <p className="text-[11px] text-rose-900 leading-snug">
                Turn on alerts for likes, friend rallies, and direct messages.
              </p>
            </div>
            <button
              onClick={() => setActivePermissionPrompt('notifications')}
              className="px-2.5 py-1 rounded-lg bg-[#0095F6] hover:bg-[#1877F2] text-white font-bold text-[10px] shrink-0 transition-colors shadow-2xs cursor-pointer"
            >
              Turn On
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <div ref={containerRef} className="flex-1 overflow-y-auto min-h-0 divide-y divide-neutral-100">
          {/* SECTION 1: FEATURED (from inspo screenshot) */}
          {(activeFilter === 'all' || activeFilter === 'suggested') && !isFeaturedDismissed && (
            <div className="pb-2">
              <div className="px-4 pt-4 pb-2">
                <h2 className="text-lg font-bold text-theme-primary tracking-tight">
                  Featured
                </h2>
              </div>

              <div className="px-4 py-2 hover:bg-theme-base transition-colors flex items-start gap-3.5 group">
                {/* Accounts Center / Meta-style Infinity Loop Icon */}
                <div className="w-12 h-12 rounded-full bg-theme-surface-hover flex items-center justify-center text-theme-primary shrink-0 border border-theme-divider/60 shadow-2xs">
                  <Infinity className="w-6 h-6 stroke-[2.2]" />
                </div>

                <div className="flex-1 min-w-0 pr-1">
                  <p className="text-xs text-theme-primary leading-relaxed font-normal">
                    We updated your settings after 1 account was added to the same Accounts Center.
                  </p>
                  <span className="text-[11px] text-theme-tertiary font-medium mt-1 block">
                    2h
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFeaturedDismissed(true)}
                  className="text-theme-tertiary hover:text-theme-secondary p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* SECTION 2: SUGGESTED FOR YOU (from inspo screenshot) */}
          {(activeFilter === 'all' || activeFilter === 'suggested') && suggestions.length > 0 && (
            <div className="py-2">
              <div className="px-4 pt-2 pb-2.5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-theme-primary tracking-tight">
                  Suggested for you
                </h2>
                <span className="text-xs font-semibold text-[#0095F6]">
                  {suggestions.length} accounts
                </span>
              </div>

              <div className="space-y-1">
                {suggestions.map((item) => {
                  const isFollowing = !!followingMap[item.id];

                  return (
                    <div
                      key={item.id}
                      className="px-4 py-2 hover:bg-theme-base/80 transition-colors flex items-center justify-between gap-2.5"
                    >
                      {/* Left: Avatar with optional ring */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative shrink-0">
                          <img
                            src={item.avatar}
                            alt={item.name}
                            className={`w-11 h-11 rounded-full object-cover ${
                              item.ringColor ? item.ringColor : 'ring-1 ring-black/5'
                            }`}
                          />
                        </div>

                        {/* Middle: User info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-theme-primary truncate">
                              {item.name}
                            </span>
                          </div>

                          {/* Mutual avatars and count */}
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="flex -space-x-1.5 shrink-0">
                              {item.mutualAvatars.slice(0, 3).map((av, idx) => (
                                <img
                                  key={idx}
                                  src={av}
                                  alt="Mutual"
                                  className="w-3.5 h-3.5 rounded-full ring-1 ring-white object-cover"
                                />
                              ))}
                            </div>
                            <span className="text-[11px] text-theme-tertiary truncate font-normal">
                              {item.mutualCount} mutuals
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Blue Follow button and Dismiss button */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleFollow(item)}
                          className={`text-xs font-semibold px-4 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer shadow-2xs ${
                            isFollowing
                              ? 'bg-theme-surface-hover hover:bg-theme-surface-active text-theme-primary border border-theme-divider-strong'
                              : 'bg-[#0095F6] hover:bg-[#1877F2] text-white'
                          }`}
                        >
                          {isFollowing ? 'Following' : 'Follow'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDismissSuggestion(item.id, item.name)}
                          className="text-theme-tertiary hover:text-theme-secondary p-1 rounded-full transition-colors cursor-pointer"
                          aria-label={`Dismiss suggestion for ${item.name}`}
                        >
                          <X className="w-3.5 h-3.5 stroke-[2.2]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 3: RECENT NOTIFICATIONS / ACTIVITY */}
          {(activeFilter === 'all' || activeFilter === 'activity') && (
            <div className="py-2">
              {/* Today */}
              {todayNotifs.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-2">
                    <h2 className="text-sm font-bold text-theme-primary uppercase tracking-wider text-[11px] text-theme-tertiary">
                      Today
                    </h2>
                  </div>

                  {todayNotifs.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`px-4 py-3 flex items-start gap-3 transition-colors cursor-pointer hover:bg-theme-base ${
                        !notif.isRead ? 'bg-indigo-50/25' : 'bg-theme-surface'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <Avatar
                          src={notif.actor?.avatar}
                          alt={notif.actor?.name || 'Notification'}
                          size="md"
                        />
                        <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-theme-surface shadow-xs">
                          {getNotifIcon(notif.type)}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-theme-primary leading-snug">
                          <strong className="text-theme-primary font-bold">
                            {notif.actor?.name || 'Lalao'}
                          </strong>{' '}
                          {notif.text}
                        </p>

                        {notif.targetExcerpt && (
                          <p className="text-[11px] text-theme-tertiary mt-1 line-clamp-1 bg-theme-surface-hover/70 px-2 py-1 rounded-md">
                            &ldquo;{notif.targetExcerpt}&rdquo;
                          </p>
                        )}

                        <span className="text-[10px] text-theme-tertiary mt-1 block">
                          {notif.timestamp}
                        </span>
                      </div>

                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-2 ring-2 ring-rose-200" />
                      )}

                      {/* Action Button (e.g., Follow Back / Friends) */}
                      {notif.type === 'follow' && (
                        <div className="shrink-0 ml-1 flex flex-col items-center justify-center">
                          {notif.actor?.relationship === 'friends' ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (notif.actor) {
                                  toggleFollowUser(notif.actor.id);
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer border border-theme-divider-strong text-theme-secondary hover:bg-theme-surface-hover flex items-center gap-1 shadow-xs"
                            >
                              Friends <Check className="w-2.5 h-2.5" />
                            </button>
                          ) : notif.actor?.relationship === 'follower' ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (notif.actor) {
                                  toggleFollowUser(notif.actor.id);
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer bg-[#5E43F3] text-white hover:bg-[#4E34E0] flex items-center gap-1 shadow-xs"
                            >
                              Follow Back <UserPlus className="w-2.5 h-2.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (notif.actor) {
                                  toggleFollowUser(notif.actor.id);
                                }
                              }}
                              className={`px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                                notif.actor?.isFollowing
                                  ? 'border border-theme-divider-strong text-theme-secondary hover:bg-theme-surface-hover'
                                  : 'bg-theme-inverse text-theme-text-inverse hover:bg-theme-inverse'
                              }`}
                            >
                              {notif.actor?.isFollowing ? 'Following' : 'Follow'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Earlier */}
              {earlierNotifs.length > 0 && (
                <div className="mt-2">
                  <div className="px-4 pt-3 pb-2">
                    <h2 className="text-sm font-bold text-theme-primary uppercase tracking-wider text-[11px] text-theme-tertiary">
                      Earlier
                    </h2>
                  </div>

                  {earlierNotifs.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`px-4 py-3 flex items-start gap-3 transition-colors cursor-pointer hover:bg-theme-base ${
                        !notif.isRead ? 'bg-indigo-50/25' : 'bg-theme-surface'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <Avatar
                          src={notif.actor?.avatar}
                          alt={notif.actor?.name || 'Notification'}
                          size="md"
                        />
                        <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-theme-surface shadow-xs">
                          {getNotifIcon(notif.type)}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-theme-primary leading-snug">
                          <strong className="text-theme-primary font-bold">
                            {notif.actor?.name || 'Lalao'}
                          </strong>{' '}
                          {notif.text}
                        </p>

                        {notif.targetExcerpt && (
                          <p className="text-[11px] text-theme-tertiary mt-1 line-clamp-1 bg-theme-surface-hover/70 px-2 py-1 rounded-md">
                            &ldquo;{notif.targetExcerpt}&rdquo;
                          </p>
                        )}

                        <span className="text-[10px] text-theme-tertiary mt-1 block">
                          {notif.timestamp}
                        </span>
                      </div>

                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-2 ring-2 ring-rose-200" />
                      )}

                      {/* Action Button (e.g., Follow Back / Friends) */}
                      {notif.type === 'follow' && (
                        <div className="shrink-0 ml-1 flex flex-col items-center justify-center">
                          {notif.actor?.relationship === 'friends' ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (notif.actor) {
                                  toggleFollowUser(notif.actor.id);
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer border border-theme-divider-strong text-theme-secondary hover:bg-theme-surface-hover flex items-center gap-1 shadow-xs"
                            >
                              Friends <Check className="w-2.5 h-2.5" />
                            </button>
                          ) : notif.actor?.relationship === 'follower' ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (notif.actor) {
                                  toggleFollowUser(notif.actor.id);
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer bg-[#5E43F3] text-white hover:bg-[#4E34E0] flex items-center gap-1 shadow-xs"
                            >
                              Follow Back <UserPlus className="w-2.5 h-2.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (notif.actor) {
                                  toggleFollowUser(notif.actor.id);
                                }
                              }}
                              className={`px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                                notif.actor?.isFollowing
                                  ? 'border border-theme-divider-strong text-theme-secondary hover:bg-theme-surface-hover'
                                  : 'bg-theme-inverse text-theme-text-inverse hover:bg-theme-inverse'
                              }`}
                            >
                              {notif.actor?.isFollowing ? 'Following' : 'Follow'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {notifications.length === 0 && (
                <div className="p-8 text-center text-theme-tertiary space-y-2">
                  <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto text-rose-500">
                    <Heart className="w-6 h-6 fill-rose-500" />
                  </div>
                  <p className="text-xs font-semibold text-theme-secondary">
                    No new activity right now
                  </p>
                  <p className="text-[11px] text-theme-tertiary max-w-xs mx-auto">
                    Likes, comments, neighbor rallies, and suggestions will appear here.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
