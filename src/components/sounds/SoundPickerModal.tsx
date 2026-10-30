import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  Music,
  Play,
  Pause,
  Check,
  Plus,
  Disc,
  Heart,
  Flame,
  Radio,
  Mic,
  Volume2,
  Bookmark,
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import {
  PRESET_SOUNDS,
  getPresetAudioUrl,
  globalAudio,
} from '../../services/audio/soundEngine';
import { CreateSoundModal } from './CreateSoundModal';

export interface SelectedSoundData {
  soundId: string;
  title: string;
  authorName: string;
  audioUrl: string;
  duration: number;
}

interface SoundPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSound: (sound: SelectedSoundData) => void;
}

const CATEGORIES = [
  { id: 'for_you', label: 'For You', icon: null },
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'original', label: 'Original Audio', icon: Mic },
  { id: 'effects', label: 'Sound Effects', icon: Volume2 },
  { id: 'favorites', label: 'Favorites', icon: Heart },
  { id: 'my_sounds', label: 'My Sounds', icon: Radio },
] as const;

export const SoundPickerModal: React.FC<SoundPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectSound,
}) => {
  const { currentUser, requireAuth, triggerShareToast } = useLalao();
  const [activeFilter, setActiveFilter] = useState<string>('for_you');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [localFavorites, setLocalFavorites] = useState<Record<string, boolean>>({});

  const [presetUrls, setPresetUrls] = useState<Record<string, string>>({});

  const toggleFavoriteMutation = useMutation(api.sounds.toggleFavouriteSound);

  useEffect(() => {
    PRESET_SOUNDS.forEach(async (p) => {
      const url = await getPresetAudioUrl(p);
      setPresetUrls((prev) => ({ ...prev, [p.id]: url }));
    });
  }, []);

  useEffect(() => {
    const unsub = globalAudio.subscribe((id, isPlaying) => {
      setPlayingId(isPlaying ? id : null);
    });
    return () => {
      unsub();
      globalAudio.stop();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      globalAudio.stop();
    }
  }, [isOpen]);

  // Query backend sounds
  const backendSounds = useQuery(
    api.sounds.listSounds,
    isOpen
      ? {
          filter: activeFilter === 'for_you' ? 'trending' : activeFilter,
          searchQuery: searchQuery.trim() || undefined,
          currentUserId: currentUser?.id,
          limit: 60,
        }
      : 'skip'
  );

  const displaySounds = useMemo(() => {
    const dbItems = backendSounds || [];
    const presets = PRESET_SOUNDS.map((p) => ({
      id: p.id,
      title: p.title,
      creatorName: p.creatorName,
      category: p.category,
      genre: p.genre,
      duration: p.duration,
      audioUrl: presetUrls[p.id] || '',
      coverUrl: undefined as string | undefined,
      isPreset: true,
      isFavorited: false,
    }));

    let filteredPresets = presets;
    if (activeFilter === 'music') {
      filteredPresets = presets.filter((p) => p.category === 'music');
    } else if (activeFilter === 'effects') {
      filteredPresets = presets.filter((p) => p.category === 'effects');
    } else if (activeFilter === 'original' || activeFilter === 'favorites' || activeFilter === 'my_sounds') {
      filteredPresets = [];
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filteredPresets = filteredPresets.filter(
        (p) => p.title.toLowerCase().includes(q) || p.genre.toLowerCase().includes(q)
      );
    }

    const mappedDb = dbItems.map((s: any) => ({
      id: s.id,
      title: s.title,
      creatorName: s.creator?.name || 'Creator',
      category: s.category,
      genre: s.genre,
      duration: s.duration,
      audioUrl: s.audioUrl,
      coverUrl: s.coverUrl,
      isPreset: false,
      isFavorited: localFavorites[s.id] !== undefined ? localFavorites[s.id] : Boolean(s.isFavorited),
    }));

    return [...mappedDb, ...filteredPresets];
  }, [backendSounds, presetUrls, activeFilter, searchQuery, localFavorites]);

  const handleTogglePlay = async (sound: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingId === sound.id) {
      globalAudio.stop();
    } else if (sound.audioUrl) {
      await globalAudio.play(sound.id, sound.audioUrl);
    }
  };

  const handleChoose = (sound: any) => {
    globalAudio.stop();
    onSelectSound({
      soundId: sound.id,
      title: sound.title,
      authorName: sound.creatorName,
      audioUrl: sound.audioUrl,
      duration: sound.duration,
    });
    onClose();
  };

  const handleFavoriteToggle = async (sound: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sound.isPreset) {
      triggerShareToast('Built-in preset saved to session');
      setLocalFavorites((prev) => ({ ...prev, [sound.id]: !prev[sound.id] }));
      return;
    }

    requireAuth(async () => {
      try {
        const nextState = !sound.isFavorited;
        setLocalFavorites((prev) => ({ ...prev, [sound.id]: nextState }));
        const res = await toggleFavoriteMutation({
          soundId: sound.id as any,
          authorUserId: currentUser?.id,
        });
        setLocalFavorites((prev) => ({ ...prev, [sound.id]: res.isFavorited }));
        triggerShareToast(res.isFavorited ? 'Added to sound favorites' : 'Removed from favorites');
      } catch {
        // silent fail
      }
    }, 'Sign in to save sounds to your favorites');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full sm:max-w-xl h-[88vh] sm:h-auto sm:max-h-[82vh] rounded-t-[28px] sm:rounded-3xl bg-[#0B0F19] border border-white/10 shadow-2xl flex flex-col text-white overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 space-y-3 bg-[#0B0F19]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#5E43F3]/20 text-[#5E43F3] flex items-center justify-center border border-[#5E43F3]/30">
                <Music className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">Add Sound</h2>
                <p className="text-[11px] text-gray-400">Discover beats, trending audio & music for your post</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#5E43F3]/15 hover:bg-[#5E43F3]/25 text-[#5E43F3] hover:text-white text-xs font-semibold border border-[#5E43F3]/30 transition-colors"
                title="Record or Upload Audio"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Sound</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                aria-label="Close sound picker"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, artist, genre, or keyword..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-400 outline-none focus:border-[#5E43F3] focus:bg-white/[0.08] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveFilter(cat.id)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#5E43F3] text-white shadow-md shadow-[#5E43F3]/25 scale-[1.02]'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {Icon ? <Icon className="w-3.5 h-3.5" /> : null}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sound List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
          {displaySounds.length === 0 ? (
            <div className="py-16 px-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-white/5 mx-auto flex items-center justify-center text-gray-500">
                <Music className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">
                {activeFilter === 'favorites'
                  ? 'No favorite sounds yet'
                  : activeFilter === 'my_sounds'
                  ? 'No original sounds uploaded yet'
                  : 'No sounds found'}
              </h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                {activeFilter === 'favorites'
                  ? 'Tap the heart icon on any sound to save it to your Favorites library.'
                  : activeFilter === 'my_sounds'
                  ? 'Tap "Upload Sound" above to record voice notes or publish your own audio.'
                  : 'Try searching for different keywords or explore other categories.'}
              </p>
            </div>
          ) : (
            displaySounds.map((sound: any) => {
              const isPlaying = playingId === sound.id;
              return (
                <div
                  key={sound.id}
                  onClick={() => handleChoose(sound)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer group ${
                    isPlaying
                      ? 'bg-[#5E43F3]/15 border-[#5E43F3]/40 shadow-sm'
                      : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    {/* Play / Pause button with preview */}
                    <button
                      type="button"
                      onClick={(e) => handleTogglePlay(sound, e)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all shadow-sm ${
                        isPlaying
                          ? 'bg-[#5E43F3] text-white scale-105'
                          : 'bg-white/10 group-hover:bg-[#5E43F3] text-white'
                      }`}
                      title={isPlaying ? 'Pause' : 'Preview'}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-white">
                          {sound.title}
                        </span>
                        {sound.genre && (
                          <span className="shrink-0 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-white/10 text-gray-300">
                            {sound.genre}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-400 truncate mt-0.5 flex items-center gap-1.5">
                        <span className="truncate">{sound.creatorName}</span>
                        <span>•</span>
                        <span>{sound.duration}s</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Favorite & Select */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleFavoriteToggle(sound, e)}
                      className={`p-2 rounded-xl transition-colors cursor-pointer ${
                        sound.isFavorited
                          ? 'text-rose-500 bg-rose-500/10'
                          : 'text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                      title={sound.isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart
                        className={`w-4 h-4 ${sound.isFavorited ? 'fill-rose-500' : ''}`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChoose(sound);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                    >
                      Use Sound
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <CreateSoundModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSoundCreated={(sound) => {
          handleChoose(sound);
        }}
      />
    </div>
  );
};
