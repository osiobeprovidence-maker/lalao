// @ts-nocheck
import React, { useState, useRef } from 'react';
import {
  Flame,
  Camera,
  Lock,
  Plus,
  Trash2,
  Check,
  ArrowRight,
  MapPin,
  Shield,
  Heart,
  Upload,
  Star,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import { uploadImageWithFallback } from '../../lib/cloudinary';
import {
  DATING_GOAL_OPTIONS,
  DatingGoalId,
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

const INTERESTS_SUGGESTIONS = [
  'Travel', 'Coffee', 'Music & Concerts', 'Fitness & Gym', 'Cooking & Foodie',
  'Art & Design', 'Tech & Startups', 'Movies & Anime', 'Photography', 'Outdoors & Hiking',
  'Reading', 'Nightlife & Dancing', 'Gaming', 'Yoga & Wellness', 'Pets & Dogs',
];

export const PlumProfileCreation: React.FC = () => {
  const { currentUser, location, triggerShareToast } = useLalao();
  const savePlumProfileMutation = useMutation(api.plum.savePlumProfile);

  // Storage / Upload mutations & actions
  const generateCloudinarySignature = useAction((api as any).cloudinary?.generateSignature);
  const generateConvexUploadUrl = useMutation((api as any).social?.generateUploadUrl);
  const resolveStorageUrl = useMutation((api as any).social?.resolveStorageUrl);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [displayName, setDisplayName] = useState(currentUser?.name || '');
  const [age, setAge] = useState<number>(24);
  const [gender, setGender] = useState('woman');
  const [datingPreferences, setDatingPreferences] = useState<string[]>(['everyone']);
  const [bio, setBio] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Travel', 'Coffee']);
  const [customInterest, setCustomInterest] = useState('');

  // Required Dating Goal
  const [datingGoal, setDatingGoal] = useState<DatingGoalId | ''>('');
  const [datingGoalError, setDatingGoalError] = useState(false);

  const [additionalDatingInfo, setAdditionalDatingInfo] = useState('');
  const [broadLocation, setBroadLocation] = useState(location.name || 'Lagos, Nigeria');
  const [showOnMap, setShowOnMap] = useState(true);

  // Photos
  const defaultPhoto = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';
  const [publicPhotos, setPublicPhotos] = useState<string[]>([defaultPhoto]);
  const [privatePhotos, setPrivatePhotos] = useState<string[]>([]);
  const [mainPhoto, setMainPhoto] = useState<string>(defaultPhoto);

  // Upload state
  const [uploadDestination, setUploadDestination] = useState<'public' | 'private'>('public');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState('');
  const [photoInputUrl, setPhotoInputUrl] = useState('');
  const [isPrivateInput, setIsPrivateInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      if (selectedInterests.length >= 8) {
        triggerShareToast('You can select up to 8 interests');
        return;
      }
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleAddCustomInterest = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customInterest.trim();
    if (!trimmed) return;
    if (selectedInterests.includes(trimmed)) return;
    if (selectedInterests.length >= 8) {
      triggerShareToast('Max 8 interests');
      return;
    }
    setSelectedInterests([...selectedInterests, trimmed]);
    setCustomInterest('');
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
        if (!mainPhoto) setMainPhoto(uploadedUrl);
        triggerShareToast('Public photo uploaded!');
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

  const handleAddPhotoByUrl = () => {
    const url = photoInputUrl.trim();
    if (!url) return;
    if (isPrivateInput) {
      setPrivatePhotos([...privatePhotos, url]);
      triggerShareToast('Added to Private Vault');
    } else {
      const nextPublic = [...publicPhotos, url];
      setPublicPhotos(nextPublic);
      if (!mainPhoto) setMainPhoto(url);
      triggerShareToast('Added Public Photo');
    }
    setPhotoInputUrl('');
  };

  const handleSetMainPhoto = (url: string) => {
    setMainPhoto(url);
    triggerShareToast('Set as main profile photo');
  };

  const removePhoto = (isPrivate: boolean, index: number) => {
    if (isPrivate) {
      setPrivatePhotos(privatePhotos.filter((_, i) => i !== index));
    } else {
      if (publicPhotos.length <= 1) {
        triggerShareToast('You need at least 1 public profile photo');
        return;
      }
      const removedUrl = publicPhotos[index];
      const nextPublic = publicPhotos.filter((_, i) => i !== index);
      setPublicPhotos(nextPublic);
      if (mainPhoto === removedUrl) {
        setMainPhoto(nextPublic[0] || '');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      triggerShareToast('Please provide a display name');
      return;
    }
    if (age < 18) {
      triggerShareToast('Must be 18 or older to join Plum');
      return;
    }
    if (publicPhotos.length === 0) {
      triggerShareToast('Please add at least 1 public photo');
      return;
    }
    if (!datingGoal) {
      setDatingGoalError(true);
      triggerShareToast('Please select what you are looking for (Dating Goal required)');
      return;
    }

    try {
      setIsSubmitting(true);
      await savePlumProfileMutation({
        displayName: displayName.trim(),
        age: Number(age),
        gender,
        datingPreferences,
        bio: bio.trim(),
        interests: selectedInterests,
        datingIntentions: 'relationship',
        datingGoal: datingGoal as any,
        additionalDatingInfo: additionalDatingInfo.trim() || undefined,
        broadLocation: broadLocation.trim() || 'Nearby',
        latitude: location.latitude,
        longitude: location.longitude,
        mainPhoto: mainPhoto || publicPhotos[0],
        publicPhotos,
        privatePhotos,
        showOnMap,
        profileVisibility: 'active',
      });
      triggerShareToast('Your Plum profile is ready! Welcome.');
    } catch (err: any) {
      triggerShareToast(err.message || 'Failed to create Plum profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[580px] mx-auto px-4 py-8 animate-in fade-in duration-300">
      <div className="rounded-3xl border border-pink-500/20 bg-theme-surface p-6 sm:p-8 shadow-xl shadow-pink-500/5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8E24AA] via-[#E91E63] to-[#FF4081] flex items-center justify-center text-white shadow-md shadow-pink-500/20">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-theme-primary">
              Create Your Plum Profile
            </h1>
            <p className="text-xs text-theme-secondary">
              Separate from your general LaLao profile. Confidential & customizable.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* 1. Basic Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
              1. Basic Dating Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-theme-secondary">Display Name</label>
                <input
                  id="input-plum-display-name"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How should dates call you?"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-theme-base border border-theme-divider-light text-theme-primary text-sm focus:border-pink-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-theme-secondary">Age (18+)</label>
                <input
                  id="input-plum-age"
                  type="number"
                  min={18}
                  max={100}
                  required
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value) || 18)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-theme-base border border-theme-divider-light text-theme-primary text-sm focus:border-pink-500 focus:outline-none font-bold"
                />
              </div>
            </div>
            <p className="text-[11px] text-theme-tertiary">
              Your full birth date is never displayed publicly. Only your calculated age is shown.
            </p>
          </div>

          {/* Gender Identity */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-theme-secondary">My Gender Identity</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {GENDER_OPTIONS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGender(g.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    gender === g.id
                      ? 'border-pink-500 bg-pink-500/10 text-pink-600 dark:text-pink-400 font-bold'
                      : 'border-theme-divider-light bg-theme-base text-theme-secondary hover:text-theme-primary'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dating Preferences */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-theme-secondary">Interested in Meeting</label>
            <div className="grid grid-cols-2 gap-2">
              {DATING_PREFERENCE_OPTIONS.map((pref) => {
                const selected = datingPreferences.includes(pref.id);
                return (
                  <button
                    key={pref.id}
                    type="button"
                    onClick={() => togglePreference(pref.id)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-between transition-all cursor-pointer ${
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

          {/* 2. Photo Management: Direct Device Upload + Main Profile Photo */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
                  2. Photo Management
                </h3>
                <p className="text-[10px] text-theme-secondary mt-0.5">
                  Upload photos directly from your phone or computer.
                </p>
              </div>
              <span className="text-[10px] text-theme-tertiary font-bold">
                {publicPhotos.length} Public · {privatePhotos.length} Vault
              </span>
            </div>

            {/* Hidden device file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Direct Upload Box */}
            <div className="p-3.5 rounded-2xl bg-theme-base border border-pink-500/20 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <span className="text-xs font-bold text-theme-primary flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-pink-500" /> Upload from Device
                  </span>
                  <p className="text-[10px] text-theme-secondary">
                    Supports JPEG, PNG, and WebP images.
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
                  id="btn-plum-create-upload-photo"
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

            {/* Public Photos Display */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-theme-primary flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-pink-500" /> Public Photos ({publicPhotos.length})
                </span>
                <span className="text-[10px] text-theme-tertiary">
                  Star sets main profile photo
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5 mt-2">
                {publicPhotos.map((url, idx) => {
                  const isMain = (mainPhoto === url) || (!mainPhoto && idx === 0);
                  return (
                    <div
                      key={idx}
                      className={`relative aspect-square rounded-2xl overflow-hidden border group bg-black/10 transition-all ${
                        isMain ? 'ring-2 ring-pink-500 border-pink-500 shadow-sm' : 'border-theme-divider'
                      }`}
                    >
                      <img src={url} alt={`Public ${idx + 1}`} className="w-full h-full object-cover" />
                      {isMain && (
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-pink-600/90 text-white backdrop-blur-xs flex items-center gap-0.5 shadow-xs">
                          <Star className="w-2.5 h-2.5 fill-white" /> Main
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                        {!isMain && (
                          <button
                            type="button"
                            onClick={() => handleSetMainPhoto(url)}
                            title="Set as main profile photo"
                            className="p-1.5 rounded-xl bg-pink-500 text-white hover:bg-pink-600 transition-colors cursor-pointer text-[10px] font-bold flex items-center gap-0.5"
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
            <div className="p-3.5 rounded-2xl border border-pink-500/20 bg-pink-500/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-pink-500" />
                  <span className="text-xs font-bold text-pink-600 dark:text-pink-400">
                    Private Photo Vault
                  </span>
                </div>
                <span className="text-[10px] font-bold text-pink-500">{privatePhotos.length} photos</span>
              </div>
              <p className="text-[11px] text-theme-secondary mt-1">
                Completely hidden from discovery. Only accessible to individual members you explicitly grant permission to.
              </p>

              {privatePhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2.5">
                  {privatePhotos.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-pink-500/30 group bg-black/20">
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
              )}
            </div>

            {/* Photo URL Input Form (Fallback) */}
            <div className="rounded-2xl bg-theme-base border border-theme-divider-light p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-theme-secondary">Or Add Photo by URL</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="createPhotoType"
                      checked={!isPrivateInput}
                      onChange={() => setIsPrivateInput(false)}
                      className="accent-pink-600"
                    />
                    <span className="text-[11px] text-theme-secondary">Public</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="createPhotoType"
                      checked={isPrivateInput}
                      onChange={() => setIsPrivateInput(true)}
                      className="accent-pink-600"
                    />
                    <span className="text-[11px] text-theme-secondary">Private Vault</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={photoInputUrl}
                  onChange={(e) => setPhotoInputUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="flex-1 px-3 py-2 rounded-xl bg-theme-surface border border-theme-divider-light text-theme-primary text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddPhotoByUrl}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8E24AA] to-[#E91E63] text-white text-xs font-bold hover:opacity-95 cursor-pointer shrink-0"
                >
                  Add URL
                </button>
              </div>
            </div>
          </div>

          {/* 3. REQUIRED Dating Goals Section */}
          <div className="p-4 rounded-3xl bg-theme-surface border border-pink-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
                3. Dating Goals (Required)
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-500 border border-pink-500/20">
                Required
              </span>
            </div>
            <p className="text-xs text-theme-secondary leading-relaxed">
              Tell other members what you&apos;re looking for so you can connect with people who share similar intentions.
            </p>

            {datingGoalError && !datingGoal && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-500 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Please select a dating goal to complete your profile.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {DATING_GOAL_OPTIONS.map((opt) => {
                const isSelected = datingGoal === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setDatingGoal(opt.id);
                      setDatingGoalError(false);
                    }}
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

          {/* 4. Bio */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-theme-secondary">About Me (Bio)</label>
            <textarea
              id="textarea-plum-bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What makes you smile? Share a glimpse of your personality, passions, and what you're looking for..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-theme-base border border-theme-divider-light text-theme-primary text-sm focus:border-pink-500 focus:outline-none resize-none"
            />
          </div>

          {/* Interests Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-theme-secondary">Interests & Hobbies</label>
              <span className="text-[10px] text-theme-tertiary">{selectedInterests.length}/8 chosen</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {INTERESTS_SUGGESTIONS.map((item) => {
                const isSelected = selectedInterests.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleInterest(item)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-pink-500 bg-pink-500 text-white shadow-xs font-semibold'
                        : 'border-theme-divider-light bg-theme-base text-theme-secondary hover:text-theme-primary'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            {/* Custom interest addition */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customInterest}
                onChange={(e) => setCustomInterest(e.target.value)}
                placeholder="Add custom interest..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-theme-base border border-theme-divider-light text-theme-primary text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomInterest}
                className="px-3 py-1.5 rounded-xl bg-theme-surface-active text-theme-primary text-xs font-bold hover:bg-theme-surface cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Broad Location & Map Option */}
          <div className="p-4 rounded-2xl bg-theme-base border border-theme-divider-light space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-pink-500" />
              <label className="text-xs font-bold text-theme-primary">Broad Location</label>
            </div>
            <input
              id="input-plum-broad-location"
              type="text"
              value={broadLocation}
              onChange={(e) => setBroadLocation(e.target.value)}
              placeholder="e.g. Lekki, Lagos or Warri, Delta State"
              className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-divider-light text-theme-primary text-xs focus:border-pink-500 focus:outline-none"
            />
            <label className="flex items-center justify-between text-xs cursor-pointer select-none pt-1">
              <span className="text-theme-secondary">Allow appearance on Plum Discovery Map</span>
              <input
                type="checkbox"
                checked={showOnMap}
                onChange={(e) => setShowOnMap(e.target.checked)}
                className="h-4 w-4 rounded accent-pink-600 cursor-pointer"
              />
            </label>
            <p className="text-[10px] text-theme-tertiary">
              Plum protects your safety: exact live GPS coordinates are never published. Only your safe approximate zone or radius is used.
            </p>
          </div>

          {/* Submit */}
          <button
            id="btn-plum-create-profile-submit"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#8E24AA] via-[#E91E63] to-[#FF4081] text-white font-bold text-sm shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? (
              <span>Creating your profile...</span>
            ) : (
              <>
                <span>Complete Profile & Start Dating</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
