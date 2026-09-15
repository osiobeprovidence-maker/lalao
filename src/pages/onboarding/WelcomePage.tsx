import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowRight, Calendar, Users, ShoppingBag, Map, Gamepad2, Radio, MapPin } from 'lucide-react';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const cards = [
    {
      id: 'events',
      category: 'Events',
      icon: Calendar,
      title: 'Lagos Food Festival',
      subtitle: 'Dec 12 · Tafawa Balewa Square',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&auto=format&fit=crop&q=80',
      color: 'text-amber-600',
      bg: 'bg-amber-100',
      position: 'xl:top-[15%] xl:left-[10%] lg:top-[10%] lg:left-[5%]',
      rotation: '-rotate-3',
      delay: 'delay-[300ms]',
    },
    {
      id: 'community',
      category: 'Community',
      icon: Users,
      title: 'Good vibes only! 💜',
      subtitle: '12 new posts · 5m ago',
      image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&auto=format&fit=crop&q=80',
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      position: 'xl:top-[45%] xl:left-[5%] lg:top-[50%] lg:left-[2%]',
      rotation: 'rotate-2',
      delay: 'delay-[400ms]',
    },
    {
      id: 'shop',
      category: 'Local Shop',
      icon: ShoppingBag,
      title: 'Fresh Farm Produce',
      subtitle: 'Quality · Affordable · Local',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&auto=format&fit=crop&q=80',
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      position: 'xl:bottom-[15%] xl:left-[15%] lg:bottom-[10%] lg:left-[10%]',
      rotation: '-rotate-2',
      delay: 'delay-[500ms]',
    },
    {
      id: 'rallies',
      category: 'Rallies',
      icon: Map,
      title: 'Riders Unite',
      subtitle: 'Sat, 8 AM · 15km Ride',
      image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&auto=format&fit=crop&q=80',
      color: 'text-rose-600',
      bg: 'bg-rose-100',
      position: 'xl:top-[10%] xl:right-[15%] lg:top-[5%] lg:right-[10%]',
      rotation: 'rotate-3',
      delay: 'delay-[600ms]',
    },
    {
      id: 'esports',
      category: 'Esports',
      icon: Gamepad2,
      title: 'FIFA 26 Tournament',
      subtitle: 'Registration Open · 32 Teams',
      image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&auto=format&fit=crop&q=80',
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
      position: 'xl:top-[40%] xl:right-[5%] lg:top-[45%] lg:right-[2%]',
      rotation: '-rotate-2',
      delay: 'delay-[700ms]',
    },
    {
      id: 'cycles',
      category: 'Cycles',
      icon: Radio,
      title: 'Community Clean-up',
      subtitle: 'Starting in 2 hours',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&auto=format&fit=crop&q=80',
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      position: 'xl:bottom-[20%] xl:right-[10%] lg:bottom-[15%] lg:right-[5%]',
      rotation: 'rotate-2',
      delay: 'delay-[800ms]',
    },
  ];

  return (
    <div className="min-h-screen bg-[#3823A4] overflow-hidden relative flex flex-col items-center selection:bg-white/30 selection:text-white">
      {/* Background gradients and elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#5E43F3] via-[#3823A4] to-[#25167A] opacity-90" />
        <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-500/30 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-purple-500/20 blur-[100px]" />
        
        {/* Subtle curved lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03] text-white" xmlns="http://www.w3.org/2000/svg">
          <pattern id="concentric" width="100" height="100" patternUnits="userSpaceOnUse">
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#concentric)" />
        </svg>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-[1600px] flex-1 flex flex-col lg:flex-row items-center justify-center min-h-screen px-6 py-12 lg:py-0">
        
        {/* Mobile Logo (Top) */}
        <div className="w-full flex justify-center mb-8 lg:absolute lg:top-12 lg:left-0 lg:right-0">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-white font-black text-2xl tracking-tight">lalao</span>
          </div>
        </div>

        {/* Hero Section (Center) */}
        <div className={`w-full max-w-xl text-center flex flex-col items-center justify-center z-20 transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] mb-6">
            Your Community<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#D0C6FF] to-[#A088FF]">Starts Here.</span>
          </h1>
          
          <p className="text-base sm:text-lg lg:text-xl text-white/80 leading-relaxed mb-10 max-w-md mx-auto">
            Discover people, places, events and opportunities happening around you.
          </p>

          <div className="w-full max-w-sm space-y-4">
            <button
              onClick={() => navigate('/onboarding/account-type')}
              className="w-full py-4 sm:py-5 rounded-2xl bg-white text-[#3823A4] hover:bg-neutral-50 font-black text-lg flex items-center justify-center gap-3 transition-transform active:scale-[0.98] shadow-xl hover:shadow-2xl cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3.5 rounded-2xl text-white/90 hover:text-white font-semibold text-sm transition-colors hover:bg-white/5 cursor-pointer"
            >
              Already have an account? Sign in
            </button>
          </div>

          <div className="mt-12 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs sm:text-sm text-white/70 font-medium">Connecting communities across Nigeria</span>
          </div>
        </div>

        {/* Floating Cards (Desktop/Tablet) */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none z-10">
          {cards.map((card, index) => (
            <div
              key={card.id}
              className={`absolute w-64 p-3 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/50 transition-all duration-1000 ease-out transform ${card.position} ${card.rotation} ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-16 scale-95'} ${card.delay}`}
            >
              <div className="relative w-full h-32 rounded-xl overflow-hidden mb-3">
                <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white shadow-sm">
                  <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
                  <span className="text-[10px] font-bold text-neutral-900 tracking-wide uppercase">{card.category}</span>
                </div>
              </div>
              <div className="px-1">
                <h3 className="text-sm font-black text-neutral-900 leading-tight truncate">{card.title}</h3>
                <p className="text-[11px] text-neutral-500 font-medium mt-1 truncate">{card.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile/Tablet Horizontal Carousel */}
      <div className={`w-full lg:hidden relative z-20 pb-12 transition-all duration-1000 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar px-6 gap-4 pb-8">
          {cards.map((card) => (
            <div
              key={card.id}
              className="snap-center shrink-0 w-64 p-3 bg-white rounded-2xl shadow-xl border border-neutral-100"
            >
              <div className="relative w-full h-32 rounded-xl overflow-hidden mb-3">
                <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white shadow-sm">
                  <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
                  <span className="text-[10px] font-bold text-neutral-900 tracking-wide uppercase">{card.category}</span>
                </div>
              </div>
              <div className="px-1">
                <h3 className="text-sm font-black text-neutral-900 leading-tight truncate">{card.title}</h3>
                <p className="text-[11px] text-neutral-500 font-medium mt-1 truncate">{card.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Style to hide scrollbar in modern browsers */}
        <style dangerouslySetInnerHTML={{__html: `
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}} />
      </div>
    </div>
  );
};

