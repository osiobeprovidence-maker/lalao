import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Check,
  Minus,
  Ban,
  RotateCcw,
  Save,
  Shield,
  Sparkles,
  Lock,
  Layers,
  Plus,
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';

interface TopicsManagementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TopicsManagementDrawer: React.FC<TopicsManagementDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const { triggerShareToast, currentUser } = useLalao();

  // Queries & Mutations
  const topics = useQuery(api.topics.listPlatformTopics, {});
  const userPreferences = useQuery(api.topics.getMyContentPreferences);
  const saveBulkMutation = useMutation(api.topics.saveBulkContentPreferences);
  const resetMutation = useMutation(api.topics.resetContentPreferences);
  const addCustomTopicMutation = useMutation(api.topics.addCustomTopic);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Custom topic input
  const [customTopicName, setCustomTopicName] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);

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
        (t.category && t.category.toLowerCase().includes(q)) ||
        t.slug.toLowerCase().includes(q)
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

  // Add custom topic handler
  const handleAddCustomTopic = async (nameToAdd?: string) => {
    const rawName = (nameToAdd || customTopicName).trim();
    if (!rawName || rawName.length < 2) {
      triggerShareToast('Please enter a topic name of at least 2 characters');
      return;
    }

    // Check if topic is already selected or exists
    const matchingExisting = topics?.find(
      (t: any) =>
        t.displayName.toLowerCase() === rawName.toLowerCase() ||
        t.slug.toLowerCase() === rawName.toLowerCase()
    );

    if (matchingExisting) {
      if (interestedSlugs.includes(matchingExisting.slug)) {
        triggerShareToast(`"${matchingExisting.displayName}" is already in your selected topics`);
        return;
      }
      setTopicState(matchingExisting.slug, 'interested');
      setCustomTopicName('');
      setSearchQuery('');
      triggerShareToast(`Added "${matchingExisting.displayName}" to your topics`);
      return;
    }

    try {
      setIsAddingCustom(true);
      const res = await addCustomTopicMutation({ 
        topicName: rawName,
        userId: currentUser?.id,
      });
      if (res.slug) {
        setTopicState(res.slug, 'interested');
        setCustomTopicName('');
        setSearchQuery('');
        triggerShareToast(`Added custom topic "${res.displayName}"`);
      }
    } catch (err: any) {
      triggerShareToast(err.message || 'Failed to add custom topic');
    } finally {
      setIsAddingCustom(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveBulkMutation({
        interestedSlugs,
        reducedSlugs,
        excludedSlugs,
      });
      triggerShareToast('Topic preferences saved successfully!');
      onClose();
    } catch (err: any) {
      triggerShareToast(err.message || 'Failed to save topics');
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
      triggerShareToast('Topic preferences reset to platform default.');
    } catch (err: any) {
      triggerShareToast(err.message || 'Failed to reset preferences');
    } finally {
      setIsResetting(false);
    }
  };

  if (!isOpen) return null;

  const hasSearchTerm = searchQuery.trim().length > 0;
  const exactSearchMatch = topics?.some(
    (t: any) =>
      t.displayName.toLowerCase() === searchQuery.trim().toLowerCase() ||
      t.slug.toLowerCase() === searchQuery.trim().toLowerCase()
  );

  return (
    <div
      id="manage-topics-drawer-overlay"
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="manage-topics-drawer"
        className="bg-theme-surface w-full sm:max-w-md md:max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 relative z-10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Drawer Header */}
        <div className="sticky top-0 z-20 bg-theme-surface/95 backdrop-blur-md border-b border-theme-divider-light px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              id="btn-close-topics-drawer"
              type="button"
              onClick={onClose}
              className="p-1.5 -ml-1 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
              title="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-theme-primary">Manage Topics</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#5E43F3]/10 text-[#5E43F3]">
                  {interestedSlugs.length} chosen
                </span>
              </div>
              <p className="text-[11px] text-theme-tertiary">
                Keyword & interest personalization inside your For You feed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-save-topics-drawer"
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-4 py-1.5 rounded-full bg-[#5E43F3] text-white text-xs font-bold shadow-md shadow-[#5E43F3]/25 hover:bg-[#4E34E0] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 pb-24">
          {/* Privacy & Safeguard Banner */}
          <div className="p-3.5 rounded-2xl bg-theme-base border border-theme-divider-light text-xs text-theme-secondary space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-theme-primary font-bold">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>Keyword-Based Feed Personalization</span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                disabled={isResetting || (interestedSlugs.length === 0 && reducedSlugs.length === 0 && excludedSlugs.length === 0)}
                className="text-[10px] font-semibold text-theme-tertiary hover:text-rose-500 flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
            <p className="text-[11px] leading-relaxed text-theme-tertiary">
              Selected topics use keywords, hashtags, and creator captions to find matching content for your <strong>For You</strong> feed. Topic preferences remain private and do not alter your profile.
            </p>
          </div>

          {/* Currently Selected Topics Badges */}
          {interestedSlugs.length > 0 && (
            <div className="space-y-1.5 p-3 rounded-2xl bg-[#5E43F3]/5 border border-[#5E43F3]/15">
              <div className="flex items-center justify-between text-xs font-bold text-theme-primary">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#5E43F3]" />
                  <span>Selected Topics ({interestedSlugs.length})</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {interestedSlugs.map((slug) => {
                  const topic = topics?.find((t: any) => t.slug === slug);
                  const label = topic?.displayName || slug.replace(/_/g, ' ');
                  return (
                    <span
                      key={slug}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-neutral-800 border border-[#5E43F3]/30 text-xs font-bold text-theme-primary shadow-2xs"
                    >
                      <span className="text-[11px]">{topic?.icon || '🏷️'}</span>
                      <span className="truncate max-w-[130px]">{label}</span>
                      <button
                        type="button"
                        onClick={() => setTopicState(slug, 'none')}
                        className="text-theme-tertiary hover:text-rose-500 ml-0.5 cursor-pointer"
                        title="Remove topic"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search & Custom Topic Input */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative w-full flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-tertiary" />
                <input
                  id="input-drawer-topic-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search topics (e.g. LGBTQ+, Gaming, AI)..."
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-theme-base border border-theme-divider-light text-theme-primary text-xs focus:outline-none focus:border-[#5E43F3] transition-all"
                />
              </div>

              {categories.length > 0 && (
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2.5 rounded-xl bg-theme-base border border-theme-divider-light text-theme-primary text-xs focus:outline-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Quick Add Custom Topic if search has no exact match */}
            {hasSearchTerm && !exactSearchMatch && (
              <div className="p-3 rounded-xl border border-dashed border-[#5E43F3]/30 bg-[#5E43F3]/5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-theme-primary block truncate">
                    Add "{searchQuery.trim()}" as a custom topic
                  </span>
                  <p className="text-[10px] text-theme-tertiary">
                    Matches posts mentioning this term or keyword in For You
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isAddingCustom}
                  onClick={() => handleAddCustomTopic(searchQuery.trim())}
                  className="px-3 py-1.5 rounded-lg bg-[#5E43F3] hover:bg-[#4E34E0] text-white text-xs font-bold shrink-0 cursor-pointer flex items-center gap-1 transition-all disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Topic</span>
                </button>
              </div>
            )}
          </div>

          {/* Topics List */}
          <div className="space-y-2 pt-1">
            {filteredTopics.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-theme-divider-light bg-theme-base space-y-3">
                <Layers className="w-6 h-6 text-theme-tertiary mx-auto mb-1" />
                <div>
                  <p className="text-xs font-bold text-theme-secondary">No existing topics match "{searchQuery}"</p>
                  <p className="text-[11px] text-theme-tertiary mt-0.5">
                    You can add it as a custom topic above.
                  </p>
                </div>
                {hasSearchTerm && (
                  <button
                    type="button"
                    disabled={isAddingCustom}
                    onClick={() => handleAddCustomTopic(searchQuery.trim())}
                    className="px-3.5 py-1.5 rounded-xl bg-[#5E43F3] text-white text-xs font-bold hover:bg-[#4E34E0] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add "{searchQuery.trim()}"</span>
                  </button>
                )}
              </div>
            ) : (
              filteredTopics.map((topic: any) => {
                const state = getTopicState(topic.slug);
                return (
                  <div
                    key={topic.slug}
                    className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      state === 'interested'
                        ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10'
                        : state === 'reduced'
                        ? 'border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10'
                        : state === 'excluded'
                        ? 'border-rose-500/40 bg-rose-500/5 dark:bg-rose-500/10'
                        : 'border-theme-divider-light bg-theme-surface hover:border-theme-divider'
                    }`}
                  >
                    {/* Topic details */}
                    <div className="min-w-0 flex-1 flex items-start gap-2.5">
                      <span className="text-lg shrink-0 mt-0.5">{topic.icon || '📌'}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-theme-primary">
                            {topic.displayName}
                          </h4>
                          {topic.isSensitive && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wider bg-pink-500/10 text-pink-500 border border-pink-500/20 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> Opt-in
                            </span>
                          )}
                        </div>
                        {topic.description && (
                          <p className="text-[11px] text-theme-tertiary mt-0.5 line-clamp-2 leading-relaxed">
                            {topic.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() =>
                          setTopicState(topic.slug, state === 'interested' ? 'none' : 'interested')
                        }
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          state === 'interested'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-theme-base text-theme-secondary hover:text-emerald-500 border border-theme-divider-light'
                        }`}
                        title="Boost in feed"
                      >
                        <Check className="w-3 h-3" />
                        <span>Interested</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setTopicState(topic.slug, state === 'reduced' ? 'none' : 'reduced')
                        }
                        className={`px-2 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          state === 'reduced'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-theme-base text-theme-secondary hover:text-amber-500 border border-theme-divider-light'
                        }`}
                        title="See less"
                      >
                        <Minus className="w-3 h-3" />
                        <span>Less</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setTopicState(topic.slug, state === 'excluded' ? 'none' : 'excluded')
                        }
                        className={`px-2 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          state === 'excluded'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-theme-base text-theme-secondary hover:text-rose-500 border border-theme-divider-light'
                        }`}
                        title="Exclude"
                      >
                        <Ban className="w-3 h-3" />
                        <span>Hide</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Drawer Sticky Bottom Footer */}
        <div className="sticky bottom-0 bg-theme-surface/95 backdrop-blur-md border-t border-theme-divider-light p-3.5 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-theme-divider text-xs font-bold text-theme-secondary hover:bg-theme-surface-hover transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-[#5E43F3] text-white text-xs font-bold hover:bg-[#4E34E0] active:scale-95 transition-all shadow-md shadow-[#5E43F3]/25 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Apply Topics'}
          </button>
        </div>
      </div>
    </div>
  );
};
