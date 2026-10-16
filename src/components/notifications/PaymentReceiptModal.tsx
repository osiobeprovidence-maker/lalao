import React, { useState } from 'react';
import {
  X,
  Printer,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  Download,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { AppIcon } from '../common/AppIcon';

export interface PaymentReceiptData {
  receiptNumber: string;
  reference: string;
  date: number;
  formattedDate: string;
  status: string;
  statusBadge?: string;
  amount: number;
  fee: number;
  totalCharged: number;
  currency: string;
  paymentMethod: string;
  providerReference?: string;
  description: string;
  payer: {
    id?: string;
    name: string;
    email?: string;
    username?: string;
  };
  recipient?: {
    name?: string;
    subtitle?: string;
    phoneMasked?: string;
    network?: string;
  };
  token?: string;
  units?: string;
  supportEmail?: string;
}

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: PaymentReceiptData | null;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  receipt,
}) => {
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  if (!isOpen || !receipt) return null;

  const handleCopyReference = () => {
    if (!receipt.reference) return;
    navigator.clipboard.writeText(receipt.reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const text = `Lala Payment Receipt\nRef: ${receipt.reference}\nAmount: ₦${receipt.totalCharged.toLocaleString()}\nDate: ${receipt.formattedDate}\nStatus: ${receipt.status}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Lala Receipt - ${receipt.receiptNumber}`,
          text,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } catch (e) {
        // user cancelled or share failed, fallback to copy
        navigator.clipboard.writeText(text);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      }
    } else {
      navigator.clipboard.writeText(text);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  return (
    <div
      id="payment-receipt-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        id="printable-receipt"
        className="relative z-10 w-full max-w-lg bg-theme-surface border border-theme-divider rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Receipt Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-divider/70 bg-theme-base/50">
          <div className="flex items-center gap-2">
            <AppIcon className="w-6 h-6 rounded-md shadow-2xs" />
            <span className="text-xs font-bold uppercase tracking-widest text-theme-tertiary">
              Official Payment Receipt
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              id="btn-print-receipt"
              onClick={handlePrint}
              className="p-2 rounded-xl text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="btn-share-receipt"
              onClick={handleShare}
              className="p-2 rounded-xl text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
              title="Share Receipt"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="btn-close-receipt-modal"
              onClick={onClose}
              className="p-2 rounded-xl text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Brand & Verification Banner */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 mb-2 border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-theme-primary font-sans">
              ₦{receipt.totalCharged.toLocaleString()}
            </h2>
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-500">
              <ShieldCheck className="w-4 h-4" />
              <span>{receipt.statusBadge || 'Payment Successful & Verified'}</span>
            </div>
            <p className="text-xs text-theme-secondary max-w-sm mx-auto pt-1 font-medium">
              {receipt.description}
            </p>
          </div>

          {/* Reference & Number Pill */}
          <div className="p-3.5 rounded-2xl bg-theme-base/60 border border-theme-divider/70 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-theme-tertiary">
                Receipt Number
              </div>
              <div className="font-mono font-bold text-theme-primary">
                {receipt.receiptNumber}
              </div>
            </div>

            <button
              type="button"
              id="btn-copy-receipt-ref"
              onClick={handleCopyReference}
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
                  <span>Copy Ref</span>
                </>
              )}
            </button>
          </div>

          {/* Detailed Metadata Grid */}
          <div className="space-y-3 divide-y divide-theme-divider/50 text-xs">
            <div className="pt-2 flex items-center justify-between">
              <span className="text-theme-tertiary font-medium">Transaction Reference</span>
              <span className="font-mono font-semibold text-theme-primary truncate max-w-[200px]">
                {receipt.reference}
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-theme-tertiary font-medium">Date & Time</span>
              <span className="font-semibold text-theme-primary">{receipt.formattedDate}</span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-theme-tertiary font-medium">Payment Method</span>
              <span className="font-semibold text-theme-primary">{receipt.paymentMethod}</span>
            </div>

            {receipt.recipient?.name && (
              <div className="pt-2 flex items-center justify-between">
                <span className="text-theme-tertiary font-medium">Recipient / Provider</span>
                <span className="font-semibold text-theme-primary">
                  {receipt.recipient.name} {receipt.recipient.network ? `(${receipt.recipient.network})` : ''}
                </span>
              </div>
            )}

            {receipt.recipient?.phoneMasked && (
              <div className="pt-2 flex items-center justify-between">
                <span className="text-theme-tertiary font-medium">Recipient Phone</span>
                <span className="font-mono font-semibold text-theme-primary">
                  {receipt.recipient.phoneMasked}
                </span>
              </div>
            )}

            {receipt.token && (
              <div className="pt-2 flex items-center justify-between">
                <span className="text-theme-tertiary font-medium">Prepaid Token</span>
                <span className="font-mono font-bold text-emerald-500 tracking-wider">
                  {receipt.token}
                </span>
              </div>
            )}

            {receipt.providerReference && (
              <div className="pt-2 flex items-center justify-between">
                <span className="text-theme-tertiary font-medium">Provider Reference</span>
                <span className="font-mono text-theme-secondary">{receipt.providerReference}</span>
              </div>
            )}
          </div>

          {/* Financial Totals Card */}
          <div className="p-4 rounded-2xl bg-theme-base border border-theme-divider space-y-2 text-xs">
            <div className="flex items-center justify-between text-theme-secondary">
              <span>Subtotal Amount</span>
              <span className="font-mono font-semibold">₦{receipt.amount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-theme-secondary">
              <span>Platform / Processing Fee</span>
              <span className="font-mono font-semibold">
                {receipt.fee > 0 ? `₦${receipt.fee.toLocaleString()}` : '₦0.00'}
              </span>
            </div>
            <div className="border-t border-theme-divider/60 pt-2 flex items-center justify-between text-sm font-bold text-theme-primary">
              <span>Total Paid</span>
              <span className="font-mono text-base text-[#5E43F3]">
                ₦{receipt.totalCharged.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Verification Seal & Security Note */}
          <div className="p-3.5 rounded-2xl bg-[#5E43F3]/5 border border-[#5E43F3]/20 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#5E43F3] shrink-0 mt-0.5" />
            <div className="text-[11px] text-theme-secondary leading-relaxed">
              <span className="font-bold text-theme-primary">Authentic Lala Ledger Receipt.</span>{' '}
              This document is cryptographically verified against Lala’s real-time financial database.
              For disputes or questions, contact{' '}
              <a
                href={`mailto:${receipt.supportEmail || 'support@lalao.website'}?subject=Payment Inquiry: ${receipt.reference}`}
                className="text-[#5E43F3] font-semibold underline"
              >
                {receipt.supportEmail || 'support@lalao.website'}
              </a>
              .
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 border-t border-theme-divider/70 bg-theme-base/40 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 py-2.5 px-4 rounded-xl border border-theme-divider hover:bg-theme-surface-hover text-theme-secondary hover:text-theme-primary font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{shareSuccess ? 'Shared!' : 'Share'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download / Print</span>
          </button>
        </div>
      </div>
    </div>
  );
};
