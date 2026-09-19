import React, { useState } from 'react';
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  MapPin,
  Globe,
  Phone,
  Mail,
  Clock,
  Check,
  Building2,
  Sparkles,
} from 'lucide-react';
import { Page } from '../../types';
import { useLalao } from '../../context/LalaoContext';
import { uploadImageToCloudinary } from '../../lib/cloudinary';

interface EditPageModalProps {
  page: Page;
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
];

const CATEGORIES = [
  'Creative Studio',
  'Community & Hub',
  'Fashion & Apparel',
  'Esports & Gaming',
  'Tech & Startup',
  'Sports Club',
  'Food & Dining',
  'Music & Entertainment',
  'Education & Training',
  'Retail Store',
];

export const EditPageModal: React.FC<EditPageModalProps> = ({
  page,
  isOpen,
  onClose,
}) => {
  const { updatePage, generateCloudinarySignature, triggerShareToast } = useLalao();

  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState(page.name);
  const [username, setUsername] = useState(page.username);
  const [category, setCategory] = useState(page.category || 'Community & Hub');
  const [description, setDescription] = useState(page.description);
  const [location, setLocation] = useState(page.location || '');
  const [coverImage, setCoverImage] = useState(page.coverImage);
  const [avatar, setAvatar] = useState(page.avatar);

  // About Info fields
  const [address, setAddress] = useState(page.aboutInfo?.address || '');
  const [phone, setPhone] = useState(page.aboutInfo?.phone || '');
  const [email, setEmail] = useState(page.aboutInfo?.email || '');
  const [website, setWebsite] = useState(page.aboutInfo?.website || '');
  const [hours, setHours] = useState(page.aboutInfo?.hours || '');

  const [showCoverSelector, setShowCoverSelector] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSaving(true);
      let finalCoverImage = coverImage;
      let finalAvatar = avatar;

      if (coverImageFile) {
        const signatureData = await generateCloudinarySignature("pages");
        finalCoverImage = await uploadImageToCloudinary(coverImageFile, signatureData);
      }
      
      if (avatarFile) {
        const signatureData = await generateCloudinarySignature("pages");
        finalAvatar = await uploadImageToCloudinary(avatarFile, signatureData);
      }

      await updatePage(page.id, {
        name: name.trim(),
        username: username.trim().replace('@', ''),
        category,
        description: description.trim(),
        location: location.trim(),
        coverImage: finalCoverImage,
        avatar: finalAvatar,
        aboutInfo: {
          address: address.trim(),
          phone: phone.trim(),
          email: email.trim(),
          website: website.trim().replace(/^https?:\/\//, ''),
          hours: hours.trim(),
        },
      });

      onClose();
    } catch (error) {
      console.error("Failed to save page:", error);
      triggerShareToast("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCustomCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCoverImage(url);
      setCoverImageFile(file);
      setShowCoverSelector(false);
    }
  };

  const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatar(url);
      setAvatarFile(file);
      setShowAvatarSelector(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-white overflow-y-auto flex flex-col animate-in fade-in slide-in-from-right-4 duration-250">
      {/* Top Sticky App Bar */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 sm:px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-neutral-100 text-neutral-800 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="text-base font-black text-neutral-950">Edit Page Profile</h3>
            <p className="text-xs text-neutral-500 font-medium truncate max-w-[180px] sm:max-w-md">
              @{page.username} · Manage branding & contact details
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 rounded-xl bg-[#5E43F3] text-white text-xs font-bold hover:bg-[#4E34E0] disabled:opacity-50 shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          {isSaving ? (
            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <Check className="w-4 h-4 stroke-[2.5]" />
          )}
          <span>{isSaving ? 'Saving...' : 'Save'}</span>
        </button>
      </div>

      {/* Page Content Container */}
      <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 pb-24 flex-1">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Visual Branding Section: Cover & Avatar with Upload Controls */}
          <div className="bg-neutral-50/80 p-4 sm:p-5 rounded-2xl border border-neutral-100 space-y-4">
            <label className="text-xs font-black uppercase tracking-wider text-neutral-500 block">
              Visual Branding
            </label>
            
            {/* Cover Image Container */}
            <div className="relative h-44 sm:h-52 rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-200 group">
              <img
                src={coverImage}
                alt="Page Cover Preview"
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCoverSelector(!showCoverSelector)}
                  className="px-3.5 py-2 rounded-full bg-white/90 hover:bg-white text-neutral-900 text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[#5E43F3]" />
                  <span>Choose Cover</span>
                </button>
                <label className="px-3.5 py-2 rounded-full bg-black/70 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCustomCoverUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Cover Presets Dropdown Tray */}
            {showCoverSelector && (
              <div className="p-3 bg-white rounded-xl border border-neutral-200 animate-in fade-in">
                <p className="text-[11px] font-bold text-neutral-500 mb-2">Select a preset cover banner:</p>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_COVERS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setCoverImage(url);
                        setCoverImageFile(null);
                        setShowCoverSelector(false);
                      }}
                      className={`relative h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        coverImage === url ? 'border-[#5E43F3] scale-[1.02]' : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                      {coverImage === url && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-[#5E43F3] text-white rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Avatar Preview & Changer */}
            <div className="flex items-center gap-4 pt-2">
              <div className="relative group shrink-0">
                <img
                  src={avatar}
                  alt="Page Avatar Preview"
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-4 ring-white shadow-md bg-neutral-100"
                />
                <button
                  type="button"
                  onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                  className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Change avatar"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                    className="text-xs font-bold text-[#5E43F3] hover:underline cursor-pointer"
                  >
                    Select Avatar Preset
                  </button>
                  <span className="text-neutral-300">·</span>
                  <label className="text-xs font-bold text-neutral-600 hover:text-neutral-900 cursor-pointer">
                    Upload Custom
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCustomAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Recommended: 400x400px square logo or photo
                </p>
              </div>
            </div>

            {/* Avatar Presets */}
            {showAvatarSelector && (
              <div className="p-3 bg-white rounded-xl border border-neutral-200 animate-in fade-in flex items-center gap-2 overflow-x-auto">
                {PRESET_AVATARS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setAvatar(url);
                      setAvatarFile(null);
                      setShowAvatarSelector(false);
                    }}
                    className={`relative w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      avatar === url ? 'border-[#5E43F3] ring-2 ring-[#5E43F3]/20' : 'border-neutral-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Avatar preset ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Core Info */}
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-wider text-neutral-500 block">
              Basic Details
            </label>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Page Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Delta Creators Lab"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Username Handle *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm text-neutral-400 font-semibold">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    required
                    placeholder="deltacreators"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Primary Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5E43F3] bg-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                About / Bio Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Tell your audience who you are, what you do, and what they can discover here..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Primary City / Base Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Asaba, Delta State"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]"
                />
              </div>
            </div>
          </div>

          {/* Contact & Physical Details Section */}
          <div className="space-y-4 pt-2">
            <label className="text-xs font-black uppercase tracking-wider text-neutral-500 block">
              Contact & Business Info
            </label>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Physical Street Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 14 Okpanam Road, GRA Phase 1"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Phone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 803 123 4567"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Inquiry Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@page.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Website
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="deltacreators.africa"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Operating Hours
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="Mon - Fri: 8:00 AM - 8:00 PM"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-6 border-t border-neutral-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#5E43F3] text-white text-xs font-bold hover:bg-[#4E34E0] shadow-md shadow-[#5E43F3]/25 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
