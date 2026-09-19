import React from 'react';
import { Bell, BellOff, Loader2, Sparkles, X, Zap } from 'lucide-react';
import { usePushNotifications } from '../../hooks/usePushNotifications';

/**
 * HomePushBanner
 *
 * Subtle, polished notification onboarding component rendered on the Home feed.
 * - Does NOT auto-prompt on render.
 * - Triggers real native browser Notification.requestPermission() strictly on user click.
 * - Disappears when push is active or dismissed.
 * - Displays clear instructions if browser permission is blocked/denied.
 */
export const HomePushBanner: React.FC = () => {
  const {
    isSupported,
    browserPermission,
    hasActivePushToken,
    status,
    isPromptDismissed,
    enableNotifications,
    dismissPrompt,
  } = usePushNotifications();

  // Do NOT render if unsupported, already active, or user explicitly dismissed the prompt
  if (!isSupported || hasActivePushToken || isPromptDismissed) {
    return null;
  }

  // ── Browser permission DENIED state ──────────────────────────────────────────
  if (browserPermission === 'denied' || status === 'denied') {
    return (
      <div
        id="home-push-banner-denied"
        className="mx-4 my-3 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 shadow-xs transition-all animate-in fade-in duration-200"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
              <BellOff className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-amber-950">Notifications are blocked</p>
              <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
                Allow notifications for Lalao in your browser&apos;s site settings to receive updates for local messages &amp; replies.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissPrompt}
            className="p-1 rounded-full text-amber-700/60 hover:text-amber-900 hover:bg-amber-100 transition-colors shrink-0 cursor-pointer"
            title="Dismiss notification warning"
            aria-label="Dismiss notification warning"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Default / Prompt state ───────────────────────────────────────────────────
  return (
    <div
      id="home-push-banner-prompt"
      className="mx-4 my-3 rounded-2xl border border-[#5E43F3]/20 bg-gradient-to-br from-[#5E43F3]/5 via-indigo-50/70 to-purple-50/30 p-4 shadow-xs transition-all animate-in fade-in slide-in-from-top-2 duration-300 relative"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center shrink-0 mt-0.5">
            <Bell className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-[13px] font-bold text-neutral-950 tracking-tight">
                Stay up to date
              </h3>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            </div>
            <p className="text-[11px] text-neutral-600 mt-0.5 leading-relaxed">
              Get notifications for messages, follows, comments, subscriptions, and important Lalao updates.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                id="home-enable-push-btn"
                disabled={status === 'loading'}
                onClick={enableNotifications}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#5E43F3] text-white text-[11.5px] font-bold shadow-xs hover:bg-[#4E34E0] active:scale-95 transition-all cursor-pointer disabled:opacity-60 shrink-0"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Enabling…</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                    <span>Enable notifications</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={dismissPrompt}
          className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/50 transition-colors shrink-0 cursor-pointer"
          title="Dismiss notification prompt"
          aria-label="Dismiss notification prompt"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
