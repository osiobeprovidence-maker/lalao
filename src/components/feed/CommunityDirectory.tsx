import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import { Users, Search, Plus } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';

type DirectoryTab = 'joined' | 'discover';

export const CommunityDirectory: React.FC = () => {
  const { setActivePageId, currentUser } = useLalao();
  const [activeTab, setActiveTab] = useState<DirectoryTab>('joined');
  const [searchQuery, setSearchQuery] = useState('');

  const joinedCommunities = useQuery(api.pages.getMyFollowedCommunities) ?? [];
  const discoverCommunities = useQuery(api.pages.listDiscoverablePages) ?? [];

  const discoverableOnly = discoverCommunities.filter(
    (page: any) =>
      page.type === 'community' &&
      !joinedCommunities.some((joined: any) => joined.id === page.id)
  );

  const displayList = activeTab === 'joined' ? joinedCommunities : discoverableOnly;
  
  const filteredList = displayList.filter((page: any) => 
    page.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    page.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full bg-[#f6f3ee] min-h-[calc(100vh-120px)] animate-in fade-in duration-300">
      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Header & Description */}
        <div className="text-center pb-2">
          <h2 className="text-lg font-black text-neutral-900 font-sans">Community Hub</h2>
          <p className="text-[11px] text-neutral-500 mt-1 max-w-xs mx-auto">
            Discover, join, and engage with the ecosystems that matter to you.
          </p>
        </div>

        {/* Directory Tabs */}
        <div className="flex bg-neutral-100 p-1 rounded-full border border-neutral-200">
          <button
            onClick={() => setActiveTab('joined')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
              activeTab === 'joined'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Joined
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
              activeTab === 'discover'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Discover
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-neutral-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-2xl leading-5 bg-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#5E43F3] focus:border-[#5E43F3] sm:text-sm text-xs transition-colors"
            placeholder={`Search ${activeTab} communities...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Community List */}
        <div className="space-y-3 pt-2">
          {filteredList.length === 0 ? (
            <div className="text-center py-10 px-4 bg-white rounded-3xl border border-neutral-100 shadow-xs shadow-neutral-200/50">
              <Users className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-neutral-700">
                {activeTab === 'joined' 
                  ? searchQuery ? "No joined communities match your search." : "You haven't joined any communities yet." 
                  : searchQuery ? "No discoverable communities match your search." : "No new communities to discover right now."}
              </p>
              {activeTab === 'joined' && !searchQuery && (
                <button
                  onClick={() => setActiveTab('discover')}
                  className="mt-4 px-4 py-2 bg-[#5E43F3] text-white text-xs font-bold rounded-full hover:bg-[#4E34E0] transition-colors cursor-pointer"
                >
                  Explore Communities
                </button>
              )}
            </div>
          ) : (
            filteredList.map((page: any) => (
              <div
                key={page.id}
                onClick={() => setActivePageId(page.id)}
                className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-neutral-100 shadow-xs shadow-neutral-200/50 hover:border-[#5E43F3]/30 transition-all cursor-pointer group"
              >
                <Avatar
                  src={page.avatar}
                  alt={page.name}
                  size="lg"
                  className="w-14 h-14"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-neutral-900 truncate group-hover:text-[#5E43F3] transition-colors">
                      {page.name}
                    </h3>
                    <Badge type="COMMUNITY" />
                  </div>
                  <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                    {page.description || 'No description available'}
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-1 font-medium">
                    {page.followersCount.toLocaleString()} members
                  </p>
                </div>
                {activeTab === 'discover' && (
                  <button
                    className="p-2 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] hover:bg-[#5E43F3]/20 transition-colors"
                    title="View Community"
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
