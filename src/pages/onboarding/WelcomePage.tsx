import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, MapPin, Users, Gamepad2, ShoppingBag, Radio, ArrowRight } from 'lucide-react';

const features = [
  { icon: MapPin, label: 'Nearby Feed', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { icon: Users, label: 'Rallies', color: 'text-blue-500', bg: 'bg-blue-50' },
  { icon: Gamepad2, label: 'Esports', color: 'text-[#5E43F3]', bg: 'bg-indigo-50' },
  { icon: ShoppingBag, label: 'Local Shop', color: 'text-amber-500', bg: 'bg-amber-50' },
  { icon: Radio, label: 'Cycles', color: 'text-rose-500', bg: 'bg-rose-50' },
];

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5E43F3] via-[#4E34E0] to-[#3B28C2] flex flex-col items-center justify-between px-6 py-12 overflow-hidden relative">
      {/* Decorative circles */}
      <div className="absolute top-[-120px] right-[-120px] w-[380px] h-[380px] rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-80px] left-[-80px] w-[300px] h-[300px] rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/5 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-white/5 pointer-events-none" />

      {/* Skip button */}
      <div className="w-full flex justify-end relative z-10">
        <button
          onClick={() => navigate('/app')}
          className="text-white/50 hover:text-white/80 text-sm font-semibold transition-colors cursor-pointer"
        >
          Skip
        </button>
      </div>

      {/* Center content */}
      <div
        className={`flex-1 flex flex-col items-center justify-center text-center space-y-10 relative z-10 transition-all duration-700 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Animated logo */}
        <div className="relative">
          <div className="w-28 h-28 rounded-[2rem] bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl">
            <Zap className="w-14 h-14 text-white fill-white" />
          </div>
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-[2rem] border-2 border-white/20 animate-ping" style={{ animationDuration: '2s' }} />
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl font-black text-white tracking-tight leading-tight">
            Welcome to<br />
            <span className="text-white/80">Lalao</span>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed max-w-xs">
            Your neighborhood. Your community. Your platform.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2.5 max-w-xs">
          {features.map(({ icon: Icon, label, color, bg }, i) => (
            <div
              key={label}
              style={{ animationDelay: `${i * 80}ms` }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/12 backdrop-blur border border-white/15 text-white text-sm font-semibold animate-in fade-in slide-in-from-bottom-2 duration-500`}
            >
              <Icon className="w-3.5 h-3.5 text-white/80" />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Location indicator */}
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 border border-white/15 backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-white/70 text-sm font-semibold">Live in Delta State & beyond</span>
        </div>
      </div>

      {/* CTA */}
      <div
        className={`w-full max-w-sm space-y-3 relative z-10 transition-all duration-700 delay-300 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <button
          id="btn-welcome-get-started"
          onClick={() => navigate('/onboarding/account-type')}
          className="w-full py-4 rounded-2xl bg-white text-[#5E43F3] font-black text-base flex items-center justify-center gap-3 transition-all active:scale-[0.97] shadow-2xl cursor-pointer hover:bg-white/95"
        >
          <span>Get Started</span>
          <ArrowRight className="w-5 h-5" />
        </button>
        <button
          onClick={() => navigate('/login')}
          className="w-full py-4 rounded-2xl bg-white/10 border border-white/20 text-white font-bold text-base transition-all active:scale-[0.97] cursor-pointer hover:bg-white/15 backdrop-blur"
        >
          I already have an account
        </button>
      </div>
    </div>
  );
};
