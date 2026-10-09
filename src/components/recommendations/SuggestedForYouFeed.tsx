import React, { useMemo } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Avatar } from '../common/Avatar';
import { VerificationBadge } from '../common/VerificationBadge';
import { useLalao } from '../../context/LalaoContext';
import { X, UserPlus, TrendingUp, Sparkles, Building2 } from 'lucide-react';

export const SuggestedForYouFeed: React.FC = () => {
  const recommendations = useQuery(api.recommendationEngine.getSuggestedForYou, { limit: 20 });
  const trackInteraction = useMutation(api.recommendationEngine.trackInteraction);
  
  const { toggleFollowUser, setActiveUserProfile, setActiveTab } = useLalao();

  if (recommendations === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-[#5E43F3] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="w-16 h-16 bg-[#5E43F3]/10 text-[#5E43F3] rounded-full flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-theme-primary mb-1">You're all caught up!</h3>
        <p className="text-sm text-theme-tertiary">Check back later for more recommendations.</p>
      </div>
    );
  }

  const handleDismiss = (e: React.MouseEvent, targetId: string, type: string) => {
    e.stopPropagation();
    trackInteraction({ targetId, recommendationType: type, action: 'dismissed' });
  };

  const handleFollow = (e: React.MouseEvent, targetId: string, type: string) => {
    e.stopPropagation();
    trackInteraction({ targetId, recommendationType: type, action: 'followed' });
    toggleFollowUser(targetId);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* People Section */}
      <section>
        <div className="mb-3 px-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#5E43F3]" />
            <h2 className="text-sm font-bold text-theme-primary tracking-tight">People you may want to follow</h2>
          </div>
        </div>

        <div className="bg-theme-surface rounded-2xl border border-black/[0.04] dark:border-white/[0.06] overflow-hidden">
          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
            {recommendations.filter(r => r.type === 'person').slice(0, 5).map((rec) => (
              <div key={rec.targetId} className="flex items-center justify-between gap-3 p-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                   onClick={() => {
                     trackInteraction({ targetId: rec.targetId, recommendationType: 'person', action: 'clicked' });
                     setActiveUserProfile(rec.data);
                     setActiveTab('profile');
                   }}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar src={rec.data.avatar} alt={rec.data.name} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-theme-primary truncate">
                      {rec.data.name} <VerificationBadge user={rec.data} size="xs" className="ml-0.5" />
                    </p>
                    <p className="text-[11px] text-[#707070] dark:text-[#707070] truncate">@{rec.data.username}</p>
                    <p className="text-[10px] text-theme-tertiary mt-0.5">{rec.reason}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleFollow(e, rec.targetId, 'person')}
                    className="px-3.5 py-1.5 rounded-full bg-[#5E43F3] text-[11px] font-bold text-white hover:bg-[#4E34E0] shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    Follow
                  </button>
                  <button 
                    onClick={(e) => handleDismiss(e, rec.targetId, 'person')}
                    className="p-1.5 rounded-full text-theme-tertiary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Posts Section */}
      {recommendations.some(r => r.type === 'post') && (
        <section>
          <div className="mb-3 px-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#5E43F3]" />
              <h2 className="text-sm font-bold text-theme-primary tracking-tight">Trending around you</h2>
            </div>
          </div>
          
          <div className="space-y-3">
            {recommendations.filter(r => r.type === 'post').slice(0, 3).map((rec) => (
              <div key={rec.targetId} className="bg-theme-surface rounded-2xl border border-black/[0.04] dark:border-white/[0.06] p-4 relative"
                   onClick={() => trackInteraction({ targetId: rec.targetId, recommendationType: 'post', action: 'clicked' })}>
                <button 
                  onClick={(e) => handleDismiss(e, rec.targetId, 'post')}
                  className="absolute top-2 right-2 p-1.5 rounded-full text-theme-tertiary hover:bg-black/5 dark:hover:bg-white/5 transition-colors z-10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="text-[10px] text-[#5E43F3] font-bold mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  {rec.reason}
                </div>
                <p className="text-sm text-theme-primary mb-3 line-clamp-3">{rec.data.text}</p>
                {rec.data.mediaUrl && (
                  <div className="w-full h-32 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 mb-3">
                    <img src={rec.data.mediaUrl} className="w-full h-full object-cover" alt="Post attachment" />
                  </div>
                )}
                <div className="flex items-center gap-4 text-[11px] text-theme-tertiary font-medium">
                  <span>{rec.data.likesCount} likes</span>
                  <span>{rec.data.commentsCount} comments</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pages Section */}
      {recommendations.some(r => r.type === 'page') && (
        <section>
          <div className="mb-3 px-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#5E43F3]" />
              <h2 className="text-sm font-bold text-theme-primary tracking-tight">Pages you may like</h2>
            </div>
          </div>

          <div className="bg-theme-surface rounded-2xl border border-black/[0.04] dark:border-white/[0.06] overflow-hidden">
            <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
              {recommendations.filter(r => r.type === 'page').slice(0, 3).map((rec) => (
                <div key={rec.targetId} className="flex items-center justify-between gap-3 p-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                     onClick={() => trackInteraction({ targetId: rec.targetId, recommendationType: 'page', action: 'clicked' })}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar src={rec.data.avatar} alt={rec.data.name} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-theme-primary truncate">{rec.data.name}</p>
                      <p className="text-[11px] text-[#707070] dark:text-[#707070] truncate">@{rec.data.username} • {rec.data.followersCount} followers</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleFollow(e, rec.targetId, 'page')}
                      className="px-3.5 py-1.5 rounded-full bg-theme-base border border-theme-divider text-[11px] font-bold text-theme-secondary hover:bg-theme-surface-hover shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                      Follow
                    </button>
                    <button 
                      onClick={(e) => handleDismiss(e, rec.targetId, 'page')}
                      className="p-1.5 rounded-full text-theme-tertiary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
