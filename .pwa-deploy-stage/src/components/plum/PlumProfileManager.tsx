// @ts-nocheck
import React, { useState, useRef } from 'react';
import {
  Camera,
  Lock,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Save,
  Shield,
  UserX,
  MapPin,
  Heart,
  Check,
  AlertTriangle,
  Upload,
  Star,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import { uploadImageWithFallback } from '../../lib/cloudinary';
import {
  DATING_GOAL_OPTIONS,
  DatingGoalId,
  getDatingGoalOption,
} from './datingGoals';

const GENDER_OPTIONS = [
  { id: 'man', label: 'Man' },
  { id: 'woman', label: 'Woman' },
  { id: 'non-binary', label: 'Non-binary' },
  { id: 'trans-man', label: 'Trans Man' },
  { id: 'trans-woman', label: 'Trans Woman' },
  { id: 'genderqueer', label: 'Genderqueer' },
  { id: 'other', label: 'Other' },
];

const DATING_PREFERENCE_OPTIONS = [
  { id: 'women', label: 'Women' },
  { id: 'men', label: 'Men' },
  { id: 'non-binary', label: 'Non-binary people' },
  { id: 'everyone', label: 'Everyone / Open' },
];

interface PlumProfileManagerProps {
  myProfile: any;
}

export const PlumProfileManager: React.FC<PlumProfileManagerProps> = ({ myProfile }) => {
  const { triggerShareToast } = useLalao();

  const savePlumProfileMutation = useMutation(api.plum.savePlumProfile);
  const updatePlumStatusMutation = useMutation(api.plum.updatePlumStatus);

  // Storage / Upload mutations & actions
  const generateCloudinarySignature = useAction((api as any).cloudinary?.generateSignature);
  const generateConvexUploadUrl = useMutation((api as any).social?.generateUploadUrl);
  const resolveStorageUrl = useMutation((api as any).social?.resolveStorageUrl);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states initialized with existing profile values
  const [displayName, setDisplayName] = useState(myProfile?.displayName || '');
  const [age, setAge] = useState<number>(myProfile?.age || 24);
  const [gender, setGender] = useState(myProfile?.gender || 'woman');
  const [datingPreferences, setDatingPreferences] = useState<string[]>(
    myProfile?.datingPreferences || ['men']
  );
  const [bio, setBio] = useState(myProfile?.bio || '');
  const [interests, setInterests] = useState<string[]>(myProfile?.interests || []);
  const [datingIntentions, setDatingIntentions] = useState(myProfile?.datingIntentions || 'relationship');

  // Dating Goal state (Required)
  const [datingGoal, setDatingGoal] = useState<DatingGoalId | ''>(
    myProfile?.datingGoal || ''
  );

  const [additionalDatingInfo, setAdditionalDatingInfo] = useState(myProfile?.additionalDatingInfo || '');
  const [broadLocation, setBroadLocation] = useState(myProfile?.broadLocation || '');
  const [showOnMap, setShowOnMap] = useState<boolean>(myProfile?.showOnMap ?? true);
  const [profileVisibility, setProfileVisibility] = useState<'active' | 'hidden' | 'deactivated'>(
    myProfile?.profileVisibility || 'active'
  );

  // Photos
  const initialPublic = myProfile?.publicPhotos || [];
  const initialMain = myProfile?.mainPhoto || (initialPublic.length > 0 ? initialPublic[0] : '');

  const [publicPhotos, setPublicPhotos] = useState<string[]>(initialPublic);
  const [privatePhotos, setPrivatePhotos] = useState<string[]>(myProfile?.privatePhotos || []);
  const [mainPhoto, setMainPhoto] = useState<string>(initialMain);

  // Upload & Add photo states
  const [uploadDestination, setUploadDestination] = useState<'public' | 'private'>('public');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState('');
  const [photoInputUrl, setPhotoInputUrl] = useState('');
  const [isPrivateInput, setIsPrivateInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  // Validation alert for incomplete existing profile
  const isGoalMissing = !datingGoal;

  const togglePreference = (prefId: string) => {
    if (prefId === 'everyone') {
      setDatingPreferences(['everyone']);
      return;
    }
    const current = datingPreferences.filter((p) => p !== 'everyone');
    if (current.includes(prefId)) {
      const next = current.filter((p) => p !== prefId);
      setDatingPreferences(next.length === 0 ? ['everyone'] : next);
    } else {
      setDatingPreferences([...current, prefId]);
    }
  };

  // Direct Device File Upload Handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // File validation: format & size
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      triggerShareToast('Invalid image type. Please select JPEG, PNG, or WebP.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      triggerShareToast('Image file too large. Maximum size is 10MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgressMsg('Optimizing and uploading photo...');

      const uploadedUrl = await uploadImageWithFallback(
        file,
        uploadDestination === 'public' ? 'plum-photos' : 'plum-vault',
        generateCloudinarySignature,
        generateConvexUploadUrl,
        resolveStorageUrl
      );

      if (!uploadedUrl) {
        throw new Error('Upload returned empty image URL');
      }

      if (uploadDestination === 'public') {
        const nextPublic = [...publicPhotos, uploadedUrl];
        setPublicPhotos(nextPublic);
        // If no main photo currently, set this as main
        if (!mainPhoto) {
          setMainPhoto(uploadedUrl);
        }
        triggerShareToast('Public photo uploaded successfully!');
      } else {
        setPrivatePhotos((prev) => [...prev, uploadedUrl]);
        triggerShareToast('Photo added to Private Vault!');
      }
    } catch (err: any) {
      console.error('Plum photo upload failed:', err);
      triggerShareToast(err.message || 'Photo upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgressMsg('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // URL-based photo addition (preserved for backward compatibility)
  const handleAddPhotoByUrl = () => {
    const url = photoInputUrl.trim();
    if (!url) return;
    if (isPrivateInput) {
      setPrivatePhotos([...privatePhotos, url]);
      triggerShareToast('Photo added to Private Vault');
    } else {
      const nextPublic = [...publicPhotos, url];
      setPublicPhotos(nextPublic);
      if (!mainPhoto) {
        setMainPhoto(url);
      }
      triggerShareToast('Public photo added');
    }
    setPhotoInputUrl('');
  };

  const handleSetMainPhoto = (url: string) => {
    setMainPhoto(url);
    triggerShareToast('Set as main profile photo');
  };

  const removePhoto = (isPrivate: boolean, idx: number) => {
    if (isPrivate) {
      setPrivatePhotos(privatePhotos.filter((_, i) => i !== idx));
    } else {
      if (publicPhotos.length <= 1) {
        triggerShareToast('You need at least 1 public profile photo');
        return;
      }
      const removedUrl = publicPhotos[idx];
      const nextPublic = publicPhotos.filter((_, i) => i !== idx);
      setPublicPhotos(nextPublic);

      // If removed was the main photo, reassign main to another photo
      if (mainPhoto === removedUrl) {
        setMainPhoto(nextPublic[0] || '');
      }
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      triggerShareToast('Display name is required');
      return;
    }
    if (publicPhotos.length === 0) {
      triggerShareToast('At least 1 public photo required');
      return;
    }
    if (!datingGoal) {
      triggerShareToast('Please select a Dating Goal before saving');
      return;
    }

    try {
      setIsSaving(true);
      await savePlumProfileMutation({
        displayName: displayName.trim(),
        age: Number(age),
        gender,
        datingPreferences,
        bio: bio.trim(),
        interests,
        datingIntentions,
        datingGoal: datingGoal as any,
        additionalDatingInfo: additionalDatingInfo.trim() || undefined,
        broadLocation: broadLocation.trim() || 'Nearby',
        mainPhoto: mainPhoto || publicPhotos[0],
        publicPhotos,
        privatePhotos,
        showOnMap,
        profileVisibility,
      });
      triggerShareToast('Plum profile updated successfully!');
    } catch (err: any) {
      triggerShareToast(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      await updatePlumStatusMutation({ status: 'deactivated' });
      triggerShareToast('Plum profile deactivated');
      setShowDeactivateConfirm(false);
    } catch (err: any) {
      triggerShareToast(err.message || 'Failed to deactivate profile');
    }
  };

  return (
    <div className="w-full px-3 sm:px-4 py-4 space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-theme-divider-light">
        <div>
          <h2 className="text-lg font-black text-theme-primary">Manage Dating Profile</h2>
          <p className="text-xs text-theme-secondary">
            Manage your dating info, photos, dating goals, and discovery privacy.
          </p>
        </div>

        <button
          id="btn-plum-save-profile"
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#8E24AA] via-[#E91E63] to-[#FF4081] text-white text-xs font-bold shadow-md shadow-pink-500/20 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Incomplete Profile Prompt if dating goal missing */}
      {isGoalMissing && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-amber-600 dark:text-amber-400">
              Required: Dating Goal Needed
            </p>
            <p className="text-theme-secondary text-[11px] mt-0.5">
              Every active Plum dating profile must specify what you are looking for. Please choose your dating goal below to keep your profile active in discovery.
            </p>
          </div>
        </div>
      )}

      {/* Visibility Status Bar */}
      <div className="p-3.5 rounded-2xl bg-theme-surface border border-theme-divider-light flex items-center justify-between">
        <div className="flex items-center gap-2">
          {profileVisibility === 'active' ? (
            <Eye className="w-4 h-4 text-emerald-500" />
          ) : (
            <EyeOff className="w-4 h-4 text-amber-500" />
          )}
          <div>
            <p className="text-xs font-bold text-theme-primary">Profile Discovery Status</p>
            <p className="text-[10px] text-theme-tertiary">
              {profileVisibility === 'active'
                ? 'Visible to compatible members'
                : 'Hidden from discovery results'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setProfileVisibility(profileVisibility === 'active' ? 'hidden' : 'active')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
            profileVisibility === 'active'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
          }`}
        >
          {profileVisibility === 'active' ? 'Active' : 'Hidden'}
        </button>
      </div>

      {/* Section 1: Basic Profile Info */}
      <div className="p-4 rounded-3xl bg-theme-surface border border-theme-divider-light space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
          1. Profile Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-[11px] font-bold text-theme-secondary">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-theme-base border border-theme-divider-light text-theme-primary text-xs focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-theme-secondary">Age</label>
            <input
              type="number"
              min={18}
              value={age}
              onChange={(e) => setAge(parseInt(e.target.value) || 18)}
              className="w-full px-3 py-2 rounded-xl bg-theme-base border border-theme-divider-light text-theme-primary text-xs focus:outline-none font-bold"
            />
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-theme-secondary">Biography</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-theme-base border border-theme-divider-light text-theme-primary text-xs focus:outline-none resize-none"
          />
        </div>

        {/* Broad Location */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-theme-secondary">Broad Location</label>
          <input
            type="text"
            value={broadLocation}
            onChange={(e) => setBroadLocation(e.target.value)}
            placeholder="e.g. Lekki Phase 1, Lagos"
            className="w-full px-3 py-2 rounded-xl bg-theme-base border border-theme-divider-light text-theme-primary text-xs focus:outline-none"
          />
        </div>

        {/* Map visibility toggle */}
        <label className="flex items-center justify-between text-xs cursor-pointer select-none pt-1">
          <span className="text-theme-secondary">Show profile on Discovery Map</span>
          <input
            type="checkbox"
            checked={showOnMap}
            onChange={(e) => setShowOnMap(e.target.checked)}
            className="h-4 w-4 rounded accent-pink-600 cursor-pointer"
          />
        </label>
      </div>

      {/* Section 2: Photo Management with Direct File Upload */}
      <div className="p-4 rounded-3xl bg-theme-surface border border-theme-divider-light space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
              2. Photo Management
            </h3>
            <p className="text-[10px] text-theme-secondary mt-0.5">
              Upload photos directly from your device. Changing your Plum photos will not alter your regular LaLao profile avatar.
            </p>
          </div>
          <span className="text-[10px] text-theme-tertiary font-bold shrink-0">
            {publicPhotos.length} Public · {privatePhotos.length} Private
          </span>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Direct Upload Controls */}
        <div className="p-3.5 rounded-2xl bg-theme-base border border-pink-500/20 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="text-xs font-bold text-theme-primary flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-pink-500" /> Upload from Device
              </span>
              <p className="text-[10px] text-theme-secondary">
                Select JPEG, PNG, or WebP. Choose whether to add to Public or Private Vault.
              </p>
            </div>

            {/* Destination Selector */}
            <div className="flex items-center gap-2 bg-theme-surface p-1 rounded-xl border border-theme-divider-light self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setUploadDestination('public')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  uploadDestination === 'public'
                    ? 'bg-pink-500 text-white shadow-xs'
                    : 'text-theme-secondary hover:text-theme-primary'
                }`}
              >
                Public Photo
              </button>
              <button
                type="button"
                onClick={() => setUploadDestination('private')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  uploadDestination === 'private'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-theme-secondary hover:text-theme-primary'
                }`}
              >
                Private Vault
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-plum-upload-photo"
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8E24AA] via-[#E91E63] to-[#FF4081] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-pink-500/20 hover:opacity-95 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                </>
              )}
            </button>

            {isUploading && (
              <span className="text-[11px] text-pink-500 font-semibold animate-pulse">
                {uploadProgressMsg || 'Uploading photo...'}
              </span>
            )}
          </div>
        </div>

        {/* Public Photos Gallery */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-theme-primary flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-pink-500" /> Public Photos ({publicPhotos.length})
            </span>
            <span className="text-[10px] text-theme-tertiary">
              Click photo star to set as Main
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {publicPhotos.map((url, idx) => {
              const isMain = (mainPhoto === url) || (!mainPhoto && idx === 0);
              return (
                <div
                  key={idx}
                  className={`relative aspect-square rounded-2xl overflow-hidden border group bg-black/10 transition-all ${
                    isMain ? 'ring-2 ring-pink-500 border-pink-500 shadow-sm' : 'border-theme-divider'
                  }`}
                >
                  <img
                    src={url}
                    alt={`Public photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Main Profile Photo Badge */}
                  {isMain && (
                    <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-pink-600/90 backdrop-blur-xs text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow-xs">
                      <Star className="w-2.5 h-2.5 fill-white" />
                      <span>Main</span>
                    </div>
                  )}

                  {/* Overlay Actions on Hover/Touch */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                    {!isMain && (
                      <button
                        type="button"
                        onClick={() => handleSetMainPhoto(url)}
                        title="Set as main profile photo"
                        className="p-1.5 rounded-xl bg-pink-500 text-white hover:bg-pink-600 transition-colors cursor-pointer text-[10px] font-bold flex items-center gap-1"
                      >
                        <Star className="w-3 h-3 fill-white" />
                        <span className="hidden sm:inline">Set Main</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(false, idx)}
                      title="Remove photo"
                      className="p-1.5 rounded-xl bg-black/60 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Private Vault Photos */}
        <div className="p-3.5 rounded-2xl border border-pink-500/20 bg-pink-500/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-pink-600 dark:text-pink-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-pink-500" /> Private Vault Photos ({privatePhotos.length})
            </span>
          </div>
          <p className="text-[10px] text-theme-secondary">
            Strictly inaccessible to other members unless you individually grant them private vault permission.
          </p>

          {privatePhotos.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
              {privatePhotos.map((url, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-2xl overflow-hidden border border-pink-500/30 group bg-black/20"
                >
                  <img src={url} alt={`Private ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(true, idx)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-theme-tertiary italic pt-1">
              No private vault photos added yet.
            </p>
          )}
        </div>

        {/* Fallback URL photo input */}
        <div className="rounded-2xl bg-theme-base border border-theme-divider-light p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-semibold text-theme-secondary">Or Add Photo by URL</span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 text-[11px] text-theme-secondary cursor-pointer">
                <input
                  type="radio"
                  name="vaultType"
                  checked={!isPrivateInput}
                  onChange={() => setIsPrivateInput(false)}
                  className="accent-pink-600"
                />
                Public
              </label>
              <label className="flex items-center gap-1 text-[11px] text-theme-secondary cursor-pointer">
                <input
                  type="radio"
                  name="vaultType"
                  checked={isPrivateInput}
                  onChange={() => setIsPrivateInput(true)}
                  className="accent-pink-600"
                />
                Private Vault
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              value={photoInputUrl}
              onChange={(e) => setPhotoInputUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 px-3 py-1.5 rounded-xl bg-theme-surface border border-theme-divider-light text-theme-primary text-xs focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddPhotoByUrl}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#8E24AA] to-[#E91E63] text-white text-xs font-bold hover:opacity-95 cursor-pointer shrink-0"
            >
              Add URL
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: REQUIRED Dating Goals */}
      <div className="p-4 rounded-3xl bg-theme-surface border border-pink-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
            3. Dating Goals (Required)
          </h3>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-500 border border-pink-500/20">
            Mandatory
          </span>
        </div>
        <p className="text-xs text-theme-secondary leading-relaxed">
          Tell other members what you&apos;re looking for so you can connect with people who share similar intentions.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {DATING_GOAL_OPTIONS.map((opt) => {
            const isSelected = datingGoal === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDatingGoal(opt.id)}
                className={`p-3 rounded-2xl text-left border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-pink-500 bg-pink-500/10 shadow-sm ring-1 ring-pink-500'
                    : 'border-theme-divider-light bg-theme-base hover:bg-theme-surface-hover'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className={`text-xs font-bold ${isSelected ? 'text-pink-600 dark:text-pink-400' : 'text-theme-primary'}`}>
                    {opt.label}
                  </p>
                  {isSelected && <Check className="w-4 h-4 text-pink-500 shrink-0" />}
                </div>
                <p className="mt-1 text-[11px] text-theme-secondary leading-snug">
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 4: Dating Preferences & Mutual Matching */}
      <div className="p-4 rounded-3xl bg-theme-surface border border-theme-divider-light space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
          4. Dating & Matching Preferences
        </h3>
        <p className="text-[11px] text-theme-secondary">
          Configure who you want to discover. Only mutually compatible members will appear in your discovery feed.
        </p>

        <div className="grid grid-cols-2 gap-2">
          {DATING_PREFERENCE_OPTIONS.map((pref) => {
            const selected = datingPreferences.includes(pref.id);
            return (
              <button
                key={pref.id}
                type="button"
                onClick={() => togglePreference(pref.id)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-between transition-all cursor-pointer ${
                  selected
                    ? 'border-pink-500 bg-pink-500/10 text-pink-600 dark:text-pink-400 font-bold'
                    : 'border-theme-divider-light bg-theme-base text-theme-secondary hover:text-theme-primary'
                }`}
              >
                <span>{pref.label}</span>
                {selected && <Check className="w-3.5 h-3.5 text-pink-500" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 5: Deactivate Plum Profile Section */}
      <div className="p-4 rounded-3xl bg-theme-surface border border-rose-500/20 space-y-2">
        <h3 className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
          <UserX className="w-4 h-4" /> Deactivate Plum Dating Profile
        </h3>
        <p className="text-[11px] text-theme-secondary leading-relaxed">
          Deactivating removes your Plum dating profile from member searches, lists, and the discovery map without affecting your normal LaLao account or messages.
        </p>

        {showDeactivateConfirm ? (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
              Are you sure you want to deactivate your Plum dating profile?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeactivateConfirm(false)}
                className="flex-1 py-1.5 rounded-xl bg-theme-base text-theme-secondary text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeactivate}
                className="flex-1 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
              >
                Confirm Deactivate
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowDeactivateConfirm(true)}
            className="px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-500 text-xs font-bold hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            Deactivate Dating Profile
          </button>
        )}
      </div>
    </div>
  );
};
