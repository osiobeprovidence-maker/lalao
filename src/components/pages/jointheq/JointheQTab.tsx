import React, { useState } from 'react';
import { Page } from '../../../types';
import { 
  Crown, Search, Plus, Filter, Users, ShieldCheck, Check, Clock, 
  ExternalLink, ChevronRight, Info, AlertCircle, Edit3, Settings, 
  Trash2, RefreshCw, Layers, DollarSign, ArrowUpRight
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useLalao } from '../../../context/LalaoContext';
import { useAuth } from '../../../context/AuthContext';

interface JointheQTabProps {
  page: Page;
}

type TabSection = 'discover' | 'my_subscriptions' | 'about' | 'admin_dashboard';

export const JointheQTab: React.FC<JointheQTabProps> = ({ page }) => {
  const { currentUser, setSelectedSubscriptionPlan, setIsSubscriptionCheckoutOpen, setIsWalletModalOpen, triggerShareToast } = useLalao();

  const [activeSection, setActiveSection] = useState<TabSection>('discover');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Admin capabilities check
  const isOwner = currentUser?.id === page.ownerId;
  const isSuperAdmin = (currentUser as any)?.role === 'super_admin' || (currentUser as any)?.role === 'admin';
  const pageMembers = useQuery(api.pages.getPageMembers, { pageId: page.id as any }) || [];
  const myMembership = pageMembers.find((m: any) => m.userId === currentUser?.id);
  const isPageManager = isOwner || isSuperAdmin || (myMembership && ['owner', 'admin', 'staff'].includes(myMembership.role));

  // Queries
  const catalogue = useQuery(api.subscriptions.getJointheQCatalogue, {
    category: selectedCategory === 'All' ? undefined : selectedCategory,
  }) || [];

  const mySubscriptions = useQuery(api.subscriptions.getMySubscriptions) || [];
  const adminOverview = useQuery(api.subscriptions.getJointheQAdminOverview, isPageManager ? { pageId: page.id as any } : 'skip');
  const adminMemberships = useQuery(api.subscriptions.getJointheQMembershipsList, isPageManager ? { pageId: page.id as any } : 'skip') || [];

  // Mutations
  const updateListing = useMutation(api.subscriptions.updateSubscriptionListing);
  const cancelRenewal = useMutation(api.subscriptions.cancelSubscriptionRenewal);

  const categories = ['All', 'Music & Audio', 'Video & Streaming', 'Movies & TV', 'Productivity & Utilities'];

  const filteredCatalogue = catalogue.filter((item: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.platformName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Navigation Sub-Tabs */}
      <div className="bg-theme-surface rounded-2xl p-1.5 border border-theme-divider-light flex items-center gap-1 overflow-x-auto shadow-xs">
        <button
          onClick={() => setActiveSection('discover')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSection === 'discover'
              ? 'bg-[#5E43F3] text-white shadow-sm'
              : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Discover</span>
        </button>

        <button
          onClick={() => setActiveSection('my_subscriptions')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSection === 'my_subscriptions'
              ? 'bg-[#5E43F3] text-white shadow-sm'
              : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover'
          }`}
        >
          <Crown className="w-3.5 h-3.5" />
          <span>My Subscriptions</span>
          {mySubscriptions.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeSection === 'my_subscriptions' ? 'bg-white text-[#5E43F3]' : 'bg-[#5E43F3]/10 text-[#5E43F3]'
            }`}>
              {mySubscriptions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSection('about')}
          className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSection === 'about'
              ? 'bg-[#5E43F3] text-white shadow-sm'
              : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>About</span>
        </button>

        {isPageManager && (
          <button
            onClick={() => setActiveSection('admin_dashboard')}
            className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSection === 'admin_dashboard'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Team Dashboard</span>
          </button>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 1: DISCOVER SUBSCRIPTIONS */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeSection === 'discover' && (
        <div className="space-y-5">
          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-[#5E43F3]/15 via-[#8A74F7]/10 to-transparent p-5 sm:p-6 rounded-3xl border border-[#5E43F3]/20 relative overflow-hidden">
            <div className="relative z-10 max-w-lg">
              <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#5E43F3] text-white mb-2 shadow-xs">
                Verified Shared Slots
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-theme-primary tracking-tight mb-2">
                Join Premium Subscriptions at a Fraction of the Cost
              </h3>
              <p className="text-xs sm:text-sm text-theme-secondary leading-relaxed mb-4">
                Spotify, Apple Music, Netflix, and YouTube Family memberships managed directly by the JointheQ team. Pay securely using Paystack or your Lalao Wallet.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsWalletModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-theme-surface border border-theme-divider-light text-xs font-bold text-theme-primary hover:bg-theme-surface-hover transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <DollarSign className="w-3.5 h-3.5 text-[#5E43F3]" />
                  <span>Check Wallet Balance</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-theme-tertiary" />
              <input
                type="text"
                placeholder="Search subscriptions (Spotify, Netflix, Apple...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-theme-surface border border-theme-divider-light rounded-xl pl-9 pr-4 py-2.5 text-xs text-theme-primary focus:outline-none focus:border-[#5E43F3] transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-theme-inverse text-theme-text-inverse'
                      : 'bg-theme-surface hover:bg-theme-surface-hover text-theme-secondary border border-theme-divider-light'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Subscription Listings Grid */}
          {filteredCatalogue.length === 0 ? (
            <div className="p-12 text-center bg-theme-surface rounded-2xl border border-theme-divider-light">
              <div className="w-12 h-12 rounded-full bg-theme-surface-hover text-theme-tertiary flex items-center justify-center mx-auto mb-3">
                <Crown className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-theme-primary mb-1">No subscriptions found</h4>
              <p className="text-xs text-theme-tertiary max-w-sm mx-auto">
                No matching subscription services are currently open for new members.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCatalogue.map((listing: any) => {
                const isFull = listing.availableSlots === 0;

                return (
                  <div
                    key={listing._id}
                    className="bg-theme-surface rounded-3xl border border-theme-divider-light p-5 hover:border-[#5E43F3]/30 transition-all flex flex-col justify-between shadow-xs hover:shadow-md"
                  >
                    <div>
                      {/* Card Top */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-theme-surface-hover border border-theme-divider-light flex items-center justify-center shrink-0 overflow-hidden p-2">
                            {listing.platformLogo ? (
                              <img src={listing.platformLogo} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                              <Crown className="w-6 h-6 text-[#5E43F3]" />
                            )}
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-theme-tertiary">
                              {listing.category}
                            </span>
                            <h4 className="text-base font-black text-theme-primary leading-tight">
                              {listing.name}
                            </h4>
                          </div>
                        </div>

                        {/* Availability Pill */}
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase whitespace-nowrap ${
                          isFull
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                        }`}>
                          {isFull ? 'Group Full' : `${listing.availableSlots} Slots Left`}
                        </span>
                      </div>

                      <p className="text-xs text-theme-secondary line-clamp-2 mb-4 leading-relaxed">
                        {listing.description}
                      </p>

                      {/* Benefits preview */}
                      {listing.benefits && listing.benefits.length > 0 && (
                        <div className="space-y-1.5 mb-5 bg-theme-base p-3 rounded-2xl border border-theme-divider-light">
                          {listing.benefits.slice(0, 3).map((b: string, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-theme-secondary">
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span className="truncate">{b}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom Pricing & CTA */}
                    <div className="pt-3 border-t border-theme-divider-light flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-theme-tertiary uppercase tracking-wider block">
                          {listing.durationMonths === 3 ? '3-Month Price' :
                           listing.durationMonths === 6 ? '6-Month Price' :
                           listing.durationMonths === 12 ? '12-Month Price' :
                           listing.billingCycle === '3_months' || listing.billingCycle === 'quarterly' ? '3-Month Price' :
                           listing.billingCycle === '6_months' ? '6-Month Price' :
                           listing.billingCycle === '12_months' || listing.billingCycle === 'yearly' ? '12-Month Price' :
                           'Slot Price'}
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-black text-theme-primary">
                            ₦{listing.defaultSlotPrice.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-theme-tertiary font-bold">
                            / {listing.durationMonths === 3 ? '3 mo' :
                               listing.durationMonths === 6 ? '6 mo' :
                               listing.durationMonths === 12 ? 'year' :
                               listing.billingCycle === '3_months' || listing.billingCycle === 'quarterly' ? '3 mo' :
                               listing.billingCycle === '6_months' ? '6 mo' :
                               listing.billingCycle === '12_months' || listing.billingCycle === 'yearly' ? 'year' :
                               'mo'}
                          </span>
                        </div>
                      </div>

                      <button
                        disabled={isFull}
                        onClick={() => {
                          setSelectedSubscriptionPlan(listing);
                          setIsSubscriptionCheckoutOpen(true);
                        }}
                        className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5 ${
                          isFull
                            ? 'bg-theme-surface-hover text-theme-tertiary cursor-not-allowed shadow-none'
                            : 'bg-[#5E43F3] text-white hover:bg-[#4E34E0] active:scale-95 shadow-[#5E43F3]/20'
                        }`}
                      >
                        <span>{isFull ? 'Waitlist Only' : 'Join Subscription'}</span>
                        {!isFull && <ArrowUpRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 2: MY SUBSCRIPTIONS */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeSection === 'my_subscriptions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-theme-primary">Your Subscribed Services</h3>
            <span className="text-xs font-bold text-theme-tertiary">{mySubscriptions.length} active memberships</span>
          </div>

          {mySubscriptions.length === 0 ? (
            <div className="p-12 text-center bg-theme-surface rounded-2xl border border-theme-divider-light">
              <Crown className="w-10 h-10 text-theme-tertiary mx-auto mb-2" />
              <h4 className="text-sm font-bold text-theme-primary mb-1">No Active Subscriptions</h4>
              <p className="text-xs text-theme-tertiary max-w-sm mx-auto mb-4">
                You haven't joined any subscription groups yet. Explore available services to get started.
              </p>
              <button
                onClick={() => setActiveSection('discover')}
                className="px-4 py-2 bg-[#5E43F3] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Browse Subscriptions
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {mySubscriptions.map((mem: any) => {
                const sub = mem.subscription;
                return (
                  <div
                    key={mem._id}
                    className="bg-theme-surface rounded-2xl border border-theme-divider-light p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-theme-surface-hover border border-theme-divider-light flex items-center justify-center shrink-0 p-2">
                        {sub?.platformLogo ? (
                          <img src={sub.platformLogo} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <Crown className="w-6 h-6 text-[#5E43F3]" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-theme-primary">{sub?.name || 'Subscription'}</h4>
                        <div className="flex items-center gap-2 text-xs text-theme-tertiary font-medium mt-0.5">
                          <span>Slot {mem.slot?.slotNumber || 1}</span>
                          <span>•</span>
                          <span>₦{(mem.amount || sub?.defaultSlotPrice || 0).toLocaleString()} / {
                            (sub?.durationMonths === 3 || sub?.billingCycle === '3_months' || sub?.billingCycle === 'quarterly') ? '3 mo' :
                            (sub?.durationMonths === 6 || sub?.billingCycle === '6_months') ? '6 mo' :
                            (sub?.durationMonths === 12 || sub?.billingCycle === '12_months' || sub?.billingCycle === 'yearly') ? 'yr' :
                            'mo'
                          }</span>
                          <span>•</span>
                          <span className="text-[#5E43F3] font-bold">Renews {new Date(mem.nextRenewalDate || Date.now()).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        mem.status === 'active' && !mem.cancelAtPeriodEnd
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {mem.cancelAtPeriodEnd ? 'Cancelling at cycle end' : 'Active'}
                      </span>

                      {!mem.cancelAtPeriodEnd && (
                        <button
                          onClick={async () => {
                            if (confirm(`Cancel auto-renewal for ${sub?.name}?`)) {
                              await cancelRenewal({ membershipId: mem._id });
                              triggerShareToast('Auto-renewal cancelled.');
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          Cancel Renewal
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 3: ABOUT JOINTHEQ */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeSection === 'about' && (
        <div className="space-y-4">
          <div className="bg-theme-surface rounded-3xl p-6 border border-theme-divider-light space-y-4">
            <h3 className="text-lg font-black text-theme-primary flex items-center gap-2">
              <Info className="w-5 h-5 text-[#5E43F3]" />
              About JointheQ on LaLao
            </h3>
            <p className="text-xs sm:text-sm text-theme-secondary leading-relaxed">
              JointheQ is an official subscription management service on LaLao. We coordinate verified family and group plans for premium digital entertainment services such as Spotify, Apple Music, Netflix, and YouTube Premium.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-theme-base p-4 rounded-2xl border border-theme-divider-light space-y-1.5">
                <h5 className="font-bold text-xs text-theme-primary flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Independent Personal Accounts
                </h5>
                <p className="text-[11px] text-theme-secondary leading-relaxed">
                  For Spotify, Apple Music, and YouTube, you use your own private email. Your playlists, history, and algorithms remain strictly yours.
                </p>
              </div>

              <div className="bg-theme-base p-4 rounded-2xl border border-theme-divider-light space-y-1.5">
                <h5 className="font-bold text-xs text-theme-primary flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#5E43F3]" />
                  Dual Payment Methods
                </h5>
                <p className="text-[11px] text-theme-secondary leading-relaxed">
                  Pay instantly using your Lalao Wallet points (1 LC = ₦1) or directly with credit/debit cards via Paystack.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-theme-divider-light text-xs text-theme-tertiary">
              For support or group assistance, message the JointheQ team directly through the Page Messages tab.
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SECTION 4: JOINTHEQ TEAM MANAGEMENT DASHBOARD (Admin Only) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeSection === 'admin_dashboard' && isPageManager && (
        <div className="space-y-6">
          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-theme-surface p-4 rounded-2xl border border-theme-divider-light">
              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-tertiary">Active Members</span>
              <div className="text-2xl font-black text-theme-primary mt-1">{adminOverview?.totalActiveMemberships ?? 0}</div>
              <span className="text-[10px] text-theme-tertiary">Paid subscription slots</span>
            </div>

            <div className="bg-theme-surface p-4 rounded-2xl border border-theme-divider-light">
              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-tertiary">Total Capacity</span>
              <div className="text-2xl font-black text-theme-primary mt-1">{adminOverview?.totalCapacity ?? 0}</div>
              <span className="text-[10px] text-emerald-600 font-bold">{adminOverview?.totalAvailableSlots ?? 0} slots available</span>
            </div>

            <div className="bg-theme-surface p-4 rounded-2xl border border-theme-divider-light">
              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-tertiary">Monthly Revenue</span>
              <div className="text-2xl font-black text-[#5E43F3] mt-1">₦{(adminOverview?.monthlyRevenue ?? 0).toLocaleString()}</div>
              <span className="text-[10px] text-theme-tertiary">Authoritative monthly run-rate</span>
            </div>

            <div className="bg-theme-surface p-4 rounded-2xl border border-theme-divider-light">
              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-tertiary">Page Followers</span>
              <div className="text-2xl font-black text-theme-primary mt-1">{adminOverview?.totalPageFollowers ?? 0}</div>
              <span className="text-[10px] text-theme-tertiary">Followers / potential subscribers</span>
            </div>
          </div>

          {/* Member Roster Table */}
          <div className="bg-theme-surface rounded-2xl border border-theme-divider-light overflow-hidden shadow-xs">
            <div className="p-4 border-b border-theme-divider-light flex items-center justify-between">
              <h4 className="text-xs font-bold text-theme-primary uppercase tracking-wider">
                Subscription Members Roster
              </h4>
              <span className="text-xs font-bold text-theme-tertiary">{adminMemberships.length} recorded</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-theme-base border-b border-theme-divider-light text-[10px] font-bold text-theme-tertiary uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Subscription</th>
                    <th className="py-3 px-4">Slot</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Renews</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-divider-light">
                  {adminMemberships.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-theme-tertiary">
                        No members recorded yet.
                      </td>
                    </tr>
                  ) : (
                    adminMemberships.map((m: any) => (
                      <tr key={m._id} className="hover:bg-theme-base/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-theme-primary">{m.memberUser?.name || 'User'}</div>
                          <div className="text-[10px] text-theme-tertiary">@{m.memberUser?.username}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-theme-secondary">{m.subscriptionName}</td>
                        <td className="py-3 px-4 font-bold text-theme-primary">Slot {m.slotNumber}</td>
                        <td className="py-3 px-4 capitalize font-medium text-theme-secondary">{m.paymentMethod || 'Wallet'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            m.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-theme-tertiary">
                          {m.nextRenewalDate ? new Date(m.nextRenewalDate).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
