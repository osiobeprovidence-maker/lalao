import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Trophy,
  Image as ImageIcon,
  Check,
  Globe,
  Sparkles,
  DollarSign,
} from 'lucide-react';
import { OrgEvent, Page } from '../../types';
import { useLalao } from '../../context/LalaoContext';

interface PageEventModalProps {
  page: Page;
  eventToEdit?: OrgEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_EVENT_COVERS = [
  'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
];

export const PageEventModal: React.FC<PageEventModalProps> = ({
  page,
  eventToEdit,
  isOpen,
  onClose,
}) => {
  const { createPageEvent, updatePageEvent } = useLalao();

  const [title, setTitle] = useState(eventToEdit?.title || '');
  const [type, setType] = useState<OrgEvent['type']>(eventToEdit?.type || 'community');
  const [date, setDate] = useState(eventToEdit?.date || 'December 12, 2026');
  const [time, setTime] = useState(eventToEdit?.time || '4:00 PM');
  const [location, setLocation] = useState(eventToEdit?.location || page.location || '');
  const [isOnline, setIsOnline] = useState(eventToEdit?.isOnline || false);
  const [isTicketed, setIsTicketed] = useState(eventToEdit?.isTicketed || false);
  const [ticketPrice, setTicketPrice] = useState<number>(eventToEdit?.ticketPrice || 2500);
  const [availableTickets, setAvailableTickets] = useState<number>(
    eventToEdit?.availableTickets || 100
  );
  const [isTournament, setIsTournament] = useState(eventToEdit?.isTournament || false);
  const [prizePool, setPrizePool] = useState<number>(eventToEdit?.prizePool || 100000);
  const [description, setDescription] = useState(eventToEdit?.description || '');
  const [coverImage, setCoverImage] = useState(
    eventToEdit?.coverImage || PRESET_EVENT_COVERS[0]
  );
  const [showCoverSelector, setShowCoverSelector] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    if (eventToEdit) {
      updatePageEvent(eventToEdit.id, {
        title: title.trim(),
        type,
        date,
        time,
        location: isOnline ? 'Online Voice Stage / Stream' : location.trim(),
        isOnline,
        isTicketed,
        ticketPrice: isTicketed ? Number(ticketPrice) : undefined,
        availableTickets: isTicketed ? Number(availableTickets) : undefined,
        isTournament,
        prizePool: isTournament ? Number(prizePool) : undefined,
        description: description.trim(),
        coverImage,
      });
    } else {
      createPageEvent(page.id, {
        title: title.trim(),
        type,
        date,
        time,
        location: isOnline ? 'Online Voice Stage / Stream' : location.trim(),
        isOnline,
        isTicketed,
        ticketPrice: isTicketed ? Number(ticketPrice) : undefined,
        availableTickets: isTicketed ? Number(availableTickets) : undefined,
        totalTickets: isTicketed ? Number(availableTickets) : undefined,
        isTournament,
        prizePool: isTournament ? Number(prizePool) : undefined,
        description: description.trim(),
        coverImage,
        registrationStatus: 'open',
      });
    }

    onClose();
  };

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
              {eventToEdit ? 'Edit Event' : 'Create New Event'}
            </h3>
            <p className="text-xs text-neutral-500 font-medium truncate max-w-[180px] sm:max-w-md">
              @{page.username} · Ticketing, venue & schedule
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleSubmit()}
          className="px-4 py-2 rounded-xl bg-[#5E43F3] text-white text-xs font-bold hover:bg-[#4E34E0] shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>{eventToEdit ? 'Save' : 'Publish'}</span>
        </button>
      </div>

      {/* Page Content Container */}
      <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 pb-24 flex-1">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Photo Selection */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-neutral-500 block mb-2">
              Event Cover Banner
            </label>
            <div className="relative h-44 rounded-3xl overflow-hidden bg-neutral-900 border border-neutral-200 group">
              <img
                src={coverImage}
                alt="Cover Preview"
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setShowCoverSelector(!showCoverSelector)}
                  className="px-4 py-2 rounded-full bg-white text-neutral-900 text-xs font-bold shadow-md hover:bg-neutral-100 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-[#5E43F3]" />
                  <span>Change Banner</span>
                </button>
              </div>
            </div>

            {showCoverSelector && (
              <div className="mt-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-200 grid grid-cols-3 sm:grid-cols-5 gap-2 animate-in fade-in">
                {PRESET_EVENT_COVERS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setCoverImage(url);
                      setShowCoverSelector(false);
                    }}
                    className={`h-16 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                      coverImage === url ? 'border-[#5E43F3] scale-95' : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Event Details */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Event Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Delta Creative Founders Meetup & Showcase"
                className="w-full px-4 py-3 rounded-2xl border border-neutral-200 text-sm font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Event Format
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-2xl border border-neutral-200 text-sm font-semibold text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#5E43F3] cursor-pointer"
                >
                  <option value="community">Community Meetup</option>
                  <option value="tournament">Competitive Tournament</option>
                  <option value="live">Live Showcase / Stage</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Location Type
                </label>
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setIsOnline(false)}
                    className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                      !isOnline
                        ? 'border-[#5E43F3] bg-violet-50 text-[#5E43F3]'
                        : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    In-Person
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOnline(true)}
                    className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                      isOnline
                        ? 'border-[#5E43F3] bg-violet-50 text-[#5E43F3]'
                        : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    Online Stage
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Date
                </label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="e.g. November 28, 2026"
                  className="w-full px-4 py-3 rounded-2xl border border-neutral-200 text-sm font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Time
                </label>
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="e.g. 4:00 PM WAT"
                  className="w-full px-4 py-3 rounded-2xl border border-neutral-200 text-sm font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]"
                />
              </div>
            </div>

            {!isOnline && (
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Venue / Physical Location
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-neutral-400 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Plot 12, Express Way, Udu Corridor"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-neutral-200 text-sm font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Description & Agenda
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Give details about speaker lineups, schedule, eligibility, and what to bring..."
                className="w-full px-4 py-3 rounded-2xl border border-neutral-200 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#5E43F3] resize-none"
              />
            </div>
          </div>

          {/* Ticketing & Attendance Settings */}
          <div className="p-5 rounded-3xl bg-neutral-50 border border-neutral-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-neutral-900">
                  Ticketing & Paid Admission
                </h4>
                <p className="text-xs text-neutral-500">
                  Issue digital QR access passes & collect payouts directly
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTicketed}
                  onChange={(e) => setIsTicketed(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5E43F3]" />
              </label>
            </div>

            {isTicketed && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-neutral-200 animate-in fade-in">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Ticket Price (NGN)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-xs font-bold text-neutral-400">₦</span>
                    <input
                      type="number"
                      value={ticketPrice}
                      onChange={(e) => setTicketPrice(Number(e.target.value))}
                      step="500"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white border border-neutral-200 text-sm font-bold text-neutral-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-700 block mb-1">
                    Total Available Passes
                  </label>
                  <input
                    type="number"
                    value={availableTickets}
                    onChange={(e) => setAvailableTickets(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-neutral-200 text-sm font-bold text-neutral-900"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tournament Prize Pool if Tournament */}
          {type === 'tournament' && (
            <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
                <Trophy className="w-4 h-4 text-amber-600" />
                <span>Tournament Prize Pool</span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-xs font-bold text-amber-700">₦</span>
                <input
                  type="number"
                  value={prizePool}
                  onChange={(e) => setPrizePool(Number(e.target.value))}
                  step="10000"
                  placeholder="100000"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white border border-amber-300 text-sm font-bold text-amber-950"
                />
              </div>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#5E43F3] text-white text-xs font-bold hover:bg-[#4E34E0] shadow-md shadow-[#5E43F3]/25 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{eventToEdit ? 'Save Changes' : 'Publish Event'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
