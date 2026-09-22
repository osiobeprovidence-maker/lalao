// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  Check,
  MapPin,
  Sparkles,
  Camera,
  Globe,
  Phone,
  Eye,
  ImagePlus,
  Trash2,
  Image,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { Page } from '../../types';
import { Badge } from '../common/Badge';
import { uploadImageToCloudinary } from '../../lib/cloudinary';

export const CreatePageView: React.FC = () => {
  const {
    location,
    createPage,
    setActiveTab,
    triggerShareToast,
    generateCloudinarySignature,
    setActivePageId,
  } = useLalao();

  const [stage, setStage] = useState<1 | 2 | 3>(1);

  // Stage 1
  const [type, setType] = useState<Page['type']>('club');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Stage 2
  const [category, setCategory] = useState('Sports Club');
  const [description, setDescription] = useState('');
  const [pageLocation, setPageLocation] = useState(`${location.name}, ${location.subArea}`);
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [stage]);

  const handleClose = () => {
    setActiveTab('discover');
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!username || username === name.toLowerCase().replace(/[^a-z0-9]/g, '')) {
      setUsername(val.toLowerCase().replace(/[^a-z0-9]/g, ''));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        triggerShareToast('Please select a valid image file');
        return;
      }
      if (avatarUrl && avatarUrl.startsWith('blob:')) {
        URL.revokeObjectURL(avatarUrl);
      }
      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  const removeAvatar = () => {
    if (avatarUrl.startsWith('blob:')) {
      URL.revokeObjectURL(avatarUrl);
    }
    setAvatarFile(null);
    setAvatarUrl('');
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    try {
      setIsUploading(true);
      let finalAvatarUrl = avatarUrl;
      let finalCoverImage = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80';

      if (avatarFile) {
        const signatureData = await generateCloudinarySignature("pages");
        finalAvatarUrl = await uploadImageToCloudinary(avatarFile, signatureData);
      } else if (!finalAvatarUrl) {
        const config = typesConfig.find(t => t.type === type);
        finalAvatarUrl = config?.sampleAvatar || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=300&auto=format&fit=crop&q=80';
      }

      const newPageId = await createPage({
        name: name.trim(),
        username: username.trim() || name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        category: category.trim(),
        description: description.trim(),
        type,
        location: pageLocation.trim(),
        avatar: finalAvatarUrl,
        coverImage: finalCoverImage,
      });
      if (newPageId) {
        setActiveTab('home');
        setActivePageId(newPageId);
      } else {
        handleClose();
      }
    } catch (err: any) {
      console.error("Create page failed at Cloudinary signature generation:", err.data || err.message || err);
      triggerShareToast('Unable to create page. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const typesConfig: {
    type: Page['type'];
    label: string;
    badge: Page['badge'];
    desc: string;
    capabilityTag: string;
    sampleAvatar: string;
  }[] = [
    {
      type: 'club',
      label: 'Club / Team',
      badge: 'CLUB',
      desc: 'Football clubs, athletics, fitness teams, dance crews',
      capabilityTag: '🎟 Tickets & Tournaments',
      sampleAvatar: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=300&auto=format&fit=crop&q=80',
    },
    {
      type: 'business',
      label: 'Local Business',
      badge: 'BIZ',
      desc: 'Stores, cafes, boutiques, eateries, professional services',
      capabilityTag: '🛍 Storefront & Orders',
      sampleAvatar: 'https://images.unsplash.com/photo-1556742049-0a67e5572263?w=300&auto=format&fit=crop&q=80',
    },
    {
      type: 'community',
      label: 'Community',
      badge: 'COMMUNITY',
      desc: 'Tech developers, creatives, student hubs, gaming guilds',
      capabilityTag: '🎟 Meetup Passes & Tickets',
      sampleAvatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&auto=format&fit=crop&q=80',
    },
    {
      type: 'organization',
      label: 'Esports / Organization',
      badge: 'ORG',
      desc: 'Esports orgs, leagues, civic initiatives, student unions',
      capabilityTag: '🎟 Event Ticketing & Passes',
      sampleAvatar: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=300&auto=format&fit=crop&q=80',
    },
  ];

  const quickCategories = [
    'Sports Club', 'Football Academy', 'Tech Community',
    'Streetwear & Fashion', 'Cafe & Lounge', 'Art & Photography',
    'NGO & Civic', 'Music Band', 'Fitness & Gym',
  ];

  const quickLocations = [
    'Udu, Delta State', 'Enerhen, Warri', 'Effurun, Delta State',
    'GRA Warri', 'Airport Road, Warri', 'PTI Road, Effurun', 'Deco Road, Warri',
  ];

  const handleTypeSelect = (selectedType: Page['type']) => {
    setType(selectedType);
    if (selectedType === 'club') setCategory('Sports Club');
    if (selectedType === 'business') setCategory('Cafe & Lounge');
    if (selectedType === 'community') setCategory('Tech Community');
    if (selectedType === 'organization') setCategory('NGO & Civic');
  };

  const isStage1Valid = name.trim().length > 0 && username.trim().length > 0;
  const isStage2Valid = description.trim().length > 0 && pageLocation.trim().length > 0 && category.trim().length > 0;

  return (
    <div ref={containerRef} className="w-full flex flex-col min-h-full">
      {/* Top Header - Using standard app layout style */}
      <div className="sticky top-0 z-20 bg-[#f6f3ee]/95 backdrop-blur-md border-b border-neutral-200/80 px-4 py-2.5 space-y-2">
        <div className="flex items-center gap-3">
          <button
            onClick={handleClose}
            className="p-1.5 -ml-1 rounded-full text-neutral-700 hover:text-neutral-950 hover:bg-neutral-200/50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-neutral-950 font-sans">
              Create a Stand
            </h1>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full max-w-[680px] mx-auto px-4 py-6 pb-24">
        {/* Progress Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    stage >= step ? 'bg-[#5E43F3] text-white' : 'bg-neutral-200 text-neutral-500'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-8 h-0.5 rounded-full ${stage > step ? 'bg-[#5E43F3]' : 'bg-neutral-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
            {stage === 1 ? 'Identity' : stage === 2 ? 'Local Presence' : 'Review'}
          </span>
        </div>

        {/* STAGE 1: IDENTITY */}
        {stage === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Page Type */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-neutral-900 block">
                Select Stand Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {typesConfig.map((item) => {
                  const isSelected = type === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => handleTypeSelect(item.type)}
                      className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'border-[#5E43F3] bg-indigo-50/40 ring-1.5 ring-[#5E43F3] shadow-xs'
                          : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/70 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between w-full">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-neutral-950">{item.label}</span>
                          <Badge type={item.badge} size="sm" />
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#5E43F3] text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 mt-2 leading-relaxed">{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Photo Upload */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-neutral-900 block">
                Stand Photo
              </label>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-neutral-200">
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Uploaded"
                      className="w-20 h-20 rounded-2xl object-cover ring-1 ring-neutral-200"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-neutral-100 flex items-center justify-center ring-1 ring-neutral-200">
                      <Image className="w-6 h-6 text-neutral-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={handleAvatarChange}
                    accept="image/jpeg, image/png, image/webp"
                    className="hidden"
                  />
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-neutral-100 text-neutral-700 text-xs font-bold hover:bg-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      {avatarUrl ? 'Change photo' : 'Upload photo'}
                    </button>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={removeAvatar}
                        className="px-3 py-1.5 rounded-xl text-red-600 text-xs font-bold hover:bg-red-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-2">
                    JPG, PNG, or WebP. Max 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Name & Handle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-neutral-900 mb-2 block">
                  Stand Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Udu Lions FC"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-950 focus:border-[#5E43F3] focus:ring-1 focus:ring-[#5E43F3] outline-none transition-all bg-white"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-neutral-900 mb-2 block">
                  Handle <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center px-4 py-3 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-950 focus-within:border-[#5E43F3] focus-within:ring-1 focus-within:ring-[#5E43F3] transition-all bg-white">
                  <span className="text-neutral-400 mr-0.5">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="udulions"
                    className="w-full outline-none text-sm bg-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-neutral-200/80">
              <button
                type="button"
                onClick={() => setStage(2)}
                disabled={!isStage1Valid}
                className={`w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-bold transition-all float-right cursor-pointer ${
                  isStage1Valid
                    ? 'bg-[#5E43F3] text-white hover:bg-[#4E34E0] shadow-md shadow-[#5E43F3]/25'
                    : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2: LOCAL PRESENCE */}
        {stage === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Location */}
            <div>
              <label className="text-sm font-bold text-neutral-900 mb-2 block">
                Location <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center px-4 py-3 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-950 focus-within:border-[#5E43F3] focus-within:ring-1 focus-within:ring-[#5E43F3] transition-all bg-white">
                <MapPin className="w-4 h-4 text-[#5E43F3] mr-2 shrink-0" />
                <input
                  type="text"
                  value={pageLocation}
                  onChange={(e) => setPageLocation(e.target.value)}
                  placeholder="e.g. Udu, Delta State"
                  className="w-full outline-none text-sm bg-transparent"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {quickLocations.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setPageLocation(loc)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      pageLocation === loc
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-bold text-neutral-900 mb-2 block">
                Category <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Football Academy, Cafe, Tech Hub"
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm text-neutral-900 focus:border-[#5E43F3] focus:ring-1 focus:ring-[#5E43F3] outline-none transition-all bg-white"
              />
              <div className="flex flex-wrap gap-2 mt-3">
                {quickCategories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      category === c
                        ? 'bg-[#5E43F3] text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* About */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-neutral-900 block">
                  About your Stand <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-neutral-400 font-mono">
                  {description.length}/300
                </span>
              </div>
              <textarea
                rows={4}
                maxLength={300}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell your local community what your Stand is about, what you offer, meeting times, or special events..."
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm text-neutral-900 focus:border-[#5E43F3] focus:ring-1 focus:ring-[#5E43F3] outline-none resize-none leading-relaxed transition-all bg-white"
              />
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-neutral-900 mb-2 block">
                  Website / Social (Optional)
                </label>
                <div className="flex items-center px-4 py-3 rounded-xl border border-neutral-200 text-sm text-neutral-900 bg-white">
                  <Globe className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full outline-none text-sm bg-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-neutral-900 mb-2 block">
                  Phone / WhatsApp (Optional)
                </label>
                <div className="flex items-center px-4 py-3 rounded-xl border border-neutral-200 text-sm text-neutral-900 bg-white">
                  <Phone className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234..."
                    className="w-full outline-none text-sm bg-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-neutral-200/80 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStage(1)}
                className="px-6 py-3 rounded-xl text-sm font-bold text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStage(3)}
                disabled={!isStage2Valid}
                className={`px-8 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  isStage2Valid
                    ? 'bg-[#5E43F3] text-white hover:bg-[#4E34E0] shadow-md shadow-[#5E43F3]/25'
                    : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STAGE 3: REVIEW & LAUNCH */}
        {stage === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-lg font-black text-neutral-900 mb-1">Review your Stand</h2>
              <p className="text-sm text-neutral-500">This is how your Stand will appear in the local feed and discovery pages.</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <img
                  src={avatarUrl || typesConfig.find((t) => t.type === type)?.sampleAvatar}
                  alt="Preview"
                  className="w-14 h-14 rounded-xl object-cover border border-neutral-100 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-base text-neutral-900 truncate">{name}</h3>
                    <Badge type={typesConfig.find((t) => t.type === type)?.badge || 'CLUB'} size="sm" />
                  </div>
                  <p className="text-xs text-neutral-500 truncate mb-1">
                    @{username} · {category} · {pageLocation}
                  </p>
                  <p className="text-sm text-neutral-700 line-clamp-3 leading-relaxed mt-2 bg-neutral-50 p-3 rounded-xl">
                    {description}
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  disabled
                  className="w-full sm:w-auto px-6 py-2 rounded-xl bg-neutral-900 text-white text-xs font-bold opacity-80"
                >
                  Follow Stand
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-neutral-900">Identity & Branding</h4>
                  <p className="text-xs text-neutral-500 mt-0.5 truncate">{name}, @{username}, {typesConfig.find(t => t.type === type)?.label}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStage(1)}
                  className="text-xs font-bold text-[#5E43F3] hover:underline cursor-pointer shrink-0 ml-4"
                >
                  Edit
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-neutral-900">Local Presence</h4>
                  <p className="text-xs text-neutral-500 mt-0.5 truncate">{pageLocation}, {category}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStage(2)}
                  className="text-xs font-bold text-[#5E43F3] hover:underline cursor-pointer shrink-0 ml-4"
                >
                  Edit
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-neutral-200/80 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStage(2)}
                className="px-6 py-3 rounded-xl text-sm font-bold text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isUploading}
                className="px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 bg-[#5E43F3] text-white hover:bg-[#4E34E0] shadow-md shadow-[#5E43F3]/25 active:scale-95 disabled:opacity-70 cursor-pointer"
              >
                {isUploading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Building2 className="w-4 h-4" />
                )}
                <span>Launch Page</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
