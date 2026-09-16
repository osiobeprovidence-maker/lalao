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
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';

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
  } = useLalao();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [userLocation, setUserLocation] = useState(currentUser.location || 'Warri, Delta State');
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const containerRef = useRef<HTMLDivElement>(null);

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

  if (!isEditProfileOpen) return null;

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
    setIsEditProfileOpen(false);
    triggerShareToast('Settings & profile saved successfully!');
  };

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
  ];

  const neighborhoodOptions = [
    'Udu, Delta State',
    'Enerhen Junction, Warri',
    'Effurun Roundabout, Delta State',
    'GRA Warri',
    'Airport Road, Warri',
    'PTI Road, Effurun',
    'Deco Road, Warri',
  ];

  const demoPersonas = {
    david: {
      name: 'David Morgan',
      username: 'davidmorgan',
      bio: 'Community builder and local sports organizer.',
      location: 'Warri Central',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    },
    amaka: {
      name: 'Amaka Nwosu',
      username: 'amakanwosu',
      bio: 'Creative designer and event host.',
      location: 'Effurun',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    },
    isbae_u: {
      name: 'Isbae U',
      username: 'isbae_u',
      bio: 'Music and culture curator across Delta.',
      location: 'Udu, Delta State',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    },
    subteen: {
      name: 'Subteen Wear',
      username: 'subteenwear',
      bio: 'Fashion drop and creator community updates.',
      location: 'Udu Express Junction',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
    },
    tunde: {
      name: 'Tunde Balogun',
      username: 'tundebalogun',
      bio: 'Local entrepreneur and community connector.',
      location: 'Udu, Delta State',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
    },
    udulions: {
      name: 'Udu Lions FC',
      username: 'udulionsfc',
      bio: 'Community football club and local match updates.',
      location: 'Udu Township Stadium',
      avatar: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=400&auto=format&fit=crop&q=80',
    },
  } as const;

  const handleSwitchPersona = (personaKey: keyof typeof demoPersonas) => {
    const user = demoPersonas[personaKey];
    if (user) {
      setCurrentUser((prev) => ({
        ...prev,
        name: user.name,
        username: user.username,
        bio: user.bio,
        location: user.location,
        avatar: user.avatar,
      }));
      setName(user.name);
      setUsername(user.username);
      setBio(user.bio || '');
      setUserLocation(user.location);
      setAvatar(user.avatar);
      triggerShareToast(`Switched account persona to ${user.name}`);
    }
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

  return (
    <div
      ref={containerRef}
      id="settings-page-screen"
      className="absolute inset-0 z-40 bg-white flex flex-col min-h-full overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-250"
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
      <div className="flex-1 max-w-xl mx-auto w-full p-4 sm:p-6 space-y-7 pb-28">
        {/* 1. Profile Identity Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Profile Details
            </h3>
            <span className="text-[11px] text-neutral-400 font-medium">Public Information</span>
          </div>

          {/* Avatar picker */}
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="relative group cursor-pointer">
              <Avatar
                src={avatar}
                alt={name}
                size="xl"
                className="w-20 h-20 ring-4 ring-[#5E43F3]/20 shadow-md"
              />
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6" />
              </div>
            </div>

            <div className="text-center">
              <span className="text-xs font-bold text-neutral-800">Change Profile Photo</span>
              <p className="text-[11px] text-neutral-500 mt-0.5">Select a preset or tap to upload</p>
            </div>

            <div className="flex items-center gap-2 mt-1 overflow-x-auto pb-1 max-w-full">
              {sampleAvatars.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="Option"
                  referrerPolicy="no-referrer"
                  onClick={() => setAvatar(src)}
                  className={`w-9 h-9 rounded-full object-cover cursor-pointer border-2 transition-all ${
                    avatar === src
                      ? 'border-[#5E43F3] scale-110 ring-2 ring-[#5E43F3]/30'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
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

        {/* 5. Demo Persona Switcher */}
        <div className="space-y-3">
          <div className="border-b border-neutral-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Switch Demo Persona
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(
              [
                { key: 'david', name: 'David Morgan' },
                { key: 'amaka', name: 'Amaka Nwosu' },
                { key: 'isbae_u', name: 'Isbae U' },
                { key: 'subteen', name: 'Subteen Wear' },
                { key: 'tunde', name: 'Tunde Balogun' },
                { key: 'udulions', name: 'Udu Lions FC' },
              ] as const
            ).map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => handleSwitchPersona(p.key as keyof typeof demoPersonas)}
                className="p-2.5 rounded-xl border border-neutral-200 hover:border-[#5E43F3] hover:bg-neutral-50 text-xs font-bold text-neutral-800 transition-colors text-left truncate cursor-pointer"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* 6. Account Actions */}
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
  );
};
