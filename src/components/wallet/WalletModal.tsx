import React, { useState } from 'react';
import {
  ArrowLeft,
  X,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  CreditCard,
  Building2,
  Copy,
  Check,
  Sparkles,
  Trophy,
  History,
  ShieldCheck,
  Zap,
  Users,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';

export const WalletModal: React.FC = () => {
  const {
    wallet,
    isWalletModalOpen,
    setIsWalletModalOpen,
    topUpWallet,
    triggerShareToast,
    savedTeams,
    currentUser,
  } = useLalao();

  const [activeTab, setActiveTab] = useState<'all' | 'deposits' | 'fees'>('all');
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(10000);
  const [customAmount, setCustomAmount] = useState<string>('10000');
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'bank_transfer'>('paystack');
  const [isFunding, setIsFunding] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  if (!isWalletModalOpen) return null;

  const handleCopyAccount = () => {
    if (wallet.accountNumber) {
      navigator.clipboard?.writeText(wallet.accountNumber);
      setCopiedAccount(true);
      triggerShareToast('Virtual account number copied!');
      setTimeout(() => setCopiedAccount(false), 2500);
    }
  };

  const handleFundWallet = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(customAmount) || topUpAmount;
    if (amount <= 0) return;

    setIsFunding(true);
    setTimeout(() => {
      topUpWallet(amount, paymentMethod);
      setIsFunding(false);
      setIsTopUpOpen(false);
    }, 1200);
  };

  const filteredTransactions = wallet.transactions.filter((tx) => {
    if (activeTab === 'deposits') return tx.type === 'deposit' || tx.type === 'prize_payout';
    if (activeTab === 'fees') return tx.type === 'tournament_fee' || tx.type === 'ticket_purchase' || tx.type === 'transfer_out';
    return true;
  });

  return (
    <div
      id="screen-user-wallet"
      className="absolute inset-0 z-40 bg-white flex flex-col min-h-full overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-200"
    >
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 lg:px-8 py-3.5 border-b border-neutral-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="btn-back-wallet"
            onClick={() => setIsWalletModalOpen(false)}
            className="p-1.5 -ml-1 rounded-full text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-100 text-[#5E43F3] flex items-center justify-center">
              <Wallet className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-sm lg:text-base font-black text-neutral-950 leading-tight">
                Gamer & Player Wallet
              </h1>
              <p className="text-[11px] text-neutral-500">
                Tournaments, Passes & Instant Payouts
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsWalletModalOpen(false)}
          className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content Body */}
      <div className="flex-1 max-w-2xl mx-auto w-full p-4 lg:p-6 space-y-6 pb-24">
        {/* Hero Digital Card */}
        <div className="bg-gradient-to-br from-neutral-950 via-neutral-900 to-[#3b27b3] text-white rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden border border-neutral-800">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#5E43F3]/20 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

          {/* Card Top Row */}
          <div className="relative z-10 flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-wider text-white">lalao</span>
              <span className="w-2 h-2 rounded-full bg-[#5E43F3]" />
              <span className="text-[11px] font-bold text-violet-200 uppercase tracking-widest ml-1 bg-white/10 px-2 py-0.5 rounded-md backdrop-blur-sm">
                Player Pass
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Account</span>
            </div>
          </div>

          {/* Balance Display */}
          <div className="relative z-10 space-y-1 mb-6">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Available Wallet Balance
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-violet-300">₦</span>
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                {wallet.balance.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-neutral-400 ml-1">NGN</span>
            </div>
          </div>

          {/* Virtual Account Number Bar */}
          <div className="relative z-10 bg-black/40 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                Virtual Bank Account (Wema Bank)
              </p>
              <p className="text-xs sm:text-sm font-mono font-bold text-neutral-200 mt-0.5 tracking-wider">
                {wallet.accountNumber || '9048291048'} · {currentUser.name}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyAccount}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {copiedAccount ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Action CTAs */}
          <div className="relative z-10 grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-white/10">
            <button
              type="button"
              id="btn-wallet-topup"
              onClick={() => setIsTopUpOpen(true)}
              className="py-3 px-4 rounded-2xl bg-white text-neutral-950 hover:bg-neutral-100 active:scale-95 font-black text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#5E43F3] stroke-[3]" />
              <span>Add Funds (Paystack)</span>
            </button>

            <button
              type="button"
              id="btn-wallet-withdraw"
              onClick={() => triggerShareToast('Withdrawal feature is enabled for verified bank accounts')}
              className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-bold text-xs sm:text-sm transition-all backdrop-blur-md flex items-center justify-center gap-2 cursor-pointer border border-white/10"
            >
              <ArrowUpRight className="w-4 h-4 text-violet-300" />
              <span>Withdraw to Bank</span>
            </button>
          </div>
        </div>

        {/* Top Up Modal / Drawer */}
        {isTopUpOpen && (
          <div className="bg-white rounded-3xl border border-neutral-200 p-5 shadow-lg space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-neutral-900">
                  Fund Your Wallet via Paystack
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTopUpOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFundWallet} className="space-y-4">
              {/* Quick Amount Chips */}
              <div>
                <label className="text-[11px] font-bold text-neutral-600 block mb-2">
                  Select Quick Amount (NGN)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[2000, 5000, 10000, 25000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setTopUpAmount(amt);
                        setCustomAmount(amt.toString());
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        Number(customAmount) === amt
                          ? 'bg-[#5E43F3] text-white shadow-xs'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      ₦{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-600">
                  Custom Top-up Amount (₦)
                </label>
                <input
                  type="number"
                  min="500"
                  step="500"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-black text-neutral-950 focus:outline-none focus:border-[#5E43F3]"
                  placeholder="e.g. 10000"
                  required
                />
              </div>

              {/* Payment Channel Selector */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('paystack')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    paymentMethod === 'paystack'
                      ? 'border-[#5E43F3] bg-violet-50/50'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-[#5E43F3]" />
                  <div>
                    <p className="text-xs font-bold text-neutral-900">Paystack</p>
                    <p className="text-[10px] text-neutral-500">Debit Card & USSD</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-[#5E43F3] bg-violet-50/50'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-neutral-700" />
                  <div>
                    <p className="text-xs font-bold text-neutral-900">Bank Transfer</p>
                    <p className="text-[10px] text-neutral-500">Virtual Bank Account</p>
                  </div>
                </button>
              </div>

              <button
                type="submit"
                disabled={isFunding || Number(customAmount) <= 0}
                className="w-full py-3.5 px-4 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] disabled:bg-neutral-200 text-white font-black text-xs sm:text-sm transition-all shadow-md shadow-[#5E43F3]/25 cursor-pointer flex items-center justify-center gap-2"
              >
                {isFunding ? (
                  <span>Processing Secure Payment via Paystack...</span>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Pay ₦{Number(customAmount || 0).toLocaleString()} Now</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Saved Teams Quick Access */}
        {savedTeams.length > 0 && (
          <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#5E43F3]" />
                <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider">
                  My Esports Teams ({savedTeams.length})
                </h3>
              </div>
              <span className="text-[11px] font-bold text-neutral-500">
                Ready for Tournaments
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {savedTeams.map((team) => (
                <div
                  key={team.id}
                  className="p-3 rounded-xl bg-white border border-neutral-200 shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={team.logo}
                      alt={team.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-xl object-cover border border-neutral-200"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-neutral-900">{team.name}</span>
                        <span className="text-[10px] font-black bg-violet-100 text-[#5E43F3] px-1.5 py-0.2 rounded">
                          {team.tag}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-500">
                        {team.players?.length || 0}/5 Players Locked
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction History Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-neutral-600" />
              <h2 className="text-sm font-black text-neutral-900">
                Wallet Activity & Receipts
              </h2>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'All Activity' },
              { id: 'deposits', label: 'Deposits & Prizes' },
              { id: 'fees', label: 'Tournament Fees' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveTab(f.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === f.id
                    ? 'bg-neutral-950 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Transaction List */}
          <div className="space-y-2">
            {filteredTransactions.length === 0 ? (
              <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-neutral-200 text-neutral-500 text-xs">
                <History className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="font-bold text-neutral-700">No activity found</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Your tournament payouts, ticket charges, and top-ups will appear here.
                </p>
              </div>
            ) : (
              filteredTransactions.map((tx) => {
                const isPositive = tx.type === 'deposit' || tx.type === 'prize_payout' || tx.type === 'refund';
                return (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs flex items-center justify-between gap-3 hover:border-neutral-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isPositive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-neutral-100 text-neutral-800'
                        }`}
                      >
                        {isPositive ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-900 line-clamp-1">
                          {tx.description}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-400">
                          <span>{new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span>·</span>
                          <span className="font-mono">{tx.reference || 'LLW-TX'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className={`text-xs sm:text-sm font-black ${
                          isPositive ? 'text-emerald-600' : 'text-neutral-950'
                        }`}
                      >
                        {isPositive ? '+' : '-'}₦{tx.amount.toLocaleString()}
                      </p>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded uppercase">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
