import React, { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLalao } from '../../context/LalaoContext';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft, Copy, Share2, Phone, Smartphone, Gift, CreditCard, Star,
  CheckCircle, AlertCircle, Loader2, ChevronRight, ExternalLink, RefreshCw,
  TrendingUp, Wallet, History, RefreshCw as RefreshIcon, X
} from 'lucide-react';

interface RewardsPageProps {
  /** Render inside another surface (e.g. the wallet modal) without page chrome. */
  embedded?: boolean;
  /** Optional custom back handler used by the embedded header. */
  onBack?: () => void;
}

export const RewardsPage: React.FC<RewardsPageProps> = ({ embedded = false, onBack }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { triggerShareToast } = useLalao();
  const { isAuthenticated } = useAuth();

  const rewardBalance = useQuery(api.rewards.getUserRewardBalance);
  const rewardCatalogue = useQuery(api.rewards.getRewardCatalogue);
  const rewardRedemptions = useQuery(api.rewards.getUserRewardRedemptions, { limit: 50 });
  const referralCode = useQuery(api.rewards.getUserReferralCode);
  const referralRelationships = useQuery(api.rewards.getReferralRelationships);

  const claimReward = useMutation(api.rewards.claimReward);
  const ensureRewardsReady = useMutation(api.rewards.ensureRewardsReady);
  const ensureMyReferralCode = useMutation(api.rewards.ensureMyReferralCode);

  // Queries resolve asynchronously; history rendering must tolerate `undefined`.
  const redemptions: any[] = rewardRedemptions ?? [];
  const isRedemptionsLoading = rewardRedemptions === undefined;

  const [activeSection, setActiveSection] = useState<'balance' | 'rewards' | 'history' | 'referral'>('balance');
  const [isClaiming, setIsClaiming] = useState<string | null>(null); // rewardId being claimed
  const [claimModal, setClaimModal] = useState<{ reward: any; pointsCost: number } | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleClaim = async (reward: any) => {
    if (isClaiming === reward._id) return;
    setIsClaiming(reward._id);

    if (!rewardBalance) {
      setIsClaiming(null);
      return;
    }

    if (rewardBalance.availablePoints < reward.pointsCost) {
      setClaimModal(null);
      setIsClaiming(null);
      setToastMessage({ text: `Insufficient points. You have ${rewardBalance.availablePoints} points, need ${reward.pointsCost}.`, type: 'error' });
      return;
    }

    setClaimModal({ reward, pointsCost: reward.pointsCost });
    setIsClaiming(null);
  };

  const handleConfirmClaim = async () => {
    if (!claimModal) return;
    setIsClaiming(claimModal.reward._id);

    const idempotencyKey = `redeem_${claimModal.reward._id}_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    try {
      const result = await claimReward({
        rewardId: claimModal.reward._id,
        idempotencyKey,
      });

      setClaimModal(null);
      setIsClaiming(null);

      if (result.success) {
        setToastMessage({ text: `Redeemed ${claimModal.reward.name}! ${rewardBalance?.availablePoints - claimModal.pointsCost} points remaining.`, type: 'success' });
        setActiveSection('rewards');
      } else {
        setToastMessage({ text: result.message || 'Redemption failed. Please try again.', type: 'error' });
      }
    } catch (err: any) {
      setIsClaiming(null);
      setClaimModal(null);
      setToastMessage({ text: err.message || 'Redemption failed. Please try again.', type: 'error' });
    }
  };

  const handleCopyCode = async () => {
    if (!referralCode?.code) return;
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(referralCode.code);
      setToastMessage({ text: 'Referral code copied to clipboard', type: 'success' });
    } catch {
      setToastMessage({ text: 'Failed to copy code', type: 'error' });
    } finally {
      setIsCopying(false);
    }
  };

  const handleShareReferral = () => {
    const code = referralCode?.code || '';
    if (!code) {
      setToastMessage({ text: 'Your referral code is still being created. Try again in a moment.', type: 'error' });
      return;
    }
    const shareUrl = `${window.location.origin}/referral/${code}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join LaLao with my referral code',
        text: `Use my referral code ${code} to join LaLao and earn rewards!`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setToastMessage({ text: 'Referral link copied to clipboard', type: 'success' });
      }).catch(() => {
        setToastMessage({ text: 'Could not copy the referral link.', type: 'error' });
      });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const pointsEarned = rewardBalance?.totalEarned || 0;
  const pointsRedeemed = rewardBalance?.totalRedeemed || 0;

  // Dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Seed default earning rules and make sure the user has a referral code.
  useEffect(() => {
    if (!isAuthenticated) return;
    ensureRewardsReady({}).catch(() => {});
    if (referralCode !== undefined && !referralCode?.code) {
      ensureMyReferralCode({}).catch(() => {});
    }
  }, [isAuthenticated, referralCode, ensureRewardsReady, ensureMyReferralCode]);

  if (!rewardBalance) {
    if (!isAuthenticated) {
      return (
        <div className={embedded ? "flex items-center justify-center py-16 px-6" : "min-h-screen bg-theme-base flex items-center justify-center px-6"}>
          <div className="w-full max-w-sm text-center bg-theme-surface border border-theme-divider rounded-3xl p-8">
            <Gift className="w-10 h-10 text-[#5E43F3] mx-auto mb-4" />
            <h2 className="text-lg font-black text-theme-primary mb-2">Sign in to see your rewards</h2>
            <p className="text-sm text-theme-secondary mb-6">
              Earn points every time you shop, then redeem them for airtime, data and more.
            </p>
            <button
              onClick={() => {
                if (embedded) {
                  onBack?.();
                  return;
                }
                navigate('/login', { state: { from: '/rewards' } });
              }}
              className="w-full py-3 rounded-full bg-[#5E43F3] text-white font-bold hover:bg-[#4E34E0] transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={() => {
                if (embedded) {
                  onBack?.();
                  return;
                }
                navigate('/app');
              }}
              className="mt-3 w-full py-3 rounded-full bg-theme-surface-hover text-theme-primary font-bold hover:bg-theme-surface-active transition-colors"
            >
              Back to feed
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={embedded ? "flex items-center justify-center py-16" : "min-h-screen bg-theme-base flex items-center justify-center"}>
        <Loader2 className="w-8 h-8 text-[#5E43F3] animate-spin" />
      </div>
    );
  }

  return (
    <div className={embedded ? "text-theme-primary" : "min-h-screen bg-theme-base text-theme-primary"}>
      {/* Toast */}
      {toastMessage && (
        <div
          className={`fixed left-1/2 -translate-x-1/2 z-[130] px-4 py-3 rounded-full flex items-center gap-2 shadow-xl animate-in fade-in slide-in-from-top-2 ${embedded ? 'top-20' : 'top-4'}`}
          style={{
            backgroundColor:
              toastMessage.type === "success" ? "rgba(16, 185, 129, 0.9)" : "rgba(239, 68, 68, 0.9)",
            color: "#ffffff",
          }}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span className="text-sm font-semibold">{toastMessage.text}</span>
        </div>
      )}

      <div className={embedded ? "p-4 pb-10" : "max-w-[700px] mx-auto p-4 sm:p-6 lg:p-8 pb-24"}>
        {/* Header (page only — embedded surfaces supply their own) */}
        {!embedded && (
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate(location.state?.from || '/app')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-theme-surface-hover hover:bg-theme-surface-active transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-theme-primary" />
            </button>
            <h1 className="text-2xl font-black text-theme-primary tracking-tight">Rewards</h1>
            <div className="w-10 h-10" />
          </div>
        )}

        {/* Embedded section nav */}
        {embedded && (
          <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none">
            {(
              [
                { id: 'balance', label: 'Overview' },
                { id: 'rewards', label: 'Redeem' },
                { id: 'history', label: 'History' },
                { id: 'referral', label: 'Refer & Earn' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  activeSection === tab.id
                    ? 'bg-[#5E43F3] text-white shadow-sm'
                    : 'bg-theme-surface border border-theme-divider-light text-theme-secondary hover:bg-theme-surface-hover'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Points Balance Card */}
        <div className="bg-[#5E43F3] rounded-3xl p-6 shadow-lg relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#4E34E0]/30 rounded-full blur-3xl -mt-10 -mr-10" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-white tracking-tight">LaLao Reward Points</h2>
                <p className="text-white/70 text-sm">Earn 1 point for every $1 spent</p>
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <span className="text-white text-xs font-bold uppercase tracking-wider">
                  {rewardBalance.availablePoints >= 1000 ? 'VIP' : rewardBalance.availablePoints >= 500 ? 'Gold' : 'Member'}
                </span>
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-5xl font-black text-white tracking-tighter">
                {rewardBalance.availablePoints.toLocaleString()}
              </span>
              <span className="text-white/80 text-sm font-bold">points</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-white/80 text-xs font-bold mt-4">
              <div className="flex items-center gap-1">
                <span className="text-emerald-400">+</span>
                <span>{rewardBalance.totalEarned.toLocaleString()} earned</span>
              </div>
              <div className="flex items-center gap-1 text-rose-400">
                <span>-</span>
                <span>{rewardBalance.totalRedeemed.toLocaleString()} redeemed</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-white/10 rounded-xl border border-white/20">
              <div className="flex items-center justify-between text-xs text-white/70 mb-1">
                <span>Available points</span>
                <span className="text-white font-bold">{rewardBalance.availablePoints.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-white/70">
                <span>Pending points</span>
                <span className="text-white font-bold">{rewardBalance.pendingPoints.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shortcuts (page only — embedded uses the tab nav above) */}
        {!embedded && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          <button
            onClick={() => setActiveSection('referral')}
            className="bg-theme-surface border border-theme-divider-light rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-theme-surface-hover transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-[#5E43F3]/10 flex items-center justify-center text-[#5E43F3] group-hover:bg-[#5E43F3]/20 transition-colors">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-theme-primary">Refer &amp; Earn</span>
          </button>
          <button
            onClick={() => setActiveSection('rewards')}
            className="bg-theme-surface border border-theme-divider-light rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-theme-surface-hover transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-[#5E43F3]/10 flex items-center justify-center text-[#5E43F3] group-hover:bg-[#5E43F3]/20 transition-colors">
              <Gift className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-theme-primary">Claim Rewards</span>
          </button>
          <button
            onClick={() => setActiveSection('history')}
            className="bg-theme-surface border border-theme-divider-light rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-theme-surface-hover transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-[#5E43F3]/10 flex items-center justify-center text-[#5E43F3] group-hover:bg-[#5E43F3]/20 transition-colors">
              <History className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-theme-primary">Rewards History</span>
          </button>
        </div>
        )}

        {/* Balance Section */}
        {activeSection === 'balance' && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-theme-primary mb-4">Your Reward Points</h3>
            <div className="bg-theme-surface rounded-2xl p-6 border border-theme-divider-light shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-theme-tertiary text-sm">Available Points</span>
                  <span className="text-xl font-black text-theme-primary">{rewardBalance.availablePoints.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-theme-tertiary text-sm">Pending Points</span>
                  <span className="text-xl font-black text-theme-secondary">{rewardBalance.pendingPoints.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-theme-divider-light">
                  <span className="text-theme-tertiary text-sm">Lifetime Points</span>
                  <span className="text-xl font-black text-theme-primary">{rewardBalance.lifetimePoints.toLocaleString()}</span>
                </div>
                <div className="pt-2 text-xs text-theme-secondary">
                  Earn 1 reward point for every eligible $1 spent. Points are credited to your balance after successful purchases.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rewards Catalogue Section */}
        {activeSection === 'rewards' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-theme-primary">Available Rewards</h3>
            </div>
            {rewardCatalogue?.length === 0 ? (
              <div className="bg-theme-surface rounded-2xl p-8 border border-theme-divider-light text-center">
                <Gift className="w-12 h-12 text-theme-tertiary mx-auto mb-3" />
                <h4 className="font-bold text-theme-primary mb-1">No rewards available</h4>
                <p className="text-theme-tertiary text-sm">Check back soon for new reward options.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rewardCatalogue.map((reward: any) => {
                  const isAvailable = reward.status === 'active' &&
                    (!reward.availabilityStart || Date.now() >= reward.availabilityStart) &&
                    (!reward.availabilityEnd || Date.now() <= reward.availabilityEnd) &&
                    (!reward.stockLimit || (reward.stockRemaining ?? 0) > 0);
                  const hasEnoughPoints = rewardBalance.availablePoints >= reward.pointsCost;

                  return (
                    <div
                      key={reward._id}
                      className={`bg-theme-surface rounded-2xl p-5 border border-theme-divider-light shadow-sm hover:border-[#5E43F3]/40 transition-colors ${isAvailable && hasEnoughPoints ? 'bg-[#5E43F3]/05' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {reward.type === 'gift_card' && <Gift className="w-5 h-5 text-[#5E43F3]" />}
                          {reward.type === 'airtime' && <Phone className="w-5 h-5 text-[#5E43F3]" />}
                          {reward.type === 'data_bundle' && <Smartphone className="w-5 h-5 text-[#5E43F3]" />}
                          {reward.type === 'voucher' && <CreditCard className="w-5 h-5 text-[#5E43F3]" />}
                          {reward.type === 'partner_offer' && <Star className="w-5 h-5 text-[#5E43F3]" />}
                          {reward.type === 'other' && <Wallet className="w-5 h-5 text-theme-tertiary" />}
                          <span className="font-bold text-theme-primary">{reward.name}</span>
                        </div>
                        <span className="text-xs font-bold bg-[#5E43F3]/10 text-[#5E43F3] px-2 py-0.5 rounded-full">
                          {reward.pointsCost} pts
                        </span>
                      </div>
                      <p className="text-theme-secondary text-sm mb-4 line-clamp-2">{reward.description}</p>
                      <div className="flex items-center justify-between pt-3 border-t border-theme-divider-light">
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${!isAvailable ? 'text-rose-500' : 'text-theme-tertiary'}`}>
                          {!isAvailable ? 'Unavailable' : !hasEnoughPoints ? 'Insufficient points' : 'Available'}
                        </span>
                        {!isAvailable || !hasEnoughPoints ? (
                          <button
                            disabled={true}
                            className="w-full py-2 rounded-xl bg-theme-surface/50 text-theme-tertiary text-xs font-bold cursor-not-allowed"
                          >
                            Claim
                          </button>
                        ) : (
                          <button
                            onClick={() => handleClaim(reward)}
                            disabled={isClaiming === reward._id}
                            className="w-full py-2 rounded-xl bg-[#5E43F3] text-white text-xs font-bold hover:bg-[#4E34E0] transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-1"
                          >
                            {isClaiming === reward._id ? <Loader2 className="w-3 h-3 text-white" /> : <span>Claim</span>}
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

        {/* Rewards History Section */}
        {activeSection === 'history' && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-theme-primary">Rewards History</h3>
            </div>
            {isRedemptionsLoading ? (
              <div className="bg-theme-surface rounded-2xl p-8 border border-theme-divider-light text-center">
                <Loader2 className="w-6 h-6 animate-spin text-theme-tertiary mx-auto" />
                <p className="text-theme-tertiary text-sm mt-3">Loading your rewards history…</p>
              </div>
            ) : redemptions.length === 0 && rewardTransactionsEmpty(rewardBalance) ? (
              <div className="bg-theme-surface rounded-2xl p-8 border border-theme-divider-light text-center">
                <History className="w-12 h-12 text-theme-tertiary mx-auto mb-3" />
                <h4 className="font-bold text-theme-primary mb-1">No rewards activity yet</h4>
                <p className="text-theme-tertiary text-sm">Your reward earning and redemption history will appear here.</p>
              </div>
            ) : (
              <div className="bg-theme-surface rounded-2xl border border-theme-divider-light shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-theme-divider-light bg-theme-surface/50">
                        <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-theme-tertiary">Description</th>
                        <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-theme-tertiary">Date</th>
                        <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-theme-tertiary text-right">Points</th>
                        <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-theme-tertiary">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-divider-light">
                      {redemptions.map((r: any) => {
                        const points = typeof r.amount === 'number' ? r.amount : r.pointsCost;
                        const statusLabel =
                          r.status === 'fulfilled' ? 'Delivered'
                          : r.status === 'approved' ? 'Approved'
                          : r.status === 'pending' ? 'Pending'
                          : r.status === 'rejected' ? 'Rejected'
                          : 'Cancelled';
                        return (
                        <tr key={r._id} className="hover:bg-theme-surface-hover transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-rose-400">-</span>
                              <span className="font-medium text-theme-primary">{r.rewardName || r.description}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-theme-secondary text-sm">{formatDate(r.createdAt)}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-sm">
                            <span className="text-rose-600">
                              -{Number(points ?? 0).toLocaleString()} pts
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.status === 'fulfilled'
                                ? 'bg-emerald-100 text-emerald-700'
                                : r.status === 'approved'
                                ? 'bg-sky-100 text-sky-700'
                                : r.status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}>
                              {statusLabel}
                            </span>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Referral Section */}
        {activeSection === 'referral' && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-theme-primary mb-4">Refer &amp; Earn</h3>
            <div className="bg-theme-surface rounded-3xl p-6 border border-theme-divider-light shadow-sm">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="font-black text-2xl text-theme-primary">{referralCode?.code || 'LALAO....'}</span>
                  <button
                    onClick={handleCopyCode}
                    disabled={isCopying}
                    className="w-8 h-8 rounded-full bg-[#5E43F3]/10 flex items-center justify-center text-[#5E43F3] hover:bg-[#5E43F3]/20 transition-colors"
                  >
                    {isCopying ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-theme-tertiary text-sm">Share this code with friends. You earn reward points when they qualify.</p>
              </div>

              <button
                onClick={handleShareReferral}
                disabled={!referralCode?.code}
                className="w-full py-3.5 rounded-xl bg-[#5E43F3] text-white font-bold text-sm hover:bg-[#4E34E0] transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Share2 className="w-4 h-4" />
                Share Referral Link
              </button>

              <div className="mt-6 pt-6 border-t border-theme-divider-light">
                <h4 className="text-sm font-bold text-theme-tertiary uppercase tracking-wider mb-3">Referral Status</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-black text-theme-primary">{referralCode?.totalReferrals || 0}</div>
                    <div className="text-xs text-theme-tertiary">Total Referrals</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-theme-primary">{referralCode?.qualifiedReferrals || 0}</div>
                    <div className="text-xs text-theme-tertiary">Qualified</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-theme-primary">{referralCode?.totalPointsEarned || 0}</div>
                    <div className="text-xs text-theme-tertiary">Points Earned</div>
                  </div>
                </div>
              </div>

              {referralRelationships && referralRelationships.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-bold text-theme-tertiary uppercase tracking-wider mb-3">Referral Activity</h4>
                  <div className="bg-theme-base rounded-xl p-4 border border-theme-divider-light">
                    {referralRelationships.map((rel: any) => (
                      <div key={rel._id} className="flex items-center justify-between py-3 border-b border-theme-divider-light/50 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#5E43F3]/10 flex items-center justify-center text-[#5E43F3]">
                            <Star className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-medium text-theme-primary">Referred user</span>
                            <p className="text-xs text-theme-secondary">{rel.status}</p>
                          </div>
                        </div>
                        <span className={`font-bold text-sm ${rel.rewardPoints > 0 ? 'text-emerald-600' : 'text-theme-tertiary'}`}>
                          {rel.rewardPoints > 0 ? `+${rel.rewardPoints} pts` : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Claim Confirmation Modal */}
      {claimModal && (
        <div className={`fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 ${embedded ? 'z-[140]' : 'z-50'}`}>
          <div className="bg-theme-surface rounded-3xl p-6 shadow-2xl w-full max-w-md animate-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-theme-primary">Confirm Redemption</h3>
              <button
                onClick={() => setClaimModal(null)}
                className="w-8 h-8 rounded-full bg-theme-surface-hover hover:bg-theme-surface-active flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-theme-secondary" />
              </button>
            </div>
            <div className="mb-4">
              <span className="text-theme-tertiary text-xs font-bold uppercase tracking-wider">Reward</span>
              <p className="font-bold text-theme-primary">{claimModal.reward.name}</p>
              <p className="text-theme-secondary text-sm">{claimModal.reward.description}</p>
            </div>
            <div className="bg-[#5E43F3]/10 border border-[#5E43F3]/20 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-theme-tertiary text-sm">Points Cost</span>
                <span className="text-xl font-black text-[#5E43F3]">{claimModal.pointsCost.toLocaleString()} pts</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-theme-tertiary text-sm">Remaining Balance</span>
                <span className="text-xl font-bold text-theme-primary">
                  {(rewardBalance.availablePoints - claimModal.pointsCost).toLocaleString()} pts
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleConfirmClaim}
                disabled={isClaiming === claimModal.reward._id}
                className="w-full py-3 rounded-xl bg-[#5E43F3] text-white font-bold hover:bg-[#4E34E0] transition-colors shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isClaiming === claimModal.reward._id ? (
                  <>
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                    <span>Confirming...</span>
                  </>
                ) : (
                  <span>Confirm Redemption</span>
                )}
              </button>
              <button
                onClick={() => setClaimModal(null)}
                className="w-full py-3 rounded-xl bg-transparent border border-theme-divider-light text-theme-primary font-bold hover:bg-theme-surface-hover transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper to check if there are truly no transactions
function rewardTransactionsEmpty(balance: any): boolean {
  return !balance || (balance.totalEarned === 0 && balance.totalRedeemed === 0);
}