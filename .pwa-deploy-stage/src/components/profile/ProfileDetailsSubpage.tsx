import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Camera,
  Check,
  MapPin,
  Calendar,
  Upload,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';
import { useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { uploadImageToCloudinary } from '../../lib/cloudinary';

interface ProfileDetailsSubpageProps {
  onBack: () => void;
  onSaved?: () => void;
}

const NEIGHBORHOOD_OPTIONS = [
  'Udu, Delta State',
  'Enerhen Junction, Warri',
  'Effurun Roundabout, Delta State',
  'GRA Warri',
  'Airport Road, Warri',
  'PTI Road, Effurun',
  'Deco Road, Warri',
];

export const ProfileDetailsSubpage: React.FC<ProfileDetailsSubpageProps> = ({
  onBack,
  onSaved,
}) => {
  const { currentUser, updateUserProfile, triggerShareToast } = useLalao();

  const generateCloudinarySignatureAction = useAction(api.cloudinary.generateSignature);
  const generateCloudinarySignature = async (folder?: string) => {
    return await generateCloudinarySignatureAction({ folder });
  };
  const generateConvexUploadUrl = useMutation(api.social.generateUploadUrl);

  const [name, setName] = useState(currentUser.name || '');
  const [username, setUsername] = useState((currentUser.username || '').replace(/^@+/, ''));
  const [bio, setBio] = useState(currentUser.bio || '');
  const [userLocation, setUserLocation] = useState(currentUser.location || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [publicIdentityType, setPublicIdentityType] = useState<'display_name' | 'username' | 'both'>(
    currentUser.publicIdentityType === 'username'
      ? 'username'
      : currentUser.publicIdentityType === 'both'
      ? 'both'
      : 'display_name'
  );
  const [dateOfBirth, setDateOfBirth] = useState<string>(currentUser.dateOfBirth || '');
  const [birthDateVisibility, setBirthDateVisibility] = useState<'public' | 'age_only' | 'private'>(
    currentUser.birthDateVisibility || 'private'
  );

  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(currentUser.name || '');
    setUsername((currentUser.username || '').replace(/^@+/, ''));
    setBio(currentUser.bio || '');
    setUserLocation(currentUser.location || '');
    setAvatar(currentUser.avatar || '');
    setPublicIdentityType(
      currentUser.publicIdentityType === 'username'
        ? 'username'
        : currentUser.publicIdentityType === 'both'
        ? 'both'
        : 'display_name'
    );
    setDateOfBirth(currentUser.dateOfBirth || '');
    setBirthDateVisibility(currentUser.birthDateVisibility || 'private');
  }, [currentUser]);

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

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      let finalAvatarUrl = avatar;
      let finalStorageId: any = undefined;

      if (avatarFile) {
        try {
          if (typeof generateCloudinarySignature !== 'function') {
            throw new Error('generateCloudinarySignature is not a function');
          }
          const sig = await generateCloudinarySignature('avatars');
          finalAvatarUrl = await uploadImageToCloudinary(avatarFile, sig);
        } catch (uploadErr) {
          console.warn('Cloudinary upload fallback triggered:', uploadErr);
          if (typeof generateConvexUploadUrl !== 'function') {
            throw new Error('generateConvexUploadUrl is not a function');
          }
          const uploadUrl = await generateConvexUploadUrl();
          const result = await fetch(uploadUrl, {
            method: 'POST',
            headers: { 'Content-Type': avatarFile.type },
            body: avatarFile,
          });
          if (!result.ok) throw new Error('Convex storage upload failed');
          const { storageId } = await result.json();
          finalStorageId = storageId;
          finalAvatarUrl = undefined;
        }
      }

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

      triggerShareToast('Profile details saved successfully!');
      if (onSaved) onSaved();
    } catch (err: any) {
      triggerShareToast(err.message || 'Failed to save profile details');
    } finally {
      setIsSaving(false);
    }
  };

  const displayUsernameClean = (username || '').replace(/^@+/, '').trim() || 'username';

  return (
    <div className="flex flex-col h-full bg-theme-surface animate-in fade-in duration-200">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-theme-surface/95 backdrop-blur-md border-b border-theme-divider-light px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-profile-details"
            type="button"
            onClick={onBack}
            className="p-1.5 -ml-1 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
            title="Back to Settings Hub"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-base text-theme-primary">Profile Details</h1>
            <p className="text-[11px] text-theme-tertiary">Public information and identity</p>
          </div>
        </div>

        <button
          id="btn-save-profile-details"
          type="button"
          disabled={isSaving}
          onClick={() => handleSave()}
          className="px-4 py-2 rounded-full bg-[#5E43F3] text-white text-xs font-bold hover:bg-[#4E34E0] transition-all shadow-md shadow-[#5E43F3]/25 active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-xl mx-auto w-full pb-28">
        {/* Avatar uploader */}
        <div className="flex flex-col items-center gap-3 py-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative group cursor-pointer"
            title="Change profile photo"
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
            className="px-3.5 py-1.5 rounded-full border border-theme-divider-light text-theme-secondary hover:text-theme-primary text-xs font-semibold hover:bg-theme-surface-hover transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{avatar ? 'Change photo' : 'Add profile photo'}</span>
          </button>
        </div>

        {/* Display Name & Handle */}
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
                onChange={(e) =>
                  setUsername(
                    e.target.value
                      .replace(/^@+/, '')
                      .toLowerCase()
                      .replace(/[^a-z0-9_]/g, '')
                  )
                }
                placeholder="e.g. RideRezzy"
                className="w-full outline-none text-xs bg-transparent"
              />
            </div>
          </div>
        </div>

        {/* Public Identity Display Preference (CRITICAL: positioned immediately after Name & Username) */}
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

            {/* Option B: Username */}
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

          {/* Live Preview */}
          <div className="mt-2 pt-2.5 border-t border-theme-divider-light flex items-center justify-between text-[11px]">
            <span className="text-theme-tertiary font-medium">Header preview:</span>
            <div className="inline-flex flex-col items-start px-2.5 py-1 rounded-xl bg-theme-base border border-theme-divider">
              <span className="font-bold text-theme-primary">
                {publicIdentityType === 'username'
                  ? displayUsernameClean
                  : name.trim() || 'Your Name'}
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

        {/* Home Neighborhood / Location */}
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
          <div className="flex flex-wrap gap-1.5 mt-2">
            {NEIGHBORHOOD_OPTIONS.map((loc) => (
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

          {/* Visibility Options */}
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

        {/* Bottom Save Button */}
        <div className="pt-2">
          <button
            id="btn-save-profile-details-bottom"
            type="button"
            disabled={isSaving}
            onClick={() => handleSave()}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#5E43F3] text-white text-sm font-bold hover:bg-[#4E34E0] transition-all shadow-lg shadow-[#5E43F3]/25 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{isSaving ? 'Saving...' : 'Save Profile Details'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
