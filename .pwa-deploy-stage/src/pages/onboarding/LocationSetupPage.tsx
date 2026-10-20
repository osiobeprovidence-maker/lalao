import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, MapPin } from 'lucide-react';
import { OnboardingLayout } from './OnboardingLayout';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export const LocationSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const updateLocation = useMutation(api.users.updateLocation);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);
  const [latLng, setLatLng] = useState<{ latitude: number; longitude: number } | null>(null);
  const [manualLocation, setManualLocation] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDetectGPS = () => {
    setIsDetecting(true);
    setError('');
    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Real reverse geocode via OpenStreetMap Nominatim (free, no key needed)
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=12&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const addr = data.address || {};
          // Build a meaningful location string: neighbourhood / city + state
          const parts: string[] = [];
          const area =
            addr.neighbourhood ||
            addr.suburb ||
            addr.village ||
            addr.town ||
            addr.county ||
            addr.city_district ||
            '';
          const city = addr.city || addr.town || addr.municipality || addr.county || '';
          const state = addr.state || addr.region || '';
          if (area) parts.push(area);
          else if (city) parts.push(city);
          if (state && state !== area && state !== city) parts.push(state);
          const locName = parts.length ? parts.join(', ') : `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
          setDetectedLocation(locName);
          setLatLng({ latitude, longitude });
        } catch {
          // Fallback: raw coordinates
          const locName = `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
          setDetectedLocation(locName);
          setLatLng({ latitude, longitude });
        }
        setIsDetecting(false);
        setManualLocation('');
      },
      () => {
        setIsDetecting(false);
        setError('Location permission denied or unavailable. Please enter it manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleContinue = async () => {
    if (!detectedLocation && !manualLocation.trim()) {
      setError('Please provide your location to continue.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const locName = (detectedLocation || manualLocation.trim()).replace(/\s*\(Detected\)\s*/i, '').trim();
      await updateLocation({
        locationName: locName,
        ...(latLng ?? {}),
      });
      navigate('/onboarding/interests');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update location.');
    } finally {
      setIsLoading(false);
    }
  };


  const handleSkip = () => {
    // According to instructions: "Allow the user to manually select their location or continue and set it later"
    navigate('/onboarding/interests');
  };

  return (
    <OnboardingLayout 
      step={4} 
      totalSteps={6} 
      title="Where are you?" 
      subtitle="Use your location to discover people, events, businesses and activities around you." 
      backTo="/onboarding/pronouns"
    >
      <div className="space-y-6">
        
        {/* Why we need location */}
        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
          <p className="text-sm text-theme-secondary leading-relaxed">
            Lalao is built around local communities. Providing your location ensures you see relevant updates, events, and people right in your neighborhood.
          </p>
        </div>

        {/* GPS Detect */}
        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={isDetecting}
          className={`w-full p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all cursor-pointer ${
            detectedLocation
              ? 'border-[#3823A4] bg-theme-base text-[#3823A4]'
              : 'border-theme-divider bg-theme-surface hover:border-[#3823A4]/30 hover:bg-theme-base text-theme-secondary'
          }`}
        >
          {isDetecting ? (
            <Loader2 className="w-5 h-5 animate-spin text-[#3823A4]" />
          ) : (
            <MapPin className={`w-5 h-5 ${detectedLocation ? 'text-[#3823A4]' : 'text-theme-tertiary'}`} />
          )}
          <span className="font-bold text-base">
            {isDetecting ? 'Detecting location...' : detectedLocation ? detectedLocation : 'Use my current location'}
          </span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 h-px bg-theme-surface-active" />
          <span className="text-xs font-bold text-theme-tertiary uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-theme-surface-active" />
        </div>

        {/* Custom location */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-theme-tertiary tracking-wider uppercase">Choose location manually</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-tertiary" />
            <input
              type="text"
              value={manualLocation}
              onChange={(e) => { 
                setManualLocation(e.target.value); 
                if (detectedLocation) setDetectedLocation(null); 
              }}
              placeholder="e.g. Asaba, Delta State"
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-theme-divider bg-theme-surface text-base text-theme-primary placeholder-neutral-400 focus:outline-none focus:border-[#3823A4] focus:ring-4 focus:ring-[#3823A4]/10 transition-all"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm font-semibold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>
        )}

        <div className="space-y-3 pt-4">
          <button
            type="button"
            onClick={handleContinue}
            disabled={isLoading}
            className="w-full py-4 rounded-xl bg-[#3823A4] text-white font-black text-base flex items-center justify-center gap-3 transition-transform active:scale-[0.98] shadow-lg shadow-[#3823A4]/25 hover:bg-[#25167A] cursor-pointer disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={handleSkip}
            className="w-full py-3.5 rounded-xl bg-transparent text-theme-tertiary font-bold text-sm flex items-center justify-center hover:bg-theme-base hover:text-theme-secondary transition-colors cursor-pointer"
          >
            I'll do this later
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
};
