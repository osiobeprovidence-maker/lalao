import React from 'react';
import { ArrowLeft, Shield, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';

interface KycVerificationSubpageProps {
  onBack: () => void;
  kycStatus: 'not_verified' | 'in_progress' | 'verified' | 'requires_attention';
  onUpdateKycStatus: (status: 'not_verified' | 'in_progress' | 'verified' | 'requires_attention') => void;
}

export const KycVerificationSubpage: React.FC<KycVerificationSubpageProps> = ({
  onBack,
  kycStatus,
  onUpdateKycStatus,
}) => {
  const { triggerShareToast } = useLalao();

  const handleStartOrContinueKyc = () => {
    onUpdateKycStatus('in_progress');
    triggerShareToast('KYC process initiated. In review.');
  };

  return (
    <div className="flex flex-col h-full bg-theme-surface animate-in fade-in duration-200">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-theme-surface/95 backdrop-blur-md border-b border-theme-divider-light px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-kyc-verification"
            type="button"
            onClick={onBack}
            className="p-1.5 -ml-1 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
            title="Back to Settings Hub"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-base text-theme-primary">KYC / Verification</h1>
            <p className="text-[11px] text-theme-tertiary">Government ID & identity check</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="px-3.5 py-1.5 rounded-full bg-theme-surface-hover hover:bg-theme-surface-active text-theme-primary text-xs font-bold transition-all cursor-pointer"
        >
          Done
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-xl mx-auto w-full pb-24">
        {/* Status Card */}
        <div className="rounded-2xl border border-theme-divider bg-theme-base p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-theme-primary block">
                  Verification Status
                </span>
                <p className="text-[11px] text-theme-tertiary">Government identity review</p>
              </div>
            </div>

            <span className="rounded-full bg-theme-inverse px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-theme-text-inverse">
              {kycStatus === 'verified'
                ? 'Verified'
                : kycStatus === 'in_progress'
                ? 'In progress'
                : kycStatus === 'requires_attention'
                ? 'Requires attention'
                : 'Not verified'}
            </span>
          </div>

          <button
            id="btn-kyc-action"
            type="button"
            onClick={handleStartOrContinueKyc}
            className="w-full rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] active:scale-[0.99] px-4 py-3 text-xs font-bold text-white transition-all cursor-pointer shadow-md shadow-[#5E43F3]/20"
          >
            {kycStatus === 'not_verified' ? 'Start KYC Verification' : 'Continue Verification'}
          </button>

          <p className="text-[11px] text-theme-tertiary leading-relaxed">
            Your identity verification is securely handled. Documents are encrypted and reviewed in compliance with local privacy standards.
          </p>
        </div>

        {/* Requirements */}
        <div className="space-y-3">
          <div className="border-b border-theme-divider-light pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
              Accepted Documents
            </h3>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-theme-divider-light rounded-2xl overflow-hidden bg-theme-surface">
            {[
              'National Identification Number (NIN) Slip',
              "Voter's Card (INEC PVC)",
              "Valid Driver's License",
              'International Passport',
            ].map((doc, idx) => (
              <div key={idx} className="p-3.5 flex items-center gap-3 text-xs font-medium text-theme-primary">
                <div className="w-1.5 h-1.5 rounded-full bg-[#5E43F3]" />
                <span>{doc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
