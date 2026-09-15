import React, { useState, useEffect, useRef } from 'react';
import { X, Image, Video, MapPin, Globe, Users, Check } from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';

export const PostComposerModal: React.FC = () => {
  const {
    currentUser,
    location,
    createPost,
    createFlowType,
    setCreateFlowType,
    setIsCreateSheetOpen,
    composerInitialText,
    setComposerInitialText,
  } = useLalao();

  const [text, setText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [postLocation, setPostLocation] = useState(location.name);
  const [audience, setAudience] = useState<'nearby' | 'followers'>('nearby');
  const [isAudienceDropdownOpen, setIsAudienceDropdownOpen] = useState(false);
  const [showMediaPresets, setShowMediaPresets] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  if (createFlowType !== 'post') return null;

  const handleClose = () => {
    setCreateFlowType(null);
    setIsCreateSheetOpen(false);
    setComposerInitialText('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !mediaUrl) return;
    createPost({
      text: text.trim(),
      mediaUrl: mediaUrl || undefined,
      mediaType,
      location: postLocation,
    });
    setComposerInitialText('');
  };

  const sampleMediaPresets = [
    {
      title: 'Local Streetwear',
      type: 'image' as const,
      url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: 'Community Football',
      type: 'video' as const,
      url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: 'Evening Sunset',
      type: 'image' as const,
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    },
    {
      title: 'Local Food Grill',
      type: 'image' as const,
      url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <div
      ref={containerRef}
      id="post-composer-screen"
      className="absolute inset-0 z-40 bg-white flex flex-col min-h-full overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-250"
    >
      {/* Sticky Top Header Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 flex items-center justify-between">
        <button
          onClick={handleClose}
          className="text-sm font-semibold text-neutral-600 hover:text-neutral-950 px-2 py-1 -ml-2 rounded-lg hover:bg-neutral-100 cursor-pointer transition-colors"
        >
          Cancel
        </button>

        <h3 className="font-bold text-base text-neutral-950">New Post</h3>

        <button
          id="btn-submit-post"
          onClick={handleSubmit}
          disabled={!text.trim() && !mediaUrl}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
            text.trim() || mediaUrl
              ? 'bg-[#5E43F3] text-white hover:bg-[#4E34E0] shadow-md shadow-[#5E43F3]/25 active:scale-95'
              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
          }`}
        >
          Post
        </button>
      </div>

      {/* Main Composer Content Body */}
      <div className="flex-1 max-w-xl mx-auto w-full p-4 sm:p-6 space-y-4 pb-24">
        {/* User Info & Audience Pill */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Avatar src={currentUser.avatar} alt={currentUser.name} size="md" />
            <div>
              <p className="font-bold text-sm text-neutral-900">{currentUser.name}</p>
              <div className="relative inline-block mt-0.5">
                <button
                  type="button"
                  onClick={() => setIsAudienceDropdownOpen(!isAudienceDropdownOpen)}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-[11px] font-semibold text-neutral-600 transition-colors cursor-pointer"
                >
                  {audience === 'nearby' ? (
                    <>
                      <Globe className="w-3 h-3 text-[#5E43F3]" />
                      <span>Anyone nearby</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-3 h-3 text-neutral-600" />
                      <span>Followers only</span>
                    </>
                  )}
                </button>

                {isAudienceDropdownOpen && (
                  <div className="absolute left-0 top-6 z-10 w-48 bg-white rounded-xl shadow-lg border border-neutral-100 p-1 text-xs space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAudience('nearby');
                        setIsAudienceDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-neutral-50 text-left font-medium cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-[#5E43F3]" />
                        Anyone nearby
                      </span>
                      {audience === 'nearby' && <Check className="w-3.5 h-3.5 text-[#5E43F3]" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAudience('followers');
                        setIsAudienceDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-neutral-50 text-left font-medium cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-neutral-600" />
                        Followers only
                      </span>
                      {audience === 'followers' && <Check className="w-3.5 h-3.5 text-[#5E43F3]" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-neutral-600 font-medium px-2.5 py-1 rounded-full bg-neutral-50 border border-neutral-200">
            <MapPin className="w-3.5 h-3.5 text-[#5E43F3]" />
            <input
              type="text"
              value={postLocation}
              onChange={(e) => setPostLocation(e.target.value)}
              className="w-24 outline-none text-xs text-neutral-800 bg-transparent font-semibold"
              title="Post location tag"
            />
          </div>
        </div>

        {/* Textarea */}
        <div className="min-h-[160px] pt-2">
          <textarea
            id="input-post-text"
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`What's happening in ${postLocation}? Share local news, questions, or updates...`}
            className="w-full text-base text-neutral-900 placeholder:text-neutral-400 border-none resize-none focus:outline-none leading-relaxed"
            autoFocus
          />
        </div>

        {/* Attached Media Preview */}
        {mediaUrl && (
          <div className="relative rounded-2xl overflow-hidden bg-neutral-100 max-h-64 group border border-neutral-200 shadow-sm">
            <img
              src={mediaUrl}
              alt="Attachment preview"
              referrerPolicy="no-referrer"
              className="w-full h-56 object-cover"
            />
            {mediaType === 'video' && (
              <span className="absolute bottom-2 left-2 px-2.5 py-1 bg-black/75 text-white rounded-lg text-[11px] font-mono">
                Video attached
              </span>
            )}
            <button
              type="button"
              onClick={() => setMediaUrl('')}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/75 text-white hover:bg-black transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Media Presets Selector */}
        {showMediaPresets && (
          <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-2.5">
            <p className="text-xs font-bold text-neutral-800">Choose attachment sample:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sampleMediaPresets.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setMediaUrl(item.url);
                    setMediaType(item.type);
                    setShowMediaPresets(false);
                  }}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-neutral-200 hover:border-[#5E43F3] text-left transition-all cursor-pointer shadow-2xs"
                >
                  <img
                    src={item.url}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-neutral-900 truncate">{item.title}</p>
                    <p className="text-[10px] text-neutral-500 uppercase font-mono">{item.type}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom toolbar */}
        <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-composer-attach-photo"
              onClick={() => setShowMediaPresets(!showMediaPresets)}
              className="px-3 py-2 rounded-xl text-neutral-700 hover:text-[#5E43F3] hover:bg-indigo-50 border border-neutral-200 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Add photo"
            >
              <Image className="w-4 h-4 text-[#5E43F3]" />
              <span>Photo</span>
            </button>

            <button
              type="button"
              id="btn-composer-attach-video"
              onClick={() => {
                setShowMediaPresets(true);
                setMediaType('video');
              }}
              className="px-3 py-2 rounded-xl text-neutral-700 hover:text-[#5E43F3] hover:bg-indigo-50 border border-neutral-200 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Add video"
            >
              <Video className="w-4 h-4 text-rose-500" />
              <span>Video</span>
            </button>
          </div>

          <span className="text-xs font-mono text-neutral-400">
            {text.length}/500
          </span>
        </div>
      </div>
    </div>
  );
};
