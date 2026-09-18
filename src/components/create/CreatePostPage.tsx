import React, { ChangeEvent, useRef, useState } from 'react';
import {
  BarChart3,
  Globe,
  Hand,
  Image as ImageIcon,
  MapPin,
  Smile,
  Video,
  X,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';

export const CreatePostPage: React.FC = () => {
  const {
    currentUser,
    location,
    createPost,
    setActiveTab,
    setCreateFlowType,
    setIsCreateSheetOpen,
    triggerShareToast,
  } = useLalao();

  const [text, setText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const mediaInputRef = useRef<HTMLInputElement | null>(null);

  const handleClose = () => {
    setText('');
    setMediaUrl('');
    setCreateFlowType(null);
    setIsCreateSheetOpen(false);
    setActiveTab('home');
  };

  const handleMediaSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const nextUrl = URL.createObjectURL(file);
    setMediaUrl(nextUrl);
    setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
    event.target.value = '';
  };

  const handleSubmit = () => {
    if (!text.trim() && !mediaUrl) return;

    createPost({
      text: text.trim(),
      mediaUrl: mediaUrl || undefined,
      mediaType,
      location: location.name,
    });

    setText('');
    setMediaUrl('');
    setCreateFlowType(null);
    setIsCreateSheetOpen(false);
    setActiveTab('home');
    triggerShareToast('Post published successfully');
  };

  const actions = [
    { key: 'image', icon: ImageIcon, label: 'Image', tone: 'text-[#5E43F3]' },
    { key: 'gif', label: 'GIF', tone: 'text-neutral-700', textOnly: true },
    { key: 'poll', icon: BarChart3, label: 'Poll', tone: 'text-[#5E43F3]' },
    { key: 'emoji', icon: Smile, label: 'Emoji', tone: 'text-amber-500' },
    { key: 'location', icon: MapPin, label: 'Location', tone: 'text-emerald-600' },
    { key: 'rally', icon: Hand, label: 'Rally', tone: 'text-[#5E43F3]' },
  ];

  return (
    <div className="mx-auto w-full max-w-[640px] px-4 py-6 lg:py-10">
      <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <div className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar src={currentUser.avatar} alt={currentUser.name} size="md" />
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#f6f3ee] px-2.5 py-1 text-[11px] font-bold text-neutral-700 ring-1 ring-neutral-200"
            >
              <Globe className="h-3.5 w-3.5 text-[#5E43F3]" />
              Everyone
            </button>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Close composer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 pb-3 pt-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="What’s happening?"
            className="w-full resize-none bg-transparent text-[20px] leading-[1.4] tracking-[-0.02em] text-neutral-900 placeholder:text-neutral-500 focus:outline-none"
            autoFocus
          />
        </div>

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
                onClick={() => setMediaUrl('')}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
                aria-label="Remove media"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="border-t border-neutral-200 px-4 py-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-[#f6f3ee] px-2.5 py-1.5 text-[11px] font-semibold text-neutral-700 ring-1 ring-neutral-200"
          >
            <Globe className="h-3.5 w-3.5 text-[#5E43F3]" />
            Everyone can reply
          </button>

          <div className="my-3 h-px bg-neutral-200" />

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => mediaInputRef.current?.click()}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#5E43F3] transition hover:bg-[#5E43F3]/8"
                aria-label="Add media"
                title="Add media"
              >
                <ImageIcon className="h-4 w-4" />
              </button>

              {actions.slice(1).map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.key}
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-neutral-100"
                    aria-label={action.label}
                    title={action.label}
                  >
                    {action.textOnly ? (
                      <span className={`text-[10px] font-black uppercase tracking-[0.12em] ${action.tone}`}>
                        GIF
                      </span>
                    ) : (
                      <Icon className={`h-4 w-4 ${action.tone}`} />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!text.trim() && !mediaUrl}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                text.trim() || mediaUrl
                  ? 'bg-[#5E43F3] text-white shadow-md shadow-[#5E43F3]/20 hover:bg-[#4E34E0]'
                  : 'cursor-not-allowed bg-neutral-200 text-neutral-500'
              }`}
            >
              Post
            </button>
          </div>
        </div>
      </div>

      <input
        ref={mediaInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleMediaSelect}
      />
    </div>
  );
};
