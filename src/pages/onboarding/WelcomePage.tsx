import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowRight, MapPin, CalendarDays, Utensils, ShoppingBag, Music, Bike, Gamepad2, Users } from 'lucide-react';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Community "Stickers"
  const stickers = [
    { id: 1, icon: MapPin, color: 'text-rose-500', label: 'Local', pos: 'top-[10%] left-[5%] md:top-[15%] md:left-[15%]', rot: '-rotate-3', delay: 'delay-100', float: 'animate-[float_6s_ease-in-out_infinite]' },
    { id: 2, icon: CalendarDays, color: 'text-amber-500', label: 'Events', pos: 'top-[15%] right-[5%] md:top-[20%] md:right-[15%]', rot: 'rotate-3', delay: 'delay-300', float: 'animate-[float_7s_ease-in-out_infinite_1s]' },
    { id: 3, icon: Utensils, color: 'text-orange-500', label: 'Food', pos: 'top-[45%] left-[2%] md:top-[40%] md:left-[10%]', rot: '-rotate-2', delay: 'delay-500', float: 'animate-[float_5s_ease-in-out_infinite_2s]' },
    { id: 4, icon: ShoppingBag, color: 'text-emerald-500', label: 'Shops', pos: 'top-[50%] right-[2%] md:top-[45%] md:right-[10%]', rot: 'rotate-2', delay: 'delay-200', float: 'animate-[float_6s_ease-in-out_infinite_0.5s]' },
    { id: 5, icon: Music, color: 'text-purple-500', label: 'Music', pos: 'bottom-[15%] left-[8%] md:bottom-[20%] md:left-[20%]', rot: '-rotate-3', delay: 'delay-700', float: 'animate-[float_8s_ease-in-out_infinite_1.5s]' },
    { id: 6, icon: Users, color: 'text-blue-500', label: 'People', pos: 'bottom-[20%] right-[8%] md:bottom-[25%] md:right-[20%]', rot: 'rotate-3', delay: 'delay-400', float: 'animate-[float_5.5s_ease-in-out_infinite_0.2s]' },
    { id: 7, icon: Gamepad2, color: 'text-indigo-500', label: 'Gaming', pos: 'hidden lg:flex top-[70%] left-[10%]', rot: '-rotate-2', delay: 'delay-1000', float: 'animate-[float_6.5s_ease-in-out_infinite_0.8s]' },
    { id: 8, icon: Bike, color: 'text-cyan-500', label: 'Outdoors', pos: 'hidden lg:flex top-[75%] right-[10%]', rot: 'rotate-2', delay: 'delay-800', float: 'animate-[float_7s_ease-in-out_infinite_1.2s]' },
  ];

  return (
    <div className="min-h-screen bg-[#1877F2] overflow-hidden relative flex flex-col items-center selection:bg-white/30 selection:text-white">
      
      {/* Custom Keyframes for Floating Animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
      `}} />

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-[1400px] flex-1 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        
        {/* Floating Stickers (Absolute Layer) */}
        <div className={`absolute inset-0 pointer-events-none transition-all duration-1000 ease-out ${visible ? 'opacity-100' : 'opacity-0'}`}>
          {stickers.map((sticker) => (
            <div
              key={sticker.id}
              className={`absolute ${sticker.pos} ${sticker.delay} transition-transform duration-700 ${visible ? 'scale-100' : 'scale-0'}`}
            >
              <div className={`${sticker.float}`}>
                <div className={`bg-white px-3 py-2 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-neutral-100 flex items-center gap-2 transform ${sticker.rot}`}>
                  <sticker.icon className={`w-4 h-4 ${sticker.color}`} strokeWidth={2.5} />
                  <span className="text-xs font-black text-neutral-800 tracking-tight">{sticker.label}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Logo (Top) */}
        <div className={`absolute top-8 md:top-12 left-0 right-0 w-full flex justify-center transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <Zap className="w-5 h-5 text-[#1877F2] fill-[#1877F2]" />
            </div>
            <span className="text-white font-black text-2xl tracking-tight">lalao</span>
          </div>
        </div>

        {/* Hero Section (Center) */}
        <div className={`relative z-20 w-full max-w-[90%] md:max-w-2xl text-center flex flex-col items-center justify-center transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          
          <h1 className="text-[2.75rem] leading-[1.05] sm:text-6xl md:text-7xl lg:text-[5rem] text-white tracking-tight mb-5 md:mb-6">
            <span className="font-black block">Your Community</span>
            <span className="font-bold block mt-1">Starts Here.</span>
          </h1>
          
          <p className="text-base sm:text-lg lg:text-xl text-white/80 font-medium leading-snug mb-10 md:mb-12 max-w-md mx-auto px-4 md:px-0">
            Discover people, places, events and opportunities happening around you.
          </p>

          <div className="w-full max-w-sm flex flex-col items-center space-y-5">
            <button
              onClick={() => navigate('/signup')}
              className="w-full py-4 rounded-2xl bg-[#155EEF] hover:bg-[#114BBE] text-white font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg hover:shadow-xl cursor-pointer ring-4 ring-white/10"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => navigate('/login')}
              className="text-white/90 hover:text-white font-bold text-sm transition-colors cursor-pointer py-2 px-4 rounded-lg hover:bg-white/10"
            >
              Already have an account? Sign in
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

