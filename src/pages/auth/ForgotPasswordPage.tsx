import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, Zap, CheckCircle2, Mail } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) { setError('Please enter your email or phone.'); return; }
    setError('');
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsLoading(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm mb-8">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-neutral-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>
      </div>

      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#5E43F3] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="lalao-wordmark text-xl text-neutral-900">lalao</span>
        </div>

        {!sent ? (
          <>
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-neutral-950 tracking-tight">Reset password</h1>
              <p className="text-neutral-500 text-sm leading-relaxed">
                Enter the email or phone number linked to your account and we'll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium">
                  {error}
                </div>
              )}
              <div className="space-y-1.5">
                <label htmlFor="forgot-identifier" className="text-xs font-bold text-neutral-700 tracking-wide uppercase">
                  Email or Phone
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    id="forgot-identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@example.com or 0801..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/30 focus:border-[#5E43F3] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-[#5E43F3]/25 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Sending...</span></>
                ) : (
                  <><span>Send Reset Link</span><ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-neutral-500">
              Remember it?{' '}
              <Link to="/login" className="font-bold text-[#5E43F3] hover:text-[#4E34E0] transition-colors">Sign in</Link>
            </p>
          </>
        ) : (
          /* Success state */
          <div className="text-center space-y-6 py-8">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center animate-in zoom-in duration-300">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-neutral-950 tracking-tight">Check your inbox</h2>
              <p className="text-neutral-500 text-sm leading-relaxed max-w-xs mx-auto">
                We sent a reset link to <span className="font-bold text-neutral-800">{identifier}</span>. 
                Check your spam folder if you don't see it.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-3.5 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-[#5E43F3]/25 cursor-pointer"
            >
              Back to Login
            </button>
            <button
              type="button"
              onClick={() => { setSent(false); setIdentifier(''); }}
              className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer font-medium"
            >
              Try a different address
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
