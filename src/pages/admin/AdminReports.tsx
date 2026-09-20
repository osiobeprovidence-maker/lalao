import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { ShieldAlert, AlertTriangle, CheckCircle2, XCircle, Search, ChevronRight, X, Trash2, Loader2 } from 'lucide-react';

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  normal: 'bg-blue-50 text-blue-700 border-blue-200',
  high: 'bg-amber-50 text-amber-700 border-amber-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  under_review: 'bg-amber-50 text-amber-700 border-amber-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  dismissed: 'bg-slate-100 text-slate-500 border-slate-200',
  escalated: 'bg-red-50 text-red-700 border-red-200',
};

export const AdminReports: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedReportId, setSelectedReportId] = useState<any>(null);
  const [selectedReasonId, setSelectedReasonId] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState('');

  const moderationReasons = useQuery(api.moderation.listReasons);
  const seedReasons = useMutation(api.moderation.seedReasons);
  const [isSeeding, setIsSeeding] = useState(false);

  React.useEffect(() => {
    if (moderationReasons !== undefined && moderationReasons.length === 0 && !isSeeding) {
      setIsSeeding(true);
      seedReasons().finally(() => setIsSeeding(false));
    }
  }, [moderationReasons, seedReasons, isSeeding]);

  const reports = useQuery(api.reports.listReports, {
    status: statusFilter !== 'all' ? statusFilter : undefined,
    limit: 100,
  });

  const selectedReportDetails = useQuery(api.reports.getReportDetails, 
    selectedReportId ? { reportId: selectedReportId } : "skip"
  );

  const updateReportStatus = useMutation(api.reports.updateReportStatus);

  const removePost = useMutation(api.admin.removePost);

  const handleRemovePost = async (postId: string) => {
    if (!selectedReasonId || !selectedSeverity) {
      alert("Please select a removal reason and violation level.");
      return;
    }
    if (!confirm('Are you sure you want to remove this post?')) return;

    try {
      await removePost({ 
        postId: postId as any, 
        moderationReasonId: selectedReasonId as any,
        violationLevel: selectedSeverity,
        note: adminNotes,
        reportId: selectedReportId 
      });
      setSelectedReportId(null);
      setSelectedReasonId('');
      setSelectedSeverity('');
      setAdminNotes('');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDismissReport = async () => {
    try {
      await updateReportStatus({ 
        reportId: selectedReportId,
        status: "dismissed",
        resolution: "Report dismissed by admin",
        resolutionNote: adminNotes
      });
      setSelectedReportId(null);
      setAdminNotes('');
      setSelectedReasonId('');
      setSelectedSeverity('');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleMarkUnderReview = async () => {
    try {
      await updateReportStatus({ 
        reportId: selectedReportId,
        status: "under_review",
        resolutionNote: adminNotes
      });
      setSelectedReportId(null);
      setAdminNotes('');
      setSelectedReasonId('');
      setSelectedSeverity('');
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-neutral-900">Reports</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage user reports and moderate content</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 rounded-xl bg-white border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:border-[#5200FF] cursor-pointer shadow-sm"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {reports === undefined ? (
          <div className="text-center py-8 text-neutral-500 bg-white rounded-2xl border border-neutral-200 shadow-sm text-sm">
            Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 bg-white rounded-2xl border border-neutral-200 shadow-sm text-sm">
            No reports found for this filter.
          </div>
        ) : (
          reports.map((report) => (
            <div 
              key={report._id} 
              onClick={() => setSelectedReportId(report._id)} 
              className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm active:bg-neutral-50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">{report.targetType}</span>
                    <span className="text-neutral-300">•</span>
                    <span className="text-neutral-500 text-xs font-mono">{report.targetId.substring(0, 8)}...</span>
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 line-clamp-1">{report.reason}</h3>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400 shrink-0 mt-1" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[report.status]}`}>
                  {report.status.replace('_', ' ')}
                </span>
                <span className={`inline-flex px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${PRIORITY_COLORS[report.priority]}`}>
                  {report.priority}
                </span>
                <span className="text-neutral-400 text-[11px] ml-auto font-medium">
                  {new Date(report.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/50">
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Target</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Type</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Reason</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {reports === undefined ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-neutral-500">
                    Loading reports...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-neutral-500">
                    No reports found for this filter.
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report._id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {report.targetId.substring(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-neutral-600 capitalize">
                      {report.targetType}
                    </td>
                    <td className="px-4 py-3 text-neutral-900 max-w-[200px] truncate">
                      {report.reason}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded border text-[11px] font-bold uppercase tracking-wider ${PRIORITY_COLORS[report.priority]}`}>
                        {report.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded border text-[11px] font-bold uppercase tracking-wider ${STATUS_COLORS[report.status]}`}>
                        {report.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500 text-xs">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedReportId(report._id)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {selectedReportId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-neutral-900/20 backdrop-blur-sm" onClick={() => setSelectedReportId(null)} />
          <div className="relative w-full sm:w-[400px] bg-white border-l border-neutral-200 h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-neutral-50/50">
              <h2 className="text-lg font-bold text-neutral-900">Report Details</h2>
              <button
                onClick={() => setSelectedReportId(null)}
                className="p-2 rounded-xl hover:bg-neutral-200 text-neutral-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 space-y-6">
              {selectedReportDetails === undefined ? (
                <div className="text-neutral-500 text-center py-8">Loading details...</div>
              ) : selectedReportDetails === null ? (
                <div className="text-neutral-500 text-center py-8">Report not found.</div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Reporter</label>
                      <p className="text-neutral-900 font-medium">@{selectedReportDetails.reporterUsername || 'Unknown'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Reason</label>
                      <p className="text-neutral-900">{selectedReportDetails.reason}</p>
                      {selectedReportDetails.description && (
                        <p className="text-neutral-600 mt-1 text-sm bg-neutral-50 p-3 rounded-xl border border-neutral-100">{selectedReportDetails.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-neutral-200 pt-6">
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 block">Reported Target</label>
                    {selectedReportDetails.targetType === 'post' && selectedReportDetails.targetData ? (
                      <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-neutral-200 overflow-hidden">
                            {selectedReportDetails.targetData.authorAvatar && (
                              <img src={selectedReportDetails.targetData.authorAvatar} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-neutral-900 text-sm">{selectedReportDetails.targetData.authorName}</p>
                            <p className="text-neutral-500 text-xs">@{selectedReportDetails.targetData.authorUsername}</p>
                          </div>
                        </div>
                        <p className="text-neutral-900 text-sm whitespace-pre-wrap">{selectedReportDetails.targetData.text}</p>
                        {selectedReportDetails.targetData.mediaUrl && (
                          <div className="mt-3 aspect-video rounded-xl bg-neutral-200 overflow-hidden">
                            <img src={selectedReportDetails.targetData.mediaUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        
                        {selectedReportDetails.targetData.moderationStatus === "removed" && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                            <div>
                              <p className="text-sm font-bold text-red-900">Post Removed</p>
                              <p className="text-xs text-red-700">{selectedReportDetails.targetData.removalReason}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 text-neutral-600 text-sm">
                        Target data not available or not a post.
                      </div>
                    )}
                  </div>

                  {selectedReportDetails.status !== 'resolved' && selectedReportDetails.status !== 'dismissed' && selectedReportDetails.targetType === 'post' && selectedReportDetails.targetData?.moderationStatus !== "removed" && (
                    <div className="border-t border-neutral-200 pt-6 space-y-4">
                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">Moderation Action</label>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Removal Reason</label>
                          <select
                            value={selectedReasonId}
                            onChange={(e) => {
                              setSelectedReasonId(e.target.value);
                              const selected = moderationReasons?.find((r: any) => r._id === e.target.value);
                              if (selected && !selectedSeverity) setSelectedSeverity(selected.defaultSeverity);
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:border-[#5200FF] cursor-pointer"
                          >
                            <option value="">Select a reason...</option>
                            {moderationReasons?.map((reason: any) => (
                              <option key={reason._id} value={reason._id}>{reason.title}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Violation Level</label>
                          <div className="flex bg-neutral-100 rounded-xl p-1 gap-1">
                            {['low', 'medium', 'high', 'critical'].map((level) => (
                              <button
                                key={level}
                                onClick={() => setSelectedSeverity(level)}
                                className={`flex-1 py-1.5 text-xs font-bold capitalize rounded-lg transition-colors ${
                                  selectedSeverity === level ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/50'
                                }`}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                        </div>

                        {selectedReasonId && (
                          <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1 block">Notification to User (Preview)</label>
                            <p className="text-xs text-neutral-700 italic">"{moderationReasons?.find((r: any) => r._id === selectedReasonId)?.userMessage}"</p>
                          </div>
                        )}

                        <textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Internal admin notes (optional)"
                          rows={2}
                          className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:border-[#5200FF] focus:ring-1 focus:ring-[#5200FF] resize-none"
                        />
                        <button
                          onClick={() => handleRemovePost(selectedReportDetails.targetId)}
                          disabled={!selectedReasonId || !selectedSeverity}
                          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-bold transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove Post & Resolve
                        </button>
                      </div>

                      <div className="pt-2 space-y-2">
                        <button
                          onClick={handleMarkUnderReview}
                          className="w-full flex items-center justify-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-800 py-2.5 rounded-xl text-sm font-bold transition-colors"
                        >
                          Mark Under Review
                        </button>
                        <button
                          onClick={handleDismissReport}
                          className="w-full flex items-center justify-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-2.5 rounded-xl text-sm font-bold transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Dismiss Report (No Violation)
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
