import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import { Users, Search, Plus, MessageCircle } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';

type DirectoryTab = 'joined' | 'discover';
type FilterType = 'all' | 'groups' | 'pages';

export const CommunityDirectory: React.FC = () => {
  const { setActivePageId, setActiveGroupId, currentUser } = useLalao();
  const [activeTab, setActiveTab] = useState<DirectoryTab>('joined');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pages & Stands
  const joinedCommunities = useQuery(api.pages.getMyFollowedCommunities) ?? [];
  const discoverCommunities = useQuery(api.pages.listDiscoverablePages) ?? [];

  // Unified Groups
  const myGroups = useQuery(api.groups.getMyGroups) ?? [];
  const discoverGroups = useQuery(api.groups.listDiscoverableGroups, { search: searchQuery || undefined }) ?? [];

  // Filter discoverable pages that aren't already joined
  const discoverableOnlyPages = discoverCommunities
    .filter(
      (page: any) =>
        page.type === 'community' &&
        !joinedCommunities.some((joined: any) => joined.id === page.id)
    )
    .map((p: any) => ({ ...p, isGroup: false }));

  const normalizedJoinedPages = joinedCommunities.map((p: any) => ({
    ...p,
    isGroup: false,
    memberCount: p.followersCount || 0,
  }));

  const normalizedJoinedGroups = myGroups.map((g: any) => ({
    id: g.id,
    name: g.name,
    username: g.username,
    description: g.description,
    avatar: g.avatarUrl,
    memberCount: g.memberCount || 1,
    category: g.category,
    visibility: g.visibility,
    isGroup: true,
  }));

  const normalizedDiscoverGroups = discoverGroups
    .filter((g: any) => !g.isMember)
    .map((g: any) => ({
      id: g.id,
      name: g.name,
      username: g.username,
      description: g.description,
      avatar: g.avatarUrl,
      memberCount: g.memberCount || 1,
      category: g.category,
      visibility: g.visibility,
      isGroup: true,
    }));

  const combinedJoined = [...normalizedJoinedGroups, ...normalizedJoinedPages];
  const combinedDiscover = [...normalizedDiscoverGroups, ...discoverableOnlyPages];

  const currentList = activeTab === 'joined' ? combinedJoined : combinedDiscover;

  const filteredList = currentList.filter((item: any) => {
    if (filterType === 'groups' && !item.isGroup) return false;
    if (filterType === 'pages' && item.isGroup) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q)
    );
  });

  const handleSelect = (item: any) => {
    if (item.isGroup) {
      setActiveGroupId(item.id);
    } else {
      setActivePageId(item.id);
    }
  };

  return (
    <div className="w-full bg-theme-base min-h-[calc(100vh-120px)] animate-in fade-in duration-300">
      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center pb-2">
          <h2 className="text-lg font-black text-theme-primary font-sans">Community & Groups Hub</h2>
          <p className="text-[11px] text-theme-tertiary mt-1 max-w-xs mx-auto">
            Discover, join, and engage with local groups and communities that matter to you.
          </p>
        </div>

        {/* Directory Tabs */}
        <div className="flex bg-theme-surface-hover p-1 rounded-full border border-theme-divider">
          <button
            onClick={() => setActiveTab('joined')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
              activeTab === 'joined'
                ? 'bg-theme-surface text-theme-primary shadow-xs'
                : 'text-theme-tertiary hover:text-theme-secondary'
            }`}
          >
            Joined ({combinedJoined.length})
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
              activeTab === 'discover'
                ? 'bg-theme-surface text-theme-primary shadow-xs'
                : 'text-theme-tertiary hover:text-theme-secondary'
            }`}
          >
            Discover
          </button>
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition ${
              filterType === 'all'
                ? 'bg-[#5E43F3] text-white'
                : 'bg-theme-surface text-theme-secondary border border-theme-divider hover:bg-theme-surface-hover'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('groups')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition ${
              filterType === 'groups'
                ? 'bg-[#5E43F3] text-white'
                : 'bg-theme-surface text-theme-secondary border border-theme-divider hover:bg-theme-surface-hover'
            }`}
          >
            Groups
          </button>
          <button
            onClick={() => setFilterType('pages')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition ${
              filterType === 'pages'
                ? 'bg-[#5E43F3] text-white'
                : 'bg-theme-surface text-theme-secondary border border-theme-divider hover:bg-theme-surface-hover'
            }`}
          >
            Communities / Stands
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-theme-tertiary" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-2 border border-theme-divider rounded-2xl leading-5 bg-theme-surface placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#5E43F3] focus:border-[#5E43F3] sm:text-sm text-xs transition-colors text-theme-primary"
            placeholder={`Search ${activeTab} groups & communities...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* List */}
        <div className="space-y-3 pt-2">
          {filteredList.length === 0 ? (
            <div className="text-center py-10 px-4 bg-theme-surface rounded-3xl border border-theme-divider-light shadow-xs shadow-neutral-200/50">
              <Users className="w-10 h-10 text-theme-tertiary mx-auto mb-3" />
              <p className="text-sm font-bold text-theme-secondary">
                {activeTab === 'joined'
                  ? searchQuery
                    ? 'No joined items match your search.'
                    : "You haven't joined any groups or communities yet."
                  : searchQuery
                  ? 'No discoverable items match your search.'
                  : 'No new groups or communities to discover right now.'}
              </p>
              {activeTab === 'joined' && !searchQuery && (
                <button
                  onClick={() => setActiveTab('discover')}
                  className="mt-4 px-4 py-2 bg-[#5E43F3] text-white text-xs font-bold rounded-full hover:bg-[#4E34E0] transition-colors cursor-pointer"
                >
                  Explore Directory
                </button>
              )}
            </div>
          ) : (
            filteredList.map((item: any) => (
              <div
                key={`${item.isGroup ? 'grp' : 'page'}-${item.id}`}
                onClick={() => handleSelect(item)}
                className="flex items-center gap-3 p-3 bg-theme-surface rounded-2xl border border-theme-divider-light shadow-xs shadow-neutral-200/50 hover:border-[#5E43F3]/30 transition-all cursor-pointer group"
              >
                <Avatar
                  src={item.avatar}
                  alt={item.name}
                  size="lg"
                  className="w-14 h-14 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm font-bold text-theme-primary truncate group-hover:text-[#5E43F3] transition-colors">
                      {item.name}
                    </h3>
                    {item.isGroup ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#5E43F3]/10 text-[#5E43F3]">
                        GROUP
                      </span>
                    ) : (
                      <Badge type="COMMUNITY" />
                    )}
                    {item.category && (
                      <span className="text-[10px] text-theme-tertiary">
                        • {item.category}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-theme-tertiary truncate mt-0.5">
                    {item.description || 'No description available'}
                  </p>
                  <p className="text-[10px] text-theme-tertiary mt-1 font-medium">
                    {(item.memberCount || 1).toLocaleString()} {item.isGroup ? 'members' : 'followers'}
                  </p>
                </div>
                {activeTab === 'discover' && (
                  <button
                    className="p-2 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] hover:bg-[#5E43F3]/20 transition-colors shrink-0"
                    title={item.isGroup ? 'View Group' : 'View Community'}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
