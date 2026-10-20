import React from 'react';
import {
  Flame,
  Shield,
  Heart,
  Users,
  MapPin,
  Lock,
  MessageCircle,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';

export const PlumAboutUs: React.FC = () => {
  return (
    <div className="w-full px-3 sm:px-4 py-5 space-y-6 animate-in fade-in duration-200">
      {/* Brand Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-[#7B1FA2] via-[#C2185B] to-[#FF4081] p-6 sm:p-8 text-white shadow-xl shadow-pink-500/15">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
            <Flame className="w-7 h-7 text-white stroke-[2.3]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">About Plum</h1>
            <p className="text-xs sm:text-sm text-white/90">
              The Adults-Only Dating Experience on LaLao.website
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs sm:text-sm text-white/95 leading-relaxed max-w-[500px]">
          Plum is built to bring adults together for meaningful conversations, romance, and genuine connection while protecting personal privacy and member choice at every turn.
        </p>
      </div>

      {/* Core Principles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-3xl bg-theme-surface border border-theme-divider-light space-y-2">
          <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-theme-primary">How Discovery Works</h3>
          <p className="text-xs text-theme-secondary leading-relaxed">
            Plum matches members based on mutual dating preferences. You only discover people who fit your preferences and whose preferences match your identity.
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-theme-surface border border-theme-divider-light space-y-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-theme-primary">Private Photo Vault</h3>
          <p className="text-xs text-theme-secondary leading-relaxed">
            Your private photos are never displayed in search results or discovery cards. Access is strictly granted by you on a member-by-member basis through server-verified authorization.
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-theme-surface border border-theme-divider-light space-y-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-theme-primary">Safe Location Radii</h3>
          <p className="text-xs text-theme-secondary leading-relaxed">
            Your live home or exact GPS pin is never shared. The Plum Map only shows safe approximate cluster hubs and honors your map visibility consent.
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-theme-surface border border-theme-divider-light space-y-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-theme-primary">Adults Only (18+)</h3>
          <p className="text-xs text-theme-secondary leading-relaxed">
            Plum is exclusively for consenting adults aged 18 and older. Our age assurance protocol verifies adult status before profile creation is permitted.
          </p>
        </div>
      </div>

      {/* Guidelines & Safety (Requirement 4: About Us Community guidelines, reporting, blocking) */}
      <div className="p-5 rounded-3xl bg-theme-surface border border-theme-divider-light space-y-3">
        <h3 className="text-sm font-bold text-theme-primary flex items-center gap-2">
          <Heart className="w-4 h-4 text-pink-500" /> Community & Safety Standards
        </h3>
        <ul className="text-xs text-theme-secondary space-y-2 leading-relaxed list-disc list-inside">
          <li>
            <strong className="text-theme-primary">Consent & Respect:</strong> Harassment, offensive comments, or non-consensual behavior will result in an immediate account suspension.
          </li>
          <li>
            <strong className="text-theme-primary">Integrated Chat:</strong> All Plum conversations run securely through LaLao&apos;s verified messaging infrastructure with end-to-end privacy controls.
          </li>
          <li>
            <strong className="text-theme-primary">Blocking & Moderation:</strong> You can block any member from their profile or report violations directly to our moderation team 24/7.
          </li>
          <li>
            <strong className="text-theme-primary">Profile Deactivation:</strong> You can pause or deactivate your Plum dating profile at any time in Profile settings without affecting your primary LaLao account.
          </li>
        </ul>
      </div>

      {/* Support & Contact */}
      <div className="p-4 rounded-3xl bg-theme-base border border-theme-divider-light text-center space-y-2">
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-theme-primary">
          <HelpCircle className="w-4 h-4 text-pink-500" />
          <span>Need Assistance or Have Feedback?</span>
        </div>
        <p className="text-[11px] text-theme-secondary max-w-[420px] mx-auto">
          Contact the LaLao Trust & Safety team directly via support@lalao.website or use the built-in Help Center in your account settings.
        </p>
      </div>
    </div>
  );
};
