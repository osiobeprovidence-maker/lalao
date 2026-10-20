import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Receipt,
  AlertCircle,
  Clock,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Smartphone,
  Wifi,
  Gift,
  Building,
  Wallet,
  CreditCard,
  Zap,
} from 'lucide-react';
import { Avatar } from '../common/Avatar';

export interface PaymentTransactionItem {
  id: string;
  reference: string;
  receiptNumber: string;
  type: string;
  category: 'airtime' | 'pages' | 'gifts' | 'wallet' | 'other';
  title: string;
  subtitle?: string;
  description: string;
  amount: number;
  fee: number;
  totalAmount: number;
  currency: string;
  isDebit: boolean;
  status: 'completed' | 'pending' | 'failed' | 'refunded' | 'cancelled';
  statusLabel: string;
  paymentMethod: string;
  createdAt: number;
  iconType?: string;
  provider?: string;
  providerReference?: string;
  recipient?: {
    name?: string;
    subtitle?: string;
    avatar?: string;
    phoneMasked?: string;
    network?: string;
  };
  hasReceipt: boolean;
  token?: string;
  units?: string;
}

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: PaymentTransactionItem | null;
  onOpenReceipt: (tx: PaymentTransactionItem) => void;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onOpenReceipt,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !transaction) return null;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(transaction.reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = new Date(transaction.createdAt).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Successful</span>
          </div>
        );
      case 'pending':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Verification</span>
          </div>
        );
      case 'failed':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            <span>Payment Failed</span>
          </div>
        );
      case 'refunded':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refunded to Balance</span>
          </div>
        );
      case 'cancelled':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-500 border border-slate-500/20">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Cancelled</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-theme-base text-theme-secondary border border-theme-divider">
            <span>{status}</span>
          </div>
        );
    }
  };

  const getCategoryIcon = (category: string, iconType?: string) => {
    switch (category) {
      case 'airtime':
        return iconType === 'wifi' ? <Wifi className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />;
      case 'gifts':
        return <Gift className="w-5 h-5" />;
      case 'pages':
        return <Building className="w-5 h-5" />;
      case 'wallet':
        return <Wallet className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  return (
    <div
      id="transaction-details-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md bg-theme-surface border border-theme-divider rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-divider/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center">
              {getCategoryIcon(transaction.category, transaction.iconType)}
            </div>
            <div>
              <h3 className="text-sm font-bold text-theme-primary">Transaction Details</h3>
              <p className="text-[11px] text-theme-tertiary">{transaction.category.toUpperCase()}</p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-tx-details"
            onClick={onClose}
            className="p-2 rounded-xl text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Amount & Status Hero Card */}
          <div className="text-center space-y-2 py-2">
            <div className="text-3xl font-black tracking-tight text-theme-primary font-mono">
              {transaction.isDebit ? '-' : '+'}₦{transaction.totalAmount.toLocaleString()}
            </div>
            <div>{getStatusBadge(transaction.status)}</div>
            <p className="text-xs text-theme-secondary font-medium pt-1 max-w-xs mx-auto">
              {transaction.title}
            </p>
          </div>

          {/* Reference Pill */}
          <div className="p-3 rounded-2xl bg-theme-base border border-theme-divider/70 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-tertiary">
                Transaction Reference
              </span>
              <div className="font-mono font-bold text-theme-primary truncate max-w-[210px]">
                {transaction.reference}
              </div>
            </div>

            <button
              type="button"
              id="btn-copy-tx-ref"
              onClick={handleCopyRef}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-theme-surface hover:bg-theme-surface-hover border border-theme-divider text-[11px] font-bold text-theme-secondary hover:text-theme-primary transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Recipient / Merchant Information */}
          {(transaction.recipient?.name || transaction.recipient?.phoneMasked || transaction.provider) && (
            <div className="p-3.5 rounded-2xl bg-theme-base border border-theme-divider/70 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-theme-tertiary">
                Recipient / Service Details
              </span>
              <div className="flex items-center gap-3">
                {transaction.recipient?.avatar ? (
                  <Avatar src={transaction.recipient.avatar} alt={transaction.recipient.name} size="md" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-theme-surface border border-theme-divider flex items-center justify-center font-bold text-xs text-[#5E43F3]">
                    {transaction.recipient?.network || transaction.provider?.slice(0, 3) || 'LAL'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-theme-primary truncate">
                    {transaction.recipient?.name || transaction.provider || 'Partner Service'}
                  </div>
                  {transaction.recipient?.phoneMasked && (
                    <div className="text-[11px] font-mono text-theme-secondary">
                      {transaction.recipient.phoneMasked}
                    </div>
                  )}
                  {transaction.recipient?.subtitle && !transaction.recipient.phoneMasked && (
                    <div className="text-[11px] text-theme-secondary truncate">
                      {transaction.recipient.subtitle}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Financial Breakdown */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-theme-secondary">
              <span>Date & Time</span>
              <span className="font-semibold text-theme-primary">{formattedDate}</span>
            </div>
            <div className="flex items-center justify-between text-theme-secondary">
              <span>Payment Method</span>
              <span className="font-semibold text-theme-primary">{transaction.paymentMethod}</span>
            </div>
            {transaction.providerReference && (
              <div className="flex items-center justify-between text-theme-secondary">
                <span>Provider Ref ID</span>
                <span className="font-mono text-theme-primary truncate max-w-[180px]">
                  {transaction.providerReference}
                </span>
              </div>
            )}
            {transaction.token && (
              <div className="flex items-center justify-between text-theme-secondary">
                <span>Prepaid Token</span>
                <span className="font-mono font-bold text-emerald-500">{transaction.token}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-theme-secondary">
              <span>Subtotal</span>
              <span className="font-mono font-semibold text-theme-primary">
                ₦{transaction.amount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-theme-secondary">
              <span>Platform Fee</span>
              <span className="font-mono font-semibold text-theme-primary">
                {transaction.fee > 0 ? `₦${transaction.fee.toLocaleString()}` : '₦0.00'}
              </span>
            </div>
            <div className="border-t border-theme-divider/70 pt-2 flex items-center justify-between text-sm font-bold text-theme-primary">
              <span>Total Charged</span>
              <span className="font-mono text-[#5E43F3]">₦{transaction.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Refund Notice if Refunded */}
          {transaction.status === 'refunded' && (
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-400 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Automatic Balance Refund</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                The provider could not fulfill this service request in time. Your Lala wallet balance was automatically credited in full.
              </p>
            </div>
          )}

          {/* Dispute & Support Helper */}
          <div className="p-3 rounded-2xl bg-theme-base border border-theme-divider/60 flex items-start gap-2.5 text-[11px] text-theme-secondary">
            <HelpCircle className="w-4 h-4 text-theme-tertiary shrink-0 mt-0.5" />
            <p>
              Questions about this charge? Contact{' '}
              <a
                href={`mailto:support@lalao.website?subject=Payment Inquiry: ${transaction.reference}`}
                className="text-[#5E43F3] font-semibold underline"
              >
                support@lalao.website
              </a>{' '}
              with your transaction reference.
            </p>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 border-t border-theme-divider/70 bg-theme-base/40 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-theme-divider hover:bg-theme-surface-hover text-theme-secondary hover:text-theme-primary font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>

          {transaction.hasReceipt ? (
            <button
              type="button"
              id="btn-view-receipt-from-details"
              onClick={() => {
                onClose();
                onOpenReceipt(transaction);
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>View Receipt</span>
            </button>
          ) : (
            <div className="flex-1 text-center text-[11px] text-theme-tertiary font-medium">
              Receipt unavailable for {transaction.status} payments
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
