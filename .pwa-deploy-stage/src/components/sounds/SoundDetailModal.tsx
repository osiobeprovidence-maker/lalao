import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  Bookmark,
  Share2,
  Video,
  Music,
  Trash2,
  Edit3,
  ShieldCheck,
  Disc,
  Heart,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import { WaveformVisualizer } from './WaveformVisualizer';
import { globalAudio } from '../../services/audio/soundEngine';

interface SoundDetailModalProps {
  soundId: string | null;
  onClose: () => void;
  onUseSound?: (sound: any) => void;
}

export const SoundDetailModal: React.FC<SoundDetailModalProps> = ({
  soundId,
  onClose,
  onUseSound,
}) => {
  const {
    currentUser,
    requireAuth,
    triggerShareToast,
    setActiveTab,
    setActiveUserProfile,
    setIsVideoFeedOpen,
  } = useLalao();

  const sound = useQuery(
    api.sounds.getSoundById,
    soundId ? { soundId: soundId as any, currentUserId: currentUser?.id as any } : 'skip'
  );

  const videos = useQuery(
    api.sounds.listVideosUsingSound,
    soundId ? { soundId: soundId as any, limit: 24 } : 'skip'
  );

  const toggleFavoriteMutation = useMutation(api.sounds.toggleFavouriteSound);
  const deleteSoundMutation = useMutation(api.sounds.deleteSound);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressTimerRef = useRef<any>(null);

  useEffect(() => {
    if (sound) {
      setIsFavorited(!!sound.isFavorited);
      setFavoritesCount(sound.favoritesCount || 0);
    }
  }, [sound]);

  // Clean audio on close
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [soundId]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    setIsPlaying(false);
    setPlaybackProgress(0);
  };

  const togglePlay = () => {
    if (!sound?.audioUrl) return;

    if (isPlaying) {
      stopAudio();
      return;
    }

    globalAudio.stop(); // stop any other previews
    stopAudio();

    const audio = new Audio(sound.audioUrl);
    audioRef.current = audio;

    audio.onended = () => {
      stopAudio();
    };

    audio.play().then(() => {
      setIsPlaying(true);
      progressTimerRef.current = setInterval(() => {
        if (audio && sound.duration) {
          const prog = audio.currentTime / sound.duration;
          setPlaybackProgress(Math.min(1, prog));
        }
      }, 60);
    }).catch(() => {
      stopAudio();
    });
  };

  const handleToggleFavorite = () => {
    if (!sound) return;
    requireAuth(async () => {
      try {
        const res = await toggleFavoriteMutation({
          soundId: sound.id as any,
          authorUserId: currentUser?.id,
        });
        setIsFavorited(res.isFavorited);
        setFavoritesCount(res.favoritesCount);
      } catch {
        // silent fail
      }
    }, 'Sign in to add sounds to your favorites');
  };

  const handleShare = () => {
    if (!sound) return;
    const url = `${window.location.origin}/sounds/${sound.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    triggerShareToast?.('Sound link copied to clipboard!');
  };

  const handleUseSound = () => {
    if (!sound) return;
    stopAudio();
    onClose();

    if (onUseSound) {
      onUseSound(sound);
    } else {
      // Default: set pending sound and open create-post tab
      localStorage.setItem('lalao_pending_sound', JSON.stringify({
        id: sound.id,
        title: sound.title,
        creatorName: sound.creator?.name || 'Original',
        audioUrl: sound.audioUrl,
        duration: sound.duration,
      }));
      setActiveTab('create-post');
    }
  };

  const handleDelete = async () => {
    if (!sound) return;
    if (!window.confirm('Are you sure you want to delete this sound? Existing videos using it will remain active.')) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteSoundMutation({
        soundId: sound.id as any,
        authorUserId: currentUser?.id,
      });
      stopAudio();
      onClose();
    } catch {
      setIsDeleting(false);
    }
  };

  if (!soundId) return null;

  const isOwner = currentUser && sound && (sound.creatorId === currentUser.id || (currentUser as any).userType === 'admin');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0F1422] border border-white/10 shadow-2xl flex flex-col text-white">
        
        {/* Top Navbar */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3.5 bg-[#0F1422]/90 backdrop-blur-md border-b border-white/5">
          <div className="text-xs font-bold uppercase tracking-wider text-[#5E43F3]">
            Sound Details
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {sound === undefined ? (
          <div className="p-12 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-[#5E43F3] animate-spin" />
          </div>
        ) : !sound ? (
          <div className="p-12 text-center text-sm text-gray-400">
            Sound not found or has been removed.
          </div>
        ) : (
          <div className="p-5 space-y-6">
            
            {/* Hero Card */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-5 rounded-3xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10">
              
              {/* Disc Artwork */}
              <div className="relative group shrink-0">
                <div
                  className={`w-24 h-24 rounded-full bg-gradient-to-tr from-gray-900 via-[#1A2035] to-[#5E43F3]/30 border-2 border-white/20 shadow-xl flex items-center justify-center ${
                    isPlaying ? 'animate-spin [animation-duration:4s]' : ''
                  }`}
                >
                  <Disc className="w-12 h-12 text-[#5E43F3]" />
                  <div className="absolute w-6 h-6 rounded-full bg-[#0F1422] border border-white/30" />
                </div>

                <button
                  onClick={togglePlay}
                  className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-[#5E43F3] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>
              </div>

              {/* Info & Stats */}
              <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#5E43F3]/20 text-[#5E43F3] uppercase tracking-wider">
                    {sound.category}
                  </span>
                  {sound.genre && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-gray-300">
                      {sound.genre}
                    </span>
                  )}
                  <span className="text-[11px] text-gray-400">
                    {sound.duration}s
                  </span>
                </div>

                <h1 className="text-xl font-black text-white truncate leading-tight">
                  {sound.title}
                </h1>

                {/* Creator */}
                {sound.creator && (
                  <button
                    onClick={() => {
                      if (sound.creator) {
                        setActiveUserProfile?.(sound.creator);
                        onClose();
                      }
                    }}
                    className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    {sound.creator.avatar ? (
                      <img
                        src={sound.creator.avatar}
                        alt={sound.creator.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-[#5E43F3] text-[10px] font-bold flex items-center justify-center">
                        {sound.creator.name[0]}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-gray-300">
                      {sound.creator.name}
                    </span>
                    {sound.creator.isVerified && (
                      <ShieldCheck className="w-3.5 h-3.5 text-[#5E43F3]" />
                    )}
                  </button>
                )}

                <div className="pt-1 flex items-center justify-center sm:justify-start gap-4 text-xs text-gray-400">
                  <div>
                    <span className="font-bold text-white">{sound.usageCount || 0}</span> videos
                  </div>
                  <div>
                    <span className="font-bold text-white">{favoritesCount}</span> favorites
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Waveform Bar */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Sound Waveform</span>
                <span className="font-mono text-[#5E43F3]">
                  {isPlaying ? `${Math.round(playbackProgress * sound.duration)}s` : `${sound.duration}s`}
                </span>
              </div>
              <WaveformVisualizer
                waveform={sound.waveform}
                isPlaying={isPlaying}
                progress={playbackProgress}
                height={40}
              />
            </div>

            {/* Description */}
            {sound.description && (
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-gray-300 leading-relaxed">
                {sound.description}
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleUseSound}
                className="flex-1 py-3 px-4 rounded-2xl bg-[#5E43F3] hover:bg-[#5E43F3]/90 text-white font-bold text-sm shadow-lg shadow-[#5E43F3]/30 flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <Video className="w-4 h-4" />
                <span>Use this Sound</span>
              </button>

              <button
                onClick={handleToggleFavorite}
                className={`p-3 rounded-2xl border transition-colors ${
                  isFavorited
                    ? 'bg-red-500/15 border-red-500/30 text-red-400'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:text-white'
                }`}
                title="Favorite"
              >
                <Bookmark className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={handleShare}
                className="p-3 rounded-2xl bg-white/5 border border-white/10 text-gray-300 hover:text-white transition-colors"
                title="Share"
              >
                <Share2 className="w-5 h-5" />
              </button>

              {isOwner && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                  title="Delete Sound"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Videos Using This Sound Grid */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Videos with this sound ({videos?.length || 0})
                </h3>
              </div>

              {videos === undefined ? (
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-[9/16] rounded-xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : videos.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-gray-500">
                  <Video className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Be the first creator to make a video with this sound!
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {videos.map((vid: any) => (
                    <div
                      key={vid.id}
                      onClick={() => {
                        stopAudio();
                        onClose();
                        setIsVideoFeedOpen?.(true);
                      }}
                      className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black/60 border border-white/10 cursor-pointer group hover:scale-[1.02] transition-transform"
                    >
                      {vid.mediaUrl ? (
                        <video
                          src={vid.mediaUrl}
                          className="w-full h-full object-cover"
                          preload="metadata"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-b from-[#182136] to-black flex items-center justify-center">
                          <Play className="w-6 h-6 text-white/50" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2">
                        <div className="flex items-center gap-1 text-[10px] text-white font-semibold">
                          <Heart className="w-3 h-3 fill-current text-white/70" />
                          <span>{vid.likesCount || 0}</span>
                        </div>
                        {vid.author && (
                          <div className="text-[10px] text-gray-300 truncate">
                            @{vid.author.username}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
