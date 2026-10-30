// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  CreditCard, Users, Plus, Search, Check, AlertCircle, X,
  Calendar, Loader2, RefreshCw, Info,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type BillingCycle = '3_months' | '6_months' | '12_months';

const DURATION_OPTIONS: { value: BillingCycle; label: string; months: number }[] = [
  { value: '3_months',  label: '3 Months',   months: 3  },
  { value: '6_months',  label: '6 Months',   months: 6  },
  { value: '12_months', label: '12 Months (1 Year)', months: 12 },
];

function durationLabel(billingCycle: string | undefined, durationMonths?: number): string {
  const m = durationMonths ?? (
    billingCycle === '3_months' || billingCycle === 'quarterly' ? 3 :
    billingCycle === '6_months' ? 6 :
    billingCycle === '12_months' || billingCycle === 'yearly' ? 12 : 1
  );
  if (m === 1)  return 'Monthly';
  if (m === 3)  return '3 Months';
  if (m === 6)  return '6 Months';
  if (m === 12) return '12 Months';
  return `${m} Months`;
}

// ─── Component ────────────────────────────────────────────────────────────────

const INITIAL_FORM = {
  name: '',
  description: '',
  category: 'Music & Audio',
  platformName: 'Spotify',
  platformLogo: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg',
  totalAccountCost: 3500,
  defaultSlotPrice: 1200,
  currency: 'NGN',
  billingCycle: '3_months' as BillingCycle,
  durationMonths: 3,
  totalCapacity: 5,
  benefits: 'Individual personal account, Offline downloads, Zero ads',
  memberInstructions: 'Authorized invitation link will be sent upon payment confirmation.',
  eligibilityRules: 'Personal account not attached to an active family group.',
  cancellationPolicy: 'Cancel future renewals anytime before next cycle.',
};

export const AdminSubscriptions: React.FC = () => {
  const subscriptions   = useQuery(api.admin.getSubscriptionsOverview);
  const jointheQPage    = useQuery(api.subscriptions.getJointheQPage);
  const ensureJointheQ  = useMutation(api.subscriptions.ensureJointheQPage);
  const createListing   = useMutation(api.subscriptions.createSubscriptionListing);
  // updateListing available for future use
  // const updateListing = useMutation(api.subscriptions.updateSubscriptionListing);

  const [searchQuery,        setSearchQuery]        = useState('');
  const [selectedCategory,   setSelectedCategory]   = useState('All');
  const [isCreateModalOpen,  setIsCreateModalOpen]  = useState(false);
  const [isSubmitting,       setIsSubmitting]        = useState(false);
  const [initError,          setInitError]           = useState<string | null>(null);
  const [isInitializing,     setIsInitializing]      = useState(false);
  const [formData,           setFormData]            = useState(INITIAL_FORM);

  // ── Auto-initialize JointheQ page on first mount ──────────────────────────
  // The page only exists after ensureJointheQPage has been called once.
  // We call it here idempotently; it's safe to run multiple times.
  useEffect(() => {
    if (jointheQPage === undefined) return; // still loading
    if (jointheQPage !== null) return;      // already exists
    // Page is missing — initialize it automatically
    setIsInitializing(true);
    setInitError(null);
    ensureJointheQ()
      .catch((err: any) => {
        setInitError(err.message || 'Failed to initialize JointheQ system page.');
      })
      .finally(() => setIsInitializing(false));
  }, [jointheQPage]);

  // ── Sync durationMonths when billingCycle changes ─────────────────────────
  const handleBillingCycleChange = (val: BillingCycle) => {
    const opt = DURATION_OPTIONS.find((o) => o.value === val);
    setFormData((prev) => ({
      ...prev,
      billingCycle: val,
      durationMonths: opt?.months ?? 3,
    }));
  };

  // ── Form submit ───────────────────────────────────────────────────────────
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pageId = jointheQPage?._id;
    if (!pageId) {
      // Shouldn't normally reach here — initEffect handles it
      setIsInitializing(true);
      try {
        await ensureJointheQ();
      } catch (err: any) {
        setInitError(err.message || 'JointheQ page initialization failed.');
        setIsInitializing(false);
        return;
      }
      setIsInitializing(false);
      // Retry will happen on next render once jointheQPage reloads
      return;
    }

    try {
      setIsSubmitting(true);
      await createListing({
        pageId,
        name:             formData.name,
        description:      formData.description,
        category:         formData.category,
        platformName:     formData.platformName,
        platformLogo:     formData.platformLogo,
        totalAccountCost: Number(formData.totalAccountCost),
        defaultSlotPrice: Number(formData.defaultSlotPrice),
        currency:         formData.currency,
        billingCycle:     formData.billingCycle,
        durationMonths:   formData.durationMonths,
        totalCapacity:    Number(formData.totalCapacity),
        benefits:         formData.benefits.split(',').map((b) => b.trim()).filter(Boolean),
        memberInstructions: formData.memberInstructions,
        eligibilityRules:   formData.eligibilityRules,
        cancellationPolicy: formData.cancellationPolicy,
      });
      setIsCreateModalOpen(false);
      setFormData(INITIAL_FORM);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error creating subscription listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Derived state ─────────────────────────────────────────────────────────
  const filtered = (subscriptions || []).filter((s: any) => {
    if (selectedCategory !== 'All' && s.category !== selectedCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q) ||
      s.platformName?.toLowerCase().includes(q) ||
      s.pageName?.toLowerCase().includes(q)
    );
  });

  const totalActive   = (subscriptions || []).reduce((a: number, c: any) => a + (c.activeMembers  || 0), 0);
  const totalSlots    = (subscriptions || []).reduce((a: number, c: any) => a + (c.totalCapacity  || 0), 0);
  const totalOccupied = (subscriptions || []).reduce((a: number, c: any) => a + (c.occupiedSlots  || 0), 0);

  // ── Page status banner ────────────────────────────────────────────────────
  const pageStatus = () => {
    if (jointheQPage === undefined || isInitializing) {
      return (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-theme-surface border border-theme-divider text-xs text-theme-secondary font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-[#5E43F3]" />
          {isInitializing ? 'Initializing JointheQ system page…' : 'Loading system page…'}
        </div>
      );
    }
    if (initError) {
      return (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{initError}</span>
          <button
            onClick={() => {
              setInitError(null);
              setIsInitializing(true);
              ensureJointheQ()
                .catch((e: any) => setInitError(e.message || 'Retry failed.'))
                .finally(() => setIsInitializing(false));
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      );
    }
    if (jointheQPage) {
      return (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium">
          <Check className="w-3.5 h-3.5" />
          JointheQ system page active · @{jointheQPage.username}
        </div>
      );
    }
    return null;
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-theme-primary">Subscriptions Marketplace</h1>
          <p className="text-sm text-theme-tertiary mt-1">
            Platform subscription listings, group capacity, and access fulfillment
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {pageStatus()}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={!jointheQPage || isInitializing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white font-bold text-sm transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>New Subscription Offer</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-theme-surface border border-theme-divider rounded-2xl p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">Total Listings</p>
          <p className="text-2xl font-black text-theme-primary mt-1">{subscriptions ? subscriptions.length : '-'}</p>
        </div>
        <div className="bg-theme-surface border border-theme-divider rounded-2xl p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">Active Members</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{totalActive}</p>
        </div>
        <div className="bg-theme-surface border border-theme-divider rounded-2xl p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">Occupied Slots</p>
          <p className="text-2xl font-black text-[#5E43F3] mt-1">{totalOccupied} / {totalSlots}</p>
        </div>
        <div className="bg-theme-surface border border-theme-divider rounded-2xl p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">Available Capacity</p>
          <p className="text-2xl font-black text-theme-primary mt-1">{Math.max(0, totalSlots - totalOccupied)}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-theme-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, provider, or category..."
            className="w-full bg-theme-surface border border-theme-divider-light rounded-xl py-2 pl-10 pr-4 text-xs font-semibold text-theme-primary placeholder:text-theme-tertiary focus:outline-none focus:border-[#5E43F3]"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Music & Audio', 'Video & Streaming', 'Movies & TV', 'Productivity & Utilities'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#5E43F3] text-white shadow-xs'
                  : 'bg-theme-surface border border-theme-divider-light text-theme-secondary hover:bg-theme-surface-hover'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {subscriptions === undefined ? (
          <div className="text-center py-8 text-theme-tertiary bg-theme-surface rounded-2xl border border-theme-divider shadow-sm text-sm">
            Loading subscriptions...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-theme-tertiary bg-theme-surface rounded-2xl border border-theme-divider shadow-sm text-sm">
            No subscriptions found
          </div>
        ) : (
          filtered.map((s: any) => (
            <div key={s._id} className="bg-theme-surface border border-theme-divider rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="font-semibold text-theme-primary line-clamp-1">{s.name}</p>
                  <p className="text-xs text-theme-tertiary">{s.category}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-600 text-sm whitespace-nowrap">
                    {s.currency} {s.defaultSlotPrice.toLocaleString()}
                  </span>
                  <p className="text-[10px] text-theme-tertiary">{durationLabel(s.billingCycle, s.durationMonths)}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mb-3 text-[11px] text-theme-secondary">
                <div className="flex items-center gap-1.5">
                  {s.platformLogo ? (
                    <img src={s.platformLogo} alt={s.platformName} className="w-4 h-4 rounded object-contain bg-theme-surface" />
                  ) : (
                    <CreditCard className="w-3.5 h-3.5 text-theme-tertiary" />
                  )}
                  <span>{s.platformName ?? 'Custom'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-theme-tertiary" />
                  <span>{durationLabel(s.billingCycle, s.durationMonths)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-theme-tertiary" />
                  <span className="font-medium text-theme-primary">{s.activeMembers}</span>
                </div>
              </div>
              <div className="pt-3 border-t border-theme-divider-light">
                <div className="flex items-center justify-between gap-3 text-[11px] mb-1.5">
                  <span className="font-medium text-theme-secondary">Capacity</span>
                  <span className="text-theme-tertiary font-medium">{s.occupiedSlots} / {s.totalCapacity}</span>
                </div>
                <div className="h-1.5 bg-theme-surface-hover rounded-full overflow-hidden w-full">
                  <div
                    className="h-full bg-[#5200FF]"
                    style={{ width: `${Math.min(100, (s.occupiedSlots / s.totalCapacity) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-2xl border border-theme-divider bg-theme-surface overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-theme-divider bg-theme-base/50">
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">Listing</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">Platform</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">Duration</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">Slot Price</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">Capacity</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">Members</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-theme-tertiary">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {subscriptions === undefined ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-3">
                      <div className="h-6 rounded bg-theme-surface-hover animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-theme-tertiary text-sm">
                    No subscriptions match your query
                  </td>
                </tr>
              ) : (
                filtered.map((s: any) => (
                  <tr key={s._id} className="hover:bg-theme-base transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-theme-primary">{s.name}</p>
                      <p className="text-[11px] text-theme-tertiary">{s.category}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {s.platformLogo ? (
                          <img src={s.platformLogo} alt={s.platformName} className="w-6 h-6 rounded object-contain bg-theme-surface" />
                        ) : (
                          <div className="w-6 h-6 rounded bg-theme-surface-hover flex items-center justify-center shrink-0">
                            <CreditCard className="w-3 h-3 text-theme-tertiary" />
                          </div>
                        )}
                        <span className="text-theme-secondary">{s.platformName ?? 'Custom'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#5E43F3]/10 text-[#5E43F3]">
                        <Calendar className="w-3 h-3" />
                        {durationLabel(s.billingCycle, s.durationMonths)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-emerald-600">
                        {s.currency} {s.defaultSlotPrice.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 bg-theme-surface-hover rounded-full overflow-hidden w-16">
                          <div
                            className="h-full bg-[#5200FF]"
                            style={{ width: `${Math.min(100, (s.occupiedSlots / s.totalCapacity) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-theme-tertiary">{s.occupiedSlots}/{s.totalCapacity}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-theme-secondary">
                        <Users className="w-3.5 h-3.5" />
                        {s.activeMembers}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        <Check className="w-3 h-3" /> Published
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Creation Modal ─────────────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-theme-surface rounded-3xl w-full max-w-lg overflow-hidden border border-theme-divider-light shadow-2xl p-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-theme-divider-light">
              <h3 className="text-lg font-black text-theme-primary">Create Subscription Offer</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-full hover:bg-theme-surface-hover text-theme-tertiary hover:text-theme-primary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-4">
              {/* Name */}
              <div>
                <label className="text-xs font-bold text-theme-tertiary uppercase tracking-wider block mb-1">
                  Subscription Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Spotify Premium Family Slot"
                  className="w-full bg-theme-base border border-theme-divider-light rounded-xl p-2.5 text-xs text-theme-primary font-semibold focus:outline-none focus:border-[#5E43F3]"
                />
              </div>

              {/* Platform + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-theme-tertiary uppercase tracking-wider block mb-1">Platform</label>
                  <select
                    value={formData.platformName}
                    onChange={(e) => {
                      const p = e.target.value;
                      let logo = formData.platformLogo;
                      if (p === 'Spotify')     logo = 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg';
                      if (p === 'Netflix')     logo = 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg';
                      if (p === 'Apple Music') logo = 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Apple_Music_logo.svg';
                      if (p === 'YouTube')     logo = 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg';
                      setFormData({ ...formData, platformName: p, platformLogo: logo });
                    }}
                    className="w-full bg-theme-base border border-theme-divider-light rounded-xl p-2.5 text-xs text-theme-primary font-semibold focus:outline-none focus:border-[#5E43F3]"
                  >
                    <option value="Spotify">Spotify</option>
                    <option value="Netflix">Netflix</option>
                    <option value="Apple Music">Apple Music</option>
                    <option value="YouTube">YouTube</option>
                    <option value="Software">Other Software</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-theme-tertiary uppercase tracking-wider block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-theme-base border border-theme-divider-light rounded-xl p-2.5 text-xs text-theme-primary font-semibold focus:outline-none focus:border-[#5E43F3]"
                  >
                    <option value="Music & Audio">Music & Audio</option>
                    <option value="Video & Streaming">Video & Streaming</option>
                    <option value="Movies & TV">Movies & TV</option>
                    <option value="Productivity & Utilities">Productivity & Utilities</option>
                  </select>
                </div>
              </div>

              {/* ── Duration Selection ─────────────────────────────────────── */}
              <div>
                <label className="text-xs font-bold text-theme-tertiary uppercase tracking-wider block mb-2">
                  Subscription Duration *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleBillingCycleChange(opt.value)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                        formData.billingCycle === opt.value
                          ? 'border-[#5E43F3] bg-[#5E43F3]/10 text-[#5E43F3] ring-2 ring-[#5E43F3]/20'
                          : 'border-theme-divider-light bg-theme-base text-theme-secondary hover:bg-theme-surface-hover'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5 mb-0.5" />
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[10px] text-theme-tertiary flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  The slot price below is the total amount charged for the full {durationLabel(formData.billingCycle, formData.durationMonths)} period — not a monthly rate.
                </p>
              </div>

              {/* Slot Price + Group Capacity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-theme-tertiary uppercase tracking-wider block mb-1">
                    Slot Price (₦) — {durationLabel(formData.billingCycle, formData.durationMonths)} Total *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.defaultSlotPrice}
                    onChange={(e) => setFormData({ ...formData, defaultSlotPrice: Number(e.target.value) })}
                    className="w-full bg-theme-base border border-theme-divider-light rounded-xl p-2.5 text-xs text-theme-primary font-semibold focus:outline-none focus:border-[#5E43F3]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-theme-tertiary uppercase tracking-wider block mb-1">
                    Group Capacity *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={20}
                    value={formData.totalCapacity}
                    onChange={(e) => setFormData({ ...formData, totalCapacity: Number(e.target.value) })}
                    className="w-full bg-theme-base border border-theme-divider-light rounded-xl p-2.5 text-xs text-theme-primary font-semibold focus:outline-none focus:border-[#5E43F3]"
                  />
                </div>
              </div>

              {/* Price summary */}
              <div className="bg-[#5E43F3]/5 border border-[#5E43F3]/15 rounded-xl px-4 py-3 text-xs text-[#5E43F3] font-semibold flex items-center justify-between">
                <span>Total charge per member</span>
                <span className="font-black text-base">₦{Number(formData.defaultSlotPrice).toLocaleString()}</span>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-theme-tertiary uppercase tracking-wider block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Offer benefits and summary..."
                  className="w-full bg-theme-base border border-theme-divider-light rounded-xl p-2.5 text-xs text-theme-primary font-semibold focus:outline-none focus:border-[#5E43F3]"
                />
              </div>

              {/* Footer Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-theme-divider-light">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-theme-divider-light hover:bg-theme-surface-hover text-xs font-bold text-theme-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white text-xs font-bold disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isSubmitting ? 'Publishing…' : 'Publish Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
