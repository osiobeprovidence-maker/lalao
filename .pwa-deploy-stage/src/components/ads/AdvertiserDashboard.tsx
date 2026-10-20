import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Play,
  Pause,
  BarChart3,
  Calendar,
  DollarSign,
  Eye,
  MousePointer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Upload,
  Globe,
  MapPin,
  Layers,
  Image as ImageIcon,
  Video,
  FileText,
  CreditCard,
  ShieldCheck,
  Info
} from 'lucide-react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useLalao } from '../../context/LalaoContext';

export const AdvertiserDashboard: React.FC = () => {
  const { currentUser, location } = useLalao();
  const campaigns = useQuery(api.ads.getMyCampaigns);
  const [activeView, setActiveView] = useState<'list' | 'create' | 'details'>('list');
  const [selectedCampaignId, setSelectedCampaignId] = useState<Id<"adCampaigns"> | null>(null);

  // Stats calculation
  const totalCampaigns = campaigns?.length || 0;
  const activeCampaigns = campaigns?.filter((c) => c.status === 'active').length || 0;
  const pendingReview = campaigns?.filter((c) => c.status === 'pending_review' || c.status === 'pending_payment').length || 0;
  const totalImpressions = campaigns?.reduce((sum, c) => sum + (c.impressionsCount || 0), 0) || 0;
  const totalClicks = campaigns?.reduce((sum, c) => sum + (c.clicksCount || 0), 0) || 0;
  const totalSpentKobo = campaigns?.reduce((sum, c) => sum + (c.budget.spentKobo || 0), 0) || 0;
  const overallCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-theme-divider">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#5E43F3]/10 text-[#5E43F3]">
              <Megaphone className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-theme-primary tracking-tight">
              Lalao Ads Manager
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-theme-tertiary mt-1">
            Grow your audience, drive verified visits, and promote to your local neighborhood or across Nigeria.
          </p>
        </div>

        {activeView === 'list' && (
          <button
            onClick={() => setActiveView('create')}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white font-bold text-sm shadow-md shadow-[#5E43F3]/25 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </button>
        )}

        {activeView !== 'list' && (
          <button
            onClick={() => {
              setActiveView('list');
              setSelectedCampaignId(null);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-theme-surface-hover hover:bg-theme-surface-active text-theme-secondary text-xs font-bold transition-colors cursor-pointer w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Campaigns</span>
          </button>
        )}
      </div>

      {activeView === 'list' && (
        <>
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider space-y-1">
              <span className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider">
                Total Spend
              </span>
              <p className="text-xl sm:text-2xl font-black text-theme-primary">
                ₦{(totalSpentKobo / 100).toLocaleString()}
              </p>
              <span className="text-[11px] text-theme-tertiary">Verified ledger balance</span>
            </div>

            <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider space-y-1">
              <span className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider">
                Impressions
              </span>
              <p className="text-xl sm:text-2xl font-black text-[#5E43F3]">
                {totalImpressions.toLocaleString()}
              </p>
              <span className="text-[11px] text-theme-tertiary">Verified viewable renders</span>
            </div>

            <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider space-y-1">
              <span className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider">
                Clicks
              </span>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {totalClicks.toLocaleString()}
              </p>
              <span className="text-[11px] text-theme-tertiary">Avg. CTR: {overallCtr}%</span>
            </div>

            <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider space-y-1">
              <span className="text-xs font-semibold text-theme-tertiary uppercase tracking-wider">
                Campaigns
              </span>
              <p className="text-xl sm:text-2xl font-black text-theme-primary">
                {activeCampaigns} <span className="text-xs font-normal text-theme-tertiary">Active / {totalCampaigns} Total</span>
              </p>
              <span className="text-[11px] text-amber-500 font-medium">
                {pendingReview > 0 ? `${pendingReview} pending review` : 'All caught up'}
              </span>
            </div>
          </div>

          {/* Campaigns Table / Cards */}
          <div className="bg-theme-surface rounded-2xl border border-theme-divider overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-theme-divider flex items-center justify-between">
              <h2 className="font-bold text-sm sm:text-base text-theme-primary">
                Campaigns Management
              </h2>
              <span className="text-xs font-medium text-theme-tertiary">
                {campaigns ? `${campaigns.length} campaigns found` : 'Loading...'}
              </span>
            </div>

            {!campaigns || campaigns.length === 0 ? (
              <div className="py-16 px-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center mx-auto">
                  <Megaphone className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-theme-primary">No campaigns yet</h3>
                <p className="text-xs text-theme-tertiary max-w-sm mx-auto">
                  Launch your first ad campaign in under 2 minutes. Reach local customers in Warri or across Nigeria with Paystack.
                </p>
                <button
                  onClick={() => setActiveView('create')}
                  className="px-5 py-2 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white font-bold text-xs shadow-sm cursor-pointer transition-colors"
                >
                  Create Your First Ad
                </button>
              </div>
            ) : (
              <div className="divide-y divide-theme-divider overflow-x-auto">
                {campaigns.map((camp) => (
                  <CampaignRowItem
                    key={camp._id}
                    campaign={camp}
                    onSelect={() => {
                      setSelectedCampaignId(camp._id);
                      setActiveView('details');
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Creation Flow */}
      {activeView === 'create' && (
        <CampaignCreationWizard
          onSuccess={(id) => {
            setSelectedCampaignId(id);
            setActiveView('details');
          }}
          onCancel={() => setActiveView('list')}
        />
      )}

      {/* Details & Payment Flow */}
      {activeView === 'details' && selectedCampaignId && (
        <CampaignDetailsView
          campaignId={selectedCampaignId}
          onBack={() => {
            setActiveView('list');
            setSelectedCampaignId(null);
          }}
        />
      )}
    </div>
  );
};

/**
 * Individual Campaign Item in List
 */
const CampaignRowItem: React.FC<{ campaign: any; onSelect: () => void }> = ({ campaign, onSelect }) => {
  const togglePause = useMutation(api.ads.togglePauseCampaign);
  const [isToggling, setIsToggling] = useState(false);

  const statusColors: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    scheduled: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    pending_payment: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    pending_review: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    paused: 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20',
    rejected: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    completed: 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20',
  };

  const handlePauseResume = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsToggling(true);
    try {
      await togglePause({
        campaignId: campaign._id,
        pause: campaign.status === 'active',
      });
    } catch (err: any) {
      alert(err.message || 'Failed to update campaign state');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div
      onClick={onSelect}
      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-theme-surface-hover/50 transition-colors cursor-pointer"
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center shrink-0 mt-0.5">
          {campaign.format === 'video_ad' ? (
            <Video className="w-5 h-5" />
          ) : campaign.format === 'image_ad' ? (
            <ImageIcon className="w-5 h-5" />
          ) : campaign.format === 'promoted_post' ? (
            <Sparkles className="w-5 h-5" />
          ) : (
            <Megaphone className="w-5 h-5" />
          )}
        </div>

        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-sm text-theme-primary truncate">
              {campaign.name}
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                statusColors[campaign.status] || statusColors.paused
              }`}
            >
              {campaign.status.replace('_', ' ')}
            </span>
          </div>

          <p className="text-xs text-theme-tertiary truncate">
            {campaign.creative.headline} · {campaign.targeting.targetType.replace('_', ' ')} (
            {campaign.targeting.locationName || 'Nigeria'})
          </p>

          <div className="flex items-center gap-4 text-[11px] text-theme-tertiary pt-1">
            <span>Budget: ₦{(campaign.budget.totalBudgetKobo / 100).toLocaleString()}</span>
            <span>Spent: ₦{(campaign.budget.spentKobo / 100).toLocaleString()}</span>
            <span>Impr: {campaign.impressionsCount || 0}</span>
            <span>Clicks: {campaign.clicksCount || 0}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {(campaign.status === 'active' || campaign.status === 'paused') && (
          <button
            onClick={handlePauseResume}
            disabled={isToggling}
            className="p-2 rounded-xl bg-theme-surface border border-theme-divider hover:bg-theme-surface-hover text-theme-secondary transition-colors"
            title={campaign.status === 'active' ? 'Pause Campaign' : 'Resume Campaign'}
          >
            {campaign.status === 'active' ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 text-emerald-500" />
            )}
          </button>
        )}
        <ChevronRight className="w-5 h-5 text-theme-tertiary" />
      </div>
    </div>
  );
};

/**
 * Multi-Step Campaign Creation Flow
 */
const CampaignCreationWizard: React.FC<{ onSuccess: (id: any) => void; onCancel: () => void }> = ({
  onSuccess,
  onCancel,
}) => {
  const { currentUser, location, posts } = useLalao();
  const createCampaignMutation = useMutation(api.ads.createCampaign);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [format, setFormat] = useState<'sponsored_post' | 'promoted_post' | 'image_ad' | 'video_ad'>('sponsored_post');
  const [objective, setObjective] = useState<'reach' | 'website_visits' | 'engagement' | 'local_discovery'>('local_discovery');
  const [promotedPostId, setPromotedPostId] = useState<string>('');

  // Creative
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [ctaLabel, setCtaLabel] = useState<any>('Learn More');
  const [destinationUrl, setDestinationUrl] = useState('https://');

  // Targeting
  const [targetType, setTargetType] = useState<'local_radius' | 'city_state' | 'broad_nation'>('local_radius');
  const [locationName, setLocationName] = useState(location?.name || 'Warri, Delta State');
  const [radiusKm, setRadiusKm] = useState(25);

  // Budget & Schedule
  const [budgetNgn, setBudgetNgn] = useState(5000); // ₦5,000 NGN default
  const [durationDays, setDurationDays] = useState(7);

  // Filter eligible user's own posts for Promoted Post option
  const myPosts = posts?.filter((p) => p.author?.id === currentUser?.id) || [];

  const handleNextStep = () => {
    setError(null);
    if (step === 1) {
      if (format === 'promoted_post' && !promotedPostId) {
        setError('Please select one of your existing posts to promote.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!headline.trim()) {
        setError('Ad headline is required.');
        return;
      }
      if (!destinationUrl.startsWith('http://') && !destinationUrl.startsWith('https://') && !destinationUrl.startsWith('/')) {
        setError('Destination URL must start with https:// or be an internal path (e.g. /app?page=...).');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleFinalSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const now = Date.now();
      const startDate = now;
      const endDate = now + durationDays * 24 * 60 * 60 * 1000;
      const totalBudgetKobo = Math.round(budgetNgn * 100);

      const campaignId = await createCampaignMutation({
        name: name.trim() || `${headline.substring(0, 24)} Ad`,
        objective,
        format,
        promotedPostId: format === 'promoted_post' && promotedPostId ? (promotedPostId as any) : undefined,
        creative: {
          headline: headline.trim(),
          description: description.trim() || undefined,
          mediaUrl: mediaUrl.trim() || undefined,
          mediaType: format === 'video_ad' ? 'video' : 'image',
          ctaLabel,
          destinationUrl: destinationUrl.trim(),
        },
        targeting: {
          targetType,
          locationName,
          radiusKm: targetType === 'local_radius' ? radiusKm : undefined,
          country: 'Nigeria',
        },
        budget: {
          currency: 'NGN',
          totalBudgetKobo,
        },
        schedule: {
          startDate,
          endDate,
        },
      });

      onSuccess(campaignId);
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-theme-surface rounded-2xl border border-theme-divider p-5 sm:p-7 space-y-6">
      {/* Wizard Progress Bar */}
      <div className="flex items-center justify-between border-b border-theme-divider pb-4">
        {[
          { num: 1, label: 'Format' },
          { num: 2, label: 'Creative' },
          { num: 3, label: 'Audience' },
          { num: 4, label: 'Budget' },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === s.num
                  ? 'bg-[#5E43F3] text-white'
                  : step > s.num
                  ? 'bg-emerald-500 text-white'
                  : 'bg-theme-surface-hover text-theme-tertiary'
              }`}
            >
              {step > s.num ? '✓' : s.num}
            </div>
            <span
              className={`text-xs font-semibold hidden sm:inline ${
                step === s.num ? 'text-theme-primary' : 'text-theme-tertiary'
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: FORMAT & OBJECTIVE */}
      {step === 1 && (
        <div className="space-y-5">
          <h2 className="text-base font-bold text-theme-primary">Select Campaign Format</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                id: 'sponsored_post',
                title: 'Sponsored Feed Post',
                desc: 'Native sponsored card with headline, custom media, and strong CTA button.',
                icon: Megaphone,
              },
              {
                id: 'promoted_post',
                title: 'Promote Existing Post',
                desc: 'Boost one of your authentic Lalao posts to gain viral local reach.',
                icon: Sparkles,
              },
              {
                id: 'image_ad',
                title: 'Image Advertisement',
                desc: 'Showcase your products, flyers, or store banner with a visual focal point.',
                icon: ImageIcon,
              },
              {
                id: 'video_ad',
                title: 'Video Advertisement',
                desc: 'High-engagement video creative with native auto-playback in the feed.',
                icon: Video,
              },
            ].map((fmt) => {
              const Icon = fmt.icon;
              const isSelected = format === fmt.id;
              return (
                <div
                  key={fmt.id}
                  onClick={() => setFormat(fmt.id as any)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'border-[#5E43F3] bg-[#5E43F3]/5'
                      : 'border-theme-divider hover:border-theme-divider-strong'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-[#5E43F3]' : 'text-theme-tertiary'}`} />
                    <h3 className="font-bold text-sm text-theme-primary">{fmt.title}</h3>
                  </div>
                  <p className="text-xs text-theme-tertiary leading-relaxed">{fmt.desc}</p>
                </div>
              );
            })}
          </div>

          {format === 'promoted_post' && (
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-theme-primary">Choose Post to Promote</label>
              {myPosts.length === 0 ? (
                <p className="text-xs text-amber-500 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                  You haven't authored any posts yet. Please create an organic post first or choose "Sponsored Feed Post".
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar border border-theme-divider rounded-xl p-2">
                  {myPosts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setPromotedPostId(p.id);
                        setHeadline(p.content?.substring(0, 40) || 'Promoted Post');
                        setDescription(p.content || '');
                        if (p.media?.[0]?.url) setMediaUrl(p.media[0].url);
                      }}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                        promotedPostId === p.id
                          ? 'border-[#5E43F3] bg-[#5E43F3]/10 font-bold'
                          : 'border-theme-divider hover:bg-theme-surface-hover'
                      }`}
                    >
                      <p className="line-clamp-2">{p.content || 'Media Post'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-theme-primary">Campaign Objective</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'local_discovery', label: 'Local Discovery' },
                { id: 'reach', label: 'Brand Reach' },
                { id: 'website_visits', label: 'Website Visits' },
                { id: 'engagement', label: 'Engagement' },
              ].map((obj) => (
                <button
                  key={obj.id}
                  type="button"
                  onClick={() => setObjective(obj.id as any)}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                    objective === obj.id
                      ? 'border-[#5E43F3] bg-[#5E43F3] text-white shadow-xs'
                      : 'border-theme-divider hover:bg-theme-surface-hover text-theme-secondary'
                  }`}
                >
                  {obj.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: CREATIVE & DESTINATION */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-theme-primary">Craft Your Ad Creative</h2>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-theme-primary">Campaign Internal Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Easter Promo 2026"
              className="w-full px-3.5 py-2.5 rounded-xl bg-theme-base border border-theme-divider text-xs text-theme-primary focus:border-[#5E43F3] outline-hidden"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-theme-primary">Ad Headline *</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. 50% Off Fresh Pastries in Warri"
              maxLength={80}
              className="w-full px-3.5 py-2.5 rounded-xl bg-theme-base border border-theme-divider text-xs text-theme-primary focus:border-[#5E43F3] outline-hidden font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-theme-primary">Ad Description / Body Copy</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell your local customers what makes your business or offer special..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-theme-base border border-theme-divider text-xs text-theme-primary focus:border-[#5E43F3] outline-hidden resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-theme-primary">
              Media URL ({format === 'video_ad' ? 'Video MP4 / HLS' : 'Image JPG / PNG / WebP'})
            </label>
            <input
              type="url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://example.com/creative.jpg"
              className="w-full px-3.5 py-2.5 rounded-xl bg-theme-base border border-theme-divider text-xs text-theme-primary focus:border-[#5E43F3] outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-theme-primary">Call to Action (CTA)</label>
              <select
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-theme-base border border-theme-divider text-xs text-theme-primary focus:border-[#5E43F3] outline-hidden"
              >
                <option value="Learn More">Learn More</option>
                <option value="Shop Now">Shop Now</option>
                <option value="Contact Us">Contact Us</option>
                <option value="Sign Up">Sign Up</option>
                <option value="Visit Profile">Visit Profile</option>
                <option value="Order Now">Order Now</option>
                <option value="Book Now">Book Now</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-theme-primary">Destination URL *</label>
              <input
                type="text"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                placeholder="https://yourwebsite.com or /app?page=mybiz"
                className="w-full px-3.5 py-2.5 rounded-xl bg-theme-base border border-theme-divider text-xs text-theme-primary focus:border-[#5E43F3] outline-hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: TARGETING */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-theme-primary">Audience & Geographic Targeting</h2>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'local_radius', label: 'Local Radius', desc: 'Warri & surroundings' },
              { id: 'city_state', label: 'City / State', desc: 'Delta State or Lagos' },
              { id: 'broad_nation', label: 'Nationwide', desc: 'All across Nigeria' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTargetType(t.id as any)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  targetType === t.id
                    ? 'border-[#5E43F3] bg-[#5E43F3]/5 font-bold'
                    : 'border-theme-divider hover:bg-theme-surface-hover'
                }`}
              >
                <p className="text-xs text-theme-primary">{t.label}</p>
                <p className="text-[10px] text-theme-tertiary mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold text-theme-primary">Target City / Hub Location</label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-theme-base border border-theme-divider">
              <MapPin className="w-4 h-4 text-[#5E43F3] shrink-0" />
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full bg-transparent text-xs text-theme-primary outline-hidden"
              />
            </div>
          </div>

          {targetType === 'local_radius' && (
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-theme-primary">
                <span>Discovery Radius</span>
                <span className="text-[#5E43F3]">{radiusKm} km</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full accent-[#5E43F3] cursor-pointer"
              />
              <p className="text-[11px] text-theme-tertiary">
                Your ad will be delivered to users browsing within {radiusKm} km of {locationName}.
              </p>
            </div>
          )}
        </div>
      )}

      {/* STEP 4: BUDGET, SCHEDULE & SUMMARY */}
      {step === 4 && (
        <div className="space-y-5">
          <h2 className="text-base font-bold text-theme-primary">Budget & Duration</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-theme-primary">Total Budget (NGN ₦)</label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-theme-base border border-theme-divider">
                <span className="font-bold text-sm text-theme-primary">₦</span>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={budgetNgn}
                  onChange={(e) => setBudgetNgn(Number(e.target.value))}
                  className="w-full bg-transparent text-sm font-bold text-theme-primary outline-hidden"
                />
              </div>
              <p className="text-[11px] text-theme-tertiary">Minimum budget: ₦1,000</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-theme-primary">Duration (Days)</label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-theme-base border border-theme-divider">
                <Calendar className="w-4 h-4 text-theme-tertiary shrink-0" />
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full bg-transparent text-sm font-bold text-theme-primary outline-hidden"
                />
              </div>
              <p className="text-[11px] text-theme-tertiary">Campaign runs for {durationDays} days from approval</p>
            </div>
          </div>

          {/* Pricing Model & Projected Delivery Breakdown */}
          <div className="p-4 rounded-xl bg-theme-base border border-theme-divider space-y-2 text-xs">
            <div className="flex items-center justify-between text-theme-tertiary">
              <span>Estimated Impressions:</span>
              <strong className="text-theme-primary">~{Math.round((budgetNgn / 2)).toLocaleString()}</strong>
            </div>
            <div className="flex items-center justify-between text-theme-tertiary">
              <span>Estimated Clicks:</span>
              <strong className="text-theme-primary">~{Math.round((budgetNgn / 10)).toLocaleString()}</strong>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-theme-divider font-bold text-sm text-theme-primary">
              <span>Total Payable to Paystack:</span>
              <span className="text-[#5E43F3]">₦{budgetNgn.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#5E43F3]/10 border border-[#5E43F3]/20 text-[#5E43F3] text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>
              Secure Paystack integration. Your campaign will undergo automated screening and admin review before going live.
            </span>
          </div>
        </div>
      )}

      {/* Buttons Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-theme-divider">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => (s - 1) as any)}
            className="px-4 py-2 rounded-xl bg-theme-surface-hover hover:bg-theme-surface-active text-xs font-bold text-theme-secondary transition-colors cursor-pointer"
          >
            Previous
          </button>
        ) : (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-bold text-theme-tertiary hover:text-theme-primary transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}

        {step < 4 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="px-6 py-2.5 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-xs font-bold text-white transition-all shadow-md shadow-[#5E43F3]/20 cursor-pointer"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinalSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Creating Campaign...' : 'Submit & Proceed to Checkout'}
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Campaign Details & Paystack Checkout Action View
 */
const CampaignDetailsView: React.FC<{ campaignId: Id<"adCampaigns">; onBack: () => void }> = ({
  campaignId,
  onBack,
}) => {
  const campaign = useQuery(api.ads.getCampaignById, { campaignId });
  const initializePayment = useAction(api.adActions.initializeCampaignPayment);
  const verifyPayment = useAction(api.adActions.verifyCampaignPayment);

  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  if (!campaign) {
    return (
      <div className="p-8 text-center text-xs text-theme-tertiary">
        Loading campaign details...
      </div>
    );
  }

  const handlePaystackCheckout = async () => {
    setIsPaying(true);
    setPayError(null);
    try {
      const res = await initializePayment({ campaignId });
      if (res.authorizationUrl) {
        window.location.href = res.authorizationUrl;
      } else if (res.isDevFallback && res.reference) {
        // Dev fallback verification
        await verifyPayment({ reference: res.reference });
        alert('Dev payment verified successfully! Campaign moved to pending review / active.');
      }
    } catch (err: any) {
      setPayError(err.message || 'Payment initialization failed');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-theme-surface rounded-2xl border border-theme-divider p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-theme-divider">
          <div>
            <h2 className="text-lg font-bold text-theme-primary">{campaign.name}</h2>
            <p className="text-xs text-theme-tertiary">
              Created {new Date(campaign.createdAt).toLocaleDateString()} · Objective: {campaign.objective}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-theme-surface-hover text-theme-primary border border-theme-divider">
              Status: {campaign.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {payError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs">
            {payError}
          </div>
        )}

        {/* Payment Required Callout */}
        {campaign.status === 'pending_payment' && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400">
                Payment Required (₦{(campaign.budget.totalBudgetKobo / 100).toLocaleString()})
              </h4>
              <p className="text-[11px] text-amber-600 dark:text-amber-300">
                Fund your campaign budget securely with Paystack to submit it for administrative review and delivery.
              </p>
            </div>
            <button
              onClick={handlePaystackCheckout}
              disabled={isPaying}
              className="px-5 py-2.5 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white font-bold text-xs shadow-md shadow-[#5E43F3]/25 transition-all cursor-pointer shrink-0 disabled:opacity-50"
            >
              {isPaying ? 'Connecting to Paystack...' : 'Pay with Paystack'}
            </button>
          </div>
        )}

        {/* Creative Preview */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold text-theme-tertiary uppercase tracking-wider">
            Creative Preview
          </h3>
          <div className="p-4 rounded-xl bg-theme-base border border-theme-divider space-y-2">
            <h4 className="font-bold text-sm text-theme-primary">{campaign.creative.headline}</h4>
            {campaign.creative.description && (
              <p className="text-xs text-theme-secondary">{campaign.creative.description}</p>
            )}
            {campaign.creative.mediaUrl && (
              <img
                src={campaign.creative.mediaUrl}
                alt="Creative"
                className="w-full max-h-64 object-cover rounded-lg border border-theme-divider"
              />
            )}
            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="text-theme-tertiary">Destination: {campaign.creative.destinationUrl}</span>
              <span className="px-3 py-1 bg-[#5E43F3] text-white font-bold rounded-lg">
                {campaign.creative.ctaLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Real Persistence Analytics Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-theme-base border border-theme-divider text-center">
            <span className="text-[10px] text-theme-tertiary uppercase font-bold">Impressions</span>
            <p className="text-lg font-black text-theme-primary">{campaign.impressionsCount || 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-theme-base border border-theme-divider text-center">
            <span className="text-[10px] text-theme-tertiary uppercase font-bold">Clicks</span>
            <p className="text-lg font-black text-[#5E43F3]">{campaign.clicksCount || 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-theme-base border border-theme-divider text-center">
            <span className="text-[10px] text-theme-tertiary uppercase font-bold">Spent</span>
            <p className="text-lg font-black text-theme-primary">
              ₦{((campaign.budget.spentKobo || 0) / 100).toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-theme-base border border-theme-divider text-center">
            <span className="text-[10px] text-theme-tertiary uppercase font-bold">Remaining</span>
            <p className="text-lg font-black text-emerald-600">
              ₦{(((campaign.budget.totalBudgetKobo - campaign.budget.spentKobo) || 0) / 100).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
