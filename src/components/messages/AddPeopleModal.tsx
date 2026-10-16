import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  Search,
  X,
  MessageSquare,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';
import { VerificationBadge } from '../common/VerificationBadge';
import { getPublicIdentityLabel } from '../common/UserIdentity';
import { User } from '../../types';

interface AddPeopleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddPeopleModal: React.FC<AddPeopleModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    messageContacts,
    conversations,
    openChatWithUser,
  } = useLalao();

  const [searchQuery, setSearchQuery] = useState('');

  // Combine known message contacts and active conversation participants
  const availablePeople = useMemo(() => {
    const map = new Map<string, User>();

    // 1. Add message contacts (friends/mutuals)
    (messageContacts || []).forEach((c) => {
      if (c.id !== currentUser?.id) {
        map.set(c.id, c);
      }
    });

    // 2. Add conversation participants
    (conversations || []).forEach((conv) => {
      if (conv.participant && conv.participant.id !== currentUser?.id) {
        if (!map.has(conv.participant.id)) {
          map.set(conv.participant.id, conv.participant);
        }
      }
    });

    const list = Array.from(map.values());

    if (!searchQuery.trim()) {
      return list;
    }

    const q = searchQuery.toLowerCase().trim();
    return list.filter((user) => {
      const matchName = user.name?.toLowerCase().includes(q);
      const matchUsername = user.username?.toLowerCase().includes(q);
      const matchBio = user.bio?.toLowerCase().includes(q);
      const matchLoc = user.location?.toLowerCase().includes(q);
      return matchName || matchUsername || matchBio || matchLoc;
    });
  }, [messageContacts, conversations, currentUser, searchQuery]);

  const existingConvoUserIds = useMemo(() => {
    return new Set(conversations.map((c) => c.participant?.id));
  }, [conversations]);

  if (!isOpen) return null;

  const handleStartChat = (user: User) => {
    openChatWithUser(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-md bg-[#F8F3EC] dark:bg-[#141414] rounded-t-3xl sm:rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[750px] overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
      >
        {/* Grabber indicator for mobile */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-black/15 dark:bg-white/20" />
        </div>

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#5E43F3]/10 flex items-center justify-center text-[#5E43F3]">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-theme-primary leading-tight font-sans">
                Add People
              </h2>
              <p className="text-xs text-theme-tertiary mt-0.5">
                Find people to start a chat.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-black/[0.04] dark:border-white/[0.06] shrink-0">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-theme-secondary absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people by name or @username..."
              className="w-full pl-10 pr-9 py-2.5 rounded-full bg-theme-surface dark:bg-[#181818] hover:bg-theme-surface-hover focus:bg-theme-base focus:ring-2 focus:ring-[#5E43F3]/20 focus:border-[#5E43F3] border border-black/[0.06] dark:border-white/[0.06] text-sm text-theme-primary placeholder:text-theme-secondary transition-all outline-none"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-1 rounded-full text-theme-tertiary hover:text-theme-secondary cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* People List */}
        <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-black/[0.04] dark:divide-white/[0.06]">
          <div className="px-4 pt-3 pb-1 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-theme-tertiary">
              {searchQuery ? 'Search Results' : 'Suggested People'}
            </span>
            <span className="text-[11px] text-theme-tertiary">
              {availablePeople.length} people
            </span>
          </div>

          {availablePeople.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-black/[0.03] dark:bg-white/[0.04] flex items-center justify-center text-theme-tertiary mb-3">
                <UserPlus className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-theme-primary">
                {searchQuery ? `No results for "${searchQuery}"` : 'No people found'}
              </p>
              <p className="text-xs text-theme-tertiary mt-1 max-w-xs">
                {searchQuery
                  ? 'Try searching by their full display name or handle.'
                  : 'Connect with neighbors, follow creators, or join cycles to find people.'}
              </p>
            </div>
          ) : (
            availablePeople.map((user) => {
              const hasExistingChat = existingConvoUserIds.has(user.id);

              return (
                <div
                  key={user.id}
                  className="p-3.5 sm:px-4 flex items-center justify-between hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar
                      src={user.avatar}
                      alt={user.name}
                      size="md"
                      online={user.isOnline}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-theme-primary truncate">
                          {getPublicIdentityLabel(user)}
                        </span>
                        <VerificationBadge user={user} size="xs" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-theme-tertiary mt-0.5">
                        <span className="truncate">@{user.username}</span>
                        {user.location && (
                          <>
                            <span>•</span>
                            <span className="truncate flex items-center gap-0.5">
                              <MapPin className="w-3 h-3 text-[#5E43F3]" />
                              {user.location.replace(/\s*\(Detected\)\s*/i, '').replace(/^GPS Detected$/i, '')}
                            </span>
                          </>
                        )}
                      </div>
                      {user.bio && (
                        <p className="text-[11px] text-theme-secondary truncate mt-1">
                          {user.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStartChat(user)}
                    className={`ml-3 px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                      hasExistingChat
                        ? 'bg-theme-surface-hover dark:bg-[#202020] text-theme-primary border border-theme-divider hover:border-theme-divider-strong'
                        : 'bg-[#5E43F3] hover:bg-[#4E34E0] text-white'
                    }`}
                  >
                    {hasExistingChat ? (
                      <>
                        <MessageSquare className="w-3.5 h-3.5" />
                        Chat
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        Add
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
