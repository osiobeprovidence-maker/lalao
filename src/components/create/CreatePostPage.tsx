import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Image as ImageIcon,
  MapPin,
  MoreHorizontal,
  Smile,
  X,
  ChevronDown,
  Globe,
  Users,
  UserCheck,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { compressImage } from '../../lib/imageCompression';

type PostType = 'normal' | 'rally';
type MediaKind = 'image' | 'video';
type Audience = 'Everyone' | 'Followers' | 'Friends' | 'Only Me';

export const CreatePostPage: React.FC = () => {
  const {
    location,
    createPost,
    setActiveTab,
    setCreateFlowType,
    setIsCreateSheetOpen,
    setIsLocationModalOpen,
    triggerShareToast,
    currentUser,
  } = useLalao();

  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaKind>('image');
  const [locationText, setLocationText] = useState(location.name);
  const [audience, setAudience] = useState<Audience>('Everyone');
  const [isAudienceMenuOpen, setIsAudienceMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const generateUploadUrl = useMutation(api.social.generateUploadUrl);

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  
  const maxChars = 500;
  
  // Emojis for the simple picker
  const emojis = ['😀','😂','❤️','🔥','👍','🎉','✨','🙌','😎','💯','🤔','👀'];

  useEffect(() => {
    setCreateFlowType('post');
    return () => setCreateFlowType(null);
  }, [setCreateFlowType]);

  useEffect(() => {
    setIsCreateSheetOpen(false);
  }, [setIsCreateSheetOpen]);

  useEffect(() => {
    return () => {
      if (mediaUrl && mediaUrl.startsWith('blob:')) {
        URL.revokeObjectURL(mediaUrl);
      }
    };
  }, [mediaUrl]);

  const handleExit = () => {
    if (caption.trim() || mediaUrl) {
      const ok = window.confirm('Discard your draft before leaving Create Post?');
      if (!ok) return;
    }
    setCreateFlowType(null);
    setActiveTab('home');
  };

  const handleMediaFileSelected = (event: React.ChangeEvent<HTMLInputElement>, kind: MediaKind) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const nextUrl = URL.createObjectURL(file);
    setMediaUrl((current) => {
      if (current && current.startsWith('blob:')) {
        URL.revokeObjectURL(current);
      }
      return nextUrl;
    });
    setMediaType(kind);
    setError(null);
    event.target.value = '';
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const kind = file.type.startsWith('video/') ? 'video' : 'image';
    handleMediaFileSelected(event, kind);
  };

  const handleSubmit = async () => {
    if (!caption.trim() && !mediaUrl) {
      setError('Add a caption or media before publishing.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      let finalStorageId: string | undefined = undefined;
      if (selectedFile) {
        const fileToUpload = selectedFile.type.startsWith('image/')
          ? await compressImage(selectedFile, { maxWidth: 1600, quality: 0.82 })
          : selectedFile;

        const uploadUrl = await generateUploadUrl();
        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': fileToUpload.type || 'application/octet-stream' },
          body: fileToUpload,
        });
        if (!res.ok) {
          throw new Error('Failed to upload media file');
        }
        const data = await res.json();
        finalStorageId = data.storageId;
      }

      await createPost({
        text: caption.trim(),
        mediaUrl: finalStorageId ? undefined : (mediaUrl || undefined),
        mediaStorageId: finalStorageId,
        mediaType,
        location: locationText || location.name,
        audience: audience.toLowerCase(),
      });
      setCaption('');
      setSelectedFile(null);
      setMediaUrl(null);
      setError(null);
      setActiveTab('home');
      triggerShareToast('Post published successfully');
    } catch {
      setError('Unable to publish your post right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    if (caption.length < maxChars) {
      setCaption(prev => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  const audienceOptions = [
    { id: 'Everyone', icon: <Globe className="w-4 h-4" /> },
    { id: 'Followers', icon: <Users className="w-4 h-4" /> },
    { id: 'Friends', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'Only Me', icon: <Lock className="w-4 h-4" /> },
  ];

  return (
    <div className="mx-auto w-full max-w-[600px] h-screen bg-theme-surface flex flex-col relative sm:h-auto sm:my-8 sm:rounded-2xl sm:border sm:border-theme-divider sm:shadow-xl">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-theme-divider-light shrink-0">
        <button
          type="button"
          onClick={handleExit}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-theme-surface-hover text-theme-primary transition"
        >
          <X className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-theme-primary">Create Post</h1>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || (!caption.trim() && !mediaUrl)}
          className={`px-4 py-1.5 rounded-full font-bold text-sm transition ${
            isSubmitting || (!caption.trim() && !mediaUrl)
              ? 'bg-[#5E43F3]/50 text-white cursor-not-allowed'
              : 'bg-[#5E43F3] text-white hover:bg-[#4E34E0]'
          }`}
        >
          {isSubmitting ? 'Posting...' : 'Post'}
        </button>
      </div>

      {/* Author Section & Content */}
      <div className="flex-1 overflow-y-auto p-4 flex gap-3">
        {/* Avatar */}
        <div className="shrink-0 pt-1">
          <div className="w-10 h-10 rounded-full bg-theme-surface-active overflow-hidden">
            {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#5E43F3]/10 flex items-center justify-center text-[#5E43F3] font-bold">
                {currentUser?.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
        </div>

        {/* Post Content */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-theme-primary">{currentUser?.displayName || currentUser?.username || 'You'}</span>
          </div>
          
          {/* Audience Selector */}
          <div className="relative mb-3">
            <button
              type="button"
              onClick={() => setIsAudienceMenuOpen(!isAudienceMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-theme-divider text-xs font-bold text-[#5E43F3] hover:bg-[#5E43F3]/5 transition"
            >
              {audienceOptions.find(o => o.id === audience)?.icon}
              {audience}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            
            {isAudienceMenuOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-theme-surface rounded-xl shadow-lg border border-theme-divider-light py-1.5 z-50">
                {audienceOptions.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setAudience(opt.id as Audience);
                      setIsAudienceMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-theme-base transition ${audience === opt.id ? 'font-bold text-[#5E43F3]' : 'font-medium text-theme-secondary'}`}
                  >
                    <span className="flex items-center gap-2">{opt.icon} {opt.id}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <textarea
            value={caption}
            onChange={(event) => setCaption(event.target.value.slice(0, maxChars))}
            placeholder="What's happening?"
            className="w-full resize-none bg-transparent text-xl text-theme-primary placeholder:text-theme-tertiary outline-none min-h-[120px]"
          />

          {error && !mediaUrl && (
            <div className="mt-2 w-full rounded-xl border border-red-200 bg-red-500/10 px-3 py-2 text-left text-xs text-red-700">
              {error}
            </div>
          )}

          {mediaUrl && (
            <div className="relative w-full mt-3 rounded-2xl overflow-hidden border border-theme-divider-light group">
              <button
                type="button"
                onClick={() => {
                  setMediaUrl(null);
                  setSelectedFile(null);
                  setMediaType('image');
                }}
                className="absolute top-2 right-2 h-8 w-8 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white z-10 hover:bg-black/80 transition"
              >
                <X className="w-4 h-4" />
              </button>
              {mediaType === 'video' ? (
                <video src={mediaUrl} controls className="w-full max-h-[400px] object-contain bg-theme-inverse" />
              ) : (
                <img src={mediaUrl} alt="Attached" className="w-full max-h-[400px] object-cover" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Toolbar */}
      <div className="px-4 py-3 border-t border-theme-divider-light flex items-center justify-between bg-theme-surface relative">
        <div className="flex items-center gap-1">
          {/* Gallery Button */}
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="h-9 w-9 rounded-full flex items-center justify-center text-[#5E43F3] hover:bg-[#5E43F3]/10 transition"
            title="Add Media"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          
          {/* Camera Button */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="h-9 w-9 rounded-full flex items-center justify-center text-[#5E43F3] hover:bg-[#5E43F3]/10 transition"
            title="Take Photo/Video"
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* Emoji Button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="h-9 w-9 rounded-full flex items-center justify-center text-[#5E43F3] hover:bg-[#5E43F3]/10 transition"
            title="Add Emoji"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Location Button */}
          <button
            type="button"
            onClick={() => setActiveTab('location')}
            className="h-9 w-9 rounded-full flex items-center justify-center text-[#5E43F3] hover:bg-[#5E43F3]/10 transition"
            title={locationText}
          >
            <MapPin className="w-5 h-5" />
          </button>

          {/* More Options Button */}
          <button
            type="button"
            className="h-9 w-9 rounded-full flex items-center justify-center text-[#5E43F3] hover:bg-[#5E43F3]/10 transition"
            title="More options"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs font-medium text-theme-tertiary">
          {caption.length} / {maxChars}
        </div>

        {/* Simple Emoji Picker Dropdown */}
        {showEmojiPicker && (
          <div className="absolute bottom-[110%] left-4 bg-theme-surface border border-theme-divider-light shadow-xl rounded-xl p-2 w-64 z-50">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-theme-divider-light">
              <span className="text-xs font-bold text-theme-tertiary">Pick Emoji</span>
              <button onClick={() => setShowEmojiPicker(false)}><X className="w-3.5 h-3.5 text-theme-tertiary" /></button>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {emojis.map(e => (
                <button 
                  key={e} 
                  type="button"
                  onClick={() => insertEmoji(e)} 
                  className="h-8 w-8 flex items-center justify-center hover:bg-theme-surface-hover rounded-lg text-lg"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hidden Inputs */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
             const kind = file.type.startsWith('video/') ? 'video' : 'image';
             handleMediaFileSelected(event, kind);
          }
        }}
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraCapture}
      />
    </div>
  );
};
