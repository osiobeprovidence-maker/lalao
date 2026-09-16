import React, { useState, useRef } from 'react';
import {
  X,
  ArrowLeft,
  Users,
  Shield,
  Plus,
  CheckCircle2,
  UserPlus,
  Sparkles,
  Trophy,
  Swords,
  Upload,
  Image as ImageIcon,
  Wallet,
  CreditCard,
  Building2,
  Zap,
  Check,
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';
import { PlayerTeam } from '../../types';

interface TeammateSlot {
  id: string;
  name: string;
  username: string;
  avatar: string;
  role: string;
  isCaptain?: boolean;
}

const PRESET_LOGOS = [
  {
    name: 'Cyber Tiger',
    url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Esports Dragon',
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Neon Phoenix',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Vanguard Crest',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
  },
];

export const TournamentRegisterModal: React.FC = () => {
  const {
    registeringEvent,
    isTournamentRegisterOpen,
    setIsTournamentRegisterOpen,
    currentUser,
    addTeamRegistration,
    triggerShareToast,
    savedTeams,
    saveTeam,
    wallet,
    payWithWallet,
    setIsWalletModalOpen,
    addTicket,
  } = useLalao();

  // Wizard Steps: 'roster' (Step 1: Team & 5 players) -> 'checkout' (Step 2: Wallet / Payment) -> 'confirmed' (Step 3: Ticket / Seed)
  const [currentStep, setCurrentStep] = useState<'roster' | 'checkout' | 'confirmed'>('roster');

  const [teamName, setTeamName] = useState('Delta Strikers');
  const [teamTag, setTeamTag] = useState('DST');
  const [selectedLogo, setSelectedLogo] = useState(PRESET_LOGOS[0].url);
  const [isCustomLogo, setIsCustomLogo] = useState(false);
  const [savedTeamId, setSavedTeamId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial roster has 4 players, 5th required
  const [roster, setRoster] = useState<TeammateSlot[]>([
    {
      id: currentUser.id,
      name: currentUser.name,
      username: currentUser.username,
      avatar: currentUser.avatar,
      role: 'Mid Lane (Mage)',
      isCaptain: true,
    },
    {
      id: 'user_alex',
      name: 'Alexandre Okafor',
      username: 'alexokafor',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
      role: 'Jungler (Assassin)',
    },
    {
      id: 'tunde_demo',
      name: 'Tunde Balogun',
      username: 'tundebalogun',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
      role: 'Clash Lane (Fighter)',
    },
    {
      id: 'amaka_demo',
      name: 'Amaka Nwosu',
      username: 'amakanwosu',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
      role: 'Farm Lane (Marksman)',
    },
  ]);

  const [isInvitePickerOpen, setIsInvitePickerOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'paystack'>('wallet');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isTournamentRegisterOpen || !registeringEvent) return null;

  const event = registeringEvent;
  const isRosterComplete = roster.length >= 5;

  // Calculate entry fee (default ₦2,500 if paid event, or 0 if free)
  const isPaidEvent = !event.isFree && ((event.entryFee && event.entryFee > 0) || (event.price && event.price > 0));
  const entryFee = isPaidEvent ? (event.entryFee || event.price || 2500) : 0;
  const hasEnoughWalletBalance = wallet.balance >= entryFee;

  const availableFriends = [
    {
      id: 'david_demo',
      name: 'David Morgan',
      username: 'davidmorgan',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      preferredRole: 'Roamer (Support / Tank)',
    },
    {
      id: 'fatima_demo',
      name: 'Fatima Bello',
      username: 'fatimabello',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
      preferredRole: 'Roamer (Control)',
    },
    {
      id: 'user_emeka',
      name: 'Emeka Nwosu',
      username: 'emekagamer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      preferredRole: 'Sub Flex',
    },
  ];

  const handleAddTeammate = (friend: typeof availableFriends[0]) => {
    if (roster.length < 5) {
      setRoster([
        ...roster,
        {
          id: friend.id,
          name: friend.name,
          username: friend.username,
          avatar: friend.avatar,
          role: friend.preferredRole,
        },
      ]);
      setIsInvitePickerOpen(false);
      triggerShareToast(`Added ${friend.name} to ${teamName}`);
    }
  };

  const handleRemoveTeammate = (id: string) => {
    if (id === currentUser.id) return; // cannot remove captain
    setRoster(roster.filter((p) => p.id !== id));
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setSelectedLogo(uploadEvent.target.result as string);
          setIsCustomLogo(true);
          triggerShareToast('Custom team logo uploaded!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Step 1 -> Step 2: Store Team & Proceed
  const handleSaveTeamAndProceed = () => {
    if (!teamName.trim()) {
      triggerShareToast('Please enter a valid team name');
      return;
    }
    if (roster.length < 5) {
      triggerShareToast('Your squad requires exactly 5 players to register.');
      return;
    }

    const newTeamId = savedTeamId || `team_${Date.now()}`;
    const newTeam: PlayerTeam = {
      id: newTeamId,
      name: teamName.trim(),
      tag: (teamTag.trim() || 'LAL').toUpperCase(),
      logo: selectedLogo,
      isCustomLogo,
      captain: {
        id: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar,
      },
      players: roster.map((p) => ({
        id: p.id,
        name: p.name,
        username: p.username,
        avatar: p.avatar,
        role: p.role,
      })),
      createdAt: new Date().toISOString(),
      stats: {
        matchesPlayed: 0,
        wins: 0,
        winRate: '0%',
      },
    };

    saveTeam(newTeam);
    setSavedTeamId(newTeamId);
    triggerShareToast(`Team "${teamName}" saved successfully!`);
    setCurrentStep('checkout');
  };

  // Step 2 -> Step 3: Complete Tournament Registration & Payment
  const handleCompleteRegistration = () => {
    setIsProcessing(true);

    if (entryFee > 0 && paymentMethod === 'wallet') {
      const success = payWithWallet(
        entryFee,
        `Tournament Entry: ${event.title} (${teamName})`,
        `LLW-TOUR-${Math.floor(100000 + Math.random() * 900000)}`
      );

      if (!success) {
        setIsProcessing(false);
        triggerShareToast('Insufficient wallet balance. Please top up your wallet.');
        return;
      }
    }

    setTimeout(() => {
      setIsProcessing(false);
      setCurrentStep('confirmed');

      // Add Tournament Registration
      addTeamRegistration({
        id: `reg_${Date.now()}`,
        eventId: event.id,
        eventTitle: event.title,
        teamName,
        teamTag,
        teamLogo: selectedLogo,
        captain: {
          id: currentUser.id,
          name: currentUser.name,
          username: currentUser.username,
          avatar: currentUser.avatar,
        },
        players: roster.map((p) => ({
          id: p.id,
          name: p.name,
          username: p.username,
          avatar: p.avatar,
          role: p.role,
        })),
        status: 'confirmed',
        registeredAt: new Date().toISOString(),
        entryFee,
        paymentMethod: entryFee === 0 ? 'free' : paymentMethod,
      });

      // Also create an Event Team Ticket Pass
      addTicket({
        id: `tkt_team_${Date.now()}`,
        eventId: event.id,
        eventTitle: event.title,
        organizationName: event.organizationName || 'Honor of Kings Esports',
        organizationAvatar: event.organizationAvatar,
        userId: currentUser.id,
        holderName: currentUser.name,
        ticketType: 'Team Tournament Pass',
        price: entryFee,
        currency: 'NGN',
        date: event.date,
        time: event.time,
        venue: event.location,
        status: 'active',
        qrCodeData: `HOK-TOUR-${teamTag}-${Date.now()}`,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`HOK-TOUR-${teamTag}-${Date.now()}`)}`,
        purchasedAt: new Date().toISOString(),
        purchaseDate: new Date().toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        eventBanner: event.coverImage,
        eventDate: event.date,
        eventTime: event.time,
        tier: 'Team Tournament Pass',
        qrCode: `HOK-TOUR-${teamTag}-${Date.now()}`,
        organizerName: event.organizationName || 'Honor of Kings Esports',
        organizerAvatar: event.organizationAvatar,
      });

      triggerShareToast('Tournament squad registration confirmed!');
    }, 1200);
  };

  const handleClose = () => {
    setIsTournamentRegisterOpen(false);
    setCurrentStep('roster');
  };

  return (
    <div
      id="screen-tournament-registration"
      className="absolute inset-0 z-40 bg-white flex flex-col min-h-full overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-200"
    >
      <div className="w-full max-w-3xl mx-auto flex flex-col flex-1 pb-24">
        {/* Sticky Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3.5 border-b border-neutral-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="btn-back-tournament-register"
              onClick={currentStep === 'checkout' ? () => setCurrentStep('roster') : handleClose}
              className="p-1.5 -ml-1 rounded-full text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-violet-100 text-[#5E43F3] flex items-center justify-center">
              <Swords className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-neutral-950 leading-tight">
                {currentStep === 'roster' && 'Tournament Squad Entry'}
                {currentStep === 'checkout' && 'Tournament Entry & Payment'}
                {currentStep === 'confirmed' && 'Registration Confirmed!'}
              </h2>
              <p className="text-[11px] text-neutral-500 line-clamp-1">{event.title}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Progress Step Bar */}
        <div className="bg-neutral-50 px-4 sm:px-6 py-2.5 border-b border-neutral-200 flex items-center justify-between text-xs font-bold text-neutral-600">
          <div className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                currentStep === 'roster'
                  ? 'bg-[#5E43F3] text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {currentStep !== 'roster' ? '✓' : '1'}
            </span>
            <span className={currentStep === 'roster' ? 'text-neutral-950 font-black' : ''}>
              Squad Roster (5/5)
            </span>
          </div>

          <ChevronRight className="w-4 h-4 text-neutral-300" />

          <div className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                currentStep === 'checkout'
                  ? 'bg-[#5E43F3] text-white'
                  : currentStep === 'confirmed'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-neutral-200 text-neutral-600'
              }`}
            >
              {currentStep === 'confirmed' ? '✓' : '2'}
            </span>
            <span className={currentStep === 'checkout' ? 'text-neutral-950 font-black' : ''}>
              Wallet & Entry
            </span>
          </div>

          <ChevronRight className="w-4 h-4 text-neutral-300" />

          <div className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                currentStep === 'confirmed'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-neutral-200 text-neutral-600'
              }`}
            >
              3
            </span>
            <span className={currentStep === 'confirmed' ? 'text-emerald-700 font-black' : ''}>
              Pass Issued
            </span>
          </div>
        </div>

        {/* Page Content Body */}
        <div className="flex-1 p-4 sm:p-6 space-y-6">
          {/* STEP 1: CREATE TEAM & COMPLETE ROSTER */}
          {currentStep === 'roster' && (
            <>
              {/* Event Mini Banner */}
              <div className="bg-neutral-50 rounded-2xl p-3.5 border border-neutral-200/80 flex items-center gap-3">
                <img
                  src={event.coverImage}
                  alt={event.title}
                  className="w-14 h-14 rounded-xl object-cover shrink-0 border border-neutral-200"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black uppercase text-[#5E43F3] bg-violet-100 px-2 py-0.5 rounded">
                    5v5 Squad Tournament
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-neutral-900 truncate mt-1">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                    <span>{event.date}</span>
                    <span>·</span>
                    <span className="font-bold text-emerald-600">
                      {isPaidEvent ? `₦${entryFee.toLocaleString()} Entry Fee` : 'Free Tournament Entry'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Team Identity Setup */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#5E43F3]" />
                    <h3 className="text-xs sm:text-sm font-black text-neutral-900">
                      Team Identity & Logo
                    </h3>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-bold">
                    Stored in Player Account
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-neutral-600">Team Name *</label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#5E43F3]"
                      placeholder="e.g. Delta Strikers"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-600">Team Tag (Max 4 chars)</label>
                    <input
                      type="text"
                      value={teamTag}
                      maxLength={4}
                      onChange={(e) => setTeamTag(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 uppercase focus:outline-none focus:border-[#5E43F3]"
                      placeholder="DST"
                      required
                    />
                  </div>
                </div>

                {/* Team Logo Picker: Preset or Custom Upload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-neutral-600">
                      Team Emblem / Crest (Choose Preset or Upload Your Own)
                    </label>
                    {isCustomLogo && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Custom Logo Active
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Hidden file input for custom logo upload */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                      id="team-logo-upload-input"
                    />

                    {/* Custom Image Upload Button */}
                    <button
                      type="button"
                      id="btn-upload-team-logo"
                      onClick={() => fileInputRef.current?.click()}
                      className={`h-16 px-3.5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        isCustomLogo
                          ? 'border-[#5E43F3] bg-violet-50/60 shadow-xs'
                          : 'border-neutral-300 hover:border-[#5E43F3] hover:bg-neutral-50'
                      }`}
                      title="Upload custom logo from device"
                    >
                      <Upload className="w-4 h-4 text-[#5E43F3]" />
                      <span className="text-[10px] font-bold text-neutral-800">Upload Image</span>
                    </button>

                    {/* Preset Logo Icons */}
                    {PRESET_LOGOS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedLogo(preset.url);
                          setIsCustomLogo(false);
                        }}
                        className={`w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer p-0.5 relative group ${
                          selectedLogo === preset.url && !isCustomLogo
                            ? 'border-[#5E43F3] scale-105 shadow-md shadow-[#5E43F3]/25'
                            : 'border-neutral-200 opacity-70 hover:opacity-100'
                        }`}
                        title={preset.name}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover rounded-xl"
                        />
                        {selectedLogo === preset.url && !isCustomLogo && (
                          <div className="absolute inset-0 bg-[#5E43F3]/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white drop-shadow" />
                          </div>
                        )}
                      </button>
                    ))}

                    {/* Custom uploaded preview if active */}
                    {isCustomLogo && (
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#5E43F3] p-0.5 relative shadow-md shadow-[#5E43F3]/25">
                        <img
                          src={selectedLogo}
                          alt="Custom Team Logo"
                          className="w-full h-full object-cover rounded-xl"
                        />
                        <div className="absolute inset-0 bg-[#5E43F3]/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white drop-shadow" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Squad Roster Tracker */}
                <div className="pt-4 border-t border-neutral-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#5E43F3]" />
                      <h3 className="text-xs sm:text-sm font-black text-neutral-900">
                        Squad Roster ({roster.length} / 5 Players Required)
                      </h3>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        isRosterComplete
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {isRosterComplete ? '5/5 Roster Complete ✓' : '1 Player Needed to Play (No Subs)'}
                    </span>
                  </div>

                  {/* Player Slot List */}
                  <div className="space-y-2">
                    {roster.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 bg-neutral-50/70"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar src={player.avatar} alt={player.name} size="md" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs sm:text-sm font-bold text-neutral-900">
                                {player.name}
                              </span>
                              {player.isCaptain && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-[#5E43F3] text-white">
                                  CAPTAIN
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-500">
                              @{player.username} · {player.role}
                            </p>
                          </div>
                        </div>

                        {!player.isCaptain && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTeammate(player.id)}
                            className="text-xs text-neutral-400 hover:text-rose-600 font-bold px-2 py-1 cursor-pointer transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Empty Slot 5 if roster not full */}
                    {!isRosterComplete && (
                      <div className="p-4 rounded-xl border-2 border-dashed border-violet-300 bg-violet-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 text-neutral-500">
                          <div className="w-9 h-9 rounded-full border border-violet-300 border-dashed flex items-center justify-center bg-violet-100/50">
                            <Plus className="w-4 h-4 text-[#5E43F3]" />
                          </div>
                          <div className="text-xs">
                            <p className="font-bold text-neutral-800">Slot 5: Roamer / Tank</p>
                            <p className="text-[11px] text-neutral-500">
                              Add 1 player to complete your starting five
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          id="btn-invite-roster-player"
                          onClick={() => setIsInvitePickerOpen(!isInvitePickerOpen)}
                          className="py-2 px-4 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-[#5E43F3]/20 cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>{isInvitePickerOpen ? 'Hide Invite List' : 'Invite Person to Squad'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Friends Quick Invite Panel */}
                  {(!isRosterComplete || isInvitePickerOpen) && (
                    <div className="mt-4 p-4 rounded-2xl bg-violet-50/80 border border-violet-200 animate-fadeIn space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-violet-950 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#5E43F3]" />
                          Select a gamer friend to complete your roster:
                        </h4>
                        {isInvitePickerOpen && (
                          <button
                            type="button"
                            onClick={() => setIsInvitePickerOpen(false)}
                            className="text-neutral-400 hover:text-neutral-700 p-0.5 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {availableFriends.map((friend) => {
                          const isAlreadyInRoster = roster.some((p) => p.id === friend.id);
                          return (
                            <div
                              key={friend.id}
                              className="flex items-center justify-between p-3 rounded-xl bg-white border border-violet-100 shadow-2xs hover:border-violet-300 transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar src={friend.avatar} alt={friend.name} size="sm" />
                                <div>
                                  <p className="text-xs font-bold text-neutral-900">{friend.name}</p>
                                  <p className="text-[10px] text-neutral-500">
                                    @{friend.username} · {friend.preferredRole}
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                id={`btn-invite-friend-${friend.id}`}
                                disabled={isAlreadyInRoster || roster.length >= 5}
                                onClick={() => handleAddTeammate(friend)}
                                className={`py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  isAlreadyInRoster
                                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                                    : 'bg-[#5E43F3] hover:bg-[#4E34E0] text-white shadow-xs'
                                }`}
                              >
                                {isAlreadyInRoster ? 'Added' : 'Join Squad'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* STEP 2: CHECKOUT & WALLET PAYMENT */}
          {currentStep === 'checkout' && (
            <div className="space-y-5">
              {/* Confirmed Team Recap Banner */}
              <div className="bg-gradient-to-r from-violet-900 to-[#5E43F3] text-white rounded-2xl p-4.5 shadow-md flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedLogo}
                    alt={teamName}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-xl object-cover border-2 border-white/20 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-black text-white">{teamName}</h3>
                      <span className="text-[10px] font-black bg-white/20 text-white px-2 py-0.5 rounded">
                        [{teamTag}]
                      </span>
                    </div>
                    <p className="text-xs text-violet-200 mt-0.5">
                      5/5 Players Locked & Ready
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-emerald-300 bg-emerald-950/60 px-2 py-1 rounded-md border border-emerald-500/30">
                    Team Stored ✓
                  </span>
                </div>
              </div>

              {/* Tournament Details Box */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-4.5 space-y-3 shadow-xs">
                <h4 className="text-xs font-black text-neutral-900 uppercase tracking-wider">
                  Tournament Entry Details
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-neutral-100">
                    <span className="text-neutral-500">Event</span>
                    <span className="font-bold text-neutral-900">{event.title}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-100">
                    <span className="text-neutral-500">Schedule</span>
                    <span className="font-bold text-neutral-900">{event.date} · {event.time}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-100">
                    <span className="text-neutral-500">Bracket Format</span>
                    <span className="font-bold text-neutral-900">5v5 Single Elimination</span>
                  </div>
                  <div className="flex justify-between py-1 pt-2 font-bold text-sm">
                    <span className="text-neutral-800">Squad Entry Fee</span>
                    <span className={entryFee === 0 ? 'text-emerald-600 font-black' : 'text-neutral-950 font-black'}>
                      {entryFee === 0 ? 'FREE (₦0)' : `₦${entryFee.toLocaleString()} NGN`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector (if paid event) */}
              {isPaidEvent ? (
                <div className="bg-white rounded-2xl border border-neutral-200 p-4.5 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-neutral-900 uppercase tracking-wider">
                      Select Payment Method
                    </h4>
                    <span className="text-[11px] text-neutral-500">Secure Instant Checkout</span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Option 1: Lao Line Gamer Wallet */}
                    <button
                      type="button"
                      id="btn-pay-wallet-option"
                      onClick={() => setPaymentMethod('wallet')}
                      className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        paymentMethod === 'wallet'
                          ? 'border-[#5E43F3] bg-violet-50/60 ring-2 ring-[#5E43F3]/20'
                          : 'border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-100 text-[#5E43F3] flex items-center justify-center">
                          <Wallet className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs sm:text-sm font-black text-neutral-900">
                              Lao Line Gamer Wallet
                            </p>
                            <span className="text-[9px] font-black uppercase bg-[#5E43F3] text-white px-1.5 py-0.2 rounded">
                              RECOMMENDED
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            Balance: <strong className="text-neutral-900">₦{wallet.balance.toLocaleString()} NGN</strong>
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {hasEnoughWalletBalance ? (
                          <span className="text-xs font-bold text-emerald-600">Sufficient Balance ✓</span>
                        ) : (
                          <span className="text-xs font-bold text-rose-600">Low Balance</span>
                        )}
                      </div>
                    </button>

                    {/* If low balance on wallet */}
                    {paymentMethod === 'wallet' && !hasEnoughWalletBalance && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs text-amber-900">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>You need ₦{(entryFee - wallet.balance).toLocaleString()} more.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsWalletModalOpen(true)}
                          className="px-3 py-1 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 cursor-pointer shrink-0"
                        >
                          Top Up Wallet
                        </button>
                      </div>
                    )}

                    {/* Option 2: Paystack Instant */}
                    <button
                      type="button"
                      id="btn-pay-paystack-option"
                      onClick={() => setPaymentMethod('paystack')}
                      className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        paymentMethod === 'paystack'
                          ? 'border-[#5E43F3] bg-violet-50/60 ring-2 ring-[#5E43F3]/20'
                          : 'border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-black text-neutral-900">
                            Paystack Payment Gateway
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            Debit Card, Apple Pay, Bank Transfer, USSD
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-neutral-600">Instant</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Free Event Notification */
                <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4 flex items-center gap-3 text-emerald-900">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold">Free Community Tournament</h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      No entry fee required. Your team will be registered with official Seed # immediately.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: REGISTRATION CONFIRMED & PASS */}
          {currentStep === 'confirmed' && (
            <div className="text-center py-6 space-y-6 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-black uppercase tracking-widest text-[#5E43F3] bg-violet-100 px-3 py-1 rounded-full">
                  Official Team Registration #HOK-992
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-neutral-950 mt-2">
                  You're in the Tournament!
                </h3>
                <p className="text-xs text-neutral-500 max-w-md mx-auto">
                  Team <strong className="text-neutral-900">{teamName} [{teamTag}]</strong> is registered for{' '}
                  <strong className="text-neutral-900">{event.title}</strong>.
                </p>
              </div>

              {/* Digital Pass Preview Card */}
              <div className="bg-gradient-to-br from-neutral-950 to-neutral-900 text-white rounded-3xl p-5 sm:p-6 text-left border border-neutral-800 shadow-xl max-w-md mx-auto relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <img
                      src={selectedLogo}
                      alt={teamName}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <div>
                      <h4 className="text-xs font-black text-white">{teamName}</h4>
                      <p className="text-[10px] text-violet-300">Seed #12 · Verified Squad</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                    Confirmed
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase">Check-in Time</span>
                    <p className="font-bold text-white mt-0.5">30 mins before start</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase">Roster</span>
                    <p className="font-bold text-white mt-0.5">5/5 Players</p>
                  </div>
                </div>

                <div className="bg-black/50 rounded-xl p-2.5 border border-white/10 flex items-center justify-between text-xs">
                  <span className="text-neutral-400 font-mono text-[11px]">Pass ID: HOK-DST-2026</span>
                  <span className="text-emerald-400 font-bold">Ready on Mobile</span>
                </div>
              </div>

              {/* Final Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:w-auto py-3 px-8 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white text-xs sm:text-sm font-black transition-all shadow-md shadow-[#5E43F3]/25 cursor-pointer"
                >
                  Done & View Event
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer for Step 1 & Step 2 */}
        {currentStep !== 'confirmed' && (
          <footer className="sticky bottom-0 z-20 p-4 sm:px-6 border-t border-neutral-200 bg-white/95 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
            {currentStep === 'roster' && (
              <>
                <div className="text-xs text-neutral-600">
                  <span>Squad: </span>
                  <strong className={isRosterComplete ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                    {roster.length}/5 Players {isRosterComplete ? '(Ready)' : '(1 person needed)'}
                  </strong>
                </div>

                <button
                  type="button"
                  id="btn-save-team-proceed"
                  disabled={!isRosterComplete}
                  onClick={handleSaveTeamAndProceed}
                  className={`py-3 px-6 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
                    isRosterComplete
                      ? 'bg-[#5E43F3] hover:bg-[#4E34E0] text-white shadow-lg shadow-[#5E43F3]/25 active:scale-95'
                      : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  }`}
                >
                  <span>Save Team & Proceed</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {currentStep === 'checkout' && (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentStep('roster')}
                  className="px-4 py-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Back to Roster
                </button>

                <button
                  type="button"
                  id="btn-confirm-tournament-payment"
                  disabled={isProcessing || (isPaidEvent && paymentMethod === 'wallet' && !hasEnoughWalletBalance)}
                  onClick={handleCompleteRegistration}
                  className={`py-3 px-6 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
                    !isProcessing && (!isPaidEvent || paymentMethod !== 'wallet' || hasEnoughWalletBalance)
                      ? 'bg-[#5E43F3] hover:bg-[#4E34E0] text-white shadow-lg shadow-[#5E43F3]/25 active:scale-95'
                      : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  }`}
                >
                  {isProcessing ? (
                    <span>Confirming Registration...</span>
                  ) : isPaidEvent ? (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>
                        Pay ₦{entryFee.toLocaleString()} ({paymentMethod === 'wallet' ? 'Wallet' : 'Paystack'})
                      </span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Confirm Free Team Entry</span>
                    </>
                  )}
                </button>
              </>
            )}
          </footer>
        )}
      </div>
    </div>
  );
};
