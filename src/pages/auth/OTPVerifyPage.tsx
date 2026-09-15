import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Zap, RefreshCw, CheckCircle2 } from 'lucide-react';

const OTP_LENGTH = 6;

export const OTPVerifyPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = (state as any)?.email || 'your email';

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(59);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = cleaned;
    setOtp(next);
    setError('');

    // Auto-advance
    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    const next = Array(OTP_LENGTH).fill('');
    paste.split('').forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    inputRefs.current[Math.min(paste.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) { setError('Please enter all 6 digits.'); return; }
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsLoading(false);
    // Simulate correct OTP
    if (code === '000000') {
      setError('Incorrect code. Please try again.');
      return;
    }
    setVerified(true);
    setTimeout(() => navigate('/onboarding/welcome'), 1500);
  };

  const handleResend = () => {
    if (resendCooldown > 0) return;
    setResendCooldown(59);
    setOtp(Array(OTP_LENGTH).fill(''));
    inputRefs.current[0]?.focus();
  };

  const maskedEmail = email.includes('@')
    ? email.replace(/(.{2})(.+)(@.+)/, (_, a: string, b: string, c: string) => a + '*'.repeat(b.length) + c)
    : email;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
      {/* Back button */}
      <div className="w-full max-w-sm mb-8">
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      <div className="w-full max-w-sm space-y-10 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          {verified ? (
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center animate-in zoom-in duration-300">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-3xl bg-[#5E43F3]/10 flex items-center justify-center">
              <Zap className="w-10 h-10 text-[#5E43F3] fill-[#5E43F3]" />
            </div>
          )}
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-neutral-950 tracking-tight">
            {verified ? 'Verified!' : 'Check your inbox'}
          </h1>
          <p className="text-neutral-500 text-sm leading-relaxed">
            {verified
              ? 'Setting up your Lalao profile...'
              : (
                <>
                  We sent a 6-digit code to{' '}
                  <span className="font-bold text-neutral-800">{maskedEmail}</span>
                </>
              )}
          </p>
        </div>

        {!verified && (
          <>
            {/* OTP Input Boxes */}
            <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  id={`otp-input-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={`w-12 h-14 text-center text-2xl font-black rounded-xl border-2 transition-all focus:outline-none ${
                    error
                      ? 'border-red-400 bg-red-50 text-red-700'
                      : digit
                      ? 'border-[#5E43F3] bg-indigo-50/50 text-[#5E43F3]'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-900 focus:border-[#5E43F3] focus:ring-2 focus:ring-[#5E43F3]/20'
                  }`}
                />
              ))}
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm font-semibold text-red-600 -mt-4">{error}</p>
            )}

            {/* Verify Button */}
            <button
              type="button"
              onClick={handleVerify}
              disabled={isLoading || otp.join('').length < OTP_LENGTH}
              className="w-full py-3.5 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-[#5E43F3]/25 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Verifying...</span></>
              ) : (
                'Verify Code'
              )}
            </button>

            {/* Resend */}
            <div className="flex items-center justify-center gap-1.5 text-sm">
              <span className="text-neutral-400">Didn't get it?</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className={`font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  resendCooldown > 0 ? 'text-neutral-300' : 'text-[#5E43F3] hover:text-[#4E34E0]'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
