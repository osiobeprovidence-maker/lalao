import React, { useState } from 'react';
import { ArrowLeft, Shield, Phone, Check, KeyRound } from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { ChangePhoneModal } from './ChangePhoneModal';

interface SecurityAuthSubpageProps {
  onBack: () => void;
}

export const SecurityAuthSubpage: React.FC<SecurityAuthSubpageProps> = ({ onBack }) => {
  const { currentUser, setCurrentUser, triggerShareToast } = useLalao();
  const [isChangePhoneOpen, setIsChangePhoneOpen] = useState(false);

  const currentPhone = currentUser.phone || currentUser.phoneNumber;

  return (
    <div className="flex flex-col h-full bg-theme-surface animate-in fade-in duration-200">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-theme-surface/95 backdrop-blur-md border-b border-theme-divider-light px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-security-auth"
            type="button"
            onClick={onBack}
            className="p-1.5 -ml-1 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
            title="Back to Settings Hub"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-base text-theme-primary">Security & Authentication</h1>
            <p className="text-[11px] text-theme-tertiary">Account protection & phone verification</p>
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
        {/* Phone Authentication */}
        <div className="space-y-3">
          <div className="border-b border-theme-divider-light pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
              Phone Number & Login
            </h3>
            <p className="text-[11px] text-theme-tertiary mt-0.5">
              Your registered mobile number for authentication and OTP recovery
            </p>
          </div>

          <div className="rounded-2xl border border-theme-divider bg-theme-surface p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-bold text-theme-primary block truncate">
                  {currentPhone || 'No phone number linked'}
                </span>
                <p className="text-[11px] text-theme-tertiary mt-0.5">
                  {currentPhone ? 'Verified mobile authentication method' : 'Link a phone number to protect your account'}
                </p>
              </div>
            </div>

            <button
              id="btn-edit-phone-number"
              type="button"
              onClick={() => setIsChangePhoneOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#5E43F3]/10 text-[#5E43F3] hover:bg-[#5E43F3]/20 text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              {currentPhone ? 'Change' : 'Add Phone'}
            </button>
          </div>
        </div>

        {/* Security Summary Card */}
        <div className="space-y-3">
          <div className="border-b border-theme-divider-light pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
              Account Security Status
            </h3>
          </div>

          <div className="p-4 rounded-2xl bg-theme-base border border-theme-divider-light space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xs font-bold text-theme-primary block">
                  Session Protected
                </span>
                <p className="text-[11px] text-theme-tertiary">
                  Secured with end-to-end token verification and encrypted local storage
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Phone Modal */}
      {isChangePhoneOpen && (
        <ChangePhoneModal
          currentPhone={currentPhone || undefined}
          onClose={() => setIsChangePhoneOpen(false)}
          onSuccess={(newPhone) => {
            setCurrentUser((prev) => ({
              ...prev,
              phone: newPhone,
              phoneNumber: newPhone,
              phoneVerified: true,
            }));
            triggerShareToast('Phone number successfully updated');
            setIsChangePhoneOpen(false);
          }}
        />
      )}
    </div>
  );
};
