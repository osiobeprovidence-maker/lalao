// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Check,
  MapPin,
  Camera,
  Trash2,
  Image,
  Store,
  Ticket,
  MessageSquare,
  CreditCard,
  Users
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
    featureFlags,
  } = useLalao();

  const [stage, setStage] = useState<1 | 2 | 3>(1);

  // Stage 1: Core Info
  const [type, setType] = useState<Page['type']>('business');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [category, setCategory] = useState('Cafe & Lounge');
  const [pageLocation, setPageLocation] = useState(`${location.name}, ${location.subArea}`);
  const [description, setDescription] = useState('');
  
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Stage 2: Tools
  const [activeTools, setActiveTools] = useState<string[]>(['messaging']);

  // Stage 3: Staff
  const [teamMembers, setTeamMembers] = useState<{username: string, role: string}[]>([]);
  const [newMemberUsername, setNewMemberUsername] = useState('');

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

  const handleAddMember = () => {
    if (!newMemberUsername.trim()) return;
    if (teamMembers.find(m => m.username.toLowerCase() === newMemberUsername.toLowerCase())) return;
    setTeamMembers([...teamMembers, { username: newMemberUsername.trim(), role: 'staff' }]);
    setNewMemberUsername('');
  };

  const toggleTool = (tool: string) => {
    if (activeTools.includes(tool)) {
      setActiveTools(activeTools.filter(t => t !== tool));
    } else {
      setActiveTools([...activeTools, tool]);
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
        finalAvatarUrl = 'https://images.unsplash.com/photo-1556742049-0a67e5572263?w=300&auto=format&fit=crop&q=80';
      }

      // We will create the page. In future, teamMembers & activeTools will be sent to API.
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
        triggerShareToast('Page Created Successfully!');
      } else {
        handleClose();
      }
    } catch (err: any) {
      console.error(err);
      triggerShareToast('Unable to create page. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const isStage1Valid = name.trim().length > 0 && username.trim().length > 0 && description.trim().length > 0 && pageLocation.trim().length > 0;

  const toolsList = [
    { id: 'commerce', label: 'Products & Storefront', icon: Store, desc: 'Sell physical or digital items.' },
    { id: 'ticketing', label: 'Events & Tickets', icon: Ticket, desc: 'Host events and sell tickets.' },
    { id: 'messaging', label: 'Customer Messaging', icon: MessageSquare, desc: 'Chat directly with customers.' },
    { id: 'subscriptions', label: 'Paid Memberships', icon: CreditCard, desc: 'Offer exclusive content for subscribers.' },
  ];

  return (
    <div ref={containerRef} className="w-full flex flex-col min-h-full">
      <div className="sticky top-0 z-20 bg-theme-base/95 backdrop-blur-md border-b border-theme-divider/80 px-4 py-2.5 space-y-2">
        <div className="flex items-center gap-3">
          <button
            onClick={handleClose}
            className="p-1.5 -ml-1 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-active/50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-theme-primary font-sans">
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
                    stage >= step ? 'bg-[#5E43F3] text-white' : 'bg-theme-surface-active text-theme-tertiary'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-8 h-0.5 rounded-full ${stage > step ? 'bg-[#5E43F3]' : 'bg-theme-surface-active'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <span className="text-xs font-bold text-theme-tertiary uppercase tracking-widest">
            {stage === 1 ? 'Core Info' : stage === 2 ? 'Choose Tools' : 'Team & Launch'}
          </span>
        </div>

        {/* STAGE 1: CORE INFO */}
        {stage === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Photo Upload */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-theme-primary block">Stand Photo</label>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-theme-surface border border-theme-divider">
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Uploaded" className="w-20 h-20 rounded-2xl object-cover ring-1 ring-theme-divider" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-theme-surface-hover flex items-center justify-center ring-1 ring-theme-divider">
                      <Image className="w-6 h-6 text-theme-tertiary" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} accept="image/jpeg, image/png, image/webp" className="hidden" />
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <button type="button" onClick={() => avatarInputRef.current?.click()} className="px-3 py-1.5 rounded-xl bg-theme-surface-hover text-theme-secondary text-xs font-bold hover:bg-theme-surface-active cursor-pointer">
                      {avatarUrl ? 'Change photo' : 'Upload photo'}
                    </button>
                    {avatarUrl && (
                      <button type="button" onClick={removeAvatar} className="px-3 py-1.5 rounded-xl text-red-600 text-xs font-bold hover:bg-red-50 cursor-pointer">
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-theme-primary mb-2 block">Stand Name *</label>
                <input type="text" value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Udu Lions FC" className="w-full px-4 py-3 rounded-xl border border-theme-divider text-sm bg-theme-surface focus:border-[#5E43F3] outline-none" />
              </div>
              <div>
                <label className="text-sm font-bold text-theme-primary mb-2 block">Handle *</label>
                <div className="flex items-center px-4 py-3 rounded-xl border border-theme-divider text-sm bg-theme-surface focus-within:border-[#5E43F3]">
                  <span className="text-theme-tertiary mr-0.5">@</span>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="udulions" className="w-full outline-none text-sm bg-transparent" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-theme-primary mb-2 block">Category *</label>
                <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Cafe & Lounge" className="w-full px-4 py-3 rounded-xl border border-theme-divider text-sm bg-theme-surface focus:border-[#5E43F3] outline-none" />
              </div>
              <div>
                <label className="text-sm font-bold text-theme-primary mb-2 block">Location *</label>
                <div className="flex items-center px-4 py-3 rounded-xl border border-theme-divider text-sm bg-theme-surface focus-within:border-[#5E43F3]">
                  <MapPin className="w-4 h-4 text-[#5E43F3] mr-2 shrink-0" />
                  <input type="text" value={pageLocation} onChange={(e) => setPageLocation(e.target.value)} placeholder="e.g. Udu, Delta State" className="w-full outline-none text-sm bg-transparent" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-theme-primary mb-2 block">About *</label>
              <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Briefly describe your business or community..." className="w-full px-4 py-3 rounded-xl border border-theme-divider text-sm bg-theme-surface focus:border-[#5E43F3] outline-none resize-none" />
            </div>

            <div className="pt-6 border-t border-theme-divider/80">
              <button type="button" onClick={() => setStage(2)} disabled={!isStage1Valid} className={`w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-bold float-right ${isStage1Valid ? 'bg-[#5E43F3] text-white cursor-pointer' : 'bg-theme-surface-hover text-theme-tertiary cursor-not-allowed'}`}>Continue</button>
            </div>
          </div>
        )}

        {/* STAGE 2: TOOLS */}
        {stage === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-lg font-black text-theme-primary mb-1">Choose Tools</h2>
              <p className="text-sm text-theme-tertiary">Select the features your Stand needs. You can always change these later.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {toolsList.map((tool) => {
                const isActive = activeTools.includes(tool.id);
                const Icon = tool.icon;
                return (
                  <button key={tool.id} onClick={() => toggleTool(tool.id)} className={`p-4 rounded-2xl border text-left flex flex-col justify-between cursor-pointer ${isActive ? 'border-[#5E43F3] bg-indigo-50/40 ring-1.5 ring-[#5E43F3]' : 'border-theme-divider hover:border-theme-divider-strong bg-theme-surface'}`}>
                    <div className="flex items-start justify-between w-full mb-3">
                      <div className={`p-2 rounded-xl ${isActive ? 'bg-[#5E43F3] text-white' : 'bg-theme-surface-hover text-theme-secondary'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      {isActive && (
                        <div className="w-5 h-5 rounded-full bg-[#5E43F3] text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-theme-primary">{tool.label}</h3>
                      <p className="text-xs text-theme-tertiary mt-1">{tool.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-6 border-t border-theme-divider/80 flex justify-between">
              <button type="button" onClick={() => setStage(1)} className="px-6 py-3 rounded-xl text-sm font-bold text-theme-secondary hover:bg-theme-surface-hover cursor-pointer">Back</button>
              <button type="button" onClick={() => setStage(3)} className="px-8 py-3 rounded-xl text-sm font-bold bg-[#5E43F3] text-white hover:bg-[#4E34E0] cursor-pointer">Continue</button>
            </div>
          </div>
        )}

        {/* STAGE 3: STAFF & LAUNCH */}
        {stage === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-lg font-black text-theme-primary mb-1">Invite Team (Optional)</h2>
              <p className="text-sm text-theme-tertiary">Add staff or admins to help manage your Stand.</p>
            </div>

            <div className="p-5 rounded-2xl bg-theme-surface border border-theme-divider space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-theme-secondary" />
                <h3 className="font-bold text-sm text-theme-primary">Team Members</h3>
              </div>
              
              <div className="space-y-2">
                {teamMembers.map((member, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-theme-base border border-theme-divider-light">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#5E43F3]/10 flex items-center justify-center text-[#5E43F3] font-bold text-xs uppercase">
                        {member.username.charAt(0)}
                      </div>
                      <span className="font-semibold text-sm text-theme-primary">@{member.username}</span>
                    </div>
                    <Badge type="ORG" size="sm" />
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input type="text" value={newMemberUsername} onChange={(e) => setNewMemberUsername(e.target.value)} placeholder="Username to invite..." className="flex-1 px-4 py-2 rounded-xl border border-theme-divider text-sm bg-theme-base focus:border-[#5E43F3] outline-none" />
                <button type="button" onClick={handleAddMember} disabled={!newMemberUsername.trim()} className="px-4 py-2 rounded-xl bg-theme-surface-hover text-theme-secondary font-bold text-sm hover:bg-theme-surface-active cursor-pointer disabled:opacity-50">Add</button>
              </div>
            </div>

            <div className="pt-6 border-t border-theme-divider/80 flex justify-between">
              <button type="button" onClick={() => setStage(2)} className="px-6 py-3 rounded-xl text-sm font-bold text-theme-secondary hover:bg-theme-surface-hover cursor-pointer">Back</button>
              <button type="button" onClick={handleSubmit} disabled={isUploading} className={`px-8 py-3 rounded-xl text-sm font-bold text-white transition-all cursor-pointer ${isUploading ? 'bg-[#5E43F3]/70' : 'bg-[#5E43F3] hover:bg-[#4E34E0]'}`}>
                {isUploading ? 'Creating...' : 'Launch Stand'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
