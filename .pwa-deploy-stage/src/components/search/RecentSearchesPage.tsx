import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Clock,
  X,
  Trash2,
  Users,
  Building,
  Sparkles,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';
import { VerificationBadge } from '../common/VerificationBadge';

function formatTimeAgo(timestamp: number): string {
  if (!timestamp) return 'Recently';
  const diff = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

type FilterType = 'all' | 'people' | 'pages' | 'keywords';

export const RecentSearchesPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    setActiveTab,
    setActiveUserProfile,
    setDiscoverSearchQuery,
  } = useLalao();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Fetch recent searches from Convex
  const recentSearches = useQuery(api.search.getRecentSearches, { limit: 50 });
  const removeSearch = useMutation(api.search.removeRecentSearch);
  const clearAllSearches = useMutation(api.search.clearAllRecentSearches);

  const filteredSearches = useMemo(() => {
    if (!recentSearches) return [];
    if (activeFilter === 'all') return recentSearches;
    if (activeFilter === 'people') {
      return recentSearches.filter((item) => item.type === 'person');
    }
    if (activeFilter === 'pages') {
      return recentSearches.filter(
        (item) => item.type === 'page' || item.type === 'shop'
      );
    }
    if (activeFilter === 'keywords') {
      return recentSearches.filter(
        (item) => item.type === 'keyword' || item.type === 'content' || item.type === 'event'
      );
    }
    return recentSearches;
  }, [recentSearches, activeFilter]);

  const handleRevisit = (item: any) => {
    if (item.type === 'person') {
      // Revisit user profile
      const userObj: any = {
        id: item.entityId,
        _id: item.entityId,
        name: item.title || item.query,
        username: (item.subtitle || '').replace(/^@/, ''),
        avatar: item.avatarUrl,
        isVerified: item.isVerified,
        verificationTier: item.verificationTier,
      };
      setActiveUserProfile(userObj);
      return;
    }

    if (item.type === 'page' || item.type === 'shop') {
      // Revisit page or special Plum page
      if (item.entityId === 'plum' || item.query?.toLowerCase() === 'plum') {
        setActiveTab('plum');
      } else if (item.entityId) {
        navigate(`/app/page/${item.entityId}`);
      } else {
        setDiscoverSearchQuery(item.query);
        setActiveTab('discover');
      }
      return;
    }

    // Keyword or content search: restore original query and trigger search in Explore
    setDiscoverSearchQuery(item.query);
    setActiveTab('discover');
  };

  const handleRemoveItem = async (e: React.MouseEvent, id: Id<'recentSearches'>) => {
    e.stopPropagation();
    try {
      await removeSearch({ id });
    } catch (err) {
      console.error('Failed to remove recent search entry:', err);
    }
  };

  const handleConfirmClearAll = async () => {
    setIsClearing(true);
    try {
      await clearAllSearches({});
      setIsClearModalOpen(false);
    } catch (err) {
      console.error('Failed to clear search history:', err);
    } finally {
      setIsClearing(false);
    }
  };

  const counts = useMemo(() => {
    if (!recentSearches) return { all: 0, people: 0, pages: 0, keywords: 0 };
    return {
      all: recentSearches.length,
      people: recentSearches.filter((s) => s.type === 'person').length,
      pages: recentSearches.filter((s) => s.type === 'page' || s.type === 'shop').length,
      keywords: recentSearches.filter(
        (s) => s.type === 'keyword' || s.type === 'content' || s.type === 'event'
      ).length,
    };
  }, [recentSearches]);

  return (
    <div
      id="recent-searches-page-container"
      className="min-h-screen bg-theme-base pb-24 text-theme-primary selection:bg-[#5E43F3]/20"
    >
      {/* ── STICKY TOP HEADER ── */}
      <header className="sticky top-0 z-30 bg-theme-base/95 backdrop-blur-md border-b border-theme-divider/80 px-4 py-3">
        <div className="flex items-center justify-between gap-3 max-w-[600px] mx-auto">
          <div className="flex items-center gap-3">
            <button
              id="btn-recent-searches-back"
              type="button"
              onClick={() => setActiveTab('discover')}
              className="p-2 -ml-2 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover active:scale-95 transition-all cursor-pointer"
              aria-label="Back to explore"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-black tracking-tight text-theme-primary flex items-center gap-2">
                Recent Searches
              </h1>
              <p className="text-[11px] font-medium text-theme-tertiary">
                Your private search history
              </p>
            </div>
          </div>

          {recentSearches && recentSearches.length > 0 && (
            <button
              id="btn-clear-all-recent-searches"
              type="button"
              onClick={() => setIsClearModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/10 active:scale-95 transition-all cursor-pointer border border-red-500/20"
              title="Clear all recent searches"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {/* ── FILTER PILLS ── */}
        {recentSearches && recentSearches.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-3 max-w-[600px] mx-auto">
            {(
              [
                { key: 'all', label: 'All', count: counts.all },
                { key: 'people', label: 'People', count: counts.people },
                { key: 'pages', label: 'Pages', count: counts.pages },
                { key: 'keywords', label: 'Keywords', count: counts.keywords },
              ] as const
            ).map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === filter.key
                    ? 'bg-theme-inverse text-theme-text-inverse shadow-xs'
                    : 'bg-theme-surface text-theme-secondary border border-theme-divider hover:bg-theme-surface-hover hover:text-theme-primary'
                }`}
              >
                <span>{filter.label}</span>
                {filter.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeFilter === filter.key
                        ? 'bg-white/20 text-white'
                        : 'bg-theme-divider-strong/30 text-theme-tertiary'
                    }`}
                  >
                    {filter.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-[600px] mx-auto px-4 pt-3">
        {recentSearches === undefined ? (
          // Loading spinner
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <div className="w-7 h-7 border-2 border-[#5E43F3] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-theme-tertiary font-medium">Loading search history...</p>
          </div>
        ) : recentSearches.length === 0 ? (
          // Empty State
          <div
            id="recent-searches-empty-state"
            className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in duration-300"
          >
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#5E43F3]/20 via-[#818CF8]/10 to-transparent flex items-center justify-center border border-[#5E43F3]/20 shadow-sm">
                <Clock className="w-9 h-9 text-[#5E43F3] stroke-[1.8]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#5E43F3] text-white flex items-center justify-center shadow-md">
                <Search className="w-3.5 h-3.5" />
              </div>
            </div>

            <h2 className="text-base font-black text-theme-primary mb-1.5 tracking-tight">
              No recent searches
            </h2>
            <p className="text-xs text-theme-secondary max-w-[280px] leading-relaxed mb-6">
              When you search for friends, creators, pages, or topics on Lalao, they will appear here so you can revisit them anytime.
            </p>

            <button
              id="btn-empty-start-exploring"
              type="button"
              onClick={() => setActiveTab('discover')}
              className="px-6 py-2.5 rounded-full bg-[#5E43F3] hover:bg-[#4E34E0] active:scale-95 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Explore Lalao</span>
            </button>
          </div>
        ) : filteredSearches.length === 0 ? (
          // Filtered empty state
          <div className="py-16 text-center space-y-2">
            <p className="text-sm font-bold text-theme-primary">
              No {activeFilter} searches found
            </p>
            <p className="text-xs text-theme-tertiary">
              Try switching tabs or searching for new items in Explore.
            </p>
          </div>
        ) : (
          // Search List
          <div
            id="recent-searches-list"
            className="divide-y divide-theme-divider/60 border-t border-theme-divider/40 mt-1"
          >
            {filteredSearches.map((item) => {
              const isPerson = item.type === 'person';
              const isPage = item.type === 'page' || item.type === 'shop';
              const isPlum = item.entityId === 'plum' || item.query?.toLowerCase() === 'plum';

              return (
                <div
                  key={item._id}
                  id={`recent-search-item-${item._id}`}
                  onClick={() => handleRevisit(item)}
                  className="group py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-theme-surface/60 rounded-xl px-2 transition-colors -mx-2"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Item Icon / Avatar */}
                    <div className="shrink-0 relative">
                      {isPerson ? (
                        <div className="relative">
                          <Avatar
                            src={item.avatarUrl}
                            alt={item.title || item.query}
                            size="md"
                          />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-theme-surface border border-theme-divider flex items-center justify-center">
                            <Users className="w-2.5 h-2.5 text-[#5E43F3]" />
                          </div>
                        </div>
                      ) : isPlum ? (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7B1FA2] via-[#C2185B] to-[#FF4081] flex items-center justify-center text-white shadow-xs">
                          <Flame className="w-5 h-5 stroke-[2.2]" />
                        </div>
                      ) : isPage ? (
                        <div className="relative">
                          <Avatar
                            src={item.avatarUrl}
                            alt={item.title || item.query}
                            size="md"
                          />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-theme-surface border border-theme-divider flex items-center justify-center">
                            <Building className="w-2.5 h-2.5 text-[#5E43F3]" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-theme-surface flex items-center justify-center border border-theme-divider text-theme-secondary group-hover:border-[#5E43F3]/40 group-hover:text-[#5E43F3] transition-colors">
                          <Clock className="w-4 h-4 stroke-[2]" />
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-theme-primary truncate">
                          {item.title || item.query}
                        </span>
                        {isPerson && (
                          <VerificationBadge
                            user={{
                              isVerified: item.isVerified,
                              verificationTier: item.verificationTier,
                            }}
                            size="xs"
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-theme-tertiary mt-0.5">
                        {item.subtitle ? (
                          <span className="truncate max-w-[200px]">{item.subtitle}</span>
                        ) : (
                          <span className="capitalize">{item.type} search</span>
                        )}
                        <span className="text-[10px] text-theme-tertiary/60">•</span>
                        <span className="text-[11px] shrink-0 text-theme-tertiary/80">
                          {formatTimeAgo(item.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Individual Remove Button */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      id={`btn-remove-search-${item._id}`}
                      type="button"
                      onClick={(e) => handleRemoveItem(e, item._id)}
                      className="p-1.5 rounded-full text-theme-tertiary hover:text-red-500 hover:bg-red-500/10 active:scale-90 transition-all cursor-pointer"
                      title="Remove from history"
                      aria-label="Remove item"
                    >
                      <X className="w-4 h-4 stroke-[2.2]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── CONFIRMATION MODAL FOR CLEAR ALL ── */}
      {isClearModalOpen && (
        <div
          id="clear-all-searches-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => !isClearing && setIsClearModalOpen(false)}
        >
          <div
            id="clear-all-searches-modal"
            className="w-full max-w-sm rounded-3xl bg-theme-surface border border-theme-divider p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
              <AlertTriangle className="w-6 h-6 stroke-[2]" />
            </div>

            <div>
              <h3 className="text-base font-black text-theme-primary">
                Clear search history?
              </h3>
              <p className="text-xs text-theme-secondary mt-1.5 leading-relaxed">
                This will remove all your recent searches for people, pages, and keywords across Lalao. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                id="btn-cancel-clear-history"
                type="button"
                disabled={isClearing}
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-bold text-theme-secondary hover:bg-theme-surface-hover transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-clear-history"
                type="button"
                disabled={isClearing}
                onClick={handleConfirmClearAll}
                className="px-5 py-2 rounded-full text-xs font-bold bg-red-600 hover:bg-red-700 active:scale-95 text-white shadow-sm transition-all cursor-pointer flex items-center gap-2"
              >
                {isClearing && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Clear All</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
