import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, MapPin, Users, Calendar, Chrome, Loader2, RefreshCw } from 'lucide-react';

const OTP_LENGTH = 6;

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Steps: 'email' -> 'verify'
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) {
      setError('Please enter a valid email or phone number.');
      return;
    }
    setError('');
    setIsLoading(true);
    // Simulate network request
    setTimeout(() => {
      setIsLoading(false);
      setStep('verify');
      setResendCooldown(59);
    }, 800);
  };

  const handleOtpChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = cleaned;
    setOtp(next);
    setError('');

    // Auto-advance
    if (cleaned && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    const next = Array(OTP_LENGTH).fill('');
    paste.split('').forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    otpInputRefs.current[Math.min(paste.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      setError('Please enter all 6 digits.');
      return;
    }
    setIsLoading(true);
    
    // Simulate verification
    setTimeout(() => {
      setIsLoading(false);
      if (code === '000000') {
        setError('Incorrect code. Please try again.');
        return;
      }
      // Success -> navigate to existing onboarding flow
      navigate('/onboarding/name');
    }, 1200);
  };

  const handleResend = () => {
    if (resendCooldown > 0) return;
    setResendCooldown(59);
    setOtp(Array(OTP_LENGTH).fill(''));
    otpInputRefs.current[0]?.focus();
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Panel: Brand & Benefits */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 bg-[#F8F7FF] flex-col p-12 xl:p-16 justify-between border-r border-indigo-50">
        
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2 mb-16">
            <div className="w-10 h-10 rounded-xl bg-[#3823A4] flex items-center justify-center">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-black text-2xl tracking-tight text-neutral-900">lalao</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black text-neutral-950 tracking-tight leading-tight mb-4">
            Join your community.
          </h1>
          <p className="text-lg text-neutral-600 mb-12 max-w-md">
            Create your account and discover people, places, events and opportunities around you.
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100/80 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-[#3823A4]" />
              </div>
              <span className="text-neutral-700 font-medium">Discover what's happening around you</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100/80 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-[#3823A4]" />
              </div>
              <span className="text-neutral-700 font-medium">Connect with your community</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100/80 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-[#3823A4]" />
              </div>
              <span className="text-neutral-700 font-medium">Find local events, businesses and activities</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-neutral-400">© 2026 Lalao Inc.</p>
      </div>

      {/* Right Panel: Registration Form */}
      <div className="flex-1 flex flex-col px-6 py-8 sm:px-12 lg:px-16 xl:px-24 justify-center items-center relative">
        
        {/* Mobile Header */}
        <div className="lg:hidden w-full max-w-sm mb-10 flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[#3823A4] flex items-center justify-center">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="font-black text-2xl tracking-tight text-neutral-900">lalao</span>
        </div>

        <div className="w-full max-w-sm">
          {step === 'email' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-3xl font-black text-neutral-950 tracking-tight mb-2">Create your account</h2>
              <p className="text-neutral-500 text-sm mb-8">Join Lalao and start connecting with your community.</p>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-50 text-red-600 text-sm font-semibold border border-red-100">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-500 tracking-wider uppercase">Email or Phone</label>
                  <input
                    type="text"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    placeholder="Enter your email or phone number"
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-neutral-200 bg-white text-base text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3823A4] focus:ring-4 focus:ring-[#3823A4]/10 transition-all"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 rounded-xl bg-[#3823A4] text-white font-black text-base flex items-center justify-center gap-3 transition-transform active:scale-[0.98] shadow-lg shadow-[#3823A4]/25 hover:bg-[#25167A] cursor-pointer disabled:opacity-70 mt-2"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-neutral-200" />
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-neutral-200" />
              </div>

              <button
                type="button"
                className="w-full py-3.5 rounded-xl border-2 border-neutral-200 bg-white text-neutral-700 font-bold text-base flex items-center justify-center gap-3 hover:bg-neutral-50 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Chrome className="w-5 h-5" />
                <span>Continue with Google</span>
              </button>

              <p className="text-center text-sm font-semibold text-neutral-500 mt-8">
                Already have an account?{' '}
                <Link to="/login" className="text-[#3823A4] hover:text-[#25167A] transition-colors">Sign in</Link>
              </p>
            </div>
          )}

          {step === 'verify' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <button 
                onClick={() => setStep('email')}
                className="text-sm font-bold text-neutral-400 hover:text-neutral-700 mb-6 flex items-center gap-1 transition-colors cursor-pointer"
              >
                ← Back
              </button>

              <h2 className="text-3xl font-black text-neutral-950 tracking-tight mb-2">Verify your email</h2>
              <p className="text-neutral-500 text-sm mb-8">
                We sent a verification code to <span className="font-bold text-neutral-800">{emailOrPhone}</span>.
              </p>

              <form onSubmit={handleVerifySubmit} className="space-y-6">
                <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpInputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`w-12 h-14 text-center text-2xl font-black rounded-xl border-2 transition-all focus:outline-none ${
                        error
                          ? 'border-red-400 bg-red-50 text-red-700'
                          : digit
                          ? 'border-[#3823A4] bg-[#F8F7FF] text-[#3823A4]'
                          : 'border-neutral-200 bg-white text-neutral-900 focus:border-[#3823A4] focus:bg-[#F8F7FF]'
                      }`}
                    />
                  ))}
                </div>

                {error && (
                  <p className="text-sm font-semibold text-red-600 text-center">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || otp.join('').length < OTP_LENGTH}
                  className="w-full py-4 rounded-xl bg-[#3823A4] text-white font-black text-base flex items-center justify-center gap-3 transition-transform active:scale-[0.98] shadow-lg shadow-[#3823A4]/25 hover:bg-[#25167A] cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Code'}
                </button>
              </form>

              <div className="flex items-center justify-center gap-1.5 text-sm mt-8">
                <span className="text-neutral-500 font-medium">Didn't receive the code?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className={`font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    resendCooldown > 0 ? 'text-neutral-300' : 'text-[#3823A4] hover:text-[#25167A]'
                  }`}
                >
                  {resendCooldown > 0 ? (
                    `Resend in ${resendCooldown}s`
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      Resend
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

