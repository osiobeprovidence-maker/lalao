import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, ArrowRight, Loader2, Zap, User,
  Building2, Users, Shield, HeartHandshake, Check,
} from 'lucide-react';

type AccountType = 'person' | 'business' | 'organization' | 'club' | 'community';

const accountTypes: {
  id: AccountType;
  label: string;
  icon: React.FC<{ className?: string }>;
  desc: string;
  badge: string;
}[] = [
  { id: 'person', label: 'Person', icon: User, desc: 'Individual personal account', badge: '' },
  { id: 'business', label: 'Business', icon: Building2, desc: 'Shop, brand or enterprise', badge: 'BIZ' },
  { id: 'organization', label: 'Organization', icon: Shield, desc: 'NGO, government or body', badge: 'ORG' },
  { id: 'club', label: 'Club', icon: Users, desc: 'Sports, gaming or hobby club', badge: 'CLUB' },
  { id: 'community', label: 'Community', icon: HeartHandshake, desc: 'Local group or movement', badge: 'COM' },
];

type Step = 'details' | 'type' | 'done';

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('details');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>('person');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);

  // Auto-generate username from name
  const handleNameChange = (val: string) => {
    setName(val);
    const suggested = val.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_]/g, '');
    setUsername(suggested);
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { setError('All fields are required.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!agreed) { setError('Please accept the terms to continue.'); return; }
    setError('');
    setStep('type');
  };

  const handleFinalSubmit = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    setIsLoading(false);
    navigate('/verify', { state: { email, fromSignup: true } });
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden bg-gradient-to-br from-[#5E43F3] via-[#4E34E0] to-[#3B28C2] flex-col justify-between p-12">
        <div className="absolute top-[-100px] right-[-100px] w-[350px] h-[350px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-full h-[280px] bg-gradient-to-t from-[#3B28C2]/50 to-transparent" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-white font-black text-2xl tracking-tight">lalao</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-white leading-tight tracking-tight">
              Everything local.<br />Everything connected.
            </h1>
            <p className="text-white/60 text-base leading-relaxed">
              From neighborhood rallies to esports tournaments — Lalao is where your community comes alive.
            </p>
          </div>
          {/* Feature list */}
          <ul className="space-y-3">
            {[
              'Discover people & events within walking distance',
              'Shop from local businesses on your feed',
              'Join esports tournaments with ₦500k prize pools',
              'Share Cycles (stories) tied to your neighborhood',
            ].map((feat, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center mt-0.5 shrink-0">
                  <Check className="w-3 h-3 text-white stroke-[3]" />
                </div>
                <span className="text-white/75 text-sm">{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-white/30 text-xs">© 2026 Lalao · Made in Delta State</p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 sm:px-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl bg-[#5E43F3] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-black text-xl tracking-tight text-neutral-900">lalao</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Progress indicator */}
          <div className="flex items-center gap-2 mb-8">
            {(['details', 'type'] as Step[]).map((s, i) => (
              <React.Fragment key={s}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  step === s ? 'bg-[#5E43F3] text-white scale-110' :
                  (step === 'type' && s === 'details') ? 'bg-emerald-500 text-white' :
                  'bg-neutral-100 text-neutral-400'
                }`}>
                  {step === 'type' && s === 'details' ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : i + 1}
                </div>
                {i < 1 && <div className={`flex-1 h-0.5 rounded-full transition-all ${step === 'type' ? 'bg-[#5E43F3]' : 'bg-neutral-100'}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* STEP 1: Details */}
          {step === 'details' && (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <h2 className="text-3xl font-black text-neutral-950 tracking-tight">Create account</h2>
                <p className="text-neutral-500 text-sm">Join your local community on Lalao</p>
              </div>

              <form onSubmit={handleDetailsSubmit} className="space-y-4">
                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-neutral-700 tracking-wide uppercase">Full Name</label>
                    <input
                      type="text" value={name} onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Providence Osiobe"
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/30 focus:border-[#5E43F3] transition-all"
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-neutral-700 tracking-wide uppercase">Username</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-semibold">@</span>
                      <input
                        type="text" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                        placeholder="yourhandle"
                        className="w-full pl-7 pr-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/30 focus:border-[#5E43F3] transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 tracking-wide uppercase">Email or Phone</label>
                  <input
                    type="text" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com or 0801..."
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/30 focus:border-[#5E43F3] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 tracking-wide uppercase">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/30 focus:border-[#5E43F3] transition-all pr-11"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Password strength bar */}
                  {password.length > 0 && (
                    <div className="flex gap-1 mt-1.5">
                      {[1, 2, 3, 4].map((seg) => (
                        <div key={seg} className={`flex-1 h-1 rounded-full transition-all ${
                          password.length >= seg * 3
                            ? seg <= 1 ? 'bg-red-400' : seg <= 2 ? 'bg-amber-400' : seg <= 3 ? 'bg-blue-400' : 'bg-emerald-500'
                            : 'bg-neutral-100'
                        }`} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Terms */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div
                    onClick={() => setAgreed(!agreed)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${agreed ? 'bg-[#5E43F3] border-[#5E43F3]' : 'border-neutral-300 group-hover:border-[#5E43F3]'}`}
                  >
                    {agreed && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </div>
                  <span className="text-xs text-neutral-500 leading-relaxed">
                    I agree to Lalao's{' '}
                    <a href="#" className="text-[#5E43F3] font-semibold hover:underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-[#5E43F3] font-semibold hover:underline">Privacy Policy</a>
                  </span>
                </label>

                <button type="submit" className="w-full py-3.5 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-[#5E43F3]/25 cursor-pointer">
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <p className="text-center text-sm text-neutral-500">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-[#5E43F3] hover:text-[#4E34E0] transition-colors">Sign in</Link>
              </p>
            </div>
          )}

          {/* STEP 2: Account Type */}
          {step === 'type' && (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <h2 className="text-3xl font-black text-neutral-950 tracking-tight">Account type</h2>
                <p className="text-neutral-500 text-sm">What best describes you on Lalao?</p>
              </div>

              <div className="space-y-2.5">
                {accountTypes.map(({ id, label, icon: Icon, desc, badge }) => {
                  const isSelected = accountType === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setAccountType(id)}
                      className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-left cursor-pointer ${
                        isSelected ? 'border-[#5E43F3] bg-indigo-50/60' : 'border-neutral-150 bg-neutral-50 hover:border-neutral-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#5E43F3] text-white' : 'bg-neutral-200/70 text-neutral-500'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm ${isSelected ? 'text-[#5E43F3]' : 'text-neutral-900'}`}>{label}</span>
                          {badge && (
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-[#5E43F3] text-white' : 'bg-neutral-200 text-neutral-600'}`}>
                              {badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${isSelected ? 'border-[#5E43F3] bg-[#5E43F3]' : 'border-neutral-300'}`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="flex-1 py-3.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 font-bold text-sm transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isLoading}
                  className="flex-[2] py-3.5 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-[#5E43F3]/25 disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Creating...</span></> : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
