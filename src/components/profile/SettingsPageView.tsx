import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  User,
  SlidersHorizontal,
  Bell,
  Compass,
  Palette,
  ShieldCheck,
  Lock,
  BadgeCheck,
  FileCheck,
  ShieldAlert,
  LogOut,
  ChevronRight,
  Megaphone,
  Download,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { VerificationBadge } from '../common/VerificationBadge';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useTheme } from '../../context/ThemeContext';
import { usePWA } from '../../hooks/usePWA';

// Components & Subpages
import { SettingsRow } from './SettingsRow';
import { ProfileDetailsSubpage } from './ProfileDetailsSubpage';
import { FeedDiscoverySubpage } from './FeedDiscoverySubpage';
import { NotificationSettingsView } from './NotificationSettingsView';
import { CommunityRadiusSubpage } from './CommunityRadiusSubpage';
import { AppearanceSubpage } from './AppearanceSubpage';
import { PrivacySafetySubpage } from './PrivacySafetySubpage';
import { SecurityAuthSubpage } from './SecurityAuthSubpage';
import { CreatorSubscriptionsSubpage } from './CreatorSubscriptionsSubpage';
import { KycVerificationSubpage } from './KycVerificationSubpage';
import { AccountModeSubpage } from './AccountModeSubpage';
import { TopicsManagementDrawer } from './TopicsManagementDrawer';

export type SettingsActiveView =
  | 'hub'
  | 'profile_details'
  | 'feed_discovery'
  | 'notifications'
  | 'community_radius'
  | 'appearance'
  | 'privacy_safety'
  | 'security_auth'
  | 'creator_subscriptions'
  | 'kyc_verification'
  | 'account_mode';

export const SettingsPageView: React.FC = () => {
  const {
    currentUser,
    isEditProfileOpen,
    setIsEditProfileOpen,
    triggerShareToast,
    radiusKm,
    subscription,
    isCreatorPremiumActive,
    setActiveTab,
  } = useLalao();

  const { theme } = useTheme();
  const { isInstalled, setIsInstallModalOpen } = usePWA();
  const { logout } = useAuth();

  const [activeView, setActiveView] = useState<SettingsActiveView>('hub');
  const [isTopicsDrawerOpen, setIsTopicsDrawerOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // KYC status stored in localStorage
  const [kycStatus, setKycStatus] = useState<
    'not_verified' | 'in_progress' | 'verified' | 'requires_attention'
  >('not_verified');

  useEffect(() => {
    try {
      const savedKyc = localStorage.getItem('lalao_kyc_status');
      if (savedKyc) setKycStatus(JSON.parse(savedKyc));
    } catch {}
  }, []);

  const handleUpdateKycStatus = (
    newStatus: 'not_verified' | 'in_progress' | 'verified' | 'requires_attention'
  ) => {
    setKycStatus(newStatus);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lalao_kyc_status', JSON.stringify(newStatus));
    }
  };

  // Notification preferences state synced with backend
  const updateNotificationPrefs = useMutation(api.users.updateNotificationPrefs);
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    messages: true,
    cycles: true,
    likes: true,
    comments: true,
    follows: true,
    mentions: true,
    desktop: true,
  });

  useEffect(() => {
    const saved = (currentUser as any)?.notificationPrefs;
    if (saved) {
      setNotifPrefs((prev) => ({ ...prev, ...saved }));
    }
  }, [currentUser]);

  const handleNotifToggle = useCallback(
    async (key: string, value: boolean) => {
      const next = { ...notifPrefs, [key]: value };
      setNotifPrefs(next);
      try {
        await updateNotificationPrefs({ prefs: next as any });
      } catch (err) {
        console.error('[Settings] Failed to save notification prefs:', err);
      }
    },
    [notifPrefs, updateNotificationPrefs]
  );

  // Topics and feeds preview metadata
  const userTopicPreferences = useQuery(api.topics.getMyContentPreferences);
  const activeTopicsCount = userTopicPreferences?.interestedSlugs?.length || 0;
  const activeFeedsCount = currentUser?.interests?.length || 0;

  // Admin role check
  const role = useQuery(api.admin.getMyRole);
  const isStaff = role === 'super_admin' || role === 'admin' || role === 'editor';

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditProfileOpen) {
      containerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [isEditProfileOpen]);

  const handleClose = () => {
    setIsEditProfileOpen(false);
    setActiveView('hub');
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setIsEditProfileOpen(false);
      await logout();
      triggerShareToast('Logged out successfully');
    } catch (err: any) {
      triggerShareToast(err.message || 'Failed to log out');
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!isEditProfileOpen) return null;

  const displayHandle = (currentUser?.username || '').replace(/^@+/, '').trim();

  return (
    <div
      id="settings-page-overlay"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        ref={containerRef}
        id="settings-page-screen"
        className="bg-theme-surface w-full sm:max-w-md md:max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 relative z-10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* VIEW ROUTING */}
        {activeView === 'profile_details' ? (
          <ProfileDetailsSubpage
            onBack={() => setActiveView('hub')}
            onSaved={() => setActiveView('hub')}
          />
        ) : activeView === 'feed_discovery' ? (
          <FeedDiscoverySubpage
            onBack={() => setActiveView('hub')}
            onOpenManageTopics={() => setIsTopicsDrawerOpen(true)}
          />
        ) : activeView === 'notifications' ? (
          <NotificationSettingsView
            onBack={() => setActiveView('hub')}
            notifPrefs={notifPrefs}
            onTogglePref={handleNotifToggle}
          />
        ) : activeView === 'community_radius' ? (
          <CommunityRadiusSubpage onBack={() => setActiveView('hub')} />
        ) : activeView === 'appearance' ? (
          <AppearanceSubpage onBack={() => setActiveView('hub')} />
        ) : activeView === 'privacy_safety' ? (
          <PrivacySafetySubpage onBack={() => setActiveView('hub')} />
        ) : activeView === 'security_auth' ? (
          <SecurityAuthSubpage onBack={() => setActiveView('hub')} />
        ) : activeView === 'creator_subscriptions' ? (
          <CreatorSubscriptionsSubpage
            onBack={() => setActiveView('hub')}
            onCloseSettings={handleClose}
          />
        ) : activeView === 'kyc_verification' ? (
          <KycVerificationSubpage
            onBack={() => setActiveView('hub')}
            kycStatus={kycStatus}
            onUpdateKycStatus={handleUpdateKycStatus}
          />
        ) : activeView === 'account_mode' ? (
          <AccountModeSubpage
            onBack={() => setActiveView('hub')}
            role={role}
            onCloseSettings={handleClose}
          />
        ) : (
          /* MAIN SETTINGS HUB VIEW */
          <>
            {/* Sticky Hub Header */}
            <div className="sticky top-0 z-20 bg-theme-surface/95 backdrop-blur-md border-b border-theme-divider-light px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  id="btn-back-settings"
                  type="button"
                  onClick={handleClose}
                  className="p-1.5 -ml-1 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
                  title="Close settings"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="font-bold text-base text-theme-primary">Settings & Profile</h1>
                  <p className="text-[11px] text-theme-tertiary">Select a category to manage</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="px-3.5 py-1.5 rounded-full bg-theme-surface-hover hover:bg-theme-surface-active text-theme-primary text-xs font-bold transition-all cursor-pointer"
              >
                Done
              </button>
            </div>

            {/* Hub Body with User Summary Card & Category Rows */}
            <div className="flex-1 max-w-xl mx-auto w-full p-4 sm:p-6 space-y-6 pb-28 overflow-y-auto">
              {/* Profile Card Preview at top of Hub */}
              <div
                id="hub-profile-summary-card"
                onClick={() => setActiveView('profile_details')}
                className="p-4 rounded-2xl bg-gradient-to-br from-[#5E43F3]/[0.08] via-theme-surface to-theme-surface border border-[#5E43F3]/20 flex items-center justify-between gap-3 cursor-pointer hover:border-[#5E43F3]/50 transition-all group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative shrink-0">
                    <Avatar
                      src={currentUser?.avatar}
                      alt={currentUser?.name || 'User'}
                      size="lg"
                      className="w-13 h-13 ring-2 ring-[#5E43F3]/30"
                    />
                    {subscription.status === 'active' && (
                      <div className="absolute -bottom-1 -right-1">
                        <VerificationBadge tier={subscription.tier} size="xs" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-theme-primary truncate">
                        {currentUser?.name || 'Lalao Member'}
                      </span>
                    </div>
                    <span className="text-xs text-theme-tertiary font-mono block truncate">
                      @{displayHandle || 'username'}
                    </span>
                    <span className="text-[11px] text-[#5E43F3] font-semibold mt-0.5 block">
                      Edit Profile Details & Photo →
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-theme-tertiary group-hover:text-[#5E43F3] group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {/* Category Rows Section 1: Account & Profile */}
              <div className="space-y-2.5">
                <div className="border-b border-theme-divider-light pb-1.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-theme-tertiary">
                    Profile & Identity
                  </h3>
                </div>

                <SettingsRow
                  id="row-settings-profile-details"
                  icon={User}
                  title="Profile Details"
                  description="Photo, display name, handle, public identity, bio & birthday"
                  onClick={() => setActiveView('profile_details')}
                />
              </div>

              {/* Category Rows Section 2: Discovery & Preferences */}
              <div className="space-y-2.5">
                <div className="border-b border-theme-divider-light pb-1.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-theme-tertiary">
                    Content & Exploration
                  </h3>
                </div>

                <SettingsRow
                  id="row-settings-feed-discovery"
                  icon={SlidersHorizontal}
                  title="Feed & Content Discovery"
                  description="Feed category tabs and personalized story topics"
                  statusText={
                    activeTopicsCount > 0 ? `${activeTopicsCount} topics active` : undefined
                  }
                  badge={
                    activeFeedsCount > 0 ? (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#5E43F3]/10 text-[#5E43F3]">
                        {activeFeedsCount} feeds
                      </span>
                    ) : undefined
                  }
                  onClick={() => setActiveView('feed_discovery')}
                />

                <SettingsRow
                  id="row-settings-community-radius"
                  icon={Compass}
                  title="Community Radius & Discovery"
                  description="Filter stories and rallies by distance from you"
                  statusText={`${radiusKm} km`}
                  badge={
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#5E43F3]/10 text-[#5E43F3]">
                      {radiusKm} km
                    </span>
                  }
                  onClick={() => setActiveView('community_radius')}
                />

                <SettingsRow
                  id="row-settings-notifications"
                  icon={Bell}
                  title="Notifications"
                  description="Messages, comments, reactions, new followers & push alerts"
                  onClick={() => setActiveView('notifications')}
                />

                <SettingsRow
                  id="row-settings-appearance"
                  icon={Palette}
                  title="Appearance"
                  description="Theme display mode (Light, Dark, or Automatic)"
                  statusText={
                    theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'Automatic'
                  }
                  badge={
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-theme-base border border-theme-divider capitalize text-theme-secondary">
                      {theme}
                    </span>
                  }
                  onClick={() => setActiveView('appearance')}
                />
              </div>

              {/* Category Rows Section 3: Privacy, Safety & Security */}
              <div className="space-y-2.5">
                <div className="border-b border-theme-divider-light pb-1.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-theme-tertiary">
                    Privacy & Security
                  </h3>
                </div>

                <SettingsRow
                  id="row-settings-privacy-safety"
                  icon={ShieldCheck}
                  title="Privacy & Community Safety"
                  description="Profile visibility, active story indicator & location privacy"
                  onClick={() => setActiveView('privacy_safety')}
                />

                <SettingsRow
                  id="row-settings-security-auth"
                  icon={Lock}
                  title="Security & Authentication"
                  description="Registered phone number & session protection"
                  statusText={
                    currentUser.phone || currentUser.phoneNumber ? 'Phone Linked' : 'Add Phone'
                  }
                  onClick={() => setActiveView('security_auth')}
                />
              </div>

              {/* Category Rows Section 4: Monetization & Verification */}
              <div className="space-y-2.5">
                <div className="border-b border-theme-divider-light pb-1.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-theme-tertiary">
                    Creator & Verification
                  </h3>
                </div>

                <SettingsRow
                  id="row-settings-ads-manager"
                  icon={Megaphone}
                  title="Lalao Ads Manager"
                  description="Promote posts, create image/video ads & track campaign performance"
                  badge={
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#5E43F3]/10 text-[#5E43F3]">
                      Self-Service
                    </span>
                  }
                  onClick={() => {
                    handleClose();
                    setActiveTab('ads');
                  }}
                />

                <SettingsRow
                  id="row-settings-creator-subscriptions"
                  icon={BadgeCheck}
                  title="Verification & Creator Subscriptions"
                  description="Verified badge, Creator Hub monetization & audience analytics"
                  statusText={
                    subscription.status === 'active'
                      ? subscription.tier === 'creator' || subscription.tier === 'creator_premium'
                        ? 'Creator'
                        : 'Verified'
                      : 'Standard'
                  }
                  badge={
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        subscription.status === 'active'
                          ? 'bg-[#5E43F3]/10 text-[#5E43F3]'
                          : 'bg-theme-base text-theme-tertiary'
                      }`}
                    >
                      {subscription.status === 'active' ? 'Active' : 'Get Verified'}
                    </span>
                  }
                  onClick={() => setActiveView('creator_subscriptions')}
                />

                <SettingsRow
                  id="row-settings-kyc-verification"
                  icon={FileCheck}
                  title="KYC / Verification"
                  description="Government ID & official identity verification review"
                  statusText={
                    kycStatus === 'verified'
                      ? 'Verified'
                      : kycStatus === 'in_progress'
                      ? 'In Review'
                      : 'Pending'
                  }
                  badge={
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        kycStatus === 'verified'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : kycStatus === 'in_progress'
                          ? 'bg-amber-500/10 text-amber-600'
                          : 'bg-theme-base text-theme-tertiary'
                      }`}
                    >
                      {kycStatus === 'verified'
                        ? 'Verified'
                        : kycStatus === 'in_progress'
                        ? 'In Review'
                        : 'Unverified'}
                    </span>
                  }
                  onClick={() => setActiveView('kyc_verification')}
                />

                {/* Account Mode (Admin / Staff Only) */}
                {isStaff && (
                  <SettingsRow
                    id="row-settings-account-mode"
                    icon={ShieldAlert}
                    title="Account Mode & Admin"
                    description="Switch to administrative dashboard and platform management"
                    badge={
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-theme-inverse text-theme-text-inverse uppercase">
                        {role}
                      </span>
                    }
                    onClick={() => setActiveView('account_mode')}
                  />
                )}
              </div>

              {/* Category Rows Section 5: App Preferences & Session */}
              <div className="space-y-2.5">
                <div className="border-b border-theme-divider-light pb-1.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-theme-tertiary">
                    App & Session
                  </h3>
                </div>

                {!isInstalled && (
                  <SettingsRow
                    id="row-settings-download-app"
                    icon={Download}
                    title="Install LALAO"
                    description="Install LALAO on your PC, mobile, or tablet"
                    onClick={() => {
                      handleClose();
                      setIsInstallModalOpen(true);
                    }}
                  />
                )}

                <SettingsRow
                  id="row-settings-logout"
                  icon={LogOut}
                  title="Log Out from Lalao"
                  description="Sign out of your active account session"
                  destructive={true}
                  onClick={handleLogout}
                />
              </div>

              {/* Platform Info Footer */}
              <div className="p-4 rounded-2xl bg-theme-base border border-theme-divider-light text-center space-y-1">
                <p className="text-xs font-bold text-theme-primary">Lalao Community Platform</p>
                <p className="text-[11px] text-theme-tertiary">
                  Version 2.4.0 (Warri & Delta State Edition)
                </p>
                <p className="text-[10px] text-theme-tertiary pt-0.5">
                  Hyperlocal social connectivity · Real-time local stories & rallies
                </p>
              </div>
            </div>
          </>
        )}

        {/* Global Topics Management Drawer (accessible from Feed Discovery subpage or direct) */}
        <TopicsManagementDrawer
          isOpen={isTopicsDrawerOpen}
          onClose={() => setIsTopicsDrawerOpen(false)}
        />
      </div>
    </div>
  );
};
