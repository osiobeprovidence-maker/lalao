import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Ticket,
  Users,
  ShieldAlert,
  Share2,
  CheckCircle2,
  Globe,
  Sparkles,
  Award,
  Swords,
  ChevronRight,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { isEventTicketingEligible } from '../../utils/pageCapabilities';

export const EventDetailModal: React.FC = () => {
  const {
    selectedEventForDetail,
    isEventDetailOpen,
    setIsEventDetailOpen,
    setRegisteringEvent,
    setIsTournamentRegisterOpen,
    setPurchasingEvent,
    setIsTicketPurchaseOpen,
    triggerShareToast,
    openHonorOfKingsPage,
  } = useLalao();

  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'schedule' | 'teams'>('overview');

  if (!isEventDetailOpen || !selectedEventForDetail) return null;

  const event = selectedEventForDetail;
  const isTicketEligible = isEventTicketingEligible(event);

  const handleRegisterClick = () => {
    setRegisteringEvent(event);
    setIsTournamentRegisterOpen(true);
  };

  const handleTicketClick = () => {
    setPurchasingEvent(event);
    setIsTicketPurchaseOpen(true);
  };

  const handleShare = () => {
    triggerShareToast(`Event link for "${event.title}" copied to clipboard`);
  };

  return (
    <div
      id="screen-event-detail"
      className="absolute inset-0 z-40 bg-white flex flex-col min-h-full overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-200"
    >
      <div className="w-full max-w-3xl mx-auto flex flex-col flex-1 pb-24">
        {/* Banner with Floating Actions */}
        <div className="relative aspect-16/9 sm:aspect-21/9 bg-neutral-950 shrink-0 overflow-hidden sm:rounded-b-3xl">
          <img
            src={event.coverImage}
            alt={event.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />

          {/* Floating Navigation Controls */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <button
              type="button"
              id="btn-close-event-detail"
              onClick={() => setIsEventDetailOpen(false)}
              className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 active:scale-95 transition-all cursor-pointer shadow-md flex items-center gap-1.5 px-3"
              aria-label="Back to events"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
              <span className="text-xs font-bold">Back</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 active:scale-95 transition-all cursor-pointer shadow-md"
                title="Share Event"
              >
                <Share2 className="w-4 h-4 stroke-[2]" />
              </button>
            </div>
          </div>

          {/* Event Title and Org on Banner */}
          <div className="absolute bottom-4 left-4 right-4 text-white z-10">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#5E43F3] text-white">
                {event.type.toUpperCase()}
              </span>
              {event.isOnline ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-md text-white">
                  <Globe className="w-3 h-3 text-blue-300" />
                  Online
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-md text-white">
                  <MapPin className="w-3 h-3 text-rose-300" />
                  Live Arena
                </span>
              )}
              {event.registrationStatus === 'open' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/90 text-white">
                  <CheckCircle2 className="w-3 h-3" />
                  Registration Open
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-sm">
              {event.title}
            </h1>

            {/* Host Organization link */}
            <button
              type="button"
              onClick={() => {
                setIsEventDetailOpen(false);
                openHonorOfKingsPage();
              }}
              className="mt-2 flex items-center gap-2 text-xs text-neutral-200 hover:text-white group cursor-pointer"
            >
              <Avatar
                src={event.organizationAvatar}
                alt={event.organizationName}
                size="xs"
                className="ring-1 ring-white/40"
              />
              <span className="font-semibold group-hover:underline">
                Hosted by {event.organizationName}
              </span>
              <Badge type={event.organizationBadge} size="sm" />
            </button>
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="bg-neutral-50 px-4 sm:px-6 py-3 border-b border-neutral-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#5E43F3] shrink-0" />
            <div>
              <p className="text-[10px] text-neutral-500 font-medium uppercase">Date</p>
              <p className="font-bold text-neutral-900">{event.date}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#5E43F3] shrink-0" />
            <div>
              <p className="text-[10px] text-neutral-500 font-medium uppercase">Time</p>
              <p className="font-bold text-neutral-900">{event.time}</p>
            </div>
          </div>

          {event.prizePool ? (
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <p className="text-[10px] text-neutral-500 font-medium uppercase">Prize Pool</p>
                <p className="font-black text-neutral-950">₦{event.prizePool.toLocaleString()}</p>
              </div>
            </div>
          ) : isTicketEligible && event.ticketPrice ? (
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-violet-600 shrink-0" />
              <div>
                <p className="text-[10px] text-neutral-500 font-medium uppercase">Ticket</p>
                <p className="font-black text-neutral-950">₦{event.ticketPrice.toLocaleString()}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="text-[10px] text-neutral-500 font-medium uppercase">Admission</p>
                <p className="font-bold text-emerald-700">Free Entry</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-neutral-500 shrink-0" />
            <div>
              <p className="text-[10px] text-neutral-500 font-medium uppercase">Capacity</p>
              <p className="font-bold text-neutral-900">
                {event.isTournament
                  ? `${event.registeredTeamsCount ?? 0}/${event.teamsCount ?? 32} Teams`
                  : `${event.availableTickets ?? 'Open'} Spots`}
              </p>
            </div>
          </div>
        </div>

        {/* Section Tabs: Overview | Rules | Schedule | Teams */}
        <div className="flex items-center border-b border-neutral-200 px-4 sm:px-6 gap-6 bg-white overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-[#5E43F3] text-[#5E43F3]'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Overview
          </button>
          {event.rules && (
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`py-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'rules'
                  ? 'border-[#5E43F3] text-[#5E43F3]'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Rules & Format
            </button>
          )}
          {event.schedule && (
            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`py-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'schedule'
                  ? 'border-[#5E43F3] text-[#5E43F3]'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Schedule
            </button>
          )}
          {event.registeredTeams && (
            <button
              type="button"
              onClick={() => setActiveTab('teams')}
              className={`py-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'teams'
                  ? 'border-[#5E43F3] text-[#5E43F3]'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Registered Teams ({event.registeredTeams.length})
            </button>
          )}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Description */}
              <div>
                <h3 className="text-sm font-bold text-neutral-900 mb-2">About This Event</h3>
                <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
                  {event.description}
                </p>
              </div>

              {/* Venue / Location Details */}
              <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white border border-neutral-200 text-[#5E43F3]">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900">Location & Attendance</h4>
                    <p className="text-xs text-neutral-600 mt-0.5">{event.location}</p>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      {event.isOnline
                        ? 'Discord voice & match lobbies will be coordinated with all verified team captains.'
                        : 'Please show your digital event QR code at the Lao Line Arena check-in desk.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Prize Pool Breakdown (if tournament) */}
              {event.prizes && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-neutral-900">Prize Pool Distribution</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {event.prizes.map((prize, idx) => (
                      <div
                        key={idx}
                        className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-3 text-center flex flex-col items-center justify-center"
                      >
                        <Award className="w-5 h-5 text-amber-600 mb-1" />
                        <span className="text-[11px] font-semibold text-amber-800/90">
                          {prize.place}
                        </span>
                        <span className="text-sm font-black text-amber-950 mt-0.5">
                          {prize.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lao Line Platform Advantage Banner */}
              <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl p-4 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#5E43F3] text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#5E43F3]">
                    Full Event Lifecycle on Lao Line
                  </h4>
                  <p className="text-xs text-neutral-600 mt-0.5">
                    Honor of Kings uses Lao Line to manage team formations, player verification,
                    instant ticketing, and digital entry passes.
                  </p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'rules' && event.rules && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#5E43F3]" />
                <h3 className="text-sm font-bold text-neutral-900">Tournament Rules & Guidelines</h3>
              </div>
              <ul className="space-y-2.5">
                {event.rules.map((rule, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-xs text-neutral-700 bg-neutral-50 p-3 rounded-xl border border-neutral-100"
                  >
                    <span className="w-5 h-5 rounded-full bg-violet-100 text-[#5E43F3] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'schedule' && event.schedule && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#5E43F3]" />
                <h3 className="text-sm font-bold text-neutral-900">Match Timeline</h3>
              </div>
              <div className="space-y-2 relative before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-neutral-200">
                {event.schedule.map((item, idx) => (
                  <div key={idx} className="relative flex items-center gap-4 pl-8 py-1.5">
                    <div className="absolute left-1.5 w-3 h-3 rounded-full bg-[#5E43F3] ring-4 ring-white" />
                    <span className="text-xs font-black text-neutral-900 w-18 shrink-0">
                      {item.time}
                    </span>
                    <span className="text-xs text-neutral-700 font-medium">{item.activity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'teams' && event.registeredTeams && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-neutral-900">
                  Confirmed Squads ({event.registeredTeams.length})
                </h3>
                <span className="text-xs text-neutral-500 font-medium">
                  {event.maxTeams ? `${event.maxTeams - event.registeredTeams.length} slots left` : ''}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {event.registeredTeams.map((team) => (
                  <div
                    key={team.id}
                    className="p-3 rounded-xl border border-neutral-200 bg-white flex items-center gap-3"
                  >
                    <img
                      src={team.logo}
                      alt={team.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-xl object-cover border border-neutral-100 bg-neutral-100"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-neutral-900 truncate">
                          {team.name}
                        </h4>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-neutral-100 text-neutral-600">
                          [{team.tag}]
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                        Captain: {team.captain} · {team.membersCount} Players
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        <div className="sticky bottom-0 z-20 p-4 sm:px-6 bg-white/95 backdrop-blur-md border-t border-neutral-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs">
            <span className="text-neutral-500">Status: </span>
            <span className="font-bold text-neutral-900 capitalize">
              {event.registrationStatus.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {event.isTournament && event.registrationStatus === 'open' && (
              <button
                type="button"
                id="btn-detail-register-team"
                onClick={handleRegisterClick}
                className="py-2.5 px-5 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white text-xs font-black transition-all shadow-md shadow-[#5E43F3]/25 active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Swords className="w-4 h-4" />
                <span>Register Your Team</span>
              </button>
            )}

            {isTicketEligible && event.registrationStatus !== 'completed' && (
              <button
                type="button"
                id="btn-detail-get-ticket"
                onClick={handleTicketClick}
                className="py-2.5 px-5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Ticket className="w-4 h-4 text-violet-300" />
                <span>Get Ticket (₦{event.ticketPrice?.toLocaleString()})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
