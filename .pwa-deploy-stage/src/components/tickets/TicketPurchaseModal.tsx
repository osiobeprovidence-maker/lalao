import React, { useState } from 'react';
import {
  X,
  Ticket,
  CheckCircle2,
  Wallet,
  CreditCard,
  Building2,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Plus,
  Minus,
  ArrowLeft,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { EventTicket } from '../../types';

export const TicketPurchaseModal: React.FC = () => {
  const {
    purchasingEvent,
    isTicketPurchaseOpen,
    setIsTicketPurchaseOpen,
    currentUser,
    addTicket,
    setSelectedTicketForPass,
    wallet,
    payWithWallet,
    triggerShareToast,
  } = useLalao();

  const [ticketTier, setTicketTier] = useState<'General Admission' | 'VIP Pass'>('General Admission');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card'>('wallet');
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchasedTicket, setPurchasedTicket] = useState<EventTicket | null>(null);

  if (!isTicketPurchaseOpen || !purchasingEvent) return null;

  const event = purchasingEvent;

  const tierPrices = {
    'General Admission': event.ticketPrice || 5000,
    'VIP Pass': (event.ticketPrice || 5000) * 3,
  };

  const currentPrice = tierPrices[ticketTier];
  const totalPrice = currentPrice * quantity;

  const handleCompletePurchase = () => {
    setIsProcessing(true);

    if (paymentMethod === 'wallet') {
      const success = payWithWallet(
        totalPrice,
        `Event Ticket: ${event.title} (${quantity}x ${ticketTier})`,
        `LLW-TKT-${Math.floor(100000 + Math.random() * 900000)}`
      );
      if (!success) {
        setIsProcessing(false);
        triggerShareToast('Insufficient wallet balance. Please choose card or top up.');
        return;
      }
    }

    setTimeout(() => {
      setIsProcessing(false);
      const newTicket: EventTicket = {
        id: `LL-HOK-${Date.now().toString().slice(-5)}`,
        eventId: event.id,
        eventTitle: event.title,
        organizationName: event.organizationName,
        date: event.date,
        time: event.time,
        venue: event.location,
        ticketType: ticketTier,
        price: totalPrice,
        holderName: currentUser.name,
        holderId: currentUser.id,
        qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=LL-HOK-TICKET',
        seat: ticketTier === 'VIP Pass' ? 'VIP Lounge · Row 1 · Seat 04' : 'Section B · Row 4 · Seat 12',
        status: 'active',
        purchaseDate: new Date().toISOString(),
      };

      addTicket(newTicket);
      setPurchasedTicket(newTicket);
    }, 1200);
  };

  const handleViewTicket = () => {
    setIsTicketPurchaseOpen(false);
    if (purchasedTicket) {
      setSelectedTicketForPass(purchasedTicket);
    }
  };

  return (
    <div
      id="screen-ticket-purchase"
      className="absolute inset-0 z-40 bg-theme-surface flex flex-col min-h-full overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-200"
    >
      {/* Header */}
      <header className="sticky top-0 z-20 bg-theme-surface/95 backdrop-blur-md px-4 lg:px-8 py-3.5 border-b border-theme-divider flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsTicketPurchaseOpen(false)}
            className="p-1.5 -ml-1 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-100 text-[#5E43F3] flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-black text-theme-primary leading-tight">GET YOUR TICKET</h1>
              <p className="text-[11px] text-theme-tertiary truncate max-w-xs">{event.title}</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsTicketPurchaseOpen(false)}
          className="p-1.5 rounded-full text-theme-tertiary hover:text-theme-secondary hover:bg-theme-surface-hover transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Content Body */}
      <div className="flex-1 max-w-lg mx-auto w-full p-5 space-y-5 pb-24">
          {purchasedTicket ? (
            /* Purchase Success State */
            <div className="text-center py-6 px-2 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
              </div>

              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                  Payment Complete
                </span>
                <h3 className="text-xl font-black text-theme-primary mt-1">
                  Ticket Purchased Successfully!
                </h3>
                <p className="text-xs text-theme-secondary mt-2 max-w-xs mx-auto leading-relaxed">
                  Your digital event pass for{' '}
                  <strong className="text-theme-primary font-bold">{event.title}</strong> has been
                  generated and added to your tickets wallet.
                </p>
              </div>

              {/* Ticket Mini Preview Card */}
              <div className="bg-theme-base rounded-2xl p-4 border border-theme-divider text-left space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-theme-divider">
                  <span className="text-theme-tertiary font-medium">Ticket Type</span>
                  <span className="font-bold text-[#5E43F3]">{purchasedTicket.ticketType}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-theme-divider">
                  <span className="text-theme-tertiary font-medium">Ticket ID</span>
                  <span className="font-mono text-theme-primary">{purchasedTicket.id}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-theme-divider">
                  <span className="text-theme-tertiary font-medium">Date & Time</span>
                  <span className="font-bold text-theme-primary">
                    {purchasedTicket.date} · {purchasedTicket.time}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-theme-tertiary font-medium">Total Paid</span>
                  <span className="font-black text-theme-primary">
                    ₦{purchasedTicket.price.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Success CTAs */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  id="btn-view-purchased-ticket"
                  onClick={handleViewTicket}
                  className="w-full py-3 rounded-xl bg-theme-inverse hover:bg-theme-inverse text-theme-text-inverse text-xs font-black transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <Ticket className="w-4 h-4 text-violet-300" />
                  <span>View My Ticket</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsTicketPurchaseOpen(false)}
                  className="w-full py-2.5 rounded-xl border border-theme-divider-strong hover:bg-theme-surface-hover text-theme-secondary text-xs font-bold transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Event Card Summary */}
              <div className="p-3 bg-theme-base rounded-2xl border border-theme-divider flex items-center gap-3">
                <img
                  src={event.coverImage}
                  alt={event.title}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-theme-primary truncate">{event.title}</h4>
                  <p className="text-[11px] text-theme-tertiary mt-0.5">
                    {event.date} · {event.time}
                  </p>
                  <p className="text-[11px] text-theme-secondary truncate">{event.location}</p>
                </div>
              </div>

              {/* Ticket Type Selector */}
              <div>
                <label className="text-xs font-bold text-theme-primary block mb-2">
                  Select Ticket Tier
                </label>
                <div className="space-y-2">
                  <div
                    onClick={() => setTicketTier('General Admission')}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      ticketTier === 'General Admission'
                        ? 'border-[#5E43F3] bg-violet-50/50 shadow-xs'
                        : 'border-theme-divider hover:border-theme-divider-strong bg-theme-surface'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-theme-primary">General Admission</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-theme-surface-hover text-theme-secondary">
                          Arena Entry
                        </span>
                      </div>
                      <p className="text-[11px] text-theme-tertiary mt-0.5">
                        Standard hall seating, live match viewing, audience raffle entry
                      </p>
                    </div>
                    <span className="text-xs font-black text-theme-primary ml-3">
                      ₦{tierPrices['General Admission'].toLocaleString()}
                    </span>
                  </div>

                  <div
                    onClick={() => setTicketTier('VIP Pass')}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      ticketTier === 'VIP Pass'
                        ? 'border-[#5E43F3] bg-violet-50/50 shadow-xs'
                        : 'border-theme-divider hover:border-theme-divider-strong bg-theme-surface'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-theme-primary">VIP Pass</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800">
                          FRONT ROW
                        </span>
                      </div>
                      <p className="text-[11px] text-theme-tertiary mt-0.5">
                        Front-row seating, team meet-and-greet, VIP hospitality lounge
                      </p>
                    </div>
                    <span className="text-xs font-black text-theme-primary ml-3">
                      ₦{tierPrices['VIP Pass'].toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center justify-between p-3.5 bg-theme-base rounded-2xl border border-theme-divider">
                <div>
                  <h4 className="text-xs font-bold text-theme-primary">Quantity</h4>
                  <p className="text-[11px] text-theme-tertiary">Max 4 passes per user</p>
                </div>

                <div className="flex items-center gap-3 bg-theme-surface px-2 py-1 rounded-xl border border-theme-divider">
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-1 rounded-lg text-theme-secondary hover:bg-theme-surface-hover disabled:opacity-30 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold text-theme-primary w-4 text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= 4}
                    onClick={() => setQuantity(Math.min(4, quantity + 1))}
                    className="p-1 rounded-lg text-theme-secondary hover:bg-theme-surface-hover disabled:opacity-30 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="text-xs font-bold text-theme-primary block mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wallet')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      paymentMethod === 'wallet'
                        ? 'border-[#5E43F3] bg-violet-50/60 ring-1 ring-[#5E43F3]'
                        : 'border-theme-divider hover:border-theme-divider-strong bg-theme-surface'
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-[#5E43F3] mb-1.5" />
                    <p className="text-xs font-bold text-theme-primary">Lao Line Wallet</p>
                    <p className="text-[10px] text-theme-tertiary">Balance: ₦{wallet.balance.toLocaleString()}</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      paymentMethod === 'card'
                        ? 'border-[#5E43F3] bg-violet-50/60 ring-1 ring-[#5E43F3]'
                        : 'border-theme-divider hover:border-theme-divider-strong bg-theme-surface'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-theme-secondary mb-1.5" />
                    <p className="text-xs font-bold text-theme-primary">Card / USSD</p>
                    <p className="text-[10px] text-theme-tertiary">Instant Paystack</p>
                  </button>
                </div>
              </div>

              {/* Order Summary */}
              <div className="p-3.5 bg-theme-base rounded-2xl border border-theme-divider space-y-2 text-xs">
                <h4 className="font-bold text-theme-primary pb-1 border-b border-theme-divider">
                  Order Summary
                </h4>
                <div className="flex justify-between text-theme-secondary">
                  <span>
                    {quantity} × {ticketTier}
                  </span>
                  <span className="font-semibold text-theme-primary">
                    ₦{(currentPrice * quantity).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-theme-secondary">
                  <span>Service / Issuance Fee</span>
                  <span className="font-semibold text-emerald-600">₦0 (Free)</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-theme-divider text-sm">
                  <span className="font-bold text-theme-primary">Total</span>
                  <span className="font-black text-theme-primary">₦{totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </>
          )}
        </div>

      {/* Modal Submit Footer */}
      {!purchasedTicket && (
        <footer className="sticky bottom-0 z-20 px-4 lg:px-8 py-3.5 border-t border-theme-divider bg-theme-surface/95 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          <div>
            <p className="text-[10px] text-theme-tertiary uppercase font-medium">Amount Due</p>
            <p className="text-sm font-black text-theme-primary">₦{totalPrice.toLocaleString()}</p>
          </div>

          <button
            type="button"
            id="btn-pay-ticket"
            disabled={isProcessing}
            onClick={handleCompletePurchase}
            className="py-2.5 px-6 rounded-xl bg-theme-inverse hover:bg-theme-inverse text-theme-text-inverse text-xs font-black transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {isProcessing ? (
              <span>Processing Payment...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-violet-300" />
                <span>Pay ₦{totalPrice.toLocaleString()} & Get Ticket</span>
              </>
            )}
          </button>
        </footer>
      )}
    </div>
  );
};
