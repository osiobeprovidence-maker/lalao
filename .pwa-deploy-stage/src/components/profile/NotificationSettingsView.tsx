import React from 'react';
import {
  ArrowLeft,
  Bell,
  MessageCircle,
  Heart,
  MessageSquare,
  UserPlus,
  AtSign,
  Video,
  Loader2,
  Check,
} from 'lucide-react';
import { usePushNotifications } from '../../hooks/usePushNotifications';

interface NotificationSettingsViewProps {
  onBack: () => void;
  notifPrefs: Record<string, boolean>;
  onTogglePref: (key: string, value: boolean) => void;
}

export const NotificationSettingsView: React.FC<NotificationSettingsViewProps> = ({
  onBack,
  notifPrefs,
  onTogglePref,
}) => {
  const pushContext = usePushNotifications();

  const categories = [
    {
      key: 'messages',
      label: 'Direct Messages & Chats',
      desc: 'Notifications when members send you direct messages or group chats',
      Icon: MessageCircle,
    },
    {
      key: 'comments',
      label: 'Comments & Replies',
      desc: 'When someone responds to your posts or continues a conversation',
      Icon: MessageSquare,
    },
    {
      key: 'likes',
      label: 'Likes & Reactions',
      desc: 'When other community members like your posts or media',
      Icon: Heart,
    },
    {
      key: 'follows',
      label: 'New Followers & Connections',
      desc: 'Alerts when people in your area start following your profile',
      Icon: UserPlus,
    },
    {
      key: 'mentions',
      label: 'Mentions & Tags',
      desc: 'Notifications when someone mentions you in a post or comment',
      Icon: AtSign,
    },
    {
      key: 'cycles',
      label: '24-Hour Cycles & Stories',
      desc: 'Updates when friends and creators you follow post active cycles',
      Icon: Video,
    },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-theme-surface animate-in fade-in slide-in-from-right duration-250">
      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-theme-surface/95 backdrop-blur-md border-b border-theme-divider-light px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-to-settings-main"
            type="button"
            onClick={onBack}
            className="p-1.5 -ml-1 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
            title="Back to Settings"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-base text-theme-primary">Notifications</h1>
            <p className="text-[11px] text-theme-tertiary">Activity alerts and push notifications</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="px-3.5 py-1.5 rounded-full bg-theme-surface-hover hover:bg-theme-surface-active text-theme-primary text-xs font-bold transition-all cursor-pointer"
        >
          Done
        </button>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-xl mx-auto w-full pb-24">
        {/* Device Push Notifications Card */}
        <div className="space-y-2.5">
          <div className="border-b border-theme-divider-light pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
              Delivery Channels
            </h3>
          </div>

          <div className="border border-theme-divider-light rounded-2xl overflow-hidden bg-theme-surface">
            {pushContext.isSupported ? (
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-theme-primary block">
                      Push Notifications
                    </span>
                    <p className="text-[11px] text-theme-tertiary mt-0.5 leading-relaxed">
                      {pushContext.browserPermission === 'denied'
                        ? 'Blocked by browser permissions. Open site settings to allow.'
                        : pushContext.hasActivePushToken
                        ? 'Active — alerts deliver even when Lalao is in the background'
                        : 'Receive real-time alerts on this browser or mobile device'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {pushContext.browserPermission === 'denied' ? (
                    <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-full">
                      Blocked
                    </span>
                  ) : pushContext.hasActivePushToken ? (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Enabled
                    </span>
                  ) : (
                    <button
                      type="button"
                      id="btn-enable-push-notifications"
                      onClick={() => pushContext.enableNotifications()}
                      disabled={pushContext.status === 'loading'}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#5E43F3] text-white text-xs font-bold hover:bg-[#4E34E0] active:scale-95 transition-all cursor-pointer disabled:opacity-60 shadow-xs"
                    >
                      {pushContext.status === 'loading' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : null}
                      Turn On
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-theme-tertiary">
                Push notifications are not supported by this browser.
              </div>
            )}
          </div>
        </div>

        {/* Activity Categories */}
        <div className="space-y-2.5">
          <div className="border-b border-theme-divider-light pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
              Activity & Social Alerts
            </h3>
            <p className="text-[11px] text-theme-tertiary mt-0.5">
              Select which notifications you want to receive across your account
            </p>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-theme-divider-light rounded-2xl overflow-hidden bg-theme-surface shadow-2xs">
            {categories.map(({ key, label, desc, Icon }) => {
              const isEnabled = notifPrefs[key] !== false;
              return (
                <div key={key} className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-theme-surface-active text-theme-secondary flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-theme-primary block truncate">
                        {label}
                      </span>
                      <p className="text-[11px] text-theme-tertiary mt-0.5 leading-tight">
                        {desc}
                      </p>
                    </div>
                  </div>

                  <button
                    id={`toggle-notif-${key}`}
                    type="button"
                    onClick={() => onTogglePref(key, !isEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                      isEnabled ? 'bg-[#5E43F3]' : 'bg-theme-divider-strong'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 shadow-xs ${
                        isEnabled ? 'right-0.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Informational note */}
        <div className="p-4 rounded-2xl bg-theme-base border border-theme-divider-light text-[11px] text-theme-tertiary leading-relaxed">
          Notification preferences save automatically. Lalao keeps unread in-app alerts available in your Notifications bell tab.
        </div>
      </div>
    </div>
  );
};
