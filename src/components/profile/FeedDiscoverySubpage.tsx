import React from 'react';
import { ArrowLeft, Check, SlidersHorizontal, ChevronRight } from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface FeedDiscoverySubpageProps {
  onBack: () => void;
  onOpenManageTopics: () => void;
}

const AVAILABLE_FEEDS = [
  { id: 'anime', label: 'Anime' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'stem', label: 'STEM' },
  { id: 'drama', label: 'Drama' },
];

export const FeedDiscoverySubpage: React.FC<FeedDiscoverySubpageProps> = ({
  onBack,
  onOpenManageTopics,
}) => {
  const { currentUser, setCurrentUser, triggerShareToast } = useLalao();
  const updateInterestsMutation = useMutation(api.users.updateInterests);

  const selectedFeeds = currentUser?.interests || [];

  const userTopicPreferences = useQuery(api.topics.getMyContentPreferences);
  const activeTopicsCount = userTopicPreferences?.interestedSlugs?.length || 0;

  const handleToggleFeed = async (feedId: string) => {
    const exists = selectedFeeds.includes(feedId);
    const updated = exists
      ? selectedFeeds.filter((id) => id !== feedId)
      : [...selectedFeeds, feedId];

    setCurrentUser((prev) => ({ ...prev, interests: updated }));
    try {
      await updateInterestsMutation({ interests: updated });
    } catch (err) {
      console.error('[Settings] Failed to update feeds:', err);
      triggerShareToast('Failed to update feed categories');
    }
  };

  return (
    <div className="flex flex-col h-full bg-theme-surface animate-in fade-in duration-200">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-theme-surface/95 backdrop-blur-md border-b border-theme-divider-light px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-feed-discovery"
            type="button"
            onClick={onBack}
            className="p-1.5 -ml-1 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
            title="Back to Settings Hub"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-base text-theme-primary">Feed & Content Discovery</h1>
            <p className="text-[11px] text-theme-tertiary">Feeds tabs and personalized topics</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="px-3.5 py-1.5 rounded-full bg-theme-surface-hover hover:bg-theme-surface-active text-theme-primary text-xs font-bold transition-all cursor-pointer"
        >
          Done
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-xl mx-auto w-full pb-24">
        {/* Feed Categories (Main Content Tabs) */}
        <div className="space-y-3">
          <div className="border-b border-theme-divider-light pb-2 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
                Feed Categories
              </h3>
              <p className="text-[11px] text-theme-tertiary mt-0.5">
                Choose the primary category tabs you want to browse on your Home feed.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#5E43F3]/10 text-[#5E43F3]">
              {selectedFeeds.length} active
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider-light space-y-3">
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_FEEDS.map(({ id, label }) => {
                const isSelected = selectedFeeds.includes(id);
                return (
                  <button
                    key={id}
                    id={`btn-feed-${id}`}
                    type="button"
                    onClick={() => handleToggleFeed(id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 select-none ${
                      isSelected
                        ? 'bg-[#5E43F3] text-white shadow-xs'
                        : 'bg-theme-base text-theme-secondary border border-theme-divider hover:bg-theme-surface-hover'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-theme-tertiary">
              Selected categories appear as browsable filter tabs on your feed in real-time.
            </p>
          </div>
        </div>

        {/* Topics Personalization Navigation Row */}
        <div className="space-y-3">
          <div className="border-b border-theme-divider-light pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
              Content Topics Personalization
            </h3>
            <p className="text-[11px] text-theme-tertiary mt-0.5">
              Fine-tune the specific stories and topics prioritized in your feed algorithm.
            </p>
          </div>

          <button
            id="btn-manage-topics-row"
            type="button"
            onClick={onOpenManageTopics}
            className="w-full p-4 rounded-2xl bg-theme-surface border border-theme-divider-light hover:border-[#5E43F3]/50 hover:bg-theme-surface-hover transition-all cursor-pointer flex items-center justify-between gap-4 text-left group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-theme-primary">
                    Manage Topics
                  </span>
                  {activeTopicsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      {activeTopicsCount} selected
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-theme-tertiary mt-0.5 line-clamp-1">
                  Personalize stories inside your feeds without changing your tabs.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-bold text-[#5E43F3]">Configure</span>
              <ChevronRight className="w-4 h-4 text-[#5E43F3] group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
