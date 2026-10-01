import React, { useEffect, useRef, useState } from 'react';
import { useLalao } from '../../context/LalaoContext';
import { X, Heart, MessageCircle, Repeat, Bookmark, Share, Volume2, VolumeX, MoreHorizontal } from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { Post } from '../../types';

export const VideoFeedModal: React.FC = () => {
  const { 
    activeVideoFeedPostId, 
    setActiveVideoFeedPostId,
    posts
  } = useLalao();

  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  const videoPosts = posts.filter(p => p.mediaType === 'video' || (p as any).muxPlaybackId);

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
  }, [activeVideoFeedPostId]);

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
    <div className="fixed inset-0 z-[100] bg-theme-inverse text-theme-text-inverse flex justify-center animate-in fade-in duration-200">
      
      {/* Top Controls */}
      <div className="absolute top-0 inset-x-0 p-4 md:p-6 flex justify-between items-center z-[110] pointer-events-none">
        <button 
          onClick={() => setActiveVideoFeedPostId(null)}
          className="p-2 hover:bg-theme-surface/10 rounded-full text-white transition pointer-events-auto"
          aria-label="Close video viewer"
        >
          <X className="w-7 h-7" />
        </button>
        <button 
          className="p-2 hover:bg-theme-surface/10 rounded-full text-white transition pointer-events-auto"
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

const VideoFeedItem: React.FC<{ post: Post, isActive: boolean, onIntersect: () => void, isMuted: boolean, onToggleMute: () => void }> = ({ post, isActive, onIntersect, isMuted, onToggleMute }) => {
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

  const { toggleLikePost, toggleSavePost, setActiveCommentsPostId } = useLalao();

  return (
    <div ref={itemRef} className="relative w-full h-full flex items-center justify-center bg-theme-inverse overflow-hidden py-16 md:py-20 px-4">
      
      {/* Flex container that shrinks to fit its content's intrinsic width */}
      <div className="relative flex flex-col h-full w-fit max-w-full mx-auto">
        
        {/* Video Area (flex-1 so it takes available height, causing video to scale its width intrinsically) */}
        <div className="relative flex-1 min-h-0 flex justify-center mb-6">
          {isActive ? (
              <VideoPlayer
                muxPlaybackId={(post as any).muxPlaybackId}
                mediaUrl={post.mediaUrl}
                mediaStatus={(post as any).mediaStatus}
                aspect="auto"
                autoPlay={true}
                muted={isMuted}
                hideMuteButton={true}
                className="h-full !w-auto max-w-full object-contain"
              />
          ) : (
            <div className="w-[300px] h-full bg-theme-inverse animate-pulse flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#5E43F3] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Post Info & Action Row - perfectly tracks the video's intrinsic width */}
        <div className="w-full shrink-0 flex flex-col px-1 pb-4">
          
          <div className="flex items-center space-x-3 mb-3 cursor-pointer group">
            <img src={post.author.avatar || 'https://via.placeholder.com/150'} alt={post.author.name} className="w-10 h-10 rounded-full object-cover group-hover:opacity-90 transition" />
            <div>
              <h3 className="font-bold text-white text-[15px] leading-tight flex items-center group-hover:underline">
                {post.author.name}
                {post.author.isVerified && (
                  <span className="ml-1 rounded-full bg-[#5E43F3] p-0.5">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </h3>
              <p className="text-white/70 text-sm">@{post.author.username}</p>
            </div>
          </div>

          {post.text && (
            <p className="text-white text-[15px] line-clamp-3 break-words mb-5 leading-snug">
              {post.text}
            </p>
          )}

          <div className="flex items-center justify-between text-white/80">
            <div className="flex items-center space-x-6 sm:space-x-8">
              <button 
                onClick={() => toggleLikePost(post.id)}
                className={`flex items-center space-x-1.5 transition group ${post.isLiked ? 'text-rose-500' : 'hover:text-white'}`}
              >
                <Heart className={`w-5 h-5 group-active:scale-125 transition-transform ${post.isLiked ? 'fill-rose-500' : ''}`} />
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

              <button className="flex items-center hover:text-white transition group">
                <Share className="w-5 h-5 group-active:scale-110 transition-transform" />
              </button>
            </div>

            <button 
              onClick={onToggleMute} 
              className="flex items-center justify-center p-2 rounded-full hover:bg-theme-surface/10 transition text-white/80 hover:text-white ml-6 shrink-0"
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
