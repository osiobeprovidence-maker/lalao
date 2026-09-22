import React, { useEffect, useRef, useState } from 'react';
import {
  Image as ImageIcon,
  Loader2,
  MapPin,
  Sparkles,
  Video,
  X,
  ChevronDown,
  Globe,
  Users,
  Smile,
  BarChart2,
  Calendar,
  Hash,
  Briefcase,
  FileText
} from 'lucide-react';
import { useAction, useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';
import { Popover } from '../common/Popover';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { uploadImageToCloudinary } from '../../lib/cloudinary';

const MAX_CHARS = 280;

interface PostComposerProps {
  embedded?: boolean;
  onClose?: () => void;
  initialAudience?: string;
  onSuccess?: () => void;
}

function PostComposerInner({ embedded = false, onClose, initialAudience = 'everyone', onSuccess }: PostComposerProps) {
  const {
    currentUser,
    pages,
    location,
    createPost,
    saveDraft,
    getDrafts,
    setCreateFlowType,
    setIsCreateSheetOpen,
    setIsLocationModalOpen,
    setActiveTab,
    triggerShareToast,
    generateCloudinarySignature,
  } = useLalao();

  const generateUploadUrl = useMutation(api.social.generateUploadUrl);
  const createMuxDirectUpload = useAction(api.mux.createDirectUpload);
  const pollMuxStatus = useAction(api.mux.pollAndUpdatePost);

  // States
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [attachedLocation, setAttachedLocation] = useState<string | null>(location.name || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New features states
  const [audience, setAudience] = useState('everyone');
  const [showAudienceDropdown, setShowAudienceDropdown] = useState(false);
  const [audienceStep, setAudienceStep] = useState<'main' | 'communities' | 'pages' | 'topics'>('main');
  const [selectedPageRefId, setSelectedPageRefId] = useState<string | null>(null);
  const [selectedTopicSlugs, setSelectedTopicSlugs] = useState<string[]>([]);
  const [replyPermission, setReplyPermission] = useState('everyone');
  const [showReplyDropdown, setShowReplyDropdown] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>([]);
  const [showPoll, setShowPoll] = useState(false);
  
  // Data for audience
  const topicsData = useQuery(api.topics.listActiveTopics, currentUser ? {} : ('skip' as any));
  const followedCommunities = useQuery(api.pages.getMyFollowedCommunities, currentUser ? {} : ('skip' as any));

  // Real drafts check
  const draftsData = useQuery(api.social.getDrafts, currentUser ? {} : ('skip' as any));
  const hasDrafts = Boolean(draftsData && draftsData.length > 0);
  const [showDraftsModal, setShowDraftsModal] = useState(false);

  // File pickers
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (mediaUrl.startsWith('blob:')) {
        URL.revokeObjectURL(mediaUrl);
      }
    };
  }, [mediaUrl]);

  const resetComposer = () => {
    if (mediaUrl.startsWith('blob:')) {
      URL.revokeObjectURL(mediaUrl);
    }
    setText('');
    setSelectedFile(null);
    setMediaUrl('');
    setMediaType('image');
    setAttachedLocation(location.name || null);
    setAudience('everyone');
    setSelectedPageRefId(null);
    setSelectedTopicSlugs([]);
    setAudienceStep('main');
    setReplyPermission('everyone');
    setShowPoll(false);
    setPollQuestion('');
    setPollOptions([]);
    setCreateFlowType(null);
    setIsCreateSheetOpen(false);
    if (embedded) setActiveTab('home');
    if (onClose) onClose();
  };

  const hasDraftContent = Boolean(text.trim() || selectedFile || pollQuestion.trim());

  const handleClose = async () => {
    if (hasDraftContent) {
      if (window.confirm('Save as draft?')) {
        try {
          await saveDraft({
            text,
            audience,
            replyPermission,
            pollQuestion: showPoll ? pollQuestion : undefined,
            pollOptions: showPoll ? pollOptions : undefined,
            pageRefId: selectedPageRefId || undefined,
          });
          triggerShareToast('Draft saved!');
        } catch (err) {
          console.error(err);
        }
      }
    }
    resetComposer();
  };

  const handleFileSelect = (file: File | null, kind: 'image' | 'video') => {
    if (!file) return;
    if (mediaUrl.startsWith('blob:')) {
      URL.revokeObjectURL(mediaUrl);
    }
    setSelectedFile(file);
    setMediaType(kind);
    setMediaUrl(URL.createObjectURL(file));
  };

  const generateVideoPoster = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = URL.createObjectURL(file);
      video.currentTime = 0.5;
      video.muted = true;
      video.playsInline = true;
      video.onloadeddata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          URL.revokeObjectURL(video.src);
          resolve(dataUrl);
        } else {
          URL.revokeObjectURL(video.src);
          resolve('');
        }
      };
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve('');
      };
    });

  const uploadFileWithProgress = (
    url: string,
    method: 'PUT' | 'POST',
    file: File,
    onProgress: (pct: number) => void
  ): Promise<any> =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(xhr.responseText ? JSON.parse(xhr.responseText) : {});
          } catch {
            resolve({});
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(file);
    });

  const handleSubmit = async () => {
    if (!text.trim() && !selectedFile && !pollQuestion.trim()) return;
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      let finalMediaUrl = mediaUrl;
      let finalMediaStorageId: string | undefined;
      let finalMuxUploadId: string | undefined;

      if (selectedFile) {
        if (mediaType === 'video') {
          try {
            const posterUrl = await generateVideoPoster(selectedFile);
            const { upload_url, upload_id } = await createMuxDirectUpload();
            await uploadFileWithProgress(upload_url, 'PUT', selectedFile, () => undefined);
            finalMuxUploadId = upload_id;
            finalMediaUrl = posterUrl || mediaUrl;
          } catch (muxErr) {
            console.error('[Lalao Media Upload] Mux upload failed, falling back to storage:', muxErr);
            try {
              const uploadUrl = await generateUploadUrl();
              const res = await uploadFileWithProgress(uploadUrl, 'POST', selectedFile, () => undefined);
              finalMediaStorageId = res.storageId;
              finalMediaUrl = '';
            } catch (fallbackErr) {
              console.error('[Lalao Media Upload] Video upload failed. All upload methods failed:', fallbackErr);
              triggerShareToast('Video upload failed. Check your connection and try again.');
              setIsSubmitting(false);
              return;
            }
          }
        } else {
          try {
            const uploadUrl = await generateUploadUrl();
            const res = await uploadFileWithProgress(uploadUrl, 'POST', selectedFile, () => undefined);
            finalMediaStorageId = res.storageId;
            finalMediaUrl = '';
          } catch (storageErr) {
            console.warn('[Lalao Media Upload] Storage upload failed; falling back to Cloudinary:', storageErr);
            try {
              const sig = await generateCloudinarySignature('posts');
              finalMediaUrl = await uploadImageToCloudinary(selectedFile, sig);
            } catch (cloudErr) {
              console.error('[Lalao Media Upload] Image upload failed:', cloudErr);
              triggerShareToast('Image upload failed. Please try again.');
              setIsSubmitting(false);
              return;
            }
          }
        }
      }

      const created = await createPost({
        text: text.trim(),
        mediaUrl: finalMediaUrl || undefined,
        mediaStorageId: finalMediaStorageId,
        mediaType,
        location: attachedLocation || location.name || 'Local',
        audience,
        replyPermission,
        pollQuestion: showPoll ? pollQuestion.trim() : undefined,
        pollOptions: showPoll ? pollOptions.filter(o => o.trim() !== '') : undefined,
        pageRefId: selectedPageRefId || undefined,
        contentTopics: selectedTopicSlugs.length > 0 ? selectedTopicSlugs : undefined,
      });

      if (finalMuxUploadId && created?.id) {
        pollMuxStatus({ postId: created.id as any, uploadId: finalMuxUploadId }).catch(() => undefined);
      }

      triggerShareToast('Post published!');
      resetComposer();
    } catch (err: any) {
      console.error('Post submit failed:', err);
      triggerShareToast(err?.message || 'Failed to publish post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAudienceLabel = () => {
    if (audience === 'community' && selectedPageRefId) {
      const comm = followedCommunities?.find((c: any) => c._id === selectedPageRefId);
      if (comm) return comm.name;
    }
    if (audience === 'page' && selectedPageRefId) {
      const pg = pages?.find((p: any) => p._id === selectedPageRefId);
      if (pg) return pg.name;
    }
    if (audience === 'interest' && selectedTopicSlugs.length > 0) {
      const top = topicsData?.find((t: any) => t.slug === selectedTopicSlugs[0]);
      if (top) return top.displayName;
    }

    switch (audience) {
      case 'everyone': return 'Everyone';
      case 'nearby': return 'Nearby';
      case 'community': return 'Communities';
      case 'interest': return 'Interests & Topics';
      case 'page': return 'Page';
      default: return 'Everyone';
    }
  };

  const renderAudienceSelector = () => {
    if (audienceStep === 'communities') {
      return (
        <div className="p-2 w-64">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-neutral-100">
            <button onClick={() => setAudienceStep('main')} className="p-1 hover:bg-neutral-100 rounded-full"><ChevronDown className="w-4 h-4 rotate-90" /></button>
            <span className="font-semibold text-sm">Select Community</span>
          </div>
          {followedCommunities === undefined ? <div className="p-4 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto text-neutral-400" /></div> :
           followedCommunities.length === 0 ? <div className="p-4 text-center text-xs text-neutral-500">No communities joined.</div> :
           followedCommunities.map((c: any) => (
             <button key={c._id} onClick={() => { setAudience('community'); setSelectedPageRefId(c._id); setShowAudienceDropdown(false); setAudienceStep('main'); }} className="w-full text-left px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-100 rounded-lg flex items-center gap-2">
               <Avatar src={c.avatar || ''} alt={c.name} size="sm" />
               <span className="font-semibold truncate">{c.name}</span>
             </button>
           ))
          }
        </div>
      );
    }
    
    if (audienceStep === 'pages') {
      const myOwnedPages = pages?.filter((p: any) => p.type !== 'community') || [];
      return (
        <div className="p-2 w-64">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-neutral-100">
            <button onClick={() => setAudienceStep('main')} className="p-1 hover:bg-neutral-100 rounded-full"><ChevronDown className="w-4 h-4 rotate-90" /></button>
            <span className="font-semibold text-sm">Post as Page</span>
          </div>
          {myOwnedPages.length === 0 ? <div className="p-4 text-center text-xs text-neutral-500">No eligible Pages.</div> :
           myOwnedPages.map((p: any) => (
             <button key={p._id} onClick={() => { setAudience('page'); setSelectedPageRefId(p._id); setShowAudienceDropdown(false); setAudienceStep('main'); }} className="w-full text-left px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-100 rounded-lg flex items-center gap-2">
               <Avatar src={p.avatar || ''} alt={p.name} size="sm" />
               <span className="font-semibold truncate">{p.name}</span>
             </button>
           ))
          }
        </div>
      );
    }

    if (audienceStep === 'topics') {
      return (
        <div className="p-2 w-64">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-neutral-100">
            <button onClick={() => setAudienceStep('main')} className="p-1 hover:bg-neutral-100 rounded-full"><ChevronDown className="w-4 h-4 rotate-90" /></button>
            <span className="font-semibold text-sm">Select Topic</span>
          </div>
          {topicsData === undefined ? <div className="p-4 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto text-neutral-400" /></div> :
           topicsData.length === 0 ? <div className="p-4 text-center text-xs text-neutral-500">No topics available.</div> :
           topicsData.map((t: any) => (
             <button key={t.slug} onClick={() => { setAudience('interest'); setSelectedTopicSlugs([t.slug]); setShowAudienceDropdown(false); setAudienceStep('main'); }} className="w-full text-left px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-100 rounded-lg flex items-center gap-2">
               <Hash className="w-4 h-4 text-neutral-500" />
               <span className="font-semibold truncate">{t.displayName}</span>
             </button>
           ))
          }
        </div>
      );
    }

    // Main step
    const hasPages = pages && pages.some((p: any) => p.type !== 'community');
    
    return (
      <div className="p-2 w-64">
        <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-2 py-1 mb-1">Choose Audience</div>
        <button onClick={() => { setAudience('everyone'); setSelectedPageRefId(null); setSelectedTopicSlugs([]); setShowAudienceDropdown(false); }} className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 rounded-lg flex items-center gap-2 ${audience === 'everyone' ? 'bg-[#5E43F3]/5 text-[#5E43F3]' : 'text-neutral-800'}`}>
          <Globe className="w-4 h-4" />
          <div>
            <div className="font-semibold">Everyone</div>
            <div className="text-[10px] opacity-70">Public algorithmic feed</div>
          </div>
        </button>
        <button onClick={() => { setAudience('nearby'); setSelectedPageRefId(null); setSelectedTopicSlugs([]); setShowAudienceDropdown(false); }} className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 rounded-lg flex items-center gap-2 ${audience === 'nearby' ? 'bg-[#5E43F3]/5 text-[#5E43F3]' : 'text-neutral-800'}`}>
          <MapPin className="w-4 h-4" />
          <div>
            <div className="font-semibold">Nearby</div>
            <div className="text-[10px] opacity-70">Local feed for your selected area</div>
          </div>
        </button>
        <button onClick={() => setAudienceStep('communities')} className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 rounded-lg flex items-center gap-2 ${audience === 'community' ? 'bg-[#5E43F3]/5 text-[#5E43F3]' : 'text-neutral-800'}`}>
          <Users className="w-4 h-4" />
          <div className="flex-1">
            <div className="font-semibold">Communities</div>
            <div className="text-[10px] opacity-70">Post to a specific community</div>
          </div>
          <ChevronDown className="w-4 h-4 -rotate-90 opacity-50" />
        </button>
        <button onClick={() => setAudienceStep('topics')} className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 rounded-lg flex items-center gap-2 ${audience === 'interest' ? 'bg-[#5E43F3]/5 text-[#5E43F3]' : 'text-neutral-800'}`}>
          <Hash className="w-4 h-4" />
          <div className="flex-1">
            <div className="font-semibold">Interests & Topics</div>
            <div className="text-[10px] opacity-70">Post to a specific topic or interest</div>
          </div>
          <ChevronDown className="w-4 h-4 -rotate-90 opacity-50" />
        </button>
        {hasPages && (
          <button onClick={() => setAudienceStep('pages')} className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 rounded-lg flex items-center gap-2 ${audience === 'page' ? 'bg-[#5E43F3]/5 text-[#5E43F3]' : 'text-neutral-800'}`}>
            <Briefcase className="w-4 h-4" />
            <div className="flex-1">
              <div className="font-semibold">Post as Page</div>
              <div className="text-[10px] opacity-70">Post as your eligible Page</div>
            </div>
            <ChevronDown className="w-4 h-4 -rotate-90 opacity-50" />
          </button>
        )}
      </div>
    );
  };
  
  const getReplyLabel = () => {
    switch (replyPermission) {
      case 'everyone': return 'Everyone';
      case 'followers': return 'Followers';
      case 'following': return 'Following';
      case 'friends': return 'Friends';
      case 'closeFriends': return 'Close Friends';
      case 'sameInterests': return 'Same Interests';
      case 'mentioned': return 'Mentioned';
      default: return 'Everyone';
    }
  };

  return (
    <div className="mx-auto w-full max-w-[600px] px-3 py-4 sm:px-5 sm:py-6">
      <div className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-sm flex flex-col relative">
        
        {/* TOP BAR: Avatar, Audience, Drafts, Close */}
        <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <Avatar src={currentUser.avatar} alt={currentUser.name} size="sm" />
            <Popover
              isOpen={showAudienceDropdown}
              onClose={() => { setShowAudienceDropdown(false); setAudienceStep('main'); }}
              width={256}
              trigger={
                <button 
                  onClick={() => setShowAudienceDropdown(!showAudienceDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-200 text-sm font-semibold text-[#5E43F3] hover:bg-[#5E43F3]/5 transition max-w-[200px]"
                >
                  <span className="truncate">{getAudienceLabel()}</span>
                  <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                </button>
              }
              content={renderAudienceSelector()}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowDraftsModal(true)}
              className="text-sm font-semibold text-[#5E43F3] hover:underline"
            >
              Drafts {hasDrafts && <span className="text-xs bg-[#5E43F3] text-white px-1.5 py-0.5 rounded-full ml-1">{draftsData?.length}</span>}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
              aria-label="Close composer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* COMPOSER AREA */}
        <div className="px-4 py-3 min-h-[120px]">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="What’s on your mind?"
            className="w-full resize-none bg-transparent text-[16px] leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
            autoFocus
          />

          {showPoll && (
            <div className="mt-2 rounded-xl border border-neutral-200 p-3 space-y-2">
              <input 
                value={pollQuestion}
                onChange={e => setPollQuestion(e.target.value)}
                placeholder="Ask a question..."
                className="w-full text-sm font-semibold p-2 rounded-md border border-neutral-200 focus:outline-none focus:border-[#5E43F3]"
              />
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input 
                    value={opt}
                    onChange={e => {
                      const newOpts = [...pollOptions];
                      newOpts[i] = e.target.value;
                      setPollOptions(newOpts);
                    }}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 text-sm p-2 rounded-md border border-neutral-200 focus:outline-none focus:border-[#5E43F3]"
                  />
                  {pollOptions.length > 2 && (
                    <button onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} className="text-red-500 p-2"><X className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
              {pollOptions.length < 4 && (
                <button onClick={() => setPollOptions([...pollOptions, ''])} className="text-[#5E43F3] text-sm font-semibold p-2">
                  + Add option
                </button>
              )}
            </div>
          )}

          {attachedLocation && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#5E43F3]/20 bg-[#5E43F3]/5 px-2.5 py-1 text-[11px] font-semibold text-[#5E43F3]">
              <MapPin className="h-3 w-3 text-[#5E43F3]" />
              <span>{attachedLocation}</span>
              <button
                type="button"
                onClick={() => setAttachedLocation(null)}
                className="text-[#5E43F3] hover:text-[#4E34E0]"
                aria-label="Remove location"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {mediaUrl && (
            <div className="relative mt-3 overflow-hidden rounded-[16px] border border-neutral-200 bg-neutral-100">
              {mediaType === 'video' ? (
                <video src={mediaUrl} controls className="max-h-[360px] w-full object-cover" />
              ) : (
                <img src={mediaUrl} alt="Post attachment" className="max-h-[360px] w-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => {
                  if (mediaUrl.startsWith('blob:')) URL.revokeObjectURL(mediaUrl);
                  setMediaUrl('');
                  setSelectedFile(null);
                }}
                className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
                aria-label="Remove media"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* WHO CAN REPLY */}
        <div className="px-4 py-2 border-t border-neutral-100 flex items-center relative">
          <div className="relative">
            <button 
              onClick={() => setShowReplyDropdown(!showReplyDropdown)}
              className="flex items-center gap-1 text-[12px] font-semibold text-neutral-500 hover:text-neutral-800 transition"
            >
              Who can reply: <span className="text-[#5E43F3]">{getReplyLabel()}</span> <ChevronDown className="w-3 h-3" />
            </button>
            {showReplyDropdown && (
              <div className="absolute bottom-full left-0 mb-1 w-48 rounded-xl border border-neutral-200 bg-white shadow-lg p-2 z-[60]">
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-2 py-1 mb-1">Reply permissions</div>
                {['everyone', 'followers', 'following', 'friends', 'closeFriends', 'sameInterests', 'mentioned'].map(opt => (
                  <button 
                    key={opt}
                    onClick={() => { setReplyPermission(opt); setShowReplyDropdown(false); }} 
                    className="w-full text-left px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-100 rounded-lg capitalize"
                  >
                    {opt.replace(/([A-Z])/g, ' $1').trim()}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-neutral-100 bg-white px-4 py-3">
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#5E43F3] hover:bg-[#5E43F3]/10 transition"
              title="Photo"
            >
              <ImageIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#5E43F3] hover:bg-[#5E43F3]/10 transition"
              title="Video"
            >
              <Video className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => triggerShareToast('GIF picker coming soon')}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#5E43F3] hover:bg-[#5E43F3]/10 transition"
              title="GIF"
            >
              <div className="text-[10px] font-black border-2 border-current rounded px-0.5">GIF</div>
            </button>
            <button
              type="button"
              onClick={() => { setShowPoll(!showPoll); if(!showPoll) setPollOptions(['', '']); }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#5E43F3] hover:bg-[#5E43F3]/10 transition"
              title="Poll"
            >
              <BarChart2 className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => triggerShareToast('Emoji picker coming soon')}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#5E43F3] hover:bg-[#5E43F3]/10 transition"
              title="Emoji"
            >
              <Smile className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => triggerShareToast('Calendar events coming soon')}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#5E43F3] hover:bg-[#5E43F3]/10 transition"
              title="Calendar"
            >
              <Calendar className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#5E43F3] hover:bg-[#5E43F3]/10 transition"
              title="Location"
            >
              <MapPin className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => triggerShareToast('Rally feature triggered')}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#5E43F3] hover:bg-[#5E43F3]/10 transition"
              title="Rally"
            >
              <Sparkles className="h-5 w-5" />
            </button>
          </div>

          <button
            id="single-post-submit"
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || (!text.trim() && !selectedFile && !pollQuestion.trim())}
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#5E43F3] px-5 py-2 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#4E34E0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post'}
          </button>
        </div>
      </div>

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          handleFileSelect(e.target.files?.[0] ?? null, 'image');
          e.target.value = '';
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        hidden
        onChange={(e) => {
          handleFileSelect(e.target.files?.[0] ?? null, 'video');
          e.target.value = '';
        }}
      />

      {showDraftsModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-3">
              <h3 className="font-bold text-neutral-900">Your Drafts</h3>
              <button onClick={() => setShowDraftsModal(false)} className="text-neutral-500 hover:text-neutral-900"><X className="h-5 w-5" /></button>
            </div>
            {hasDrafts ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {draftsData?.map((draft: any) => (
                  <button
                    key={draft._id}
                    onClick={() => {
                      setText(draft.text || '');
                      setAudience(draft.audience || 'everyone');
                      setReplyPermission(draft.replyPermission || 'everyone');
                      if (draft.pollQuestion) {
                        setShowPoll(true);
                        setPollQuestion(draft.pollQuestion);
                        setPollOptions(draft.pollOptions || []);
                      }
                      setShowDraftsModal(false);
                    }}
                    className="w-full text-left p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50"
                  >
                    <div className="text-sm text-neutral-800 line-clamp-2">{draft.text || 'Empty text'}</div>
                    <div className="text-xs text-neutral-400 mt-1">{new Date(draft.updatedAt).toLocaleDateString()}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-neutral-500">No drafts yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function PostComposer(props: PostComposerProps) {
  return (
    <ErrorBoundary fallback={
      <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm text-center">
        <h3 className="font-bold text-neutral-800 mb-2">Composer Unavailable</h3>
        <p className="text-sm text-neutral-500 mb-4">We're having trouble connecting to the server.</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#5E43F3] text-white rounded-full font-medium text-sm">
          Refresh Page
        </button>
      </div>
    }>
      <PostComposerInner {...props} />
    </ErrorBoundary>
  );
};
