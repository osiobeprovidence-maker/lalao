import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation, ArrowRight, Loader2, MapPin } from 'lucide-react';
import { OnboardingLayout } from './OnboardingLayout';

export const LocationSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);
  const [manualLocation, setManualLocation] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDetectGPS = () => {
    setIsDetecting(true);
    setError('');
    navigator.geolocation?.getCurrentPosition(
      () => {
        setIsDetecting(false);
        setDetectedLocation('Udu, Delta State (Detected)');
        setManualLocation(''); // Clear manual if GPS succeeds
      },
      () => {
        setIsDetecting(false);
        setError('Location permission denied or unavailable. Please enter it manually.');
      },
      { timeout: 8000 }
    );
  };

  const handleContinue = async () => {
    if (!detectedLocation && !manualLocation.trim()) {
      setError('Please provide your location to continue.');
      return;
    }
    setError('');
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsLoading(false);
    navigate('/onboarding/interests');
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
          <p className="text-sm text-neutral-600 leading-relaxed">
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
              ? 'border-[#3823A4] bg-[#F8F7FF] text-[#3823A4]'
              : 'border-neutral-200 bg-white hover:border-[#3823A4]/30 hover:bg-neutral-50 text-neutral-700'
          }`}
        >
          {isDetecting ? (
            <Loader2 className="w-5 h-5 animate-spin text-[#3823A4]" />
          ) : (
            <Navigation className={`w-5 h-5 ${detectedLocation ? 'text-[#3823A4]' : 'text-neutral-500'}`} />
          )}
          <span className="font-bold text-base">
            {isDetecting ? 'Detecting location...' : detectedLocation ? detectedLocation : 'Use my current location'}
          </span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 h-px bg-neutral-200" />
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-neutral-200" />
        </div>

        {/* Custom location */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-neutral-500 tracking-wider uppercase">Choose location manually</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              value={manualLocation}
              onChange={(e) => { 
                setManualLocation(e.target.value); 
                if (detectedLocation) setDetectedLocation(null); 
              }}
              placeholder="e.g. Asaba, Delta State"
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-neutral-200 bg-white text-base text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#3823A4] focus:ring-4 focus:ring-[#3823A4]/10 transition-all"
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
            className="w-full py-3.5 rounded-xl bg-transparent text-neutral-500 font-bold text-sm flex items-center justify-center hover:bg-neutral-50 hover:text-neutral-700 transition-colors cursor-pointer"
          >
            I'll do this later
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
};
