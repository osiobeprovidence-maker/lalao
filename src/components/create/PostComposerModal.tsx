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
import type { PostAudience, PostReplyPermission } from '../../types';

export const PostComposerModal: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const {
    currentUser,
    location,
    createPost,
    generateUploadUrl,
    createFlowType,
    setCreateFlowType,
    setIsCreateSheetOpen,
    composerInitialText,
    setComposerInitialText,
    pages,
    setIsLocationModalOpen,
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

  // New features states
  const [isPollOpen, setIsPollOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const [isDraftsOpen, setIsDraftsOpen] = useState(false);
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

  const {
    drafts,
    saveDraft: saveDraftToConvex,
    deleteDraft: deleteDraftFromConvex,
  } = useLalao();

  const saveDraft = async () => {
    if (!text.trim() && !mediaUrl) return;

    const draftData = {
      text,
      mediaUrl,
      mediaType,
      location: postLocation,
      audience: selectedAudience,
      replyPermission,
      pageRefId: selectedAudience === 'page' ? selectedPageId ?? undefined : undefined,
    };

    if (currentDraftId) {
      await saveDraftToConvex({ ...draftData, draftId: currentDraftId });
    } else {
      const newId = await saveDraftToConvex(draftData);
      if (newId) setCurrentDraftId(newId);
    }
  };

  const handleDraftSelect = (draft: any) => {
    setText(draft.text || '');
    setMediaUrl(draft.mediaUrl || '');
    setMediaType(draft.mediaType || 'image');
    if (draft.location) setPostLocation(draft.location);
    if (draft.audience) setSelectedAudience(draft.audience);
    if (draft.replyPermission) setReplyPermission(draft.replyPermission);
    setCurrentDraftId(draft._id);
    setIsDraftsOpen(false);
  };

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

    setIsUploadingMedia(true);

    try {
      let finalMediaUrl = mediaUrl;
      let mediaStorageId: string | undefined;
      const fileToUpload = selectedFile ?? fileInputRef.current?.files?.[0] ?? null;

      if (fileToUpload) {
        // Use Convex Storage
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": fileToUpload.type },
          body: fileToUpload,
        });

        if (!result.ok) {
          throw new Error("Upload failed");
        }

        const data = await result.json();
        mediaStorageId = data.storageId;
      }

      await createPost({
        text: text.trim(),
        mediaUrl: finalMediaUrl || undefined,
        mediaStorageId,
        mediaType,
        location: postLocation,
        audience: selectedAudience,
        replyPermission,
        pageRefId: selectedAudience === 'page' ? selectedPageId ?? undefined : undefined,
        poll: isPollOpen && pollQuestion.trim() ? { question: pollQuestion, options: pollOptions.filter((o) => o.trim() !== '') } : undefined,
      });

      if (mediaUrl.startsWith('blob:')) {
        URL.revokeObjectURL(mediaUrl);
      }

      if (currentDraftId) {
        try {
          await deleteDraftFromConvex(currentDraftId);
        } catch {}
      }
      setCurrentDraftId(null);
      setMediaUrl('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setComposerInitialText('');
      setCreateFlowType(null);
    } catch (err) {
      console.error("Failed to post:", err);
      // Let it stay open so user can retry, spinner stops
    } finally {
      setIsUploadingMedia(false);
    }
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

        {isPollOpen && (
          <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#5E43F3]">Poll</p>
              <button type="button" onClick={() => setIsPollOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              type="text"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="mb-3 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-[#5E43F3] focus:outline-none"
            />
            <div className="space-y-2">
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...pollOptions];
                      newOpts[i] = e.target.value;
                      setPollOptions(newOpts);
                    }}
                    placeholder={`Option ${i + 1}`}
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-[#5E43F3] focus:outline-none"
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                      className="text-rose-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < 4 && (
                <button
                  type="button"
                  onClick={() => setPollOptions([...pollOptions, ''])}
                  className="mt-2 text-[13px] font-medium text-[#5E43F3] hover:underline"
                >
                  + Add option
                </button>
              )}
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
              title="Add poll"
              onClick={() => setIsPollOpen((prev) => !prev)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 transition ${isPollOpen ? 'bg-amber-50 text-amber-600' : 'text-amber-500 hover:bg-amber-500/5'}`}
            >
              <MessageSquareText className="h-4 w-4" />
            </button>

            <button
              type="button"
              title="Location"
              onClick={() => setIsLocationModalOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-emerald-600 transition hover:bg-emerald-500/5"
            >
              <MapPin className="h-4 w-4" />
            </button>

            <button
              type="button"
              title="Start a Rally"
              onClick={() => {
                handleClose();
                setCreateFlowType('rally');
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-[#5E43F3] transition hover:bg-indigo-500/5"
            >
              <Hand className="h-4 w-4" />
            </button>

            <div className="flex-1" />

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
