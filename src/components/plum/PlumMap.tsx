// @ts-nocheck
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MapPin,
  Compass,
  Shield,
  Eye,
  EyeOff,
  Navigation,
  Lock,
  Users,
  ZoomIn,
  ZoomOut,
  Crosshair,
  MessageCircle,
  Heart,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import { PlumMemberModal } from './PlumMemberModal';
import { getDatingGoalOption } from './datingGoals';
import { getCoordinatesForLocation } from '../../utils/locationUtils';

interface PlumMapProps {
  onOpenChat?: () => void;
  targetUserId?: string | null;
}

export const PlumMap: React.FC<PlumMapProps> = ({ onOpenChat, targetUserId }) => {
  const {
    location,
    permissions,
    setActivePermissionPrompt,
    triggerShareToast,
    openChatWithUser,
    detectGpsLocation,
    isDetectingGps,
  } = useLalao();

  // Selected discovery radius filter
  const [selectedRadiusKm, setSelectedRadiusKm] = useState<number>(location.radiusKm || 15);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Automatically focus target member if requested from profile
  useEffect(() => {
    if (targetUserId) {
      setPreviewMemberId(targetUserId);
    }
  }, [targetUserId]);

  // Map viewport states (pan & zoom)
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 0.75x to 2x
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Map canvas ref
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // User center coordinates fallback
  const userCenterCoords = useMemo(() => {
    if (typeof location.latitude === 'number' && typeof location.longitude === 'number') {
      return { lat: location.latitude, lng: location.longitude };
    }
    const fallback = getCoordinatesForLocation(location.name);
    return { lat: fallback.lat, lng: fallback.lng };
  }, [location.latitude, location.longitude, location.name]);

  // Query opted-in members with backend filtering
  const membersQuery = useQuery(api.plum.listPlumMembers, {
    limit: 100,
    radiusKm: selectedRadiusKm,
  });

  const isLoading = membersQuery === undefined;

  // Filter members who consented to showOnMap & within chosen radius
  const mapEligibleMembers = useMemo(() => {
    if (!membersQuery) return [];
    return membersQuery.filter((m: any) => {
      if (!m.showOnMap) return false;
      if (typeof m.distanceKm === 'number' && m.distanceKm > selectedRadiusKm) {
        return false;
      }
      return true;
    });
  }, [membersQuery, selectedRadiusKm]);

  // Currently focused member preview
  const [previewMemberId, setPreviewMemberId] = useState<string | null>(null);

  const activePreviewMember = useMemo(() => {
    if (!previewMemberId) return null;
    return mapEligibleMembers.find((m: any) => m.userId === previewMemberId) || null;
  }, [previewMemberId, mapEligibleMembers]);

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: Math.max(-120, Math.min(120, e.clientX - dragStart.x)),
      y: Math.max(-120, Math.min(120, e.clientY - dragStart.y)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPanOffset({
      x: Math.max(-120, Math.min(120, e.touches[0].clientX - dragStart.x)),
      y: Math.max(-120, Math.min(120, e.touches[0].clientY - dragStart.y)),
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Recenter Map
  const handleRecenter = () => {
    setPanOffset({ x: 0, y: 0 });
    setZoomLevel(1);
    triggerShareToast('Recentered to your discovery hub');
  };

  // GPS Refresh
  const handleRequestGps = async () => {
    if (detectGpsLocation) {
      const res = await detectGpsLocation();
      if (res && res.success) {
        triggerShareToast(`Location detected: ${res.location?.name || 'Nearby'}`);
      } else {
        triggerShareToast('Unable to detect live location. Using default zone.');
      }
    } else {
      setActivePermissionPrompt('location');
    }
  };

  // Quick message initiate from member preview
  const handleQuickMessage = (member: any) => {
    if (!member) return;
    openChatWithUser(
      {
        id: member.userId,
        name: member.displayName,
        username: member.displayName.toLowerCase().replace(/\s+/g, '_'),
        avatar: member.mainPhoto || '',
      } as any,
      `Hi ${member.displayName}, saw your profile on Plum Map!`
    );
    if (onOpenChat) onOpenChat();
  };

  return (
    <div className="w-full px-3 sm:px-4 py-4 space-y-4 animate-in fade-in duration-200">
      {/* Privacy Notice Banner (Requirement 2.2: Privacy protected) */}
      <div className="p-3.5 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-xs text-theme-primary flex items-start gap-2.5 shadow-sm">
        <Shield className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-pink-600 dark:text-pink-400">
            Privacy Protected Discovery Map
          </p>
          <p className="text-[11px] text-theme-secondary mt-0.5 leading-relaxed">
            Exact home and live GPS coordinates are protected on the server. Markers display generalized, approximate zones matching mutual dating intentions.
          </p>
        </div>
      </div>

      {/* Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-theme-surface border border-theme-divider-light shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="w-4 h-4 text-pink-500 shrink-0" />
          <span className="text-xs font-bold text-theme-primary truncate max-w-[150px] sm:max-w-[200px]">
            {location.name || 'Current Discovery Hub'}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/10 text-pink-600 dark:text-pink-400 shrink-0">
            {mapEligibleMembers.length} visible
          </span>
        </div>

        {/* Discovery Radius toggles */}
        <div className="flex items-center gap-1 text-[11px]">
          {[5, 15, 30, 50].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setSelectedRadiusKm(r);
                triggerShareToast(`Radius updated: ${r}km`);
              }}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                selectedRadiusKm === r
                  ? 'bg-gradient-to-r from-[#8E24AA] to-[#E91E63] text-white shadow-xs'
                  : 'bg-theme-base text-theme-secondary hover:text-theme-primary'
              }`}
            >
              {r}km
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Discovery Map Container */}
      <div
        ref={mapContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative aspect-[4/3] sm:aspect-[16/10] w-full rounded-3xl overflow-hidden bg-[#16161a] border border-pink-500/20 shadow-2xl flex items-center justify-center select-none cursor-grab active:cursor-grabbing"
      >
        {/* Geographic Grid Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, #E91E63 1px, transparent 1px), radial-gradient(circle, #9C27B0 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
          }}
        />

        {/* Radar concentric range rings */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-150"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          }}
        >
          <div className="w-[85%] h-[85%] rounded-full border border-pink-500/20 animate-pulse" />
          <div className="w-[62%] h-[62%] rounded-full border border-pink-500/25" />
          <div className="w-[38%] h-[38%] rounded-full border border-pink-500/30" />
          <div className="w-[16%] h-[16%] rounded-full bg-pink-500/10 border border-pink-500/40" />

          {/* Crosshairs */}
          <div className="absolute h-full w-[1px] bg-pink-500/15" />
          <div className="absolute w-full h-[1px] bg-pink-500/15" />
        </div>

        {/* Transformable Canvas Layer for Markers */}
        <div
          className="absolute inset-0 transition-transform duration-75"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Center Marker: Viewer's Approximate Discovery Hub */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center pointer-events-none">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-8 h-8 rounded-full bg-pink-500/30 animate-ping" />
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#8E24AA] to-[#E91E63] border-2 border-white shadow-lg flex items-center justify-center text-[9px] text-white font-black">
                You
              </div>
            </div>
            <span className="mt-1 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-xs text-[9px] font-bold text-white border border-white/20 whitespace-nowrap shadow-sm">
              {location.name}
            </span>
          </div>

          {/* Eligible Member Markers */}
          {mapEligibleMembers.map((member: any, idx: number) => {
            // Compute map position: if relative coordinate offsets exist, use them; otherwise use deterministic polar spread
            let leftPercent = 50;
            let topPercent = 50;

            if (
              typeof member.approxLat === 'number' &&
              typeof member.approxLng === 'number' &&
              userCenterCoords
            ) {
              const dLat = member.approxLat - userCenterCoords.lat;
              const dLng = member.approxLng - userCenterCoords.lng;
              // Scale degrees to percentage viewport (approx ~0.15 deg range per 15km)
              const maxDegRange = (selectedRadiusKm / 111) * 1.5 || 0.15;
              leftPercent = Math.max(8, Math.min(92, 50 + (dLng / maxDegRange) * 40));
              topPercent = Math.max(8, Math.min(92, 50 - (dLat / maxDegRange) * 40));
            } else {
              const angle = (idx * 68 + 32) * (Math.PI / 180);
              const distPercent = 18 + ((idx * 19) % 52);
              leftPercent = 50 + Math.cos(angle) * (distPercent / 2);
              topPercent = 50 + Math.sin(angle) * (distPercent / 2);
            }

            const isSelected = previewMemberId === member.userId;
            const goalOption = getDatingGoalOption(member.datingGoal);

            return (
              <div
                key={member._id}
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewMemberId(member.userId);
                }}
                style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-25 group cursor-pointer"
              >
                <div className="relative flex flex-col items-center">
                  {/* Pin Avatar */}
                  <div
                    className={`rounded-full border-2 overflow-hidden shadow-lg transition-all duration-200 bg-neutral-900 ${
                      isSelected
                        ? 'w-12 h-12 border-pink-400 ring-4 ring-pink-500/40 scale-115'
                        : 'w-10 h-10 border-white hover:scale-120 hover:border-pink-300'
                    }`}
                  >
                    <img
                      src={
                        member.mainPhoto ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={member.displayName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Pin Label Overlay */}
                  <div className="mt-1 px-2 py-0.5 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-white text-[9px] font-bold shadow-sm flex items-center gap-1 whitespace-nowrap">
                    <span>{member.displayName}</span>
                    <span className="text-pink-400">· {member.age}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Map Control Buttons (Top-Right): Zoom, Recenter, GPS */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-30">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoomLevel((prev) => Math.min(1.8, prev + 0.25));
            }}
            title="Zoom In"
            className="p-2 rounded-xl bg-black/70 hover:bg-black/90 text-white border border-white/10 backdrop-blur-md transition-colors cursor-pointer shadow-md"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoomLevel((prev) => Math.max(0.65, prev - 0.25));
            }}
            title="Zoom Out"
            className="p-2 rounded-xl bg-black/70 hover:bg-black/90 text-white border border-white/10 backdrop-blur-md transition-colors cursor-pointer shadow-md"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRecenter();
            }}
            title="Recenter Map"
            className="p-2 rounded-xl bg-black/70 hover:bg-black/90 text-white border border-white/10 backdrop-blur-md transition-colors cursor-pointer shadow-md"
          >
            <Crosshair className="w-4 h-4 text-pink-400" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRequestGps();
            }}
            disabled={isDetectingGps}
            title="Refresh GPS Location"
            className="p-2 rounded-xl bg-black/70 hover:bg-black/90 text-white border border-white/10 backdrop-blur-md transition-colors cursor-pointer shadow-md"
          >
            {isDetectingGps ? (
              <Loader2 className="w-4 h-4 text-pink-400 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4 text-pink-400" />
            )}
          </button>
        </div>

        {/* Legend Overlay (Bottom-Left) */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[10px] text-white/80 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 pointer-events-none z-30">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-pink-500" /> You
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-white" /> Members
          </span>
          <span className="text-white/50">· {selectedRadiusKm}km</span>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-40">
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
            <span className="text-xs font-semibold text-white">Loading nearby members...</span>
          </div>
        )}

        {/* Empty Map State */}
        {!isLoading && mapEligibleMembers.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-30 pointer-events-none">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center mb-2">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-white">No members currently visible on map</p>
            <p className="text-xs text-white/70 max-w-[280px] mt-1">
              Try increasing your radius or check back as more members opt into discovery.
            </p>
          </div>
        )}
      </div>

      {/* Selected Marker Preview Card (Requirement 2.1 & 2.4) */}
      {activePreviewMember && (
        <div className="p-4 rounded-3xl bg-theme-surface border border-pink-500/40 shadow-xl space-y-3 animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-theme-divider-light bg-neutral-900 shadow-md">
                <img
                  src={
                    activePreviewMember.mainPhoto ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
                  }
                  alt={activePreviewMember.displayName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-sm sm:text-base text-theme-primary truncate">
                    {activePreviewMember.displayName}
                  </h3>
                  <span className="text-xs font-bold text-pink-500">{activePreviewMember.age}</span>
                </div>
                <p className="text-xs text-theme-tertiary truncate">
                  {activePreviewMember.broadLocation || 'Nearby Hub'}
                  {typeof activePreviewMember.distanceKm === 'number' && (
                    <span> · ~{activePreviewMember.distanceKm} km away</span>
                  )}
                </p>

                {/* Goal badge */}
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 text-[10px] font-bold border border-pink-500/20">
                    <Heart className="w-2.5 h-2.5 fill-pink-500 text-pink-500" />
                    <span>{getDatingGoalOption(activePreviewMember.datingGoal).badgeLabel}</span>
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPreviewMemberId(null)}
              className="text-theme-tertiary hover:text-theme-primary text-xs font-semibold p-1 cursor-pointer"
            >
              Close
            </button>
          </div>

          {activePreviewMember.bio && (
            <p className="text-xs text-theme-secondary line-clamp-2 leading-relaxed">
              {activePreviewMember.bio}
            </p>
          )}

          {/* Action Buttons: Message via Default Chat & View Profile */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleQuickMessage(activePreviewMember)}
              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#8E24AA] via-[#E91E63] to-[#FF4081] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Send Message</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedUserId(activePreviewMember.userId)}
              className="py-2 px-4 rounded-xl bg-theme-base border border-theme-divider-light text-theme-primary text-xs font-bold hover:bg-theme-surface transition-colors cursor-pointer"
            >
              View Profile
            </button>
          </div>
        </div>
      )}

      {/* Nearby Members Quick Roster */}
      <div className="space-y-2 pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
          Members Near Your Discovery Hub ({mapEligibleMembers.length})
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {mapEligibleMembers.map((member: any) => (
            <div
              key={member._id}
              onClick={() => {
                setPreviewMemberId(member.userId);
                setSelectedUserId(member.userId);
              }}
              className="p-2.5 rounded-2xl bg-theme-surface border border-theme-divider-light hover:border-pink-500/30 flex items-center gap-3 cursor-pointer transition-all"
            >
              <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-neutral-800">
                <img
                  src={
                    member.mainPhoto ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
                  }
                  alt={member.displayName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-theme-primary truncate">
                    {member.displayName}
                  </span>
                  <span className="text-xs font-semibold text-pink-500">{member.age}</span>
                </div>
                <p className="text-[10px] text-theme-tertiary truncate">
                  {member.broadLocation || 'Nearby'}
                  {typeof member.distanceKm === 'number' && (
                    <span> · ~{member.distanceKm} km</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                className="px-2.5 py-1 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 text-[10px] font-bold"
              >
                View
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Full Member Profile Modal */}
      {selectedUserId && (
        <PlumMemberModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onOpenChat={() => {
            setSelectedUserId(null);
            if (onOpenChat) onOpenChat();
          }}
        />
      )}
    </div>
  );
};
