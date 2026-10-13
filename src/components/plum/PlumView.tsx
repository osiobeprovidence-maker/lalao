import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageCircle,
  Map as MapIcon,
  User as UserIcon,
  Info,
  ShieldCheck,
  Flame,
  AlertTriangle,
  ArrowRight,
  Heart,
  Lock,
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import { PlumMembers } from './PlumMembers';
import { PlumMap } from './PlumMap';
import { PlumProfileManager } from './PlumProfileManager';
import { PlumAboutUs } from './PlumAboutUs';
import { PlumProfileCreation } from './PlumProfileCreation';
import { PlumMemberProfilePage } from './PlumMemberProfilePage';
import { MessagesView } from '../messages/MessagesView';

export type PlumSubTab = 'members' | 'map' | 'profile' | 'about';

export const PlumView: React.FC = () => {
  const { currentUser, triggerShareToast, setActiveTab, activeChatId } = useLalao();

  // Active sub-tab inside Plum: Members, Map, Profile, About Us (strictly 4 tabs)
  const [activeSubTab, setActiveSubTab] = useState<PlumSubTab>('members');

  // Dedicated member profile full page state (Requirement 1)
  const [selectedMemberUserId, setSelectedMemberUserId] = useState<string | null>(() => {
    try {
      const hash = window.location.hash || '';
      if (hash.startsWith('#plum-member-')) {
        return hash.replace('#plum-member-', '');
      }
    } catch {
      // ignore
    }
    return null;
  });

  // Member targeted for map viewing
  const [mapTargetUserId, setMapTargetUserId] = useState<string | null>(null);

  // Sync member profile with URL hash and popstate for back/forward navigation
  useEffect(() => {
    const handleHashOrPop = () => {
      const hash = window.location.hash || '';
      if (hash.startsWith('#plum-member-')) {
        const id = hash.replace('#plum-member-', '');
        setSelectedMemberUserId(id);
      } else {
        setSelectedMemberUserId(null);
      }
    };

    window.addEventListener('popstate', handleHashOrPop);
    window.addEventListener('hashchange', handleHashOrPop);
    return () => {
      window.removeEventListener('popstate', handleHashOrPop);
      window.removeEventListener('hashchange', handleHashOrPop);
    };
  }, []);

  const handleOpenMemberProfile = (userId: string) => {
    setSelectedMemberUserId(userId);
    try {
      window.history.pushState({ plumMember: userId }, '', `#plum-member-${userId}`);
    } catch {
      // ignore
    }
  };

  const handleBackToMembers = () => {
    setSelectedMemberUserId(null);
    try {
      if (window.location.hash.startsWith('#plum-member-')) {
        window.history.back();
      }
    } catch {
      // ignore
    }
  };

  // Age confirmation checkbox state
  const [ageConfirmedChecked, setAgeConfirmedChecked] = useState(false);
  const [isSubmittingAge, setIsSubmittingAge] = useState(false);

  // Convex queries
  const eligibility = useQuery(api.plum.getPlumEligibility);
  const confirmAgeMutation = useMutation(api.plum.confirmAge);

  const handleConfirmAge = async () => {
    if (!ageConfirmedChecked) return;
    try {
      setIsSubmittingAge(true);
      await confirmAgeMutation({ confirmed: true });
      triggerShareToast('Age verified for Plum dating');
    } catch (err: any) {
      triggerShareToast(err.message || 'Failed to confirm age');
    } finally {
      setIsSubmittingAge(false);
    }
  };

  // Loading state
  if (eligibility === undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="relative">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-[#7B1FA2] via-[#E91E63] to-[#FF4081] flex items-center justify-center shadow-lg shadow-pink-500/20 animate-pulse">
            <Flame className="w-7 h-7 text-white" />
          </div>
        </div>
        <p className="mt-4 text-xs font-semibold tracking-wider uppercase text-theme-tertiary">
          Entering Plum...
        </p>
      </div>
    );
  }

  // 1. AGE CONFIRMATION SCREEN (Requirement 2)
  if (!eligibility.isAgeConfirmed) {
    return (
      <div className="max-w-[560px] mx-auto px-4 py-8 animate-in fade-in duration-300">
        <div className="relative overflow-hidden rounded-3xl border border-pink-500/20 bg-gradient-to-b from-[#2a0845]/10 via-theme-surface to-theme-surface p-6 sm:p-8 shadow-xl shadow-pink-500/5">
          {/* Subtle plum badge */}
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#7B1FA2] via-[#C2185B] to-[#FF4081] flex items-center justify-center shadow-lg shadow-pink-500/30 ring-4 ring-pink-500/10">
              <Flame className="w-8 h-8 text-white stroke-[2.2]" />
            </div>
          </div>

          <div className="mt-5 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> Adults Only (18+)
            </span>
            <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-theme-primary">
              Welcome to Plum
            </h1>
            <p className="mt-2.5 text-sm text-theme-secondary leading-relaxed max-w-[420px] mx-auto">
              Meet people, make genuine connections, and discover potential partners within the LaLao community.
            </p>
          </div>

          <div className="mt-6 rounded-2xl bg-theme-base/60 border border-theme-divider-light p-4 space-y-3 text-xs text-theme-secondary">
            <div className="flex items-start gap-3">
              <div className="p-1 rounded-lg bg-pink-500/10 text-pink-500 shrink-0 mt-0.5">
                <Heart className="w-4 h-4" />
              </div>
              <p>
                Plum is exclusively designed for consenting adults aged 18 and older. Your standard LaLao profile details and dating preferences remain separate.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-500 shrink-0 mt-0.5">
                <Lock className="w-4 h-4" />
              </div>
              <p>
                Private photos and exact coordinates are strictly protected by backend authorizations. You control who sees your private vault.
              </p>
            </div>
          </div>

          {/* Explicit Age Confirmation Checkbox */}
          <div className="mt-6 p-4 rounded-2xl border-2 border-pink-500/30 bg-pink-500/5">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                id="checkbox-plum-age-confirmation"
                type="checkbox"
                checked={ageConfirmedChecked}
                onChange={(e) => setAgeConfirmedChecked(e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-pink-400 text-pink-600 focus:ring-pink-500 cursor-pointer accent-pink-600"
              />
              <span className="text-xs sm:text-sm font-semibold text-theme-primary leading-snug">
                I confirm that I am 18 years of age or older and agree to adhere to Plum&apos;s respectful dating guidelines.
              </span>
            </label>
          </div>

          {/* Continue Button */}
          <button
            id="btn-plum-continue-age"
            type="button"
            disabled={!ageConfirmedChecked || isSubmittingAge}
            onClick={handleConfirmAge}
            className={`mt-6 w-full py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
              ageConfirmedChecked && !isSubmittingAge
                ? 'bg-gradient-to-r from-[#8E24AA] via-[#E91E63] to-[#FF4081] text-white hover:opacity-95 shadow-pink-500/25 active:scale-[0.99]'
                : 'bg-theme-divider-light text-theme-tertiary cursor-not-allowed opacity-60'
            }`}
          >
            {isSubmittingAge ? (
              <span>Verifying...</span>
            ) : (
              <>
                <span>Continue to Plum</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // 2. PROFILE CREATION WIZARD (Only when age confirmed but no profile exists yet)
  if (!eligibility.hasProfile && !eligibility.profile) {
    return <PlumProfileCreation />;
  }

  // 3. MAIN PLUM PAGE LANDING SCREEN & 4-ITEM NAVIGATION (Requirement 1: Members, Map, Profile, About Us ONLY)
  const navTabs: { id: PlumSubTab; label: string; icon: typeof Users }[] = [
    { id: 'members', label: 'Members', icon: Users },
    { id: 'map', label: 'Map', icon: MapIcon },
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'about', label: 'About Us', icon: Info },
  ];

  return (
    <div className="w-full min-h-screen flex flex-col bg-theme-base pb-24 sm:pb-12">
      {/* Plum Page Cover Image */}
      <div className="relative h-44 sm:h-56 w-full shrink-0 bg-gradient-to-tr from-[#2a0845] via-[#4a148c] to-[#880e4f] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&auto=format&fit=crop&q=80"
          alt="Plum Dating Cover"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

        {/* Top Floating Controls */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-pink-400 border border-pink-500/30 text-[11px] font-black uppercase tracking-wider shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" /> Adults Only (18+)
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white/80 text-[11px] font-semibold border border-white/10 shadow-sm">
            LaLao Official Page
          </span>
        </div>
      </div>

      {/* Plum Page Profile Icon & Details Header */}
      <div className="px-4 sm:px-6 pt-0 pb-3 border-b border-theme-divider-light">
        <div className="flex items-start justify-between gap-4">
          {/* Profile Icon over Cover Image */}
          <div className="relative shrink-0 w-max -mt-10 sm:-mt-12 z-10">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-[#7B1FA2] via-[#C2185B] to-[#FF4081] flex items-center justify-center text-white shadow-xl shadow-pink-500/25 ring-4 ring-theme-base">
              <Flame className="w-10 h-10 sm:w-12 sm:h-12 stroke-[2.2]" />
            </div>
          </div>

          {/* User info pill or action button */}
          <div className="pt-2 sm:pt-3">
            {eligibility.profile && (
              <button
                type="button"
                onClick={() => setActiveSubTab('profile')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-theme-surface text-theme-secondary hover:text-theme-primary text-xs font-semibold border border-theme-divider transition-all shadow-xs cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{eligibility.profile.displayName || 'My Dating Profile'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Page Name & Details */}
        <div className="mt-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-theme-primary tracking-tight">Plum</h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-pink-500/10 text-pink-500 border border-pink-500/20">
              DATING & CONNECTIONS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-theme-secondary leading-relaxed mt-1 max-w-[580px]">
            The adult dating space on LaLao. Discover compatible members, view detailed profiles, save favorites, and connect through LaLao Messages.
          </p>
        </div>

        {/* Plum Navigation Menu: Strictly 4 items (Members, Map, Profile, About Us) */}
        <div className="mt-4">
          <nav
            id="plum-primary-navigation"
            aria-label="Plum dating navigation"
            className="grid grid-cols-4 gap-1 p-1 bg-theme-surface/80 border border-theme-divider rounded-2xl shadow-xs"
          >
            {navTabs.map(({ id, label, icon: Icon }) => {
              const isActive = activeSubTab === id;
              return (
                <button
                  key={id}
                  id={`btn-plum-tab-${id}`}
                  type="button"
                  onClick={() => setActiveSubTab(id)}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#8E24AA] via-[#E91E63] to-[#FF4081] text-white shadow-sm shadow-pink-500/25 scale-[1.02]'
                      : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-base/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                  <span className="text-[11px] sm:text-xs truncate">{label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Connected Functional Page Sections */}
      <div className={`flex-1 w-full mx-auto px-2 pt-3 ${selectedMemberUserId ? 'max-w-4xl' : 'max-w-[620px]'}`}>
        {activeSubTab === 'members' && (
          selectedMemberUserId ? (
            <PlumMemberProfilePage
              userId={selectedMemberUserId}
              onBack={handleBackToMembers}
              onOpenChat={() => {
                setActiveTab('messages');
              }}
              onViewOnMap={(userId) => {
                setMapTargetUserId(userId);
                setActiveSubTab('map');
              }}
              onNavigateMember={(newUserId) => {
                handleOpenMemberProfile(newUserId);
              }}
            />
          ) : (
            <PlumMembers
              myProfile={eligibility.profile}
              onEditProfile={() => setActiveSubTab('profile')}
              onOpenChat={() => {
                // Direct navigation to LaLao's existing default Messages system
                setActiveTab('messages');
              }}
              onViewOnMap={(userId) => {
                setMapTargetUserId(userId);
                setActiveSubTab('map');
              }}
              onSelectMember={(userId) => {
                handleOpenMemberProfile(userId);
              }}
            />
          )
        )}
        {activeSubTab === 'map' && (
          <PlumMap
            targetUserId={mapTargetUserId}
            onOpenChat={() => {
              setActiveTab('messages');
            }}
          />
        )}
        {activeSubTab === 'profile' && <PlumProfileManager myProfile={eligibility.profile} />}
        {activeSubTab === 'about' && <PlumAboutUs />}
      </div>
    </div>
  );
};
