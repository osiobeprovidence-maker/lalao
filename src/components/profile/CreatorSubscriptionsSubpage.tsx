import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { ArrowLeft, BadgeCheck, Briefcase, Sparkles, Check, BookOpen, Clock3, ExternalLink, Send, Clapperboard } from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { VerificationBadge } from '../common/VerificationBadge';

interface CreatorSubscriptionsSubpageProps {
  onBack: () => void;
  onCloseSettings: () => void;
}

export const CreatorSubscriptionsSubpage: React.FC<CreatorSubscriptionsSubpageProps> = ({
  onBack,
  onCloseSettings,
}) => {
  const { currentUser, subscription, isCreatorPremiumActive, openCreatorSubscription, openCreatorHub, triggerShareToast } = useLalao();
  const navigate = useNavigate();
  const application = useQuery(api.creators.getMyProfessionalCreatorApplication);
  const applyForProfessionalCreator = useMutation(api.creators.applyForProfessionalCreator);
  const [creatorType, setCreatorType] = useState<'manga' | 'short_movie'>('manga');
  const [publisherName, setPublisherName] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [sampleChapterUrl, setSampleChapterUrl] = useState('');
  const [about, setAbout] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationError, setApplicationError] = useState('');

  useEffect(() => {
    setPublisherName(currentUser?.name || '');
  }, [currentUser?.name]);

  const handleProfessionalApplication = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setApplicationError('');
    try {
      await applyForProfessionalCreator({
        creatorType,
        publisherName,
        portfolioUrl,
        sampleChapterUrl: sampleChapterUrl || undefined,
        about,
      });
      triggerShareToast(`${creatorType === 'manga' ? 'Manga' : 'Short-Movie'} Creator application submitted for review`);
      setPortfolioUrl('');
      setSampleChapterUrl('');
      setAbout('');
    } catch (error: any) {
      setApplicationError(error?.message || 'Could not submit your application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-theme-surface animate-in fade-in duration-200">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-theme-surface/95 backdrop-blur-md border-b border-theme-divider-light px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-creator-subscriptions"
            type="button"
            onClick={onBack}
            className="p-1.5 -ml-1 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
            title="Back to Settings Hub"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-base text-theme-primary">
              Verification & Subscriptions
            </h1>
            <p className="text-[11px] text-theme-tertiary">Creator plans & professional creator applications</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="px-3.5 py-1.5 rounded-full bg-theme-surface-hover hover:bg-theme-surface-active text-theme-primary text-xs font-bold transition-all cursor-pointer"
        >
          Done
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-xl mx-auto w-full pb-24">
        {/* Current Plan Overview Card */}
        <div className="rounded-2xl border border-[#5E43F3]/25 bg-gradient-to-br from-[#5E43F3]/[0.06] via-theme-surface to-theme-surface p-5 space-y-4 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center shrink-0">
                <BadgeCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-theme-secondary">Current Status:</span>
                  <span className="text-xs font-extrabold capitalize text-[#5E43F3]">
                    {subscription.status === 'active'
                      ? subscription.tier === 'creator' || subscription.tier === 'creator_premium'
                        ? 'Creator Premium'
                        : subscription.tier === 'priority'
                        ? 'Priority Verified'
                        : 'Standard Verified'
                      : 'Unverified'}
                  </span>
                  <VerificationBadge tier={subscription.tier} size="xs" />
                </div>
                <p className="text-[11px] text-theme-tertiary mt-1 leading-snug">
                  {subscription.status === 'active'
                    ? subscription.tier === 'creator' || subscription.tier === 'creator_premium'
                      ? 'Full Creator Hub monetization, local analytics, badge, & rankings active'
                      : subscription.tier === 'priority'
                      ? 'Priority Discovery Weighting & Verified Seal active'
                      : 'Official Verified Seal active on profile'
                    : 'Standard account without verification benefits'}
                </p>
              </div>
            </div>
          </div>

          <div className={`grid gap-2.5 pt-2 ${isCreatorPremiumActive ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            <button
              id="btn-manage-subscription-plan"
              type="button"
              onClick={() => {
                onCloseSettings();
                openCreatorSubscription();
              }}
              className="w-full rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] active:scale-[0.99] text-white py-3 px-4 text-xs font-bold shadow-md shadow-[#5E43F3]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <BadgeCheck className="w-4 h-4" />
              <span>{subscription.status === 'active' ? 'Manage Subscription / View Plan' : 'Get Verified (from ₦800)'}</span>
            </button>

            {isCreatorPremiumActive && (
              <button
                id="btn-open-creator-hub"
                type="button"
                onClick={() => {
                  onCloseSettings();
                  openCreatorHub();
                }}
                className="w-full rounded-xl border border-[#5E43F3]/30 bg-[#5E43F3]/5 hover:bg-[#5E43F3]/10 active:scale-[0.99] text-[#5E43F3] py-3 px-4 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Briefcase className="w-4 h-4" />
                <span>Open Creator Hub</span>
              </button>
            )}
          </div>
        </div>

        {/* Manga Creator application and approval status */}
        <section className="overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] via-theme-surface to-theme-surface">
          <div className="flex items-start gap-3 border-b border-theme-divider-light p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-extrabold text-theme-primary">Professional Creator Account</h2>
              <p className="mt-1 text-[11px] leading-relaxed text-theme-tertiary">
                Apply for a dedicated publishing profile. Lalao reviews your portfolio before assigning a professional creator account type.
              </p>
            </div>
            {isCreatorPremiumActive && (
              <span className="shrink-0 rounded-full border border-[#5E43F3]/20 bg-[#5E43F3]/10 px-2 py-1 text-[9px] font-bold text-[#5E43F3]">PREMIUM</span>
            )}
          </div>

          {application?.status === 'approved' || currentUser?.creatorType ? (
            <div className="space-y-3 p-4">
              <div className="flex items-start gap-2.5 text-emerald-600 dark:text-emerald-400">
                <Check className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="text-xs font-bold">{currentUser?.creatorType === 'short_movie' || application?.creatorType === 'short_movie' ? 'Short-Movie Creator' : 'Manga Creator'} profile approved</p>
                  <p className="mt-1 text-[10px] text-theme-tertiary">Creator Premium provides Creator Hub access. Monetization also requires an approved, active creator profile.</p>
                </div>
              </div>
              {currentUser?.username && currentUser.creatorType === 'manga' && (
                <button onClick={() => { onCloseSettings(); navigate(`/manga/${currentUser.username}`); }} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5E43F3] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#4E34E0]">
                  Open Manga profile <ExternalLink className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ) : application?.status === 'pending' ? (
            <div className="flex items-start gap-2.5 p-4 text-amber-600 dark:text-amber-400">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="text-xs font-bold">{application.creatorType === 'manga' ? 'Manga' : 'Short-Movie'} Creator application under review</p>
                <p className="mt-1 text-[10px] text-theme-tertiary">We’ll notify you after the team reviews {application.publisherName}’s portfolio.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleProfessionalApplication} className="space-y-3 p-4">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setCreatorType('manga')} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold ${creatorType === 'manga' ? 'border-violet-500 bg-violet-500/10 text-violet-500' : 'border-theme-divider-light text-theme-tertiary'}`}><BookOpen className="h-4 w-4" /> Manga & Comics</button>
                <button type="button" onClick={() => setCreatorType('short_movie')} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold ${creatorType === 'short_movie' ? 'border-violet-500 bg-violet-500/10 text-violet-500' : 'border-theme-divider-light text-theme-tertiary'}`}><Clapperboard className="h-4 w-4" /> Short Movies</button>
              </div>
              {application?.status === 'rejected' && (
                <div className="rounded-xl border border-rose-500/15 bg-rose-500/[0.05] p-3 text-[11px] text-theme-secondary">
                  <p className="font-bold text-rose-500">Previous application not approved</p>
                  {application.reviewNote && <p className="mt-1">{application.reviewNote}</p>}
                  <p className="mt-1 text-theme-tertiary">Update your portfolio or application details and try again.</p>
                </div>
              )}
              <label className="block text-[10px] font-bold text-theme-secondary">
                {creatorType === 'manga' ? 'Publisher / studio name' : 'Studio / production name'}
                <input required minLength={2} maxLength={60} value={publisherName} onChange={(event) => setPublisherName(event.target.value)} placeholder={creatorType === 'manga' ? 'Your manga studio name' : 'Your production company'} className="mt-1.5 w-full rounded-xl border border-theme-divider-light bg-theme-base px-3 py-2.5 text-xs text-theme-primary outline-none focus:border-violet-500" />
              </label>
              <label className="block text-[10px] font-bold text-theme-secondary">
                Portfolio link
                <input required type="url" value={portfolioUrl} onChange={(event) => setPortfolioUrl(event.target.value)} placeholder="https://yourportfolio.com" className="mt-1.5 w-full rounded-xl border border-theme-divider-light bg-theme-base px-3 py-2.5 text-xs text-theme-primary outline-none focus:border-violet-500" />
              </label>
              <label className="block text-[10px] font-bold text-theme-secondary">
                {creatorType === 'manga' ? 'Sample chapter' : 'Sample film or trailer'} link <span className="font-normal text-theme-tertiary">(optional)</span>
                <input type="url" value={sampleChapterUrl} onChange={(event) => setSampleChapterUrl(event.target.value)} placeholder={creatorType === 'manga' ? 'https://yourportfolio.com/chapter-1' : 'https://yourportfolio.com/trailer'} className="mt-1.5 w-full rounded-xl border border-theme-divider-light bg-theme-base px-3 py-2.5 text-xs text-theme-primary outline-none focus:border-violet-500" />
              </label>
              <label className="block text-[10px] font-bold text-theme-secondary">
                Tell us about your {creatorType === 'manga' ? 'manga work' : 'film work'}
                <textarea required minLength={30} maxLength={1200} rows={4} value={about} onChange={(event) => setAbout(event.target.value)} placeholder={creatorType === 'manga' ? 'What do you publish, who creates it, and what would readers find on your profile?' : 'What do you produce, who is on your team, and what films or dramas do you make?'} className="mt-1.5 w-full resize-y rounded-xl border border-theme-divider-light bg-theme-base px-3 py-2.5 text-xs leading-relaxed text-theme-primary outline-none focus:border-violet-500" />
                <span className="mt-1 block text-right font-normal text-theme-tertiary">{about.length}/1200</span>
              </label>
              {applicationError && <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-[11px] text-rose-500">{applicationError}</p>}
              <button disabled={isSubmitting || application === undefined} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5E43F3] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#4E34E0] disabled:cursor-not-allowed disabled:opacity-50">
                <Send className="h-3.5 w-3.5" /> {isSubmitting ? 'Submitting…' : `Apply for ${creatorType === 'manga' ? 'Manga' : 'Short-Movie'} Creator profile`}
              </button>
              <p className="text-center text-[9px] text-theme-tertiary">Creator Premium is a separate plan and is required for Creator Hub monetization features.</p>
            </form>
          )}
        </section>

        {/* Benefits breakdown */}
        <div className="space-y-3">
          <div className="border-b border-theme-divider-light pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
              Verification & Creator Benefits
            </h3>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-theme-divider-light rounded-2xl overflow-hidden bg-theme-surface">
            {[
              {
                title: 'Official Verified Badge',
                desc: 'Golden or purple checkmark displaying your credibility across Delta State.',
              },
              {
                title: 'Priority Discovery & Explore',
                desc: 'Rank higher in local feeds, member searches, and trending cycles.',
              },
              {
                title: 'Creator Monetization & Tips',
                desc: 'Direct member tipping, paid cycles, and subscriber-only posts.',
              },
              {
                title: 'Audience & Reach Analytics',
                desc: 'Real-time performance metrics for your posts, polls, and rallies.',
              },
              {
                title: 'Manga & Webtoon Publisher Profile',
                desc: 'Manga creators can apply for a dedicated publisher account; the Lalao team reviews portfolios before approval.',
              },
            ].map((benefit, idx) => (
              <div key={idx} className="p-3.5 flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-theme-primary block">
                    {benefit.title}
                  </span>
                  <p className="text-[11px] text-theme-tertiary mt-0.5 leading-snug">
                    {benefit.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
