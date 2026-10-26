import React, { useState } from 'react';
import {
  X,
  Sparkles,
  TrendingUp,
  DollarSign,
  BarChart3,
  Award,
  Users,
  Heart,
  MessageCircle,
  Eye,
  CheckCircle2,
  ArrowRight,
  Edit3,
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import { VerificationBadge } from '../common/VerificationBadge';
import { Avatar } from '../common/Avatar';

export const CreatorHubView: React.FC = () => {
  const { currentUser, triggerShareToast, setIsWalletModalOpen, isCreatorPremiumActive } = useLalao();
  const [activeTab, setActiveTab] = useState<'overview' | 'monetization' | 'performance' | 'progress'>('overview');
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  const hubData = useQuery(api.creators.getCreatorHubData);
  const updateCategory = useMutation(api.creators.updateCreatorCategory);

  // Strictly protected: Creator Hub is only accessible if active Creator Premium subscriber
  if (!isCreatorPremiumActive) {
    return null;
  }

  const CATEGORIES = [
    'Tech & Gadgets',
    'Entertainment & Comedy',
    'Music & Audio',
    'Lifestyle & Vlogs',
    'Art & Visual Design',
    ...(currentUser?.creatorType === 'manga' ? ['Manga & Webtoon'] : []),
    ...(currentUser?.creatorType === 'short_movie' ? ['Short Movies & Dramas'] : []),
    'Education & Knowledge',
    'Sports & Gaming',
    'Food & Culinary',
    'Business & Finance',
  ];

  const handleSaveCategory = async () => {
    if (!selectedCategory) return;
    try {
      await updateCategory({ category: selectedCategory });
      setIsEditingCategory(false);
      triggerShareToast(`Creator category updated to ${selectedCategory}`);
    } catch (err: any) {
      alert(err.message || 'Failed to update category');
    }
  };

  const overview = hubData?.overview;
  const monetization = hubData?.monetization;
  const perf = hubData?.contentPerformance;
  const progress = hubData?.progress;
  const monetizationEligible = hubData?.monetizationEligible === true;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col pb-20 animate-in fade-in duration-200">
      <div className="w-full flex flex-col">
        
        {/* Creator Hub Header */}
        <div className="p-4 sm:p-5 shrink-0 bg-transparent">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <Avatar src={currentUser?.avatar} alt={currentUser?.name || 'Creator'} size="lg" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-theme-primary truncate">
                    {currentUser?.name}
                  </h2>
                  <VerificationBadge user={currentUser} size="sm" />
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] border border-[#5E43F3]/20">
                    {hubData?.creatorLevelTitle || 'Creator'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-theme-tertiary mt-0.5">
                  <span>@{currentUser?.username}</span>
                  <span>·</span>
                  <span className="text-theme-secondary font-medium">
                    {hubData?.creatorCategory || 'General Creator'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory(hubData?.creatorCategory || 'General Creator');
                      setIsEditingCategory(!isEditingCategory);
                    }}
                    className="p-1 hover:text-theme-primary transition-colors text-theme-tertiary cursor-pointer"
                    title="Edit category"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Inline Category Editor */}
          {isEditingCategory && (
            <div className="mt-3 p-3 rounded-xl bg-theme-base border border-theme-divider-light flex items-center gap-2 animate-in fade-in">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 bg-theme-surface text-xs font-semibold text-theme-primary px-3 py-1.5 rounded-lg border border-theme-divider-light focus:outline-none focus:border-[#5E43F3]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleSaveCategory}
                className="px-3 py-1.5 bg-[#5E43F3] hover:bg-[#4E34E0] text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingCategory(false)}
                className="px-2 py-1.5 text-xs text-theme-tertiary hover:text-theme-primary cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Hub Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto no-scrollbar pt-2 px-4 sm:px-5">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'monetization', label: 'Monetization', icon: DollarSign },
              { id: 'performance', label: 'Performance', icon: BarChart3 },
              { id: 'progress', label: 'Progress & Badges', icon: Award },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-theme-primary text-theme-base shadow-sm'
                      : 'bg-transparent text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 p-4 sm:p-5 space-y-6">

          {/* =========================================================
              1. OVERVIEW TAB
              ========================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6">

              {/* Weekly Ranking Highlight Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-theme-surface border border-theme-divider-light flex items-center justify-between flex-wrap gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#5E43F3]">
                    Leaderboard Standing · This Week
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-theme-primary">
                      {overview?.currentRank ? `#${overview.currentRank}` : '--'}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {overview?.rankMovement ? `+${overview.rankMovement} positions this week` : 'No recent movement'}
                    </span>
                  </div>
                  <p className="text-xs text-theme-secondary">
                    Category: <strong className="text-theme-primary">{hubData?.creatorCategory}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-theme-tertiary block font-bold">Next Milestone</span>
                  <span className="text-xs font-black text-[#5E43F3]">
                    Top 10 Leaderboard
                  </span>
                </div>
              </div>

              {/* Core Metric Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-theme-surface border border-theme-divider-light space-y-1">
                  <div className="flex items-center justify-between text-theme-tertiary">
                    <span className="text-[10px] font-black uppercase tracking-wider">Followers</span>
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-lg sm:text-xl font-black text-theme-primary">
                    {overview?.followersCount.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-bold">
                    +{overview?.followerGrowth7d} this week
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-theme-surface border border-theme-divider-light space-y-1">
                  <div className="flex items-center justify-between text-theme-tertiary">
                    <span className="text-[10px] font-black uppercase tracking-wider">Total Likes</span>
                    <Heart className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-lg sm:text-xl font-black text-theme-primary">
                    {overview?.totalLikesReceived.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-bold">
                    +{overview?.recentLikes7d} this week
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-theme-surface border border-theme-divider-light space-y-1">
                  <div className="flex items-center justify-between text-theme-tertiary">
                    <span className="text-[10px] font-black uppercase tracking-wider">Est. Views</span>
                    <Eye className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-lg sm:text-xl font-black text-theme-primary">
                    {overview?.estimatedTotalViews.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-theme-tertiary font-bold">
                    {overview?.engagementRate} engagement
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-theme-surface border border-theme-divider-light space-y-1">
                  <div className="flex items-center justify-between text-theme-tertiary">
                    <span className="text-[10px] font-black uppercase tracking-wider">Earnings</span>
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-lg sm:text-xl font-black text-emerald-600">
                    ₦{(monetizationEligible ? overview?.totalEarnings ?? 0 : 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-theme-tertiary font-medium">
                    Pending: ₦{(monetizationEligible ? overview?.pendingEarnings ?? 0 : 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Progress Toward Next Milestone */}
              <div className="p-4 sm:p-5 rounded-2xl bg-theme-surface border border-theme-divider-light space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-theme-tertiary">
                      Creator Level Progression
                    </h3>
                    <p className="text-sm font-black text-theme-primary mt-0.5">
                      {progress?.levelTitle} (Level {progress?.level})
                    </p>
                  </div>
                  <span className="text-xs font-black text-[#5E43F3]">
                    {progress?.progressPercent}% to next level
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 rounded-full bg-theme-base overflow-hidden border border-theme-divider-light">
                  <div
                    className="h-full bg-gradient-to-r from-[#5E43F3] to-[#7B66F5] rounded-full transition-all duration-500"
                    style={{ width: `${progress?.progressPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-theme-tertiary pt-1">
                  <span>Current XP: {progress?.currentXp}</span>
                  <span>Next: {progress?.nextMilestoneTitle} ({progress?.nextMilestoneXp} XP)</span>
                </div>
              </div>

            </div>
          )}

          {/* =========================================================
              2. MONETIZATION TAB
              ========================================================= */}
          {activeTab === 'monetization' && (
            <div className="space-y-6">

              {/* Earnings Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider-light space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-theme-tertiary">
                    Total Lifetime Earnings
                  </span>
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                    ₦{(monetizationEligible ? monetization?.totalEarnings ?? 0 : 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-emerald-600/80">From tips & paid subscriptions</p>
                </div>

                <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider-light space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-theme-tertiary">
                    Pending Earnings
                  </span>
                  <p className="text-2xl font-black text-theme-primary">
                    ₦{(monetizationEligible ? monetization?.pendingEarnings ?? 0 : 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-theme-tertiary">Settles every Monday</p>
                </div>

                <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider-light space-y-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-theme-tertiary">
                      Available in Wallet
                    </span>
                    <p className="text-2xl font-black text-[#5E43F3]">
                      ₦{(monetizationEligible ? monetization?.availableWalletBalance ?? 0 : 0).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsWalletModalOpen(true);
                    }}
                    className="mt-2 text-xs font-bold text-[#5E43F3] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Manage Wallet & Bank Payout</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Monetization Tools Status */}
              <div className="p-4 sm:p-5 rounded-2xl bg-theme-surface border border-theme-divider-light space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-theme-tertiary">
                  Available Monetization Channels
                </h3>

                <div className="space-y-3">
                  {monetization?.features.map((feat: any) => (
                    <div
                      key={feat.id}
                      className="p-3.5 rounded-xl bg-theme-base border border-theme-divider-light flex items-center justify-between gap-4"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-theme-primary">{feat.title}</h4>
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            Active
                          </span>
                        </div>
                        <p className="text-[11px] text-theme-secondary">{feat.desc}</p>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Eligibility Checklist */}
              <div className="p-4 sm:p-5 rounded-2xl bg-theme-surface border border-theme-divider-light space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-theme-tertiary">
                  Monetization Good Standing
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {monetization?.eligibilityChecklist.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-theme-primary font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* =========================================================
              3. CONTENT PERFORMANCE TAB
              ========================================================= */}
          {activeTab === 'performance' && (
            <div className="space-y-6">

              {/* Analytics Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-theme-surface border border-theme-divider-light">
                  <span className="text-[10px] font-black uppercase tracking-wider text-theme-tertiary block">Views</span>
                  <p className="text-lg font-black text-theme-primary mt-1">{perf?.totalViews.toLocaleString()}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-theme-surface border border-theme-divider-light">
                  <span className="text-[10px] font-black uppercase tracking-wider text-theme-tertiary block">Likes</span>
                  <p className="text-lg font-black text-theme-primary mt-1">{perf?.totalLikes.toLocaleString()}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-theme-surface border border-theme-divider-light">
                  <span className="text-[10px] font-black uppercase tracking-wider text-theme-tertiary block">Comments</span>
                  <p className="text-lg font-black text-theme-primary mt-1">{perf?.totalComments.toLocaleString()}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-theme-surface border border-theme-divider-light">
                  <span className="text-[10px] font-black uppercase tracking-wider text-theme-tertiary block">Resonance</span>
                  <p className="text-lg font-black text-[#5E43F3] mt-1">{perf?.engagementRate}</p>
                </div>
              </div>

              {/* Your Content */}
              <div className="p-4 sm:p-5 rounded-2xl bg-theme-surface border border-theme-divider-light space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-theme-tertiary">
                  Your Content
                </h3>

                {perf?.topPosts.length === 0 ? (
                  <p className="text-xs text-theme-tertiary py-4 text-center">
                    You haven't created any content yet. Share your first creation to start tracking performance!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {perf?.topPosts.map((post: any) => (
                      <div
                        key={post.id}
                        className="p-3.5 rounded-xl bg-theme-base border border-theme-divider-light flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {post.mediaUrl && (
                            <img
                              src={post.mediaUrl}
                              alt="Media thumbnail"
                              className="w-14 h-14 rounded-lg object-cover shrink-0 border border-theme-divider-light"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-theme-primary line-clamp-2">
                              {post.text || 'Media post'}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-[10px] text-theme-tertiary flex items-center gap-1 font-medium">
                                <Heart className="w-3.5 h-3.5 text-rose-500" /> {post.likesCount}
                              </span>
                              <span className="text-[10px] text-theme-tertiary flex items-center gap-1 font-medium">
                                <MessageCircle className="w-3.5 h-3.5 text-blue-500" /> {post.commentsCount}
                              </span>
                              <span className="text-[10px] text-theme-tertiary flex items-center gap-1 font-medium">
                                <Eye className="w-3.5 h-3.5 text-emerald-500" /> {post.viewsCount}
                              </span>
                            </div>
                            <span className="text-[10px] text-theme-tertiary mt-2 block">
                              Published {post.createdAt}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* =========================================================
              4. PROGRESS & BADGES TAB
              ========================================================= */}
          {activeTab === 'progress' && (
            <div className="space-y-6">

              {/* Levels Ladder */}
              <div className="p-4 sm:p-5 rounded-2xl bg-theme-surface border border-theme-divider-light space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-theme-tertiary">
                  Creator Career Ladder
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                  {[
                    { lvl: 1, title: 'Emerging', min: '0 XP' },
                    { lvl: 2, title: 'Active', min: '150 XP' },
                    { lvl: 3, title: 'Rising', min: '500 XP' },
                    { lvl: 4, title: 'Pro', min: '1,200 XP' },
                    { lvl: 5, title: 'Elite', min: '3,000 XP' },
                  ].map((l) => {
                    const isPassed = (progress?.level ?? 1) >= l.lvl;
                    const isCurrent = (progress?.level ?? 1) === l.lvl;
                    return (
                      <div
                        key={l.lvl}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isCurrent
                            ? 'border-[#5E43F3] bg-[#5E43F3]/10 ring-2 ring-[#5E43F3]/20'
                            : isPassed
                            ? 'border-theme-divider-light bg-theme-surface'
                            : 'border-theme-divider-light/50 bg-theme-base opacity-60'
                        }`}
                      >
                        <span className={`text-[10px] font-black uppercase ${isCurrent ? 'text-[#5E43F3]' : 'text-theme-tertiary'}`}>
                          Lvl {l.lvl}
                        </span>
                        <h4 className="text-xs font-black text-theme-primary mt-0.5">{l.title}</h4>
                        <span className="text-[9px] text-theme-tertiary block mt-1">{l.min}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Milestone Goals Checklist */}
              <div className="p-4 sm:p-5 rounded-2xl bg-theme-surface border border-theme-divider-light space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-theme-tertiary">
                  Tasks for Next Milestone
                </h3>
                <div className="space-y-2.5">
                  {progress?.milestoneGoals.map((g: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-theme-base border border-theme-divider-light flex items-center justify-between gap-3"
                    >
                      <span className="text-xs font-medium text-theme-primary">{g.goal}</span>
                      {g.completed ? (
                        <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Done
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-theme-tertiary">In Progress</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Unlocked Achievements */}
              <div className="p-4 sm:p-5 rounded-2xl bg-theme-surface border border-theme-divider-light space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-theme-tertiary">
                  Creator Achievements
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {progress?.achievements.map((ach: any) => (
                    <div
                      key={ach.id}
                      className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                        ach.unlocked
                          ? 'border-[#5E43F3]/20 bg-[#5E43F3]/5'
                          : 'border-theme-divider-light bg-theme-base opacity-60'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        ach.unlocked ? 'bg-[#5E43F3] text-white shadow-xs' : 'bg-theme-surface text-theme-tertiary'
                      }`}>
                        <Award className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black text-theme-primary">{ach.title}</h4>
                          {ach.unlocked && <CheckCircle2 className="w-3 h-3 text-[#5E43F3] shrink-0" />}
                        </div>
                        <p className="text-[11px] text-theme-secondary mt-0.5">{ach.desc}</p>
                        {ach.date && (
                          <span className="text-[9px] text-theme-tertiary mt-1 block">Unlocked {ach.date}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};


