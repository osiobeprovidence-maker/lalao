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
  HelpCircle,
  Eye,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { Page } from '../../types';
import { Badge } from '../common/Badge';

export const CreatePageView: React.FC = () => {
  const {
    location,
    createPage,
    createFlowType,
    setCreateFlowType,
    setIsCreateSheetOpen,
    triggerShareToast,
  } = useLalao();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [category, setCategory] = useState('Sports Club');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<Page['type']>('club');
  const [pageLocation, setPageLocation] = useState(`${location.name}, ${location.subArea}`);
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState(
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=300&auto=format&fit=crop&q=80'
  );
  const [coverImage, setCoverImage] = useState(
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80'
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (createFlowType === 'page') {
      containerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [createFlowType]);

  if (createFlowType !== 'page') return null;

  const handleClose = () => {
    setCreateFlowType(null);
    setIsCreateSheetOpen(false);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!username || username === name.toLowerCase().replace(/[^a-z0-9]/g, '')) {
      setUsername(val.toLowerCase().replace(/[^a-z0-9]/g, ''));
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    createPage({
      name: name.trim(),
      username: username.trim() || name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      category: category.trim(),
      description: description.trim(),
      type,
      location: pageLocation.trim(),
      avatar,
      coverImage,
    });
    triggerShareToast(`Page "${name.trim()}" created successfully!`);
    handleClose();
  };

  const typesConfig: {
    type: Page['type'];
    label: string;
    badge: Page['badge'];
    desc: string;
    capabilityTag: string;
    sampleAvatar: string;
    sampleCover: string;
  }[] = [
    {
      type: 'club',
      label: 'Club / Team',
      badge: 'CLUB',
      desc: 'Football clubs, athletics, fitness teams, dance crews',
      capabilityTag: '🎟 Tickets & Tournaments',
      sampleAvatar: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=300&auto=format&fit=crop&q=80',
      sampleCover: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
    },
    {
      type: 'business',
      label: 'Local Business',
      badge: 'BIZ',
      desc: 'Stores, cafes, boutiques, eateries, professional services',
      capabilityTag: '🛍 Storefront & Orders',
      sampleAvatar: 'https://images.unsplash.com/photo-1556742049-0a67e5572263?w=300&auto=format&fit=crop&q=80',
      sampleCover: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    },
    {
      type: 'community',
      label: 'Community',
      badge: 'COMMUNITY',
      desc: 'Tech developers, creatives, student hubs, gaming guilds',
      capabilityTag: '🎟 Meetup Passes & Tickets',
      sampleAvatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&auto=format&fit=crop&q=80',
      sampleCover: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
    },
    {
      type: 'organization',
      label: 'Esports / Organization',
      badge: 'ORG',
      desc: 'Esports orgs, leagues, civic initiatives, student unions',
      capabilityTag: '🎟 Event Ticketing & Passes',
      sampleAvatar: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=300&auto=format&fit=crop&q=80',
      sampleCover: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&auto=format&fit=crop&q=80',
    },
  ];

  const quickCategories = [
    'Sports Club',
    'Football Academy',
    'Tech Community',
    'Streetwear & Fashion',
    'Cafe & Lounge',
    'Art & Photography',
    'NGO & Civic',
    'Music Band',
    'Fitness & Gym',
  ];

  const quickLocations = [
    'Udu, Delta State',
    'Enerhen, Warri',
    'Effurun, Delta State',
    'GRA Warri',
    'Airport Road, Warri',
    'PTI Road, Effurun',
    'Deco Road, Warri',
  ];

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1556742049-0a67e5572263?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&auto=format&fit=crop&q=80',
  ];

  const handleTypeSelect = (selectedType: Page['type']) => {
    setType(selectedType);
    const config = typesConfig.find((t) => t.type === selectedType);
    if (config) {
      setAvatar(config.sampleAvatar);
      setCoverImage(config.sampleCover);
      if (selectedType === 'club') setCategory('Sports Club');
      if (selectedType === 'business') setCategory('Cafe & Lounge');
      if (selectedType === 'community') setCategory('Tech Community');
      if (selectedType === 'organization') setCategory('NGO & Civic');
    }
  };

  return (
    <div
      ref={containerRef}
      id="create-page-screen"
      className="absolute inset-0 z-40 bg-white flex flex-col min-h-full overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-250"
    >
      {/* Top Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-create-page"
            type="button"
            onClick={handleClose}
            className="p-1.5 -ml-1 rounded-full text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#5E43F3]" />
              <h1 className="font-bold text-base text-neutral-950">Create Page</h1>
            </div>
            <p className="text-[11px] text-neutral-500">Launch a verified local hub</p>
          </div>
        </div>

        <button
          id="btn-submit-page-top"
          type="button"
          onClick={() => handleSubmit()}
          disabled={!name.trim() || !description.trim()}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
            name.trim() && description.trim()
              ? 'bg-[#5E43F3] text-white hover:bg-[#4E34E0] shadow-md shadow-[#5E43F3]/25 active:scale-95'
              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
          }`}
        >
          Launch Page
        </button>
      </div>

      {/* Page Form Body */}
      <div className="flex-1 max-w-xl mx-auto w-full p-4 sm:p-6 space-y-6 pb-24">
        {/* Intro Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#5E43F3]/5 via-purple-500/5 to-amber-500/5 border border-[#5E43F3]/15 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#5E43F3] text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#5E43F3]/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <h3 className="font-bold text-neutral-900">Establish your local presence</h3>
            <p className="text-neutral-600 mt-0.5 leading-relaxed">
              Pages let football clubs, local businesses, creators, and civic groups share updates, host rallies, and build a local following in Delta State.
            </p>
          </div>
        </div>

        {/* 1. Page Type & Identity Badge */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
              <span>Select Page Type & Identity Badge</span>
              <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] text-neutral-400 font-medium">Step 1 of 3</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {typesConfig.map((item) => {
              const isSelected = type === item.type;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleTypeSelect(item.type)}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-[#5E43F3] bg-indigo-50/40 ring-1.5 ring-[#5E43F3] shadow-xs'
                      : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/70 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-neutral-950">{item.label}</span>
                      <Badge type={item.badge} size="sm" />
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-[#5E43F3] text-white flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1.5 leading-relaxed">{item.desc}</p>
                  <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center">
                    <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100/90 px-2 py-0.5 rounded-md">
                      {item.capabilityTag}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Visual Identity (Avatar & Cover) */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-bold text-neutral-900 block">
            Page Avatar & Branding Photo
          </label>

          <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100">
            <div className="relative group shrink-0">
              <img
                src={avatar}
                alt="Page avatar"
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white shadow-md"
              />
              <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-neutral-800 block">Choose preset avatar</span>
              <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-none">
                {sampleAvatars.map((src, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(src)}
                    className={`shrink-0 w-8 h-8 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      avatar === src ? 'border-[#5E43F3] scale-105 ring-1 ring-[#5E43F3]' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={src} alt="Preset" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Basic Details */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-900">Page Information</span>
            <span className="text-[11px] text-neutral-400 font-medium">Step 2 of 3</span>
          </div>

          {/* Name & Handle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-neutral-700 mb-1.5 block">
                Page Name <span className="text-red-500">*</span>
              </label>
              <input
                id="input-page-name"
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Udu Lions FC"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-950 focus:border-[#5E43F3] focus:ring-1 focus:ring-[#5E43F3] outline-none transition-all"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 mb-1.5 block">
                Handle / Username <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-950 focus-within:border-[#5E43F3] focus-within:ring-1 focus-within:ring-[#5E43F3] transition-all bg-white">
                <span className="text-neutral-400 mr-0.5">@</span>
                <input
                  id="input-page-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="udulions"
                  className="w-full outline-none text-xs bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-bold text-neutral-700 mb-1.5 block">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Football Academy, Cafe, Tech Hub"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs text-neutral-900 focus:border-[#5E43F3] focus:ring-1 focus:ring-[#5E43F3] outline-none transition-all"
            />
            {/* Quick Category Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickCategories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
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

          {/* Location */}
          <div>
            <label className="text-xs font-bold text-neutral-700 mb-1.5 block">
              Location & Local Neighborhood
            </label>
            <div className="flex items-center px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-950 focus-within:border-[#5E43F3] focus-within:ring-1 focus-within:ring-[#5E43F3] transition-all bg-white">
              <MapPin className="w-3.5 h-3.5 text-[#5E43F3] mr-1.5 shrink-0" />
              <input
                type="text"
                value={pageLocation}
                onChange={(e) => setPageLocation(e.target.value)}
                placeholder="e.g. Udu, Delta State"
                className="w-full outline-none text-xs bg-transparent"
              />
            </div>
            {/* Quick Location Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickLocations.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setPageLocation(loc)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
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

          {/* About / Bio */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-neutral-700 block">
                About / Bio <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-neutral-400 font-mono">
                {description.length}/300
              </span>
            </div>
            <textarea
              id="input-page-description"
              rows={4}
              maxLength={300}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell your local community what your page is about, what you offer, meeting times, or special events..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs text-neutral-900 focus:border-[#5E43F3] focus:ring-1 focus:ring-[#5E43F3] outline-none resize-none leading-relaxed transition-all"
            />
          </div>

          {/* Optional Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-xs font-bold text-neutral-600 mb-1.5 block">
                Website or Social Link (Optional)
              </label>
              <div className="flex items-center px-3 py-2 rounded-xl border border-neutral-200 text-xs text-neutral-900 bg-white">
                <Globe className="w-3.5 h-3.5 text-neutral-400 mr-1.5" />
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                  className="w-full outline-none text-xs bg-transparent"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-600 mb-1.5 block">
                Phone or WhatsApp (Optional)
              </label>
              <div className="flex items-center px-3 py-2 rounded-xl border border-neutral-200 text-xs text-neutral-900 bg-white">
                <Phone className="w-3.5 h-3.5 text-neutral-400 mr-1.5" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234..."
                  className="w-full outline-none text-xs bg-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. Live Preview Card */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
            <Eye className="w-3.5 h-3.5 text-[#5E43F3]" />
            <span>Community Feed Preview</span>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 shadow-xs flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <img
                src={avatar}
                alt="Preview"
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-xl object-cover shrink-0 border border-neutral-200"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-bold text-xs sm:text-sm text-neutral-950 truncate">
                    {name.trim() || 'Your Page Name'}
                  </h4>
                  <Badge type={typesConfig.find((t) => t.type === type)?.badge || 'CLUB'} size="sm" />
                </div>
                <p className="text-[11px] text-neutral-500 truncate">
                  @{username.trim() || 'handle'} · {category} · {pageLocation}
                </p>
                <p className="text-xs text-neutral-700 line-clamp-2 mt-1 font-normal">
                  {description.trim() || 'Your page about/bio summary will appear here for local members in the Discover tab.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled
              className="px-3 py-1 rounded-full bg-[#5E43F3] text-white text-xs font-bold shrink-0 opacity-80"
            >
              Follow
            </button>
          </div>
        </div>

        {/* Big Bottom Action Button */}
        <div className="pt-4">
          <button
            id="btn-submit-page-bottom"
            type="button"
            onClick={() => handleSubmit()}
            disabled={!name.trim() || !description.trim()}
            className={`w-full py-3.5 px-6 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              name.trim() && description.trim()
                ? 'bg-[#5E43F3] text-white hover:bg-[#4E34E0] shadow-lg shadow-[#5E43F3]/25 active:scale-[0.99]'
                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Launch Page to Local Community</span>
          </button>
        </div>
      </div>
    </div>
  );
};
