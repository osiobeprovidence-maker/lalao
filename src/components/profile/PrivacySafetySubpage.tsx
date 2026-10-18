import React, { useState } from 'react';
import { ArrowLeft, Shield, Eye, Flame, Lock } from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';

interface PrivacySafetySubpageProps {
  onBack: () => void;
}

export const PrivacySafetySubpage: React.FC<PrivacySafetySubpageProps> = ({ onBack }) => {
  const { locationPrivacy, setLocationPrivacy } = useLalao();

  const [publicVisibility, setPublicVisibility] = useState(true);
  const [showActiveStatus, setShowActiveStatus] = useState(true);

  return (
    <div className="flex flex-col h-full bg-theme-surface animate-in fade-in duration-200">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-theme-surface/95 backdrop-blur-md border-b border-theme-divider-light px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-privacy-safety"
            type="button"
            onClick={onBack}
            className="p-1.5 -ml-1 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
            title="Back to Settings Hub"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-base text-theme-primary">Privacy & Community Safety</h1>
            <p className="text-[11px] text-theme-tertiary">Visibility and safety controls</p>
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
        {/* Profile Visibility Controls */}
        <div className="space-y-3">
          <div className="border-b border-theme-divider-light pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
              Profile & Activity Visibility
            </h3>
            <p className="text-[11px] text-theme-tertiary mt-0.5">
              Control what members in your community can discover
            </p>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-theme-divider-light rounded-2xl overflow-hidden bg-theme-surface shadow-2xs">
            {/* Public Community Profile */}
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-theme-surface-active text-theme-secondary flex items-center justify-center shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-theme-primary block">
                    Public Community Profile
                  </span>
                  <p className="text-[11px] text-theme-tertiary mt-0.5 leading-snug">
                    Allow local members to view your posts, media, and public profile
                  </p>
                </div>
              </div>

              <button
                id="toggle-public-visibility"
                type="button"
                onClick={() => setPublicVisibility(!publicVisibility)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  publicVisibility ? 'bg-[#5E43F3]' : 'bg-theme-divider-strong'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 shadow-xs ${
                    publicVisibility ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Active Story Indicator */}
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-theme-surface-active text-theme-secondary flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-theme-primary block">
                    Active Story Indicator
                  </span>
                  <p className="text-[11px] text-theme-tertiary mt-0.5 leading-snug">
                    Show colorful ring around your avatar when your 24h cycle is active
                  </p>
                </div>
              </div>

              <button
                id="toggle-active-status"
                type="button"
                onClick={() => setShowActiveStatus(!showActiveStatus)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  showActiveStatus ? 'bg-[#5E43F3]' : 'bg-theme-divider-strong'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 shadow-xs ${
                    showActiveStatus ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Location Privacy */}
        {locationPrivacy && (
          <div className="space-y-3">
            <div className="border-b border-theme-divider-light pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
                Location Privacy
              </h3>
              <p className="text-[11px] text-theme-tertiary mt-0.5">
                Protect your physical location details across community discovery
              </p>
            </div>

            <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-theme-divider-light rounded-2xl overflow-hidden bg-theme-surface shadow-2xs">
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-theme-primary block">
                    Approximate Distance Only
                  </span>
                  <p className="text-[11px] text-theme-tertiary mt-0.5">
                    Blur exact distance (e.g. "~800m" or "Within 1km") to preserve personal safety
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setLocationPrivacy((prev) => ({
                      ...prev,
                      approximateDistance: !prev.approximateDistance,
                    }))
                  }
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    locationPrivacy.approximateDistance ? 'bg-[#5E43F3]' : 'bg-theme-divider-strong'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 shadow-xs ${
                      locationPrivacy.approximateDistance ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-theme-primary block">
                    Ghost Mode
                  </span>
                  <p className="text-[11px] text-theme-tertiary mt-0.5">
                    Hide presence from "People Near You" in explore and community discovery
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setLocationPrivacy((prev) => ({
                      ...prev,
                      ghostMode: !prev.ghostMode,
                    }))
                  }
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    locationPrivacy.ghostMode ? 'bg-[#5E43F3]' : 'bg-theme-divider-strong'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 shadow-xs ${
                      locationPrivacy.ghostMode ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
