import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Sparkles, AlertCircle } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Avatar } from '../common/Avatar';
import { VerificationBadge } from '../common/VerificationBadge';
import { PostImage } from '../common/PostImage';
import { VideoPlayer } from './VideoPlayer';

interface SponsoredPostCardProps {
  placement: {
    campaignId: any;
    format: 'sponsored_post' | 'promoted_post' | 'image_ad' | 'video_ad';
    headline: string;
    description?: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
    ctaLabel: string;
    destinationUrl: string;
    advertiser: {
      id?: string;
      name: string;
      username?: string;
      avatarUrl?: string;
      isVerified?: boolean;
    };
    originalPost?: any;
  };
  onSelectAdvertiser?: () => void;
}

export const SponsoredPostCard: React.FC<SponsoredPostCardProps> = ({
  placement,
  onSelectAdvertiser,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hasImpressed, setHasImpressed] = useState(false);
  const recordImpression = useMutation(api.ads.recordAdImpression);
  const recordClick = useMutation(api.ads.recordAdClick);

  // Generate or get persistent anonymous session ID for impression deduplication
  const getSessionId = () => {
    let sid = sessionStorage.getItem('lalao_ad_session_id');
    if (!sid) {
      sid = 'sid_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
      sessionStorage.setItem('lalao_ad_session_id', sid);
    }
    return sid;
  };

  // Viewability / IntersectionObserver for Impression Recording
  useEffect(() => {
    if (!placement || hasImpressed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            setHasImpressed(true);
            const sessionId = getSessionId();
            recordImpression({
              campaignId: placement.campaignId,
              sessionId,
            }).catch((err) => {
              console.warn('Impression logging failed:', err);
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [placement, hasImpressed]);

  // Click tracking and safe destination redirection
  const handleCtaClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const sessionId = getSessionId();
      const res = await recordClick({
        campaignId: placement.campaignId,
        sessionId,
      });

      const target = res?.destinationUrl || placement.destinationUrl;
      if (target.startsWith('/')) {
        window.location.href = target;
      } else {
        window.open(target, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Click tracking error:', err);
      // Fallback redirect
      if (placement.destinationUrl.startsWith('/')) {
        window.location.href = placement.destinationUrl;
      } else {
        window.open(placement.destinationUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  return (
    <div
      ref={cardRef}
      className="bg-theme-surface border border-theme-divider/70 rounded-2xl p-4 sm:p-5 shadow-xs transition-all hover:border-[#5E43F3]/30"
    >
      {/* Sponsored Header Label & Advertiser Info */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar
            src={placement.advertiser.avatarUrl}
            name={placement.advertiser.name}
            size="md"
            className="border border-theme-divider shrink-0 cursor-pointer"
            onClick={onSelectAdvertiser}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                onClick={onSelectAdvertiser}
                className="font-bold text-sm text-theme-primary truncate hover:underline cursor-pointer"
              >
                {placement.advertiser.name}
              </span>
              <VerificationBadge isVerified={true} tier="business" size="sm" />
            </div>
            {placement.advertiser.username && (
              <p className="text-xs text-theme-tertiary truncate">
                @{placement.advertiser.username}
              </p>
            )}
          </div>
        </div>

        {/* Distinct Sponsored Pill */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-bold shrink-0">
          <Sparkles className="w-3 h-3" />
          <span>Sponsored</span>
        </div>
      </div>

      {/* Headline & Body Text */}
      <div className="space-y-1.5 mb-3">
        <h4 className="text-base font-bold text-theme-primary leading-snug">
          {placement.headline}
        </h4>
        {placement.description && (
          <p className="text-sm text-theme-secondary leading-relaxed whitespace-pre-wrap">
            {placement.description}
          </p>
        )}
      </div>

      {/* Media Creative Rendering */}
      {placement.mediaUrl && (
        <div className="mb-3.5 rounded-xl overflow-hidden bg-black/5 border border-theme-divider max-h-[480px]">
          {placement.mediaType === 'video' ? (
            <VideoPlayer
              videoUrl={placement.mediaUrl}
              className="w-full max-h-[480px] object-cover"
              controls
            />
          ) : (
            <img
              src={placement.mediaUrl}
              alt={placement.headline}
              className="w-full max-h-[480px] object-cover"
              loading="lazy"
            />
          )}
        </div>
      )}

      {/* Original post excerpt if Promoted Post */}
      {placement.format === 'promoted_post' && placement.originalPost && (
        <div className="mb-3 p-3 rounded-xl bg-theme-surface-hover/70 border border-theme-divider text-xs text-theme-secondary">
          <p className="line-clamp-2 italic">"{placement.originalPost.content}"</p>
        </div>
      )}

      {/* Call to Action Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-theme-divider/50">
        <div className="flex items-center gap-1.5 text-xs text-theme-tertiary truncate max-w-[200px] sm:max-w-xs">
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{placement.destinationUrl.replace(/^https?:\/\//, '')}</span>
        </div>

        <button
          onClick={handleCtaClick}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white text-xs font-bold transition-all shadow-sm shadow-[#5E43F3]/20 cursor-pointer active:scale-95"
        >
          <span>{placement.ctaLabel || 'Learn More'}</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
