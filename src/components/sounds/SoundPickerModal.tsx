import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Music,
  Play,
  Pause,
  Check,
  Plus,
  Disc,
} from 'lucide-react';
import { useQuery } from 'convex/react';
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

export const SoundPickerModal: React.FC<SoundPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectSound,
}) => {
  const { currentUser } = useLalao();
  const [activeFilter, setActiveFilter] = useState('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [presetUrls, setPresetUrls] = useState<Record<string, string>>({});

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

  const backendSounds = useQuery(
    api.sounds.listSounds,
    isOpen
      ? {
          filter: activeFilter,
          searchQuery: searchQuery.trim() || undefined,
          currentUserId: currentUser?.id as any,
          limit: 40,
        }
      : 'skip'
  );

  const displaySounds = React.useMemo(() => {
    const dbItems = backendSounds || [];
    const presets = PRESET_SOUNDS.map((p) => ({
      id: p.id,
      title: p.title,
      creatorName: p.creatorName,
      category: p.category,
      genre: p.genre,
      duration: p.duration,
      audioUrl: presetUrls[p.id] || '',
      isPreset: true,
    }));

    let filteredPresets = presets;
    if (activeFilter === 'music') {
      filteredPresets = presets.filter((p) => p.category === 'music');
    } else if (activeFilter === 'effects') {
      filteredPresets = presets.filter((p) => p.category === 'effects');
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
      isPreset: false,
    }));

    return [...mappedDb, ...filteredPresets];
  }, [backendSounds, presetUrls, activeFilter, searchQuery]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[85vh] rounded-3xl bg-[#0F1422] border border-white/10 shadow-2xl flex flex-col text-white overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-white/5 space-y-3 bg-[#0F1422]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-[#5E43F3]" />
              <h2 className="text-sm font-bold text-white">Add Sound to Video</h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#5E43F3] text-xs font-semibold border border-white/5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record New</span>
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search music, beats, sound effects..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 outline-none focus:border-[#5E43F3]"
            />
          </div>

          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {['trending', 'music', 'effects', 'original', 'favorites'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold capitalize transition-colors ${
                  activeFilter === cat
                    ? 'bg-[#5E43F3] text-white'
                    : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Sound List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {displaySounds.map((sound: any) => {
            const isPlaying = playingId === sound.id;
            return (
              <div
                key={sound.id}
                onClick={() => handleChoose(sound)}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => handleTogglePlay(sound, e)}
                    className="w-9 h-9 rounded-xl bg-white/5 group-hover:bg-[#5E43F3] text-white flex items-center justify-center shrink-0 transition-colors shadow-sm"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{sound.title}</div>
                    <div className="text-[10px] text-gray-400 truncate">
                      {sound.creatorName} • {sound.duration}s
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleChoose(sound)}
                  className="px-3 py-1.5 rounded-xl bg-[#5E43F3]/20 hover:bg-[#5E43F3] text-[#5E43F3] hover:text-white text-xs font-bold transition-all"
                >
                  Select
                </button>
              </div>
            );
          })}
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
