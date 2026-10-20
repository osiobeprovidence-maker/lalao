import React, { useState, useMemo } from 'react';
import {
  SlidersHorizontal,
  Search,
  Check,
  Minus,
  Ban,
  RotateCcw,
  Save,
  Shield,
  Sparkles,
  Info,
  Lock,
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';

export const ContentPreferencesSection: React.FC = () => {
  const { triggerShareToast } = useLalao();

  // Queries & Mutations
  const topics = useQuery(api.topics.listPlatformTopics, {});
  const userPreferences = useQuery(api.topics.getMyContentPreferences);
  const saveBulkMutation = useMutation(api.topics.saveBulkContentPreferences);
  const resetMutation = useMutation(api.topics.resetContentPreferences);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Local draft states
  const [interestedSlugs, setInterestedSlugs] = useState<string[]>([]);
  const [reducedSlugs, setReducedSlugs] = useState<string[]>([]);
  const [excludedSlugs, setExcludedSlugs] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Sync draft state with loaded preferences
  if (userPreferences && !isInitialized) {
    setInterestedSlugs(userPreferences.interestedSlugs || []);
    setReducedSlugs(userPreferences.reducedSlugs || []);
    setExcludedSlugs(userPreferences.excludedSlugs || []);
    setIsInitialized(true);
  }

  // Categories list
  const categories = useMemo(() => {
    if (!topics) return [];
    const set = new Set<string>();
    for (const t of topics) {
      if (t.category) set.add(t.category);
    }
    return Array.from(set);
  }, [topics]);

  // Filtered topics
  const filteredTopics = useMemo(() => {
    if (!topics) return [];
    return topics.filter((t: any) => {
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.displayName.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q))
      );
    });
  }, [topics, searchQuery, categoryFilter]);

  // Set topic state: 'interested' | 'reduced' | 'excluded' | 'none'
  const setTopicState = (slug: string, state: 'interested' | 'reduced' | 'excluded' | 'none') => {
    setInterestedSlugs((prev) => prev.filter((s) => s !== slug));
    setReducedSlugs((prev) => prev.filter((s) => s !== slug));
    setExcludedSlugs((prev) => prev.filter((s) => s !== slug));

    if (state === 'interested') setInterestedSlugs((prev) => [...prev.filter((s) => s !== slug), slug]);
    else if (state === 'reduced') setReducedSlugs((prev) => [...prev.filter((s) => s !== slug), slug]);
    else if (state === 'excluded') setExcludedSlugs((prev) => [...prev.filter((s) => s !== slug), slug]);
  };

  const getTopicState = (slug: string): 'interested' | 'reduced' | 'excluded' | 'none' => {
    if (interestedSlugs.includes(slug)) return 'interested';
    if (reducedSlugs.includes(slug)) return 'reduced';
    if (excludedSlugs.includes(slug)) return 'excluded';
    return 'none';
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveBulkMutation({
        interestedSlugs,
        reducedSlugs,
        excludedSlugs,
      });
      triggerShareToast('Content preferences saved successfully!');
    } catch (err: any) {
      triggerShareToast(err.message || 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsResetting(true);
      await resetMutation({});
      setInterestedSlugs([]);
      setReducedSlugs([]);
      setExcludedSlugs([]);
      triggerShareToast('Preferences reset to default platform discovery.');
    } catch (err: any) {
      triggerShareToast(err.message || 'Failed to reset preferences');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <div className="border-b border-theme-divider-light pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-theme-primary flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#5E43F3]" />
            Content Preferences
          </h3>
          <p className="text-[11px] text-theme-secondary mt-0.5">
            Choose what you want to discover across your For You feed, explore, and recommendations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting || (interestedSlugs.length === 0 && reducedSlugs.length === 0 && excludedSlugs.length === 0)}
            className="px-3 py-1.5 rounded-xl border border-theme-divider-light text-theme-secondary text-xs font-semibold hover:text-theme-primary hover:bg-theme-surface-hover transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>

          <button
            id="btn-save-content-preferences"
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-4 py-1.5 rounded-xl bg-[#5E43F3] text-white text-xs font-bold shadow-md shadow-[#5E43F3]/20 hover:bg-[#4E34E0] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>
      </div>

      {/* Privacy Notice (Requirement 3: Interest != Identity) */}
      <div className="p-3.5 rounded-2xl bg-theme-surface border border-theme-divider-light text-xs text-theme-secondary space-y-2">
        <div className="flex items-center gap-2 text-theme-primary font-bold">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span>Your Privacy & Identity Are Respected</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Selecting topics controls the content recommended in your feeds. It does <strong>not</strong> classify your personal identity, orientation, or beliefs. Your preferences are kept private and are never shown publicly. Sensitive subjects like LGBTQ+ & queer discussions are never forced on anyone and require explicit opt-in.
        </p>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-2 text-[11px] text-theme-secondary bg-theme-base p-2.5 rounded-2xl border border-theme-divider-light">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px]">
            <Check className="w-2.5 h-2.5" />
          </span>
          <span><strong>Interested</strong> (Boosts feed)</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-[10px]">
            <Minus className="w-2.5 h-2.5" />
          </span>
          <span><strong>See Less</strong> (Reduces rate)</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-[10px]">
            <Ban className="w-2.5 h-2.5" />
          </span>
          <span><strong>Exclude</strong> (Hides topic)</span>
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <div className="relative w-full flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-tertiary" />
          <input
            id="input-topic-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics (e.g., Gaming, LGBTQ+, Tech, Anime)..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-theme-surface border border-theme-divider-light text-theme-primary text-xs focus:outline-none focus:border-[#5E43F3]"
          />
        </div>

        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 rounded-xl bg-theme-surface border border-theme-divider-light text-theme-primary text-xs focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {/* Topics Grid */}
      <div className="space-y-2">
        {filteredTopics.map((topic: any) => {
          const state = getTopicState(topic.slug);
          return (
            <div
              key={topic.slug}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                state === 'interested'
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : state === 'reduced'
                  ? 'border-amber-500/40 bg-amber-500/5'
                  : state === 'excluded'
                  ? 'border-rose-500/40 bg-rose-500/5'
                  : 'border-theme-divider-light bg-theme-surface hover:border-theme-divider'
              }`}
            >
              {/* Topic Info */}
              <div className="min-w-0 flex-1 flex items-start gap-3">
                <span className="text-xl shrink-0 mt-0.5">{topic.icon || '📌'}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-theme-primary">
                      {topic.displayName}
                    </h4>
                    {topic.isSensitive && (
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-pink-500/10 text-pink-500 border border-pink-500/20 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Opt-in
                      </span>
                    )}
                  </div>
                  {topic.description && (
                    <p className="text-[11px] text-theme-secondary mt-0.5 leading-relaxed">
                      {topic.description}
                    </p>
                  )}
                </div>
              </div>

              {/* 3-State Controls: Interested, Reduced, Excluded, None */}
              <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setTopicState(topic.slug, state === 'interested' ? 'none' : 'interested')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    state === 'interested'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-theme-base text-theme-secondary hover:text-emerald-500'
                  }`}
                  title="More of this in your feed"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Interested</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTopicState(topic.slug, state === 'reduced' ? 'none' : 'reduced')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    state === 'reduced'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-theme-base text-theme-secondary hover:text-amber-500'
                  }`}
                  title="See less often"
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>Less</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTopicState(topic.slug, state === 'excluded' ? 'none' : 'excluded')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    state === 'excluded'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-theme-base text-theme-secondary hover:text-rose-500'
                  }`}
                  title="Exclude from feed entirely"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Exclude</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
