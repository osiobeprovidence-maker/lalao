import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight, Loader2, Check, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AppIcon } from '../../components/common/AppIcon';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : /[^a-zA-Z0-9]/.test(password) ? 4 : 3;
  const strengthLabels = ['', 'Weak', 'Fair', 'Strong', 'Very strong'];
  const strengthColors = ['', 'bg-red-400', 'bg-amber-400', 'bg-blue-500', 'bg-emerald-500'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setError('');
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsLoading(false);
    setDone(true);
    setTimeout(() => navigate('/login'), 2000);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#5E43F3] flex items-center justify-center">
            <AppIcon className="w-4 h-4" fallbackClassName="text-white fill-white" />
          </div>
          <span className="lalao-wordmark text-xl text-neutral-900">lalao</span>
        </div>

        {!done ? (
          <>
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#5E43F3]/10 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-[#5E43F3]" />
              </div>
              <h1 className="text-3xl font-black text-neutral-950 tracking-tight">New password</h1>
              <p className="text-neutral-500 text-sm">Create a strong password for your Lalao account.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 tracking-wide uppercase">New Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/30 focus:border-[#5E43F3] transition-all pr-11"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((s) => (
                        <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${strength >= s ? strengthColors[strength] : 'bg-neutral-100'}`} />
                      ))}
                    </div>
                    <p className={`text-xs font-semibold ${['', 'text-red-500', 'text-amber-500', 'text-blue-600', 'text-emerald-600'][strength]}`}>
                      {strengthLabels[strength]}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 tracking-wide uppercase">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showCf ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat password"
                    className={`w-full px-4 py-3 rounded-xl border bg-neutral-50 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 transition-all pr-11 ${
                      confirm && confirm !== password ? 'border-red-300 focus:ring-red-200 focus:border-red-400' :
                      confirm && confirm === password ? 'border-emerald-300 focus:ring-emerald-200 focus:border-emerald-400' :
                      'border-neutral-200 focus:ring-[#5E43F3]/30 focus:border-[#5E43F3]'
                    }`}
                  />
                  <button type="button" onClick={() => setShowCf(!showCf)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer">
                    {showCf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {confirm && confirm === password && (
                    <div className="absolute right-10 top-1/2 -translate-y-1/2">
                      <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-[#5E43F3]/25 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Updating...</span></> : <><span>Reset Password</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-6 py-8">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center animate-in zoom-in duration-300">
                <Check className="w-10 h-10 text-emerald-500 stroke-[2.5]" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-neutral-950">Password updated!</h2>
              <p className="text-neutral-500 text-sm">Redirecting you to login...</p>
            </div>
            <div className="w-8 h-8 border-3 border-[#5E43F3] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}
      </div>
    </div>
  );
};
