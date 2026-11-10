import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { ArrowLeft, Check, UserPlus, Users, X } from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';
import { api } from '../../../convex/_generated/api';
import type { VerificationTier } from '../../types';
import { VerificationBadge } from '../common/VerificationBadge';

export interface ChatroomMember {
  id: Id<'users'>;
  name: string;
  username: string;
  avatar: string;
  isOnline: boolean;
  isVerified: boolean;
  verificationTier: VerificationTier;
  isFollowing: boolean;
  relationship: 'none' | 'following' | 'follower' | 'friends';
}

interface ChatroomMembersModalProps {
  isOpen?: boolean;
  groupId: string;
  onlineOnly: boolean;
  currentUserId?: string;
  onClose: () => void;
  onOpenProfile: (member: ChatroomMember) => void;
}

export const ChatroomMembersModal: React.FC<ChatroomMembersModalProps> = ({
  isOpen = true,
  groupId,
  onlineOnly,
  currentUserId,
  onClose,
  onOpenProfile,
}) => {
  const members = useQuery(api.groups.listChatroomMembers, { groupId, onlineOnly }) as ChatroomMember[] | null | undefined;
  const toggleFollow = useMutation(api.social.toggleFollowUser);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Android back button / popstate handling (mirrors ShoppingHistoryScreen)
  useEffect(() => {
    if (!isOpen) return;

    window.history.pushState({ modal: 'room_members' }, '');

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose]);

  const handleBack = () => {
    if (window.history.state?.modal === 'room_members') {
      window.history.back();
    } else {
      onClose();
    }
  };

  const followMember = async (member: ChatroomMember) => {
    const id = member.id.toString();
    if (member.isFollowing || followingIds.has(id) || pendingIds.has(id)) return;
    setPendingIds((current) => new Set(current).add(id));
    setError(null);
    try {
      await toggleFollow({ targetUserId: member.id });
      setFollowingIds((current) => new Set(current).add(id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not follow this member.');
    } finally {
      setPendingIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="room-members-overlay"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="room-members-container"
        className="bg-theme-surface w-full sm:max-w-md md:max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 relative z-10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - follows Shopping History pattern */}
        <header className="px-4 sm:px-5 py-4 border-b border-theme-divider-light bg-theme-surface sticky top-0 z-20 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                id="btn-back-room-members"
                type="button"
                onClick={handleBack}
                className="p-1.5 -ml-1 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover active:scale-95 transition-all cursor-pointer"
                title="Back"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
              <div>
                <h2 className="text-base font-bold text-theme-primary flex items-center gap-2 leading-tight">
                  <span>{onlineOnly ? 'Online Members' : 'Room Members'}</span>
                  {members !== undefined && members !== null && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-theme-surface-hover text-theme-secondary">
                      {members.length}
                    </span>
                  )}
                </h2>
                <p className="text-[11px] text-theme-tertiary">
                  {members === undefined
                    ? 'Loading members...'
                    : members === null
                      ? 'Member list unavailable'
                      : `${members.length} ${onlineOnly ? 'online' : 'members'} in this room`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                id="btn-close-room-members"
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-theme-tertiary hover:text-theme-secondary hover:bg-theme-surface-hover transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {error && (
          <p role="alert" className="mx-4 mt-3 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-400">
            {error}
          </p>
        )}

        {/* Member List / Independent Scroll - follows Shopping History container style */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {members === undefined ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-[#5E43F3] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-theme-tertiary">Loading members...</p>
            </div>
          ) : members === null ? (
            <div className="py-16 px-6 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-theme-surface-hover flex items-center justify-center text-theme-tertiary mb-1">
                <Users className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-bold text-theme-primary">Access Restricted</h3>
              <p className="text-xs text-theme-tertiary max-w-xs leading-relaxed">
                You need to be a room member to view its members.
              </p>
            </div>
          ) : members.length === 0 ? (
            <div className="py-16 px-6 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-theme-surface-hover flex items-center justify-center text-theme-tertiary mb-1">
                <Users className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-bold text-theme-primary">
                {onlineOnly ? 'No members online' : 'No members yet'}
              </h3>
              <p className="text-xs text-theme-tertiary max-w-xs leading-relaxed">
                {onlineOnly
                  ? 'No members are online in this room right now.'
                  : 'This room has no members yet.'}
              </p>
            </div>
          ) : (
            members.map((member) => {
              const memberId = member.id.toString();
              const isSelf = memberId === currentUserId;
              const isFollowing = member.isFollowing || followingIds.has(memberId);
              const isConnected = member.relationship === 'friends';
              const isPending = pendingIds.has(memberId);

              return (
                <article
                  key={memberId}
                  className="flex min-w-0 items-center gap-3 rounded-2xl border border-theme-divider/90 bg-theme-surface p-3.5 hover:border-[#5E43F3]/50 hover:shadow-md transition-all group"
                >
                  <button
                    type="button"
                    onClick={() => onOpenProfile(member)}
                    className="relative shrink-0 cursor-pointer"
                    aria-label={`View ${member.username}'s profile`}
                  >
                    <img
                      src={member.avatar || '/icon-192.png'}
                      alt=""
                      className="h-11 w-11 rounded-full bg-theme-base object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-theme-surface ${
                        member.isOnline ? 'bg-emerald-500' : 'bg-neutral-500'
                      }`}
                      aria-label={member.isOnline ? 'Online' : 'Offline'}
                    />
                  </button>
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onOpenProfile(member)}
                      className="flex max-w-full items-center gap-1.5 text-left cursor-pointer"
                    >
                      <span className="truncate text-sm font-semibold text-theme-primary group-hover:text-[#5E43F3] transition-colors">
                        {member.name}
                      </span>
                      {member.isVerified && (
                        <VerificationBadge
                          user={{ isVerified: true, verificationTier: member.verificationTier }}
                          size="xs"
                        />
                      )}
                    </button>
                    <p className="truncate text-xs text-theme-tertiary">
                      @{member.username} · {member.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                  {!isSelf && (
                    <button
                      type="button"
                      onClick={() => void followMember(member)}
                      disabled={isFollowing || isConnected || isPending}
                      className={`inline-flex shrink-0 items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                        isConnected || isFollowing
                          ? 'border border-theme-divider bg-theme-surface-hover text-theme-secondary opacity-80 cursor-default'
                          : isPending
                            ? 'border border-[#5E43F3]/30 bg-[#5E43F3]/10 text-[#5E43F3] cursor-wait'
                            : 'bg-[#5E43F3] hover:bg-[#4E34E0] active:scale-95 text-white shadow-xs'
                      }`}
                    >
                      {isConnected ? (
                        <>
                          <Check size={13} /> Connected
                        </>
                      ) : isFollowing ? (
                        <>
                          <Check size={13} /> Following
                        </>
                      ) : isPending ? (
                        'Following...'
                      ) : (
                        <>
                          <UserPlus size={13} />{' '}
                          {member.relationship === 'follower' ? 'Follow back' : 'Follow'}
                        </>
                      )}
                    </button>
                  )}
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
