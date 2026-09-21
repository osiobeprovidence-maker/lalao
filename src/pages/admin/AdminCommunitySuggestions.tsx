import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Lightbulb,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  MapPin,
  Globe,
  Loader2,
} from 'lucide-react';

type StatusFilter = 'all' | 'pending' | 'under_review' | 'approved' | 'rejected';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  under_review: 'bg-blue-50 text-blue-700 border-blue-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const AdminCommunitySuggestions: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const suggestions = useQuery(api.community.listSuggestions, {
    statusFilter: statusFilter === 'all' ? undefined : statusFilter,
  }) ?? [];

  const reviewSuggestion = useMutation(api.community.reviewSuggestion);

  const handleReview = async (
    suggestionId: string,
    newStatus: 'under_review' | 'approved' | 'rejected'
  ) => {
    setActionLoading(`${suggestionId}-${newStatus}`);
    try {
      await reviewSuggestion({
        suggestionId: suggestionId as any,
        newStatus,
        adminNotes: adminNotes[suggestionId] || undefined,
      });
    } catch (e: any) {
      console.error('Failed to review suggestion:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const filterTabs: { id: StatusFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: suggestions.length },
    { id: 'pending', label: 'Pending', count: suggestions.filter((s: any) => s.status === 'pending').length },
    { id: 'under_review', label: 'Under Review', count: suggestions.filter((s: any) => s.status === 'under_review').length },
    { id: 'approved', label: 'Approved', count: suggestions.filter((s: any) => s.status === 'approved').length },
    { id: 'rejected', label: 'Rejected', count: suggestions.filter((s: any) => s.status === 'rejected').length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Community Suggestions</h2>
            <p className="text-sm text-neutral-500">
              Review community suggestions from users
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* List */}
      {suggestions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
          <Lightbulb className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-neutral-700">No suggestions found</p>
          <p className="text-xs text-neutral-500 mt-1">
            {statusFilter === 'all'
              ? 'No community suggestions have been submitted yet.'
              : `No suggestions with "${statusLabels[statusFilter]}" status.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s: any) => {
            const isExpanded = expandedId === s._id;

            return (
              <div
                key={s._id}
                className="bg-white rounded-2xl border border-neutral-200 overflow-hidden transition-shadow hover:shadow-sm"
              >
                {/* Summary Row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : s._id)}
                  className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-neutral-900 truncate">
                          {s.communityName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${statusColors[s.status]}`}
                        >
                          {statusLabels[s.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500">
                        <span>
                          by {s.suggester ? `@${s.suggester.username}` : 'Unknown'}
                        </span>
                        <span>·</span>
                        <span>{formatDate(s.createdAt)}</span>
                        {s.category && (
                          <>
                            <span>·</span>
                            <span>{s.category}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-neutral-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />
                  )}
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-neutral-100 pt-4 space-y-4">
                    {/* Description */}
                    <div>
                      <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
                        Description
                      </h4>
                      <p className="text-sm text-neutral-700 leading-relaxed">
                        {s.description}
                      </p>
                    </div>

                    {/* Meta fields */}
                    <div className="grid grid-cols-2 gap-3">
                      {s.location && (
                        <div className="flex items-center gap-2 text-xs text-neutral-600">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                          {s.location}
                        </div>
                      )}
                      {s.website && (
                        <div className="flex items-center gap-2 text-xs text-neutral-600">
                          <Globe className="w-3.5 h-3.5 text-neutral-400" />
                          <a
                            href={s.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline truncate"
                          >
                            {s.website}
                          </a>
                        </div>
                      )}
                      {s.category && (
                        <div className="text-xs text-neutral-600">
                          <span className="text-neutral-400">Category:</span> {s.category}
                        </div>
                      )}
                    </div>

                    {s.reason && (
                      <div>
                        <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
                          Reason
                        </h4>
                        <p className="text-sm text-neutral-700">{s.reason}</p>
                      </div>
                    )}

                    {s.additionalInfo && (
                      <div>
                        <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
                          Additional Info
                        </h4>
                        <p className="text-sm text-neutral-700">{s.additionalInfo}</p>
                      </div>
                    )}

                    {/* Suggester */}
                    {s.suggester && (
                      <div className="flex items-center gap-2 p-2.5 bg-neutral-50 rounded-xl">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                          {s.suggester.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-neutral-900">
                            {s.suggester.name}
                          </span>
                          <span className="text-[11px] text-neutral-400 ml-1.5">
                            @{s.suggester.username}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Review info */}
                    {s.reviewedAt && (
                      <div className="text-xs text-neutral-400">
                        <Clock className="w-3 h-3 inline mr-1" />
                        Reviewed {formatDate(s.reviewedAt)}
                      </div>
                    )}

                    {/* Admin Notes */}
                    <div>
                      <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        Admin Notes
                      </h4>
                      <textarea
                        value={adminNotes[s._id] ?? s.adminNotes ?? ''}
                        onChange={(e) =>
                          setAdminNotes((prev) => ({
                            ...prev,
                            [s._id]: e.target.value,
                          }))
                        }
                        placeholder="Add internal notes about this suggestion..."
                        rows={2}
                        className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 resize-none"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2">
                      {s.status !== 'approved' && (
                        <button
                          onClick={() => handleReview(s._id, 'approved')}
                          disabled={actionLoading === `${s._id}-approved`}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {actionLoading === `${s._id}-approved` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Approve
                        </button>
                      )}
                      {s.status !== 'rejected' && (
                        <button
                          onClick={() => handleReview(s._id, 'rejected')}
                          disabled={actionLoading === `${s._id}-rejected`}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {actionLoading === `${s._id}-rejected` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          Reject
                        </button>
                      )}
                      {s.status !== 'under_review' && (
                        <button
                          onClick={() => handleReview(s._id, 'under_review')}
                          disabled={actionLoading === `${s._id}-under_review`}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {actionLoading === `${s._id}-under_review` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                          Mark Under Review
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
