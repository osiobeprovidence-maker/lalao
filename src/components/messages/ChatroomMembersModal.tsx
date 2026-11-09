import React, { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { Check, UserPlus, X } from 'lucide-react';
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
  groupId: string;
  onlineOnly: boolean;
  currentUserId?: string;
  onClose: () => void;
  onOpenProfile: (member: ChatroomMember) => void;
}

export const ChatroomMembersModal: React.FC<ChatroomMembersModalProps> = ({
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

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="chatroom-members-title"
        className="flex max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-theme-divider bg-theme-surface shadow-2xl sm:rounded-2xl"
      >
        <header className="flex items-center justify-between border-b border-theme-divider px-4 py-3">
          <div>
            <h2 id="chatroom-members-title" className="font-bold text-theme-primary">
              {onlineOnly ? 'Online members' : 'Room members'}
            </h2>
            <p className="text-xs text-theme-tertiary">
              {members === undefined ? 'Loading members…' : members === null ? 'Member list unavailable' : `${members.length} ${onlineOnly ? 'online' : 'members'}`}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close member list" className="rounded-full p-2 text-theme-secondary hover:bg-theme-surface-hover">
            <X size={18} />
          </button>
        </header>

        {error && <p role="alert" className="mx-4 mt-3 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-400">{error}</p>}
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {members === undefined ? (
            <p role="status" className="p-6 text-center text-sm text-theme-tertiary">Loading members…</p>
          ) : members === null ? (
            <p role="alert" className="p-6 text-center text-sm text-theme-tertiary">You need to be a room member to view its members.</p>
          ) : members.length === 0 ? (
            <p className="p-6 text-center text-sm text-theme-tertiary">{onlineOnly ? 'No members are online right now.' : 'This room has no members yet.'}</p>
          ) : members.map((member) => {
            const memberId = member.id.toString();
            const isSelf = memberId === currentUserId;
            const isFollowing = member.isFollowing || followingIds.has(memberId);
            const isConnected = member.relationship === 'friends';
            const isPending = pendingIds.has(memberId);

            return (
              <article key={memberId} className="flex min-w-0 items-center gap-3 rounded-xl px-2 py-3 hover:bg-theme-surface-hover">
                <button type="button" onClick={() => onOpenProfile(member)} className="relative shrink-0" aria-label={`View ${member.username}'s profile`}>
                  <img src={member.avatar || '/icon-192.png'} alt="" className="h-11 w-11 rounded-full bg-theme-base object-cover" />
                  <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-theme-surface ${member.isOnline ? 'bg-emerald-500' : 'bg-neutral-500'}`} aria-label={member.isOnline ? 'Online' : 'Offline'} />
                </button>
                <div className="min-w-0 flex-1">
                  <button type="button" onClick={() => onOpenProfile(member)} className="flex max-w-full items-center gap-1 text-left">
                    <span className="truncate text-sm font-semibold text-theme-primary">{member.name}</span>
                    {member.isVerified && <VerificationBadge user={{ isVerified: true, verificationTier: member.verificationTier }} size="xs" />}
                  </button>
                  <p className="truncate text-xs text-theme-tertiary">@{member.username} · {member.isOnline ? 'Online' : 'Offline'}</p>
                </div>
                {!isSelf && (
                  <button
                    type="button"
                    onClick={() => void followMember(member)}
                    disabled={isFollowing || isConnected || isPending}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-theme-divider px-2.5 py-1.5 text-xs font-semibold text-theme-primary disabled:cursor-default disabled:opacity-70"
                  >
                    {isConnected ? <><Check size={13} /> Connected</> : isFollowing ? <><Check size={13} /> Following</> : isPending ? 'Following…' : <><UserPlus size={13} /> {member.relationship === 'follower' ? 'Follow back' : 'Follow'}</>}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};
