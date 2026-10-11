import React, { useState } from 'react';
import {
  X,
  Shield,
  Eye,
  Lock,
  Globe,
  Users,
  Settings,
  Sparkles,
  BarChart3,
  UserCheck,
  UserPlus,
  Trash2,
  Check,
  AlertTriangle,
  Crown,
  ChevronRight,
  MessageCircle,
  FileText,
  Image as ImageIcon,
  Flame,
  Plus,
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';
import { VerificationBadge } from '../common/VerificationBadge';

interface ManageGroupModalProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
}

type ManageTab = 'profile' | 'privacy' | 'community' | 'permissions' | 'members' | 'requests' | 'insights';

export const ManageGroupModal: React.FC<ManageGroupModalProps> = ({
  groupId,
  isOpen,
  onClose,
}) => {
  const { triggerShareToast } = useLalao();

  const [activeTab, setActiveTab] = useState<ManageTab>('profile');

  // Queries
  const group = useQuery(api.groups.getGroup, { groupId });
  const members = useQuery(api.groups.getGroupMembers, { groupId }) || [];
  const joinRequests = useQuery(api.groups.getGroupJoinRequests, { groupId }) || [];
  const analytics = useQuery(api.groups.getGroupAnalytics, { groupId });

  // Mutations
  const updateProfileMutation = useMutation(api.groups.updateGroupProfile);
  const updatePrivacyMutation = useMutation(api.groups.updateGroupPrivacy);
  const updateCommunityMutation = useMutation(api.groups.updateCommunitySettings);
  const reviewJoinRequestMutation = useMutation(api.groups.reviewJoinRequest);
  const inviteMemberMutation = useMutation(api.groups.inviteMember);
  const updateRoleMutation = useMutation(api.groups.updateMemberRole);
  const transferOwnershipMutation = useMutation(api.groups.transferOwnership);
  const removeMemberMutation = useMutation(api.groups.removeMember);

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [rules, setRules] = useState<string[]>([]);
  const [newRule, setNewRule] = useState('');

  // Privacy states
  const [visibility, setVisibility] = useState<'public' | 'private_discoverable' | 'private_hidden'>('private_discoverable');
  const [showPrivacyConfirmDialog, setShowPrivacyConfirmDialog] = useState(false);

  // Community feature states
  const [communityEnabled, setCommunityEnabled] = useState(false);
  const [postsEnabled, setPostsEnabled] = useState(true);
  const [repliesEnabled, setRepliesEnabled] = useState(true);
  const [mediaEnabled, setMediaEnabled] = useState(true);
  const [ralliesEnabled, setRalliesEnabled] = useState(true);

  // Permissions states
  const [canPost, setCanPost] = useState('all_members');
  const [canReply, setCanReply] = useState('all_members');
  const [canUploadMedia, setCanUploadMedia] = useState('all_members');
  const [canCreateRallies, setCanCreateRallies] = useState('all_members');

  // Member invite & transfer states
  const [inviteUserId, setInviteUserId] = useState('');
  const [transferTargetUserId, setTransferTargetUserId] = useState<string | null>(null);

  // Initialize form state when group loads
  React.useEffect(() => {
    if (group) {
      setName(group.name || '');
      setUsername(group.username || '');
      setDescription(group.description || '');
      setCategory(group.category || 'General');
      setRules(group.rules || []);
      setVisibility(group.visibility || 'private_discoverable');
      setCommunityEnabled(group.communityEnabled || false);
      setPostsEnabled(group.communityFeatures?.posts ?? true);
      setRepliesEnabled(group.communityFeatures?.replies ?? true);
      setMediaEnabled(group.communityFeatures?.media ?? true);
      setRalliesEnabled(group.communityFeatures?.rallies ?? true);
      setCanPost(group.publishingPermissions?.canPost || 'all_members');
      setCanReply(group.publishingPermissions?.canReply || 'all_members');
      setCanUploadMedia(group.publishingPermissions?.canUploadMedia || 'all_members');
      setCanCreateRallies(group.publishingPermissions?.canCreateRallies || 'all_members');
    }
  }, [group]);

  if (!isOpen || !group) return null;

  // Handlers
  const handleSaveProfile = async () => {
    try {
      await updateProfileMutation({
        groupId,
        name: name.trim(),
        username: username.trim(),
        description: description.trim(),
        category: category.trim(),
        rules,
      });
      triggerShareToast('Group profile updated successfully');
    } catch (err: any) {
      triggerShareToast(err?.message || 'Failed to update group profile');
    }
  };

  const handleApplyPrivacy = async (targetVis: typeof visibility, confirmed: boolean = false) => {
    if (group.visibility !== 'public' && targetVis === 'public' && !confirmed) {
      setShowPrivacyConfirmDialog(true);
      return;
    }

    try {
      await updatePrivacyMutation({
        groupId,
        visibility: targetVis,
        confirmTransition: true,
      });
      setVisibility(targetVis);
      setShowPrivacyConfirmDialog(false);
      triggerShareToast('Privacy mode updated');
    } catch (err: any) {
      triggerShareToast(err?.message || 'Failed to change privacy mode');
    }
  };

  const handleSaveCommunity = async () => {
    try {
      await updateCommunityMutation({
        groupId,
        communityEnabled,
        communityFeatures: {
          posts: postsEnabled,
          replies: repliesEnabled,
          media: mediaEnabled,
          rallies: ralliesEnabled,
        },
        publishingPermissions: {
          canPost,
          canReply,
          canUploadMedia,
          canCreateRallies,
        },
      });
      triggerShareToast('Community settings updated');
    } catch (err: any) {
      triggerShareToast(err?.message || 'Failed to save community settings');
    }
  };

  const handleReviewRequest = async (requestId: any, action: 'approve' | 'reject') => {
    try {
      await reviewJoinRequestMutation({ requestId, action });
      triggerShareToast(`Request ${action}d`);
    } catch (err: any) {
      triggerShareToast(err?.message || 'Error reviewing request');
    }
  };

  const handleInvite = async () => {
    if (!inviteUserId.trim()) return;
    try {
      await inviteMemberMutation({ groupId, userId: inviteUserId.trim() });
      setInviteUserId('');
      triggerShareToast('Member invited to group');
    } catch (err: any) {
      triggerShareToast(err?.message || 'Error inviting member');
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'moderator' | 'member') => {
    try {
      await updateRoleMutation({ groupId, userId, newRole });
      triggerShareToast(`Member role updated to ${newRole}`);
    } catch (err: any) {
      triggerShareToast(err?.message || 'Error changing role');
    }
  };

  const handleTransferOwnership = async () => {
    if (!transferTargetUserId) return;
    if (window.confirm('Are you sure you want to transfer group ownership? You will become an Admin.')) {
      try {
        await transferOwnershipMutation({ groupId, newOwnerUserId: transferTargetUserId });
        setTransferTargetUserId(null);
        triggerShareToast('Ownership transferred successfully');
      } catch (err: any) {
        triggerShareToast(err?.message || 'Failed to transfer ownership');
      }
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (window.confirm('Remove this member from the group?')) {
      try {
        await removeMemberMutation({ groupId, userId });
        triggerShareToast('Member removed from group');
      } catch (err: any) {
        triggerShareToast(err?.message || 'Failed to remove member');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl h-[92vh] sm:h-[85vh] bg-theme-base rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-theme-divider">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-theme-base/95 backdrop-blur-md border-b border-theme-divider px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-[#5E43F3]" />
            <div>
              <h2 className="text-base font-black text-theme-primary">Manage Group</h2>
              <p className="text-[11px] text-theme-tertiary">@{group.username} · {group.role?.toUpperCase()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-theme-surface text-theme-tertiary hover:text-theme-primary transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation bar */}
        <div className="flex border-b border-theme-divider px-3 bg-theme-surface overflow-x-auto no-scrollbar gap-1 shrink-0">
          {[
            { id: 'profile', label: 'Profile', icon: FileText },
            { id: 'privacy', label: 'Privacy', icon: Lock },
            { id: 'community', label: 'Community', icon: Sparkles },
            { id: 'permissions', label: 'Permissions', icon: Shield },
            { id: 'members', label: `Members (${members.length})`, icon: Users },
            { id: 'requests', label: `Requests (${joinRequests.length})`, icon: UserCheck },
            { id: 'insights', label: 'Insights', icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ManageTab)}
                className={`py-3 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'border-[#5E43F3] text-[#5E43F3]'
                    : 'border-transparent text-theme-tertiary hover:text-theme-secondary'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-theme-primary block mb-1.5">Group Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-theme-divider bg-theme-surface text-sm text-theme-primary outline-none focus:border-[#5E43F3]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-theme-primary block mb-1.5">Handle / Username</label>
                <div className="flex items-center px-3.5 py-2.5 rounded-xl border border-theme-divider bg-theme-surface text-sm text-theme-primary focus-within:border-[#5E43F3]">
                  <span className="text-theme-tertiary mr-1">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-transparent outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-theme-primary block mb-1.5">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Football, Gaming, Tech, Music"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-theme-divider bg-theme-surface text-sm text-theme-primary outline-none focus:border-[#5E43F3]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-theme-primary block mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-theme-divider bg-theme-surface text-sm text-theme-primary outline-none focus:border-[#5E43F3] resize-none"
                />
              </div>

              {/* Rules section */}
              <div>
                <label className="text-xs font-bold text-theme-primary block mb-1.5">Group Rules</label>
                <div className="space-y-2 mb-2">
                  {rules.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-theme-surface border border-theme-divider text-xs text-theme-secondary">
                      <span className="font-bold text-theme-tertiary">{idx + 1}.</span>
                      <span className="flex-1">{rule}</span>
                      <button
                        type="button"
                        onClick={() => setRules(rules.filter((_, i) => i !== idx))}
                        className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    placeholder="Add a new rule..."
                    className="flex-1 px-3 py-2 rounded-xl border border-theme-divider bg-theme-surface text-xs text-theme-primary outline-none focus:border-[#5E43F3]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newRule.trim()) {
                        setRules([...rules, newRule.trim()]);
                        setNewRule('');
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-theme-surface hover:bg-theme-surface-hover border border-theme-divider text-xs font-bold text-theme-primary cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveProfile}
                className="w-full py-2.5 rounded-xl bg-[#5E43F3] text-white text-xs font-black shadow-md shadow-[#5E43F3]/20 hover:bg-[#4E34E0] transition-colors cursor-pointer mt-4"
              >
                Save Profile Changes
              </button>
            </div>
          )}

          {/* TAB 2: PRIVACY */}
          {activeTab === 'privacy' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-black text-theme-primary">Group Discoverability & Visibility</h3>
                <p className="text-xs text-theme-tertiary mt-0.5">
                  Choose how your group appears across Lalao search and local feeds.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    id: 'public',
                    title: 'Public',
                    desc: 'Discoverable in search. Visitors can view public profile and approved public content. Group conversations remain strictly restricted to members.',
                    icon: Globe,
                  },
                  {
                    id: 'private_discoverable',
                    title: 'Private & Discoverable',
                    desc: 'Discoverable in search. Non-members see only basic metadata (name, photo, rules, member count). Posts, media, rallies and messages are strictly hidden. Users can request to join.',
                    icon: Eye,
                  },
                  {
                    id: 'private_hidden',
                    title: 'Private & Hidden',
                    desc: 'Excluded from public search and discovery. Accessible only via invitation or direct link. Profile details and content are strictly hidden from non-members.',
                    icon: Lock,
                  },
                ].map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = visibility === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => handleApplyPrivacy(mode.id as any)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#5E43F3] bg-[#5E43F3]/5 ring-1 ring-[#5E43F3]'
                          : 'border-theme-divider hover:border-theme-divider-strong bg-theme-surface'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-[#5E43F3] text-white' : 'bg-theme-surface-hover text-theme-secondary'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-theme-primary">{mode.title}</span>
                            {isSelected && <Check className="w-4 h-4 text-[#5E43F3] stroke-[3]" />}
                          </div>
                          <p className="text-xs text-theme-secondary mt-1 leading-relaxed">{mode.desc}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Warning Confirmation Dialog on Transitioning Private to Public */}
              {showPrivacyConfirmDialog && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-amber-600 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Confirm Transition to Public Group</span>
                  </div>
                  <p className="text-xs text-theme-secondary leading-relaxed">
                    Making this group Public will allow anyone on Lalao to find and view the group profile. Private member chat conversations will remain strictly protected and accessible only to members.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyPrivacy('public', true)}
                      className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors cursor-pointer"
                    >
                      Yes, make group public
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPrivacyConfirmDialog(false)}
                      className="px-4 py-2 rounded-xl bg-theme-surface border border-theme-divider text-xs font-bold text-theme-secondary cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COMMUNITY FEATURES */}
          {activeTab === 'community' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-black text-theme-primary">Community Page Functionality</h3>
                <p className="text-xs text-theme-tertiary mt-0.5">
                  Enable or disable community publishing features. When disabled, this group functions cleanly as a private messaging group without empty tabs.
                </p>
              </div>

              {/* Master toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-theme-surface border border-theme-divider">
                <div>
                  <span className="text-sm font-bold text-theme-primary block">Enable Community Page</span>
                  <span className="text-xs text-theme-tertiary">Allow members to publish posts, photos, and rallies.</span>
                </div>
                <input
                  type="checkbox"
                  checked={communityEnabled}
                  onChange={(e) => setCommunityEnabled(e.target.checked)}
                  className="w-5 h-5 accent-[#5E43F3] cursor-pointer"
                />
              </div>

              {/* Sub-feature toggles */}
              {communityEnabled && (
                <div className="space-y-3 pl-2 border-l-2 border-[#5E43F3]/30">
                  {[
                    { label: 'Posts Feed', desc: 'Members can share posts and text updates.', checked: postsEnabled, setChecked: setPostsEnabled },
                    { label: 'Comments & Replies', desc: 'Allow discussions and replies on posts.', checked: repliesEnabled, setChecked: setRepliesEnabled },
                    { label: 'Media Gallery', desc: 'Allow uploading photos and video attachments.', checked: mediaEnabled, setChecked: setMediaEnabled },
                    { label: 'Rallies', desc: 'Host meetups, community rallies, and calls to action.', checked: ralliesEnabled, setChecked: setRalliesEnabled },
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-theme-surface border border-theme-divider">
                      <div>
                        <span className="text-xs font-bold text-theme-primary block">{feat.label}</span>
                        <span className="text-[11px] text-theme-tertiary">{feat.desc}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={feat.checked}
                        onChange={(e) => feat.setChecked(e.target.checked)}
                        className="w-4 h-4 accent-[#5E43F3] cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveCommunity}
                className="w-full py-2.5 rounded-xl bg-[#5E43F3] text-white text-xs font-black shadow-md shadow-[#5E43F3]/20 hover:bg-[#4E34E0] transition-colors cursor-pointer mt-4"
              >
                Save Community Settings
              </button>
            </div>
          )}

          {/* TAB 4: PERMISSIONS */}
          {activeTab === 'permissions' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-black text-theme-primary">Publishing & Contribution Permissions</h3>
                <p className="text-xs text-theme-tertiary mt-0.5">
                  Control who is authorized to create posts, replies, media, and rallies.
                </p>
              </div>

              {[
                { title: 'Who can post?', state: canPost, setState: setCanPost },
                { title: 'Who can reply & comment?', state: canReply, setState: setCanReply },
                { title: 'Who can upload media?', state: canUploadMedia, setState: setCanUploadMedia },
                { title: 'Who can create rallies?', state: canCreateRallies, setState: setCanCreateRallies },
              ].map((perm, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-theme-surface border border-theme-divider space-y-2">
                  <span className="text-xs font-bold text-theme-primary block">{perm.title}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => perm.setState('all_members')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        perm.state === 'all_members'
                          ? 'border-[#5E43F3] bg-[#5E43F3]/10 text-[#5E43F3]'
                          : 'border-theme-divider text-theme-secondary hover:bg-theme-surface-hover'
                      }`}
                    >
                      All Members
                    </button>
                    <button
                      type="button"
                      onClick={() => perm.setState('admins_only')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        perm.state === 'admins_only'
                          ? 'border-[#5E43F3] bg-[#5E43F3]/10 text-[#5E43F3]'
                          : 'border-theme-divider text-theme-secondary hover:bg-theme-surface-hover'
                      }`}
                    >
                      Admins Only
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleSaveCommunity}
                className="w-full py-2.5 rounded-xl bg-[#5E43F3] text-white text-xs font-black shadow-md shadow-[#5E43F3]/20 hover:bg-[#4E34E0] transition-colors cursor-pointer mt-4"
              >
                Save Permissions
              </button>
            </div>
          )}

          {/* TAB 5: MEMBERS */}
          {activeTab === 'members' && (
            <div className="space-y-5">
              {/* Invite User Input */}
              <div>
                <label className="text-xs font-bold text-theme-primary block mb-1.5">Invite User by ID</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteUserId}
                    onChange={(e) => setInviteUserId(e.target.value)}
                    placeholder="Enter user Convex ID..."
                    className="flex-1 px-3 py-2 rounded-xl border border-theme-divider bg-theme-surface text-xs text-theme-primary outline-none focus:border-[#5E43F3]"
                  />
                  <button
                    type="button"
                    onClick={handleInvite}
                    className="px-4 py-2 rounded-xl bg-[#5E43F3] text-white text-xs font-bold hover:bg-[#4E34E0] transition-colors cursor-pointer"
                  >
                    Invite
                  </button>
                </div>
              </div>

              {/* Members List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-theme-primary block">Active Members ({members.length})</span>
                {members.map((member: any) => {
                  const isOwner = member.role === 'owner';
                  return (
                    <div
                      key={member.id}
                      className="p-3 rounded-2xl bg-theme-surface border border-theme-divider flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar src={member.avatar} alt={member.name} size="sm" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-theme-primary truncate">{member.name}</span>
                            <VerificationBadge user={member} size="xs" />
                          </div>
                          <span className="text-[10px] text-theme-tertiary">@{member.username}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Role selector for group owner */}
                        {group.isOwner && !isOwner ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value as any)}
                            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-theme-surface-hover border border-theme-divider text-theme-primary outline-none cursor-pointer"
                          >
                            <option value="member">Member</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isOwner ? 'bg-amber-500/10 text-amber-600' : 'bg-theme-surface-hover text-theme-tertiary'
                          }`}>
                            {member.role}
                          </span>
                        )}

                        {group.isOwner && !isOwner && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Remove Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-black text-theme-primary">Pending Join Requests ({joinRequests.length})</h3>
                <p className="text-xs text-theme-tertiary mt-0.5">
                  Review and approve membership requests from users.
                </p>
              </div>

              {joinRequests.length === 0 ? (
                <div className="text-center py-12 bg-theme-surface rounded-2xl border border-theme-divider text-xs text-theme-tertiary">
                  No pending requests right now.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {joinRequests.map((req: any) => (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-2xl bg-theme-surface border border-theme-divider flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar src={req.user?.avatar} alt={req.user?.name} size="sm" />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-theme-primary block truncate">{req.user?.name || 'User'}</span>
                          <span className="text-[10px] text-theme-tertiary">@{req.user?.username || 'user'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleReviewRequest(req.id, 'approve')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewRequest(req.id, 'reject')}
                          className="px-3 py-1.5 rounded-xl bg-theme-surface border border-theme-divider text-rose-500 text-xs font-bold hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: INSIGHTS */}
          {activeTab === 'insights' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-black text-theme-primary">Real Persisted Insights</h3>
                <p className="text-xs text-theme-tertiary mt-0.5">
                  Live statistics computed from actual database records.
                </p>
              </div>

              {analytics ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider">
                    <span className="text-[11px] font-bold text-theme-tertiary uppercase block">Members</span>
                    <span className="text-2xl font-black text-theme-primary mt-1 block">{analytics.totalMembers}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider">
                    <span className="text-[11px] font-bold text-theme-tertiary uppercase block">Pending Requests</span>
                    <span className="text-2xl font-black text-theme-primary mt-1 block">{analytics.pendingRequestsCount}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider">
                    <span className="text-[11px] font-bold text-theme-tertiary uppercase block">Posts</span>
                    <span className="text-2xl font-black text-theme-primary mt-1 block">{analytics.totalPosts}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider">
                    <span className="text-[11px] font-bold text-theme-tertiary uppercase block">Replies</span>
                    <span className="text-2xl font-black text-theme-primary mt-1 block">{analytics.totalReplies}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider">
                    <span className="text-[11px] font-bold text-theme-tertiary uppercase block">Media Uploads</span>
                    <span className="text-2xl font-black text-theme-primary mt-1 block">{analytics.mediaCount}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider">
                    <span className="text-[11px] font-bold text-theme-tertiary uppercase block">Total Rallies</span>
                    <span className="text-2xl font-black text-theme-primary mt-1 block">{analytics.totalRallies}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-theme-surface border border-theme-divider col-span-2 sm:col-span-3">
                    <span className="text-[11px] font-bold text-theme-tertiary uppercase block">Chat Messages Exchanged</span>
                    <span className="text-2xl font-black text-theme-primary mt-1 block">{analytics.totalMessages}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-theme-tertiary">Loading insights...</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
