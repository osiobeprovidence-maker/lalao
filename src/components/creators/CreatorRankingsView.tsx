import React, { useState } from 'react';
import {
  Flame,
  Users,
  Heart,
  Award,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Minus,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import { VerificationBadge } from '../common/VerificationBadge';
import { Avatar } from '../common/Avatar';
import { CreatorRankingItem } from '../../types';

interface CreatorRankingsViewProps {
  onOpenCreatorHub?: () => void;
  onOpenSubscriptionModal?: () => void;
}

export const CreatorRankingsView: React.FC<CreatorRankingsViewProps> = ({
  onOpenCreatorHub,
  onOpenSubscriptionModal,
}) => {
  const {
    currentUser,
    setActiveUserProfile,
    toggleFollowUser,
  } = useLalao();

  const [category, setCategory] = useState<'trending' | 'most_followed' | 'most_loved' | 'content_leaders' | 'rising'>('trending');
  const [timePeriod, setTimePeriod] = useState<'today' | 'week' | 'month' | 'all_time'>('week');

  const rankingsData = useQuery(api.creators.getCreatorRankings, {
    category,
    timePeriod,
    limit: 30,
  });

  const CATEGORIES = [
    {
      id: 'trending',
      label: 'Trending',
      icon: Flame,
      color: 'text-amber-500',
      desc: 'Strongest recent momentum & viral engagement',
    },
    {
      id: 'rising',
      label: 'Rising Creators',
      icon: TrendingUp,
      color: 'text-emerald-500',
      desc: 'Emerging creators showing exceptional growth velocity',
    },
    {
      id: 'most_loved',
      label: 'Most Loved',
      icon: Heart,
      color: 'text-rose-500',
      desc: 'Creators receiving the highest community praise & likes',
    },
    {
      id: 'content_leaders',
      label: 'Content Leaders',
      icon: Award,
      color: 'text-[#5E43F3]',
      desc: 'Highest average engagement and resonance per post',
    },
    {
      id: 'most_followed',
      label: 'Most Followed',
      icon: Users,
      color: 'text-blue-500',
      desc: 'Largest community audiences on LaLao',
    },
  ];

  const TIME_PERIODS = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'all_time', label: 'All Time' },
  ];

  const activeCategoryObj = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];
  const isCurrentUserCreator = currentUser?.verificationTier === 'creator';

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Category Pills Slider */}
      <div className="px-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-theme-inverse text-theme-text-inverse shadow-xs'
                    : 'bg-theme-surface text-theme-secondary border border-theme-divider/80 hover:bg-theme-base hover:text-theme-primary'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-400' : cat.color}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Period Filter & Description Bar */}
      <div className="px-4 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[11px] text-theme-tertiary font-medium line-clamp-1">
          {activeCategoryObj.desc}
        </p>

        <div className="flex items-center gap-1 bg-theme-surface p-1 rounded-xl border border-theme-divider-light shrink-0">
          {TIME_PERIODS.map((tp) => (
            <button
              key={tp.id}
              onClick={() => setTimePeriod(tp.id as any)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                timePeriod === tp.id
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-theme-secondary hover:text-theme-primary'
              }`}
            >
              {tp.label}
            </button>
          ))}
        </div>
      </div>

      {/* User Standing Banner */}
      <div className="px-4">
        {rankingsData?.currentUserRank ? (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-teal-500/5 border border-teal-500/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                #{rankingsData.currentUserRank.rank}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-theme-primary truncate">
                    You are #{rankingsData.currentUserRank.rank} in {activeCategoryObj.label}
                  </span>
                  <VerificationBadge tier={currentUser?.verificationTier || 'creator'} size="xs" />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                  {rankingsData.currentUserRank.movement > 0 ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                      <ArrowUp className="w-3 h-3" />
                      +{rankingsData.currentUserRank.movement} positions
                    </span>
                  ) : rankingsData.currentUserRank.movement < 0 ? (
                    <span className="text-rose-500 font-bold flex items-center gap-0.5">
                      <ArrowDown className="w-3 h-3" />
                      {rankingsData.currentUserRank.movement} positions
                    </span>
                  ) : (
                    <span className="text-theme-tertiary font-medium flex items-center gap-0.5">
                      <Minus className="w-3 h-3" />
                      Steady rank
                    </span>
                  )}
                  <span className="text-theme-tertiary">·</span>
                  <span className="text-theme-tertiary">Score {Math.round(rankingsData.currentUserRank.score)}</span>
                </div>
              </div>
            </div>

            {onOpenCreatorHub && isCurrentUserCreator && (
              <button
                type="button"
                onClick={onOpenCreatorHub}
                className="px-3 py-1.5 rounded-xl bg-theme-surface hover:bg-theme-surface-hover border border-theme-divider text-xs font-bold text-teal-600 dark:text-teal-400 shrink-0 transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Creator Hub</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-teal-500/5 border border-teal-500/15 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
              <p className="text-xs text-theme-secondary">
                Get verified with <strong>Creator Premium</strong> to unlock analytics and compete on the leaderboard.
              </p>
            </div>
            {onOpenSubscriptionModal && (
              <button
                type="button"
                onClick={onOpenSubscriptionModal}
                className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shrink-0 transition-all cursor-pointer shadow-xs"
              >
                Get Verified
              </button>
            )}
          </div>
        )}
      </div>

      {/* Rankings Feed List */}
      <div className="px-4 space-y-2.5">
        {rankingsData === undefined ? (
          <div className="py-16 text-center">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-theme-tertiary mt-2">Calculating live creator rankings...</p>
          </div>
        ) : rankingsData.rankings.length === 0 ? (
          <div className="py-16 text-center bg-theme-surface rounded-2xl border border-theme-divider">
            <Award className="w-10 h-10 text-theme-tertiary mx-auto mb-2 opacity-50" />
            <h4 className="text-sm font-black text-theme-primary">No creators in this category yet</h4>
            <p className="text-xs text-theme-tertiary mt-1">Be the first to publish content and claim the #1 rank!</p>
          </div>
        ) : (
          rankingsData.rankings.map((item: any) => {
            const isTop3 = item.rank <= 3;
            const rankBadgeStyles = {
              1: 'bg-amber-500 text-white shadow-amber-500/30 ring-2 ring-amber-400/30',
              2: 'bg-slate-400 text-white shadow-slate-400/30 ring-2 ring-slate-300/30',
              3: 'bg-amber-700 text-white shadow-amber-700/30 ring-2 ring-amber-600/30',
            }[item.rank as 1 | 2 | 3] || 'bg-theme-surface-active text-theme-secondary';

            return (
              <div
                key={item.user.id}
                onClick={() => setActiveUserProfile(item.user)}
                className={`p-3.5 rounded-2xl bg-theme-surface border transition-all cursor-pointer hover:bg-theme-surface-hover/80 flex items-center justify-between gap-3 shadow-xs ${
                  isTop3
                    ? 'border-teal-500/20 dark:border-teal-500/30'
                    : 'border-theme-divider-light'
                }`}
              >
                {/* Left: Rank & Creator Info */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Rank Badge */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${rankBadgeStyles}`}>
                    #{item.rank}
                  </div>

                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <Avatar src={item.user.avatar} alt={item.user.name} size="md" />
                  </div>

                  {/* Name, Badge, Category, Metric */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-sm text-theme-primary truncate hover:underline">
                        {item.user.name}
                      </span>
                      <VerificationBadge
                        tier={item.user.verificationTier || 'creator'}
                        size="xs"
                      />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-theme-tertiary mt-0.5 flex-wrap">
                      <span className="text-[11px] text-teal-700 dark:text-teal-300 font-bold">
                        {item.user.creatorCategory || 'Creator'}
                      </span>
                      <span>·</span>
                      <span className="text-[11px] text-theme-secondary font-medium">
                        {item.user.followersCount?.toLocaleString()} followers
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Metric & Movement Indicator */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-black text-theme-primary block">
                      {item.metricValue}
                    </span>
                    <span className="text-[10px] text-theme-tertiary block font-medium">
                      {item.metricLabel}
                    </span>
                  </div>

                  {/* Movement Tag */}
                  <div className="w-12 text-right">
                    {item.movement > 0 ? (
                      <span className="inline-flex items-center gap-0.5 text-xs font-black text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                        <ArrowUp className="w-3 h-3 stroke-[3]" />
                        {item.movement}
                      </span>
                    ) : item.movement < 0 ? (
                      <span className="inline-flex items-center gap-0.5 text-xs font-black text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-md">
                        <ArrowDown className="w-3 h-3 stroke-[3]" />
                        {Math.abs(item.movement)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-theme-tertiary bg-theme-surface-hover px-1.5 py-0.5 rounded-md">
                        <Minus className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  {/* Follow button */}
                  {currentUser?.id !== item.user.id && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFollowUser(item.user.id);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        item.user.isFollowing
                          ? 'border border-theme-divider-strong text-theme-secondary hover:bg-theme-surface-hover'
                          : 'bg-theme-inverse text-theme-text-inverse hover:opacity-90'
                      }`}
                    >
                      {item.user.isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
