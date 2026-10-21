import React, { useState } from 'react';
import { Play, Heart, MessageCircle, Video as VideoIcon, Loader2 } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';
import { VerificationBadge } from '../common/VerificationBadge';
import { getPublicIdentityLabel } from '../common/UserIdentity';

export const VideosDiscoveryView: React.FC = () => {
  const { setActiveVideoFeedPostId } = useLalao();
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [accumulatedPosts, setAccumulatedPosts] = useState<any[]>([]);

  // Fetch paginated videos
  const result = useQuery(api.social.listVideoPosts, {
    limit: 24,
    cursor,
  });

  // Keep track of accumulated pages
  React.useEffect(() => {
    if (result?.posts) {
      setAccumulatedPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newPosts = result.posts.filter((p: any) => !existingIds.has(p.id));
        return [...prev, ...newPosts];
      });
    }
  }, [result]);

  const isLoadingInitial = result === undefined && accumulatedPosts.length === 0;

  if (isLoadingInitial) {
    return (
      <div className="px-4 py-12 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#5E43F3] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-theme-tertiary font-medium">Loading videos...</p>
      </div>
    );
  }

  if (accumulatedPosts.length === 0) {
    return (
      <div className="px-4 py-16 text-center space-y-3">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#5E43F3]/10 flex items-center justify-center text-[#5E43F3]">
          <VideoIcon className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-bold text-theme-primary">No videos discovered yet</h3>
        <p className="text-xs text-theme-tertiary max-w-[260px] mx-auto leading-relaxed">
          Be the first to share a video or clip with the Lalao community.
        </p>
      </div>
    );
  }

  return (
    <section className="px-4 pb-12 animate-in fade-in duration-200">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-1.5">
          <VideoIcon className="w-4 h-4 text-[#5E43F3]" />
          <h2 className="text-sm font-bold text-theme-primary tracking-tight">Discover Videos</h2>
          <span className="text-xs text-theme-tertiary">({accumulatedPosts.length})</span>
        </div>
      </div>

      {/* Responsive Video Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {accumulatedPosts.map((post) => {
          // Determine best thumbnail: Mux animated/still thumbnail or mediaUrl fallback
          const thumbnailUrl = post.muxPlaybackId
            ? `https://image.mux.com/${post.muxPlaybackId}/thumbnail.jpg?time=0`
            : post.mediaUrl;

          return (
            <div
              key={post.id}
              onClick={() => setActiveVideoFeedPostId(post.id)}
              className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-theme-surface border border-theme-divider/70 cursor-pointer shadow-2xs hover:shadow-md hover:border-[#5E43F3]/50 transition-all"
            >
              {/* Video Thumbnail / Preview */}
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={post.text || 'Lalao Video'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to dark gradient if image thumbnail fails
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-black/80 flex items-center justify-center">
                  <Play className="w-10 h-10 text-white/40" />
                </div>
              )}

              {/* Gradient Dark Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10 group-hover:from-black/90 transition-colors pointer-events-none" />

              {/* Play Badge Top-Right */}
              <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white shadow-sm group-hover:bg-[#5E43F3] group-hover:scale-110 transition-all pointer-events-none">
                <Play className="w-3.5 h-3.5 fill-white translate-x-0.5" />
              </div>

              {/* Creator & Stats Info Bottom */}
              <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3 text-white pointer-events-none flex flex-col justify-end">
                {/* Author row */}
                {post.author && (
                  <div className="flex items-center gap-1.5 mb-1 min-w-0">
                    <Avatar
                      src={post.author.avatar}
                      alt={getPublicIdentityLabel(post.author)}
                      size="xs"
                      className="ring-1 ring-white/30 shrink-0"
                    />
                    <span className="text-[11px] font-semibold text-white/95 truncate">
                      {getPublicIdentityLabel(post.author)}
                    </span>
                    <VerificationBadge user={post.author} size="xs" />
                  </div>
                )}

                {/* Caption preview */}
                {post.text && (
                  <p className="text-[11px] text-white/80 line-clamp-2 leading-tight mb-1.5 font-normal">
                    {post.text}
                  </p>
                )}

                {/* Engagement metrics */}
                <div className="flex items-center gap-3 text-[10px] text-white/75 font-medium">
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3 fill-white/60 text-white/60" />
                    <span>{post.likesCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3 text-white/60" />
                    <span>{post.commentsCount || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Infinite scrolling / Load More */}
      {result?.nextCursor && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setCursor(result.nextCursor)}
            className="px-5 py-2 rounded-full bg-theme-surface hover:bg-theme-surface-hover border border-theme-divider text-xs font-bold text-theme-primary transition-all cursor-pointer shadow-2xs"
          >
            Load More Videos
          </button>
        </div>
      )}
    </section>
  );
};
