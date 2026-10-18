import React, { useState } from 'react';
import {
  Megaphone,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Filter,
  Search,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Play,
  Pause,
  Clock
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

export const AdminAds: React.FC = () => {
  const overview = useQuery(api.ads.adminGetAdOverview);
  const [statusFilter, setStatusFilter] = useState('all');
  const [moderationFilter, setModerationFilter] = useState('all');
  const campaigns = useQuery(api.ads.adminGetCampaigns, {
    status: statusFilter,
    moderationStatus: moderationFilter,
  });

  const reviewMutation = useMutation(api.ads.adminReviewCampaign);

  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'approve' | 'reject' | 'suspend' | null>(null);
  const [reviewReason, setReviewReason] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReviewSubmit = async () => {
    if (!selectedCampaign || !reviewDecision) return;
    if ((reviewDecision === 'reject' || reviewDecision === 'suspend') && !reviewReason.trim()) {
      alert('Please provide a reason for rejection or suspension.');
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewMutation({
        campaignId: selectedCampaign._id,
        decision: reviewDecision,
        reason: reviewReason.trim() || undefined,
        note: reviewNote.trim() || undefined,
      });

      setSelectedCampaign(null);
      setReviewDecision(null);
      setReviewReason('');
      setReviewNote('');
    } catch (err: any) {
      alert(err.message || 'Moderation action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-theme-primary tracking-tight">
            Ads Moderation & Management
          </h1>
          <p className="text-xs sm:text-sm text-theme-tertiary mt-1">
            Review self-service ad campaigns, audit Paystack receipts, inspect targeting, and enforce policies.
          </p>
        </div>
      </div>

      {/* Global Financials & Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider space-y-1">
          <span className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider">
            Total Ad Receipts
          </span>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            ₦{(((overview?.totalVerifiedPaymentsKobo || 0)) / 100).toLocaleString()}
          </p>
          <span className="text-[11px] text-theme-tertiary">Verified Paystack transactions</span>
        </div>

        <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider space-y-1">
          <span className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider">
            Pending Review
          </span>
          <p className="text-xl sm:text-2xl font-black text-amber-500">
            {overview?.pendingReviewCount ?? '...'}
          </p>
          <span className="text-[11px] text-theme-tertiary">Requires administrator decision</span>
        </div>

        <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider space-y-1">
          <span className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider">
            Active Campaigns
          </span>
          <p className="text-xl sm:text-2xl font-black text-[#5E43F3]">
            {overview?.activeCount ?? '...'}
          </p>
          <span className="text-[11px] text-theme-tertiary">Delivering in feed</span>
        </div>

        <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider space-y-1">
          <span className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider">
            Platform Ad Delivery
          </span>
          <p className="text-xl sm:text-2xl font-black text-theme-primary">
            {(overview?.totalImpressions || 0).toLocaleString()} <span className="text-xs font-normal text-theme-tertiary">Impr</span>
          </p>
          <span className="text-[11px] text-theme-tertiary">{(overview?.totalClicks || 0).toLocaleString()} total clicks</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-theme-tertiary" />
          <span className="text-xs font-bold text-theme-secondary">Filter by:</span>
        </div>

        <select
          value={moderationFilter}
          onChange={(e) => setModerationFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-theme-base border border-theme-divider text-xs text-theme-primary focus:border-[#5E43F3] outline-hidden"
        >
          <option value="all">All Moderation States</option>
          <option value="pending_admin">Pending Admin Review</option>
          <option value="auto_flagged">Auto-Flagged by Safety Filter</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-theme-base border border-theme-divider text-xs text-theme-primary focus:border-[#5E43F3] outline-hidden"
        >
          <option value="all">All Campaign Statuses</option>
          <option value="active">Active</option>
          <option value="pending_review">Pending Review</option>
          <option value="pending_payment">Pending Payment</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Campaigns Moderation Queue List */}
      <div className="bg-theme-surface rounded-2xl border border-theme-divider overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-theme-divider flex items-center justify-between">
          <h2 className="font-bold text-sm text-theme-primary">Campaigns Queue</h2>
          <span className="text-xs text-theme-tertiary">
            {campaigns ? `${campaigns.length} campaigns in view` : 'Loading queue...'}
          </span>
        </div>

        {!campaigns || campaigns.length === 0 ? (
          <div className="py-16 text-center text-xs text-theme-tertiary space-y-2">
            <ShieldCheck className="w-10 h-10 mx-auto text-theme-tertiary/60" />
            <p>No campaigns matching current filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-theme-divider">
            {campaigns.map((camp) => (
              <div
                key={camp._id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-theme-surface-hover/50 transition-colors"
              >
                <div className="space-y-1.5 min-w-0 max-w-xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-theme-primary">{camp.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        camp.moderationStatus === 'pending_admin'
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          : camp.moderationStatus === 'auto_flagged'
                          ? 'bg-red-500/10 text-red-600 border-red-500/20'
                          : camp.moderationStatus === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20'
                      }`}
                    >
                      {camp.moderationStatus.replace('_', ' ')}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-theme-base text-theme-tertiary border border-theme-divider">
                      Status: {camp.status}
                    </span>
                  </div>

                  <p className="text-xs text-theme-secondary font-medium">
                    Headline: "{camp.creative.headline}"
                  </p>
                  <p className="text-[11px] text-theme-tertiary">
                    Advertiser: {camp.advertiser?.name || 'Unknown'} (@{camp.advertiser?.username}) · Budget: ₦{(camp.budget.totalBudgetKobo / 100).toLocaleString()} · Target: {camp.targeting.targetType} ({camp.targeting.locationName || 'Nigeria'})
                  </p>

                  {camp.moderationReason && (
                    <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-[11px] flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{camp.moderationReason}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => {
                      setSelectedCampaign(camp);
                      setReviewDecision('approve');
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedCampaign(camp);
                      setReviewDecision('reject');
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>

                  {camp.status === 'active' && (
                    <button
                      onClick={() => {
                        setSelectedCampaign(camp);
                        setReviewDecision('suspend');
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Suspend</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Confirmation Modal */}
      {selectedCampaign && reviewDecision && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-theme-surface rounded-2xl border border-theme-divider p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-theme-primary">
              Confirm Moderation Decision: <span className="uppercase text-[#5E43F3]">{reviewDecision}</span>
            </h3>

            <div className="p-3 rounded-xl bg-theme-base border border-theme-divider text-xs space-y-1">
              <p className="font-bold text-theme-primary">{selectedCampaign.name}</p>
              <p className="text-theme-tertiary">Headline: {selectedCampaign.creative.headline}</p>
              <p className="text-theme-tertiary">Destination: {selectedCampaign.creative.destinationUrl}</p>
            </div>

            {(reviewDecision === 'reject' || reviewDecision === 'suspend') && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-theme-primary">
                  Reason for {reviewDecision} * (Shared with advertiser)
                </label>
                <textarea
                  rows={2}
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  placeholder="e.g. Destination link is invalid or policy violation regarding prohibited goods."
                  className="w-full px-3 py-2 rounded-xl bg-theme-base border border-theme-divider text-xs text-theme-primary focus:border-[#5E43F3] outline-hidden resize-none"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-theme-primary">
                Internal Administrative Note (Optional)
              </label>
              <input
                type="text"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Internal audit note"
                className="w-full px-3 py-2 rounded-xl bg-theme-base border border-theme-divider text-xs text-theme-primary focus:border-[#5E43F3] outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-theme-divider">
              <button
                type="button"
                onClick={() => {
                  setSelectedCampaign(null);
                  setReviewDecision(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-theme-tertiary hover:text-theme-primary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReviewSubmit}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white text-xs font-bold transition-all shadow-md shadow-[#5E43F3]/20 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
