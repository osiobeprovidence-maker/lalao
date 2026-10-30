import React, { useState } from 'react';
import {
  ArrowLeft,
  Users,
  Shield,
  Lock,
  Globe,
  Eye,
  MessageCircle,
  Settings,
  Share2,
  Check,
  UserPlus,
  Calendar,
  Image as ImageIcon,
  Flame,
  Plus,
  AlertCircle,
  LogOut,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { PostItem } from '../feed/PostItem';
import { PostComposer } from '../create/PostComposer';
import { ManageGroupModal } from './ManageGroupModal';

export const GroupProfileView: React.FC = () => {
  const {
    activeGroupId,
    setActiveGroupId,
    setActiveChatId,
    setActiveTab,
    triggerShareToast,
    showAuthPrompt,
    isManageGroupOpen,
    setIsManageGroupOpen,
  } = useLalao();

  const { isAuthenticated } = useAuth();

  const [activeTabName, setActiveTabName] = useState<'posts' | 'media' | 'rallies' | 'about'>('posts');
  const [isRulesExpanded, setIsRulesExpanded] = useState(false);
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);

  const group = useQuery(
    api.groups.getGroup,
    activeGroupId ? { groupId: activeGroupId } : 'skip'
  );

  const groupPosts = useQuery(
    api.groups.getGroupPosts,
    activeGroupId && group && !group.isRestrictedPreview && group.communityEnabled
      ? { groupId: activeGroupId }
      : 'skip'
  );

  const groupRallies = useQuery(
    api.groups.getGroupRallies,
    activeGroupId && group && !group.isRestrictedPreview && group.communityEnabled
      ? { groupId: activeGroupId }
      : 'skip'
  );

  const requestToJoinMutation = useMutation(api.groups.requestToJoin);
  const leaveGroupMutation = useMutation(api.groups.leaveGroup);
  const toggleFollowMutation = useMutation(api.groups.toggleFollow);

  if (!activeGroupId) return null;

  if (group === undefined) {
    return (
      <div className="fixed inset-0 z-50 bg-theme-base flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#5E43F3] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (group === null) {
    return (
      <div className="fixed inset-0 z-50 bg-theme-base flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-lg font-black text-theme-primary mb-1">Group Not Found</h2>
        <p className="text-xs text-theme-tertiary text-center max-w-xs mb-6">
          This group may have been removed or is hidden.
        </p>
        <button
          onClick={() => setActiveGroupId(null)}
          className="px-6 py-2.5 rounded-xl bg-theme-surface border border-theme-divider text-xs font-bold text-theme-primary cursor-pointer hover:bg-theme-surface-hover"
        >
          Go Back
        </button>
      </div>
    );
  }

  const handleBack = () => {
    setActiveGroupId(null);
  };

  const handleOpenChat = () => {
    if (group.conversationId) {
      setActiveChatId(group.conversationId);
      setActiveGroupId(null);
      setActiveTab('messages');
    }
  };

  const handleJoin = async () => {
    if (!isAuthenticated) {
      showAuthPrompt('Sign in to join this group');
      return;
    }

    setIsSubmittingJoin(true);
    try {
      const res = await requestToJoinMutation({ groupId: activeGroupId });
      if (res.status === 'joined') {
        triggerShareToast(group?.isChatroom ? 'You joined the chatroom!' : 'You joined the group!');
        if (res.conversationId) {
          setActiveChatId(res.conversationId);
        } else if (group?.conversationId) {
          setActiveChatId(group.conversationId);
        }
      } else {
        triggerShareToast('Join request sent to group admins');
      }
    } catch (err: any) {
      triggerShareToast(err?.message || 'Could not join group');
    } finally {
      setIsSubmittingJoin(false);
    }
  };

  const handleLeave = async () => {
    const isChatroom = group?.isChatroom;
    if (window.confirm(isChatroom ? 'Are you sure you want to leave this chatroom? It will be removed from your Messages inbox.' : 'Are you sure you want to leave this group?')) {
      try {
        await leaveGroupMutation({ groupId: activeGroupId });
        triggerShareToast(isChatroom ? 'You left the chatroom' : 'You left the group');
        // Clear active chat if it was open
        setActiveChatId(null);
      } catch (err: any) {
        triggerShareToast(err?.message || 'Could not leave group');
      }
    }
  };

  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      showAuthPrompt('Sign in to follow this group');
      return;
    }

    try {
      const res = await toggleFollowMutation({ groupId: activeGroupId });
      triggerShareToast(res.isFollowing ? 'Following group updates' : 'Unfollowed group');
    } catch (err: any) {
      triggerShareToast(err?.message || 'Error updating follow status');
    }
  };

  const canPost =
    group.isMember &&
    group.communityEnabled &&
    group.communityFeatures?.posts &&
    (group.publishingPermissions?.canPost === 'all_members' || group.isAdmin);

  return (
    <div className="fixed inset-0 z-50 bg-theme-base overflow-y-auto flex flex-col">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-30 bg-theme-base/90 backdrop-blur-md border-b border-theme-divider px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleBack}
            className="p-1.5 -ml-1 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-surface transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-black text-theme-primary truncate">
              {group.name}
            </h1>
            <p className="text-[11px] text-theme-tertiary font-medium truncate">
              @{group.username} · {group.memberCount} members
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {group.isAdmin && (
            <button
              onClick={() => setIsManageGroupOpen(true)}
              className="px-3 py-1.5 rounded-full bg-[#5E43F3]/10 hover:bg-[#5E43F3]/20 text-[#5E43F3] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Manage</span>
            </button>
          )}

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: group.name,
                  text: group.description,
                  url: window.location.href,
                }).catch(() => {});
              } else {
                navigator.clipboard.writeText(window.location.href);
                triggerShareToast('Group link copied to clipboard');
              }
            }}
            className="p-2 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-surface transition-colors cursor-pointer"
            aria-label="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-2xl mx-auto pb-24">
        {/* Banner Cover Image */}
        <div className="relative w-full h-36 sm:h-48 bg-gradient-to-r from-indigo-900 via-purple-900 to-[#5E43F3] overflow-hidden">
          {group.coverImage && (
            <img
              src={group.coverImage}
              alt={group.name}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        {/* Group Identity Card */}
        <div className="px-4 -mt-12 sm:-mt-14 relative z-10 space-y-4">
          <div className="flex items-end justify-between gap-3">
            <Avatar
              src={group.avatarUrl}
              alt={group.name}
              size="xl"
              className="w-24 h-24 sm:w-28 sm:h-28 ring-4 ring-theme-base shadow-xl rounded-3xl"
            />

            {/* Main Action Buttons */}
            <div className="flex items-center gap-2 mb-2 flex-wrap justify-end">
              {group.isMember ? (
                <>
                  <button
                    onClick={handleOpenChat}
                    className="px-4 py-2 rounded-full bg-[#5E43F3] text-white text-xs font-black shadow-md shadow-[#5E43F3]/20 hover:bg-[#4E34E0] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat</span>
                  </button>
                  <button
                    onClick={handleLeave}
                    className="px-3 py-2 rounded-full bg-theme-surface hover:bg-rose-500/10 text-rose-500 text-xs font-bold border border-theme-divider transition-colors flex items-center gap-1 cursor-pointer"
                    title="Leave Group"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Leave</span>
                  </button>
                </>
              ) : group.isPendingRequest ? (
                <button
                  disabled
                  className="px-4 py-2 rounded-full bg-theme-surface border border-theme-divider text-theme-tertiary text-xs font-bold cursor-default"
                >
                  Requested
                </button>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={isSubmittingJoin}
                  className="px-5 py-2 rounded-full bg-[#5E43F3] text-white text-xs font-black shadow-md shadow-[#5E43F3]/20 hover:bg-[#4E34E0] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{group.visibility === 'public' ? 'Join Group' : 'Request to Join'}</span>
                </button>
              )}

              {/* Follow button (distinct from membership) */}
              <button
                onClick={handleToggleFollow}
                className={`px-3.5 py-2 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                  group.isFollower
                    ? 'bg-theme-surface border-theme-divider text-theme-secondary hover:text-theme-primary'
                    : 'bg-theme-surface border-theme-divider text-theme-primary hover:border-[#5E43F3]'
                }`}
              >
                {group.isFollower ? 'Following' : 'Follow'}
              </button>
            </div>
          </div>

          {/* Group Name & Bio */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-theme-primary font-sans">
                {group.name}
              </h2>
              {group.isChatroom && (
                <span className="px-2 py-0.5 rounded-full bg-[#5E43F3] text-white text-[10px] font-black uppercase tracking-wider">
                  CHATROOM
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] text-[10px] font-black uppercase tracking-wider">
                {group.category}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-theme-surface text-theme-secondary text-[10px] font-bold border border-theme-divider flex items-center gap-1">
                {group.visibility === 'public' ? (
                  <>
                    <Globe className="w-3 h-3 text-emerald-500" />
                    <span>Public</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3 text-amber-500" />
                    <span>Private</span>
                  </>
                )}
              </span>
            </div>

            <p className="text-xs text-theme-tertiary font-mono mt-0.5">
              @{group.username}
            </p>

            {group.creator && (
              <div className="flex items-center gap-2 mt-2 pt-1">
                <span className="text-[11px] text-theme-tertiary">Created by</span>
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-theme-surface border border-theme-divider text-xs font-semibold text-theme-primary">
                  <Avatar src={group.creator.avatar} alt={group.creator.name} size="xs" />
                  <span>{group.creator.name}</span>
                  <span className="text-theme-tertiary font-mono text-[10px]">@{group.creator.username}</span>
                </div>
              </div>
            )}

            {group.description && (
              <p className="text-xs sm:text-sm text-theme-secondary mt-2.5 leading-relaxed whitespace-pre-wrap">
                {group.description}
              </p>
            )}
          </div>

          {/* Members / Followers Count Card */}
          <div className="flex items-center gap-4 py-2 border-y border-theme-divider text-xs text-theme-secondary">
            <div>
              <strong className="text-theme-primary font-black mr-1">
                {group.memberCount}
              </strong>
              <span>members</span>
            </div>
            <div>
              <strong className="text-theme-primary font-black mr-1">
                {group.followersCount}
              </strong>
              <span>followers</span>
            </div>
          </div>

          {/* Group Rules Expandable Section */}
          {group.rules && group.rules.length > 0 && (
            <div className="bg-theme-surface rounded-2xl border border-theme-divider p-3.5">
              <button
                type="button"
                onClick={() => setIsRulesExpanded(!isRulesExpanded)}
                className="w-full flex items-center justify-between text-xs font-bold text-theme-primary cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#5E43F3]" />
                  <span>Group Rules ({group.rules.length})</span>
                </div>
                {isRulesExpanded ? (
                  <ChevronUp className="w-4 h-4 text-theme-tertiary" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-theme-tertiary" />
                )}
              </button>

              {isRulesExpanded && (
                <ul className="mt-3 space-y-1.5 text-xs text-theme-secondary pl-5 list-decimal border-t border-theme-divider pt-2.5">
                  {group.rules.map((rule: string, idx: number) => (
                    <li key={idx} className="leading-relaxed">
                      {rule}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* RESTRICTED PREVIEW STATE (Non-member on private group) */}
        {group.isRestrictedPreview ? (
          <div className="mt-8 px-4 text-center py-12 bg-theme-surface rounded-3xl border border-theme-divider mx-4">
            <Lock className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h3 className="text-sm font-black text-theme-primary">
              Private Group Content
            </h3>
            <p className="text-xs text-theme-tertiary mt-1.5 max-w-sm mx-auto">
              Conversations, posts, and member lists are strictly private to members of this group. Request to join above to participate.
            </p>
          </div>
        ) : group.communityEnabled ? (
          /* COMMUNITY TABS (When community features are enabled) */
          <div className="mt-6">
            {/* Tabs Bar */}
            <div className="flex border-b border-theme-divider px-4 gap-2">
              {group.communityFeatures?.posts && (
                <button
                  onClick={() => setActiveTabName('posts')}
                  className={`pb-2.5 px-3 text-xs font-black border-b-2 transition-all cursor-pointer ${
                    activeTabName === 'posts'
                      ? 'border-[#5E43F3] text-[#5E43F3]'
                      : 'border-transparent text-theme-tertiary hover:text-theme-secondary'
                  }`}
                >
                  Posts
                </button>
              )}

              {group.communityFeatures?.media && (
                <button
                  onClick={() => setActiveTabName('media')}
                  className={`pb-2.5 px-3 text-xs font-black border-b-2 transition-all cursor-pointer ${
                    activeTabName === 'media'
                      ? 'border-[#5E43F3] text-[#5E43F3]'
                      : 'border-transparent text-theme-tertiary hover:text-theme-secondary'
                  }`}
                >
                  Media
                </button>
              )}

              {group.communityFeatures?.rallies && (
                <button
                  onClick={() => setActiveTabName('rallies')}
                  className={`pb-2.5 px-3 text-xs font-black border-b-2 transition-all cursor-pointer ${
                    activeTabName === 'rallies'
                      ? 'border-[#5E43F3] text-[#5E43F3]'
                      : 'border-transparent text-theme-tertiary hover:text-theme-secondary'
                  }`}
                >
                  Rallies
                </button>
              )}

              <button
                onClick={() => setActiveTabName('about')}
                className={`pb-2.5 px-3 text-xs font-black border-b-2 transition-all cursor-pointer ${
                  activeTabName === 'about'
                    ? 'border-[#5E43F3] text-[#5E43F3]'
                    : 'border-transparent text-theme-tertiary hover:text-theme-secondary'
                }`}
              >
                About
              </button>
            </div>

            {/* TAB: POSTS */}
            {activeTabName === 'posts' && group.communityFeatures?.posts && (
              <div className="p-4 space-y-4">
                {/* Post Composer if member can post */}
                {canPost && (
                  <div className="bg-theme-surface rounded-2xl border border-theme-divider p-3.5 shadow-xs">
                    <PostComposer
                      groupRefId={activeGroupId}
                      placeholder={`Share an update in ${group.name}...`}
                    />
                  </div>
                )}

                {/* Posts Feed */}
                <div className="space-y-3">
                  {!groupPosts || groupPosts.length === 0 ? (
                    <div className="text-center py-10 px-4 bg-theme-surface rounded-2xl border border-theme-divider text-xs text-theme-tertiary">
                      No posts shared in this group yet.
                    </div>
                  ) : (
                    groupPosts.map((post: any) => (
                      <PostItem key={post.id} post={post} />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: MEDIA */}
            {activeTabName === 'media' && group.communityFeatures?.media && (
              <div className="p-4">
                {(() => {
                  const mediaPosts = (groupPosts || []).filter(
                    (p: any) => p.mediaUrl || p.mediaStorageId
                  );
                  if (mediaPosts.length === 0) {
                    return (
                      <div className="text-center py-10 px-4 bg-theme-surface rounded-2xl border border-theme-divider text-xs text-theme-tertiary">
                        No photos or videos uploaded in this group yet.
                      </div>
                    );
                  }
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {mediaPosts.map((post: any) => (
                        <div
                          key={post.id}
                          className="aspect-square rounded-2xl overflow-hidden bg-black/10 relative group"
                        >
                          <img
                            src={post.mediaUrl}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAB: RALLIES */}
            {activeTabName === 'rallies' && group.communityFeatures?.rallies && (
              <div className="p-4 space-y-3">
                {!groupRallies || groupRallies.length === 0 ? (
                  <div className="text-center py-10 px-4 bg-theme-surface rounded-2xl border border-theme-divider text-xs text-theme-tertiary">
                    No active rallies in this group right now.
                  </div>
                ) : (
                  groupRallies.map((rally: any) => (
                    <div
                      key={rally.id}
                      className="p-4 rounded-2xl bg-theme-surface border border-theme-divider space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] text-[10px] font-black uppercase">
                          {rally.type || 'Rally'}
                        </span>
                        <span className="text-xs text-theme-tertiary font-mono">
                          {rally.eventDate || ''} {rally.eventTime || ''}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-theme-primary">
                        {rally.title}
                      </h4>
                      <p className="text-xs text-theme-secondary">
                        {rally.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: ABOUT */}
            {activeTabName === 'about' && (
              <div className="p-4 space-y-4">
                <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider space-y-2 text-xs text-theme-secondary">
                  <div className="flex items-center gap-2 text-theme-primary font-bold">
                    <span>About {group.name}</span>
                  </div>
                  <p className="leading-relaxed">
                    {group.description || 'No description provided.'}
                  </p>
                  <div className="pt-2 border-t border-theme-divider text-[11px] text-theme-tertiary">
                    Created on {new Date(group.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* MESSAGING-ONLY GROUP VIEW (No empty community tabs!) */
          <div className="mt-8 px-4">
            <div className="p-5 rounded-3xl bg-theme-surface border border-theme-divider text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center mx-auto">
                <MessageCircle className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-theme-primary">
                  Private Group Messaging
                </h3>
                <p className="text-xs text-theme-tertiary mt-1 max-w-sm mx-auto">
                  This group is dedicated to collaborative private messaging. Group conversations remain protected and accessible only to invited members.
                </p>
              </div>

              {group.isMember && (
                <button
                  onClick={handleOpenChat}
                  className="mt-2 px-6 py-2.5 rounded-full bg-[#5E43F3] text-white text-xs font-black shadow-md shadow-[#5E43F3]/20 hover:bg-[#4E34E0] transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Open Group Chat</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Admin Management Modal */}
      {isManageGroupOpen && (
        <ManageGroupModal
          groupId={activeGroupId}
          isOpen={isManageGroupOpen}
          onClose={() => setIsManageGroupOpen(false)}
        />
      )}
    </div>
  );
};
