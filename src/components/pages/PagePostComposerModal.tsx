import React, { useState } from 'react';
import {
  ArrowLeft,
  Image as ImageIcon,
  Send,
  MapPin,
  Sparkles,
  Smile,
  Check,
  X,
  UploadCloud,
} from 'lucide-react';
import { Page } from '../../types';
import { useLalao } from '../../context/LalaoContext';

interface PagePostComposerModalProps {
  page: Page;
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_POST_IMAGES = [
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1000&auto=format&fit=crop&q=80',
];

export const PagePostComposerModal: React.FC<PagePostComposerModalProps> = ({
  page,
  isOpen,
  onClose,
}) => {
  const { createPagePost } = useLalao();

  const [text, setText] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | undefined>(undefined);
  const [location, setLocation] = useState(page.location || '');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [showImageTray, setShowImageTray] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() && !mediaUrl) return;

    createPagePost(page.id, {
      text: text.trim(),
      mediaUrl,
      mediaType: mediaUrl ? 'image' : undefined,
      location: showLocationInput ? location.trim() : undefined,
    });

    setText('');
    setMediaUrl(undefined);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMediaUrl(url);
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-white overflow-y-auto flex flex-col animate-in fade-in slide-in-from-right-4 duration-250">
      {/* Top Sticky Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 sm:px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-neutral-100 text-neutral-800 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="text-base font-black text-neutral-950">Create Post</h3>
            <p className="text-xs text-neutral-500 font-medium truncate max-w-[180px] sm:max-w-md">
              Publishing as @{page.username}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={!text.trim() && !mediaUrl}
          className="px-4 py-2 rounded-xl bg-[#5E43F3] text-white text-xs font-bold hover:bg-[#4E34E0] disabled:opacity-40 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Publish</span>
        </button>
      </div>

      {/* Page Content Container */}
      <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 pb-24 flex-1">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Author Badge */}
          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-100">
            <img
              src={page.avatar}
              alt={page.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-violet-200 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-950">{page.name}</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-violet-100 text-[#5E43F3]">
                  {page.badge || 'PAGE'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-0.5">Followers and public subscribers will see this update</p>
            </div>
          </div>

          {/* Text Area */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`What's happening at ${page.name}? Announce updates, launch products, share highlights or post drop details...`}
            rows={6}
            autoFocus
            className="w-full text-base font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none resize-none p-2 border border-neutral-100 rounded-2xl bg-neutral-50/50"
          />

          {/* Attached Media Preview */}
          {mediaUrl && (
            <div className="relative rounded-3xl overflow-hidden border border-neutral-200 bg-neutral-900 max-h-72">
              <img
                src={mediaUrl}
                alt="Post Media"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setMediaUrl(undefined)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/75 text-white flex items-center justify-center hover:bg-black cursor-pointer transition-colors shadow-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Preset Image Tray */}
          {showImageTray && (
            <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 animate-in fade-in space-y-2.5">
              <p className="text-xs font-bold text-neutral-600">Select a featured cover visual:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {PRESET_POST_IMAGES.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setMediaUrl(url);
                      setShowImageTray(false);
                    }}
                    className="h-20 rounded-xl overflow-hidden border-2 border-transparent hover:border-[#5E43F3] cursor-pointer transition-all hover:scale-105"
                  >
                    <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Location Bar */}
          {showLocationInput && (
            <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
              <MapPin className="w-4 h-4 text-[#5E43F3] shrink-0" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Tag event location or hub (e.g. Warri Innovation Hub)..."
                className="w-full bg-transparent text-xs font-semibold text-neutral-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowLocationInput(false)}
                className="text-neutral-400 hover:text-neutral-700 text-xs cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Attachment Toolbar */}
          <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-neutral-600">
              <button
                type="button"
                onClick={() => setShowImageTray(!showImageTray)}
                className="px-3 py-2 rounded-xl bg-violet-50 text-[#5E43F3] text-xs font-bold hover:bg-violet-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Add Image"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Preset Cover</span>
              </button>

              <label
                className="px-3 py-2 rounded-xl bg-neutral-100 text-neutral-700 text-xs font-bold hover:bg-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Upload Photo"
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <UploadCloud className="w-4 h-4 text-neutral-500" />
                <span>Upload</span>
              </label>

              <button
                type="button"
                onClick={() => setShowLocationInput(!showLocationInput)}
                className="px-3 py-2 rounded-xl bg-neutral-100 text-neutral-700 text-xs font-bold hover:bg-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Add Location"
              >
                <MapPin className="w-4 h-4 text-neutral-500" />
                <span>Location</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={!text.trim() && !mediaUrl}
              className="px-6 py-2.5 rounded-xl bg-[#5E43F3] text-white text-xs font-bold hover:bg-[#4E34E0] disabled:opacity-40 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publish Post</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
