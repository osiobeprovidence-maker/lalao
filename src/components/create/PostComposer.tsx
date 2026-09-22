import React, { useEffect, useRef, useState } from 'react';
import {
  Image as ImageIcon,
  Loader2,
  MapPin,
  Plus,
  Sparkles,
  Video,
  X,
} from 'lucide-react';
import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';
import { uploadImageToCloudinary } from '../../lib/cloudinary';

interface PostComposerProps {
  embedded?: boolean;
  onClose?: () => void;
}

export const PostComposer: React.FC<PostComposerProps> = ({ embedded = false, onClose }) => {
  const {
    currentUser,
    location,
    createPost,
    createRally,
    setCreateFlowType,
    setIsCreateSheetOpen,
    setIsLocationModalOpen,
    setActiveTab,
    triggerShareToast,
    generateUploadUrl,
    generateCloudinarySignature,
  } = useLalao();

  const createMuxDirectUpload = useAction(api.mux.createDirectUpload);
  const pollMuxStatus = useAction(api.mux.pollAndUpdatePost);

  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [attachedLocation, setAttachedLocation] = useState<string | null>(location.name || null);
  const [isRallyMode, setIsRallyMode] = useState(false);
  const [rallyTitle, setRallyTitle] = useState('');
  const [rallyDescription, setRallyDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setRallyTitle('');
    setRallyDescription('');
    setIsRallyMode(false);
    setCreateFlowType(null);
    setIsCreateSheetOpen(false);
    if (embedded) setActiveTab('home');
    if (onClose) onClose();
  };

  const hasDraftContent = Boolean(text.trim() || selectedFile || rallyTitle.trim() || rallyDescription.trim());

  const handleClose = () => {
    if (hasDraftContent && !window.confirm('Discard your draft before leaving?')) {
      return;
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
      if (method === 'PUT') xhr.setRequestHeader('Content-Type', file.type);
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
    if (isRallyMode) {
      if (!rallyTitle.trim() || !rallyDescription.trim()) {
        triggerShareToast('Add a title and details for your rally');
        return;
      }

      createRally({
        title: rallyTitle.trim(),
        description: rallyDescription.trim(),
        location: attachedLocation || location.name || 'Local',
        timeDate: 'Today · Soon',
        category: 'General',
      });
      resetComposer();
      return;
    }

    if (!text.trim() && !selectedFile) return;
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
            console.warn('Mux upload failed, falling back to storage:', muxErr);
            try {
              const uploadUrl = await generateUploadUrl();
              const res = await uploadFileWithProgress(uploadUrl, 'POST', selectedFile, () => undefined);
              finalMediaStorageId = res.storageId;
              finalMediaUrl = '';
            } catch (fallbackErr) {
              console.error('All upload methods failed:', fallbackErr);
              triggerShareToast('Media upload failed. Please try again.');
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
            console.warn('Storage upload failed; falling back to Cloudinary:', storageErr);
            try {
              const sig = await generateCloudinarySignature('posts');
              finalMediaUrl = await uploadImageToCloudinary(selectedFile, sig);
            } catch (cloudErr) {
              console.error('Cloudinary upload failed:', cloudErr);
              triggerShareToast('Media upload failed. Please try again.');
              setIsSubmitting(false);
              return;
            }
          }
        }
      }

      const created = await createPost({
        text: text.trim(),
        mediaUrl: finalMediaUrl || undefined,
        mediaType,
        location: attachedLocation || location.name || 'Local',
        visibility: 'public',
      } as any);

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

  return (
    <div className="mx-auto w-full max-w-[720px] px-3 py-4 sm:px-5 sm:py-6">
      <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="flex items-start gap-3 border-b border-neutral-100 px-4 py-4 sm:px-5">
          <Avatar src={currentUser.avatar} alt={currentUser.name} size="md" />
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">Post</span>
              <button
                type="button"
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
                aria-label="Close composer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!isRallyMode && (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                placeholder="What’s on your mind?"
                className="w-full resize-none bg-transparent text-[15px] leading-7 text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                autoFocus
              />
            )}

            {isRallyMode && (
              <div className="space-y-3 pb-1">
                <input
                  value={rallyTitle}
                  onChange={(e) => setRallyTitle(e.target.value)}
                  placeholder="Rally title"
                  className="w-full rounded-2xl border border-neutral-200 bg-[#f8f7f5] px-3 py-2.5 text-sm font-semibold text-neutral-900 placeholder:text-neutral-400 focus:border-[#5E43F3] focus:outline-none"
                />
                <textarea
                  value={rallyDescription}
                  onChange={(e) => setRallyDescription(e.target.value)}
                  rows={4}
                  placeholder="What do you need from the community?"
                  className="w-full resize-none rounded-2xl border border-neutral-200 bg-[#f8f7f5] px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#5E43F3] focus:outline-none"
                />
              </div>
            )}

            {attachedLocation && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                <MapPin className="h-3 w-3 text-emerald-600" />
                <span>{attachedLocation}</span>
                <button
                  type="button"
                  onClick={() => setAttachedLocation(null)}
                  className="text-emerald-500 hover:text-emerald-700"
                  aria-label="Remove location"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {mediaUrl && (
              <div className="relative mt-3 overflow-hidden rounded-[22px] border border-neutral-200 bg-neutral-100">
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
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-neutral-100 bg-white px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-2 text-[11px] font-bold text-neutral-700 transition hover:bg-neutral-200"
            >
              <ImageIcon className="h-4 w-4 text-[#5E43F3]" />
              Photo
            </button>
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-2 text-[11px] font-bold text-neutral-700 transition hover:bg-neutral-200"
            >
              <Video className="h-4 w-4 text-[#5E43F3]" />
              Video
            </button>
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-2 text-[11px] font-bold text-neutral-700 transition hover:bg-neutral-200"
            >
              <MapPin className="h-4 w-4 text-[#5E43F3]" />
              Location
            </button>
            <button
              type="button"
              onClick={() => setIsRallyMode((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-bold transition ${
                isRallyMode
                  ? 'bg-[#5E43F3] text-white shadow-sm shadow-[#5E43F3]/20'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Rally
            </button>
          </div>

          <button
            id="single-post-submit"
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || (!isRallyMode ? !Boolean(text.trim() || selectedFile) : !Boolean(rallyTitle.trim() && rallyDescription.trim()))}
            className="inline-flex items-center gap-2 rounded-full bg-[#5E43F3] px-4 py-2 text-[12px] font-bold text-white shadow-sm shadow-[#5E43F3]/20 transition hover:bg-[#4E34E0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {isSubmitting ? 'Posting' : isRallyMode ? 'Broadcast' : 'Post'}
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
    </div>
  );
};
