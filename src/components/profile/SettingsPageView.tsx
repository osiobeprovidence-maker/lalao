import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Camera,
  Check,
  MapPin,
  Bell,
  Shield,
  Sparkles,
  Briefcase,
  BadgeCheck,
  ChevronRight,
  LogOut,
  Upload,
  Download,
  Calendar,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { VerificationBadge } from '../common/VerificationBadge';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useNavigate } from 'react-router-dom';
import { uploadImageToCloudinary } from '../../lib/cloudinary';
import { useTheme } from '../../context/ThemeContext';
import { ChangePhoneModal } from './ChangePhoneModal';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { usePWA } from '../../hooks/usePWA';
import { TopicsManagementDrawer } from './TopicsManagementDrawer';
import { NotificationSettingsView } from './NotificationSettingsView';

// Dedicated Feed categories supported as standalone browseable tabs
const AVAILABLE_FEEDS = [
  { id: 'anime', label: 'Anime' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'stem', label: 'STEM' },
  { id: 'drama', label: 'Drama' },
];

export const SettingsPageView: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    isEditProfileOpen,
    setIsEditProfileOpen,
    triggerShareToast,
    radiusKm,
    setRadiusKm,
    updateUserProfile,
    openCreatorSubscription,
    openCreatorHub,
    subscription,
    isCreatorPremiumActive,
  } = useLalao();
  
  const { setIsInstallModalOpen } = usePWA();
  
  const generateCloudinarySignatureAction = useAction(api.cloudinary.generateSignature);
  const generateCloudinarySignature = async (folder?: string) => {
    return await generateCloudinarySignatureAction({ folder });
  };
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Active view: 'main' settings or 'notifications' dedicated screen
  const [activeSubView, setActiveSubView] = useState<'main' | 'notifications'>('main');

  // Topics management slide-out drawer
  const [isTopicsDrawerOpen, setIsTopicsDrawerOpen] = useState(false);

  // Profile fields
  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [userLocation, setUserLocation] = useState(currentUser.location || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [publicIdentityType, setPublicIdentityType] = useState<'display_name' | 'username' | 'both'>(
    currentUser.publicIdentityType === 'username' ? 'username' : currentUser.publicIdentityType === 'both' ? 'both' : 'display_name'
  );
  const [dateOfBirth, setDateOfBirth] = useState<string>(currentUser.dateOfBirth || '');
  const [birthDateVisibility, setBirthDateVisibility] = useState<'public' | 'age_only' | 'private'>(
    currentUser.birthDateVisibility || 'private'
  );
  const [kycStatus, setKycStatus] = useState<'not_verified' | 'in_progress' | 'verified' | 'requires_attention'>('not_verified');

  // Feed categories selection (currentUser.interests)
  const updateInterestsMutation = useMutation(api.users.updateInterests);
  const [selectedFeeds, setSelectedFeeds] = useState<string[]>(currentUser?.interests || []);

  // Topics query for quick preview count in Settings
  const userTopicPreferences = useQuery(api.topics.getMyContentPreferences);
  const activeTopicsCount = userTopicPreferences?.interestedSlugs?.length || 0;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();
  const role = useQuery(api.admin.getMyRole);
  const generateConvexUploadUrl = useMutation(api.social.generateUploadUrl);
  const createAdminSession = useMutation(api.admin.createAdminSession);
  const [isCreatingAdminSession, setIsCreatingAdminSession] = useState(false);
  const { theme, setTheme } = useTheme();
  
  const [isChangePhoneOpen, setIsChangePhoneOpen] = useState(false);
  const pushContext = usePushNotifications();

  useEffect(() => {
    setName(currentUser.name);
    // Remove leading @ if stored in legacy records
    setUsername((currentUser.username || '').replace(/^@+/, ''));
    setBio(currentUser.bio || '');
    setUserLocation(currentUser.location || '');
    setPublicIdentityType(
      currentUser.publicIdentityType === 'username' 
        ? 'username' 
        : currentUser.publicIdentityType === 'both' 
        ? 'both' 
        : 'display_name'
    );
    setDateOfBirth(currentUser.dateOfBirth || '');
    setBirthDateVisibility(currentUser.birthDateVisibility || 'private');
    setSelectedFeeds(currentUser?.interests || []);
  }, [currentUser]);

  const handleSwitchToAdmin = async () => {
    try {
      setIsCreatingAdminSession(true);
      const token = await createAdminSession({});
      sessionStorage.setItem('lalao_admin_token', token);
      navigate('/admin');
    } catch (e: any) {
      triggerShareToast(e.message || 'Failed to switch to Admin');
      setIsCreatingAdminSession(false);
    }
  };

  useEffect(() => {
    if (isEditProfileOpen) {
      containerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [isEditProfileOpen]);

  // Notification preferences (synced with backend)
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

  // Sync notification prefs from backend
  useEffect(() => {
    const saved = (currentUser as any)?.notificationPrefs;
    if (saved) {
      setNotifPrefs((prev) => ({ ...prev, ...saved }));
    }
  }, [currentUser]);

  const handleNotifToggle = useCallback(async (key: string, value: boolean) => {
    const next = { ...notifPrefs, [key]: value };
    setNotifPrefs(next);
    try {
      await updateNotificationPrefs({ prefs: next as any });
    } catch (err) {
      console.error('[Settings] Failed to save notification prefs:', err);
    }
  }, [notifPrefs, updateNotificationPrefs]);

  // Preference switches (non-notification)
  const [publicVisibility, setPublicVisibility] = useState(true);
  const [showActiveStatus, setShowActiveStatus] = useState(true);

  const handleClose = () => {
    setIsEditProfileOpen(false);
    setActiveSubView('main');
  };

  // Toggle Feed Category selection
  const handleToggleFeed = async (feedId: string) => {
    const exists = selectedFeeds.includes(feedId);
    const updated = exists
      ? selectedFeeds.filter((id) => id !== feedId)
      : [...selectedFeeds, feedId];
    setSelectedFeeds(updated);
    try {
      await updateInterestsMutation({ interests: updated });
      setCurrentUser((prev) => ({ ...prev, interests: updated }));
    } catch (err) {
      console.error('[Settings] Failed to update feeds:', err);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      let finalAvatarUrl = avatar;
      let finalStorageId: any = undefined;

      if (avatarFile) {
        try {
          if (typeof generateCloudinarySignature !== 'function') {
            console.error('generateCloudinarySignature is undefined from Context. Is it properly exported?');
            throw new Error('generateCloudinarySignature is not a function');
          }
          const sig = await generateCloudinarySignature('avatars');
          finalAvatarUrl = await uploadImageToCloudinary(avatarFile, sig);
        } catch (uploadErr) {
          console.warn('Cloudinary upload fallback triggered due to error:', uploadErr);
          
          // CONVEX FALLBACK
          if (typeof generateConvexUploadUrl !== 'function') {
            throw new Error('generateConvexUploadUrl is not a function');
          }
          const uploadUrl = await generateConvexUploadUrl();
          const result = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": avatarFile.type },
            body: avatarFile,
          });
          if (!result.ok) throw new Error("Convex storage upload failed");
          
          const { storageId } = await result.json();
          finalStorageId = storageId;
          finalAvatarUrl = undefined; // Don't use the local blob URL; rely on backend resolution
        }
      }

      // Clean username of any accidental @ prefix
      const cleanUsername = username.replace(/^@+/, '').trim();

      await updateUserProfile({
        name: name.trim() || undefined,
        username: cleanUsername || undefined,
        bio: bio.trim(),
        locationName: userLocation.trim(),
        avatarUrl: finalAvatarUrl,
        avatarStorageId: finalStorageId,
        publicIdentityType,
        dateOfBirth: dateOfBirth ? dateOfBirth : undefined,
        birthDateVisibility,
      } as any);

      // Save feeds
      await updateInterestsMutation({ interests: selectedFeeds });

      if (typeof window !== 'undefined') {
        localStorage.setItem('lalao_kyc_status', JSON.stringify(kycStatus));
      }
      setIsEditProfileOpen(false);
      triggerShareToast('Settings & profile saved successfully!');
    } catch (err: any) {
      triggerShareToast(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    try {
      const savedKyc = localStorage.getItem('lalao_kyc_status');
      if (savedKyc) setKycStatus(JSON.parse(savedKyc));
    } catch {}
  }, []);

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      triggerShareToast('Please choose a valid image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      triggerShareToast('Please upload an image under 5MB.');
      return;
    }

    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatar(objectUrl);
    triggerShareToast('Profile photo selected.');
  };

  const neighborhoodOptions = [
    'Udu, Delta State',
    'Enerhen Junction, Warri',
    'Effurun Roundabout, Delta State',
    'GRA Warri',
    'Airport Road, Warri',
    'PTI Road, Effurun',
    'Deco Road, Warri',
  ];

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

  // Clean username for display and previews without @ prefix
  const displayUsernameClean = (username || '').replace(/^@+/, '').trim() || 'username';

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
        {/* Sub-view: Dedicated Notification Settings Page */}
        {activeSubView === 'notifications' ? (
          <NotificationSettingsView
            onBack={() => setActiveSubView('main')}
            notifPrefs={notifPrefs}
            onTogglePref={handleNotifToggle}
          />
        ) : (
          /* Main Settings Page View */
          <>
            {/* Top Sticky Header */}
            <div className="sticky top-0 z-20 bg-theme-surface/95 backdrop-blur-md border-b border-theme-divider-light px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  id="btn-back-settings"
                  type="button"
                  onClick={handleClose}
                  className="p-1.5 -ml-1 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
                  title="Go back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="font-bold text-base text-theme-primary">Settings & Profile</h1>
                  <p className="text-[11px] text-theme-tertiary">Manage your account & preferences</p>
                </div>
              </div>

              <button
                id="btn-save-settings"
                type="button"
                disabled={isSaving}
                onClick={() => handleSave()}
                className="px-4 py-2 rounded-full bg-[#5E43F3] text-white text-xs font-bold hover:bg-[#4E34E0] transition-all shadow-md shadow-[#5E43F3]/25 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>

            {/* Settings Form Body */}
            <div className="flex-1 max-w-xl mx-auto w-full p-4 sm:p-6 space-y-7 pb-28 overflow-y-auto">
              {/* 1. Profile Identity Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-theme-divider-light pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
                    Profile Details
                  </h3>
                  <span className="text-[11px] text-theme-tertiary font-medium">Public Information</span>
                </div>

                {/* Avatar uploader */}
                <div className="flex flex-col items-center gap-3 py-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative group cursor-pointer"
                  >
                    <Avatar
                      src={avatar}
                      alt={name || 'User'}
                      size="xl"
                      className="w-20 h-20 ring-4 ring-[#5E43F3]/20 shadow-md"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6" />
                    </div>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-full border border-theme-divider-light text-theme-secondary hover:text-theme-primary text-xs font-semibold hover:bg-theme-surface-hover transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {avatar ? 'Change photo' : 'Add profile photo'}
                  </button>
                </div>

                {/* Display Name & Handle (Handle without @ symbol input) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-theme-secondary mb-1.5 block">
                      Display Name
                    </label>
                    <input
                      id="input-settings-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ride Rezzy"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-theme-divider text-xs font-semibold text-theme-primary focus:border-[#5E43F3] focus:ring-1 focus:ring-[#5E43F3] outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-theme-secondary mb-1.5 block">
                      Username
                    </label>
                    <div className="flex items-center px-3.5 py-2.5 rounded-xl border border-theme-divider text-xs font-semibold text-theme-primary focus-within:border-[#5E43F3] focus-within:ring-1 focus-within:ring-[#5E43F3] transition-all bg-theme-surface">
                      <input
                        id="input-settings-username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.replace(/^@+/, '').toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        placeholder="e.g. RideRezzy"
                        className="w-full outline-none text-xs bg-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Public Identity Display Preference (Displays without @ prefix) */}
                <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider-light shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <label className="text-xs font-bold text-theme-primary block">
                        Public Identity Display
                      </label>
                      <p className="text-[11px] text-theme-tertiary mt-0.5">
                        Choose the primary label shown across Lalao posts and discovery.
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#5E43F3]/10 text-[#5E43F3] border border-[#5E43F3]/20">
                      Clean Display
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    {/* Option A: Display Name */}
                    <label
                      className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                        publicIdentityType === 'display_name'
                          ? 'border-[#5E43F3] bg-[#5E43F3]/5 dark:bg-[#5E43F3]/10 text-theme-primary'
                          : 'border-theme-divider bg-theme-base/50 text-theme-secondary hover:border-theme-divider-strong'
                      }`}
                    >
                      <input
                        id="radio-identity-display-name"
                        type="radio"
                        name="publicIdentityType"
                        value="display_name"
                        checked={publicIdentityType === 'display_name'}
                        onChange={() => setPublicIdentityType('display_name')}
                        className="mt-0.5 h-4 w-4 text-[#5E43F3] focus:ring-[#5E43F3] cursor-pointer accent-[#5E43F3]"
                      />
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-theme-primary">
                          Display Name
                        </span>
                        <span className="block text-[11px] text-theme-tertiary mt-0.5 truncate">
                          {name.trim() || 'Your Name'}
                        </span>
                        <span className="block text-[10px] text-theme-tertiary opacity-80 mt-1">
                          Display name only.
                        </span>
                      </div>
                    </label>

                    {/* Option B: Username (without @ sign) */}
                    <label
                      className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                        publicIdentityType === 'username'
                          ? 'border-[#5E43F3] bg-[#5E43F3]/5 dark:bg-[#5E43F3]/10 text-theme-primary'
                          : 'border-theme-divider bg-theme-base/50 text-theme-secondary hover:border-theme-divider-strong'
                      }`}
                    >
                      <input
                        id="radio-identity-username"
                        type="radio"
                        name="publicIdentityType"
                        value="username"
                        checked={publicIdentityType === 'username'}
                        onChange={() => setPublicIdentityType('username')}
                        className="mt-0.5 h-4 w-4 text-[#5E43F3] focus:ring-[#5E43F3] cursor-pointer accent-[#5E43F3]"
                      />
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-theme-primary">
                          Username
                        </span>
                        <span className="block text-[11px] text-theme-tertiary mt-0.5 truncate">
                          {displayUsernameClean}
                        </span>
                        <span className="block text-[10px] text-theme-tertiary opacity-80 mt-1">
                          Username only.
                        </span>
                      </div>
                    </label>

                    {/* Option C: Both */}
                    <label
                      className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                        publicIdentityType === 'both'
                          ? 'border-[#5E43F3] bg-[#5E43F3]/5 dark:bg-[#5E43F3]/10 text-theme-primary'
                          : 'border-theme-divider bg-theme-base/50 text-theme-secondary hover:border-theme-divider-strong'
                      }`}
                    >
                      <input
                        id="radio-identity-both"
                        type="radio"
                        name="publicIdentityType"
                        value="both"
                        checked={publicIdentityType === 'both'}
                        onChange={() => setPublicIdentityType('both')}
                        className="mt-0.5 h-4 w-4 text-[#5E43F3] focus:ring-[#5E43F3] cursor-pointer accent-[#5E43F3]"
                      />
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-theme-primary">
                          Both
                        </span>
                        <span className="block text-[11px] text-theme-tertiary mt-0.5 truncate">
                          {name.trim() || 'Your Name'}
                        </span>
                        <span className="block text-[10px] text-theme-tertiary opacity-80 mt-1">
                          Name + username.
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Live Preview of Public Identity */}
                  <div className="mt-2 pt-2.5 border-t border-theme-divider-light flex items-center justify-between text-[11px]">
                    <span className="text-theme-tertiary font-medium">Header preview:</span>
                    <div className="inline-flex flex-col items-start px-2.5 py-1 rounded-xl bg-theme-base border border-theme-divider">
                      <span className="font-bold text-theme-primary">
                        {publicIdentityType === 'username'
                          ? displayUsernameClean
                          : (name.trim() || 'Your Name')}
                      </span>
                      {publicIdentityType === 'both' && (
                        <span className="text-[10px] text-theme-tertiary">
                          {displayUsernameClean}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-theme-secondary block">Bio</label>
                    <span className="text-[10px] text-theme-tertiary font-mono">{bio.length}/180</span>
                  </div>
                  <textarea
                    id="input-settings-bio"
                    rows={3}
                    maxLength={180}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Share a short bio about what you do in Warri..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-theme-divider text-xs text-theme-primary focus:border-[#5E43F3] focus:ring-1 focus:ring-[#5E43F3] outline-none resize-none leading-relaxed transition-all"
                  />
                </div>

                {/* Home Location */}
                <div>
                  <label className="text-xs font-bold text-theme-secondary mb-1.5 block">
                    Home Neighborhood / Area
                  </label>
                  <div className="flex items-center px-3.5 py-2.5 rounded-xl border border-theme-divider text-xs text-theme-primary focus-within:border-[#5E43F3] focus-within:ring-1 focus-within:ring-[#5E43F3] transition-all bg-theme-surface">
                    <MapPin className="w-3.5 h-3.5 text-[#5E43F3] mr-1.5 shrink-0" />
                    <input
                      id="input-settings-location"
                      type="text"
                      value={userLocation}
                      onChange={(e) => setUserLocation(e.target.value)}
                      placeholder="e.g. Udu, Delta State"
                      className="w-full outline-none text-xs bg-transparent"
                    />
                  </div>
                  {/* Quick chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {neighborhoodOptions.map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setUserLocation(loc)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                          userLocation === loc
                            ? 'bg-theme-inverse text-theme-text-inverse'
                            : 'bg-theme-surface-hover text-theme-secondary hover:bg-theme-surface-active'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date of Birth & Visibility */}
                <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider-light shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <label className="text-xs font-bold text-theme-primary flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#5E43F3]" />
                        <span>Date of Birth</span>
                      </label>
                      <p className="text-[11px] text-theme-tertiary mt-0.5">
                        Set your birthday and decide whether it is visible on your profile.
                      </p>
                    </div>
                    {dateOfBirth && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#5E43F3]/10 text-[#5E43F3] border border-[#5E43F3]/20">
                        {(() => {
                          try {
                            const birth = new Date(dateOfBirth);
                            const now = new Date();
                            let age = now.getFullYear() - birth.getFullYear();
                            const m = now.getMonth() - birth.getMonth();
                            if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
                            return !isNaN(age) && age >= 0 ? `${age} years old` : 'Valid date';
                          } catch {
                            return 'Set';
                          }
                        })()}
                      </span>
                    )}
                  </div>

                  <div className="pt-1">
                    <input
                      id="input-settings-date-of-birth"
                      type="date"
                      value={dateOfBirth}
                      max={new Date().toISOString().split('T')[0]}
                      min="1920-01-01"
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-theme-divider text-xs font-semibold text-theme-primary focus:border-[#5E43F3] focus:ring-1 focus:ring-[#5E43F3] outline-none transition-all bg-theme-surface"
                    />
                  </div>

                  {/* Visibility options: Public, Age Only, Private */}
                  <div className="pt-2 border-t border-theme-divider-light">
                    <label className="text-[11px] font-bold text-theme-secondary mb-1.5 block">
                      Birthday Privacy on Profile
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        id="btn-dob-visibility-private"
                        onClick={() => setBirthDateVisibility('private')}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          birthDateVisibility === 'private'
                            ? 'border-[#5E43F3] bg-[#5E43F3]/5 dark:bg-[#5E43F3]/10 text-theme-primary font-bold'
                            : 'border-theme-divider bg-theme-base/50 text-theme-secondary hover:border-theme-divider-strong font-medium'
                        }`}
                      >
                        <div className="text-[11px] leading-tight">Private</div>
                        <div className="text-[9px] text-theme-tertiary mt-0.5">Hidden</div>
                      </button>

                      <button
                        type="button"
                        id="btn-dob-visibility-age-only"
                        onClick={() => setBirthDateVisibility('age_only')}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          birthDateVisibility === 'age_only'
                            ? 'border-[#5E43F3] bg-[#5E43F3]/5 dark:bg-[#5E43F3]/10 text-theme-primary font-bold'
                            : 'border-theme-divider bg-theme-base/50 text-theme-secondary hover:border-theme-divider-strong font-medium'
                        }`}
                      >
                        <div className="text-[11px] leading-tight">Age Only</div>
                        <div className="text-[9px] text-theme-tertiary mt-0.5">e.g. 25 yrs</div>
                      </button>

                      <button
                        type="button"
                        id="btn-dob-visibility-public"
                        onClick={() => setBirthDateVisibility('public')}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          birthDateVisibility === 'public'
                            ? 'border-[#5E43F3] bg-[#5E43F3]/5 dark:bg-[#5E43F3]/10 text-theme-primary font-bold'
                            : 'border-theme-divider bg-theme-base/50 text-theme-secondary hover:border-theme-divider-strong font-medium'
                        }`}
                      >
                        <div className="text-[11px] leading-tight">Public</div>
                        <div className="text-[9px] text-theme-tertiary mt-0.5">Month & Day</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Feeds & Topics Separation (Requirement 3 & 4) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-theme-divider-light pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
                    Feeds & Content Discovery
                  </h3>
                  <span className="text-[11px] text-[#5E43F3] font-bold">Personalized</span>
                </div>

                {/* A. Feed Categories (Main Content Tabs) */}
                <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider-light space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-theme-primary block">
                        Feed Categories
                      </span>
                      <p className="text-[11px] text-theme-tertiary mt-0.5">
                        Choose the primary category tabs you want to browse on your Home feed.
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#5E43F3]/10 text-[#5E43F3]">
                      {selectedFeeds.length} active
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {AVAILABLE_FEEDS.map(({ id, label }) => {
                      const isSelected = selectedFeeds.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => handleToggleFeed(id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 select-none ${
                            isSelected
                              ? 'bg-[#5E43F3] text-white shadow-xs'
                              : 'bg-theme-base text-theme-secondary border border-theme-divider hover:bg-theme-surface-hover'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* B. Topics Personalization (Drawer trigger) */}
                <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider-light flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center shrink-0">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-theme-primary">
                          Topics Personalization
                        </span>
                        {activeTopicsCount > 0 && (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            {activeTopicsCount} selected
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-theme-tertiary mt-0.5 leading-tight truncate">
                        Personalize stories inside your feeds without changing your tabs.
                      </p>
                    </div>
                  </div>

                  <button
                    id="btn-manage-topics-drawer"
                    type="button"
                    onClick={() => setIsTopicsDrawerOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white text-xs font-bold shrink-0 shadow-xs cursor-pointer flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <span>Manage Topics</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 3. Dedicated Notification Navigation Entry (Requirement 5) */}
              <div className="space-y-3">
                <div className="border-b border-theme-divider-light pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
                    Notifications
                  </h3>
                </div>

                <button
                  id="btn-open-notifications-settings"
                  type="button"
                  onClick={() => setActiveSubView('notifications')}
                  className="w-full rounded-2xl border border-theme-divider bg-theme-surface p-4 flex items-center justify-between hover:bg-theme-base cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="text-left flex flex-col">
                      <span className="text-xs font-bold text-theme-primary">
                        Notification Preferences
                      </span>
                      <span className="text-[11px] text-theme-tertiary">
                        Messages, comments, reactions, new followers & push alerts
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-theme-tertiary shrink-0" />
                </button>
              </div>

              {/* 4. Community Discovery Radius Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-theme-divider-light pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
                    Community Radius & Discovery
                  </h3>
                  <span className="text-[11px] text-[#5E43F3] font-bold">{radiusKm} km active</span>
                </div>

                <div className="p-4 rounded-2xl bg-theme-base border border-theme-divider-light space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-theme-primary">Discovery Radius</span>
                      <p className="text-[11px] text-theme-tertiary">Filter posts and rallies by distance from you</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] text-xs font-extrabold">
                      {radiusKm} km
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {[2, 5, 10, 25, 50].map((km) => (
                      <button
                        key={km}
                        type="button"
                        onClick={() => setRadiusKm(km)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          radiusKm === km
                            ? 'bg-[#5E43F3] text-white shadow-xs'
                            : 'bg-theme-surface text-theme-secondary border border-theme-divider hover:bg-theme-surface-hover'
                        }`}
                      >
                        {km}km
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5. Appearance / Theme */}
              <div className="space-y-3">
                <div className="border-b border-theme-divider-light pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
                    Appearance
                  </h3>
                  <p className="text-[11px] text-theme-tertiary mt-1">
                    Customize how Lalao looks on your device.
                  </p>
                </div>

                <div className="flex bg-theme-surface border border-theme-divider-light rounded-2xl p-1 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${
                      theme === 'light' ? 'bg-[#5E43F3] text-white shadow-md' : 'text-theme-secondary hover:bg-theme-surface-hover'
                    }`}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${
                      theme === 'dark' ? 'bg-[#5E43F3] text-white shadow-md' : 'text-theme-secondary hover:bg-theme-surface-hover'
                    }`}
                  >
                    Dark
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${
                      theme === 'system' ? 'bg-[#5E43F3] text-white shadow-md' : 'text-theme-secondary hover:bg-theme-surface-hover'
                    }`}
                  >
                    Automatic
                  </button>
                </div>
              </div>

              {/* 6. Privacy & Safety */}
              <div className="space-y-3">
                <div className="border-b border-theme-divider-light pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
                    Privacy & Community Safety
                  </h3>
                </div>

                <div className="divide-y divide-neutral-100 border border-theme-divider-light rounded-2xl overflow-hidden bg-theme-surface">
                  <div className="p-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-theme-primary">Public Community Profile</span>
                      <p className="text-[11px] text-theme-tertiary">Allow local members to view your posts</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPublicVisibility(!publicVisibility)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        publicVisibility ? 'bg-[#5E43F3]' : 'bg-theme-divider-strong'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-theme-surface transition-transform absolute top-0.5 ${
                          publicVisibility ? 'right-0.5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-theme-primary">Active Story Indicator</span>
                      <p className="text-[11px] text-theme-tertiary">Show colorful ring when 24h cycle is active</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowActiveStatus(!showActiveStatus)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        showActiveStatus ? 'bg-[#5E43F3]' : 'bg-theme-divider-strong'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-theme-surface transition-transform absolute top-0.5 ${
                          showActiveStatus ? 'right-0.5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* 7. Security & Phone Number */}
              <div className="space-y-3">
                <div className="border-b border-theme-divider-light pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
                    Security & Authentication
                  </h3>
                </div>

                <div className="rounded-2xl border border-theme-divider bg-theme-base p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-theme-primary">Phone Number</span>
                      <p className="text-[11px] text-theme-tertiary">
                        {currentUser.phone || currentUser.phoneNumber || 'No phone number added'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsChangePhoneOpen(true)}
                      className="text-[11px] font-bold text-[#5E43F3] cursor-pointer"
                    >
                      {currentUser.phone || currentUser.phoneNumber ? 'Edit' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 8. Verification & Creator Subscriptions */}
              <div className="space-y-3">
                <div className="border-b border-theme-divider-light pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
                    Verification & Creator Subscriptions
                  </h3>
                  <p className="text-[11px] text-theme-tertiary mt-1">
                    Unlock official verification seals, priority explore discovery, and Creator Hub monetization tools.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#5E43F3]/20 bg-gradient-to-br from-[#5E43F3]/[0.05] via-theme-surface to-theme-surface p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center shrink-0">
                        <BadgeCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-theme-primary">Current Plan:</span>
                          <span className="text-xs font-extrabold capitalize text-[#5E43F3]">
                            {subscription.status === 'active'
                              ? subscription.tier === 'creator' || subscription.tier === 'creator_premium'
                                ? 'Creator Premium'
                                : subscription.tier === 'priority'
                                ? 'Priority Verified'
                                : 'Standard Verified'
                              : 'Unverified'}
                          </span>
                          <VerificationBadge tier={subscription.tier} size="xs" />
                        </div>
                        <p className="text-[11px] text-theme-tertiary mt-0.5">
                          {subscription.status === 'active'
                            ? subscription.tier === 'creator' || subscription.tier === 'creator_premium'
                              ? 'Full Creator Hub, Monetization, Analytics, & Rankings Active'
                              : subscription.tier === 'priority'
                              ? 'Priority Discovery Weighting & Verified Seal Active'
                              : 'Official Verified Seal Active'
                            : 'Standard account without verification benefits'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`grid gap-2 pt-1 ${isCreatorPremiumActive ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditProfileOpen(false);
                        openCreatorSubscription();
                      }}
                      className="w-full rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] active:scale-[0.99] text-white py-2.5 px-3 text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <BadgeCheck className="w-3.5 h-3.5" />
                      {subscription.status === 'active' ? 'Manage Subscription / View Plan' : 'Get Verified (from ₦800)'}
                    </button>

                    {isCreatorPremiumActive && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditProfileOpen(false);
                          openCreatorHub();
                        }}
                        className="w-full rounded-xl border border-[#5E43F3]/30 bg-[#5E43F3]/5 hover:bg-[#5E43F3]/10 active:scale-[0.99] text-[#5E43F3] py-2.5 px-3 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>Open Creator Hub</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 9. KYC / Verification */}
              <div className="space-y-3">
                <div className="border-b border-theme-divider-light pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
                    KYC / Verification
                  </h3>
                </div>

                <div className="rounded-2xl border border-theme-divider bg-theme-base p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#5E43F3]" />
                      <span className="text-xs font-bold text-theme-primary">Current status</span>
                    </div>
                    <span className="rounded-full bg-theme-inverse px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-theme-text-inverse">
                      {kycStatus === 'verified' ? 'Verified' : kycStatus === 'in_progress' ? 'In progress' : kycStatus === 'requires_attention' ? 'Requires attention' : 'Not verified'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setKycStatus('in_progress')}
                    className="w-full rounded-xl bg-[#5E43F3] px-4 py-3 text-xs font-bold text-white hover:bg-[#4E34E0] cursor-pointer"
                  >
                    {kycStatus === 'not_verified' ? 'Start KYC' : 'Continue KYC'}
                  </button>

                  <p className="text-[11px] text-theme-tertiary">
                    Your identity verification is securely handled. This status updates once verification review is complete.
                  </p>
                </div>
              </div>

              {/* 10. Account Mode (Admin Roles Only) */}
              {(role === 'super_admin' || role === 'admin' || role === 'editor') && (
                <div className="space-y-3">
                  <div className="border-b border-theme-divider-light pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
                      Account Mode
                    </h3>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleSwitchToAdmin}
                    disabled={isCreatingAdminSession}
                    className="w-full rounded-2xl border border-theme-divider bg-theme-surface p-4 flex items-center justify-between hover:bg-theme-base cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-theme-inverse text-theme-text-inverse">
                        {isCreatingAdminSession ? (
                          <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ) : (
                          <Shield className="w-5 h-5" />
                        )}
                      </div>
                      <div className="text-left flex flex-col">
                        <span className="text-sm font-bold text-theme-primary">Go to Admin Panel</span>
                        <span className="text-[11px] text-theme-tertiary line-clamp-1">Manage the Lalao platform</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-theme-tertiary" />
                  </button>
                </div>
              )}

              {/* 11. App Preferences */}
              <div className="space-y-3">
                <div className="border-b border-theme-divider-light pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
                    App & Preferences
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsEditProfileOpen(false);
                    setIsInstallModalOpen(true);
                  }}
                  className="w-full rounded-2xl border border-theme-divider bg-theme-surface p-4 flex items-center justify-between hover:bg-theme-base cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-theme-inverse text-theme-text-inverse">
                      <Download className="w-5 h-5" />
                    </div>
                    <div className="text-left flex flex-col">
                      <span className="text-sm font-bold text-theme-primary">Download App</span>
                      <span className="text-[11px] text-theme-tertiary line-clamp-1">Install the native Lalao app</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-theme-tertiary" />
                </button>
              </div>

              {/* 12. Account Actions */}
              <div className="space-y-3">
                <div className="border-b border-theme-divider-light pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
                    Account Session
                  </h3>
                </div>

                <button
                  id="btn-settings-logout"
                  type="button"
                  disabled={isLoggingOut}
                  onClick={handleLogout}
                  className="w-full p-3.5 rounded-2xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/70 text-rose-600 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4 stroke-[2.2]" />
                  <span>{isLoggingOut ? 'Logging out...' : 'Log Out from Lalao'}</span>
                </button>
              </div>

              {/* App Info */}
              <div className="p-4 rounded-2xl bg-theme-base border border-theme-divider-light text-center space-y-1">
                <p className="text-xs font-bold text-theme-primary">Lalao Community Platform</p>
                <p className="text-[11px] text-theme-tertiary">Version 2.4.0 (Warri & Delta State Edition)</p>
                <p className="text-[10px] text-theme-tertiary pt-1">
                  Hyperlocal social connectivity · Real-time local stories & rallies
                </p>
              </div>

              {/* Bottom Save Action Button */}
              <div className="pt-2">
                <button
                  id="btn-save-settings-bottom"
                  type="button"
                  onClick={() => handleSave()}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#5E43F3] text-white text-sm font-bold hover:bg-[#4E34E0] transition-all shadow-lg shadow-[#5E43F3]/25 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Save Settings & Profile</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Change Phone Modal */}
        {isChangePhoneOpen && (
          <ChangePhoneModal 
            currentPhone={currentUser.phone || currentUser.phoneNumber || undefined}
            onClose={() => setIsChangePhoneOpen(false)}
            onSuccess={(newPhone) => {
              setCurrentUser(prev => ({
                ...prev,
                phone: newPhone,
                phoneNumber: newPhone,
                phoneVerified: true
              }));
              triggerShareToast('Phone number successfully updated');
            }}
          />
        )}

        {/* Topics Management Drawer */}
        <TopicsManagementDrawer
          isOpen={isTopicsDrawerOpen}
          onClose={() => setIsTopicsDrawerOpen(false)}
        />
      </div>
    </div>
  );
};
