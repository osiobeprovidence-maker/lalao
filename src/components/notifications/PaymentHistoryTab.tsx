import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Clock,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Receipt,
  Smartphone,
  Wifi,
  Gift,
  Building,
  Wallet,
  CreditCard,
  ChevronRight,
  Filter,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';
import {
  TransactionDetailsModal,
  PaymentTransactionItem,
} from './TransactionDetailsModal';
import {
  PaymentReceiptModal,
  PaymentReceiptData,
} from './PaymentReceiptModal';

type CategoryFilter = 'all' | 'airtime' | 'pages' | 'gifts' | 'wallet' | 'other';
type StatusFilter = 'all' | 'completed' | 'pending' | 'failed' | 'refunded' | 'cancelled';
type DateRangeFilter = 'all' | 'today' | 'week' | 'month';

function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return 'Recently';
  const diff = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export const PaymentHistoryTab: React.FC = () => {
  const { setIsWalletModalOpen } = useLalao();

  // Filter States
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Selected Transaction Modals
  const [selectedTx, setSelectedTx] = useState<PaymentTransactionItem | null>(null);
  const [receiptData, setReceiptData] = useState<PaymentReceiptData | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Debounce search query
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Convex Query: Authenticated Payment History
  const paymentHistoryData = useQuery(api.payments.getPaymentHistory, {
    type: categoryFilter === 'all' ? undefined : categoryFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
    dateRange: dateRangeFilter === 'all' ? undefined : dateRangeFilter,
    searchQuery: debouncedQuery.trim() ? debouncedQuery.trim() : undefined,
    limit: 60,
  });

  const seedSampleHistory = useMutation(api.payments.seedSamplePaymentHistory);

  const transactions = paymentHistoryData?.transactions || [];
  const isLoading = paymentHistoryData === undefined;
  const isError = false; // Convex automatically handles network errors or queries

  const hasActiveFilters =
    categoryFilter !== 'all' ||
    statusFilter !== 'all' ||
    dateRangeFilter !== 'all' ||
    debouncedQuery.trim().length > 0;

  const handleResetFilters = () => {
    setCategoryFilter('all');
    setStatusFilter('all');
    setDateRangeFilter('all');
    setSearchQuery('');
    setDebouncedQuery('');
  };

  const handleOpenReceipt = (tx: PaymentTransactionItem) => {
    if (!tx.hasReceipt) return;

    const receipt: PaymentReceiptData = {
      receiptNumber: tx.receiptNumber,
      reference: tx.reference,
      date: tx.createdAt,
      formattedDate: new Date(tx.createdAt).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'SUCCESSFUL',
      statusBadge: 'Paid & Verified',
      amount: tx.amount,
      fee: tx.fee,
      totalCharged: tx.totalAmount,
      currency: tx.currency,
      paymentMethod: tx.paymentMethod,
      providerReference: tx.providerReference,
      description: tx.description,
      payer: {
        name: 'Account Holder',
      },
      recipient: {
        name: tx.recipient?.name || tx.provider,
        subtitle: tx.recipient?.subtitle,
        phoneMasked: tx.recipient?.phoneMasked,
        network: tx.recipient?.network,
      },
      token: tx.token,
      units: tx.units,
      supportEmail: 'support@lalao.website',
    };

    setReceiptData(receipt);
    setIsReceiptOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>Success</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Clock className="w-2.5 h-2.5" />
            <span>Pending</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <XCircle className="w-2.5 h-2.5" />
            <span>Failed</span>
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20">
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Refunded</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-500 border border-slate-500/20">
            <AlertCircle className="w-2.5 h-2.5" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-theme-base text-theme-secondary">
            {status}
          </span>
        );
    }
  };

  const getCategoryIcon = (category: string, iconType?: string) => {
    switch (category) {
      case 'airtime':
        return iconType === 'wifi' ? (
          <Wifi className="w-4 h-4 text-emerald-500" />
        ) : (
          <Smartphone className="w-4 h-4 text-[#5E43F3]" />
        );
      case 'gifts':
        return <Gift className="w-4 h-4 text-rose-500" />;
      case 'pages':
        return <Building className="w-4 h-4 text-blue-500" />;
      case 'wallet':
        return <Wallet className="w-4 h-4 text-amber-500" />;
      default:
        return <CreditCard className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <div id="payment-history-tab-content" className="space-y-4 animate-in fade-in duration-200">
      {/* Top Heading & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1 border-b border-theme-divider/60">
        <div>
          <h2 className="text-lg font-black tracking-tight text-theme-primary font-sans">
            Payment History
          </h2>
          <p className="text-xs text-theme-secondary font-medium">
            Track your payments, purchases, and transactions on Lala.
          </p>
        </div>

        <button
          type="button"
          id="btn-payments-fund-wallet"
          onClick={() => setIsWalletModalOpen(true)}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-[#5E43F3] hover:bg-[#4E34E0] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Fund Wallet</span>
        </button>
      </div>

      {/* Summary Cards */}
      {paymentHistoryData?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="p-3 rounded-2xl bg-theme-surface border border-theme-divider">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-theme-tertiary">
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
              <span>Total Spent</span>
            </div>
            <div className="text-base font-black text-theme-primary font-mono mt-1">
              ₦{paymentHistoryData.summary.totalSpent.toLocaleString()}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-theme-surface border border-theme-divider">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-theme-tertiary">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
              <span>Total Funded</span>
            </div>
            <div className="text-base font-black text-theme-primary font-mono mt-1">
              ₦{paymentHistoryData.summary.totalFunded.toLocaleString()}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-theme-surface border border-theme-divider">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-theme-tertiary">
              <Receipt className="w-3.5 h-3.5 text-[#5E43F3]" />
              <span>Transactions</span>
            </div>
            <div className="text-base font-black text-theme-primary font-mono mt-1">
              {paymentHistoryData.totalCount}
            </div>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-tertiary" />
        <input
          type="text"
          id="input-payment-search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by reference, recipient, page, provider, or phone..."
          className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-theme-surface border border-theme-divider text-xs text-theme-primary placeholder:text-theme-tertiary focus:outline-none focus:border-[#5E43F3] focus:ring-1 focus:ring-[#5E43F3] transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-theme-tertiary hover:text-theme-primary rounded-full"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filters: Category Chips */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'all', label: 'All Transactions' },
            { id: 'airtime', label: 'Airtime & VTU' },
            { id: 'pages', label: 'Page Payments' },
            { id: 'gifts', label: 'Gifts' },
            { id: 'wallet', label: 'Wallet Top-ups' },
            { id: 'other', label: 'Other Purchases' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              id={`filter-cat-${cat.id}`}
              onClick={() => setCategoryFilter(cat.id as CategoryFilter)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-theme-inverse text-theme-text-inverse shadow-2xs'
                  : 'bg-black/[0.03] dark:bg-white/[0.04] text-theme-secondary hover:bg-black/[0.06] dark:hover:bg-white/[0.07] hover:text-theme-primary'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Status & Date Range Bar */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pt-1">
          {/* Status Chips */}
          <div className="flex items-center gap-1">
            {[
              { id: 'all', label: 'All Status' },
              { id: 'completed', label: 'Successful' },
              { id: 'pending', label: 'Pending' },
              { id: 'failed', label: 'Failed' },
              { id: 'refunded', label: 'Refunded' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                id={`filter-status-${st.id}`}
                onClick={() => setStatusFilter(st.id as StatusFilter)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === st.id
                    ? 'bg-[#5E43F3]/15 text-[#5E43F3] border border-[#5E43F3]/30'
                    : 'text-theme-tertiary hover:text-theme-secondary'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-1 shrink-0">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'Week' },
              { id: 'month', label: 'Month' },
            ].map((dr) => (
              <button
                key={dr.id}
                type="button"
                id={`filter-date-${dr.id}`}
                onClick={() => setDateRangeFilter(dr.id as DateRangeFilter)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  dateRangeFilter === dr.id
                    ? 'text-theme-primary underline underline-offset-4 decoration-[#5E43F3]'
                    : 'text-theme-tertiary hover:text-theme-secondary'
                }`}
              >
                {dr.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div id="payment-history-skeleton" className="space-y-2.5 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="p-3.5 rounded-2xl bg-theme-surface border border-theme-divider animate-pulse flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-theme-divider/50" />
                <div className="space-y-1.5">
                  <div className="w-32 h-3.5 bg-theme-divider/50 rounded" />
                  <div className="w-20 h-2.5 bg-theme-divider/30 rounded" />
                </div>
              </div>
              <div className="w-16 h-4 bg-theme-divider/50 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State: Zero transactions exist for user */}
      {!isLoading && transactions.length === 0 && !hasActiveFilters && (
        <div
          id="payment-history-empty-state"
          className="text-center py-12 px-4 rounded-3xl bg-theme-surface border border-theme-divider space-y-4"
        >
          <div className="w-16 h-16 rounded-3xl bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center mx-auto border border-[#5E43F3]/20">
            <Receipt className="w-8 h-8" />
          </div>

          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-black text-theme-primary font-sans">
              No payment history yet
            </h3>
            <p className="text-xs text-theme-secondary leading-relaxed font-medium">
              Your airtime purchases, page payments, gifts, and other transactions will appear here.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <button
              type="button"
              id="btn-empty-fund-wallet"
              onClick={() => setIsWalletModalOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
            >
              Fund Wallet
            </button>

            <button
              type="button"
              id="btn-seed-sample-activity"
              disabled={isSeeding}
              onClick={async () => {
                setIsSeeding(true);
                try {
                  await seedSampleHistory({});
                } catch (err) {
                  console.error('Failed to seed sample payment history:', err);
                } finally {
                  setIsSeeding(false);
                }
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-theme-divider hover:bg-theme-surface-hover text-theme-secondary hover:text-theme-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isSeeding ? 'Populating...' : 'Generate Sample History'}</span>
            </button>
          </div>
        </div>
      )}

      {/* No Matching Results: Filters active but 0 results */}
      {!isLoading && transactions.length === 0 && hasActiveFilters && (
        <div
          id="payment-history-no-matches"
          className="text-center py-10 px-4 rounded-3xl bg-theme-surface border border-theme-divider space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-theme-base flex items-center justify-center mx-auto text-theme-tertiary">
            <Filter className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-bold text-theme-primary">No transactions found</h3>
            <p className="text-xs text-theme-secondary">
              No payments match your current search and filter criteria.
            </p>
          </div>

          <button
            type="button"
            id="btn-reset-payment-filters"
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-[#5E43F3] text-white font-bold text-xs hover:bg-[#4E34E0] transition-colors cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Transaction List */}
      {!isLoading && transactions.length > 0 && (
        <div id="payment-transactions-list" className="space-y-2">
          {transactions.map((tx: any) => (
            <div
              key={tx.id}
              id={`tx-card-${tx.reference}`}
              onClick={() => {
                setSelectedTx(tx);
                setIsDetailsOpen(true);
              }}
              className="group p-3.5 rounded-2xl bg-theme-surface hover:bg-theme-surface-hover border border-theme-divider transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
            >
              {/* Left Column: Icon / Avatar + Info */}
              <div className="flex items-center gap-3 min-w-0">
                {tx.recipient?.avatar ? (
                  <Avatar src={tx.recipient.avatar} alt={tx.recipient.name} size="md" />
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-theme-base border border-theme-divider/70 flex items-center justify-center shrink-0">
                    {getCategoryIcon(tx.category, tx.iconType)}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-theme-primary truncate">
                      {tx.title}
                    </span>
                    {getStatusBadge(tx.status)}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-theme-tertiary mt-0.5">
                    <span className="truncate max-w-[140px] sm:max-w-[200px]">
                      {tx.subtitle || tx.description}
                    </span>
                    <span>•</span>
                    <span className="shrink-0">{formatRelativeTime(tx.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Amount + Actions */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div
                    className={`font-mono text-xs sm:text-sm font-bold ${
                      tx.status === 'completed'
                        ? tx.isDebit
                          ? 'text-theme-primary'
                          : 'text-emerald-500'
                        : tx.status === 'refunded'
                        ? 'text-purple-400'
                        : tx.status === 'failed'
                        ? 'text-rose-500 line-through opacity-80'
                        : 'text-amber-500'
                    }`}
                  >
                    {tx.isDebit ? '-' : '+'}₦{tx.totalAmount.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-mono text-theme-tertiary truncate max-w-[90px] text-right">
                    {tx.reference}
                  </div>
                </div>

                {tx.hasReceipt && (
                  <button
                    type="button"
                    id={`btn-receipt-quick-${tx.reference}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenReceipt(tx);
                    }}
                    className="p-1.5 rounded-xl border border-theme-divider bg-theme-base hover:bg-theme-surface-active text-theme-secondary hover:text-theme-primary transition-colors cursor-pointer"
                    title="View Receipt"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                  </button>
                )}

                <ChevronRight className="w-4 h-4 text-theme-tertiary group-hover:text-theme-primary transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        transaction={selectedTx}
        onOpenReceipt={(tx) => handleOpenReceipt(tx)}
      />

      {/* Payment Receipt Modal */}
      <PaymentReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receipt={receiptData}
      />
    </div>
  );
};
