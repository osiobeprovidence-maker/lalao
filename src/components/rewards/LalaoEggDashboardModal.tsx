import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import {
  ArrowLeft,
  X,
  Smartphone,
  Wifi,
  Sparkles,
  Clock,
  MessageSquare,
  Users,
  UserPlus,
  TrendingUp,
  Gift,
  CheckCircle2,
  AlertCircle,
  Share2,
  Copy,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import { EggJarVisual } from './EggJarVisual';

interface LalaoEggDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
  roomName?: string;
}

const NETWORKS = [
  { id: 'MTN', name: 'MTN', color: 'from-amber-500 to-yellow-600' },
  { id: 'AIRTEL', name: 'Airtel', color: 'from-red-500 to-rose-600' },
  { id: 'GLO', name: 'Glo', color: 'from-emerald-500 to-green-600' },
  { id: '9MOBILE', name: '9mobile', color: 'from-teal-500 to-cyan-600' },
];

const AIRTIME_PLANS = [
  { id: 'airtime_100', amountNaira: 100, pointsCost: 1000, label: '₦100 Airtime' },
  { id: 'airtime_200', amountNaira: 200, pointsCost: 2000, label: '₦200 Airtime' },
  { id: 'airtime_500', amountNaira: 500, pointsCost: 5000, label: '₦500 Airtime' },
  { id: 'airtime_1000', amountNaira: 1000, pointsCost: 10000, label: '₦1,000 Airtime' },
];

const DATA_PLANS = [
  { id: 'data_100mb', amountNaira: 100, pointsCost: 1000, label: '100MB Daily Data' },
  { id: 'data_500mb', amountNaira: 250, pointsCost: 2500, label: '500MB 2-Day Data' },
  { id: 'data_1gb', amountNaira: 500, pointsCost: 5000, label: '1GB Weekly Data' },
  { id: 'data_2gb', amountNaira: 1000, pointsCost: 10000, label: '2GB Monthly Data' },
];

export const LalaoEggDashboardModal: React.FC<LalaoEggDashboardModalProps> = ({
  isOpen,
  onClose,
  roomId,
  roomName,
}) => {
  const { currentUser, triggerShareToast } = useLalao();

  const eggStatus = useQuery((api as any).egg.getMyEggStatus);
  const eggTransactions = useQuery((api as any).egg.getMyEggTransactions, { limit: 25 });
  const eggRedemptions = useQuery((api as any).egg.getMyEggRedemptions, { limit: 15 });
  const redeemEggReward = useMutation((api as any).egg.redeemEggReward);
  const ensureEggAccount = useMutation((api as any).egg.ensureEggAccount);

  // Create the egg account the first time the user opens this modal
  useEffect(() => {
    if (isOpen) {
      ensureEggAccount({}).catch(() => {/* silently ignore – account already exists */});
    }
  }, [isOpen, ensureEggAccount]);

  // Referral code query
  const myReferralCode = useQuery(api.rewards.getMyReferralCode);

  // Tabs: 'overview' | 'redeem' | 'history'
  const [activeTab, setActiveTab] = useState<'overview' | 'redeem' | 'history'>('overview');

  // Redemption Form State
  const [redemptionCategory, setRedemptionCategory] = useState<'airtime' | 'data'>('airtime');
  const [selectedNetwork, setSelectedNetwork] = useState('MTN');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phone || '');
  const [selectedPlanId, setSelectedPlanId] = useState('airtime_100');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redemptionFeedback, setRedemptionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const points = eggStatus?.availablePoints ?? 0;
  const nairaValue = eggStatus?.availableNairaValue ?? 0;
  const progressPercent = eggStatus?.progressPercent ?? 0;
  const timeProgressPercent = eggStatus?.timeProgressPercent ?? 0;
  const eggState = eggStatus?.eggState ?? 'empty';
  const qualifyingHours = ((eggStatus?.todayQualifyingSeconds ?? 0) / 3600).toFixed(1);

  // Handle Invitation Share
  const handleShareInvite = () => {
    const code = myReferralCode?.code || currentUser?.username || 'lalao';
    const inviteUrl = `${window.location.origin}/app?ref=${code}${roomId ? `&room=${roomId}` : ''}`;
    const shareText = `Join me in ${roomName || 'LaLao Chatrooms'}! Chat, make friends and fill your LaLao Egg jar to earn airtime & data rewards: ${inviteUrl}`;

    if (navigator.share) {
      navigator.share({
        title: 'Join me on LaLao',
        text: shareText,
        url: inviteUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      triggerShareToast('Room invite link copied to clipboard!');
    }
  };

  // Handle Reward Redemption
  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setRedemptionFeedback(null);

    const cleanPhone = phoneNumber.trim().replace(/\s+/g, '');
    if (!cleanPhone) {
      setRedemptionFeedback({ type: 'error', message: 'Please enter a recipient phone number.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const idempotencyKey = `egg-redemption-${currentUser?.id || 'usr'}-${Date.now()}`;
      const res = await redeemEggReward({
        category: redemptionCategory,
        network: selectedNetwork,
        phoneNumber: cleanPhone,
        planId: selectedPlanId,
        idempotencyKey,
      });

      if (res.success) {
        setRedemptionFeedback({
          type: 'success',
          message: res.isStaging
            ? `Redemption processed in Staging Test Mode! ₦${(AIRTIME_PLANS.find(p => p.id === selectedPlanId) || DATA_PLANS.find(p => p.id === selectedPlanId))?.amountNaira} ${redemptionCategory} credited to ${cleanPhone}.`
            : `Redemption submitted! Status: ${res.status}. Processing your ${redemptionCategory}.`,
        });
        setActiveTab('history');
      }
    } catch (err: any) {
      setRedemptionFeedback({
        type: 'error',
        message: err.message || 'Failed to process reward redemption. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const plans = redemptionCategory === 'airtime' ? AIRTIME_PLANS : DATA_PLANS;
  const currentPlan = plans.find((p) => p.id === selectedPlanId);

  return (
    <div
      id="lalao-egg-dashboard-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="lalao-egg-dashboard-container"
        className="bg-[#0B0F19] text-white w-full sm:max-w-md md:max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 relative z-10 overflow-hidden border-l border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Consistent with Lalao SidePanel Pattern */}
        <header className="px-5 py-4 border-b border-white/10 bg-[#0B0F19]/95 backdrop-blur-md sticky top-0 z-20 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 -ml-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                title="Back"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
              </button>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2 leading-tight">
                  <span className="bg-gradient-to-r from-cyan-400 via-[#818CF8] to-[#5E43F3] bg-clip-text text-transparent">
                    LaLao Egg
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#5E43F3]/25 text-cyan-300 border border-cyan-400/30">
                    Room Rewards
                  </span>
                </h2>
                <p className="text-[11px] text-neutral-400">
                  Participate, chat & earn airtime and data
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 mt-3 text-xs border-t border-white/5 pt-3">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-center ${
                activeTab === 'overview'
                  ? 'bg-[#5E43F3] text-white shadow-md shadow-[#5E43F3]/30'
                  : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              Egg Jar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('redeem')}
              className={`flex-1 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-center ${
                activeTab === 'redeem'
                  ? 'bg-[#5E43F3] text-white shadow-md shadow-[#5E43F3]/30'
                  : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              Redeem Rewards
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-center ${
                activeTab === 'history'
                  ? 'bg-[#5E43F3] text-white shadow-md shadow-[#5E43F3]/30'
                  : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              Ledger History
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {redemptionFeedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                redemptionFeedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {redemptionFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              )}
              <p className="flex-1 leading-relaxed">{redemptionFeedback.message}</p>
            </div>
          )}

          {/* ──────────────── TAB 1: OVERVIEW & EGG PROGRESS ──────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Egg Hero Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-b from-[#161B26] to-[#0E131F] border border-white/10 flex flex-col items-center relative overflow-hidden shadow-xl">
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-neutral-300">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" />
                  <span>Max ₦1,000 / day</span>
                </div>

                {/* Animated Egg Jar */}
                <EggJarVisual
                  progressPercent={progressPercent}
                  timePercent={timeProgressPercent}
                  points={points}
                  nairaValue={nairaValue}
                  eggState={eggState}
                  size="lg"
                  className="my-1"
                />

                {/* Daily Ceiling Tracker */}
                <div className="w-full mt-4 pt-4 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400 font-medium">Daily Reward Progress</span>
                    <span className="text-cyan-300 font-bold">₦{eggStatus?.todayNairaEarned ?? 0} / ₦{eggStatus?.dailyMaxNaira ?? 1000}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#5E43F3] via-indigo-500 to-cyan-400 transition-all duration-700"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Fast Action Buttons */}
                <div className="grid grid-cols-2 gap-2.5 w-full mt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('redeem')}
                    disabled={nairaValue < 100}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#5E43F3] to-indigo-600 hover:from-indigo-600 hover:to-[#5E43F3] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[#5E43F3]/25 transition-all cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Redeem ₦{nairaValue}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareInvite}
                    className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 border border-cyan-400/30 transition-all cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Invite Room Friends</span>
                  </button>
                </div>
              </div>

              {/* Daily Qualifying Activity Grid */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2.5 px-1">
                  Today's Qualifying Activity
                </h3>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3.5 rounded-2xl bg-[#161B26] border border-white/10 space-y-1">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-bold">Room Time</span>
                    </div>
                    <div className="text-lg font-black text-white">{qualifyingHours} hrs</div>
                    <p className="text-[10px] text-neutral-400">Target: 4.0 hrs active</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#161B26] border border-white/10 space-y-1">
                    <div className="flex items-center gap-2 text-[#818CF8]">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-xs font-bold">Messages</span>
                    </div>
                    <div className="text-lg font-black text-white">{eggStatus?.metrics?.messagesCount ?? 0}</div>
                    <p className="text-[10px] text-neutral-400">5 pts per room message</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#161B26] border border-white/10 space-y-1">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Users className="w-4 h-4" />
                      <span className="text-xs font-bold">Conversations</span>
                    </div>
                    <div className="text-lg font-black text-white">{eggStatus?.metrics?.conversationsCount ?? 0}</div>
                    <p className="text-[10px] text-neutral-400">25 pts per new member</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#161B26] border border-white/10 space-y-1">
                    <div className="flex items-center gap-2 text-amber-400">
                      <UserPlus className="w-4 h-4" />
                      <span className="text-xs font-bold">Room Invites</span>
                    </div>
                    <div className="text-lg font-black text-white">{eggStatus?.metrics?.referralsCount ?? 0}</div>
                    <p className="text-[10px] text-neutral-400">250 pts per invite</p>
                  </div>
                </div>
              </div>

              {/* Rules & Transparency Notice */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-neutral-300 space-y-1.5 leading-relaxed">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>How LaLao Egg works</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Your Egg accumulates points across all eligible rooms (Global, Gaming, Tech, Music). Private messages and spam do not qualify. Reaching active participation thresholds unlocks full daily redemption eligibility up to ₦1,000/day.
                </p>
              </div>
            </div>
          )}

          {/* ──────────────── TAB 2: REDEEM REWARDS ──────────────── */}
          {activeTab === 'redeem' && (
            <form onSubmit={handleRedeem} className="space-y-4">
              {/* Category Selector: Airtime vs Data */}
              <div className="grid grid-cols-2 gap-2 bg-[#161B26] p-1 rounded-2xl border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setRedemptionCategory('airtime');
                    setSelectedPlanId('airtime_100');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    redemptionCategory === 'airtime'
                      ? 'bg-[#5E43F3] text-white shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Airtime</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRedemptionCategory('data');
                    setSelectedPlanId('data_100mb');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    redemptionCategory === 'data'
                      ? 'bg-[#5E43F3] text-white shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Wifi className="w-4 h-4" />
                  <span>Mobile Data</span>
                </button>
              </div>

              {/* Network Selector */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-2">
                  Select Mobile Network
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {NETWORKS.map((net) => (
                    <button
                      key={net.id}
                      type="button"
                      onClick={() => setSelectedNetwork(net.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        selectedNetwork === net.id
                          ? 'bg-[#5E43F3]/20 border-cyan-400 text-white font-bold ring-1 ring-cyan-400/50'
                          : 'bg-[#161B26] border-white/10 text-neutral-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <span className="text-xs">{net.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone Number Input */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-2">
                  Recipient Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 08012345678"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#161B26] border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                  required
                />
              </div>

              {/* Plan Selection */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-2">
                  Choose {redemptionCategory === 'airtime' ? 'Airtime Amount' : 'Data Bundle'}
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {plans.map((p) => {
                    const canAfford = points >= p.pointsCost;
                    const isSelected = selectedPlanId === p.id;

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPlanId(p.id)}
                        disabled={!canAfford}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#5E43F3]/25 border-cyan-400 ring-1 ring-cyan-400/50'
                            : canAfford
                              ? 'bg-[#161B26] border-white/10 hover:border-white/25'
                              : 'bg-[#161B26]/50 border-white/5 opacity-40 cursor-not-allowed'
                        }`}
                      >
                        <div className="text-xs font-bold text-white">{p.label}</div>
                        <div className="flex items-center justify-between mt-1 text-[11px]">
                          <span className="text-cyan-300 font-mono">
                            {p.pointsCost.toLocaleString()} pts
                          </span>
                          {!canAfford && (
                            <span className="text-[9px] text-neutral-500">Need more pts</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Balance Summary Box */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                <div>
                  <span className="text-neutral-400 block text-[10px]">Your Redeemable Balance</span>
                  <span className="text-white font-bold text-sm">
                    {points.toLocaleString()} pts (₦{nairaValue})
                  </span>
                </div>
                {currentPlan && (
                  <div className="text-right">
                    <span className="text-neutral-400 block text-[10px]">Points After Redemption</span>
                    <span className="text-cyan-300 font-bold font-mono">
                      {Math.max(0, points - currentPlan.pointsCost).toLocaleString()} pts
                    </span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !currentPlan || points < (currentPlan?.pointsCost ?? 0)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#5E43F3] to-indigo-600 hover:from-indigo-600 hover:to-[#5E43F3] active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#5E43F3]/30 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Redemption...</span>
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4" />
                    <span>Confirm & Redeem {currentPlan?.label}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ──────────────── TAB 3: LEDGER ACTIVITY & REDEMPTIONS ──────────────── */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* Recent Redemptions */}
              {eggRedemptions && eggRedemptions.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 px-1">
                    Redemption Requests
                  </h3>
                  <div className="space-y-2">
                    {eggRedemptions.map((red: any) => (
                      <div
                        key={red._id}
                        className="p-3 rounded-2xl bg-[#161B26] border border-white/10 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#5E43F3]/20 flex items-center justify-center text-cyan-400">
                            {red.category === 'airtime' ? (
                              <Smartphone className="w-4 h-4" />
                            ) : (
                              <Wifi className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">
                              {red.packagePlan || `₦${red.amountNaira} ${red.category}`}
                            </h4>
                            <p className="text-[10px] text-neutral-400 font-mono">
                              {red.network} · {red.phoneNumber}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                              red.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : red.status === 'failed' || red.status === 'rejected'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {red.status}
                          </span>
                          <p className="text-[9px] text-neutral-500 mt-0.5">
                            {new Date(red.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Points Ledger Transactions */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 px-1">
                  Points Activity History
                </h3>
                {(!eggTransactions || eggTransactions.length === 0) ? (
                  <div className="p-8 text-center bg-[#161B26] rounded-2xl border border-white/10 space-y-2">
                    <Sparkles className="w-8 h-8 text-neutral-500 mx-auto" />
                    <p className="text-xs text-neutral-400">No egg transactions recorded yet.</p>
                    <p className="text-[11px] text-neutral-500">
                      Send a message in any room or invite a friend to start earning!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {eggTransactions.map((tx: any) => {
                      const isCredit = tx.points > 0;
                      return (
                        <div
                          key={tx._id}
                          className="p-3 rounded-2xl bg-[#161B26] border border-white/10 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                                isCredit
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              <TrendingUp
                                className={`w-3.5 h-3.5 ${!isCredit ? 'rotate-180' : ''}`}
                              />
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-white truncate">
                                {tx.description}
                              </h5>
                              <p className="text-[10px] text-neutral-400 font-mono">
                                {new Date(tx.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                                · {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`text-xs font-bold font-mono ${
                                isCredit ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {isCredit ? `+${tx.points}` : tx.points} pts
                            </span>
                            <span className="block text-[9px] text-neutral-400">
                              Bal: {tx.pointsAfter?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
