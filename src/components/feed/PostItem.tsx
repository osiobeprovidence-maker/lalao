import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Repeat,
  Share2,
  MoreHorizontal,
  Play,
  Pause,
  MapPin,
  Volume2,
  VolumeX,
  Zap,
  Clock,
  Users,
  Check,
} from 'lucide-react';
import { Post, Rally, User } from '../../types';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { useLalao } from '../../context/LalaoContext';
import { formatDistance, getProximityCategory } from '../../utils/locationUtils';

export interface PostItemProps {
  post?: Post;
  rally?: Rally;
  onSelectAuthor?: () => void;
}

export const PostItem: React.FC<PostItemProps> = ({ post, rally: directRally, onSelectAuthor }) => {
  const {
    toggleLikePost,
    toggleRepostPost,
    setActiveCommentsPostId,
    triggerShareToast,
    setActiveUserProfile,
    setActivePageId,
    toggleJoinRally,
    setActiveChatId,
    openChatWithUser,
    conversations,
    rallies,
    posts,
    pages,
    locationPrivacy,
  } = useLalao();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showOptions, setShowOptions] = useState(false);

  // Local state for standalone rally likes
  const [standaloneLiked, setStandaloneLiked] = useState(false);

  // Resolve linked rally if post has rallyRefId, or use directRally
  const linkedRally = directRally || (post?.rallyRefId ? rallies.find((r) => r.id === post.rallyRefId) : null);
  const isRallyPost = Boolean(linkedRally);

  // If this is a direct rally, check if there's a corresponding post
  const associatedPost = post || (directRally ? posts.find((p) => p.rallyRefId === directRally.id) : null);

  // Determine effective author
  const author: User = post ? post.author : (linkedRally ? linkedRally.creator : {
    id: 'unknown',
    name: 'Anonymous',
    username: 'anonymous',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
    userType: 'person',
    followersCount: 0,
    followingCount: 0,
  });

  // Location & Proximity
  const locationText = post ? post.location : (linkedRally ? linkedRally.location : 'Delta State');
  const distanceMeters = post ? post.distanceMeters : (linkedRally ? linkedRally.distanceMeters : 0);
  const formattedDistance = formatDistance(distanceMeters, locationPrivacy?.approximateDistance);
  const proximity = getProximityCategory(distanceMeters);

  // Timestamp
  const timeText = post ? post.createdAt : (linkedRally ? linkedRally.timeDate : 'Just now');

  // Author click handler
  const matchedPage = pages.find((p) => p.username === author.username);
  const handleAuthorClick = () => {
    if (onSelectAuthor) {
      onSelectAuthor();
      return;
    }
    if (matchedPage) {
      setActivePageId(matchedPage.id);
    } else {
      setActiveUserProfile(author);
    }
  };

  // Message Creator handler
  const handleMessageCreator = () => {
    openChatWithUser(author);
  };

  // Social interactions
  const isLiked = associatedPost ? associatedPost.isLiked : standaloneLiked;
  const likesCount = associatedPost
    ? associatedPost.likesCount
    : (linkedRally ? (linkedRally.joinedUsersCount * 2 + (standaloneLiked ? 1 : 0)) : 0);

  const commentsCount = associatedPost ? associatedPost.commentsCount : (linkedRally ? 3 : 0);
  const repostsCount = associatedPost ? associatedPost.repostsCount : 0;
  const isReposted = associatedPost ? associatedPost.isReposted : false;

  const handleLike = () => {
    if (associatedPost) {
      toggleLikePost(associatedPost.id);
    } else {
      setStandaloneLiked(!standaloneLiked);
    }
  };

  const handleComment = () => {
    if (associatedPost) {
      setActiveCommentsPostId(associatedPost.id);
    } else if (linkedRally) {
      triggerShareToast('Opening Rally thread...');
    }
  };

  const handleRepost = () => {
    if (associatedPost) {
      toggleRepostPost(associatedPost.id);
    } else {
      triggerShareToast('Rally shared to your followers');
    }
  };

  const handleShare = () => {
    triggerShareToast(isRallyPost ? 'Rally link copied to clipboard!' : 'Post link copied to clipboard!');
  };

  const itemId = post?.id || linkedRally?.id || 'feed-item';

  return (
    <article
      id={`feed-item-${itemId}`}
      className="p-4 bg-white border-b border-neutral-100 hover:bg-neutral-50/40 transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar
          src={author?.avatar}
          alt={author?.name || 'User'}
          size="md"
          onClick={handleAuthorClick}
        />

        {/* Content column */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-1">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  onClick={handleAuthorClick}
                  className="font-bold text-[15px] text-neutral-900 hover:underline cursor-pointer tracking-tight"
                >
                  {author.name}
                </span>

                {author.badge && <Badge type={author.badge} />}
              </div>

              {/* Sub-header: @username · time · location · distance */}
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-0.5 flex-wrap">
                <span className="text-neutral-400">@{author.username}</span>
                <span>·</span>
                <span>{timeText}</span>
                <span>·</span>
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-[11px] font-medium">
                  <span className={`w-1.5 h-1.5 rounded-full ${proximity.dotColor}`} />
                  <MapPin className="w-2.5 h-2.5 text-[#5E43F3]" />
                  <span>{locationText}</span>
                  <span className="text-neutral-400">·</span>
                  <span className="font-bold text-neutral-900">{formattedDistance}</span>
                </div>
              </div>
            </div>

            {/* Top-Right Badges & Kebab Options */}
            <div className="flex items-center gap-1.5">
              {/* Rally Badges if applicable */}
              {linkedRally && (
                <>
                  {linkedRally.urgency === 'urgent' && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold tracking-wide rounded-full bg-rose-50 text-rose-600 border border-rose-200 uppercase">
                      <Zap className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                      Urgent
                    </span>
                  )}
                  <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-indigo-50 text-[#5E43F3] border border-indigo-100">
                    {linkedRally.category}
                  </span>
                </>
              )}

              {/* Kebab Options Menu */}
              <div className="relative">
                <button
                  id={`btn-item-options-${itemId}`}
                  onClick={() => setShowOptions(!showOptions)}
                  className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                  aria-label="Options"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {showOptions && (
                  <div className="absolute right-0 top-7 z-20 w-44 bg-white rounded-xl shadow-lg border border-neutral-100 py-1.5 text-xs text-neutral-700 animate-in fade-in zoom-in-95">
                    <button
                      onClick={() => {
                        triggerShareToast(isRallyPost ? 'Rally link copied' : 'Post link copied');
                        setShowOptions(false);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-neutral-50 flex items-center justify-between cursor-pointer"
                    >
                      <span>Copy link</span>
                    </button>
                    <button
                      onClick={() => {
                        triggerShareToast(isRallyPost ? 'Rally saved to bookmarks' : 'Post saved to bookmarks');
                        setShowOptions(false);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-neutral-50 cursor-pointer"
                    >
                      {isRallyPost ? 'Save Rally' : 'Save post'}
                    </button>
                    <button
                      onClick={() => {
                        triggerShareToast('Thank you for keeping Lalao safe');
                        setShowOptions(false);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-neutral-50 text-rose-600 font-medium cursor-pointer"
                    >
                      {isRallyPost ? 'Report Rally' : 'Report post'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Normal Post Text if post exists */}
          {post && post.text && (
            <p className="mt-2 text-[15px] text-neutral-900 leading-relaxed break-words whitespace-pre-line">
              {post.text}
            </p>
          )}

          {/* Rally Specific Body (Rendered seamlessly within the same card layout) */}
          {linkedRally && (
            <div className={`space-y-2 ${post ? 'mt-2.5 pt-2.5 border-t border-neutral-100' : 'mt-2'}`}>
              <h3 className="text-[15px] font-bold text-neutral-950 tracking-tight leading-snug">
                {linkedRally.title}
              </h3>

              {/* Show description if standalone rally, or if post text didn't already convey it */}
              {(!post || linkedRally.description !== post.text) && (
                <p className="text-sm text-neutral-700 leading-relaxed break-words whitespace-pre-line">
                  {linkedRally.description}
                </p>
              )}

              {/* Metadata Info Chips: Time & Participants & Interested Avatars */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-neutral-600">
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 font-medium">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{linkedRally.timeDate}</span>
                </div>

                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 font-medium">
                  <Users className="w-3.5 h-3.5 text-neutral-500" />
                  <span>
                    {linkedRally.joinedUsersCount} {linkedRally.joinedUsersCount === 1 ? 'person' : 'people'} joined
                    {linkedRally.maxNeeded ? ` (need ${linkedRally.maxNeeded - linkedRally.joinedUsersCount} more)` : ''}
                  </span>
                </div>

                {/* Avatars Stack of Interested Users */}
                {linkedRally.interestedUsers && linkedRally.interestedUsers.length > 0 && (
                  <div className="flex items-center -space-x-1.5 ml-1">
                    {linkedRally.interestedUsers.slice(0, 3).map((user, idx) => (
                      <img
                        key={idx}
                        src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
                        alt={user?.name || 'User'}
                        referrerPolicy="no-referrer"
                        className="w-5 h-5 rounded-full border border-white object-cover"
                      />
                    ))}
                    {linkedRally.joinedUsersCount > 3 && (
                      <span className="w-5 h-5 rounded-full bg-neutral-100 border border-white text-[9px] font-bold text-neutral-600 flex items-center justify-center">
                        +{linkedRally.joinedUsersCount - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Media Attachment (for normal post without rally or with independent media) */}
          {post?.mediaUrl && !linkedRally && (
            <div className="mt-3 relative rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-200/80 group">
              {post.mediaType === 'video' ? (
                <div className="relative aspect-video w-full flex items-center justify-center bg-neutral-900">
                  <img
                    src={post.mediaUrl}
                    alt="Video preview"
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover transition-opacity ${
                      isPlaying ? 'opacity-90' : 'opacity-80'
                    }`}
                  />
                  {/* Video Play Overlay */}
                  <button
                    id={`btn-play-video-${post.id}`}
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="absolute z-10 w-14 h-14 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
                    aria-label={isPlaying ? 'Pause video' : 'Play video'}
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 fill-white" />
                    ) : (
                      <Play className="w-6 h-6 fill-white ml-0.5" />
                    )}
                  </button>

                  {/* Playing pill indicator */}
                  {isPlaying && (
                    <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-mono text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      <span>0:14 / 1:28</span>
                    </div>
                  )}

                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="absolute bottom-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ) : (
                <img
                  src={post.mediaUrl}
                  alt="Post attachment"
                  referrerPolicy="no-referrer"
                  className="w-full max-h-96 object-cover hover:scale-[1.01] transition-transform duration-300"
                  loading="lazy"
                />
              )}
            </div>
          )}

          {/* Unified Action Row */}
          <div className="mt-3.5 flex items-center justify-between text-neutral-500 text-xs">
            {/* Social Interactions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Like */}
              <button
                id={`btn-like-${itemId}`}
                onClick={handleLike}
                className={`flex items-center gap-1.5 py-1 px-2 rounded-lg transition-colors cursor-pointer group ${
                  isLiked ? 'text-rose-600 font-semibold' : 'hover:text-rose-600'
                }`}
              >
                <Heart
                  className={`w-4 h-4 transition-transform group-active:scale-125 ${
                    isLiked ? 'fill-rose-600 stroke-rose-600' : 'stroke-[1.8]'
                  }`}
                />
                <span>{likesCount}</span>
              </button>

              {/* Comment */}
              <button
                id={`btn-comment-${itemId}`}
                onClick={handleComment}
                className="flex items-center gap-1.5 py-1 px-2 rounded-lg hover:text-[#5E43F3] transition-colors cursor-pointer group"
              >
                <MessageCircle className="w-4 h-4 stroke-[1.8] group-active:scale-125 transition-transform" />
                <span>{commentsCount}</span>
              </button>

              {/* Repost (shown on posts, or can be used to re-rally) */}
              {!linkedRally && (
                <button
                  id={`btn-repost-${itemId}`}
                  onClick={handleRepost}
                  className={`flex items-center gap-1.5 py-1 px-2 rounded-lg transition-colors cursor-pointer group ${
                    isReposted ? 'text-emerald-600 font-semibold' : 'hover:text-emerald-600'
                  }`}
                >
                  <Repeat
                    className={`w-4 h-4 stroke-[1.8] group-active:rotate-180 transition-transform ${
                      isReposted ? 'stroke-emerald-600' : ''
                    }`}
                  />
                  <span>{repostsCount}</span>
                </button>
              )}

              {/* Share */}
              <button
                id={`btn-share-${itemId}`}
                onClick={handleShare}
                className="flex items-center gap-1 py-1 px-2 rounded-lg hover:text-neutral-900 transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4 stroke-[1.8]" />
                <span className="hidden xs:inline">Share</span>
              </button>
            </div>

            {/* Rally-Specific Actions (Message Creator & Join/Joined CTA) */}
            {linkedRally && (
              <div className="flex items-center gap-1.5">
                <button
                  id={`btn-msg-rally-${linkedRally.id}`}
                  onClick={handleMessageCreator}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
                  title="Message creator"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>

                <button
                  id={`btn-join-rally-${linkedRally.id}`}
                  onClick={() => toggleJoinRally(linkedRally.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    linkedRally.isJoined
                      ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                      : 'bg-[#5E43F3] text-white hover:bg-[#4E34E0] shadow-sm shadow-[#5E43F3]/25 active:scale-95'
                  }`}
                >
                  {linkedRally.isJoined ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Joined</span>
                    </>
                  ) : (
                    <span>Join Rally</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
