import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Plus, UserPlus, Zap, X } from 'lucide-react';
import { OnboardingLayout } from './OnboardingLayout';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Avatar } from '../../components/common/Avatar';

export const RecommendationsPage: React.FC = () => {
  const navigate = useNavigate();
  const recommendations = useQuery(api.recommendations.getOnboardingRecommendations, { limit: 15 });
  const completeOnboarding = useMutation(api.users.completeOnboardingStep);
  const toggleFollowUser = useMutation(api.social.toggleFollow);
  const toggleFollowPage = useMutation(api.pages.followPage);
  const dismissRec = useMutation(api.recommendations.dismissRecommendation);
  
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [dismissedMap, setDismissedMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleFollow = async (rec: any) => {
    const isCurrentlyFollowing = followingMap[rec.id];
    setFollowingMap(prev => ({ ...prev, [rec.id]: !isCurrentlyFollowing }));

    try {
      if (rec.type === 'user') {
        await toggleFollowUser({ targetId: rec.id as any });
      } else if (rec.type === 'page' || rec.type === 'community') {
        await toggleFollowPage({ pageId: rec.id as any });
      }
    } catch (err) {
      // Revert on error
      setFollowingMap(prev => ({ ...prev, [rec.id]: isCurrentlyFollowing }));
      console.error("Failed to follow", err);
    }
  };

  const handleDismiss = async (rec: any) => {
    setDismissedMap(prev => ({ ...prev, [rec.id]: true }));
    try {
      await dismissRec({ targetId: rec.id });
    } catch (err) {
      console.error("Failed to dismiss", err);
    }
  };

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      await completeOnboarding();
      navigate('/onboarding/complete');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const followingCount = Object.values(followingMap).filter(Boolean).length;

  return (
    <OnboardingLayout 
      step={6} 
      totalSteps={7} 
      title="Follow people and communities you like" 
      subtitle="Kickstart your For You feed by following some accounts." 
      backTo="/onboarding/interests"
    >
      <div className="space-y-6">
        
        {/* Selection count */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-neutral-500">
            {followingCount} following 
          </span>
          {followingCount > 0 && (
            <span className="text-xs font-bold text-[#3823A4] bg-[#F8F7FF] px-2.5 py-1 rounded-full border border-indigo-100">
              ✓ Good to go
            </span>
          )}
        </div>

        {/* Recommendations List */}
        <div className="space-y-4">
          {recommendations === undefined ? (
            <div className="text-center py-10 text-neutral-400 text-sm">
              Loading recommendations...
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-10 text-neutral-400 text-sm">
              No recommendations available right now.
            </div>
          ) : (
            recommendations.filter(r => !dismissedMap[r.id]).map((rec) => (
              <div key={rec.id} className="group relative flex items-center justify-between p-4 rounded-xl border border-neutral-100 bg-white hover:bg-neutral-50/50 transition-colors">
                
                {/* Dismiss button (appears on hover) */}
                <button
                  onClick={() => handleDismiss(rec)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-neutral-200 rounded-full flex items-center justify-center text-neutral-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"
                  title="Not interested"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar src={rec.avatar} alt={rec.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-neutral-900 truncate text-sm flex items-center gap-1.5">
                      {rec.name}
                      {(rec.type === 'page' || rec.type === 'community') && (
                         <Zap className="w-3 h-3 text-[#5E43F3] fill-[#5E43F3]" />
                      )}
                    </h3>
                    <p className="text-xs text-neutral-500 truncate">@{rec.username}</p>
                    {rec.description && (
                      <p className="text-xs text-neutral-600 line-clamp-1 mt-0.5">{rec.description}</p>
                    )}
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => handleToggleFollow(rec)}
                  className={`ml-4 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    followingMap[rec.id]
                      ? 'bg-neutral-100 text-neutral-700 hover:bg-red-50 hover:text-red-600'
                      : 'bg-[#5E43F3] text-white hover:bg-[#4a34c9] shadow-sm shadow-[#5E43F3]/20'
                  }`}
                >
                  {followingMap[rec.id] ? 'Following' : 'Follow'}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Continue button */}
        <div className="pt-4">
          <button
            type="button"
            onClick={handleContinue}
            disabled={isLoading}
            className="w-full py-4 rounded-xl bg-neutral-950 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-neutral-900 transition-colors active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none cursor-pointer"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={handleContinue}
            disabled={isLoading}
            className="w-full py-4 text-neutral-500 font-bold text-sm hover:text-neutral-950 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
};
