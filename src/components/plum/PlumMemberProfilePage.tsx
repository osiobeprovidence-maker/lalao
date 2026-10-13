import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  MessageCircle,
  Zap,
  Gift,
  Lock,
  Unlock,
  MapPin,
  Heart,
  Bookmark,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Flame,
  Compass,
  MoreVertical,
  CheckCircle,
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import { getDatingGoalOption } from './datingGoals';

interface PlumMemberProfilePageProps {
  userId: string;
  onBack: () => void;
  onOpenChat: () => void;
  onViewOnMap?: (userId: string) => void;
  memberIds?: string[];
  currentIndex?: number;
  onNavigateMember?: (newUserId: string) => void;
}

export const PlumMemberProfilePage: React.FC<PlumMemberProfilePageProps> = ({
  userId,
  onBack,
  onOpenChat,
  onViewOnMap,
  memberIds,
  currentIndex,
  onNavigateMember,
}) => {
  const { openChatWithUser, triggerShareToast } = useLalao();

  // Queries & Mutations
  const member = useQuery(api.plum.getPlumMemberDetails, { userId: userId as any });
  const toggleFavoriteMutation = useMutation(api.plum.togglePlumFavorite);
  const expressInterestMutation = useMutation(api.plum.expressPlumInterest);
  const sendFlashMutation = useMutation(api.plum.sendPlumFlash);
  const sendGiftMutation = useMutation(api.plum.sendPlumGift);
  const reportMemberMutation = useMutation(api.plum.reportPlumMember);

  // Active Photo Gallery index
  const [photoIndex, setPhotoIndex] = useState(0);

  // Optimistic UI interaction states
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [isTogglingFav, setIsTogglingFav] = useState<boolean>(false);
  const [hasExpressedInterest, setHasExpressedInterest] = useState<boolean>(false);
  const [isExpressingInterest, setIsExpressingInterest] = useState<boolean>(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState<boolean>(false);

  // Sub-modal and menu states
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isFlashOpen, setIsFlashOpen] = useState(false);
  const [flashNote, setFlashNote] = useState('');
  const [isSendingFlash, setIsSendingFlash] = useState(false);

  const [isGiftOpen, setIsGiftOpen] = useState(false);
  const [selectedGiftId, setSelectedGiftId] = useState('rose');
  const [giftMessage, setGiftMessage] = useState('');
  const [isSendingGift, setIsSendingGift] = useState(false);

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('inappropriate_content');
  const [reportDetails, setReportDetails] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  // Sync server interaction states when member details load
  useEffect(() => {
    if (member) {
      setIsFavorited(Boolean(member.isFavorited));
      setHasExpressedInterest(Boolean(member.hasExpressedInterest));
      setPhotoIndex(0); // Reset photo index when navigating between members
    }
  }, [member?.userId, member?.isFavorited, member?.hasExpressedInterest]);

  // Gallery Photos array (Main photo first, then public photos, then unlocked private photos)
  const allPhotos = React.useMemo(() => {
    if (!member) return [];
    let publicList = [...(member.publicPhotos || [])];
    if (member.mainPhoto) {
      publicList = [
        member.mainPhoto,
        ...publicList.filter((p: string) => p !== member.mainPhoto),
      ];
    }
    return [...publicList, ...(member.privatePhotos || [])];
  }, [member]);

  const goalOption = getDatingGoalOption(member?.datingGoal);

  // Keyboard navigation for photos
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && allPhotos.length > 1) {
        setPhotoIndex((prev) => (prev > 0 ? prev - 1 : allPhotos.length - 1));
      } else if (e.key === 'ArrowRight' && allPhotos.length > 1) {
        setPhotoIndex((prev) => (prev < allPhotos.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allPhotos.length]);

  // ── QUICK ACTIONS ──

  // A. MESSAGE (Routes to LaLao's existing default Messages system)
  const handleSendMessage = () => {
    if (!member) return;
    openChatWithUser(
      {
        id: member.userId,
        name: member.displayName,
        username: member.displayName.toLowerCase().replace(/\s+/g, '_'),
        avatar: member.mainPhoto || member.publicPhotos[0] || '',
      } as any,
      `Hi ${member.displayName}, saw your profile on Plum!`
    );
    onOpenChat();
  };

  // B. PIN / FAVORITE
  const handleToggleFavorite = async () => {
    if (!member || isTogglingFav) return;
    const nextState = !isFavorited;
    setIsFavorited(nextState);
    try {
      setIsTogglingFav(true);
      await toggleFavoriteMutation({ targetUserId: member.userId as any });
      triggerShareToast(
        nextState
          ? `Pinned ${member.displayName} to your Plum Favorites`
          : `Removed ${member.displayName} from Favorites`
      );
    } catch (err: any) {
      setIsFavorited(!nextState); // Rollback
      triggerShareToast(err.message || 'Failed to update favorite');
    } finally {
      setIsTogglingFav(false);
    }
  };

  // C. EXPRESS INTEREST (HEART)
  const handleExpressInterest = async () => {
    if (!member || isExpressingInterest) return;
    if (hasExpressedInterest) {
      triggerShareToast(`You already expressed interest in ${member.displayName}`);
      return;
    }
    try {
      setIsExpressingInterest(true);
      setShowHeartAnimation(true);
      await expressInterestMutation({ receiverId: member.userId as any });
      setHasExpressedInterest(true);
      triggerShareToast(`Expressed interest in ${member.displayName}`);
      setTimeout(() => setShowHeartAnimation(false), 1200);
    } catch (err: any) {
      triggerShareToast(err.message || 'Failed to express interest');
    } finally {
      setIsExpressingInterest(false);
    }
  };

  // D. VIEW ON MAP
  const handleViewOnMap = () => {
    if (!member) return;
    if (!member.showOnMap) {
      triggerShareToast(`${member.displayName} has disabled map visibility`);
      return;
    }
    if (onViewOnMap) {
      onViewOnMap(member.userId);
    } else {
      triggerShareToast(`Viewing approximate location in ${member.broadLocation}`);
    }
  };

  // E. SEND FLASH
  const handleSendFlash = async () => {
    if (!member) return;
    try {
      setIsSendingFlash(true);
      await sendFlashMutation({
        receiverId: member.userId as any,
        note: flashNote.trim() || undefined,
      });
      triggerShareToast(`Sent a Flash to ${member.displayName}`);
      setIsFlashOpen(false);
      setFlashNote('');
    } catch (err: any) {
      triggerShareToast(err.message || 'Failed to send Flash');
    } finally {
      setIsSendingFlash(false);
    }
  };

  // F. SEND GIFT
  const handleSendGift = async () => {
    if (!member) return;
    try {
      setIsSendingGift(true);
      const res = await sendGiftMutation({
        receiverId: member.userId as any,
        giftId: selectedGiftId,
        message: giftMessage.trim() || undefined,
      });
      triggerShareToast(`Gift sent: ${res.giftName} (-${res.costLC} LC)`);
      setIsGiftOpen(false);
      setGiftMessage('');
    } catch (err: any) {
      triggerShareToast(err.message || 'Failed to send gift. Check wallet balance.');
    } finally {
      setIsSendingGift(false);
    }
  };

  // G. REPORT MEMBER
  const handleReport = async () => {
    if (!member) return;
    try {
      setIsReporting(true);
      await reportMemberMutation({
        reportedUserId: member.userId as any,
        reason: reportReason,
        details: reportDetails.trim() || undefined,
      });
      triggerShareToast('Report submitted for moderation. Thank you.');
      setIsReportOpen(false);
      onBack();
    } catch (err: any) {
      triggerShareToast(err.message || 'Failed to submit report');
    } finally {
      setIsReporting(false);
    }
  };

  // Navigation between previous and next member
  const hasMembersList = Boolean(memberIds && memberIds.length > 1 && typeof currentIndex === 'number');
  const canGoPrev = hasMembersList && (currentIndex as number) > 0;
  const canGoNext = hasMembersList && (currentIndex as number) < (memberIds as string[]).length - 1;

  const handlePrevMember = () => {
    if (canGoPrev && memberIds && onNavigateMember) {
      onNavigateMember(memberIds[(currentIndex as number) - 1]);
    }
  };

  const handleNextMember = () => {
    if (canGoNext && memberIds && onNavigateMember) {
      onNavigateMember(memberIds[(currentIndex as number) + 1]);
    }
  };

  if (member === undefined) {
    return (
      <div className="w-full py-20 flex flex-col items-center justify-center text-center space-y-3">
        <div className="w-10 h-10 rounded-full border-3 border-pink-500/30 border-t-pink-500 animate-spin" />
        <p className="text-xs font-semibold text-theme-tertiary">Loading Plum profile...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="w-full max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
          <Flame className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-theme-primary">Profile unavailable or deactivated</h3>
        <p className="text-xs text-theme-secondary">
          This member profile may have been hidden, deactivated, or is no longer accessible.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#8E24AA] via-[#E91E63] to-[#FF4081] text-white text-xs font-bold shadow-md hover:opacity-95 cursor-pointer"
        >
          Back to Members
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 pb-12 animate-in fade-in duration-200">
      
      {/* ── TOP ACTION BAR: BACK BUTTON & SEQUENCE ── */}
      <div className="flex items-center justify-between gap-3 px-1">
        <button
          id="btn-plum-profile-back"
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-theme-surface border border-theme-divider-light text-theme-primary hover:text-pink-500 hover:border-pink-500/40 text-xs font-bold transition-all shadow-xs cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Members</span>
        </button>

        {/* Member Sequence & Prev/Next Navigation Controls */}
        {hasMembersList && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-theme-tertiary mr-1">
              {(currentIndex as number) + 1} of {(memberIds as string[]).length}
            </span>
            <button
              type="button"
              onClick={handlePrevMember}
              disabled={!canGoPrev}
              title="Previous member"
              className="p-1.5 rounded-xl bg-theme-surface border border-theme-divider-light text-theme-secondary hover:text-theme-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMember}
              disabled={!canGoNext}
              title="Next member"
              className="p-1.5 rounded-xl bg-theme-surface border border-theme-divider-light text-theme-secondary hover:text-theme-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── FULL DEDICATED PROFILE PAGE CONTAINER (No Backdrop / No Overlay) ── */}
      <div className="relative w-full rounded-3xl bg-theme-surface border border-theme-divider-light shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* ── LEFT COLUMN: PROMINENT PHOTO AREA & GALLERY (Desktop: 48% width) ── */}
        <div className="relative w-full md:w-[48%] shrink-0 bg-black flex flex-col select-none overflow-hidden border-b md:border-b-0 md:border-r border-theme-divider-light">
          {/* Main Photo Viewer */}
          <div className="relative aspect-[4/4.8] sm:aspect-[4/5] md:aspect-auto md:h-full min-h-[340px] sm:min-h-[420px] w-full bg-black overflow-hidden flex items-center justify-center">
            {allPhotos.length > 0 ? (
              <img
                src={allPhotos[photoIndex]}
                alt={member.displayName}
                className="w-full h-full object-cover transition-all duration-300"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-neutral-500 gap-2 p-6 text-center">
                <Flame className="w-12 h-12 text-neutral-600 stroke-1" />
                <span className="text-xs">No public photos uploaded</span>
              </div>
            )}

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/25 pointer-events-none" />

            {/* Heart Animation Overlay when Expressing Interest */}
            {showHeartAnimation && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 animate-in zoom-in-50 fade-in duration-300">
                <div className="p-6 rounded-full bg-pink-500/80 text-white shadow-2xl backdrop-blur-xs animate-bounce">
                  <Heart className="w-16 h-16 fill-white" />
                </div>
              </div>
            )}

            {/* Photo Left/Right Arrows */}
            {allPhotos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setPhotoIndex((prev) => (prev > 0 ? prev - 1 : allPhotos.length - 1))}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/45 text-white hover:bg-black/75 backdrop-blur-xs transition-colors cursor-pointer"
                  title="Previous photo"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoIndex((prev) => (prev < allPhotos.length - 1 ? prev + 1 : 0))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/45 text-white hover:bg-black/75 backdrop-blur-xs transition-colors cursor-pointer"
                  title="Next photo"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Top Photo Indicators bar */}
            {allPhotos.length > 1 && (
              <div className="absolute top-3 left-4 right-16 flex items-center gap-1 z-10 pointer-events-none">
                {allPhotos.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      i === photoIndex ? 'bg-white shadow-sm' : 'bg-white/35'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Badges on Photo: Location */}
            <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 z-10">
              {member.broadLocation && (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold border border-white/15 shadow-sm">
                  <MapPin className="w-3 h-3 text-pink-400" />
                  <span>{member.broadLocation}</span>
                </div>
              )}
            </div>

            {/* Bottom Photo Overlay Info */}
            <div className="absolute bottom-3 left-4 right-4 text-white z-10">
              <div className="flex items-baseline gap-2">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm">
                  {member.displayName}
                </h2>
                <span className="text-xl font-bold opacity-90 drop-shadow-sm">{member.age}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-500/85 backdrop-blur-xs text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                  <Heart className="w-2.5 h-2.5 fill-white" />
                  <span>{goalOption.badgeLabel}</span>
                </span>
                {member.privatePhotosCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/20">
                    <Lock className="w-2.5 h-2.5 text-pink-400" />
                    <span>{member.privatePhotosCount} Private Vault</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Gallery Thumbnails Strip */}
          {allPhotos.length > 1 && (
            <div className="p-2.5 bg-black/90 border-t border-white/10 flex items-center gap-2 overflow-x-auto scrollbar-none">
              {allPhotos.map((src, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPhotoIndex(idx)}
                  className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    photoIndex === idx
                      ? 'border-pink-500 scale-105 shadow-md shadow-pink-500/30'
                      : 'border-white/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute bottom-0 inset-x-0 bg-pink-600/90 text-white text-[7px] font-black uppercase tracking-wider text-center py-0.2">
                      Main
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: INFORMATION AREA & QUICK ACTIONS (Desktop: 52% width) ── */}
        <div className="flex-1 flex flex-col min-h-0 bg-theme-surface">
          
          {/* Header Bar: Display name, age, quick actions */}
          <div className="p-4 sm:p-5 border-b border-theme-divider-light space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-black text-theme-primary tracking-tight">
                    {member.displayName}
                  </h3>
                  <span className="text-base font-bold text-pink-500">{member.age}</span>
                  {member.isSelf && (
                    <span className="px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-600 dark:text-pink-400 text-[10px] font-black uppercase">
                      You
                    </span>
                  )}
                </div>

                {member.broadLocation && (
                  <p className="text-xs text-theme-secondary flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                    <span>{member.broadLocation}</span>
                  </p>
                )}
              </div>
            </div>

            {/* ── PROFILE QUICK ACTIONS ROW ── */}
            {!member.isSelf && (
              <div className="pt-2">
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {/* Action 1: MESSAGE (Opens existing LaLao Messages system) */}
                  <button
                    id="btn-plum-profile-message"
                    type="button"
                    onClick={handleSendMessage}
                    className="col-span-2 sm:col-span-2 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-[#8E24AA] via-[#E91E63] to-[#FF4081] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-pink-500/20 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 stroke-[2.4]" />
                    <span>Message</span>
                  </button>

                  {/* Action 2: PIN / FAVORITE */}
                  <button
                    id="btn-plum-profile-favorite"
                    type="button"
                    onClick={handleToggleFavorite}
                    disabled={isTogglingFav}
                    title={isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
                    className={`py-2.5 px-2 rounded-2xl border text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
                      isFavorited
                        ? 'bg-pink-500/15 border-pink-500/40 text-pink-600 dark:text-pink-400 shadow-xs'
                        : 'bg-theme-base border-theme-divider-light text-theme-secondary hover:text-theme-primary'
                    }`}
                  >
                    <Bookmark
                      className={`w-4 h-4 ${isFavorited ? 'fill-pink-500 text-pink-500' : ''}`}
                    />
                    <span className="text-[11px] truncate">{isFavorited ? 'Pinned' : 'Pin'}</span>
                  </button>

                  {/* Action 3: EXPRESS INTEREST (Heart) */}
                  <button
                    id="btn-plum-profile-interest"
                    type="button"
                    onClick={handleExpressInterest}
                    disabled={isExpressingInterest}
                    title="Express Interest"
                    className={`py-2.5 px-2 rounded-2xl border text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
                      hasExpressedInterest
                        ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400'
                        : 'bg-theme-base border-theme-divider-light text-theme-secondary hover:text-rose-500'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${hasExpressedInterest ? 'fill-rose-500 text-rose-500' : ''}`}
                    />
                    <span className="text-[11px] truncate">
                      {hasExpressedInterest ? 'Interested' : 'Interest'}
                    </span>
                  </button>

                  {/* Action 4: VIEW ON MAP */}
                  <button
                    id="btn-plum-profile-map"
                    type="button"
                    onClick={handleViewOnMap}
                    title="View on Discovery Map"
                    className="hidden sm:flex py-2.5 px-2 rounded-2xl bg-theme-base border border-theme-divider-light hover:border-pink-500/40 text-theme-secondary hover:text-theme-primary text-xs font-bold items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <Compass className="w-4 h-4 text-pink-500" />
                    <span className="text-[11px]">Map</span>
                  </button>
                </div>

                {/* Secondary interaction pills (Flash & Gift) */}
                <div className="flex items-center gap-2 mt-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsFlashOpen(true)}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>Send Flash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsGiftOpen(true)}
                    className="flex-1 py-1.5 px-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Gift className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Send Gift</span>
                  </button>
                  
                  {/* More Menu (Report / Mobile Map) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                      className="p-2 rounded-xl bg-theme-base border border-theme-divider-light text-theme-secondary hover:text-theme-primary transition-colors cursor-pointer"
                      title="More actions"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                    {showMoreMenu && (
                      <div className="absolute right-0 bottom-full mb-1 w-36 rounded-2xl bg-theme-surface border border-theme-divider-light shadow-xl p-1 z-30">
                        <button
                          type="button"
                          onClick={() => {
                            setShowMoreMenu(false);
                            handleViewOnMap();
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-theme-secondary hover:text-theme-primary hover:bg-theme-base rounded-xl flex items-center gap-2 sm:hidden"
                        >
                          <Compass className="w-3.5 h-3.5 text-pink-500" />
                          <span>View on Map</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowMoreMenu(false);
                            setIsReportOpen(true);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10 rounded-xl flex items-center gap-2 cursor-pointer"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Report Profile</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── PROFILE DETAILS CONTENT BODY ── */}
          <div className="p-4 sm:p-5 space-y-4">
            
            {/* 1. Dating Goal Card */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-transparent border border-pink-500/25 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-pink-600 dark:text-pink-400 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
                  Dating Goal
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-600 dark:text-pink-300">
                  {goalOption.badgeLabel}
                </span>
              </div>
              <h4 className="text-sm font-bold text-theme-primary">
                {goalOption.label}
              </h4>
              <p className="text-xs text-theme-secondary leading-relaxed">
                {goalOption.description}
              </p>
            </div>

            {/* 2. Bio / About Me */}
            {member.bio && (
              <div className="space-y-1.5 p-4 rounded-3xl bg-theme-base/60 border border-theme-divider-light">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-theme-tertiary">
                  About Me
                </h4>
                <p className="text-xs sm:text-sm text-theme-primary leading-relaxed whitespace-pre-wrap">
                  {member.bio}
                </p>
              </div>
            )}

            {/* 3. Interests & Passions */}
            {member.interests && member.interests.length > 0 && (
              <div className="space-y-2 p-4 rounded-3xl bg-theme-base/60 border border-theme-divider-light">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-theme-tertiary">
                  Interests & Passions
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {member.interests.map((item: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full bg-theme-surface border border-theme-divider-light text-theme-secondary text-xs font-medium shadow-xs"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Connection Preferences & Gender */}
            <div className="p-4 rounded-3xl bg-theme-base/60 border border-theme-divider-light space-y-2.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-theme-tertiary">
                Connection Preferences
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-2xl bg-theme-surface border border-theme-divider-light space-y-0.5">
                  <span className="text-[10px] text-theme-tertiary font-bold uppercase">Gender</span>
                  <p className="font-semibold text-theme-primary capitalize">{member.gender}</p>
                </div>
                <div className="p-2.5 rounded-2xl bg-theme-surface border border-theme-divider-light space-y-0.5">
                  <span className="text-[10px] text-theme-tertiary font-bold uppercase">Looking For</span>
                  <p className="font-semibold text-theme-primary capitalize">
                    {member.datingPreferences && member.datingPreferences.length > 0
                      ? member.datingPreferences.join(', ')
                      : 'Open to everyone'}
                  </p>
                </div>
              </div>
            </div>

            {/* 5. Additional Dating Info if provided */}
            {member.additionalDatingInfo && (
              <div className="p-4 rounded-3xl bg-theme-base/60 border border-theme-divider-light space-y-1">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-theme-tertiary">
                  More About My Lifestyle
                </h4>
                <p className="text-xs text-theme-secondary leading-relaxed">
                  {member.additionalDatingInfo}
                </p>
              </div>
            )}

            {/* 6. Private Photo Vault Access Banner */}
            <div className="p-4 rounded-3xl bg-theme-base/60 border border-theme-divider-light flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-pink-500/10 text-pink-500 shrink-0">
                  {member.hasPrivateAccess ? (
                    <Unlock className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-theme-primary">
                    Private Photo Vault
                  </p>
                  <p className="text-[11px] text-theme-tertiary">
                    {member.hasPrivateAccess
                      ? `${member.privatePhotosCount} private photos unlocked`
                      : `${member.privatePhotosCount} protected photos (owner-only access)`}
                  </p>
                </div>
              </div>

              {member.isSelf ? (
                <span className="text-[10px] text-theme-tertiary font-bold">Your Vault</span>
              ) : member.hasPrivateAccess ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  Unlocked
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-500 text-[10px] font-bold">
                  Restricted
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── SUB-MODALS ── */}

      {/* Sub-modal: Send Flash */}
      {isFlashOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="max-w-xs w-full p-5 rounded-3xl bg-theme-surface border border-amber-500/30 space-y-3 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-500">
              <Zap className="w-5 h-5 fill-amber-500" />
              <h3 className="font-black text-sm text-theme-primary">Send a Flash</h3>
            </div>
            <p className="text-xs text-theme-secondary">
              A quick signal that {member.displayName} caught your eye!
            </p>
            <input
              type="text"
              maxLength={80}
              value={flashNote}
              onChange={(e) => setFlashNote(e.target.value)}
              placeholder="Add optional note (e.g. Love your smile!)..."
              className="w-full px-3 py-2 rounded-xl bg-theme-base border border-theme-divider-light text-theme-primary text-xs focus:outline-none"
            />
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsFlashOpen(false)}
                className="flex-1 py-2 rounded-xl bg-theme-base text-theme-secondary text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSendingFlash}
                onClick={handleSendFlash}
                className="flex-1 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 cursor-pointer"
              >
                {isSendingFlash ? 'Sending...' : 'Send Flash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modal: Send Gift */}
      {isGiftOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="max-w-sm w-full p-5 rounded-3xl bg-theme-surface border border-indigo-500/30 space-y-3 shadow-2xl">
            <div className="flex items-center gap-2 text-indigo-500">
              <Gift className="w-5 h-5" />
              <h3 className="font-black text-sm text-theme-primary">Send a Virtual Gift</h3>
            </div>
            <p className="text-xs text-theme-secondary">
              Send a charming gift to {member.displayName} using your LaLao Credits (LC).
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'rose', name: 'Rose', icon: '🌹', cost: 50 },
                { id: 'cocktail', name: 'Cocktail', icon: '🍸', cost: 100 },
                { id: 'chocolate', name: 'Chocolates', icon: '🍫', cost: 150 },
                { id: 'teddy', name: 'Teddy', icon: '🧸', cost: 250 },
                { id: 'champagne', name: 'Champagne', icon: '🍾', cost: 500 },
                { id: 'diamond', name: 'Diamond', icon: '💎', cost: 1000 },
              ].map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGiftId(g.id)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedGiftId === g.id
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-theme-divider-light bg-theme-base'
                  }`}
                >
                  <div className="text-xl">{g.icon}</div>
                  <div className="text-[10px] font-bold text-theme-primary truncate mt-0.5">{g.name}</div>
                  <div className="text-[9px] font-semibold text-indigo-500">{g.cost} LC</div>
                </button>
              ))}
            </div>

            <input
              type="text"
              maxLength={120}
              value={giftMessage}
              onChange={(e) => setGiftMessage(e.target.value)}
              placeholder="Gift message (optional)..."
              className="w-full px-3 py-2 rounded-xl bg-theme-base border border-theme-divider-light text-theme-primary text-xs focus:outline-none"
            />

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsGiftOpen(false)}
                className="flex-1 py-2 rounded-xl bg-theme-base text-theme-secondary text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSendingGift}
                onClick={handleSendGift}
                className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 cursor-pointer"
              >
                {isSendingGift ? 'Sending...' : 'Send Gift'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modal: Report Member */}
      {isReportOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="max-w-sm w-full p-5 rounded-3xl bg-theme-surface border border-rose-500/30 space-y-3 shadow-2xl">
            <h3 className="font-bold text-sm text-rose-500 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> Report Member
            </h3>
            <p className="text-xs text-theme-secondary">
              Help us keep Plum a safe dating space. Reports are handled confidentially.
            </p>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-theme-base border border-theme-divider-light text-theme-primary text-xs focus:outline-none"
            >
              <option value="inappropriate_content">Inappropriate photo or bio</option>
              <option value="harassment">Harassment or abusive messaging</option>
              <option value="fake_profile">Fake profile or scam</option>
              <option value="underage">Suspected underage user</option>
              <option value="other">Other issue</option>
            </select>
            <textarea
              rows={2}
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Provide extra details for the review team..."
              className="w-full px-3 py-2 rounded-xl bg-theme-base border border-theme-divider-light text-theme-primary text-xs focus:outline-none resize-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsReportOpen(false)}
                className="flex-1 py-2 rounded-xl bg-theme-base text-theme-secondary text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isReporting}
                onClick={handleReport}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer"
              >
                {isReporting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
