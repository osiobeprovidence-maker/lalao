import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Users,
  Building2,
  AlertTriangle,
  Lightbulb,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StatCard: React.FC<{
  label: string;
  value: string | number | null | undefined;
  icon: React.ElementType;
  color: string;
}> = ({ label, value, icon: Icon, color }) => (
  <div className={`rounded-2xl border bg-white p-5 flex flex-col gap-3 shadow-sm ${color.replace('border-', 'border-')}`}>
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">{label}</span>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color.includes('indigo') ? 'bg-indigo-50 text-indigo-600' : color.includes('emerald') ? 'bg-emerald-50 text-emerald-600' : color.includes('amber') ? 'bg-amber-50 text-amber-600' : color.includes('rose') ? 'bg-rose-50 text-rose-600' : color.includes('purple') ? 'bg-purple-50 text-purple-600' : color.includes('teal') ? 'bg-teal-50 text-teal-600' : 'bg-blue-50 text-blue-600'}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <div className="text-3xl font-black text-neutral-900">
      {value === null || value === undefined ? (
        <span className="text-neutral-400 text-base font-semibold">Not available</span>
      ) : (
        value.toLocaleString()
      )}
    </div>
  </div>
);

export const AdminCommunities: React.FC = () => {
  const navigate = useNavigate();
  const stats = useQuery(api.admin.getCommunityDashboardStats);
  const communities = useQuery(api.admin.listCommunities) || [];
  
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredCommunities = communities.filter((c: any) => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.handle && c.handle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
            Communities
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Manage communities, monitor growth, and review community activity across Lalao.
          </p>
        </div>
        
        <button
          onClick={() => navigate('/admin/community-suggestions')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors self-start cursor-pointer"
        >
          <Lightbulb className="w-4 h-4" />
          Review Suggestions
          {stats && stats.pendingSuggestions > 0 && (
            <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
              {stats.pendingSuggestions}
            </span>
          )}
        </button>
      </div>

      {/* Metrics */}
      {stats === undefined ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-5 h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Communities"
            value={stats.totalCommunities}
            icon={Building2}
            color="border-purple-200"
          />
          <StatCard
            label="Active Communities"
            value={stats.activeCommunities}
            icon={CheckCircle2}
            color="border-emerald-200"
          />
          <StatCard
            label="Total Members"
            value={stats.totalMembers}
            icon={Users}
            color="border-blue-200"
          />
          <StatCard
            label="Pending Suggestions"
            value={stats.pendingSuggestions}
            icon={Lightbulb}
            color="border-amber-200"
          />
        </div>
      )}

      {/* List Section */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900">Directory</h2>
          
          <div className="relative w-64">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {communities.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-neutral-700">No communities found</p>
            <p className="text-xs text-neutral-500 mt-1">
              There are no approved communities yet.
            </p>
          </div>
        ) : filteredCommunities.length === 0 ? (
          <div className="p-12 text-center text-sm text-neutral-500">
            No communities matching your search.
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filteredCommunities.map((community: any) => {
              const isExpanded = expandedId === community._id;
              
              return (
                <div key={community._id} className="transition-colors hover:bg-neutral-50">
                  {/* Summary Row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : community._id)}
                    className="w-full flex items-center justify-between p-4 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-neutral-100 flex-shrink-0 overflow-hidden">
                        {community.avatarUrl ? (
                          <img src={community.avatarUrl} alt={community.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400 font-bold text-sm">
                            {community.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-neutral-900 truncate">
                            {community.name}
                          </span>
                          {community.status === 'suspended' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                              Suspended
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500">
                          {community.handle && <span>@{community.handle}</span>}
                          {community.handle && <span>·</span>}
                          <span className="font-medium text-neutral-700">{community.memberCount} members</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 ml-4">
                      <div className="hidden sm:block text-xs text-neutral-400 text-right">
                        <div>Created</div>
                        <div>{formatDate(community._creationTime)}</div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-neutral-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-neutral-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="px-4 pb-5 pt-2 border-t border-neutral-100 bg-neutral-50/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
                              Description
                            </h4>
                            <p className="text-sm text-neutral-700 leading-relaxed">
                              {community.bio || 'No description provided.'}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div>
                              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
                                Category
                              </h4>
                              <p className="text-sm text-neutral-900 capitalize">
                                {community.category || 'Uncategorized'}
                              </p>
                            </div>
                            
                            <div>
                              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
                                Visibility
                              </h4>
                              <p className="text-sm text-neutral-900 capitalize">
                                {community.visibility || 'Public'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {community.creator && (
                            <div>
                              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                                Creator / Owner
                              </h4>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-neutral-200 overflow-hidden">
                                  {community.creator.avatarUrl ? (
                                    <img src={community.creator.avatarUrl} alt={community.creator.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs font-bold">
                                      {community.creator.name?.charAt(0) || '?'}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-neutral-900">{community.creator.name}</div>
                                  <div className="text-xs text-neutral-500">@{community.creator.username}</div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="pt-4 mt-4 border-t border-neutral-200/60">
                            <button
                              onClick={() => navigate(`/app/page/${community._id}`)}
                              className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
                            >
                              View Community Profile
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
