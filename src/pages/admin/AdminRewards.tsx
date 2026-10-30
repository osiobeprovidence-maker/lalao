import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Gift, Star, Users, Clock, CheckCircle2, XCircle, AlertTriangle,
  Plus, Edit2, Trash2, Mail, Smartphone, CreditCard, Store, Award,
  RefreshCw, Filter, Search, ChevronDown, Settings, BarChart3,
  LayoutDashboard, Menu, X as XIcon
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';

type RewardType = 'gift_card' | 'airtime' | 'data_bundle' | 'voucher' | 'partner_offer' | 'other';
type RedemptionStatus = 'pending' | 'approved' | 'fulfilled' | 'rejected' | 'cancelled';

const REWARD_TYPE_LABELS: Record<string, string> = {
  gift_card: 'Gift Card',
  airtime: 'Airtime',
  data_bundle: 'Data Bundle',
  voucher: 'Voucher',
  partner_offer: 'Partner Offer',
  other: 'Other',
};

const REWARD_TYPE_ICONS: Record<string, React.ElementType> = {
  gift_card: Gift,
  airtime: Smartphone,
  data_bundle: Smartphone,
  voucher: CreditCard,
  partner_offer: Store,
  other: Award,
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-amber-700 bg-amber-50 border-amber-200',
  approved: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  fulfilled: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  rejected: 'text-rose-700 bg-rose-50 border-rose-200',
  cancelled: 'text-theme-tertiary bg-theme-surface-hover border-theme-divider-light',
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  pending: Clock,
  approved: CheckCircle2,
  fulfilled: CheckCircle2,
  rejected: XCircle,
  cancelled: XCircle,
};

type AdminTab = 'overview' | 'catalogue' | 'redemptions' | 'config' | 'referrals';

export const AdminRewards: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [modalType, setModalType] = useState<'create' | 'edit' | null>(null);
  const [editingReward, setEditingReward] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [redemptionFilter, setRedemptionFilter] = useState<'all' | 'pending' | 'approved' | 'fulfilled' | 'rejected'>('all');
  // Uncontrolled config inputs are captured here until the admin saves them.
  const configEdits = React.useRef<Record<string, string>>({});

  const config = useQuery(api.rewards.getRewardConfigAdmin);
  const catalogue = useQuery(api.rewards.getAllRewardCatalogue);
  const redemptions = useQuery(api.rewards.getRewardRedemptionsAdmin, { limit: 100 });
  const analytics = useQuery(api.rewards.getRewardAnalytics);

  const createReward = useMutation(api.rewards.createReward);
  const updateReward = useMutation(api.rewards.updateReward);
  const archiveReward = useMutation(api.rewards.archiveReward);
  const approveRedemption = useMutation(api.rewards.approveRedemption);
  const fulfillRedemption = useMutation(api.rewards.fulfillRedemption);
  const rejectRedemption = useMutation(api.rewards.rejectRedemption);
  const updateRewardConfig = useMutation(api.rewards.updateRewardConfig);
  const ensureRewardsReady = useMutation(api.rewards.ensureRewardsReady);

  // Make sure the default earning rules exist so this page never shows an
  // empty configuration list on a fresh deployment.
  useEffect(() => {
    ensureRewardsReady({}).catch(() => {});
  }, [ensureRewardsReady]);

  // Config helpers
  const getConfigValue = (key: string, defaultValue: string) => {
    const item = config?.find((c: any) => c.key === key);
    return item ? item.value : defaultValue;
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCreateReward = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      await createReward({
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        type: formData.get('type') as RewardType,
        imageUrl: formData.get('imageUrl') as string || undefined,
        pointsCost: parseInt(formData.get('pointsCost') as string),
        stockLimit: formData.get('stockLimit') ? parseInt(formData.get('stockLimit') as string) : undefined,
        availabilityStart: formData.get('availabilityStart') ? new Date(formData.get('availabilityStart') as string).getTime() : undefined,
        availabilityEnd: formData.get('availabilityEnd') ? new Date(formData.get('availabilityEnd') as string).getTime() : undefined,
        fulfillmentInstructions: formData.get('fulfillmentInstructions') as string || undefined,
      });
      setModalType(null);
      showToast('Reward created successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to create reward', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      await updateReward({
        rewardId: editingReward!._id,
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        type: formData.get('type') as RewardType,
        imageUrl: formData.get('imageUrl') as string || undefined,
        pointsCost: parseInt(formData.get('pointsCost') as string),
        stockLimit: formData.get('stockLimit') ? parseInt(formData.get('stockLimit') as string) : undefined,
        status: formData.get('status') as any,
        availabilityStart: formData.get('availabilityStart') ? new Date(formData.get('availabilityStart') as string).getTime() : undefined,
        availabilityEnd: formData.get('availabilityEnd') ? new Date(formData.get('availabilityEnd') as string).getTime() : undefined,
        fulfillmentInstructions: formData.get('fulfillmentInstructions') as string || undefined,
      });
      setModalType(null);
      setEditingReward(null);
      showToast('Reward updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update reward', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchive = async (rewardId: string) => {
    if (!confirm('Archive this reward? This cannot be undone.')) return;
    setIsProcessing(true);
    try {
      await archiveReward({ rewardId: rewardId as any });
      showToast('Reward archived', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to archive reward', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async (redemptionId: string) => {
    setIsProcessing(true);
    try {
      await approveRedemption({ redemptionId: redemptionId as any });
      showToast('Redemption approved', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to approve', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFulfill = async (redemptionId: string) => {
    const ref = prompt('Enter fulfillment reference (e.g., gift card code, transaction ID):');
    if (!ref) return;
    setIsProcessing(true);
    try {
      await fulfillRedemption({ redemptionId: redemptionId as any, fulfillmentReference: ref });
      showToast('Redemption fulfilled', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to fulfill', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (redemptionId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    setIsProcessing(true);
    try {
      await rejectRedemption({ redemptionId: redemptionId as any, rejectionReason: reason });
      showToast('Redemption rejected', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to reject', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfigUpdate = async (key: string, value: string, description: string) => {
    setIsProcessing(true);
    try {
      await updateRewardConfig({ key, value, description });
      showToast('Configuration updated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update config', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString();
  const formatDateTime = (ts: number) => new Date(ts).toLocaleString();

  const rewardTypeOptions: { value: RewardType; label: string }[] = [
    { value: 'gift_card', label: 'Gift Card' },
    { value: 'airtime', label: 'Mobile Airtime' },
    { value: 'data_bundle', label: 'Data Bundle' },
    { value: 'voucher', label: 'Shopping Voucher' },
    { value: 'partner_offer', label: 'Partner Offer' },
    { value: 'other', label: 'Other' },
  ];

  const TabButton: React.FC<{ id: AdminTab; label: string; icon: React.ElementType; count?: number }> = ({ id, label, icon: Icon, count }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
          isActive
            ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
            : 'border-transparent text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary'
        }`}
      >
        <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-theme-tertiary'}`} />
        {label}
        {count !== undefined && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-theme-surface-hover text-theme-tertiary">{count}</span>}
      </button>
    );
  };

  // ==================== OVERVIEW TAB ====================
  const OverviewContent = () => {
    const a = analytics;
    if (a === undefined) return <div className="animate-pulse h-32 rounded-2xl bg-theme-surface-hover" />;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl border border-theme-divider bg-theme-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">Total Points Issued</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
              <Award className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-theme-primary mt-2">{a.totalPointsIssued.toLocaleString()}</div>
          <p className="text-[11px] text-theme-tertiary mt-1">Lifetime points awarded</p>
        </div>
        <div className="rounded-2xl border border-theme-divider bg-theme-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">Available Points Liability</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <Star className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-theme-primary mt-2">{a.availablePointsLiability.toLocaleString()}</div>
          <p className="text-[11px] text-theme-tertiary mt-1">Points outstanding to users</p>
        </div>
        <div className="rounded-2xl border border-theme-divider bg-theme-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">Points Redeemed</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-theme-primary mt-2">{a.pointsRedeemed.toLocaleString()}</div>
          <p className="text-[11px] text-theme-tertiary mt-1">Total points spent on rewards</p>
        </div>
        <div className="rounded-2xl border border-theme-divider bg-theme-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">Pending Redemptions</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-theme-primary mt-2">{a.redemptions.pending}</div>
          <p className="text-[11px] text-theme-tertiary mt-1">{a.redemptions.total} total requests</p>
        </div>
      </div>
    );
  };

  // ==================== CATALOGUE TAB ====================
  const CatalogueContent = () => {
    if (catalogue === undefined) return <div className="animate-pulse h-64 rounded-2xl bg-theme-surface-hover" />;

    const activeCount = catalogue.filter((r: any) => r.status === 'active').length;

    return (
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-theme-primary mb-2">Reward Catalogue</h2>
            <p className="text-sm text-theme-tertiary">
              {catalogue.length} reward{catalogue.length === 1 ? '' : 's'} · {activeCount} active
            </p>
          </div>
          <button
            onClick={() => { setEditingReward(null); setModalType('create'); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors self-start"
          >
            <Plus className="w-4 h-4" /> Add Reward
          </button>
        </div>

        {catalogue.length === 0 ? (
          <div className="rounded-2xl border border-theme-divider bg-theme-surface p-10 text-center">
            <Gift className="w-8 h-8 mx-auto mb-3 text-theme-tertiary" />
            <p className="text-sm font-semibold text-theme-primary">No rewards yet</p>
            <p className="text-xs text-theme-tertiary mt-1">Add your first reward so users have something to redeem.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-theme-divider bg-theme-surface overflow-hidden shadow-sm">
            <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_110px_90px_110px_160px] gap-3 px-4 py-3 border-b border-theme-divider-light bg-theme-base">
              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-tertiary">Reward</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-tertiary">Type</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-tertiary">Cost</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-tertiary">Stock</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-tertiary text-right">Actions</span>
            </div>

            {catalogue.map((r: any) => {
              const Icon = REWARD_TYPE_ICONS[r.type] || Award;
              const stockLabel = r.stockLimit ? `${r.stockRemaining ?? 0} / ${r.stockLimit}` : 'Unlimited';
              const statusColor =
                r.status === 'active'
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : r.status === 'inactive'
                  ? 'text-amber-700 bg-amber-50 border-amber-200'
                  : 'text-theme-tertiary bg-theme-surface-hover border-theme-divider-light';

              return (
                <div
                  key={r._id}
                  className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_110px_90px_110px_160px] gap-2 sm:gap-3 px-4 py-3 items-center border-b border-theme-divider-light last:border-0"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold text-theme-primary truncate">
                      <Icon className="w-4 h-4 shrink-0 text-indigo-500" />
                      <span className="truncate">{r.name}</span>
                    </p>
                    <p className="text-[11px] text-theme-tertiary truncate sm:pl-6">{r.description}</p>
                  </div>

                  <div className="text-xs text-theme-secondary sm:pl-6">
                    <span className="sm:hidden text-theme-tertiary">Type: </span>
                    {REWARD_TYPE_LABELS[r.type] || r.type}
                  </div>

                  <div className="text-xs font-bold text-theme-primary">
                    {r.pointsCost.toLocaleString()} pts
                  </div>

                  <div className="text-xs text-theme-secondary">
                    <span className="sm:hidden text-theme-tertiary">Stock: </span>
                    {stockLabel}
                  </div>

                  <div className="flex items-center gap-2 sm:justify-end">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${statusColor}`}>
                      {r.status}
                    </span>
                    <button
                      onClick={() => { setEditingReward(r); setModalType('edit'); }}
                      title="Edit reward"
                      className="p-1.5 rounded-lg border border-theme-divider-light hover:bg-theme-surface-hover text-theme-secondary"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {r.status !== 'archived' && (
                      <button
                        onClick={() => handleArchive(r._id)}
                        disabled={isProcessing}
                        title="Archive reward"
                        className="p-1.5 rounded-lg border border-theme-divider-light hover:bg-rose-50 hover:text-rose-600 text-theme-secondary disabled:opacity-40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ==================== REDEMPTIONS TAB ====================
  const RedemptionsContent = () => {
    if (redemptions === undefined) return <div className="animate-pulse h-64 rounded-2xl bg-theme-surface-hover" />;

    const counts = {
      all: redemptions.length,
      pending: redemptions.filter((r: any) => r.status === 'pending').length,
      approved: redemptions.filter((r: any) => r.status === 'approved').length,
      fulfilled: redemptions.filter((r: any) => r.status === 'fulfilled').length,
      rejected: redemptions.filter((r: any) => r.status === 'rejected').length,
    };

    const visible =
      redemptionFilter === 'all'
        ? redemptions
        : redemptions.filter((r: any) => r.status === redemptionFilter);

    const filterButton = (id: typeof redemptionFilter, label: string, tone: string) => (
      <button
        key={id}
        onClick={() => setRedemptionFilter(id)}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
          redemptionFilter === id
            ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
            : `border-theme-divider-light hover:bg-theme-surface-hover ${tone}`
        }`}
      >
        {label} ({counts[id]})
      </button>
    );

    return (
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-theme-primary mb-2">Redemption Requests</h2>
            <p className="text-sm text-theme-tertiary">
              Review, approve and fulfil user reward redemptions. Rejecting refunds the user's points.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {filterButton('all', 'All', 'text-theme-secondary')}
            {filterButton('pending', 'Pending', 'text-amber-600')}
            {filterButton('approved', 'Approved', 'text-indigo-600')}
            {filterButton('fulfilled', 'Fulfilled', 'text-emerald-600')}
            {filterButton('rejected', 'Rejected', 'text-rose-600')}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-2xl border border-theme-divider bg-theme-surface p-10 text-center">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-3 text-theme-tertiary" />
            <p className="text-sm font-semibold text-theme-primary">
              {redemptionFilter === 'all' ? 'No redemption requests yet' : `No ${redemptionFilter} requests`}
            </p>
            <p className="text-xs text-theme-tertiary mt-1">
              {redemptionFilter === 'pending'
                ? 'You are all caught up — nothing is waiting on you.'
                : 'Requests will appear here as users redeem points.'}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-theme-divider bg-theme-surface overflow-hidden shadow-sm">
            <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_90px_110px_190px] gap-3 px-4 py-3 border-b border-theme-divider-light bg-theme-base">
              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-tertiary">User</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-tertiary">Reward</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-tertiary">Cost</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-tertiary">Status</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-tertiary text-right">Actions</span>
            </div>

            {visible.map((r: any) => {
              const StatusIcon = STATUS_ICONS[r.status] || Clock;
              return (
                <div
                  key={r._id}
                  className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_90px_110px_190px] gap-2 sm:gap-3 px-4 py-3 items-center border-b border-theme-divider-light last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-theme-primary truncate">{r.userName || 'Unknown user'}</p>
                    <p className="text-[11px] text-theme-tertiary truncate">{r.userEmail || formatDateTime(r.createdAt)}</p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm text-theme-secondary truncate">{r.rewardName}</p>
                    <p className="text-[11px] text-theme-tertiary">{formatDateTime(r.createdAt)}</p>
                  </div>

                  <div className="text-xs font-bold text-theme-primary">{r.pointsCost.toLocaleString()} pts</div>

                  <div>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${STATUS_COLORS[r.status] || STATUS_COLORS.cancelled}`}>
                      <StatusIcon className="w-3 h-3" />
                      {r.status}
                    </span>
                    {r.status === 'rejected' && r.rejectionReason && (
                      <p className="text-[10px] text-rose-600 mt-1 truncate" title={r.rejectionReason}>{r.rejectionReason}</p>
                    )}
                    {r.status === 'fulfilled' && r.fulfillmentReference && (
                      <p className="text-[10px] text-emerald-600 mt-1 truncate" title={r.fulfillmentReference}>{r.fulfillmentReference}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 sm:justify-end">
                    {r.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(r._id)}
                          disabled={isProcessing}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(r._id)}
                          disabled={isProcessing}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {r.status === 'approved' && (
                      <button
                        onClick={() => handleFulfill(r._id)}
                        disabled={isProcessing}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40"
                      >
                        Mark fulfilled
                      </button>
                    )}
                    {(r.status === 'fulfilled' || r.status === 'rejected') && (
                      <span className="text-[11px] text-theme-tertiary">
                        {r.status === 'fulfilled' ? formatDateTime(r.fulfilledAt || r.updatedAt) : formatDateTime(r.updatedAt)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ==================== CONFIG TAB ====================
  const ConfigContent = () => {
    if (config === undefined) return <div className="animate-pulse h-64 rounded-2xl bg-theme-surface-hover" />;

    const fields: Array<{
      key: string;
      label: string;
      desc: string;
      fallback: string;
      type: 'number' | 'select';
      options?: Array<{ value: string; label: string }>;
    }> = [
      { key: 'points_per_dollar', label: 'Points per $1 Spent', desc: 'Points awarded per eligible US dollar of spend', fallback: '1', type: 'number' },
      { key: 'ngn_per_usd', label: 'NGN per USD', desc: 'Conversion rate used to value Naira purchases in USD', fallback: '1500', type: 'number' },
      { key: 'referral_points', label: 'Referral Points', desc: 'Points awarded when a referral qualifies', fallback: '20', type: 'number' },
      {
        key: 'referral_qualification',
        label: 'Referral Qualification',
        desc: 'Action required before a referral is rewarded',
        fallback: 'first_purchase',
        type: 'select',
        options: [
          { value: 'first_purchase', label: 'First purchase' },
          { value: 'wallet_topup', label: 'Wallet top-up' },
          { value: 'registration', label: 'Registration only' },
        ],
      },
      {
        key: 'fractional_points_enabled',
        label: 'Fractional Points',
        desc: 'Award partial points for partial dollars',
        fallback: 'true',
        type: 'select',
        options: [
          { value: 'true', label: 'Enabled' },
          { value: 'false', label: 'Disabled' },
        ],
      },
      {
        key: 'points_rounding',
        label: 'Rounding Policy',
        desc: 'Applied when fractional points are disabled',
        fallback: 'round',
        type: 'select',
        options: [
          { value: 'round', label: 'Round' },
          { value: 'floor', label: 'Floor' },
          { value: 'ceil', label: 'Ceil' },
        ],
      },
      {
        key: 'rewards_enabled',
        label: 'Rewards Enabled',
        desc: 'Master switch for awarding points on purchases',
        fallback: 'true',
        type: 'select',
        options: [
          { value: 'true', label: 'Enabled' },
          { value: 'false', label: 'Disabled' },
        ],
      },
    ];

    return (
      <div className="mb-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-theme-primary mb-2">Earning Rules</h2>
          <p className="text-sm text-theme-tertiary">
            Changes apply to future awards only. Points already issued are never recalculated.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {fields.map((cfg) => {
            const current = getConfigValue(cfg.key, cfg.fallback);
            return (
              <div key={cfg.key} className="rounded-2xl border border-theme-divider bg-theme-surface p-4 shadow-sm flex flex-col">
                <div className="mb-3">
                  <p className="text-sm font-medium text-theme-primary">{cfg.label}</p>
                  <p className="text-[11px] text-theme-tertiary">{cfg.desc}</p>
                </div>
                <div className="mt-auto flex items-center gap-2">
                  {cfg.type === 'select' ? (
                    <select
                      defaultValue={current}
                      onChange={(e) => { configEdits.current[cfg.key] = e.target.value; }}
                      className="flex-1 min-w-0 bg-theme-base border border-theme-divider-light rounded-lg px-3 py-2 text-sm text-theme-primary focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      {(cfg.options || []).map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      defaultValue={current}
                      onChange={(e) => { configEdits.current[cfg.key] = e.target.value; }}
                      className="flex-1 min-w-0 bg-theme-base border border-theme-divider-light rounded-lg px-3 py-2 text-sm text-theme-primary focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  )}
                  <button
                    onClick={() => handleConfigUpdate(cfg.key, configEdits.current[cfg.key] ?? current, cfg.desc)}
                    disabled={isProcessing}
                    className="px-3 py-2 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40"
                  >
                    Save
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ==================== REFERRALS TAB ====================
  const ReferralsContent = () => {
    const qualification = getConfigValue('referral_qualification', 'first_purchase');
    const points = getConfigValue('referral_points', '20');

    return (
      <div className="mb-6">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-theme-primary mb-2">Referral Management</h2>
          <p className="text-sm text-theme-tertiary">Configure how referrals qualify and what referrers earn.</p>
        </div>

        {analytics && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Referrals registered', value: analytics.totalReferrals },
              { label: 'Referrals qualified', value: analytics.qualifiedReferrals },
              { label: 'Points paid to referrers', value: analytics.referralPointsEarned },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-theme-divider bg-theme-surface p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-theme-tertiary mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-theme-primary">{Number(stat.value || 0).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-theme-divider bg-theme-surface p-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-theme-primary mb-2">Referral Qualification</p>
              <div className="flex items-center gap-2">
                <select
                  defaultValue={qualification}
                  onChange={(e) => { configEdits.current.referral_qualification = e.target.value; }}
                  className="flex-1 min-w-0 bg-theme-base border border-theme-divider-light rounded-lg px-3 py-2 text-sm text-theme-primary focus:border-indigo-500"
                >
                  <option value="first_purchase">First purchase</option>
                  <option value="wallet_topup">Wallet top-up</option>
                  <option value="registration">Registration only</option>
                </select>
                <button
                  onClick={() => handleConfigUpdate('referral_qualification', configEdits.current.referral_qualification ?? qualification, 'Referral qualification requirement')}
                  disabled={isProcessing}
                  className="px-3 py-2 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40"
                >
                  Save
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-theme-primary mb-2">Referral Points Reward</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  defaultValue={points}
                  onChange={(e) => { configEdits.current.referral_points = e.target.value; }}
                  className="flex-1 min-w-0 bg-theme-base border border-theme-divider-light rounded-lg px-3 py-2 text-sm text-theme-primary focus:border-indigo-500"
                />
                <button
                  onClick={() => handleConfigUpdate('referral_points', configEdits.current.referral_points ?? points, 'Points per qualified referral')}
                  disabled={isProcessing}
                  className="px-3 py-2 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TabContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewContent />;
      case 'catalogue': return <CatalogueContent />;
      case 'redemptions': return <RedemptionsContent />;
      case 'config': return <ConfigContent />;
      case 'referrals': return <ReferralsContent />;
    }
  };

  // ==================== CREATE/EDIT MODAL ====================
  const RewardModal = () => {
    if (!modalType) return null;

    const isEdit = modalType === 'edit';
    const initialName = editingReward?.name || '';
    const initialDesc = editingReward?.description || '';
    const initialType = editingReward?.type || 'gift_card';
    const initialCost = editingReward?.pointsCost || '';
    const initialImage = editingReward?.imageUrl || '';
    const initialStock = editingReward?.stockLimit || '';
    const initialInstructions = editingReward?.fulfillmentInstructions || '';
    const initialStatus = editingReward?.status || 'active';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-theme-surface rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
          <div className="flex items-center justify-between p-6 border-b border-theme-divider-light">
            <h3 className="text-lg font-bold text-theme-primary">
              {isEdit ? 'Edit Reward' : 'Create New Reward'}
            </h3>
            <button onClick={() => setModalType(null)} className="w-8 h-8 rounded-full bg-theme-surface-hover flex items-center justify-center hover:bg-theme-surface-active transition-colors">
              <XIcon className="w-5 h-5 text-theme-secondary" />
            </button>
          </div>
          <form onSubmit={isEdit ? handleUpdateReward : handleCreateReward} className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">Reward Name</label>
                <input
                  name="name"
                  defaultValue={initialName}
                  className="w-full bg-theme-base border border-theme-divider-light rounded-xl px-4 py-3 text-sm text-theme-primary focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">Type</label>
                <select
                  name="type"
                  defaultValue={initialType}
                  className="w-full bg-theme-base border border-theme-divider-light rounded-xl px-4 py-3 text-sm text-theme-primary focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  {rewardTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">Description</label>
              <textarea
                name="description"
                defaultValue={initialDesc}
                rows={3}
                className="w-full bg-theme-base border border-theme-divider-light rounded-xl px-4 py-3 text-sm text-theme-primary focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">Points Cost</label>
                <input
                  name="pointsCost"
                  type="number"
                  defaultValue={initialCost}
                  className="w-full bg-theme-base border border-theme-divider-light rounded-xl px-4 py-3 text-sm text-theme-primary focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>
              {isEdit ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">Status</label>
                  <select
                    name="status"
                    defaultValue={initialStatus}
                    className="w-full bg-theme-base border border-theme-divider-light rounded-xl px-4 py-3 text-sm text-theme-primary focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">Image URL</label>
              <input
                name="imageUrl"
                type="url"
                defaultValue={initialImage}
                placeholder="https://example.com/reward.jpg"
                className="w-full bg-theme-base border border-theme-divider-light rounded-xl px-4 py-3 text-sm text-theme-primary focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">Stock Limit</label>
              <input
                name="stockLimit"
                type="number"
                defaultValue={initialStock}
                placeholder="Leave blank for unlimited"
                className="w-full bg-theme-base border border-theme-divider-light rounded-xl px-4 py-3 text-sm text-theme-primary focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-theme-tertiary">Leave blank for unlimited stock</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">Fulfillment Instructions</label>
              <textarea
                name="fulfillmentInstructions"
                defaultValue={initialInstructions}
                rows={2}
                placeholder="How to fulfill this reward (e.g., email gift card code...)"
                className="w-full bg-theme-base border border-theme-divider-light rounded-xl px-4 py-3 text-sm text-theme-primary focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-theme-divider-light">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2.5 rounded-xl text-theme-secondary font-medium hover:bg-theme-surface-hover transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-white animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>{isEdit ? 'Update Reward' : 'Create Reward'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 mb-1">
            Lalao Admin
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-theme-primary tracking-tight">
            Rewards Management
          </h1>
          <p className="text-sm text-theme-tertiary mt-1">
            Manage reward points, catalogue, redemptions, and referral program
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        <TabButton id="overview" label="Overview" icon={LayoutDashboard} count={analytics?.totalPointsIssued} />
        <TabButton id="catalogue" label="Catalogue" icon={Store} count={catalogue?.length} />
        <TabButton id="redemptions" label="Redemptions" icon={Award} count={redemptions?.filter((r: any) => r.status === 'pending').length} />
        <TabButton id="config" label="Earning Rules" icon={Settings} />
        <TabButton id="referrals" label="Referrals" icon={Users} />
      </div>

      {/* Analytics Overview */}
      {activeTab === 'overview' && <OverviewContent />}

      {activeTab !== 'overview' && TabContent()}

      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl animate-in slide-in-from-bottom-2 ${toast.type === 'success' ? 'bg-emerald-500 text-white border border-emerald-400/50' : 'bg-rose-500 text-white border border-rose-400/50'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <RewardModal />
    </div>
  );
};