import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import { X, Heart, MessageCircle, Repeat, Bookmark, Share, Volume2, VolumeX, MoreHorizontal, Music, Disc } from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { Post } from '../../types';
import { VerificationBadge } from '../common/VerificationBadge';
import { getPublicIdentityLabel } from '../common/UserIdentity';

type VideoFeedPost = Pick<
  Post,
  | 'id'
  | 'author'
  | 'text'
  | 'mediaUrl'
  | 'mediaType'
  | 'likesCount'
  | 'commentsCount'
  | 'repostsCount'
  | 'isLiked'
  | 'isReposted'
  | 'soundId'
  | 'soundTitle'
  | 'soundAuthorName'
  | 'soundAudioUrl'
  | 'soundStartOffset'
  | 'soundVolume'
  | 'originalAudioVolume'
> & {
  muxPlaybackId?: string;
  mediaStatus?: Post['mediaStatus'];
};

export const VideoFeedModal: React.FC = () => {
  const {
    activeVideoFeedPostId, 
    setActiveVideoFeedPostId,
    posts,
    toggleRepostPost,
    triggerShareToast,
  } = useLalao();

  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const discoveryResult = useQuery(
    api.social.listVideoPosts,
    activeVideoFeedPostId ? { limit: 200 } : 'skip',
  );

  const videoPosts = useMemo(() => {
    const merged = new Map<string, VideoFeedPost>();
    for (const post of posts) {
      if (post.mediaType === 'video' || post.muxPlaybackId) merged.set(post.id, post);
    }
    for (const post of discoveryResult?.posts ?? []) {
      if (merged.has(post.id)) continue;
      merged.set(post.id, {
        id: post.id,
        author: post.author,
        text: post.text || '',
        mediaUrl: post.mediaUrl,
        mediaType: post.mediaType,
        muxPlaybackId: post.muxPlaybackId,
        mediaStatus: post.mediaStatus,
        likesCount: post.likesCount || 0,
        commentsCount: post.commentsCount || 0,
        repostsCount: post.repostsCount || 0,
        isLiked: post.isLiked || false,
        isReposted: post.isReposted || false,
        soundId: post.soundId,
        soundTitle: post.soundTitle,
        soundAuthorName: post.soundAuthorName,
        soundAudioUrl: post.soundAudioUrl,
        soundStartOffset: post.soundStartOffset,
        soundVolume: post.soundVolume,
        originalAudioVolume: post.originalAudioVolume,
      });
    }
    return Array.from(merged.values());
  }, [posts, discoveryResult?.posts]);

  useEffect(() => {
    if (activeVideoFeedPostId) {
      document.body.style.overflow = 'hidden';
      setActiveVideoId(activeVideoFeedPostId);
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [activeVideoFeedPostId, videoPosts]);

  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (activeVideoFeedPostId && containerRef.current) {
      const index = videoPosts.findIndex(p => p.id === activeVideoFeedPostId);
      if (index >= 0) {
        setTimeout(() => {
          const el = document.getElementById(`video-feed-item-${activeVideoFeedPostId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'auto' });
          }
        }, 100);
      }
    }
  }, [activeVideoFeedPostId]);

  if (!activeVideoFeedPostId) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex justify-center animate-in fade-in duration-200">
      
      {/* Top Controls */}
      <div className="absolute top-0 inset-x-0 p-4 md:p-6 flex justify-between items-center z-[110] pointer-events-none">
        <button 
          onClick={() => setActiveVideoFeedPostId(null)}
          className="rounded-full border border-white/15 bg-black/55 p-2 text-white transition hover:bg-[#5E43F3] pointer-events-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E43F3]"
          aria-label="Close video viewer"
        >
          <X className="w-7 h-7" />
        </button>
        <button 
          className="rounded-full border border-white/15 bg-black/55 p-2 text-white transition hover:bg-[#5E43F3] pointer-events-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E43F3]"
          aria-label="More options"
        >
          <MoreHorizontal className="w-7 h-7" />
        </button>
      </div>

      <div 
        ref={containerRef}
        className="relative w-full h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {videoPosts.map((post) => (
          <div key={post.id} id={`video-feed-item-${post.id}`} className="snap-start snap-always w-full h-full flex items-center justify-center">
             <VideoFeedItem 
              post={post} 
              isActive={activeVideoId === post.id}
              onIntersect={() => setActiveVideoId(post.id)}
              isMuted={isMuted}
              onToggleMute={() => setIsMuted(prev => !prev)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const VideoFeedItem: React.FC<{ post: VideoFeedPost, isActive: boolean, onIntersect: () => void, isMuted: boolean, onToggleMute: () => void }> = ({ post, isActive, onIntersect, isMuted, onToggleMute }) => {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onIntersect();
        }
      },
      { threshold: 0.6 }
    );
    if (itemRef.current) observer.observe(itemRef.current);
    return () => observer.disconnect();
  }, [onIntersect]);

  const { toggleLikePost, toggleSavePost, toggleRepostPost, setActiveCommentsPostId, openSoundDetail, setActiveVideoFeedPostId, triggerShareToast } = useLalao();

  const handleShare = async () => {
    const videoUrl = post.muxPlaybackId
      ? `https://stream.mux.com/${post.muxPlaybackId}.m3u8`
      : post.mediaUrl || window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Video on Lalao', text: post.text, url: videoUrl });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(videoUrl);
        triggerShareToast('Video link copied to clipboard');
      } else {
        triggerShareToast('Sharing is not available in this browser');
      }
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') triggerShareToast('Could not share this video');
    }
  };

  return (
    <div ref={itemRef} className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden py-16 md:py-20 px-4">
      
      {/* Flex container that shrinks to fit its content's intrinsic width */}
      <div className="relative flex flex-col h-full w-fit max-w-full mx-auto">
        
        {/* Video Area (flex-1 so it takes available height, causing video to scale its width intrinsically) */}
        <div className="relative flex-1 min-h-0 flex justify-center mb-6">
          {isActive ? (
              <VideoPlayer
                muxPlaybackId={post.muxPlaybackId}
                mediaUrl={post.mediaUrl}
                mediaStatus={post.mediaStatus}
                poster={post.muxPlaybackId ? `https://image.mux.com/${post.muxPlaybackId}/thumbnail.jpg?time=1.5&width=640&fit_mode=preserve` : undefined}
                aspect="auto"
                autoPlay={true}
                muted={isMuted}
                hideMuteButton={true}
                className="h-full !w-auto max-w-full object-contain"
              />
          ) : (
            <div className="w-[300px] h-full bg-black animate-pulse flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#5E43F3] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Post Info & Action Row - perfectly tracks the video's intrinsic width */}
        <div className="w-full shrink-0 flex flex-col px-1 pb-4">
          
          <div className="flex items-center space-x-3 mb-3 cursor-pointer group">
            <img src={post.author.avatar || 'https://via.placeholder.com/150'} alt={getPublicIdentityLabel(post.author)} className="w-10 h-10 rounded-full object-cover group-hover:opacity-90 transition" />
            <div>
              <h3 className="font-bold text-white text-[15px] leading-tight flex items-center group-hover:underline">
                {getPublicIdentityLabel(post.author)} <VerificationBadge user={post.author} size="xs" className="ml-0.5" />
              </h3>
            </div>
          </div>

          {post.text && (
            <p className="text-white text-[15px] line-clamp-3 break-words mb-3 leading-snug">
              {post.text}
            </p>
          )}

          {/* Sound badge */}
          {post.soundTitle && (
            <div className="mb-4">
              <button
                onClick={() => {
                  if (post.soundId) {
                    setActiveVideoFeedPostId(null);
                    openSoundDetail?.(post.soundId);
                  }
                }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold backdrop-blur-sm transition-colors cursor-pointer group"
              >
                <Disc className="w-3.5 h-3.5 text-[#5E43F3] animate-spin [animation-duration:3s]" />
                <span className="truncate max-w-[200px]">{post.soundTitle}</span>
                {post.soundAuthorName && (
                  <span className="text-white/60 text-[11px] truncate">• {post.soundAuthorName}</span>
                )}
              </button>
            </div>
          )}

          <div className="flex items-center justify-between text-white/80">
            <div className="flex items-center space-x-6 sm:space-x-8">
              <button 
                onClick={() => toggleLikePost(post.id)}
                className={`flex items-center space-x-1.5 transition group ${post.isLiked ? 'text-[#5E43F3]' : 'hover:text-white'}`}
              >
                <Heart className={`w-5 h-5 group-active:scale-125 transition-transform ${post.isLiked ? 'fill-[#5E43F3]' : ''}`} />
                <span className="text-[13px] font-bold">{post.likesCount || 0}</span>
              </button>

              <button 
                onClick={() => setActiveCommentsPostId(post.id)}
                className="flex items-center space-x-1.5 hover:text-white transition group"
              >
                <MessageCircle className="w-5 h-5 group-active:scale-125 transition-transform" />
                <span className="text-[13px] font-bold">{post.commentsCount || 0}</span>
              </button>

              <button 
                onClick={() => toggleRepostPost(post.id)}
                className={`flex items-center space-x-1.5 transition group ${post.isReposted ? 'text-[#5E43F3]' : 'hover:text-white'}`}
              >
                <Repeat className="w-5 h-5 group-active:rotate-180 transition-transform" />
                <span className="text-[13px] font-bold">{post.repostsCount || 0}</span>
              </button>

              <button 
                onClick={() => toggleSavePost?.(post.id)}
                className="flex items-center hover:text-white transition group"
              >
                <Bookmark className="w-5 h-5 group-active:scale-110 transition-transform" />
              </button>

              <button onClick={() => void handleShare()} aria-label="Share video" className="flex items-center hover:text-[#5E43F3] transition group">
                <Share className="w-5 h-5 group-active:scale-110 transition-transform" />
              </button>
            </div>

            <button 
              onClick={onToggleMute} 
              className="flex items-center justify-center p-2 rounded-full border border-white/15 bg-black/55 hover:bg-[#5E43F3] transition text-white/80 hover:text-white ml-6 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E43F3]"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
