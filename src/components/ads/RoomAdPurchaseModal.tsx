import React, { useState } from 'react';
import { useAction, useMutation } from 'convex/react';
import { X, Megaphone, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { CampaignImageUploader } from './CampaignImageUploader';

const DURATION_OPTIONS = [1, 3, 7, 14, 30] as const;

interface RoomAdPurchaseModalProps {
  roomId: Id<'groupChats'>;
  roomName: string;
  onClose: () => void;
}

export const RoomAdPurchaseModal: React.FC<RoomAdPurchaseModalProps> = ({ roomId, roomName, onClose }) => {
  const createCampaign = useMutation(api.ads.createCampaign);
  const initializePayment = useAction(api.adActions.initializeCampaignPayment);
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [destinationUrl, setDestinationUrl] = useState('https://');
  const [durationDays, setDurationDays] = useState<number>(7);
  const [budgetNgn, setBudgetNgn] = useState(5000);
  const [campaignId, setCampaignId] = useState<Id<'adCampaigns'> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!headline.trim()) return setError('Add a headline for your advertisement.');
    if (!Number.isFinite(budgetNgn) || budgetNgn < 1000) return setError('The minimum campaign budget is ₦1,000.');
    if (!/^https:\/\//i.test(destinationUrl.trim()) && !destinationUrl.trim().startsWith('/')) {
      return setError('Use an HTTPS destination or a Lalao app path.');
    }

    setIsSubmitting(true);
    try {
      let id = campaignId;
      if (!id) {
        const startDate = Date.now();
        id = await createCampaign({
          name: `${headline.trim().slice(0, 28)} · ${roomName}`,
          objective: 'local_discovery',
          format: 'sponsored_post',
          placement: 'room',
          roomId,
          creative: {
            headline: headline.trim(),
            description: description.trim() || undefined,
            mediaUrl: mediaUrl || undefined,
            mediaType: mediaUrl ? 'image' : undefined,
            ctaLabel: 'Learn More',
            destinationUrl: destinationUrl.trim(),
          },
          targeting: { targetType: 'broad_nation', country: 'Nigeria' },
          budget: { currency: 'NGN', totalBudgetKobo: Math.round(budgetNgn * 100) },
          schedule: { startDate, endDate: startDate + durationDays * 24 * 60 * 60 * 1000 },
        });
        setCampaignId(id);
      }

      const checkout = await initializePayment({ campaignId: id });
      window.location.assign(checkout.authorizationUrl);
    } catch (reason: any) {
      setError(reason?.message || 'Could not start checkout. You can retry without recreating the campaign.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="room-ad-title" className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-theme-divider bg-theme-surface p-5 shadow-2xl sm:rounded-3xl sm:p-6">
        <header className="mb-5 flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#5E43F3]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#5E43F3]"><Megaphone size={13}/> Room advertisement</div>
            <h2 id="room-ad-title" className="text-lg font-black text-theme-primary">Reach {roomName}</h2>
            <p className="mt-1 text-xs text-theme-tertiary">Create a sponsored placement for this room’s timeline.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close advertisement form" className="rounded-full p-2 text-theme-tertiary hover:bg-theme-surface-hover"><X size={18}/></button>
        </header>

        <form onSubmit={handleCheckout} className="space-y-4">
          <label className="block space-y-1.5 text-xs font-bold text-theme-primary">Headline
            <input maxLength={80} required value={headline} onChange={(event) => setHeadline(event.target.value)} placeholder="What should room members know?" className="w-full rounded-xl border border-theme-divider bg-theme-base px-3.5 py-3 text-sm font-normal text-theme-primary outline-none focus:border-[#5E43F3]" />
          </label>
          <label className="block space-y-1.5 text-xs font-bold text-theme-primary">Description <span className="font-normal text-theme-tertiary">(optional)</span>
            <textarea maxLength={240} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="A short description of your offer" className="w-full resize-y rounded-xl border border-theme-divider bg-theme-base px-3.5 py-3 text-sm font-normal text-theme-primary outline-none focus:border-[#5E43F3]" />
          </label>
          <div>
            <p className="mb-2 text-xs font-bold text-theme-primary">Creative image <span className="font-normal text-theme-tertiary">(optional)</span></p>
          <CampaignImageUploader mediaUrl={mediaUrl} onMediaUrlChange={setMediaUrl} onUploadStateChange={setIsImageUploading} disabled={isSubmitting} />
          </div>
          <label className="block space-y-1.5 text-xs font-bold text-theme-primary">Destination
            <input required value={destinationUrl} onChange={(event) => setDestinationUrl(event.target.value)} placeholder="https://yourbusiness.com" className="w-full rounded-xl border border-theme-divider bg-theme-base px-3.5 py-3 text-sm font-normal text-theme-primary outline-none focus:border-[#5E43F3]" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5 text-xs font-bold text-theme-primary">Duration
              <select value={durationDays} onChange={(event) => setDurationDays(Number(event.target.value))} className="w-full rounded-xl border border-theme-divider bg-theme-base px-3 py-3 text-sm text-theme-primary">
                {DURATION_OPTIONS.map((days) => <option key={days} value={days}>{days} {days === 1 ? 'day' : 'days'}</option>)}
              </select>
            </label>
            <label className="block space-y-1.5 text-xs font-bold text-theme-primary">Campaign budget (₦)
              <input type="number" min={1000} max={5000000} step={500} value={budgetNgn} onChange={(event) => setBudgetNgn(Number(event.target.value))} className="w-full rounded-xl border border-theme-divider bg-theme-base px-3 py-3 text-sm text-theme-primary" />
            </label>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-theme-divider bg-theme-base px-4 py-3 text-sm">
            <span className="text-theme-secondary">Payable through secure checkout</span>
            <strong className="text-[#5E43F3]">₦{(Number.isFinite(budgetNgn) ? budgetNgn : 0).toLocaleString()}</strong>
          </div>
          <p className="flex items-start gap-2 text-[11px] leading-relaxed text-theme-tertiary"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#5E43F3]"/>Payment is verified by the payment provider. The campaign goes live after verification and the existing ad review.</p>
          {error && <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-xs text-red-600">{error}</p>}
          <button type="submit" disabled={isSubmitting || isImageUploading || !headline.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5E43F3] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#4E34E0] disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? <><Loader2 size={16} className="animate-spin"/>Connecting to checkout…</> : `Continue · ₦${(Number.isFinite(budgetNgn) ? budgetNgn : 0).toLocaleString()}`}
          </button>
        </form>
      </section>
    </div>
  );
};
