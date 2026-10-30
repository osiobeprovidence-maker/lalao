import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Play,
  Pause,
  Music,
  Bookmark,
  TrendingUp,
  Sliders,
  Video,
  Disc,
  ShieldCheck,
  Volume2,
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import { WaveformVisualizer } from './WaveformVisualizer';
import { CreateSoundModal } from './CreateSoundModal';
import { SoundDetailModal } from './SoundDetailModal';
import {
  PRESET_SOUNDS,
  getPresetAudioUrl,
  globalAudio,
  PresetSoundDef,
} from '../../services/audio/soundEngine';

export const SoundsLibraryView: React.FC = () => {
  const {
    currentUser,
    requireAuth,
    activeSoundId,
    setActiveSoundId,
    isCreateSoundOpen,
    setIsCreateSoundOpen,
    setActiveTab,
  } = useLalao();

  const [activeFilter, setActiveFilter] = useState<string>('foryou');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);

  // Detail & Create modals
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(activeSoundId || null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(isCreateSoundOpen || false);

  // Sync with context if updated externally
  useEffect(() => {
    if (activeSoundId) {
      setSelectedDetailId(activeSoundId);
    }
  }, [activeSoundId]);

  useEffect(() => {
    if (isCreateSoundOpen) {
      setIsCreateModalOpen(true);
      setIsCreateSoundOpen(false);
    }
  }, [isCreateSoundOpen]);

  // Audio playback subscription
  useEffect(() => {
    const unsub = globalAudio.subscribe((id, isPlaying) => {
      setPlayingSoundId(isPlaying ? id : null);
    });
    return () => {
      unsub();
      globalAudio.stop();
    };
  }, []);

  const backendSounds = useQuery(api.sounds.listSounds, {
    filter: activeFilter,
    searchQuery: searchQuery.trim() || undefined,
    currentUserId: currentUser?.id as any,
    limit: 60,
  });

  const toggleFavoriteMutation = useMutation(api.sounds.toggleFavouriteSound);

  // Presets mapping into sound items for instant zero-dependency experience
  const [presetUrls, setPresetUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    PRESET_SOUNDS.forEach(async (p) => {
      const url = await getPresetAudioUrl(p);
      setPresetUrls((prev) => ({ ...prev, [p.id]: url }));
    });
  }, []);

  // Filter and merge sounds
  const displaySounds = React.useMemo(() => {
    const dbItems = backendSounds || [];
    
    // Convert preset items to match sound structure
    const presetItems = PRESET_SOUNDS.map((p) => ({
      id: p.id,
      title: p.title,
      creator: {
        id: 'system',
        name: p.creatorName,
        username: 'lalao',
        isVerified: true,
      },
      category: p.category,
      genre: p.genre,
      duration: p.duration,
      audioUrl: presetUrls[p.id] || '',
      waveform: undefined,
      usageCount: p.type === 'synth_afrobeat' ? 1420 : p.type === 'synth_lofi' ? 890 : 340,
      favoritesCount: p.type === 'synth_afrobeat' ? 412 : 210,
      isFavorited: false,
      isPreset: true,
      description: p.description,
    }));

    // Filter presets if applicable
    let matchedPresets = presetItems;
    if (activeFilter === 'music') {
      matchedPresets = presetItems.filter((p) => p.category === 'music');
    } else if (activeFilter === 'effects') {
      matchedPresets = presetItems.filter((p) => p.category === 'effects');
    } else if (activeFilter === 'original') {
      matchedPresets = presetItems.filter((p) => p.category === 'original');
    } else if (activeFilter === 'favorites' || activeFilter === 'my_sounds') {
      matchedPresets = []; // Only user's own items
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      matchedPresets = matchedPresets.filter(
        (p) => p.title.toLowerCase().includes(q) || p.genre.toLowerCase().includes(q)
      );
    }

    // Combine: user/db sounds first, followed by curated presets
    return [...dbItems, ...matchedPresets];
  }, [backendSounds, presetUrls, activeFilter, searchQuery]);

  // Play / Pause toggle
  const handleTogglePlay = async (sound: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingSoundId === sound.id) {
      globalAudio.stop();
    } else {
      let url = sound.audioUrl;
      if (!url && sound.isPreset) {
        url = presetUrls[sound.id];
      }
      if (url) {
        await globalAudio.play(sound.id, url);
      }
    }
  };

  const handleUseSound = (sound: any, e: React.MouseEvent) => {
    e.stopPropagation();
    globalAudio.stop();
    localStorage.setItem(
      'lalao_pending_sound',
      JSON.stringify({
        id: sound.id,
        title: sound.title,
        creatorName: sound.creator?.name || 'Original',
        audioUrl: sound.audioUrl,
        duration: sound.duration,
      })
    );
    setActiveTab('create-post');
  };

  const handleToggleFavorite = (sound: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sound.isPreset) return; // DB only
    requireAuth(async () => {
      try {
        await toggleFavoriteMutation({
          soundId: sound.id as any,
          authorUserId: currentUser?.id,
        });
      } catch {
        // silent
      }
    }, 'Sign in to favorite sounds');
  };

  const filterTabs = [
    { id: 'foryou', label: 'For You' },
    { id: 'trending', label: 'Trending' },
    { id: 'music', label: 'Music' },
    { id: 'original', label: 'Original' },
    { id: 'effects', label: 'Sound FX' },
    { id: 'favorites', label: 'Favourites' },
    { id: 'my_sounds', label: 'My Sounds' },
  ];

  return (
    <div className="w-full min-h-screen bg-[#0B0F19] text-white pb-24">
      
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0B0F19]/95 backdrop-blur-md border-b border-white/5 px-4 py-3.5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#5E43F3]/20 text-[#5E43F3] flex items-center justify-center">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white leading-none">
                LaLao Sounds
              </h1>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Discover music & create original audio
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#5E43F3] hover:bg-[#5E43F3]/90 text-white text-xs font-bold shadow-lg shadow-[#5E43F3]/25 transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Sound</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sounds by title, creator, genre, or vibe..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 focus:border-[#5E43F3] text-xs text-white placeholder-gray-500 outline-none transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeFilter === tab.id
                  ? 'bg-[#5E43F3] text-white shadow-md shadow-[#5E43F3]/30'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sounds List */}
      <div className="px-4 py-4 space-y-2.5 max-w-2xl mx-auto">
        {backendSounds === undefined && PRESET_SOUNDS.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : displaySounds.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-white/5 text-gray-400 space-y-3">
            <Music className="w-10 h-10 mx-auto text-gray-600" />
            <div className="text-sm font-bold text-white">No sounds found</div>
            <p className="text-xs max-w-xs mx-auto">
              {activeFilter === 'favorites'
                ? 'You have not saved any favourite sounds yet. Tap the bookmark icon to save sounds here.'
                : activeFilter === 'my_sounds'
                ? 'You have not uploaded any original sounds yet. Tap "Create Sound" above to record your first sound.'
                : 'Try adjusting your search query or choosing another category.'}
            </p>
          </div>
        ) : (
          displaySounds.map((sound: any) => {
            const isCurrentPlaying = playingSoundId === sound.id;

            return (
              <div
                key={sound.id}
                onClick={() => setSelectedDetailId(sound.id)}
                className="group relative flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-white/10 transition-all cursor-pointer"
              >
                {/* Disc / Play button */}
                <div className="relative shrink-0">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-tr from-gray-900 to-[#1F2942] border border-white/10 flex items-center justify-center shadow-md overflow-hidden ${
                      isCurrentPlaying ? 'border-[#5E43F3]' : ''
                    }`}
                  >
                    <Disc
                      className={`w-7 h-7 text-[#5E43F3] ${
                        isCurrentPlaying ? 'animate-spin [animation-duration:3s]' : ''
                      }`}
                    />
                  </div>

                  <button
                    onClick={(e) => handleTogglePlay(sound, e)}
                    className="absolute inset-0 m-auto w-7 h-7 rounded-full bg-[#5E43F3] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
                  >
                    {isCurrentPlaying ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    )}
                  </button>
                </div>

                {/* Info & Waveform */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate group-hover:text-[#5E43F3] transition-colors">
                      {sound.title}
                    </span>
                    {sound.isOfficial && (
                      <ShieldCheck className="w-3.5 h-3.5 text-[#5E43F3] shrink-0" />
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    <span className="truncate">{sound.creator?.name || 'Creator'}</span>
                    <span>•</span>
                    <span>{sound.duration}s</span>
                    <span>•</span>
                    <span>{sound.usageCount || 0} videos</span>
                  </div>

                  {/* Waveform preview */}
                  <div className="w-full pt-0.5 max-w-xs">
                    <WaveformVisualizer
                      waveform={sound.waveform}
                      isPlaying={isCurrentPlaying}
                      height={18}
                      barCount={28}
                    />
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {!sound.isPreset && (
                    <button
                      onClick={(e) => handleToggleFavorite(sound, e)}
                      className={`p-2 rounded-xl hover:bg-white/10 transition-colors ${
                        sound.isFavorited ? 'text-red-400' : 'text-gray-400 hover:text-white'
                      }`}
                      title="Favorite"
                    >
                      <Bookmark className={`w-4 h-4 ${sound.isFavorited ? 'fill-current' : ''}`} />
                    </button>
                  )}

                  <button
                    onClick={(e) => handleUseSound(sound, e)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#5E43F3] text-gray-200 hover:text-white text-xs font-bold border border-white/10 hover:border-transparent transition-all shadow-sm"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Use</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      <CreateSoundModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSoundCreated={(sound) => {
          setSelectedDetailId(sound.id);
        }}
      />

      <SoundDetailModal
        soundId={selectedDetailId}
        onClose={() => {
          setSelectedDetailId(null);
          setActiveSoundId?.(null);
        }}
      />
    </div>
  );
};
