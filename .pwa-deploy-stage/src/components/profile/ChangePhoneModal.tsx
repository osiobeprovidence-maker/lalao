import React, { useState } from 'react';
import { ArrowLeft, Loader2, Phone, CheckCircle2 } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface ChangePhoneModalProps {
  currentPhone?: string;
  onClose: () => void;
  onSuccess: (newPhone: string) => void;
}

export const ChangePhoneModal: React.FC<ChangePhoneModalProps> = ({ currentPhone, onClose, onSuccess }) => {
  const updateUserPhone = useMutation(api.users.updateUserPhone);
  
  const [step, setStep] = useState<'input' | 'success'>('input');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdatePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.length < 8) {
      setError('Please enter a valid phone number.');
      return;
    }
    if (cleaned === currentPhone) {
      setError('This is already your current phone number.');
      return;
    }

    setIsLoading(true);
    
    try {
      await updateUserPhone({ phoneNumber: phone });
      setStep('success');
      setTimeout(() => {
        onSuccess(phone);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update phone number.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-theme-surface w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-4 border-b border-theme-divider-light">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -ml-1 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="ml-2 font-bold text-base text-theme-primary">
            {step === 'success' ? 'Updated' : 'Change Phone Number'}
          </h2>
        </div>

        <div className="p-6">
          {step === 'input' && (
            <form onSubmit={handleUpdatePhone} className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-[#5E43F3]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-[#5E43F3]" />
                </div>
                <p className="text-theme-secondary text-sm">
                  Enter your new phone number to update your account.
                </p>
                {currentPhone && (
                  <p className="text-xs font-bold text-theme-tertiary">
                    Current: <span className="font-mono bg-theme-surface-active px-1.5 py-0.5 rounded">{currentPhone}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-theme-secondary">New Phone Number</label>
                <div className="flex items-center px-3.5 py-3 rounded-xl border border-theme-divider focus-within:border-[#5E43F3] focus-within:ring-1 focus-within:ring-[#5E43F3] transition-all bg-theme-base">
                  <span className="text-theme-tertiary font-bold mr-2">+</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="234 800 000 0000"
                    className="flex-1 bg-transparent text-sm font-bold text-theme-primary outline-none placeholder:text-theme-tertiary/50"
                    autoFocus
                  />
                </div>
                {error && <p className="text-xs font-bold text-red-500 mt-1">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading || !phone}
                className="w-full py-3.5 rounded-xl bg-[#5E43F3] text-white font-bold text-sm shadow-md hover:bg-[#4E34E0] transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Phone'}
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-xl font-black text-theme-primary">Phone Updated!</h3>
              <p className="text-sm font-semibold text-theme-secondary max-w-[250px]">
                Your account phone number has been successfully changed.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
