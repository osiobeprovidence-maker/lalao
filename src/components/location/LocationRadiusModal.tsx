import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  MapPin,
  Check,
  ShieldCheck,
  Navigation,
  Compass,
  Sliders,
  Eye,
  EyeOff,
  Radio,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { LocationConfig } from '../../types';
import { KNOWN_LOCATION_HUBS, getCoordinatesForLocation } from '../../utils/locationUtils';

type ModalTab = 'location' | 'privacy';

const POPULAR_LOCATIONS: LocationConfig[] = [
  { name: 'Udu', subArea: 'Delta State', radiusKm: 5, latitude: 5.5039, longitude: 5.8276, isGpsDetected: false },
  { name: 'Warri Central', subArea: 'Delta State', radiusKm: 5, latitude: 5.5175, longitude: 5.7501, isGpsDetected: false },
  { name: 'Effurun', subArea: 'Delta State', radiusKm: 5, latitude: 5.5567, longitude: 5.7828, isGpsDetected: false },
  { name: 'Udu Express Junction', subArea: 'Delta State', radiusKm: 5, latitude: 5.5085, longitude: 5.8312, isGpsDetected: false },
  { name: 'Lekki Phase 1', subArea: 'Lagos State', radiusKm: 5, latitude: 6.4474, longitude: 3.4735, isGpsDetected: false },
  { name: 'Ikeja GRA', subArea: 'Lagos State', radiusKm: 5, latitude: 6.5927, longitude: 3.3551, isGpsDetected: false },
  { name: 'Wuse II', subArea: 'Abuja FCT', radiusKm: 5, latitude: 9.0765, longitude: 7.4721, isGpsDetected: false },
  { name: 'Trans-Amadi', subArea: 'Port Harcourt', radiusKm: 5, latitude: 4.8156, longitude: 7.0498, isGpsDetected: false },
];

export const LocationRadiusModal: React.FC = () => {
  const {
    location,
    setLocation,
    locationPrivacy,
    setLocationPrivacy,
    isLocationModalOpen,
    setIsLocationModalOpen,
    triggerShareToast,
    detectGpsLocation,
    isDetectingGps,
    permissions,
    setActivePermissionPrompt,
    setIsPermissionsModalOpen,
    posts,
    rallies,
    cycles,
  } = useLalao();

  const [activeTab, setActiveTab] = useState<ModalTab>('location');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLocationModalOpen) {
      containerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [isLocationModalOpen, activeTab]);
  const [selectedName, setSelectedName] = useState(location.name);
  const [selectedSub, setSelectedSub] = useState(location.subArea);
  const [radius, setRadius] = useState(location.radiusKm);
  const [customInput, setCustomInput] = useState('');
  const [regionFilter, setRegionFilter] = useState<'all' | 'Delta' | 'Lagos' | 'Abuja' | 'Rivers'>('Delta');
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Local state for privacy options
  const [privacySettings, setPrivacySettings] = useState(locationPrivacy);

  // Real-time count of items within the currently selected radius
  const currentCoords = useMemo(() => {
    return getCoordinatesForLocation(customInput.trim() || selectedName);
  }, [customInput, selectedName]);

  const reachableItems = useMemo(() => {
    const maxMeters = radius * 1000;
    const postsCount = posts.filter((p) => (p.distanceMeters ?? 0) <= maxMeters).length;
    const ralliesCount = rallies.filter((r) => (r.distanceMeters ?? 0) <= maxMeters).length;
    const cyclesCount = cycles.filter((c) => (c.distanceMeters ?? 0) <= maxMeters).length;
    return { postsCount, ralliesCount, cyclesCount, total: postsCount + ralliesCount + cyclesCount };
  }, [posts, rallies, cycles, radius]);

  if (!isLocationModalOpen) return null;

  const handleApply = () => {
    const finalName = customInput.trim() || selectedName;
    const coords = getCoordinatesForLocation(finalName);

    const finalLoc: LocationConfig = {
      name: finalName,
      subArea: selectedSub,
      radiusKm: radius,
      latitude: coords.lat,
      longitude: coords.lng,
      isGpsDetected: location.isGpsDetected && finalName === location.name,
    };

    setLocation(finalLoc);
    setLocationPrivacy(privacySettings);
    setIsLocationModalOpen(false);
    triggerShareToast(`Discovery area set to ${finalLoc.name} · ${finalLoc.radiusKm} km`);
  };

  const handleGpsDetect = async () => {
    setGpsError(null);
    if (permissions.location !== 'granted') {
      setActivePermissionPrompt('location');
      return;
    }
    const res = await detectGpsLocation();
    if (!res.success && res.error) {
      setGpsError(res.error);
    } else {
      setSelectedName(location.name);
      setSelectedSub(location.subArea);
      setCustomInput('');
    }
  };

  const radiusPresets = [
    { km: 1, label: '1 km', desc: 'Walking / Hyperlocal' },
    { km: 3, label: '3 km', desc: 'Neighborhood' },
    { km: 5, label: '5 km', desc: 'District (Default)' },
    { km: 10, label: '10 km', desc: 'Twin Cities' },
    { km: 25, label: '25 km', desc: 'Metropolitan Area' },
    { km: 50, label: '50 km', desc: 'Regional' },
  ];

  const getRadiusDesc = (km: number) => {
    if (km <= 1) return 'Immediate walking distance (stores, neighbors, pitch)';
    if (km <= 3) return 'Immediate local community and nearby avenues';
    if (km <= 5) return 'District coverage across Udu and borders';
    if (km <= 10) return 'Cross-city reach (e.g. Udu + Warri Central & Effurun)';
    if (km <= 25) return 'Greater metropolitan zone and neighboring districts';
    return 'Regional scope across the state';
  };

  // Filtered popular locations by region
  const filteredLocations = POPULAR_LOCATIONS.filter((loc) => {
    if (regionFilter === 'all') return true;
    if (regionFilter === 'Delta') return loc.subArea.includes('Delta');
    if (regionFilter === 'Lagos') return loc.subArea.includes('Lagos');
    if (regionFilter === 'Abuja') return loc.subArea.includes('Abuja');
    if (regionFilter === 'Rivers') return loc.subArea.includes('Port') || loc.subArea.includes('Rivers');
    return true;
  });

  return (
    <div
      id="location-radius-screen"
      className="absolute inset-0 z-40 bg-white flex flex-col min-h-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-250"
    >
      <div className="w-full flex-1 flex flex-col bg-white overflow-hidden max-w-xl mx-auto">
        {/* Header with Close & Tab Toggle */}
        <div className="p-4 border-b border-neutral-100 bg-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(false)}
                className="p-1.5 -ml-1 rounded-full text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer"
                title="Back"
              >
                <X className="w-5 h-5 stroke-[2.2]" />
              </button>
              <div className="w-9 h-9 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-neutral-950">Location & Discovery</h3>
                <p className="text-[11px] text-neutral-500">
                  {location.name} · {location.radiusKm} km active radius
                </p>
              </div>
            </div>
          </div>

          {/* Subtabs: Location & Radius vs Privacy Controls */}
          <div className="mt-3 flex items-center bg-neutral-100 p-1 rounded-xl text-xs font-bold">
            <button
              id="tab-modal-location-radius"
              onClick={() => setActiveTab('location')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'location'
                  ? 'bg-white text-neutral-950 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Navigation className="w-3.5 h-3.5 text-[#5E43F3]" />
              <span>Location & Radius</span>
            </button>
            <button
              id="tab-modal-location-privacy"
              onClick={() => setActiveTab('privacy')}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'privacy'
                  ? 'bg-white text-neutral-950 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Privacy Controls</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-5 min-h-0 bg-white">
          {activeTab === 'location' ? (
            <>
              {/* GPS Auto-Detect Button */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-[#5E43F3]" />
                    <span className="text-xs font-bold text-neutral-900">
                      Device GPS & Location
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {permissions.location === 'granted' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {permissions.preciseLocation ? 'Precise GPS' : 'Approximate'}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActivePermissionPrompt('location')}
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200"
                      >
                        Approval Required
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-neutral-600 leading-relaxed">
                  Use your device&apos;s GPS to center your discovery feed accurately. Distances to posts and rallies will update dynamically.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    id="btn-detect-gps"
                    type="button"
                    onClick={handleGpsDetect}
                    disabled={isDetectingGps}
                    className="py-2 px-3 rounded-xl bg-white border border-indigo-200 hover:border-[#5E43F3] text-xs font-bold text-[#5E43F3] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs hover:bg-indigo-50/40"
                  >
                    <Navigation className={`w-3.5 h-3.5 ${isDetectingGps ? 'animate-spin' : ''}`} />
                    <span>{isDetectingGps ? 'Detecting coordinates...' : 'Use My Current Location'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPermissionsModalOpen(true)}
                    className="py-2 px-3 rounded-xl bg-indigo-100/60 hover:bg-indigo-100 border border-indigo-200/50 text-xs font-semibold text-neutral-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#5E43F3]" />
                    <span>All Permissions</span>
                  </button>
                </div>

                {gpsError && (
                  <div className="flex items-start gap-1.5 text-[11px] text-rose-600 bg-rose-50 p-2 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{gpsError}</span>
                  </div>
                )}
              </div>

              {/* Discovery Radius Controller */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-[#5E43F3]" />
                    <span className="text-xs font-bold text-neutral-900">Discovery Radius</span>
                  </div>
                  <span className="text-sm font-black text-[#5E43F3] font-mono bg-white px-2.5 py-0.5 rounded-full border border-indigo-100 shadow-2xs">
                    {radius} km
                  </span>
                </div>

                {/* Slider */}
                <input
                  id="slider-discovery-radius"
                  type="range"
                  min={1}
                  max={50}
                  step={1}
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-[#5E43F3]"
                />

                {/* Scope Description */}
                <p className="text-xs font-semibold text-neutral-700">
                  {getRadiusDesc(radius)}
                </p>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {radiusPresets.map((p) => (
                    <button
                      key={p.km}
                      type="button"
                      onClick={() => setRadius(p.km)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        radius === p.km
                          ? 'bg-[#5E43F3] text-white font-bold shadow-xs'
                          : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Real-time Content Count Preview */}
                <div className="pt-2 border-t border-neutral-200/60 flex items-center justify-between text-xs text-neutral-600">
                  <span className="flex items-center gap-1">
                    <Radio className="w-3.5 h-3.5 text-[#5E43F3] animate-pulse" />
                    <span>In radius right now:</span>
                  </span>
                  <span className="font-bold text-neutral-900">
                    {reachableItems.postsCount} posts · {reachableItems.ralliesCount} rallies · {reachableItems.cyclesCount} cycles
                  </span>
                </div>
              </div>

              {/* Concentric Radar Map Visualizer */}
              <div className="p-3.5 rounded-2xl bg-neutral-900 text-white space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-200">
                    <Radio className="w-4 h-4 text-[#5E43F3]" />
                    <span>Proximity Radar Preview</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    Center: {customInput.trim() || selectedName}
                  </span>
                </div>

                {/* Radar SVG */}
                <div className="relative h-44 w-full bg-neutral-950/80 rounded-xl overflow-hidden border border-neutral-800 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="-120 -90 240 180">
                    {/* Concentric Radius Rings */}
                    <circle cx="0" cy="0" r="25" fill="none" stroke="#333" strokeWidth="1" strokeDasharray="3 3" />
                    <circle cx="0" cy="0" r="50" fill="none" stroke="#333" strokeWidth="1" strokeDasharray="3 3" />
                    <circle cx="0" cy="0" r="75" fill="none" stroke="#333" strokeWidth="1" strokeDasharray="3 3" />

                    {/* Active Selected Radius Fill Circle */}
                    <circle
                      cx="0"
                      cy="0"
                      r={Math.min(85, Math.max(15, (radius / 50) * 80))}
                      fill="#5E43F3"
                      fillOpacity="0.15"
                      stroke="#5E43F3"
                      strokeWidth="1.5"
                    />

                    {/* Animated Pulsing Wave */}
                    <circle cx="0" cy="0" r="18" fill="none" stroke="#5E43F3" strokeWidth="1.5" className="animate-ping opacity-75 origin-center" />

                    {/* User Center Pin */}
                    <circle cx="0" cy="0" r="5" fill="#5E43F3" stroke="#fff" strokeWidth="2" />

                    {/* Nearby Item Dots on the Radar */}
                    {posts.slice(0, 6).map((p, idx) => {
                      // Map distance to radar radius
                      const distRatio = Math.min(1.2, p.distanceMeters / (radius * 1000));
                      const angle = (idx * 55 + 20) * (Math.PI / 180);
                      const visualDist = Math.min(80, (p.distanceMeters / (50 * 1000)) * 80 + 15);
                      const cx = Math.cos(angle) * visualDist;
                      const cy = Math.sin(angle) * visualDist;
                      const isInside = (p.distanceMeters ?? 0) <= radius * 1000;

                      return (
                        <g key={p.id}>
                          <circle
                            cx={cx}
                            cy={cy}
                            r={isInside ? 4 : 2.5}
                            fill={isInside ? '#A78BFA' : '#555'}
                            stroke={isInside ? '#fff' : 'none'}
                            strokeWidth="1"
                          />
                        </g>
                      );
                    })}

                    {/* Rally Pins on Radar */}
                    {rallies.slice(0, 3).map((r, idx) => {
                      const angle = (idx * 95 + 140) * (Math.PI / 180);
                      const visualDist = Math.min(80, (r.distanceMeters / (50 * 1000)) * 80 + 18);
                      const cx = Math.cos(angle) * visualDist;
                      const cy = Math.sin(angle) * visualDist;
                      const isInside = (r.distanceMeters ?? 0) <= radius * 1000;

                      return (
                        <circle
                          key={r.id}
                          cx={cx}
                          cy={cy}
                          r={isInside ? 4.5 : 2.5}
                          fill={isInside ? '#F59E0B' : '#666'}
                          stroke={isInside ? '#fff' : 'none'}
                          strokeWidth="1"
                        />
                      );
                    })}
                  </svg>

                  {/* Legend Overlay */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-neutral-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#A78BFA]" />
                      <span>Posts</span>
                      <span className="w-2 h-2 rounded-full bg-amber-400 ml-1.5" />
                      <span>Rallies</span>
                    </span>
                    <span>Range: {radius} km ring</span>
                  </div>
                </div>
              </div>

              {/* Neighborhood / Area Switcher */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-900">
                    Switch Neighborhood or Town
                  </label>
                  {/* Region Filter Chips */}
                  <div className="flex items-center gap-1 text-[11px]">
                    {(['Delta', 'Lagos', 'Abuja', 'all'] as const).map((reg) => (
                      <button
                        key={reg}
                        type="button"
                        onClick={() => setRegionFilter(reg)}
                        className={`px-2 py-0.5 rounded-md cursor-pointer ${
                          regionFilter === reg
                            ? 'bg-neutral-900 text-white font-bold'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                      >
                        {reg === 'all' ? 'All' : reg}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Popular Hubs Grid */}
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {filteredLocations.map((loc, idx) => {
                    const isSelected = selectedName === loc.name && !customInput;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedName(loc.name);
                          setSelectedSub(loc.subArea);
                          setCustomInput('');
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'border-[#5E43F3] bg-indigo-50/70 ring-1 ring-[#5E43F3]'
                            : 'border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-neutral-900 truncate">{loc.name}</p>
                          <p className="text-[10px] text-neutral-500 truncate">{loc.subArea}</p>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#5E43F3] shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Location Field */}
                <div>
                  <label className="text-[11px] font-semibold text-neutral-600 mb-1 block">
                    Or type custom neighborhood or landmark:
                  </label>
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="e.g. PTI Junction, Airport Road Warri, Asaba"
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-900 focus:border-[#5E43F3] focus:ring-1 focus:ring-[#5E43F3] outline-none"
                  />
                </div>
              </div>
            </>
          ) : (
            /* Privacy Controls Tab */
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-950">
                  <p className="font-bold">Privacy-First Proximity Protection</p>
                  <p className="mt-0.5 text-neutral-600 leading-relaxed">
                    Lalao is designed to foster real-world local community without compromising your physical safety.
                  </p>
                </div>
              </div>

              {/* Distance Obfuscation Toggle */}
              <div className="p-3.5 rounded-2xl border border-neutral-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {privacySettings.approximateDistance ? (
                      <EyeOff className="w-4 h-4 text-[#5E43F3]" />
                    ) : (
                      <Eye className="w-4 h-4 text-neutral-500" />
                    )}
                    <div>
                      <p className="font-bold text-xs text-neutral-900">
                        Approximate Distance Display
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        Recommended to prevent location triangulation
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={privacySettings.approximateDistance}
                      onChange={(e) =>
                        setPrivacySettings((prev) => ({
                          ...prev,
                          approximateDistance: e.target.checked,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5E43F3]"></div>
                  </label>
                </div>

                <div className="p-2.5 bg-neutral-50 rounded-xl text-[11px] text-neutral-600 font-mono">
                  {privacySettings.approximateDistance ? (
                    <span>Preview: "Nearby (&lt; 250m)" or "Within 500m" or "~1.5 km away"</span>
                  ) : (
                    <span>Preview: "240m away" (precise meter-level display)</span>
                  )}
                </div>
              </div>

              {/* Ghost Mode Toggle */}
              <div className="p-3.5 rounded-2xl border border-neutral-200 bg-white space-y-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-neutral-900">
                      Ghost Mode (Incognito Browsing)
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      Browse and discover nearby content without appearing in "People Near You"
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={privacySettings.ghostMode}
                      onChange={(e) =>
                        setPrivacySettings((prev) => ({
                          ...prev,
                          ghostMode: e.target.checked,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5E43F3]"></div>
                  </label>
                </div>
              </div>

              {/* Show Neighborhood Only */}
              <div className="p-3.5 rounded-2xl border border-neutral-200 bg-white space-y-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-neutral-900">
                      Show Neighborhood Only on Posts
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      Tag posts as general "{selectedName}" rather than specific street addresses
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={privacySettings.showNeighborhoodOnly}
                      onChange={(e) =>
                        setPrivacySettings((prev) => ({
                          ...prev,
                          showNeighborhoodOnly: e.target.checked,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5E43F3]"></div>
                  </label>
                </div>
              </div>

              {/* Default Location Sharing on Posts */}
              <div className="p-3.5 rounded-2xl border border-neutral-200 bg-white space-y-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-neutral-900">
                      Auto-Attach Location to New Posts
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      Include current neighborhood tag when posting to local feeds
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={privacySettings.shareLocationOnPosts}
                      onChange={(e) =>
                        setPrivacySettings((prev) => ({
                          ...prev,
                          shareLocationOnPosts: e.target.checked,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5E43F3]"></div>
                  </label>
                </div>
              </div>

              {/* Storage & Tracking Guarantee */}
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 text-[11px] text-neutral-600 space-y-1">
                <p className="font-bold text-neutral-900">Zero Continuous GPS Tracking</p>
                <p>
                  Your browser GPS coordinates are evaluated in memory to compute distances to local posts. Lalao never transmits your raw tracking breadcrumbs to third-party ad brokers.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Bar */}
        <div className="p-4 border-t border-neutral-100 bg-white shrink-0 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(false)}
            className="flex-1 py-2.5 rounded-full border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="btn-apply-location"
            type="button"
            onClick={handleApply}
            className="flex-1 py-2.5 rounded-full bg-[#5E43F3] text-white text-xs font-bold hover:bg-[#4E34E0] shadow-md shadow-[#5E43F3]/25 transition-all cursor-pointer"
          >
            Apply Location & Radius
          </button>
        </div>
      </div>
    </div>
  );
};
