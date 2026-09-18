import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Image,
  Video,
  MapPin,
  Globe,
  Users,
  Check,
  Loader2,
  ChevronDown,
  Camera,
  MessageSquareText,
  NotebookPen,
  Sparkles,
  Hand,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';
import { uploadFileToStorage } from '../../lib/firebase';
import type { PostAudience, PostReplyPermission } from '../../types';

export const PostComposerModal: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const {
    currentUser,
    location,
    createPost,
    createFlowType,
    setCreateFlowType,
    setIsCreateSheetOpen,
    composerInitialText,
    setComposerInitialText,
    pages,
  } = useLalao();

  const [text, setText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [postLocation, setPostLocation] = useState(location.name);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<PostAudience>('everyone');
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [replyPermission, setReplyPermission] = useState<PostReplyPermission>('everyone');
  const [isAudienceDropdownOpen, setIsAudienceDropdownOpen] = useState(false);
  const [isReplyDropdownOpen, setIsReplyDropdownOpen] = useState(false);
  const [showMediaPresets, setShowMediaPresets] = useState(false);
  const [isDraftsOpen, setIsDraftsOpen] = useState(false);
  const [drafts, setDrafts] = useState<Array<{ id: string; text: string; mediaUrl?: string; mediaType?: 'image' | 'video'; location: string; audience: PostAudience; replyPermission: PostReplyPermission; createdAt: string }>>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const communityOptions = pages.filter((page) => page.type === 'community');
  const managedPageOptions = pages.filter((page) => page.ownerId === currentUser.id || page.isOwner);

  const audienceLabel = (() => {
    if (selectedAudience === 'closeFriends') return 'Close Friends';
    if (selectedAudience === 'community') {
      const chosenCommunity = communityOptions.find((page) => page.id === selectedCommunityId);
      return chosenCommunity ? chosenCommunity.name : 'Communities';
    }
    if (selectedAudience === 'page') {
      const chosenPage = managedPageOptions.find((page) => page.id === selectedPageId);
      return chosenPage ? chosenPage.name : 'Pages';
    }
    return 'Everyone';
  })();

  const replyLabel = (() => {
    const map: Record<PostReplyPermission, string> = {
      everyone: 'Everyone',
      followers: 'People who follow me',
      following: 'People I follow',
      friends: 'Friends',
      closeFriends: 'Close Friends',
      sameInterests: 'People with the same interests',
    };
    return map[replyPermission];
  })();

  const saveDraft = () => {
    const nextDraft = {
      id: currentDraftId ?? `draft-${Date.now()}`,
      text,
      mediaUrl,
      mediaType,
      location: postLocation,
      audience: selectedAudience,
      replyPermission,
      createdAt: new Date().toLocaleString(),
    };

    const existing = JSON.parse(localStorage.getItem(`lalao-post-drafts-${currentUser.id}`) ?? '[]') as typeof drafts;
    const updated = [nextDraft, ...existing.filter((draft) => draft.id !== nextDraft.id)].slice(0, 5);
    localStorage.setItem(`lalao-post-drafts-${currentUser.id}`, JSON.stringify(updated));
    setDrafts(updated);
    setCurrentDraftId(nextDraft.id);
    setIsDraftsOpen(true);
  };

  const loadDrafts = () => {
    const saved = JSON.parse(localStorage.getItem(`lalao-post-drafts-${currentUser.id}`) ?? '[]') as typeof drafts;
    setDrafts(saved);
  };

  useEffect(() => {
    loadDrafts();
  }, [currentUser.id]);

  useEffect(() => {
    if (createFlowType === 'post') {
      containerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [createFlowType]);

  useEffect(() => {
    if (composerInitialText) {
      setText(composerInitialText);
    }
  }, [composerInitialText]);

  useEffect(() => {
    if (!selectedAudience || selectedAudience === 'everyone') {
      setSelectedCommunityId(null);
      setSelectedPageId(null);
    }
  }, [selectedAudience]);

  useEffect(() => {
    if (mediaUrl.startsWith('blob:')) {
      return () => URL.revokeObjectURL(mediaUrl);
    }
    return undefined;
  }, [mediaUrl]);

  if (createFlowType !== 'post') return null;

  const handleClose = () => {
    if (mediaUrl.startsWith('blob:')) {
      URL.revokeObjectURL(mediaUrl);
    }
    if (text.trim() || mediaUrl) {
      saveDraft();
    }
    setMediaUrl('');
    setSelectedFile(null);
    setCreateFlowType(null);
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setIsCreateSheetOpen(true);
    } else {
      setIsCreateSheetOpen(false);
    }
    setComposerInitialText('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !mediaUrl) return;
    if (isUploadingMedia) return;

    let finalMediaUrl = mediaUrl;
    const fileToUpload = selectedFile ?? fileInputRef.current?.files?.[0] ?? null;

    if (fileToUpload) {
      setIsUploadingMedia(true);
      try {
        finalMediaUrl = await uploadFileToStorage(fileToUpload, 'posts');
      } catch {
        setIsUploadingMedia(false);
        return;
      }
      setIsUploadingMedia(false);
    }

    createPost({
      text: text.trim(),
      mediaUrl: finalMediaUrl || undefined,
      mediaType,
      location: postLocation,
      audience: selectedAudience,
      replyPermission,
      pageRefId: selectedAudience === 'page' ? selectedPageId ?? undefined : undefined,
    });

    if (mediaUrl.startsWith('blob:')) {
      URL.revokeObjectURL(mediaUrl);
    }

    const draftKey = `lalao-post-drafts-${currentUser.id}`;
    localStorage.removeItem(draftKey);
    setDrafts([]);
    setCurrentDraftId(null);
    setMediaUrl('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setComposerInitialText('');
    setCreateFlowType(null);
  };

  const sampleMediaPresets = [
    { title: 'Local Streetwear', type: 'image' as const, url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&auto=format&fit=crop&q=80' },
    { title: 'Community Football', type: 'video' as const, url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80' },
    { title: 'Evening Sunset', type: 'image' as const, url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80' },
    { title: 'Local Food Grill', type: 'image' as const, url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80' },
  ];

  const shellClass = embedded
    ? 'relative w-full min-h-[calc(100vh-5rem)] bg-[#f6f3ee] flex flex-col overflow-y-auto animate-in fade-in duration-200'
    : 'absolute inset-0 z-40 bg-white flex flex-col min-h-full overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-250';

  return (
    <div ref={containerRef} id="post-composer-screen" className={shellClass}>
      <div className="sticky top-0 z-20 border-b border-neutral-100 bg-white/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Close composer"
          >
            <X className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => { saveDraft(); setIsDraftsOpen((prev) => !prev); }}
            className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[11px] font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-100"
          >
            Drafts
          </button>
        </div>
      </div>

      {isDraftsOpen && drafts.length > 0 && (
        <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-3">
          <div className="space-y-2">
            {drafts.map((draft) => (
              <button
                key={draft.id}
                type="button"
                onClick={() => {
                  setText(draft.text);
                  setMediaUrl(draft.mediaUrl ?? '');
                  setMediaType(draft.mediaType ?? 'image');
                  setPostLocation(draft.location);
                  setSelectedAudience(draft.audience);
                  setReplyPermission(draft.replyPermission);
                  setCurrentDraftId(draft.id);
                  setIsDraftsOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-2 text-left text-xs text-neutral-700 shadow-sm"
              >
                <span className="line-clamp-1">{draft.text || 'Untitled draft'}</span>
                <span className="text-[10px] text-neutral-400">{draft.createdAt}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <Avatar src={currentUser.avatar} alt={currentUser.name} size="md" />

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsAudienceDropdownOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-[12px] font-semibold text-neutral-700 transition hover:bg-neutral-200"
            >
              <Globe className="h-3.5 w-3.5 text-[#5E43F3]" />
              <span>{audienceLabel}</span>
              <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
            </button>

            {isAudienceDropdownOpen && (
              <div className="absolute left-0 top-10 z-20 w-64 rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl">
                {[
                  { value: 'everyone', label: 'Everyone', icon: Globe },
                  { value: 'closeFriends', label: 'Close Friends', icon: Users },
                  { value: 'community', label: 'Communities', icon: MessageSquareText },
                  { value: 'page', label: 'Pages', icon: NotebookPen },
                ].map((option) => (
                  <div key={option.value}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAudience(option.value as PostAudience);
                        setIsAudienceDropdownOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-neutral-700 transition hover:bg-neutral-50"
                    >
                      <span className="flex items-center gap-2">
                        <option.icon className="h-4 w-4 text-[#5E43F3]" />
                        {option.label}
                      </span>
                      {selectedAudience === option.value && <Check className="h-4 w-4 text-[#5E43F3]" />}
                    </button>

                    {option.value === 'community' && selectedAudience === 'community' && (
                      <div className="mt-2 space-y-1 border-t border-neutral-100 pt-2">
                        {communityOptions.length > 0 ? communityOptions.map((community) => (
                          <button
                            key={community.id}
                            type="button"
                            onClick={() => {
                              setSelectedCommunityId(community.id);
                              setSelectedAudience('community');
                            }}
                            className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs text-neutral-700 hover:bg-neutral-50"
                          >
                            <span>{community.name}</span>
                            {selectedCommunityId === community.id && <Check className="h-3.5 w-3.5 text-[#5E43F3]" />}
                          </button>
                        )) : (
                          <div className="rounded-lg border border-dashed border-neutral-200 px-2 py-2 text-[11px] text-neutral-500">
                            No communities yet.
                          </div>
                        )}
                      </div>
                    )}

                    {option.value === 'page' && selectedAudience === 'page' && (
                      <div className="mt-2 space-y-1 border-t border-neutral-100 pt-2">
                        {managedPageOptions.length > 0 ? managedPageOptions.map((page) => (
                          <button
                            key={page.id}
                            type="button"
                            onClick={() => {
                              setSelectedPageId(page.id);
                              setSelectedAudience('page');
                            }}
                            className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs text-neutral-700 hover:bg-neutral-50"
                          >
                            <span>{page.name}</span>
                            {selectedPageId === page.id && <Check className="h-3.5 w-3.5 text-[#5E43F3]" />}
                          </button>
                        )) : (
                          <div className="rounded-lg border border-dashed border-neutral-200 px-2 py-2 text-[11px] text-neutral-500">
                            No page available to post as.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="What’s happening?"
          className="w-full resize-none border-none bg-transparent text-[20px] leading-[1.5] tracking-[-0.02em] text-neutral-900 placeholder:text-neutral-500 focus:outline-none"
          autoFocus
        />

        {mediaUrl && (
          <div className="relative mt-4 overflow-hidden rounded-[20px] border border-neutral-200 bg-neutral-100">
            {mediaType === 'video' ? (
              <video src={mediaUrl} controls className="max-h-[320px] w-full object-cover" />
            ) : (
              <img src={mediaUrl} alt="Attachment preview" className="max-h-[320px] w-full object-cover" />
            )}
            <button
              type="button"
              onClick={() => {
                if (mediaUrl.startsWith('blob:')) URL.revokeObjectURL(mediaUrl);
                setMediaUrl('');
                setSelectedFile(null);
              }}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white"
              aria-label="Remove media"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {showMediaPresets && (
          <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-500">Attachment sample</p>
            <div className="grid grid-cols-2 gap-2">
              {sampleMediaPresets.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setMediaUrl(item.url);
                    setMediaType(item.type);
                    setShowMediaPresets(false);
                  }}
                  className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white p-2 text-left"
                >
                  <img src={item.url} alt={item.title} className="h-10 w-10 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <div className="truncate text-[11px] font-bold text-neutral-900">{item.title}</div>
                    <div className="text-[9px] uppercase tracking-[0.12em] text-neutral-400">{item.type}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-neutral-100 pt-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsReplyDropdownOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[11px] font-semibold text-neutral-700"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#5E43F3]" />
              <span>{replyLabel}</span>
              <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
            </button>

            {isReplyDropdownOpen && (
              <div className="absolute left-0 top-10 z-20 w-56 rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl">
                {[
                  { value: 'everyone', label: 'Everyone' },
                  { value: 'followers', label: 'People who follow me' },
                  { value: 'following', label: 'People I follow' },
                  { value: 'friends', label: 'Friends' },
                  { value: 'closeFriends', label: 'Close Friends' },
                  { value: 'sameInterests', label: 'People with the same interests' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setReplyPermission(option.value as PostReplyPermission);
                      setIsReplyDropdownOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-neutral-700 transition hover:bg-neutral-50"
                  >
                    <span>{option.label}</span>
                    {replyPermission === option.value && <Check className="h-3.5 w-3.5 text-[#5E43F3]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              title="Add photo"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-[#5E43F3] transition hover:bg-[#5E43F3]/5"
            >
              <Image className="h-4 w-4" />
            </button>

            <button
              type="button"
              title="Add video"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = 'video/*';
                  fileInputRef.current.click();
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-rose-500 transition hover:bg-rose-500/5"
            >
              <Video className="h-4 w-4" />
            </button>

            <button
              type="button"
              title="Add camera capture"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = 'image/*,video/*';
                  fileInputRef.current.capture = 'environment';
                  fileInputRef.current.click();
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-amber-500 transition hover:bg-amber-500/5"
            >
              <Camera className="h-4 w-4" />
            </button>

            <button
              type="button"
              title="Location"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-emerald-600 transition hover:bg-emerald-500/5"
            >
              <MapPin className="h-4 w-4" />
            </button>

            <button
              type="button"
              title="Rally"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-[#5E43F3] transition hover:bg-indigo-500/5"
            >
              <Hand className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={(!text.trim() && !mediaUrl) || isUploadingMedia}
              className={`rounded-full px-4 py-2 text-sm font-bold ${
                (text.trim() || mediaUrl) && !isUploadingMedia
                  ? 'bg-[#5E43F3] text-white hover:bg-[#4E34E0]'
                  : 'cursor-not-allowed bg-neutral-200 text-neutral-500'
              }`}
            >
              {isUploadingMedia ? (
                <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Uploading</span>
              ) : (
                'Post'
              )}
            </button>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;

          if (mediaUrl.startsWith('blob:')) URL.revokeObjectURL(mediaUrl);

          const nextUrl = URL.createObjectURL(file);
          setSelectedFile(file);
          setMediaUrl(nextUrl);
          setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
          event.target.value = '';
        }}
      />
    </div>
  );
};
