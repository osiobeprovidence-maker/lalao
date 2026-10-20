import React from 'react';
import { ArrowLeft, MapPin, Navigation } from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';

interface CommunityRadiusSubpageProps {
  onBack: () => void;
}

const RADIUS_OPTIONS = [2, 5, 10, 25, 50];

export const CommunityRadiusSubpage: React.FC<CommunityRadiusSubpageProps> = ({
  onBack,
}) => {
  const { radiusKm, setRadiusKm, location } = useLalao();

  return (
    <div className="flex flex-col h-full bg-theme-surface animate-in fade-in duration-200">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-theme-surface/95 backdrop-blur-md border-b border-theme-divider-light px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-community-radius"
            type="button"
            onClick={onBack}
            className="p-1.5 -ml-1 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
            title="Back to Settings Hub"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-base text-theme-primary">Community Radius & Discovery</h1>
            <p className="text-[11px] text-theme-tertiary">Hyperlocal distance filter</p>
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
        {/* Active Radius Card */}
        <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider-light space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center shrink-0">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-theme-primary block">
                  Discovery Range
                </span>
                <p className="text-[11px] text-theme-tertiary">
                  Filter posts, stories, and rallies within distance of your current location
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] text-xs font-extrabold shrink-0 border border-[#5E43F3]/20">
              {radiusKm} km active
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2 pt-2">
            {RADIUS_OPTIONS.map((km) => {
              const isSelected = radiusKm === km;
              return (
                <button
                  key={km}
                  id={`btn-radius-${km}km`}
                  type="button"
                  onClick={() => setRadiusKm(km)}
                  className={`py-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 select-none ${
                    isSelected
                      ? 'bg-[#5E43F3] text-white shadow-md shadow-[#5E43F3]/25 scale-[1.02]'
                      : 'bg-theme-base text-theme-secondary border border-theme-divider hover:bg-theme-surface-hover hover:border-theme-divider-strong'
                  }`}
                >
                  <span className="text-sm font-extrabold">{km}</span>
                  <span className="text-[10px] opacity-80">km</span>
                </button>
              );
            })}
          </div>

          {location?.name && (
            <div className="pt-2 border-t border-theme-divider-light flex items-center gap-2 text-[11px] text-theme-tertiary">
              <MapPin className="w-3.5 h-3.5 text-[#5E43F3] shrink-0" />
              <span>
                Currently centered near <strong className="text-theme-primary">{location.name}</strong> ({location.subArea || 'Delta State'})
              </span>
            </div>
          )}
        </div>

        {/* Informational Guidance */}
        <div className="p-4 rounded-2xl bg-theme-base border border-theme-divider-light space-y-2">
          <h4 className="text-xs font-bold text-theme-primary">How Discovery Radius Works</h4>
          <p className="text-[11px] text-theme-tertiary leading-relaxed">
            Lalao is built around your physical community. Setting a smaller radius (e.g. 2–5 km) surfaces intimate neighborhood updates, while a larger radius (25–50 km) connects you with major happenings across Warri, Effurun, and neighboring Delta State communities.
          </p>
        </div>
      </div>
    </div>
  );
};
