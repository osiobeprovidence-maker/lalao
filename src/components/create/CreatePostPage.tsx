// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  GalleryHorizontalEnd,
  Globe,
  Hand,
  Image as ImageIcon,
  Lock,
  MapPin,
  PenLine,
  SwitchCamera,
  Video,
  X,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { RallyComposerModal } from './RallyComposerModal';

type PostType = 'normal' | 'rally';
type MediaKind = 'image' | 'video';
type CameraFacing = 'environment' | 'user';

export const CreatePostPage: React.FC = () => {
  const {
    location,
    createPost,
    createFlowType,
    setActiveTab,
    setCreateFlowType,
    setIsCreateSheetOpen,
    setIsLocationModalOpen,
    triggerShareToast,
  } = useLalao();

  const [postType, setPostType] = useState<PostType>('normal');
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaKind>('image');
  const [cameraMode, setCameraMode] = useState<MediaKind>('image');
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>('environment');
  const [locationText, setLocationText] = useState(location.name);
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);

  const hasContent = Boolean(caption.trim() || mediaUrl);

  useEffect(() => {
    if (createFlowType === 'rally') {
      setPostType('rally');
    } else if (createFlowType === 'post') {
      setPostType('normal');
    } else if (createFlowType === null) {
      setPostType('normal');
    }
  }, [createFlowType]);

  useEffect(() => {
    setCreateFlowType(postType === 'rally' ? 'rally' : 'post');
    return () => setCreateFlowType(null);
  }, [postType, setCreateFlowType]);

  useEffect(() => {
    setIsCreateSheetOpen(false);
  }, [setIsCreateSheetOpen]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (mediaUrl && mediaUrl.startsWith('blob:')) {
        URL.revokeObjectURL(mediaUrl);
      }
    };
  }, [mediaUrl]);

  const stopCameraStream = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraOpen(false);
    setIsRecording(false);
    mediaRecorderRef.current = null;
    recordedChunksRef.current = [];
  };

  const openCameraStream = async (requestedFacing: CameraFacing = cameraFacing) => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Camera access is not supported in this browser. Please use Gallery upload instead.');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: requestedFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: cameraMode === 'video',
      });

      streamRef.current = stream;
      setIsCameraOpen(true);
      setError(null);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        void videoRef.current.play();
      }

      return true;
    } catch {
      setError('Camera access was denied or unavailable. Please allow camera access or use Gallery upload instead.');
      setIsCameraOpen(false);
      return false;
    }
  };

  const handleExit = () => {
    if (hasContent) {
      const ok = window.confirm('Discard your draft before leaving Create Post?');
      if (!ok) return;
    }

    stopCameraStream();
    setCaption('');
    setMediaUrl(null);
    setMediaType('image');
    setCameraMode('image');
    setLocationText(location.name);
    setIsPublic(true);
    setError(null);
    setCreateFlowType(null);
    setActiveTab('home');
  };

  const openGalleryPicker = (kind: MediaKind) => {
    const input = kind === 'image' ? photoInputRef.current : videoInputRef.current;
    input?.click();
  };

  const handleMediaFileSelected = (event: React.ChangeEvent<HTMLInputElement>, kind: MediaKind) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const nextUrl = URL.createObjectURL(file);
    setMediaUrl((current) => {
      if (current && current.startsWith('blob:')) {
        URL.revokeObjectURL(current);
      }
      return nextUrl;
    });
    setMediaType(kind);
    setError(null);
    stopCameraStream();
    event.target.value = '';
  };

  const capturePhoto = async () => {
    const success = isCameraOpen || (await openCameraStream());
    if (!success || !videoRef.current || !streamRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const context = canvas.getContext('2d');
    if (!context) {
      setError('Unable to capture this image. Please try again.');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));

    if (!blob) {
      setError('Unable to capture this image. Please try again.');
      return;
    }

    const nextUrl = URL.createObjectURL(blob);
    setMediaUrl((current) => {
      if (current && current.startsWith('blob:')) {
        URL.revokeObjectURL(current);
      }
      return nextUrl;
    });
    setMediaType('image');
    stopCameraStream();
  };

  const startVideoRecording = async () => {
    const success = isCameraOpen || (await openCameraStream());
    if (!success || !streamRef.current) return;

    if (!window.MediaRecorder) {
      setError('Video recording is not supported in this browser.');
      return;
    }

    const stream = streamRef.current;
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
        ? 'video/webm;codecs=vp8'
        : 'video/webm';

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recordedChunksRef.current = [];
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: mimeType || 'video/webm' });
      const nextUrl = URL.createObjectURL(blob);
      setMediaUrl((current) => {
        if (current && current.startsWith('blob:')) {
          URL.revokeObjectURL(current);
        }
        return nextUrl;
      });
      setMediaType('video');
      setError(null);
      stopCameraStream();
    };

    recorder.start();
    setIsRecording(true);
    setError(null);
  };

  const stopVideoRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      return;
    }

    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const handleCameraButtonAction = async () => {
    if (cameraMode === 'image') {
      await capturePhoto();
      return;
    }

    if (isRecording) {
      stopVideoRecording();
      return;
    }

    await startVideoRecording();
  };

  const handleSubmit = async () => {
    if (!caption.trim() && !mediaUrl) {
      setError('Add a caption or media before publishing.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      createPost({
        text: caption.trim(),
        mediaUrl: mediaUrl || undefined,
        mediaType,
        location: locationText || location.name,
        visibility: isPublic ? 'public' : 'followers',
      });
      setCaption('');
      setMediaUrl(null);
      setMediaType('image');
      setLocationText(location.name);
      setError(null);
      setActiveTab('home');
      triggerShareToast('Post published successfully');
    } catch {
      setError('Unable to publish your post right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRally = postType === 'rally';

  if (isRally) {
    return (
      <div className="mx-auto w-full max-w-[1080px] px-3 py-5 sm:px-5 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-[-0.04em] text-neutral-950">Create Post</h1>
            <p className="mt-1 text-sm text-neutral-600">Share a moment with your community.</p>
          </div>
          <button
            type="button"
            onClick={handleExit}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-950"
            aria-label="Close create post"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-5 flex w-full max-w-md items-center rounded-full border border-neutral-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setPostType('normal')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${
              !isRally ? 'bg-[#5E43F3] text-white shadow-sm' : 'text-neutral-600 hover:text-neutral-950'
            }`}
          >
            <PenLine className="h-4 w-4" />
            Normal Post
          </button>
          <button
            type="button"
            onClick={() => setPostType('rally')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${
              isRally ? 'bg-[#5E43F3] text-white shadow-sm' : 'text-neutral-600 hover:text-neutral-950'
            }`}
          >
            <Hand className="h-4 w-4" />
            Rally
          </button>
        </div>

        <div className="min-h-[calc(100vh-220px)] rounded-[28px] border border-neutral-200 bg-[#f6f3ee] p-2 sm:p-4">
          <RallyComposerModal embedded />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1080px] px-3 py-5 sm:px-5 lg:px-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-[-0.04em] text-neutral-950">Create Post</h1>
          <p className="mt-1 text-sm text-neutral-600">Share a moment with your community.</p>
        </div>
        <button
          type="button"
          onClick={handleExit}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-950"
          aria-label="Close create post"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-5 flex w-full max-w-md items-center rounded-full border border-neutral-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setPostType('normal')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${
            !isRally ? 'bg-[#5E43F3] text-white shadow-sm' : 'text-neutral-600 hover:text-neutral-950'
          }`}
        >
          <PenLine className="h-4 w-4" />
          Normal Post
        </button>
        <button
          type="button"
          onClick={() => setPostType('rally')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${
            isRally ? 'bg-[#5E43F3] text-white shadow-sm' : 'text-neutral-600 hover:text-neutral-950'
          }`}
        >
          <Hand className="h-4 w-4" />
          Rally
        </button>
      </div>

      <div className="rounded-[28px] border border-neutral-200 bg-white p-3 sm:p-4 lg:p-5">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[24px] bg-[#101827] p-3 text-white shadow-inner shadow-black/20 sm:p-4">
            <div className="mb-3 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCameraMode('image')}
                  className={`rounded-full px-2.5 py-1.5 font-medium transition ${cameraMode === 'image' ? 'bg-white/10 text-white' : 'bg-white/5 text-slate-300'}`}
                >
                  Photo mode
                </button>
                <button
                  type="button"
                  onClick={() => setCameraMode('video')}
                  className={`rounded-full px-2.5 py-1.5 font-medium transition ${cameraMode === 'video' ? 'bg-white/10 text-white' : 'bg-white/5 text-slate-300'}`}
                >
                  Video mode
                </button>
              </div>
              <button
                type="button"
                onClick={stopCameraStream}
                className="rounded-full border border-white/15 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10"
                aria-label="Close camera preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_35%),linear-gradient(180deg,#111827_0%,#0f172a_100%)] px-4 py-5 text-center sm:min-h-[400px]">
              {mediaUrl ? (
                <div className="relative w-full overflow-hidden rounded-[20px] border border-white/10 bg-black shadow-lg">
                  {mediaType === 'video' ? (
                    <video src={mediaUrl} controls className="h-[260px] w-full object-cover sm:h-[290px]" />
                  ) : (
                    <img src={mediaUrl} alt="Selected media preview" className="h-[260px] w-full object-cover sm:h-[290px]" />
                  )}
                </div>
              ) : isCameraOpen ? (
                <div className="relative w-full overflow-hidden rounded-[20px] border border-white/10 bg-black shadow-lg">
                  <video ref={videoRef} className="h-[260px] w-full object-cover sm:h-[290px]" playsInline muted autoPlay />
                </div>
              ) : (
                <>
                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/90">
                    <Camera className="h-9 w-9" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-[-0.04em] text-white">Camera Ready</h2>
                  <p className="mt-3 max-w-xs text-sm leading-6 text-slate-300">
                    Tap the capture button to take a photo
                    <br />
                    or hold to record a video.
                  </p>
                </>
              )}

              {error && !mediaUrl && (
                <div className="mt-3 w-full rounded-xl border border-red-200 bg-red-500/10 px-3 py-2 text-left text-xs text-red-200">
                  {error}
                </div>
              )}

              <div className="mt-6 flex w-full max-w-[410px] items-center justify-between gap-3 px-1">
                <button
                  type="button"
                  onClick={() => openGalleryPicker(cameraMode)}
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/10"
                  aria-label="Open gallery"
                  title="Open gallery"
                >
                  <GalleryHorizontalEnd className="h-6 w-6" />
                </button>

                <button
                  type="button"
                  onClick={handleCameraButtonAction}
                  onPointerDown={() => {
                    if (cameraMode === 'video') {
                      void startVideoRecording();
                    }
                  }}
                  onPointerUp={() => {
                    if (cameraMode === 'video' && isRecording) {
                      stopVideoRecording();
                    }
                  }}
                  onPointerLeave={() => {
                    if (cameraMode === 'video' && isRecording) {
                      stopVideoRecording();
                    }
                  }}
                  className={`flex h-20 w-20 items-center justify-center rounded-full border-[6px] border-white/25 text-white shadow-[0_0_24px_rgba(94,67,243,0.55)] transition ${
                    isRecording ? 'bg-red-500 scale-[1.03]' : 'bg-[#5E43F3] hover:scale-105'
                  }`}
                  aria-label={cameraMode === 'image' ? 'Capture photo' : isRecording ? 'Stop video recording' : 'Record video'}
                  title={cameraMode === 'image' ? 'Capture photo' : isRecording ? 'Stop video recording' : 'Record video'}
                >
                  {cameraMode === 'video' ? <Video className="h-8 w-8" /> : <Camera className="h-8 w-8" />}
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
                    setCameraFacing(nextFacing);
                    stopCameraStream();
                    await openCameraStream(nextFacing);
                  }}
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/10"
                  aria-label="Switch camera"
                  title="Switch camera"
                >
                  <SwitchCamera className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-[22px] border border-neutral-200 bg-[#f9f7f4] p-4">
              <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
                <PenLine className="h-3.5 w-3.5 text-[#5E43F3]" />
                Add a caption
              </label>
              <textarea
                value={caption}
                onChange={(event) => setCaption(event.target.value.slice(0, 500))}
                placeholder="What's on your mind?"
                rows={6}
                className="w-full resize-none rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/15"
              />
              <div className="mt-2 flex justify-end text-[11px] font-medium text-neutral-500">
                {caption.length}/500
              </div>
            </div>

            <div className="space-y-2.5 rounded-[22px] border border-neutral-200 bg-[#f9f7f4] p-3">
              <button
                type="button"
                onClick={() => openGalleryPicker('image')}
                className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                <span className="flex items-center gap-2.5">
                  <ImageIcon className="h-4 w-4 text-[#5E43F3]" />
                  Add media
                </span>
                <span className="text-xs text-neutral-500">Photos or videos</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                <span className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 text-[#5E43F3]" />
                  Add location
                </span>
                <span className="text-xs text-neutral-500">{locationText}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPublic((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-3 py-3 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                <span className="flex items-center gap-2.5">
                  {isPublic ? <Globe className="h-4 w-4 text-[#5E43F3]" /> : <Lock className="h-4 w-4 text-[#5E43F3]" />}
                  {isPublic ? 'Public' : 'Followers only'}
                </span>
                <span className="text-xs text-neutral-500">{isPublic ? 'Visible to everyone' : 'Private to followers'}</span>
              </button>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || (!caption.trim() && !mediaUrl)}
              className={`mt-auto w-full rounded-full px-4 py-3.5 text-sm font-bold text-white transition ${
                isSubmitting || (!caption.trim() && !mediaUrl)
                  ? 'cursor-not-allowed bg-neutral-300 text-neutral-500'
                  : 'bg-[#5E43F3] hover:bg-[#4E34E0] shadow-lg shadow-[#5E43F3]/25'
              }`}
            >
              {isSubmitting ? 'Publishing...' : 'Post'}
            </button>
          </div>
        </div>
      </div>

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => handleMediaFileSelected(event, 'image')}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        hidden
        onChange={(event) => handleMediaFileSelected(event, 'video')}
      />
    </div>
  );
};
