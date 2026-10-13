import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Avatar } from '../common/Avatar';
import { VerificationBadge } from '../common/VerificationBadge';
import { getPublicIdentityLabel } from '../common/UserIdentity';
import { useLalao } from '../../context/LalaoContext';
import { X, UserPlus, TrendingUp, Building2, Check } from 'lucide-react';

export const SuggestedForYouFeed: React.FC = () => {
  const recommendations = useQuery(api.recommendationEngine.getSuggestedForYou, { limit: 30 });
  const trackInteraction = useMutation(api.recommendationEngine.trackInteraction);
  
  const { toggleFollowUser, setActiveUserProfile, setActiveTab } = useLalao();

  // Optimistic local sets for instantaneous UI updates
  const [optimisticDismissed, setOptimisticDismissed] = useState<Set<string>>(new Set());
  const [optimisticFollowed, setOptimisticFollowed] = useState<Set<string>>(new Set());

  if (recommendations === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-[#5E43F3] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Filter out optimistically dismissed recommendations
  const activeRecs = recommendations.filter(
    (r) => !optimisticDismissed.has(r.targetId)
  );

  const peopleRecs = activeRecs.filter((r) => r.type === 'person');
  const postRecs = activeRecs.filter((r) => r.type === 'post');
  const pageRecs = activeRecs.filter((r) => r.type === 'page');

  if (activeRecs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4 bg-theme-surface rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
        <div className="w-12 h-12 bg-black/[0.03] dark:bg-white/[0.04] text-theme-tertiary rounded-full flex items-center justify-center mb-3">
          <UserPlus className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-theme-primary mb-1">You're all caught up</h3>
        <p className="text-xs text-theme-tertiary">Check back later for new local people and trending recommendations.</p>
      </div>
    );
  }

  const handleDismiss = (e: React.MouseEvent, targetId: string, type: string) => {
    e.stopPropagation();
    // Instantaneous local UI dismissal so slot is immediately refilled
    setOptimisticDismissed((prev) => new Set(prev).add(targetId));
    // Persist via backend mutation
    trackInteraction({ targetId, recommendationType: type, action: 'dismissed' }).catch(console.error);
  };

  const handleFollow = (e: React.MouseEvent, targetId: string, type: string) => {
    e.stopPropagation();
    const isNowFollowed = !optimisticFollowed.has(targetId);
    setOptimisticFollowed((prev) => {
      const next = new Set(prev);
      if (isNowFollowed) {
        next.add(targetId);
      } else {
        next.delete(targetId);
      }
      return next;
    });

    if (isNowFollowed) {
      trackInteraction({ targetId, recommendationType: type, action: 'followed' }).catch(console.error);
    }
    toggleFollowUser(targetId);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* People Section */}
      {peopleRecs.length > 0 && (
        <section>
          <div className="mb-3 px-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#5E43F3]" />
              <h2 className="text-sm font-bold text-theme-primary tracking-tight">People you may want to follow</h2>
            </div>
            <span className="text-[11px] font-medium text-theme-tertiary">
              {peopleRecs.length} suggestions
            </span>
          </div>

          <div className="bg-theme-surface rounded-2xl border border-black/[0.04] dark:border-white/[0.06] overflow-hidden">
            <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
              {peopleRecs.slice(0, 5).map((rec) => {
                const isFollowed = optimisticFollowed.has(rec.targetId);

                return (
                  <div 
                    key={rec.targetId} 
                    className="flex items-center justify-between gap-3 p-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => {
                      trackInteraction({ targetId: rec.targetId, recommendationType: 'person', action: 'clicked' }).catch(console.error);
                      setActiveUserProfile(rec.data);
                      setActiveTab('profile');
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar 
                        src={rec.data.avatar} 
                        alt={getPublicIdentityLabel(rec.data)} 
                        size="md" 
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-theme-primary truncate">
                          {getPublicIdentityLabel(rec.data)} <VerificationBadge user={rec.data} size="xs" className="ml-0.5" asSpan />
                        </p>
                        <p className="text-[10px] text-theme-tertiary mt-0.5 truncate">{rec.reason}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleFollow(e, rec.targetId, 'person')}
                        className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1 ${
                          isFollowed 
                            ? 'bg-theme-base border border-theme-divider text-theme-secondary hover:bg-theme-surface-hover' 
                            : 'bg-[#5E43F3] text-white hover:bg-[#4E34E0]'
                        }`}
                      >
                        {isFollowed ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" /> Following
                          </>
                        ) : (
                          'Follow'
                        )}
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => handleDismiss(e, rec.targetId, 'person')}
                        className="p-1.5 rounded-full text-theme-tertiary hover:text-theme-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        title="Dismiss recommendation"
                        aria-label="Dismiss recommendation"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Posts Section */}
      {postRecs.length > 0 && (
        <section>
          <div className="mb-3 px-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#5E43F3]" />
              <h2 className="text-sm font-bold text-theme-primary tracking-tight">Trending around you</h2>
            </div>
          </div>
          
          <div className="space-y-3">
            {postRecs.slice(0, 3).map((rec) => (
              <div 
                key={rec.targetId} 
                className="bg-theme-surface rounded-2xl border border-black/[0.04] dark:border-white/[0.06] p-4 relative"
                onClick={() => trackInteraction({ targetId: rec.targetId, recommendationType: 'post', action: 'clicked' }).catch(console.error)}
              >
                <button 
                  type="button"
                  onClick={(e) => handleDismiss(e, rec.targetId, 'post')}
                  className="absolute top-2 right-2 p-1.5 rounded-full text-theme-tertiary hover:text-theme-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors z-10 cursor-pointer"
                  title="Dismiss post"
                  aria-label="Dismiss post"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Clean label without decorative emoji */}
                <div className="text-[10px] text-[#5E43F3] font-bold mb-2 uppercase tracking-wider">
                  {rec.reason}
                </div>
                <p className="text-sm text-theme-primary mb-3 line-clamp-3">{rec.data.text}</p>
                {rec.data.mediaUrl && (
                  <div className="w-full h-36 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 mb-3 border border-black/[0.03] dark:border-white/[0.04]">
                    <img 
                      src={rec.data.mediaUrl} 
                      className="w-full h-full object-cover" 
                      alt="Post attachment" 
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="flex items-center gap-4 text-[11px] text-theme-tertiary font-medium">
                  <span>{rec.data.likesCount || 0} likes</span>
                  <span>{rec.data.commentsCount || 0} comments</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pages Section */}
      {pageRecs.length > 0 && (
        <section>
          <div className="mb-3 px-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#5E43F3]" />
              <h2 className="text-sm font-bold text-theme-primary tracking-tight">Pages you may like</h2>
            </div>
          </div>

          <div className="bg-theme-surface rounded-2xl border border-black/[0.04] dark:border-white/[0.06] overflow-hidden">
            <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
              {pageRecs.slice(0, 3).map((rec) => {
                const isFollowed = optimisticFollowed.has(rec.targetId);

                return (
                  <div 
                    key={rec.targetId} 
                    className="flex items-center justify-between gap-3 p-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => trackInteraction({ targetId: rec.targetId, recommendationType: 'page', action: 'clicked' }).catch(console.error)}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar src={rec.data.avatar} alt={rec.data.name} size="md" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-theme-primary truncate">{rec.data.name}</p>
                        <p className="text-[11px] text-[#707070] dark:text-[#707070] truncate">@{rec.data.username} • {rec.data.followersCount || 0} followers</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleFollow(e, rec.targetId, 'page')}
                        className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold shadow-sm transition-all active:scale-95 cursor-pointer ${
                          isFollowed 
                            ? 'bg-theme-base border border-theme-divider text-theme-secondary hover:bg-theme-surface-hover' 
                            : 'bg-theme-base border border-theme-divider text-theme-secondary hover:bg-theme-surface-hover'
                        }`}
                      >
                        {isFollowed ? 'Following' : 'Follow'}
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => handleDismiss(e, rec.targetId, 'page')}
                        className="p-1.5 rounded-full text-theme-tertiary hover:text-theme-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        title="Dismiss page recommendation"
                        aria-label="Dismiss page recommendation"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
