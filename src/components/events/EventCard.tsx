import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Ticket,
  Users,
  ChevronRight,
  Globe,
  Sparkles,
  Flame,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { OrgEvent } from '../../types';
import { useLalao } from '../../context/LalaoContext';
import { isEventTicketingEligible } from '../../utils/pageCapabilities';

interface EventCardProps {
  event: OrgEvent;
  featured?: boolean;
  className?: string;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  featured = false,
  className = '',
}) => {
  const {
    setSelectedEventForDetail,
    setIsEventDetailOpen,
    setRegisteringEvent,
    setIsTournamentRegisterOpen,
    setPurchasingEvent,
    setIsTicketPurchaseOpen,
  } = useLalao();

  const isTicketEligible = isEventTicketingEligible(event);

  const handleOpenDetail = () => {
    setSelectedEventForDetail(event);
    setIsEventDetailOpen(true);
  };

  const handleRegister = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRegisteringEvent(event);
    setIsTournamentRegisterOpen(true);
  };

  const handleGetTicket = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPurchasingEvent(event);
    setIsTicketPurchaseOpen(true);
  };

  // Status Chip styling
  const getStatusBadge = () => {
    switch (event.registrationStatus) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/90 text-white backdrop-blur-md shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Registration Open
          </span>
        );
      case 'opening_soon':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/90 text-white backdrop-blur-md shadow-xs">
            <Clock className="w-3 h-3 text-amber-100" />
            Opens Soon
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-neutral-800/80 text-neutral-300 backdrop-blur-md border border-neutral-700">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-neutral-800/80 text-neutral-300 backdrop-blur-md border border-neutral-700">
            Closed
          </span>
        );
    }
  };

  // Type badge styling
  const getTypeBadge = () => {
    switch (event.type) {
      case 'tournament':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-violet-600/90 text-white backdrop-blur-md border border-violet-400/30 shadow-xs">
            <Trophy className="w-3 h-3 text-amber-300" />
            Tournament
          </span>
        );
      case 'community':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-600/90 text-white backdrop-blur-md border border-blue-400/30 shadow-xs">
            <Users className="w-3 h-3 text-blue-200" />
            Community
          </span>
        );
      case 'live':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-rose-600/90 text-white backdrop-blur-md border border-rose-400/30 shadow-xs">
            <Flame className="w-3 h-3 text-amber-200" />
            Live Show
          </span>
        );
    }
  };

  const registeredCount = event.registeredTeamsCount ?? 0;
  const maxTeams = event.teamsCount ?? event.maxTeams ?? 32;
  const teamFillPercent = Math.min(100, Math.round((registeredCount / maxTeams) * 100));

  // Bento FEATURED Layout (Hero span in Bento grid)
  if (featured) {
    return (
      <article
        id={`card-event-${event.id}`}
        onClick={handleOpenDetail}
        className={`col-span-1 md:col-span-2 lg:col-span-2 bg-white rounded-3xl border border-neutral-200/90 shadow-xs hover:shadow-xl hover:border-violet-300 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col md:flex-row group relative ${className}`}
      >
        {/* Visual Hero Bento Cell */}
        <div className="md:w-5/12 relative aspect-16/9 md:aspect-auto bg-neutral-950 overflow-hidden flex flex-col justify-between p-4.5 shrink-0">
          <img
            src={event.coverImage}
            alt={event.title}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-neutral-950 via-neutral-950/60 to-transparent" />

          {/* Top Badges */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {getTypeBadge()}
              {event.isOnline ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-neutral-900/80 backdrop-blur-md text-white border border-white/20">
                  <Globe className="w-2.5 h-2.5 text-blue-400" />
                  Online
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-neutral-900/80 backdrop-blur-md text-white border border-white/20">
                  <MapPin className="w-2.5 h-2.5 text-rose-400" />
                  LAN Venue
                </span>
              )}
            </div>
            {getStatusBadge()}
          </div>

          {/* Bottom Featured Highlight Tile */}
          <div className="relative z-10 text-white mt-auto pt-8">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Featured Tournament
            </span>
            <p className="text-xs text-neutral-300 font-medium line-clamp-2 mt-1">
              {event.description}
            </p>
          </div>
        </div>

        {/* Info & Bento Modules Column */}
        <div className="md:w-7/12 p-4 sm:p-5 flex flex-col justify-between bg-white space-y-4 flex-1">
          <div>
            {/* Title & Organization Header */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <img
                  src={event.organizationAvatar}
                  alt={event.organizationName}
                  referrerPolicy="no-referrer"
                  className="w-5 h-5 rounded-full object-cover border border-neutral-200"
                />
                <span className="text-xs font-bold text-neutral-600">
                  {event.organizationName}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-neutral-400">
                Official Event
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black tracking-tight text-neutral-950 group-hover:text-[#5E43F3] transition-colors leading-tight">
              {event.title}
            </h3>

            {/* Bento Micro-Tiles Grid */}
            <div className="grid grid-cols-2 gap-2.5 mt-3.5">
              {/* Prize Pool Bento Tile */}
              {event.prizePool ? (
                <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-2.5 flex flex-col justify-between">
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-800">
                    <Trophy className="w-3 h-3 text-amber-600" />
                    <span>Cash Prize</span>
                  </div>
                  <p className="text-sm sm:text-base font-black text-amber-950 mt-1">
                    ₦{event.prizePool.toLocaleString()}
                  </p>
                </div>
              ) : isTicketEligible ? (
                <div className="bg-violet-50/70 border border-violet-200/70 rounded-2xl p-2.5 flex flex-col justify-between">
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-violet-800">
                    <Ticket className="w-3 h-3 text-[#5E43F3]" />
                    <span>Ticket Pass</span>
                  </div>
                  <p className="text-sm sm:text-base font-black text-violet-950 mt-1">
                    ₦{event.ticketPrice?.toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="bg-neutral-50 border border-neutral-200/70 rounded-2xl p-2.5 flex flex-col justify-between">
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-neutral-600">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Entry</span>
                  </div>
                  <p className="text-xs sm:text-sm font-black text-neutral-900 mt-1">
                    Free Entry
                  </p>
                </div>
              )}

              {/* Roster / Team Capacity Bento Tile */}
              {event.isTournament && event.teamsCount ? (
                <div className="bg-neutral-50 border border-neutral-200/70 rounded-2xl p-2.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-neutral-600">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-neutral-500" />
                      Squads
                    </span>
                    <span className="font-extrabold text-neutral-900">
                      {registeredCount}/{maxTeams}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-[#5E43F3] h-full rounded-full transition-all duration-500"
                      style={{ width: `${teamFillPercent}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-neutral-50 border border-neutral-200/70 rounded-2xl p-2.5 flex flex-col justify-between">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-600">
                    <MapPin className="w-3 h-3 text-neutral-500" />
                    <span>Location</span>
                  </div>
                  <p className="text-[11px] font-bold text-neutral-900 truncate mt-1">
                    {event.location}
                  </p>
                </div>
              )}

              {/* Schedule Bento Tile */}
              <div className="col-span-2 bg-neutral-50/80 border border-neutral-200/70 rounded-2xl px-3 py-2 flex items-center justify-between gap-2 text-xs text-neutral-700">
                <div className="flex items-center gap-2 truncate">
                  <Calendar className="w-3.5 h-3.5 text-[#5E43F3] shrink-0" />
                  <span className="font-bold text-neutral-950">{event.date}</span>
                  <span className="text-neutral-400">·</span>
                  <span className="text-neutral-600">{event.time}</span>
                </div>
                <span className="text-[11px] font-semibold text-neutral-500 shrink-0 truncate max-w-[130px]">
                  {event.location}
                </span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleOpenDetail}
              className="text-xs font-bold text-neutral-600 hover:text-neutral-950 py-2 px-3 rounded-xl hover:bg-neutral-100 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-2">
              {event.isTournament && event.registrationStatus === 'open' && (
                <button
                  type="button"
                  id={`btn-event-register-${event.id}`}
                  onClick={handleRegister}
                  className="py-2.5 px-5 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white text-xs font-black transition-all shadow-md shadow-[#5E43F3]/25 active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Register Squad</span>
                </button>
              )}

              {isTicketEligible && event.registrationStatus !== 'completed' && (
                <button
                  type="button"
                  id={`btn-event-get-ticket-${event.id}`}
                  onClick={handleGetTicket}
                  className="py-2.5 px-5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Ticket className="w-3.5 h-3.5 text-violet-300" />
                  <span>Get Ticket Pass</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Bento STANDARD Card Layout (1 column tile)
  return (
    <article
      id={`card-event-${event.id}`}
      onClick={handleOpenDetail}
      className={`col-span-1 bg-white rounded-3xl border border-neutral-200/90 shadow-xs hover:shadow-xl hover:border-violet-300 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between group relative ${className}`}
    >
      <div>
        {/* Cover Visual Header */}
        <div className="relative aspect-16/10 bg-neutral-950 overflow-hidden">
          <img
            src={event.coverImage}
            alt={event.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/30 to-transparent" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1.5 z-10">
            <div className="flex items-center gap-1.5">
              {getTypeBadge()}
            </div>
            {getStatusBadge()}
          </div>

          {/* Floating Pill on image bottom */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white z-10">
            <span className="text-[10px] font-semibold text-neutral-300 flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
              {event.isOnline ? (
                <>
                  <Globe className="w-2.5 h-2.5 text-blue-400" />
                  Online
                </>
              ) : (
                <>
                  <MapPin className="w-2.5 h-2.5 text-rose-400" />
                  LAN Arena
                </>
              )}
            </span>

            {event.prizePool ? (
              <span className="text-[11px] font-black text-amber-300 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-amber-400/30">
                ₦{event.prizePool.toLocaleString()}
              </span>
            ) : isTicketEligible ? (
              <span className="text-[11px] font-black text-violet-300 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-violet-400/30">
                ₦{event.ticketPrice?.toLocaleString()}
              </span>
            ) : null}
          </div>
        </div>

        {/* Bento Card Body */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="text-sm sm:text-base font-black tracking-tight text-neutral-950 group-hover:text-[#5E43F3] transition-colors line-clamp-2 leading-snug">
              {event.title}
            </h3>
            <p className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
              <span>By {event.organizationName}</span>
            </p>
          </div>

          {/* Date & Location Pill */}
          <div className="bg-neutral-50 border border-neutral-200/70 rounded-xl p-2.5 space-y-1.5 text-xs text-neutral-600">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#5E43F3] shrink-0" />
              <span className="font-bold text-neutral-900">{event.date}</span>
              <span className="text-neutral-400">·</span>
              <span>{event.time}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
              <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          </div>

          {/* Bento Sub-Metrics Box */}
          {event.isTournament && event.teamsCount && (
            <div className="bg-violet-50/50 border border-violet-100 rounded-xl p-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-violet-900 font-bold">
                <Users className="w-3.5 h-3.5 text-[#5E43F3]" />
                <span>Squad Slots</span>
              </div>
              <span className="text-[11px] font-black text-neutral-900">
                {registeredCount}/{maxTeams} Teams
              </span>
            </div>
          )}

          {isTicketEligible && event.availableTickets !== undefined && (
            <div className="bg-violet-50/50 border border-violet-100 rounded-xl p-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-violet-900 font-bold">
                <Ticket className="w-3.5 h-3.5 text-[#5E43F3]" />
                <span>Availability</span>
              </div>
              <span className="text-[11px] font-black text-violet-950">
                {event.availableTickets} passes left
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 pt-2 border-t border-neutral-100 flex items-center justify-between gap-2 mt-auto">
        <button
          type="button"
          onClick={handleOpenDetail}
          className="text-xs font-bold text-neutral-600 hover:text-neutral-950 py-1.5 px-2 rounded-lg hover:bg-neutral-100 transition-colors flex items-center gap-0.5 cursor-pointer"
        >
          <span>Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-1.5">
          {event.isTournament && event.registrationStatus === 'open' && (
            <button
              type="button"
              id={`btn-event-register-${event.id}`}
              onClick={handleRegister}
              className="py-2 px-3.5 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white text-xs font-black transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Users className="w-3 h-3" />
              <span>Register</span>
            </button>
          )}

          {isTicketEligible && event.registrationStatus !== 'completed' && (
            <button
              type="button"
              id={`btn-event-get-ticket-${event.id}`}
              onClick={handleGetTicket}
              className="py-2 px-3.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-black transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Ticket className="w-3 h-3 text-violet-300" />
              <span>Get Ticket</span>
            </button>
          )}

          {event.registrationStatus === 'opening_soon' && !isTicketEligible && (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
              Opens Soon
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

