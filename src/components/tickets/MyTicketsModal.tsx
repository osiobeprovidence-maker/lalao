import React, { useState } from 'react';
import {
  X,
  Ticket,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  History,
  QrCode,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { EventTicket } from '../../types';

export const MyTicketsModal: React.FC = () => {
  const {
    isMyTicketsOpen,
    setIsMyTicketsOpen,
    activeTickets,
    ticketHistory,
    setSelectedTicketForPass,
    openHonorOfKingsPage,
  } = useLalao();

  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  if (!isMyTicketsOpen) return null;

  const handleOpenTicket = (ticket: EventTicket) => {
    setSelectedTicketForPass(ticket);
  };

  return (
    <div
      id="screen-my-tickets"
      className="absolute inset-0 z-40 bg-white flex flex-col min-h-full overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-200"
    >
      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1 pb-24">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 lg:px-6 py-3.5 border-b border-neutral-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="btn-back-my-tickets"
              onClick={() => setIsMyTicketsOpen(false)}
              className="p-1.5 -ml-1 rounded-full text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-violet-100 text-[#5E43F3] flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-neutral-950 leading-tight">My Tickets</h1>
              <p className="text-[11px] text-neutral-500">
                {activeTickets.length} active pass{activeTickets.length === 1 ? '' : 'es'} available
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-my-tickets"
            onClick={() => setIsMyTicketsOpen(false)}
            className="p-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
            aria-label="Close tickets"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Segmented Tabs: Active Tickets | Ticket History */}
        <div className="px-5 pt-3 pb-2 bg-white border-b border-neutral-100 shrink-0">
          <div className="grid grid-cols-2 gap-2 bg-neutral-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              id="tab-active-tickets"
              onClick={() => setActiveTab('active')}
              className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'active'
                  ? 'bg-white text-neutral-950 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <span>Active Tickets</span>
              {activeTickets.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#5E43F3] text-white text-[10px] font-black">
                  {activeTickets.length}
                </span>
              )}
            </button>

            <button
              type="button"
              id="tab-ticket-history"
              onClick={() => setActiveTab('history')}
              className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-white text-neutral-950 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Ticket History</span>
            </button>
          </div>
        </div>

        {/* Ticket List Body */}
        <div className="flex-1 p-5 space-y-4">
          {activeTab === 'active' ? (
            activeTickets.length === 0 ? (
              <div className="text-center py-10 px-4">
                <div className="w-14 h-14 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-3">
                  <Ticket className="w-7 h-7 stroke-[1.5]" />
                </div>
                <h3 className="text-sm font-bold text-neutral-800">No active tickets found</h3>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto mt-1">
                  You do not have any upcoming event passes. Explore events by Honor of Kings to
                  attend live gaming nights and tournaments.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsMyTicketsOpen(false);
                    openHonorOfKingsPage();
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#5E43F3] text-white text-xs font-bold"
                >
                  Explore Events
                </button>
              </div>
            ) : (
              activeTickets.map((t) => (
                <div
                  key={t.id}
                  id={`ticket-card-${t.id}`}
                  onClick={() => handleOpenTicket(t)}
                  className="group relative bg-gradient-to-br from-violet-500/5 to-indigo-500/5 rounded-2xl border border-violet-200/80 p-4 hover:border-[#5E43F3] hover:shadow-md transition-all cursor-pointer overflow-hidden"
                >
                  {/* Decorative left ticket notch */}
                  <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-neutral-200" />
                  {/* Decorative right ticket notch */}
                  <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-neutral-200" />

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-violet-100 text-[#5E43F3]">
                        {t.ticketType}
                      </span>
                      <h3 className="text-sm sm:text-base font-black text-neutral-950 mt-1 group-hover:text-[#5E43F3] transition-colors">
                        {t.eventTitle}
                      </h3>
                      <p className="text-[11px] text-neutral-500 mt-0.5">By {t.organizationName}</p>
                    </div>

                    <div className="p-2 rounded-xl bg-white border border-violet-100 text-[#5E43F3] shadow-xs group-hover:bg-[#5E43F3] group-hover:text-white transition-colors">
                      <QrCode className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="mt-3 pt-3 border-t border-violet-100/80 grid grid-cols-2 gap-2 text-xs text-neutral-700">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#5E43F3]" />
                      <span className="font-semibold">{t.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#5E43F3]" />
                      <span>{t.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2 text-neutral-600">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate">{t.venue}</span>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="mt-3 pt-2.5 border-t border-dashed border-violet-200 flex items-center justify-between text-xs">
                    <div className="text-[11px] font-mono text-neutral-500">{t.id}</div>
                    <button
                      type="button"
                      className="text-xs font-black text-[#5E43F3] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>View Ticket</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )
          ) : ticketHistory.length === 0 ? (
            <div className="text-center py-10 px-4">
              <p className="text-xs text-neutral-500">No past ticket history.</p>
            </div>
          ) : (
            ticketHistory.map((t) => (
              <div
                key={t.id}
                id={`ticket-history-${t.id}`}
                onClick={() => handleOpenTicket(t)}
                className="bg-neutral-50 rounded-2xl border border-neutral-200 p-4 hover:bg-neutral-100/70 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-200 text-neutral-700">
                        {t.ticketType}
                      </span>
                      <span className="text-[11px] font-bold text-neutral-500 capitalize">
                        Status: {t.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-neutral-800 mt-1">{t.eventTitle}</h3>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      {t.date} · {t.venue}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-neutral-700">
                      ₦{t.price.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-neutral-200 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-neutral-400">{t.id}</span>
                  <span className="font-bold text-neutral-600 flex items-center gap-1">
                    <span>View Details</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
