import React, { useState } from 'react';
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  QrCode,
  Search,
  Ticket,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { OrgEvent } from '../../types';
import { useLalao } from '../../context/LalaoContext';

interface EventAttendeesModalProps {
  event: OrgEvent;
  isOpen: boolean;
  onClose: () => void;
}

interface Attendee {
  id: string;
  name: string;
  username: string;
  avatar: string;
  ticketCode: string;
  type: string;
  checkedIn: boolean;
  timeRegistered: string;
}

export const EventAttendeesModal: React.FC<EventAttendeesModalProps> = ({
  event,
  isOpen,
  onClose,
}) => {
  const { triggerShareToast } = useLalao();
  const [searchTerm, setSearchTerm] = useState('');

  // Sample attendee roster
  const [attendees, setAttendees] = useState<Attendee[]>([
    {
      id: 'att_1',
      name: 'Providence',
      username: 'providence',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      ticketCode: 'LL-DCL-8891',
      type: 'VIP Pass',
      checkedIn: true,
      timeRegistered: '3 days ago',
    },
    {
      id: 'att_2',
      name: 'Chidi Okafor',
      username: 'chidi_design',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      ticketCode: 'LL-DCL-9402',
      type: 'General Admission',
      checkedIn: false,
      timeRegistered: 'Yesterday',
    },
    {
      id: 'att_3',
      name: 'Amina Bello',
      username: 'amina_k',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
      ticketCode: 'LL-DCL-7105',
      type: 'General Admission',
      checkedIn: false,
      timeRegistered: '2 days ago',
    },
    {
      id: 'att_4',
      name: 'Tunde Bakare',
      username: 'tunde_vibe',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
      ticketCode: 'LL-DCL-6320',
      type: 'Creator Pass',
      checkedIn: true,
      timeRegistered: '5 days ago',
    },
  ]);

  if (!isOpen) return null;

  const toggleCheckIn = (id: string) => {
    setAttendees((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const next = !a.checkedIn;
          triggerShareToast(
            next ? `Checked in ${a.name}!` : `Undid check-in for ${a.name}`
          );
          return { ...a, checkedIn: next };
        }
        return a;
      })
    );
  };

  const filtered = attendees.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.ticketCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const checkedInCount = attendees.filter((a) => a.checkedIn).length;

  return (
    <div className="absolute inset-0 z-50 bg-white overflow-y-auto flex flex-col animate-in fade-in slide-in-from-right-4 duration-250">
      {/* Top Sticky Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 sm:px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-neutral-100 text-neutral-800 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="text-base font-black text-neutral-950">
              Attendees & Check-in
            </h3>
            <p className="text-xs text-neutral-500 font-medium truncate max-w-[200px] sm:max-w-md">
              {event.title}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => triggerShareToast('Camera scanner ready for QR verification')}
          className="px-3 py-1.5 rounded-xl bg-neutral-900 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-black cursor-pointer shadow-sm"
        >
          <QrCode className="w-4 h-4" />
          <span>Scan QR</span>
        </button>
      </div>

      {/* Page Content Container */}
      <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 pb-24 flex-1 space-y-5">
        {/* Stats Strip */}
        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-6 text-xs font-bold">
            <div className="flex items-center gap-2 text-neutral-800">
              <div className="w-8 h-8 rounded-xl bg-violet-100 text-[#5E43F3] flex items-center justify-center">
                <Ticket className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-black text-neutral-950">{attendees.length}</p>
                <p className="text-[10px] text-neutral-400 font-medium uppercase">Registered</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-emerald-600">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-black text-emerald-700">{checkedInCount}</p>
                <p className="text-[10px] text-emerald-600/70 font-medium uppercase">Checked In</p>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-neutral-400">Attendance Rate</span>
            <p className="text-sm font-black text-neutral-900">
              {attendees.length > 0 ? Math.round((checkedInCount / attendees.length) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search attendee name, @handle, or ticket code..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-neutral-200 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]"
          />
        </div>

        {/* Attendee Roster List */}
        <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-3xl overflow-hidden bg-white">
          {filtered.map((att) => (
            <div key={att.id} className="p-4 flex items-center justify-between gap-3 hover:bg-neutral-50/60 transition-colors">
              <div className="flex items-center gap-3">
                <img
                  src={att.avatar}
                  alt={att.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-neutral-100"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-neutral-900">{att.name}</p>
                    <span className="text-xs text-neutral-400">@{att.username}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500">
                    <span className="font-mono font-bold bg-neutral-100 px-1.5 py-0.5 rounded text-[11px] text-neutral-700">
                      {att.ticketCode}
                    </span>
                    <span>·</span>
                    <span className="text-neutral-600 font-medium">{att.type}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleCheckIn(att.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  att.checkedIn
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs'
                    : 'bg-neutral-100 hover:bg-[#5E43F3] hover:text-white text-neutral-700'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${att.checkedIn ? 'text-emerald-600' : ''}`} />
                <span>{att.checkedIn ? 'Admitted' : 'Check-In'}</span>
              </button>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-16 text-center text-xs text-neutral-400">
              No matching attendees found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
