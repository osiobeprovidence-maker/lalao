import React, { useState } from 'react';
import {
  ArrowLeft,
  Coins,
  Wallet,
  ShoppingBag,
  Ticket,
  Users,
  Heart,
  TrendingUp,
  Building,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  HelpCircle,
  CreditCard,
  Lock,
  ChevronRight,
  Check,
} from 'lucide-react';
import { Page, PageMonetization } from '../../types';
import { useLalao } from '../../context/LalaoContext';

interface PageMonetizationModalProps {
  page: Page;
  isOpen: boolean;
  onClose: () => void;
  onOpenManageProducts?: () => void;
  onOpenCreateEvent?: () => void;
}

const NIGERIAN_BANKS = [
  'Zenith Bank',
  'Guaranty Trust Bank (GTBank)',
  'Access Bank',
  'First Bank of Nigeria',
  'United Bank for Africa (UBA)',
  'Kuda Microfinance Bank',
  'Moniepoint MFB',
  'OPay Digital Services',
  'Stanbic IBTC Bank',
  'Fidelity Bank',
];

export const PageMonetizationModal: React.FC<PageMonetizationModalProps> = ({
  page,
  isOpen,
  onClose,
  onOpenManageProducts,
  onOpenCreateEvent,
}) => {
  const { updatePageMonetization, triggerShareToast } = useLalao();

  const mon: PageMonetization = page.monetization || {
    enabled: true,
    sellProducts: page.type === 'business' || page.badge === 'BIZ',
    sellTickets: true,
    paidEvents: true,
    memberships: page.type === 'community' || page.type === 'organization' || page.type === 'club',
    membershipMonthlyFee: 3500,
    communitySupport: true,
    promotedPosts: false,
    totalEarnings: 185000,
    availableBalance: 95000,
    pendingPayout: 30000,
    payoutBank: {
      accountName: `${page.name} / Providence`,
      accountNumber: '0234819022',
      bankName: 'Zenith Bank',
      autoPayoutSchedule: 'weekly',
    },
  };

  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'payouts'>('overview');

  // Monetization feature toggles
  const [sellProducts, setSellProducts] = useState(mon.sellProducts ?? true);
  const [sellTickets, setSellTickets] = useState(mon.sellTickets ?? true);
  const [paidEvents, setPaidEvents] = useState(mon.paidEvents ?? true);
  const [memberships, setMemberships] = useState(mon.memberships ?? true);
  const [membershipFee, setMembershipFee] = useState(mon.membershipMonthlyFee || 3500);
  const [communitySupport, setCommunitySupport] = useState(mon.communitySupport ?? true);
  const [promotedPosts, setPromotedPosts] = useState(mon.promotedPosts ?? false);

  // Payout bank state
  const [bankName, setBankName] = useState(mon.payoutBank?.bankName || 'Zenith Bank');
  const [accountNumber, setAccountNumber] = useState(mon.payoutBank?.accountNumber || '0234819022');
  const [accountName, setAccountName] = useState(mon.payoutBank?.accountName || `${page.name}`);
  const [payoutSchedule, setPayoutSchedule] = useState<'weekly' | 'monthly' | 'manual'>(
    mon.payoutBank?.autoPayoutSchedule || 'weekly'
  );

  // Withdraw state
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('50000');

  if (!isOpen) return null;

  const isBusiness = page.type === 'business' || page.badge === 'BIZ';
  const isOrg = page.type === 'organization';
  const isCommunityOrClub = page.type === 'community' || page.type === 'club';

  const handleSaveSettings = () => {
    updatePageMonetization(page.id, {
      enabled: true,
      sellProducts,
      sellTickets,
      paidEvents,
      memberships,
      membershipMonthlyFee: Number(membershipFee) || 3500,
      communitySupport,
      promotedPosts,
      payoutBank: {
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        bankName,
        autoPayoutSchedule: payoutSchedule,
      },
    });
    triggerShareToast('Monetization settings saved!');
  };

  const handleRequestPayout = () => {
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0 || amt > mon.availableBalance) {
      triggerShareToast('Invalid withdrawal amount');
      return;
    }

    updatePageMonetization(page.id, {
      availableBalance: Math.max(0, mon.availableBalance - amt),
      pendingPayout: mon.pendingPayout + amt,
    });
    setIsWithdrawing(false);
    triggerShareToast(`Payout request of ₦${amt.toLocaleString()} initiated to ${bankName}!`);
  };

  return (
    <div className="absolute inset-0 z-50 bg-white overflow-y-auto flex flex-col animate-in fade-in slide-in-from-right-4 duration-250">
      {/* Top Sticky Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 sm:px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-neutral-100 text-neutral-800 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-neutral-950">Monetization & Payouts</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-medium truncate max-w-[180px] sm:max-w-md">
              @{page.username} · Earnings, channels & bank settings
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            handleSaveSettings();
            onClose();
          }}
          className="px-4 py-2 rounded-xl bg-[#5E43F3] text-white text-xs font-bold hover:bg-[#4E34E0] shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>Save</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="sticky top-[57px] bg-white border-b border-neutral-100 px-4 sm:px-6 flex items-center gap-2 z-10 shrink-0">
        <div className="w-full max-w-2xl mx-auto flex items-center">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === 'overview'
                ? 'text-[#5E43F3]'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <span>Overview & Earnings</span>
            {activeTab === 'overview' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5E43F3]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('features')}
            className={`py-3 px-3 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === 'features'
                ? 'text-[#5E43F3]'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <span>Monetization Channels</span>
            {activeTab === 'features' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5E43F3]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payouts')}
            className={`py-3 px-3 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === 'payouts'
                ? 'text-[#5E43F3]'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <span>Payout Settings</span>
            {activeTab === 'payouts' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5E43F3]" />
            )}
          </button>
        </div>
      </div>

      {/* Page Content Container */}
      <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 pb-24 flex-1">
        {/* TAB 1: OVERVIEW & EARNINGS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Financial Balance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900 text-white shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-400 text-xs">
                  <span>Available Balance</span>
                  <Wallet className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-3">
                  <p className="text-2xl sm:text-3xl font-black text-white">
                    ₦{mon.availableBalance.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-emerald-400 font-bold mt-0.5">
                    Ready for direct bank payout
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWithdrawing(true)}
                  disabled={mon.availableBalance <= 0}
                  className="mt-4 w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer text-center shadow-sm"
                >
                  Request Payout
                </button>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 border border-neutral-100 flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-500 text-xs">
                  <span>Total Gross Earnings</span>
                  <TrendingUp className="w-4 h-4 text-[#5E43F3]" />
                </div>
                <div className="mt-3">
                  <p className="text-2xl sm:text-3xl font-black text-neutral-900">
                    ₦{mon.totalEarnings.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Lifetime revenue generated
                  </p>
                </div>
                <div className="mt-4 text-[11px] text-[#5E43F3] font-bold flex items-center gap-1">
                  <span>+24.5% vs last month</span>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 border border-neutral-100 flex flex-col justify-between">
                <div className="flex items-center justify-between text-neutral-500 text-xs">
                  <span>Pending Payout</span>
                  <Coins className="w-4 h-4 text-amber-500" />
                </div>
                <div className="mt-3">
                  <p className="text-2xl sm:text-3xl font-black text-neutral-900">
                    ₦{mon.pendingPayout.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-amber-600 font-bold mt-0.5">
                    Processing to {mon.payoutBank?.bankName || 'Bank'}
                  </p>
                </div>
                <div className="mt-4 text-[11px] text-neutral-500">
                  Auto clears weekly
                </div>
              </div>
            </div>

            {/* Withdraw Modal Drawer Overlay if clicked */}
            {isWithdrawing && (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 animate-in fade-in space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                    Withdraw Earnings to Bank
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsWithdrawing(false)}
                    className="text-emerald-700 hover:text-emerald-950 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <p className="text-xs text-emerald-800">
                  Transfer funds directly to your configured payout account:{' '}
                  <strong>{mon.payoutBank?.bankName} ({mon.payoutBank?.accountNumber})</strong>
                </p>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-neutral-500">₦</span>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      max={mon.availableBalance}
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-white border border-emerald-300 text-sm font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(String(mon.availableBalance))}
                    className="px-3 py-2 rounded-xl bg-emerald-200/80 text-emerald-900 text-xs font-bold hover:bg-emerald-300 transition-colors cursor-pointer"
                  >
                    Max
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestPayout}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm transition-all cursor-pointer"
                  >
                    Confirm Payout
                  </button>
                </div>
              </div>
            )}

            {/* Revenue Streams Breakdown */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-500 mb-3">
                Revenue Breakdown by Stream
              </h4>
              <div className="space-y-2.5">
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-violet-100 text-[#5E43F3] flex items-center justify-center">
                      <Ticket className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-900">Event Tickets & Passes</p>
                      <p className="text-[11px] text-neutral-500">37 tickets sold across 2 events</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-neutral-950">₦125,000</span>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-900">Community Memberships</p>
                      <p className="text-[11px] text-neutral-500">12 recurring monthly subscribers</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-neutral-950">₦42,000</span>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center">
                      <Heart className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-900">Supporter Tips & Contributions</p>
                      <p className="text-[11px] text-neutral-500">Community love and direct tips</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-neutral-950">₦18,000</span>
                </div>
              </div>
            </div>

            {/* Recent Transaction Activity */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-500 mb-3">
                Recent Activity
              </h4>
              <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-2xl overflow-hidden bg-white">
                <div className="p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-neutral-900">Creator Meetup Pass (Tier 1)</p>
                    <p className="text-[10px] text-neutral-400">Purchased by @chidi_design · 2h ago</p>
                  </div>
                  <span className="font-black text-emerald-600">+₦3,500</span>
                </div>
                <div className="p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-neutral-900">Monthly Page Membership</p>
                    <p className="text-[10px] text-neutral-400">Subscription from @amina_k · Yesterday</p>
                  </div>
                  <span className="font-black text-emerald-600">+₦3,500</span>
                </div>
                <div className="p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-neutral-900">Supporter Tip</p>
                    <p className="text-[10px] text-neutral-400">Received from @tunde_vibe · 3 days ago</p>
                  </div>
                  <span className="font-black text-emerald-600">+₦5,000</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MONETIZATION CHANNELS */}
        {activeTab === 'features' && (
          <div className="space-y-4">
            <p className="text-xs text-neutral-500 leading-relaxed">
              Activate or configure the monetization channels appropriate for{' '}
              <strong className="text-neutral-900">{page.name}</strong> (
              {page.type.toUpperCase()}).
            </p>

            {/* 1. Sell Products (Primary for Business) */}
            {(isBusiness || page.badge === 'BIZ') && (
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 text-[#5E43F3] flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900">Storefront & Physical Products</h4>
                      <p className="text-xs text-neutral-500">Sell merchandise and catalog items directly on Page</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sellProducts}
                      onChange={(e) => setSellProducts(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5E43F3]" />
                  </label>
                </div>
                {sellProducts && onOpenManageProducts && (
                  <div className="pt-2 border-t border-neutral-200 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenManageProducts();
                      }}
                      className="text-xs font-bold text-[#5E43F3] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Manage Store Catalog</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 2. Event Tickets & Paid Attendance (For All) */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900">Event Tickets & QR Check-in Passes</h4>
                    <p className="text-xs text-neutral-500">Sell paid attendance tickets for meetups, tournaments & showcases</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sellTickets}
                    onChange={(e) => setSellTickets(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5E43F3]" />
                </label>
              </div>
              {sellTickets && onOpenCreateEvent && (
                <div className="pt-2 border-t border-neutral-200 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCreateEvent();
                    }}
                    className="text-xs font-bold text-[#5E43F3] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Create a Ticketed Event</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* 3. Page Memberships & Subscriptions (For Community / Org / Club) */}
            {(isCommunityOrClub || isOrg) && (
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900">Page Memberships / Subscriptions</h4>
                      <p className="text-xs text-neutral-500">Provide exclusive member badges, private chatrooms and priority passes</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={memberships}
                      onChange={(e) => setMemberships(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5E43F3]" />
                  </label>
                </div>

                {memberships && (
                  <div className="pt-2 border-t border-neutral-200 flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-700">Monthly Subscription Fee</span>
                    <div className="flex items-center gap-1.5 w-36">
                      <span className="text-xs font-bold text-neutral-500">₦</span>
                      <input
                        type="number"
                        value={membershipFee}
                        onChange={(e) => setMembershipFee(Number(e.target.value))}
                        step="500"
                        className="w-full px-2 py-1 rounded-lg border border-neutral-300 text-xs font-bold text-neutral-900 bg-white"
                      />
                      <span className="text-[10px] text-neutral-400">/mo</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. Community Support & Tips */}
            {(isCommunityOrClub || isOrg) && (
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
                      <Heart className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900">Community Support & Tips</h4>
                      <p className="text-xs text-neutral-500">Allow followers to send one-time tips or micro-contributions</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={communitySupport}
                      onChange={(e) => setCommunitySupport(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5E43F3]" />
                  </label>
                </div>
              </div>
            )}

            {/* 5. Promote Posts */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900">Post Promotions & Local Ads</h4>
                    <p className="text-xs text-neutral-500">Boost page announcements to nearby audiences in Delta State</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={promotedPosts}
                    onChange={(e) => setPromotedPosts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5E43F3]" />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PAYOUT SETTINGS */}
        {activeTab === 'payouts' && (
          <div className="space-y-5">
            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100 flex items-start gap-3">
              <Lock className="w-5 h-5 text-[#5E43F3] shrink-0 mt-0.5" />
              <div className="text-xs text-neutral-600 leading-relaxed">
                Payouts are settled directly to Nigerian Commercial & Fintech Banks in Nigerian Naira (NGN). Verification is instant via automated NUBAN lookup.
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Select Receiving Bank
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#5E43F3]"
                >
                  {NIGERIAN_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  10-Digit NUBAN Account Number
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="0234819022"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Account Beneficiary Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="DELTA CREATORS LAB / PROVIDENCE"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]"
                  />
                  <span className="absolute right-3 top-3 text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    VERIFIED
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Automatic Settlement Schedule
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'weekly', label: 'Every Friday (Weekly)' },
                    { id: 'monthly', label: 'End of Month' },
                    { id: 'manual', label: 'Manual on Demand' },
                  ].map((sch) => (
                    <button
                      key={sch.id}
                      type="button"
                      onClick={() => setPayoutSchedule(sch.id as any)}
                      className={`p-3 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                        payoutSchedule === sch.id
                          ? 'border-[#5E43F3] bg-violet-50 text-[#5E43F3]'
                          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      {sch.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Bar */}
        <div className="pt-6 border-t border-neutral-100 flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              handleSaveSettings();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-[#5E43F3] text-white text-xs font-bold hover:bg-[#4E34E0] shadow-md shadow-[#5E43F3]/25 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
