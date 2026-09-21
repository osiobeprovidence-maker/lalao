import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import {
  X,
  Image as ImageIcon,
  BarChart3,
  Smile,
  MapPin,
  Hand,
  Globe,
  Users,
  UserCheck,
  AtSign,
  ChevronDown,
  Check,
  Loader2,
  Sparkles,
  MessageSquareText,
  Hash,
  Plus,
  Navigation,
  Tag,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';
import type { PostAudience, PostReplyPermission } from '../../types';
import { getTopicIcon } from '../../utils/topicIcons';
import { EmojiPickerPopover } from './EmojiPickerPopover';
import { GifPickerPopover } from './GifPickerPopover';
import { uploadImageToCloudinary } from '../../lib/cloudinary';
import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface PostComposerProps {
  embedded?: boolean;
  onClose?: () => void;
}

export const PostComposer: React.FC<PostComposerProps> = ({
  embedded = false,
  onClose,
}) => {
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
    rallies,
    activeTopics,
    detectGpsLocation,
    isDetectingGps,
    setIsLocationModalOpen,
    setActiveTab,
    triggerShareToast,
    drafts,
    saveDraft: saveDraftToConvex,
    deleteDraft: deleteDraftFromConvex,
    generateCloudinarySignature,
  } = useLalao();
  
  const createMuxDirectUpload = useAction(api.mux.createDirectUpload);
  const pollMuxStatus = useAction(api.mux.pollAndUpdatePost);

  // Core content states
  const [text, setText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaStorageId, setMediaStorageId] = useState<string | undefined>(undefined);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [gifUrl, setGifUrl] = useState('');
  const [muxUploadId, setMuxUploadId] = useState<string | undefined>(undefined);

  // Destination & Reply Permissions
  const [selectedAudience, setSelectedAudience] = useState<PostAudience>('everyone');
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [replyPermission, setReplyPermission] = useState<PostReplyPermission>('everyone');

  // Popover open states
  const [isAudienceDropdownOpen, setIsAudienceDropdownOpen] = useState(false);
  const [isReplyDropdownOpen, setIsReplyDropdownOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const [isLocationPopoverOpen, setIsLocationPopoverOpen] = useState(false);
  const [isRallyPopoverOpen, setIsRallyPopoverOpen] = useState(false);
  const [isDraftsOpen, setIsDraftsOpen] = useState(false);

  // Poll state
  const [isPollOpen, setIsPollOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  // Attached Location
  const [attachedLocation, setAttachedLocation] = useState<string | null>(location.name || 'Local');

  // Attached Rally
  const [attachedRallyId, setAttachedRallyId] = useState<string | null>(null);

  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [customTopicInput, setCustomTopicInput] = useState('');

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audienceDropdownRef = useRef<HTMLDivElement | null>(null);
  const replyDropdownRef = useRef<HTMLDivElement | null>(null);
  const locationPopoverRef = useRef<HTMLDivElement | null>(null);
  const rallyPopoverRef = useRef<HTMLDivElement | null>(null);

  const communityPages = pages.filter((page) => page.type === 'community');

  // Sync initial text if passed
  useEffect(() => {
    if (composerInitialText) {
      setText(composerInitialText);
    }
  }, [composerInitialText]);

  // Sync attached location if location changed
  useEffect(() => {
    if (location?.name && !attachedLocation) {
      setAttachedLocation(location.name);
    }
  }, [location?.name]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (mediaUrl.startsWith('blob:')) {
        URL.revokeObjectURL(mediaUrl);
      }
    };
  }, [mediaUrl]);

  // Handle outside click to close dropdowns
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (audienceDropdownRef.current && !audienceDropdownRef.current.contains(target)) {
        setIsAudienceDropdownOpen(false);
      }
      if (replyDropdownRef.current && !replyDropdownRef.current.contains(target)) {
        setIsReplyDropdownOpen(false);
      }
      if (locationPopoverRef.current && !locationPopoverRef.current.contains(target)) {
        setIsLocationPopoverOpen(false);
      }
      if (rallyPopoverRef.current && !rallyPopoverRef.current.contains(target)) {
        setIsRallyPopoverOpen(false);
      }
    };

    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAudienceDropdownOpen(false);
        setIsReplyDropdownOpen(false);
        setIsEmojiPickerOpen(false);
        setIsGifPickerOpen(false);
        setIsLocationPopoverOpen(false);
        setIsRallyPopoverOpen(false);
        setIsDraftsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  // Audience Label & Icon
  const { audienceLabel, AudienceIcon } = (() => {
    if (selectedAudience === 'nearby') {
      return { audienceLabel: 'Nearby', AudienceIcon: MapPin };
    }
    if (selectedAudience === 'anime') {
      return { audienceLabel: 'Anime', AudienceIcon: getTopicIcon('anime') };
    }
    if (selectedAudience === 'community') {
      const found = communityPages.find((c) => c.id === selectedCommunityId);
      return {
        audienceLabel: found ? `Community: ${found.name}` : 'Communities',
        AudienceIcon: MessageSquareText,
      };
    }
    if (selectedAudience === 'interest') {
      return {
        audienceLabel: selectedTopic ? `#${selectedTopic}` : 'Interests',
        AudienceIcon: Hash,
      };
    }
    if (selectedAudience === 'closeFriends') {
      return { audienceLabel: 'Close Friends', AudienceIcon: Users };
    }
    return { audienceLabel: 'Everyone', AudienceIcon: Globe };
  })();

  // Reply permission label & icon
  const { replyLabel, ReplyIcon } = (() => {
    if (replyPermission === 'following') {
      return { replyLabel: 'People you follow can reply', ReplyIcon: Users };
    }
    if (replyPermission === 'followers') {
      return { replyLabel: 'People who follow me can reply', ReplyIcon: UserCheck };
    }
    if (replyPermission === 'mentioned') {
      return { replyLabel: 'Mentioned users only can reply', ReplyIcon: AtSign };
    }
    return { replyLabel: 'Everyone can reply', ReplyIcon: Globe };
  })();

  // Insert emoji at cursor position
  const handleSelectEmoji = (emoji: string) => {
    if (!textareaRef.current) {
      setText((prev) => prev + emoji);
      return;
    }

    const start = textareaRef.current.selectionStart ?? text.length;
    const end = textareaRef.current.selectionEnd ?? text.length;
    const nextText = text.substring(0, start) + emoji + text.substring(end);

    setText(nextText);
    setIsEmojiPickerOpen(false);

    // Restore focus and cursor position after emoji
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const cursorPosition = start + emoji.length;
        textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 50);
  };

  // Handle GIF selection
  const handleSelectGif = (selectedGifUrl: string) => {
    if (mediaUrl.startsWith('blob:')) {
      URL.revokeObjectURL(mediaUrl);
    }
    setMediaUrl('');
    setSelectedFile(null);
    setGifUrl(selectedGifUrl);
    setIsGifPickerOpen(false);
  };

  // Handle media file upload selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (mediaUrl.startsWith('blob:')) {
      URL.revokeObjectURL(mediaUrl);
    }
    setGifUrl('');

    const nextUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setMediaUrl(nextUrl);
    setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
    e.target.value = '';
  };

  // Remove media
  const handleRemoveMedia = () => {
    if (mediaUrl.startsWith('blob:')) {
      URL.revokeObjectURL(mediaUrl);
    }
    setMediaUrl('');
    setSelectedFile(null);
    setMediaStorageId(undefined);
  };

  // Remove GIF
  const handleRemoveGif = () => {
    setGifUrl('');
  };

  // Save current draft
  const handleSaveDraft = async () => {
    if (!text.trim() && !mediaUrl && !gifUrl && !isPollOpen) return;

    const draftData = {
      text,
      mediaUrl: gifUrl || mediaUrl,
      mediaType,
      location: attachedLocation || location.name,
      audience: selectedAudience,
      replyPermission,
      pageRefId: selectedAudience === 'community' ? selectedCommunityId ?? undefined : undefined,
    };

    try {
      if (currentDraftId) {
        await saveDraftToConvex({ ...draftData, draftId: currentDraftId });
      } else {
        const newId = await saveDraftToConvex(draftData);
        if (newId) setCurrentDraftId(newId);
      }
      triggerShareToast('Draft saved');
    } catch (err) {
      console.error('Failed to save draft:', err);
    }
  };

  // Load selected draft
  const handleLoadDraft = (draft: any) => {
    setText(draft.text || '');
    if (draft.mediaUrl?.includes('.gif') || draft.gifUrl) {
      setGifUrl(draft.gifUrl || draft.mediaUrl);
      setMediaUrl('');
    } else {
      setMediaUrl(draft.mediaUrl || '');
      setMediaType(draft.mediaType || 'image');
      setGifUrl('');
    }
    if (draft.location) setAttachedLocation(draft.location);
    if (draft.audience) setSelectedAudience(draft.audience);
    if (draft.replyPermission) setReplyPermission(draft.replyPermission);
    setCurrentDraftId(draft._id || draft.id);
    setIsDraftsOpen(false);
  };

  // Handle post close
  const handleClose = () => {
    if (text.trim() || mediaUrl || gifUrl) {
      handleSaveDraft();
    }
    if (mediaUrl.startsWith('blob:')) {
      URL.revokeObjectURL(mediaUrl);
    }
    setText('');
    setMediaUrl('');
    setGifUrl('');
    setSelectedFile(null);
    setComposerInitialText('');
    setCreateFlowType(null);
    setIsCreateSheetOpen(false);
    if (onClose) {
      onClose();
    } else if (embedded) {
      setActiveTab('home');
    }
  };

  // Upload progress state
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Helper: Extract video frame poster client-side
  const generateVideoPoster = (file: File): Promise<string> => {
    return new Promise((resolve) => {
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
  };

  // Helper: XHR Upload with progress callback
  const uploadFileWithProgress = (url: string, method: 'PUT' | 'POST', file: File, onProgress: (pct: number) => void): Promise<any> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      if (method === 'PUT') {
        xhr.setRequestHeader('Content-Type', file.type);
      }
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          onProgress(percentComplete);
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
  };

  // Submit Post
  const handleSubmit = async () => {
    const hasText = text.trim().length > 0;
    const hasMedia = Boolean(mediaUrl || selectedFile);
    const hasGif = Boolean(gifUrl);
    const hasValidPoll = isPollOpen && pollQuestion.trim().length > 0 && pollOptions.filter((o) => o.trim().length > 0).length >= 2;

    if (!hasText && !hasMedia && !hasGif && !hasValidPoll) return;
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      let finalMediaUrl = gifUrl || mediaUrl;
      let finalMediaStorageId: string | undefined = undefined;
      let finalMuxUploadId: string | undefined = undefined;
      let generatedPosterUrl: string | undefined = undefined;

      // If user picked a local file, upload it with progress tracking
      if (selectedFile) {
        setUploadProgress(5);
        if (mediaType === 'video') {
          // Extract instant poster frame before or during upload
          try {
            generatedPosterUrl = await generateVideoPoster(selectedFile);
          } catch (posterErr) {
            console.warn('Could not extract video poster:', posterErr);
          }

          // VIDEO → Upload to Mux via direct upload
          try {
            const { upload_url, upload_id } = await createMuxDirectUpload();
            await uploadFileWithProgress(upload_url, 'PUT', selectedFile, (pct) => setUploadProgress(pct));
            finalMuxUploadId = upload_id;
            // Use client-generated poster frame as temporary mediaUrl for instant feed preview
            finalMediaUrl = generatedPosterUrl || mediaUrl || '';
          } catch (muxErr) {
            console.error('Mux video upload failed:', muxErr);
            triggerShareToast('Video upload failed. Please try again.');
            setIsSubmitting(false);
            setUploadProgress(null);
            return;
          }
        } else {
          // IMAGE → Upload to Convex Storage with fallback
          try {
            const uploadUrl = await generateUploadUrl();
            const res = await uploadFileWithProgress(uploadUrl, 'POST', selectedFile, (pct) => setUploadProgress(pct));
            if (res.storageId) {
              finalMediaStorageId = res.storageId;
              finalMediaUrl = '';
            } else {
              throw new Error('Upload to storage failed');
            }
          } catch (storageErr) {
            console.warn('Convex direct storage upload fallback to Cloudinary:', storageErr);
            try {
              const sig = await generateCloudinarySignature('posts');
              finalMediaUrl = await uploadImageToCloudinary(selectedFile, sig);
            } catch (cloudErr) {
              console.error('All media upload methods failed:', cloudErr);
              triggerShareToast('Media upload failed, please retry.');
              setIsSubmitting(false);
              setUploadProgress(null);
              return;
            }
          }
        }
      }

      setUploadProgress(100);

      // Collect contentTopics
      const topics: string[] = [];
      if (selectedAudience === 'anime') {
        topics.push('anime');
      } else if (selectedAudience === 'interest' && selectedTopic) {
        topics.push(selectedTopic.toLowerCase());
      }

      // Format poll if valid
      const validPoll = hasValidPoll
        ? {
            question: pollQuestion.trim(),
            options: pollOptions.filter((o) => o.trim().length > 0),
          }
        : undefined;

      const created = await createPost({
        text: text.trim(),
        mediaUrl: finalMediaUrl || undefined,
        mediaStorageId: finalMediaStorageId,
        mediaType,
        location: attachedLocation || location.name || 'Local',
        audience: selectedAudience,
        replyPermission,
        gifUrl: gifUrl || undefined,
        poll: validPoll,
        rallyRefId: attachedRallyId ?? undefined,
        pageRefId: selectedAudience === 'community' ? selectedCommunityId ?? undefined : undefined,
        contentTopics: topics.length > 0 ? topics : undefined,
        muxUploadId: finalMuxUploadId,
        mediaStatus: finalMuxUploadId ? 'processing' : 'ready',
      } as any);

      // Trigger background polling for Mux processing without blocking user UI
      if (finalMuxUploadId && created?.id) {
        pollMuxStatus({ postId: created.id as any, uploadId: finalMuxUploadId }).catch(
          (e: any) => console.warn('Mux poll failed (non-critical):', e)
        );
      }

      // Clear draft if it was saved
      if (currentDraftId) {
        try {
          await deleteDraftFromConvex(currentDraftId);
        } catch {}
      }

      // Clean up blob URL
      if (mediaUrl.startsWith('blob:')) {
        URL.revokeObjectURL(mediaUrl);
      }

      // Reset composer state
      setText('');
      setMediaUrl('');
      setGifUrl('');
      setSelectedFile(null);
      setIsPollOpen(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setAttachedRallyId(null);
      setComposerInitialText('');
      setCreateFlowType(null);
      setIsCreateSheetOpen(false);
      setUploadProgress(null);
      setIsSubmitting(false);

      triggerShareToast('Post published!');
      handleClose();
    } catch (err: any) {
      console.error('Submit post failed:', err);
      triggerShareToast(err?.message || 'Failed to publish post. Please try again.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  const hasContent = Boolean(
    text.trim() ||
      mediaUrl ||
      gifUrl ||
      selectedFile ||
      (isPollOpen && pollQuestion.trim() && pollOptions.filter((o) => o.trim()).length >= 2)
  );

  const attachedRally = rallies.find((r) => r.id === attachedRallyId);

  return (
    <div className="mx-auto w-full max-w-[640px] px-4 py-4 sm:py-6">
      <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-3 border-b border-neutral-100 bg-white px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar src={currentUser.avatar} alt={currentUser.name} size="md" />

            {/* Destination / Audience Selector */}
            <div className="relative" ref={audienceDropdownRef}>
              <button
                type="button"
                onClick={() => setIsAudienceDropdownOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#f6f3ee] px-2.5 py-1 text-[11px] font-bold text-neutral-700 ring-1 ring-neutral-200 transition hover:bg-[#ede8e1]"
                aria-haspopup="true"
                aria-expanded={isAudienceDropdownOpen}
                aria-label="Post destination"
              >
                <AudienceIcon className="h-3.5 w-3.5 text-[#5E43F3]" />
                <span className="max-w-[140px] truncate">{audienceLabel}</span>
                <ChevronDown className="h-3 w-3 text-neutral-500" />
              </button>

              {/* Destination Dropdown */}
              {isAudienceDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 z-50 w-72 rounded-2xl border border-neutral-200 bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Choose Destination
                  </p>

                  {/* Everyone */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAudience('everyone');
                      setSelectedCommunityId(null);
                      setSelectedTopic(null);
                      setIsAudienceDropdownOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-neutral-800 transition hover:bg-neutral-50"
                  >
                    <span className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-[#5E43F3]">
                        <Globe className="h-4 w-4" />
                      </div>
                      <div>
                        <div>Everyone</div>
                        <div className="text-[10px] font-normal text-neutral-400">Public algorithmic feed</div>
                      </div>
                    </span>
                    {selectedAudience === 'everyone' && <Check className="h-4 w-4 text-[#5E43F3]" />}
                  </button>

                  {/* Nearby */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAudience('nearby');
                      setSelectedCommunityId(null);
                      setSelectedTopic(null);
                      setIsAudienceDropdownOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-neutral-800 transition hover:bg-neutral-50"
                  >
                    <span className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <div>Nearby</div>
                        <div className="text-[10px] font-normal text-neutral-400">
                          {location.name ? `Local feed for ${location.name}` : 'Local area feed'}
                        </div>
                      </div>
                    </span>
                    {selectedAudience === 'nearby' && <Check className="h-4 w-4 text-[#5E43F3]" />}
                  </button>

                  {/* Anime */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAudience('anime');
                      setSelectedCommunityId(null);
                      setSelectedTopic(null);
                      setIsAudienceDropdownOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-neutral-800 transition hover:bg-neutral-50"
                  >
                    <span className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                        {React.createElement(getTopicIcon('anime'), { className: "h-4 w-4" })}
                      </div>
                      <div>
                        <div>Anime</div>
                        <div className="text-[10px] font-normal text-neutral-400">Otaku & anime community</div>
                      </div>
                    </span>
                    {selectedAudience === 'anime' && <Check className="h-4 w-4 text-[#5E43F3]" />}
                  </button>

                  {/* Communities */}
                  <div className="mt-1 border-t border-neutral-100 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAudience('community');
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-neutral-800 transition hover:bg-neutral-50"
                    >
                      <span className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                          <MessageSquareText className="h-4 w-4" />
                        </div>
                        <div>
                          <div>Communities</div>
                          <div className="text-[10px] font-normal text-neutral-400">Post to a specific community</div>
                        </div>
                      </span>
                      {selectedAudience === 'community' && <Check className="h-4 w-4 text-[#5E43F3]" />}
                    </button>

                    {selectedAudience === 'community' && (
                      <div className="ml-9 mr-2 mb-2 space-y-1 rounded-xl bg-neutral-50 p-2">
                        {communityPages.length > 0 ? (
                          communityPages.map((com) => (
                            <button
                              key={com.id}
                              type="button"
                              onClick={() => {
                                setSelectedCommunityId(com.id);
                                setIsAudienceDropdownOpen(false);
                              }}
                              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs text-neutral-700 hover:bg-white"
                            >
                              <span className="truncate">{com.name}</span>
                              {selectedCommunityId === com.id && (
                                <Check className="h-3.5 w-3.5 text-[#5E43F3]" />
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="py-1 text-[11px] text-neutral-400">No communities found</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Interests / Topics */}
                  <div className="border-t border-neutral-100 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedAudience('interest')}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-neutral-800 transition hover:bg-neutral-50"
                    >
                      <span className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                          <Hash className="h-4 w-4" />
                        </div>
                        <div>
                          <div>Interests & Topics</div>
                          <div className="text-[10px] font-normal text-neutral-400">Tag a specific topic channel</div>
                        </div>
                      </span>
                      {selectedAudience === 'interest' && <Check className="h-4 w-4 text-[#5E43F3]" />}
                    </button>

                    {selectedAudience === 'interest' && (
                      <div className="ml-9 mr-2 mb-2 rounded-xl bg-neutral-50 p-2">
                        <div className="flex items-center gap-1 mb-2">
                          <input
                            type="text"
                            value={customTopicInput}
                            onChange={(e) => setCustomTopicInput(e.target.value)}
                            placeholder="Type a topic (e.g. gaming)..."
                            className="w-full rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#5E43F3]"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && customTopicInput.trim()) {
                                setSelectedTopic(customTopicInput.trim().replace(/^#/, ''));
                                setCustomTopicInput('');
                                setIsAudienceDropdownOpen(false);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (customTopicInput.trim()) {
                                setSelectedTopic(customTopicInput.trim().replace(/^#/, ''));
                                setCustomTopicInput('');
                                setIsAudienceDropdownOpen(false);
                              }
                            }}
                            className="rounded-lg bg-[#5E43F3] px-2 py-1 text-xs font-bold text-white"
                          >
                            Set
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {['Tech', 'Gaming', 'Music', 'Sports', 'Art', 'Crypto'].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => {
                                setSelectedTopic(t.toLowerCase());
                                setIsAudienceDropdownOpen(false);
                              }}
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition ${
                                selectedTopic === t.toLowerCase()
                                  ? 'bg-[#5E43F3] text-white'
                                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                              }`}
                            >
                              #{t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons on header: Drafts & Close */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                handleSaveDraft();
                setIsDraftsOpen((prev) => !prev);
              }}
              className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[11px] font-semibold text-neutral-700 transition hover:bg-neutral-100"
            >
              Drafts {drafts?.length > 0 && `(${drafts.length})`}
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

        {/* Saved Drafts Drawer */}
        {isDraftsOpen && (
          <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                Saved Drafts
              </span>
              <button
                type="button"
                onClick={() => setIsDraftsOpen(false)}
                className="text-xs text-neutral-400 hover:text-neutral-600"
              >
                Close
              </button>
            </div>
            {drafts && drafts.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {drafts.map((d: any) => (
                  <div
                    key={d._id || d.id}
                    className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs shadow-sm hover:border-neutral-300"
                  >
                    <button
                      type="button"
                      onClick={() => handleLoadDraft(d)}
                      className="flex-1 text-left line-clamp-1 text-neutral-800 font-medium"
                    >
                      {d.text || 'Untitled draft'}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await deleteDraftFromConvex(d._id || d.id);
                        } catch {}
                      }}
                      className="ml-2 text-neutral-400 hover:text-rose-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 py-1">No saved drafts yet.</p>
            )}
          </div>
        )}

        {/* Text Input Area */}
        <div className="px-4 pb-2 pt-4">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="What’s happening?"
            className="w-full resize-none bg-transparent text-[20px] leading-[1.4] tracking-[-0.02em] text-neutral-900 placeholder:text-neutral-500 focus:outline-none"
            autoFocus
          />
        </div>

        {/* Attached Location & Attached Rally badges */}
        {(attachedLocation || attachedRally) && (
          <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
            {attachedLocation && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                <MapPin className="h-3 w-3 text-emerald-600" />
                <span>{attachedLocation}</span>
                <button
                  type="button"
                  onClick={() => setAttachedLocation(null)}
                  className="text-emerald-500 hover:text-emerald-800"
                  aria-label="Remove location"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {attachedRally && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-[#5E43F3] border border-purple-200">
                <Hand className="h-3 w-3 text-[#5E43F3]" />
                <span className="max-w-[180px] truncate">Rally: {attachedRally.title}</span>
                <button
                  type="button"
                  onClick={() => setAttachedRallyId(null)}
                  className="text-purple-400 hover:text-purple-700"
                  aria-label="Remove attached rally"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Attached Media Preview (Image or Video) */}
        {mediaUrl && (
          <div className="px-4 pb-4">
            <div className="relative overflow-hidden rounded-[20px] border border-neutral-200 bg-neutral-100">
              {mediaType === 'video' ? (
                <video src={mediaUrl} controls className="max-h-[320px] w-full object-cover" />
              ) : (
                <img src={mediaUrl} alt="Attachment preview" className="max-h-[320px] w-full object-cover" />
              )}
              <button
                type="button"
                onClick={handleRemoveMedia}
                className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
                aria-label="Remove media"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Attached GIF Preview */}
        {gifUrl && (
          <div className="px-4 pb-4">
            <div className="relative overflow-hidden rounded-[20px] border border-neutral-200 bg-neutral-100">
              <img src={gifUrl} alt="GIF attachment" className="max-h-[280px] w-full object-cover" />
              <button
                type="button"
                onClick={handleRemoveGif}
                className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
                aria-label="Remove GIF"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Poll Builder Card */}
        {isPollOpen && (
          <div className="mx-4 mb-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#5E43F3]">
                <BarChart3 className="h-3.5 w-3.5" />
                Poll
              </div>
              <button
                type="button"
                onClick={() => setIsPollOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700"
                aria-label="Cancel poll"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <input
              type="text"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="mb-3 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#5E43F3] focus:outline-none focus:ring-1 focus:ring-[#5E43F3]"
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
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#5E43F3] focus:outline-none focus:ring-1 focus:ring-[#5E43F3]"
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 transition hover:bg-rose-50"
                      aria-label={`Remove option ${i + 1}`}
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
                  className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#5E43F3] hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" /> Add option
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer: Reply Permissions & Action Bar */}
        <div className="border-t border-neutral-200 px-4 py-3">
          {/* Reply Permission Pill */}
          <div className="relative inline-block" ref={replyDropdownRef}>
            <button
              type="button"
              onClick={() => setIsReplyDropdownOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full bg-[#f6f3ee] px-2.5 py-1.5 text-[11px] font-semibold text-neutral-700 ring-1 ring-neutral-200 transition hover:bg-[#ede8e1]"
              aria-haspopup="true"
              aria-expanded={isReplyDropdownOpen}
              aria-label="Reply permission"
            >
              <ReplyIcon className="h-3.5 w-3.5 text-[#5E43F3]" />
              <span>{replyLabel}</span>
              <ChevronDown className="h-3 w-3 text-neutral-500" />
            </button>

            {/* Reply Dropdown Menu */}
            {isReplyDropdownOpen && (
              <div className="absolute left-0 bottom-full mb-2 z-50 w-64 rounded-2xl border border-neutral-200 bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Who can reply?
                </p>

                {[
                  { value: 'everyone', label: 'Everyone', desc: 'Anyone can reply', icon: Globe },
                  { value: 'following', label: 'People you follow', desc: 'Accounts you follow', icon: Users },
                  { value: 'followers', label: 'People who follow me', desc: 'Your followers', icon: UserCheck },
                  { value: 'mentioned', label: 'Only accounts you mention', desc: 'Strict reply control', icon: AtSign },
                ].map((item) => {
                  const ItemIcon = item.icon;
                  const isSelected = replyPermission === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        setReplyPermission(item.value as PostReplyPermission);
                        setIsReplyDropdownOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-neutral-800 transition hover:bg-neutral-50"
                    >
                      <span className="flex items-center gap-2.5">
                        <ItemIcon className="h-4 w-4 text-[#5E43F3]" />
                        <div>
                          <div>{item.label}</div>
                          <div className="text-[10px] font-normal text-neutral-400">{item.desc}</div>
                        </div>
                      </span>
                      {isSelected && <Check className="h-4 w-4 text-[#5E43F3]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="my-3 h-px bg-neutral-200" />

          {/* Actions Toolbar */}
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Media Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#5E43F3] transition hover:bg-[#5E43F3]/8"
                aria-label="Add photo or video"
                title="Add photo or video"
              >
                <ImageIcon className="h-4 w-4" />
              </button>

              {/* GIF Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsGifPickerOpen((prev) => !prev);
                    setIsEmojiPickerOpen(false);
                    setIsLocationPopoverOpen(false);
                    setIsRallyPopoverOpen(false);
                  }}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                    isGifPickerOpen ? 'bg-neutral-200' : 'hover:bg-neutral-100'
                  }`}
                  aria-label="Add GIF"
                  title="Add GIF"
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.12em] text-neutral-700">
                    GIF
                  </span>
                </button>

                {isGifPickerOpen && (
                  <GifPickerPopover
                    onSelectGif={handleSelectGif}
                    onClose={() => setIsGifPickerOpen(false)}
                  />
                )}
              </div>

              {/* Poll Button */}
              <button
                type="button"
                onClick={() => setIsPollOpen((prev) => !prev)}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                  isPollOpen ? 'bg-[#5E43F3]/15 text-[#5E43F3]' : 'text-[#5E43F3] hover:bg-neutral-100'
                }`}
                aria-label="Add poll"
                title="Add poll"
              >
                <BarChart3 className="h-4 w-4" />
              </button>

              {/* Emoji Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsEmojiPickerOpen((prev) => !prev);
                    setIsGifPickerOpen(false);
                    setIsLocationPopoverOpen(false);
                    setIsRallyPopoverOpen(false);
                  }}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                    isEmojiPickerOpen ? 'bg-amber-100' : 'hover:bg-neutral-100'
                  }`}
                  aria-label="Add emoji"
                  title="Add emoji"
                >
                  <Smile className="h-4 w-4 text-amber-500" />
                </button>

                {isEmojiPickerOpen && (
                  <EmojiPickerPopover
                    onSelectEmoji={handleSelectEmoji}
                    onClose={() => setIsEmojiPickerOpen(false)}
                  />
                )}
              </div>

              {/* Location Button */}
              <div className="relative" ref={locationPopoverRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsLocationPopoverOpen((prev) => !prev);
                    setIsEmojiPickerOpen(false);
                    setIsGifPickerOpen(false);
                    setIsRallyPopoverOpen(false);
                  }}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                    isLocationPopoverOpen || attachedLocation ? 'bg-emerald-50 text-emerald-600' : 'text-emerald-600 hover:bg-emerald-50'
                  }`}
                  aria-label="Add location"
                  title="Add location"
                >
                  <MapPin className="h-4 w-4" />
                </button>

                {isLocationPopoverOpen && (
                  <div className="absolute bottom-full left-0 mb-2 z-50 w-64 rounded-2xl border border-neutral-200 bg-white p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Post Location
                    </p>

                    {/* Current device location prompt */}
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await detectGpsLocation();
                        if (res.success) {
                          setAttachedLocation(location.name);
                        }
                        setIsLocationPopoverOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      {isDetectingGps ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Navigation className="h-4 w-4" />
                      )}
                      <span>Use Current Device Location</span>
                    </button>

                    {/* Open full location picker modal */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsLocationPopoverOpen(false);
                        setIsLocationModalOpen(true);
                      }}
                      className="mt-2 flex w-full items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                    >
                      <MapPin className="h-4 w-4 text-neutral-500" />
                      <span>Choose Different City...</span>
                    </button>

                    {attachedLocation && (
                      <button
                        type="button"
                        onClick={() => {
                          setAttachedLocation(null);
                          setIsLocationPopoverOpen(false);
                        }}
                        className="mt-2 flex w-full items-center justify-center rounded-xl py-1.5 text-xs text-rose-500 hover:bg-rose-50"
                      >
                        Remove Location Tag
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Purple Hand / Rally Button */}
              <div className="relative" ref={rallyPopoverRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsRallyPopoverOpen((prev) => !prev);
                    setIsEmojiPickerOpen(false);
                    setIsGifPickerOpen(false);
                    setIsLocationPopoverOpen(false);
                  }}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                    isRallyPopoverOpen || attachedRallyId ? 'bg-[#5E43F3]/15 text-[#5E43F3]' : 'text-[#5E43F3] hover:bg-[#5E43F3]/8'
                  }`}
                  aria-label="Link a Rally"
                  title="Link a Rally"
                >
                  <Hand className="h-4 w-4" />
                </button>

                {isRallyPopoverOpen && (
                  <div className="absolute bottom-full left-0 mb-2 z-50 w-72 rounded-2xl border border-neutral-200 bg-white p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Link a Local Rally
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsRallyPopoverOpen(false)}
                        className="text-neutral-400 hover:text-neutral-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {rallies.length > 0 ? (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {rallies.map((rally) => {
                          const isSelected = attachedRallyId === rally.id;
                          return (
                            <button
                              key={rally.id}
                              type="button"
                              onClick={() => {
                                setAttachedRallyId(isSelected ? null : rally.id);
                                setIsRallyPopoverOpen(false);
                              }}
                              className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition ${
                                isSelected
                                  ? 'bg-[#5E43F3]/10 text-[#5E43F3] font-bold'
                                  : 'hover:bg-neutral-50 text-neutral-800'
                              }`}
                            >
                              <div className="truncate pr-2">
                                <div className="truncate font-semibold">{rally.title}</div>
                                <div className="text-[10px] text-neutral-400 truncate">{rally.location}</div>
                              </div>
                              {isSelected && <Check className="h-3.5 w-3.5 text-[#5E43F3]" />}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="py-2 text-center text-xs text-neutral-400">No active local rallies</p>
                    )}

                    <div className="mt-2 border-t border-neutral-100 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsRallyPopoverOpen(false);
                          handleClose();
                          setCreateFlowType('rally');
                        }}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#5E43F3] py-2 text-xs font-bold text-white transition hover:bg-[#4E34E0]"
                      >
                        <Plus className="h-3.5 w-3.5" /> Create a New Rally
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Post Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!hasContent || isSubmitting}
              className={`rounded-full px-5 py-2 text-sm font-bold transition duration-150 ${
                hasContent && !isSubmitting
                  ? 'bg-[#5E43F3] text-white shadow-md shadow-[#5E43F3]/25 hover:bg-[#4E34E0] active:scale-95'
                  : 'cursor-not-allowed bg-neutral-200 text-neutral-500'
              }`}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Posting
                </span>
              ) : (
                'Post'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden File Input for Image/Video */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};
