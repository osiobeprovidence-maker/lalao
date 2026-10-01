import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Loader2, Phone, CheckCircle2, RefreshCw } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface ChangePhoneModalProps {
  currentPhone?: string;
  onClose: () => void;
  onSuccess: (newPhone: string) => void;
}

const OTP_LENGTH = 6;

export const ChangePhoneModal: React.FC<ChangePhoneModalProps> = ({ currentPhone, onClose, onSuccess }) => {
  const updateUserPhone = useMutation(api.users.updateUserPhone);
  
  const [step, setStep] = useState<'input' | 'otp' | 'success'>('input');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // OTP State
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [resendCooldown, setResendCooldown] = useState(59);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // OTP Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0 || step !== 'otp') return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown, step]);

  const handleSendOtp = async (e: React.FormEvent) => {
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
    // Simulate API call to send OTP
    await new Promise((r) => setTimeout(r, 1200));
    setIsLoading(false);
    
    setStep('otp');
    setResendCooldown(59);
    setOtp(Array(OTP_LENGTH).fill(''));
  };

  const handleOtpChange = (index: number, value: string) => {
    const cleaned = value.replace(/\\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = cleaned;
    setOtp(next);
    setError('');

    // Auto-advance
    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\\D/g, '').slice(0, OTP_LENGTH);
    const next = Array(OTP_LENGTH).fill('');
    paste.split('').forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    inputRefs.current[Math.min(paste.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) { setError('Please enter all 6 digits.'); return; }
    
    setIsLoading(true);
    setError('');
    
    // Simulate real backend OTP verification delay
    await new Promise((r) => setTimeout(r, 1200));

    if (code === '000000') {
      setIsLoading(false);
      setError('Incorrect code. Please try again.');
      return;
    }

    try {
      // Actual Convex Mutation
      await updateUserPhone({ phoneNumber: phone });
      setStep('success');
      setTimeout(() => {
        onSuccess(phone);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update phone number.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = () => {
    if (resendCooldown > 0) return;
    setResendCooldown(59);
    setOtp(Array(OTP_LENGTH).fill(''));
    inputRefs.current[0]?.focus();
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
            onClick={step === 'otp' ? () => setStep('input') : onClose}
            className="p-1.5 -ml-1 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="ml-2 font-bold text-base text-theme-primary">
            {step === 'success' ? 'Verified' : step === 'otp' ? 'Verify Phone' : 'Change Phone Number'}
          </h2>
        </div>

        <div className="p-6">
          {step === 'input' && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-[#5E43F3]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-[#5E43F3]" />
                </div>
                <p className="text-theme-secondary text-sm">
                  Enter your new phone number. We'll send a verification code to confirm it's yours.
                </p>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium text-center">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-theme-secondary uppercase tracking-wide">
                  New Phone Number
                </label>
                <div className="flex items-center px-4 py-3 rounded-xl border border-theme-divider bg-theme-base focus-within:border-[#5E43F3] focus-within:ring-1 focus-within:ring-[#5E43F3] transition-all">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="w-full bg-transparent outline-none text-theme-primary font-medium"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || phone.length < 5}
                className="w-full py-3.5 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-lg shadow-[#5E43F3]/25"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Verification Code'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <p className="text-theme-secondary text-sm">
                  We sent a 6-digit code to <span className="font-bold text-theme-primary">{phone}</span>
                </p>
              </div>

              <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={`w-11 h-14 text-center text-xl font-black rounded-xl border-2 transition-all focus:outline-none ${
                      error
                        ? 'border-red-400 bg-red-50 text-red-700'
                        : digit
                        ? 'border-[#5E43F3] bg-indigo-50/50 text-[#5E43F3]'
                        : 'border-theme-divider bg-theme-base text-theme-primary focus:border-[#5E43F3] focus:ring-1'
                    }`}
                  />
                ))}
              </div>

              {error && (
                <p className="text-sm font-semibold text-red-600 text-center -mt-4">{error}</p>
              )}

              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={isLoading || otp.join('').length < OTP_LENGTH}
                className="w-full py-3.5 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-[#5E43F3]/25 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Code'}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-sm">
                <span className="text-theme-tertiary">Didn't get it?</span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0}
                  className={`font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    resendCooldown > 0 ? 'text-theme-tertiary' : 'text-[#5E43F3] hover:text-[#4E34E0]'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in zoom-in duration-300">
              <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-black text-theme-primary">Phone Updated!</h3>
              <p className="text-theme-secondary text-sm text-center">
                Your phone number has been successfully updated to {phone}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
