import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Camera,
  Check,
  MapPin,
  Bell,
  Shield,
  Share2,
  Sparkles,
  Users,
  Radio,
  ChevronRight,
  Info,
  LogOut,
  Building2,
  Upload,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useNavigate } from 'react-router-dom';

export const SettingsPageView: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    isEditProfileOpen,
    setIsEditProfileOpen,
    triggerShareToast,
    radiusKm,
    setRadiusKm,
    location,
    setLocation,
    activeTopics,
    updateHomePreference,
  } = useLalao();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [userLocation, setUserLocation] = useState(currentUser.location || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [kycStatus, setKycStatus] = useState<'not_verified' | 'in_progress' | 'verified' | 'requires_attention'>('not_verified');
  const [withdrawalAccount, setWithdrawalAccount] = useState({ bankName: '', accountNumber: '', accountName: '' });
  const [isBankFormOpen, setIsBankFormOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();
  const role = useQuery(api.admin.getMyRole);
  const createAdminSession = useMutation(api.admin.createAdminSession);
  const [isCreatingAdminSession, setIsCreatingAdminSession] = useState(false);

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

  // Preference switches
  const [notifyRallies, setNotifyRallies] = useState(true);
  const [notifyCycles, setNotifyCycles] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [publicVisibility, setPublicVisibility] = useState(true);
  const [showActiveStatus, setShowActiveStatus] = useState(true);

  const handleClose = () => {
    setIsEditProfileOpen(false);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCurrentUser((prev) => ({
      ...prev,
      name: name.trim() || prev.name,
      username: username.trim() || prev.username,
      bio: bio.trim(),
      location: userLocation.trim(),
      avatar,
    }));
    if (typeof window !== 'undefined') {
      localStorage.setItem('lalao_withdrawal_account', JSON.stringify(withdrawalAccount));
      localStorage.setItem('lalao_kyc_status', JSON.stringify(kycStatus));
    }
    setIsEditProfileOpen(false);
    triggerShareToast('Settings & profile saved successfully!');
  };

  useEffect(() => {
    try {
      const savedAccount = localStorage.getItem('lalao_withdrawal_account');
      const savedKyc = localStorage.getItem('lalao_kyc_status');
      if (savedAccount) setWithdrawalAccount(JSON.parse(savedAccount));
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

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setAvatar(result);
      triggerShareToast('Profile photo updated.');
    };
    reader.readAsDataURL(file);
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

  return (
    <div
      id="settings-page-overlay"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        ref={containerRef}
        id="settings-page-screen"
        className="bg-white w-full sm:max-w-md md:max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 relative z-10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Sticky Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-settings"
            type="button"
            onClick={handleClose}
            className="p-1.5 -ml-1 rounded-full text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-base text-neutral-950">Settings & Profile</h1>
            <p className="text-[11px] text-neutral-500">Manage your account & preferences</p>
          </div>
        </div>

        <button
          id="btn-save-settings"
          type="button"
          onClick={() => handleSave()}
          className="px-4 py-2 rounded-full bg-[#5E43F3] text-white text-xs font-bold hover:bg-[#4E34E0] transition-all shadow-md shadow-[#5E43F3]/25 active:scale-95 cursor-pointer"
        >
          Save
        </button>
      </div>

        {/* Settings Form Body */}
        <div className="flex-1 max-w-xl mx-auto w-full p-4 sm:p-6 space-y-7 pb-28 overflow-y-auto">
        {/* 1. Profile Identity Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Profile Details
            </h3>
            <span className="text-[11px] text-neutral-400 font-medium">Public Information</span>
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

            <div className="text-center">
              <span className="text-xs font-bold text-neutral-800">Profile photo</span>
              <p className="text-[11px] text-neutral-500 mt-0.5">Upload your own image from your device</p>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-[11px] font-bold text-neutral-700 hover:bg-neutral-100 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              {avatar ? 'Change photo' : 'Add profile photo'}
            </button>
          </div>

          {/* Display Name & Handle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-neutral-700 mb-1.5 block">
                Display Name
              </label>
              <input
                id="input-settings-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-950 focus:border-[#5E43F3] focus:ring-1 focus:ring-[#5E43F3] outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 mb-1.5 block">
                Username (@handle)
              </label>
              <div className="flex items-center px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-950 focus-within:border-[#5E43F3] focus-within:ring-1 focus-within:ring-[#5E43F3] transition-all bg-white">
                <span className="text-neutral-400 mr-0.5">@</span>
                <input
                  id="input-settings-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full outline-none text-xs bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-neutral-700 block">Bio</label>
              <span className="text-[10px] text-neutral-400 font-mono">{bio.length}/180</span>
            </div>
            <textarea
              id="input-settings-bio"
              rows={3}
              maxLength={180}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share a short bio about what you do in Warri..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs text-neutral-950 focus:border-[#5E43F3] focus:ring-1 focus:ring-[#5E43F3] outline-none resize-none leading-relaxed transition-all"
            />
          </div>

          {/* Home Location */}
          <div>
            <label className="text-xs font-bold text-neutral-700 mb-1.5 block">
              Home Neighborhood / Area
            </label>
            <div className="flex items-center px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs text-neutral-950 focus-within:border-[#5E43F3] focus-within:ring-1 focus-within:ring-[#5E43F3] transition-all bg-white">
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
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Community & Discovery Range Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Community Radius & Discovery
            </h3>
            <span className="text-[11px] text-[#5E43F3] font-bold">{radiusKm} km active</span>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-neutral-900">Discovery Radius</span>
                <p className="text-[11px] text-neutral-500">Filter posts and rallies by distance from you</p>
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
                      : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {km}km
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Notifications & Activity Alerts */}
        <div className="space-y-3">
          <div className="border-b border-neutral-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Notifications & Alerts
            </h3>
          </div>

          <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-2xl overflow-hidden bg-white">
            <div className="p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-neutral-900">Local Rallies & Meetups</span>
                <p className="text-[11px] text-neutral-500">Get alerted when a rally happens nearby</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifyRallies(!notifyRallies)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  notifyRallies ? 'bg-[#5E43F3]' : 'bg-neutral-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                    notifyRallies ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-neutral-900">24-Hour Cycle Updates</span>
                <p className="text-[11px] text-neutral-500">Notifications when following post stories</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifyCycles(!notifyCycles)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  notifyCycles ? 'bg-[#5E43F3]' : 'bg-neutral-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                    notifyCycles ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-neutral-900">Messages & Replies</span>
                <p className="text-[11px] text-neutral-500">Direct chats and comment notifications</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifyMessages(!notifyMessages)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  notifyMessages ? 'bg-[#5E43F3]' : 'bg-neutral-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                    notifyMessages ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 3.5. Home Feed Preferences */}
        <div className="space-y-3">
          <div className="border-b border-neutral-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Interests & Home Feed
            </h3>
            <p className="text-[11px] text-neutral-500 mt-1">
              Choose the topics you want Lalao to personalize for you.
            </p>
          </div>

          <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-2xl overflow-hidden bg-white">
            {activeTopics?.length > 0 ? (
              activeTopics.map((topic: any) => {
                  let isEnabled = false;
                  if (topic.defaultEnabled) {
                     isEnabled = currentUser.homeFeedPreferences?.[topic.slug] !== false;
                  } else {
                     isEnabled = !!(currentUser.interests?.includes(topic.slug) && currentUser.homeFeedPreferences?.[topic.slug] !== false);
                  }
                  
                  return (
                    <div key={topic.slug} className="p-3.5 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-neutral-900">{topic.displayName}</span>
                        <p className="text-[11px] text-neutral-500 max-w-[200px]">
                          {topic.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          updateHomePreference(topic.slug, !isEnabled);
                          // Optimistically update current user so UI reflects immediately
                          setCurrentUser(prev => {
                            const newPreferences = { ...prev.homeFeedPreferences };
                            newPreferences[topic.slug] = !isEnabled;
                            
                            let newInterests = prev.interests || [];
                            if (!isEnabled) {
                              if (!newInterests.includes(topic.slug)) {
                                newInterests = [...newInterests, topic.slug];
                              }
                            } else {
                              newInterests = newInterests.filter(i => i !== topic.slug);
                            }
                            
                            return {
                              ...prev,
                              homeFeedPreferences: newPreferences,
                              interests: newInterests
                            };
                          });
                        }}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          isEnabled ? 'bg-[#5E43F3]' : 'bg-neutral-300'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                            isEnabled ? 'right-0.5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })
            ) : (
              <div className="p-4 text-center">
                <p className="text-[11px] text-neutral-500">
                  No active topics available.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 4. Privacy & Safety */}
        <div className="space-y-3">
          <div className="border-b border-neutral-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Privacy & Community Safety
            </h3>
          </div>

          <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-2xl overflow-hidden bg-white">
            <div className="p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-neutral-900">Public Community Profile</span>
                <p className="text-[11px] text-neutral-500">Allow local members to view your posts</p>
              </div>
              <button
                type="button"
                onClick={() => setPublicVisibility(!publicVisibility)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  publicVisibility ? 'bg-[#5E43F3]' : 'bg-neutral-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                    publicVisibility ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-neutral-900">Active Story Indicator</span>
                <p className="text-[11px] text-neutral-500">Show colorful ring when 24h cycle is active</p>
              </div>
              <button
                type="button"
                onClick={() => setShowActiveStatus(!showActiveStatus)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  showActiveStatus ? 'bg-[#5E43F3]' : 'bg-neutral-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                    showActiveStatus ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 5. KYC / Verification */}
        <div className="space-y-3">
          <div className="border-b border-neutral-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              KYC / Verification
            </h3>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#5E43F3]" />
                <span className="text-xs font-bold text-neutral-900">Current status</span>
              </div>
              <span className="rounded-full bg-neutral-900 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
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

            <p className="text-[11px] text-neutral-500">
              Your identity has not been verified yet. This status will update once your verification review is complete.
            </p>
          </div>
        </div>

        {/* 6. Withdrawal Account */}
        <div className="space-y-3">
          <div className="border-b border-neutral-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Wallet / Withdrawals
            </h3>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 space-y-3">
            {withdrawalAccount.bankName && withdrawalAccount.accountNumber ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#5E43F3]" />
                    <span className="text-xs font-bold text-neutral-900">Withdrawal account</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBankFormOpen((v) => !v)}
                    className="text-[11px] font-bold text-[#5E43F3] cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-3">
                  <p className="text-[11px] text-neutral-500">Bank</p>
                  <p className="mt-1 text-sm font-bold text-neutral-900">{withdrawalAccount.bankName}</p>
                  <p className="mt-2 text-[11px] text-neutral-500">Account</p>
                  <p className="mt-1 font-mono text-sm font-bold text-neutral-900">
                    {withdrawalAccount.accountNumber.replace(/\d(?=\d{4})/g, '•')}
                  </p>
                  <p className="mt-2 text-[11px] text-neutral-500">Account name</p>
                  <p className="mt-1 text-sm text-neutral-800">{withdrawalAccount.accountName || 'Not provided'}</p>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-center">
                <p className="text-xs font-bold text-neutral-700">No withdrawal account added</p>
                <p className="mt-1 text-[11px] text-neutral-500">Add your bank details to receive payouts.</p>
              </div>
            )}

            {!isBankFormOpen && !withdrawalAccount.bankName && !withdrawalAccount.accountNumber && (
              <button
                type="button"
                onClick={() => setIsBankFormOpen(true)}
                className="w-full rounded-xl border border-[#5E43F3]/20 bg-[#5E43F3]/5 px-4 py-3 text-xs font-bold text-[#5E43F3] hover:bg-[#5E43F3]/10 cursor-pointer"
              >
                Add Bank Account
              </button>
            )}

            {isBankFormOpen && (
              <div className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-neutral-500">Bank</label>
                  <input
                    type="text"
                    value={withdrawalAccount.bankName}
                    onChange={(e) => setWithdrawalAccount((prev) => ({ ...prev, bankName: e.target.value }))}
                    placeholder="Access Bank"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-xs text-neutral-900 outline-none focus:border-[#5E43F3]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-neutral-500">Account number</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={withdrawalAccount.accountNumber}
                    onChange={(e) => setWithdrawalAccount((prev) => ({ ...prev, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    placeholder="0123456789"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-xs text-neutral-900 outline-none focus:border-[#5E43F3]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-neutral-500">Account name</label>
                  <input
                    type="text"
                    value={withdrawalAccount.accountName}
                    onChange={(e) => setWithdrawalAccount((prev) => ({ ...prev, accountName: e.target.value }))}
                    placeholder="Full name on account"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-xs text-neutral-900 outline-none focus:border-[#5E43F3]"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (withdrawalAccount.bankName.trim() && withdrawalAccount.accountNumber.trim()) {
                        setIsBankFormOpen(false);
                        triggerShareToast('Withdrawal account saved.');
                      } else {
                        triggerShareToast('Bank and account number are required.');
                      }
                    }}
                    className="flex-1 rounded-xl bg-[#5E43F3] px-3 py-2.5 text-[11px] font-bold text-white hover:bg-[#4E34E0] cursor-pointer"
                  >
                    Save account
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBankFormOpen(false)}
                    className="flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-[11px] font-bold text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 7. Account Mode (Admin Roles Only) */}
        {(role === 'super_admin' || role === 'admin' || role === 'editor') && (
          <div className="space-y-3">
            <div className="border-b border-neutral-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Account Mode
              </h3>
            </div>
            
            <button
              type="button"
              onClick={handleSwitchToAdmin}
              disabled={isCreatingAdminSession}
              className="w-full rounded-2xl border border-neutral-200 bg-white p-4 flex items-center justify-between hover:bg-neutral-50 cursor-pointer disabled:opacity-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white">
                  {isCreatingAdminSession ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <Shield className="w-5 h-5" />
                  )}
                </div>
                <div className="text-left flex flex-col">
                  <span className="text-sm font-bold text-neutral-900">Go to Admin Panel</span>
                  <span className="text-[11px] text-neutral-500 line-clamp-1">Manage the Lalao platform</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-400" />
            </button>
          </div>
        )}

        {/* 8. Account Actions */}
        <div className="space-y-3">
          <div className="border-b border-neutral-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
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

        {/* 7. App Info */}
        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 text-center space-y-1">
          <p className="text-xs font-bold text-neutral-900">Lalao Community Platform</p>
          <p className="text-[11px] text-neutral-500">Version 2.4.0 (Warri & Delta State Edition)</p>
          <p className="text-[10px] text-neutral-400 pt-1">
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
      </div>
    </div>
  );
};
