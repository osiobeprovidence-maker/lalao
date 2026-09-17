import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Check,
  Copy,
  CreditCard,
  History,
  Plus,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';

export const WalletModal: React.FC = () => {
  const {
    wallet,
    isWalletModalOpen,
    setIsWalletModalOpen,
    topUpWallet,
    triggerShareToast,
    currentUser,
  } = useLalao();

  const [activeTab, setActiveTab] = useState<'all' | 'deposits' | 'fees'>('all');
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(10000);
  const [customAmount, setCustomAmount] = useState<string>('10000');
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'bank_transfer'>('paystack');
  const [isFunding, setIsFunding] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  useEffect(() => {
    if (!isWalletModalOpen) return;

    window.history.pushState({ modal: 'wallet' }, '');

    const handlePopState = () => {
      setIsWalletModalOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsWalletModalOpen(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isWalletModalOpen, setIsWalletModalOpen]);

  const handleBack = () => {
    if (window.history.state?.modal === 'wallet') {
      window.history.back();
    } else {
      setIsWalletModalOpen(false);
    }
  };

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

  const filteredTransactions = useMemo(
    () =>
      wallet.transactions.filter((tx) => {
        if (activeTab === 'deposits') return tx.type === 'deposit' || tx.type === 'prize_payout';
        if (activeTab === 'fees') return tx.type === 'tournament_fee' || tx.type === 'ticket_purchase' || tx.type === 'transfer_out';
        return true;
      }),
    [activeTab, wallet.transactions]
  );

  if (!isWalletModalOpen) return null;

  return (
    <div
      id="wallet-overlay"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={() => setIsWalletModalOpen(false)}
    >
      <div
        id="wallet-container"
        className="bg-white w-full sm:max-w-md md:max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 relative z-10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-4 sm:px-5 py-4 border-b border-neutral-100 bg-white sticky top-0 z-20 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                id="btn-back-wallet"
                type="button"
                onClick={handleBack}
                className="p-1.5 -ml-1 rounded-full text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer"
                title="Back"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
              <div>
                <h2 className="text-base font-bold text-neutral-900 leading-tight">Wallet</h2>
                <p className="text-[11px] text-neutral-400">Your Lalao balance and account activity</p>
              </div>
            </div>

            <button
              id="btn-close-wallet"
              type="button"
              onClick={() => setIsWalletModalOpen(false)}
              className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          <div className="rounded-2xl border border-neutral-200 bg-[#f9f7f4] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                  Available Balance
                </p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-lg font-bold text-[#5E43F3]">₦</span>
                  <span className="text-3xl font-black tracking-tight text-neutral-950">
                    {wallet.balance.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="rounded-full bg-violet-100 p-2 text-[#5E43F3]">
                <Wallet className="w-4 h-4 stroke-[2.2]" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-neutral-900">
                <Building2 className="w-4 h-4 text-neutral-600" />
                <h3 className="text-sm font-bold">Virtual Bank Account</h3>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Active
              </span>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-400">Account Number</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="font-mono text-sm font-bold tracking-wider text-neutral-900">
                  {wallet.accountNumber || '9048291048'}
                </p>
                <button
                  type="button"
                  onClick={handleCopyAccount}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-neutral-700 transition-colors hover:bg-neutral-50 cursor-pointer"
                >
                  {copiedAccount ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-neutral-500">Account holder: {currentUser.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              id="btn-wallet-topup"
              onClick={() => setIsTopUpOpen(true)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#5E43F3] px-4 py-3 text-xs font-black text-white shadow-sm shadow-[#5E43F3]/20 transition-colors hover:bg-[#4f36e8] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Funds</span>
            </button>

            <button
              type="button"
              id="btn-wallet-withdraw"
              onClick={() => triggerShareToast('Withdrawal is available for verified bank accounts')}
              className="flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs font-black text-neutral-800 transition-colors hover:bg-neutral-100 cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Withdraw</span>
            </button>
          </div>

          {isTopUpOpen && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black text-neutral-900">Add Funds</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTopUpOpen(false)}
                  className="rounded-full p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleFundWallet} className="space-y-4">
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    Amount (NGN)
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
                        className={`rounded-xl px-2 py-2 text-xs font-black transition-all cursor-pointer ${
                          Number(customAmount) === amt
                            ? 'bg-[#5E43F3] text-white'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        ₦{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    Custom amount
                  </label>
                  <input
                    type="number"
                    min="500"
                    step="500"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-black text-neutral-950 focus:border-[#5E43F3] focus:outline-none"
                    placeholder="e.g. 10000"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('paystack')}
                    className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                      paymentMethod === 'paystack'
                        ? 'border-[#5E43F3] bg-violet-50'
                        : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-[#5E43F3]" />
                    <div>
                      <p className="text-xs font-bold text-neutral-900">Paystack</p>
                      <p className="text-[10px] text-neutral-500">Card / USSD</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-[#5E43F3] bg-violet-50'
                        : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-neutral-700" />
                    <div>
                      <p className="text-xs font-bold text-neutral-900">Bank</p>
                      <p className="text-[10px] text-neutral-500">Transfer</p>
                    </div>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isFunding || Number(customAmount) <= 0}
                  className="w-full rounded-xl bg-[#5E43F3] px-4 py-3 text-xs font-black text-white transition-colors hover:bg-[#4f36e8] disabled:bg-neutral-200 disabled:text-neutral-500 cursor-pointer"
                >
                  {isFunding ? 'Processing...' : `Pay ₦${Number(customAmount || 0).toLocaleString()} Now`}
                </button>
              </form>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-neutral-600" />
                <h2 className="text-sm font-black text-neutral-900">Wallet Activity</h2>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
              {[
                { id: 'all', label: 'All' },
                { id: 'deposits', label: 'Deposits & Prizes' },
                { id: 'fees', label: 'Fees' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveTab(f.id as 'all' | 'deposits' | 'fees')}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                    activeTab === f.id
                      ? 'bg-neutral-950 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredTransactions.length === 0 ? (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center text-xs text-neutral-500">
                  <History className="mx-auto mb-2 w-8 h-8 text-neutral-300" />
                  <p className="font-bold text-neutral-700">No activity found</p>
                  <p className="mt-0.5 text-[11px] text-neutral-400">
                    Your deposits, withdrawals, and platform activity will appear here.
                  </p>
                </div>
              ) : (
                filteredTransactions.map((tx) => {
                  const isPositive = tx.type === 'deposit' || tx.type === 'prize_payout' || tx.type === 'refund';

                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200/80 bg-white p-3.5 shadow-2xs hover:border-neutral-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-800'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <p className="line-clamp-1 text-xs font-bold text-neutral-900">{tx.description}</p>
                          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-neutral-400">
                            <span>{new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span>·</span>
                            <span className="font-mono">{tx.reference || 'LLW-TX'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className={`text-xs sm:text-sm font-black ${isPositive ? 'text-emerald-600' : 'text-neutral-950'}`}>
                          {isPositive ? '+' : '-'}₦{tx.amount.toLocaleString()}
                        </p>
                        <span className="rounded uppercase bg-emerald-50 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700">
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
    </div>
  );
};
