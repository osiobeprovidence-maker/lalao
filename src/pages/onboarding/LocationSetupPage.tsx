import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, ArrowRight, Loader2, Check } from 'lucide-react';
import { OnboardingLayout } from './OnboardingLayout';

const POPULAR_LOCATIONS = [
  { name: 'Udu', subArea: 'Delta State', emoji: '📍' },
  { name: 'Warri Central', subArea: 'Delta State', emoji: '🏙️' },
  { name: 'Effurun', subArea: 'Delta State', emoji: '🌆' },
  { name: 'DSC Township', subArea: 'Delta State', emoji: '🏘️' },
  { name: 'Udu Express Junction', subArea: 'Delta State', emoji: '🚦' },
  { name: 'Lekki Phase 1', subArea: 'Lagos State', emoji: '🌊' },
  { name: 'Ikeja GRA', subArea: 'Lagos State', emoji: '✈️' },
  { name: 'Victoria Island', subArea: 'Lagos State', emoji: '🏖️' },
  { name: 'Wuse II', subArea: 'Abuja FCT', emoji: '🏛️' },
  { name: 'Trans-Amadi', subArea: 'Port Harcourt', emoji: '⚓' },
];

const RADIUS_OPTIONS = [
  { km: 1, label: '1 km', desc: 'Walking distance' },
  { km: 3, label: '3 km', desc: 'Local neighborhood' },
  { km: 5, label: '5 km', desc: 'District (Recommended)' },
  { km: 10, label: '10 km', desc: 'Cross-town' },
  { km: 25, label: '25 km', desc: 'Metro wide' },
];

export const LocationSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [customLocation, setCustomLocation] = useState('');
  const [radius, setRadius] = useState(5);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedName, setDetectedName] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleDetectGPS = () => {
    setIsDetecting(true);
    setError('');
    navigator.geolocation?.getCurrentPosition(
      () => {
        setIsDetecting(false);
        setDetectedName('Detected: Near Udu, Delta State');
        setSelected('__gps__');
      },
      () => {
        setIsDetecting(false);
        setError('Could not detect location. Please select manually.');
      },
      { timeout: 8000 }
    );
  };

  const activeLocation = detectedName && selected === '__gps__'
    ? detectedName
    : selected && selected !== '__gps__'
    ? selected
    : customLocation || null;

  const handleContinue = () => {
    if (!activeLocation) { setError('Please choose or enter your neighborhood.'); return; }
    navigate('/onboarding/interests');
  };

  return (
    <OnboardingLayout step={3} totalSteps={5} title="Where are you?" subtitle="Set your neighborhood so we can show you what's nearby." backTo="/onboarding/profile">
      <div className="space-y-5">
        {/* GPS Detect */}
        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={isDetecting}
          className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all cursor-pointer ${
            selected === '__gps__'
              ? 'border-[#5E43F3] bg-indigo-50/60'
              : 'border-neutral-200 bg-white hover:border-[#5E43F3]/50 hover:bg-indigo-50/20'
          }`}
        >
          {isDetecting ? (
            <div className="w-10 h-10 rounded-xl bg-[#5E43F3]/10 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-[#5E43F3] animate-spin" />
            </div>
          ) : (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected === '__gps__' ? 'bg-[#5E43F3]' : 'bg-neutral-100'}`}>
              <Navigation className={`w-5 h-5 ${selected === '__gps__' ? 'text-white' : 'text-neutral-600'}`} />
            </div>
          )}
          <div className="flex-1 text-left">
            <p className="font-bold text-sm text-neutral-900">
              {isDetecting ? 'Detecting your location...' : selected === '__gps__' ? detectedName : 'Use my current location'}
            </p>
            {!isDetecting && selected !== '__gps__' && (
              <p className="text-xs text-neutral-500">Uses GPS for accurate neighborhood</p>
            )}
          </div>
          {selected === '__gps__' && (
            <div className="w-5 h-5 rounded-full bg-[#5E43F3] flex items-center justify-center">
              <Check className="w-3 h-3 text-white stroke-[3]" />
            </div>
          )}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-neutral-100" />
          <span className="text-xs text-neutral-400 font-semibold">or pick manually</span>
          <div className="flex-1 h-px bg-neutral-100" />
        </div>

        {/* Popular locations grid */}
        <div className="grid grid-cols-2 gap-2">
          {POPULAR_LOCATIONS.map(({ name, subArea, emoji }) => {
            const isActive = selected === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => { setSelected(name); setDetectedName(null); }}
                className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  isActive ? 'border-[#5E43F3] bg-indigo-50/60' : 'border-neutral-150 bg-neutral-50 hover:border-neutral-250'
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <span className="text-base">{emoji}</span>
                    <p className={`text-xs font-bold mt-1 ${isActive ? 'text-[#5E43F3]' : 'text-neutral-900'}`}>{name}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{subArea}</p>
                  </div>
                  {isActive && (
                    <div className="w-4 h-4 rounded-full bg-[#5E43F3] flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom location */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-neutral-700 tracking-wide uppercase">Or type your area</label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={customLocation}
              onChange={(e) => { setCustomLocation(e.target.value); setSelected('__custom__'); }}
              placeholder="E.g., Asaba, Sapele, Ughelli..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5E43F3]/30 focus:border-[#5E43F3] transition-all"
            />
          </div>
        </div>

        {/* Radius picker */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-neutral-700 tracking-wide uppercase">Discovery Radius</label>
          <div className="flex gap-2 flex-wrap">
            {RADIUS_OPTIONS.map(({ km, label, desc }) => (
              <button
                key={km}
                type="button"
                onClick={() => setRadius(km)}
                title={desc}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all cursor-pointer ${
                  radius === km ? 'border-[#5E43F3] bg-[#5E43F3] text-white' : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-[#5E43F3]/40'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-neutral-400">
            {RADIUS_OPTIONS.find(r => r.km === radius)?.desc} — you'll see posts & events within {radius} km
          </p>
        </div>

        {error && (
          <p className="text-sm font-semibold text-red-600">{error}</p>
        )}

        <button
          id="btn-onboard-location-continue"
          type="button"
          onClick={handleContinue}
          className="w-full py-4 rounded-2xl bg-[#5E43F3] hover:bg-[#4E34E0] text-white font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-[#5E43F3]/25 cursor-pointer"
        >
          <span>Continue</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </OnboardingLayout>
  );
};
