import React, { useState } from 'react';
import {
  X,
  Share2,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Download,
  Maximize2,
  ShieldCheck,
  Info,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';

export const DigitalTicketModal: React.FC = () => {
  const {
    selectedTicketForPass,
    setSelectedTicketForPass,
    triggerShareToast,
  } = useLalao();

  const [isQrZoomed, setIsQrZoomed] = useState(false);
  const [showDetailsSection, setShowDetailsSection] = useState(false);

  if (!selectedTicketForPass) return null;

  const ticket = selectedTicketForPass;

  const handleShare = () => {
    triggerShareToast(`Ticket pass for ${ticket.eventTitle} copied to clipboard`);
  };

  return (
    <div
      id="screen-digital-ticket-pass"
      className="absolute inset-0 z-40 bg-neutral-900 flex flex-col min-h-full overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-200"
    >
      {/* Top Controls */}
      <header className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur-md px-4 lg:px-8 py-3.5 border-b border-neutral-800 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedTicketForPass(null)}
            className="p-1.5 -ml-1 rounded-full text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-black tracking-wider uppercase text-violet-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Lao Line Official Pass
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleShare}
            className="p-1.5 rounded-full text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Share Ticket"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setSelectedTicketForPass(null)}
            className="p-1.5 rounded-full text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-md mx-auto w-full p-4 lg:p-6 flex flex-col justify-center pb-24">
        <div className="w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-neutral-800 flex flex-col">
          {/* Real Digital Ticket Body */}
          <div className="relative bg-gradient-to-b from-neutral-900 to-neutral-950 text-white p-5 text-center">
          {/* Header Org */}
          <p className="text-[11px] font-black uppercase tracking-widest text-violet-400">
            {ticket.organizationName.toUpperCase()}
          </p>

          {/* Event Title */}
          <h2 className="text-xl font-black tracking-tight text-white mt-1">
            {ticket.eventTitle}
          </h2>

          <div className="inline-block mt-2">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-violet-600/90 text-white border border-violet-400/40">
              {ticket.ticketType}
            </span>
          </div>

          {/* Holographic / Security Strip */}
          <div className="mt-4 py-1.5 px-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between text-[10px] text-neutral-300">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <CheckCircle2 className="w-3 h-3" />
              {ticket.status === 'active' ? 'VALID ENTRY PASS' : ticket.status.toUpperCase()}
            </span>
            <span className="font-mono">{ticket.id}</span>
          </div>
        </div>

        {/* Ticket Perforation with Scalloped Cutouts */}
        <div className="relative h-6 bg-neutral-950 flex items-center justify-center">
          {/* Left Notch */}
          <div className="absolute -left-3 w-6 h-6 rounded-full bg-black/75" />
          {/* Dashed Tear Line */}
          <div className="w-full border-t-2 border-dashed border-neutral-700/80 mx-5" />
          {/* Right Notch */}
          <div className="absolute -right-3 w-6 h-6 rounded-full bg-black/75" />
        </div>

        {/* QR Code Section */}
        <div className="bg-white p-6 flex flex-col items-center justify-center text-center space-y-4">
          {/* Interactive QR Card */}
          <div
            onClick={() => setIsQrZoomed(!isQrZoomed)}
            className={`relative p-3.5 bg-white border-2 border-neutral-900 rounded-2xl shadow-lg transition-transform cursor-pointer ${
              isQrZoomed ? 'scale-110' : 'hover:scale-102'
            }`}
            title="Tap to enlarge QR Code"
          >
            {/* Real SVG QR Pattern */}
            <svg
              className="w-44 h-44"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="100" height="100" fill="white" />
              {/* Corner Position Detection Squares (Top-Left) */}
              <rect x="5" y="5" width="26" height="26" rx="4" fill="#0A0A0A" />
              <rect x="9" y="9" width="18" height="18" rx="2" fill="white" />
              <rect x="13" y="13" width="10" height="10" rx="1" fill="#5E43F3" />

              {/* Top-Right */}
              <rect x="69" y="5" width="26" height="26" rx="4" fill="#0A0A0A" />
              <rect x="73" y="9" width="18" height="18" rx="2" fill="white" />
              <rect x="77" y="13" width="10" height="10" rx="1" fill="#5E43F3" />

              {/* Bottom-Left */}
              <rect x="5" y="69" width="26" height="26" rx="4" fill="#0A0A0A" />
              <rect x="9" y="73" width="18" height="18" rx="2" fill="white" />
              <rect x="13" y="77" width="10" height="10" rx="1" fill="#5E43F3" />

              {/* Data Blocks Grid */}
              <rect x="36" y="8" width="4" height="4" fill="#0A0A0A" />
              <rect x="44" y="8" width="4" height="4" fill="#0A0A0A" />
              <rect x="52" y="8" width="4" height="4" fill="#0A0A0A" />
              <rect x="60" y="8" width="4" height="4" fill="#0A0A0A" />
              <rect x="36" y="16" width="4" height="4" fill="#0A0A0A" />
              <rect x="48" y="16" width="8" height="4" fill="#0A0A0A" />
              <rect x="60" y="16" width="4" height="4" fill="#0A0A0A" />
              <rect x="36" y="24" width="8" height="4" fill="#0A0A0A" />
              <rect x="52" y="24" width="4" height="4" fill="#0A0A0A" />

              {/* Middle Section Data */}
              <rect x="8" y="36" width="4" height="4" fill="#0A0A0A" />
              <rect x="16" y="36" width="4" height="4" fill="#0A0A0A" />
              <rect x="24" y="36" width="4" height="4" fill="#0A0A0A" />
              <rect x="8" y="44" width="8" height="4" fill="#0A0A0A" />
              <rect x="24" y="44" width="4" height="4" fill="#0A0A0A" />
              <rect x="8" y="52" width="4" height="4" fill="#0A0A0A" />
              <rect x="16" y="52" width="8" height="4" fill="#0A0A0A" />
              <rect x="8" y="60" width="8" height="4" fill="#0A0A0A" />

              {/* Center Crest Emblem */}
              <circle cx="50" cy="50" r="13" fill="white" stroke="#5E43F3" strokeWidth="2" />
              <text
                x="50"
                y="54"
                textAnchor="middle"
                fontSize="8"
                fontWeight="900"
                fill="#5E43F3"
                fontFamily="sans-serif"
              >
                HOK
              </text>

              {/* Bottom Right Data Matrix */}
              <rect x="36" y="69" width="4" height="4" fill="#0A0A0A" />
              <rect x="44" y="69" width="8" height="4" fill="#0A0A0A" />
              <rect x="56" y="69" width="4" height="4" fill="#0A0A0A" />
              <rect x="64" y="69" width="8" height="4" fill="#0A0A0A" />
              <rect x="80" y="69" width="4" height="4" fill="#0A0A0A" />
              <rect x="88" y="69" width="4" height="4" fill="#0A0A0A" />

              <rect x="36" y="77" width="8" height="4" fill="#0A0A0A" />
              <rect x="48" y="77" width="4" height="4" fill="#0A0A0A" />
              <rect x="60" y="77" width="8" height="4" fill="#0A0A0A" />
              <rect x="76" y="77" width="4" height="4" fill="#0A0A0A" />

              <rect x="40" y="85" width="4" height="4" fill="#0A0A0A" />
              <rect x="52" y="85" width="8" height="4" fill="#0A0A0A" />
              <rect x="68" y="85" width="4" height="4" fill="#0A0A0A" />
              <rect x="80" y="85" width="8" height="4" fill="#0A0A0A" />

              <rect x="36" y="92" width="4" height="4" fill="#0A0A0A" />
              <rect x="48" y="92" width="4" height="4" fill="#0A0A0A" />
              <rect x="60" y="92" width="4" height="4" fill="#0A0A0A" />
              <rect x="72" y="92" width="4" height="4" fill="#0A0A0A" />
              <rect x="88" y="92" width="4" height="4" fill="#0A0A0A" />
            </svg>

            <div className="absolute inset-x-0 bottom-1 text-[9px] font-mono font-bold text-neutral-400">
              SCAN TO ADMIT
            </div>
          </div>

          <p className="text-[11px] text-neutral-500">
            Show this digital pass at the entrance scan terminal.
          </p>

          {/* Ticket Information Table */}
          <div className="w-full bg-neutral-50 rounded-2xl p-4 border border-neutral-200 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
              <span className="text-neutral-500">Ticket Holder</span>
              <span className="font-bold text-neutral-900">{ticket.holderName}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
              <span className="text-neutral-500">Date & Time</span>
              <span className="font-bold text-neutral-900">
                {ticket.date} · {ticket.time}
              </span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
              <span className="text-neutral-500">Venue</span>
              <span className="font-bold text-neutral-900">{ticket.venue}</span>
            </div>

            {ticket.seat && (
              <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
                <span className="text-neutral-500">Seat / Tier</span>
                <span className="font-bold text-[#5E43F3]">{ticket.seat}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-neutral-500">Ticket ID</span>
              <span className="font-mono text-neutral-600">{ticket.id}</span>
            </div>
          </div>

          {/* Extra Details Accordion */}
          {showDetailsSection && (
            <div className="w-full p-3 bg-violet-50/60 rounded-xl border border-violet-100 text-left text-[11px] text-neutral-700 space-y-1.5 animate-fadeIn">
              <div className="flex items-center gap-1.5 font-bold text-violet-950">
                <ShieldCheck className="w-3.5 h-3.5 text-[#5E43F3]" />
                Security & Admission Rules
              </div>
              <p>• Digital pass admits one person only.</p>
              <p>• Screenshots or duplicates will be rejected at automated turnstiles.</p>
              <p>• Doors open 30 minutes prior to match schedule.</p>
            </div>
          )}

          {/* Action Buttons: Primary & Secondary */}
          <div className="w-full space-y-2 pt-2">
            <button
              type="button"
              id="btn-pass-show-qr"
              onClick={() => setIsQrZoomed(!isQrZoomed)}
              className="w-full py-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{isQrZoomed ? 'Standard QR View' : 'Show Fullscreen QR'}</span>
            </button>

            <button
              type="button"
              id="btn-pass-ticket-details"
              onClick={() => setShowDetailsSection(!showDetailsSection)}
              className="w-full py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Info className="w-3.5 h-3.5" />
              <span>{showDetailsSection ? 'Hide Details' : 'Ticket Details'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};
