import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { 
  Users, 
  X, 
  Globe, 
  Lock, 
  EyeOff, 
  MessageSquare, 
  FileText, 
  Flame, 
  Image as ImageIcon 
} from 'lucide-react';

const CATEGORIES = [
  'General',
  'Neighborhood',
  'Hobbies & Interests',
  'Sports & Fitness',
  'Tech & Gaming',
  'Arts & Culture',
  'Social & Nightlife',
  'Buy, Sell & Trade',
  'Study & Career',
];

export const CreateGroupChatModal: React.FC = () => {
  const {
    currentUser,
    messageContacts,
    setActiveChatId,
    setActiveGroupId,
    setActiveTab,
    setIsCreateGroupChatOpen,
    isCreateGroupChatOpen,
    triggerShareToast,
    showAuthPrompt,
  } = useLalao();
  const { isAuthenticated } = useAuth();
  const createGroup = useMutation(api.groups.createGroup);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [visibility, setVisibility] = useState<'public' | 'private_discoverable' | 'private_hidden'>('private_discoverable');
  const [communityEnabled, setCommunityEnabled] = useState(false);
  const [enablePosts, setEnablePosts] = useState(true);
  const [enableReplies, setEnableReplies] = useState(true);
  const [enableMedia, setEnableMedia] = useState(true);
  const [enableRallies, setEnableRallies] = useState(true);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  if (!isCreateGroupChatOpen) return null;

  const toggleMember = (id: string) => {
    setSelectedMembers((members) =>
      members.includes(id) ? members.filter((member) => member !== id) : [...members, id]
    );
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!username || username === name.toLowerCase().replace(/[^a-z0-9_]/g, '')) {
      setUsername(val.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30));
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;

    if (!isAuthenticated) {
      setIsCreateGroupChatOpen(false);
      showAuthPrompt('Sign in to create a group');
      return;
    }

    setIsCreating(true);
    try {
      const cleanUsername = username.trim()
        ? username.replace(/^@/, '').trim().toLowerCase()
        : name.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30) || undefined;

      const result = await createGroup({
        name: name.trim(),
        username: cleanUsername,
        description: description.trim() || undefined,
        category,
        visibility,
        communityEnabled,
        communityFeatures: communityEnabled
          ? {
              posts: enablePosts,
              replies: enableReplies,
              media: enableMedia,
              rallies: enableRallies,
            }
          : undefined,
        publishingPermissions: communityEnabled
          ? {
              canPost: 'all_members',
              canReply: 'all_members',
              canUploadMedia: 'all_members',
              canCreateRallies: 'all_members',
            }
          : undefined,
        memberIds: selectedMembers,
        creatorUserId: currentUser?.id,
      });

      // Navigate to chat or community page based on type
      if (result.conversationId) {
        setActiveChatId(result.conversationId);
      }
      if (communityEnabled && result.groupId) {
        setActiveGroupId(result.groupId);
      } else {
        setActiveTab('messages');
      }

      setName('');
      setUsername('');
      setDescription('');
      setSelectedMembers([]);
      setCommunityEnabled(false);
      setIsCreateGroupChatOpen(false);
      triggerShareToast(communityEnabled ? 'Community group created!' : 'Group created!');
    } catch (error: any) {
      triggerShareToast(error?.message || 'Could not create group');
      console.error('Group creation error:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg h-[90vh] sm:h-auto max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-theme-base shadow-2xl flex flex-col border border-theme-divider">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-theme-divider px-5 py-4 bg-theme-base/95 backdrop-blur">
          <div>
            <h2 className="text-lg font-black text-theme-primary">Create New Group</h2>
            <p className="text-xs text-theme-tertiary">Group messaging with optional community features</p>
          </div>
          <button 
            onClick={() => setIsCreateGroupChatOpen(false)} 
            className="p-2 rounded-full hover:bg-theme-surface transition" 
            aria-label="Close"
          >
            <X className="w-5 h-5 text-theme-secondary" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Group Identity */}
          <div className="space-y-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-theme-primary">Group name *</span>
              <input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                maxLength={60}
                placeholder="e.g. Manchester Boardgamers, Tech Crew"
                className="w-full rounded-xl border border-theme-divider bg-theme-surface px-4 py-2.5 text-sm outline-none focus:border-[#5E43F3] text-theme-primary transition"
                autoFocus
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-theme-primary">Handle / Username</span>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm text-theme-tertiary font-bold">@</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  maxLength={30}
                  placeholder="grouphandle"
                  className="w-full rounded-xl border border-theme-divider bg-theme-surface pl-8 pr-4 py-2.5 text-sm outline-none focus:border-[#5E43F3] text-theme-primary transition font-mono"
                />
              </div>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-theme-primary">Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={240}
                rows={2}
                placeholder="What is this group about?"
                className="w-full resize-none rounded-xl border border-theme-divider bg-theme-surface px-4 py-2.5 text-sm outline-none focus:border-[#5E43F3] text-theme-primary transition"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold text-theme-primary">Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-theme-divider bg-theme-surface px-4 py-2.5 text-sm outline-none focus:border-[#5E43F3] text-theme-primary"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Privacy & Visibility */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-theme-primary">Group Privacy</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                  visibility === 'public'
                    ? 'border-[#5E43F3] bg-[#5E43F3]/10 text-theme-primary'
                    : 'border-theme-divider bg-theme-surface text-theme-secondary hover:bg-theme-surface-hover'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Globe className={`w-3.5 h-3.5 ${visibility === 'public' ? 'text-[#5E43F3]' : ''}`} />
                  Public
                </div>
                <p className="text-[11px] text-theme-tertiary leading-tight">
                  Anyone can discover, view, and join freely.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('private_discoverable')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                  visibility === 'private_discoverable'
                    ? 'border-[#5E43F3] bg-[#5E43F3]/10 text-theme-primary'
                    : 'border-theme-divider bg-theme-surface text-theme-secondary hover:bg-theme-surface-hover'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Lock className={`w-3.5 h-3.5 ${visibility === 'private_discoverable' ? 'text-[#5E43F3]' : ''}`} />
                  Discoverable
                </div>
                <p className="text-[11px] text-theme-tertiary leading-tight">
                  Visible in search, but join request required.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('private_hidden')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                  visibility === 'private_hidden'
                    ? 'border-[#5E43F3] bg-[#5E43F3]/10 text-theme-primary'
                    : 'border-theme-divider bg-theme-surface text-theme-secondary hover:bg-theme-surface-hover'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <EyeOff className={`w-3.5 h-3.5 ${visibility === 'private_hidden' ? 'text-[#5E43F3]' : ''}`} />
                  Secret
                </div>
                <p className="text-[11px] text-theme-tertiary leading-tight">
                  Hidden from search. Direct invite only.
                </p>
              </button>
            </div>
          </div>

          {/* Community Features Toggle */}
          <div className="p-4 rounded-2xl border border-theme-divider bg-theme-surface space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center">
                </div>
                <div>
                  <h4 className="text-sm font-bold text-theme-primary">Enable Community Page</h4>
                  <p className="text-xs text-theme-tertiary">Posts, Replies, Media gallery & Rallies</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={communityEnabled}
                  onChange={(e) => setCommunityEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-theme-divider peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5E43F3]"></div>
              </label>
            </div>

            {communityEnabled ? (
              <div className="pt-2 border-t border-theme-divider grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 rounded-lg bg-theme-base text-theme-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enablePosts}
                    onChange={(e) => setEnablePosts(e.target.checked)}
                    className="accent-[#5E43F3]"
                  />
                  <FileText className="w-3.5 h-3.5 text-theme-tertiary" />
                  <span>Posts feed</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-theme-base text-theme-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableReplies}
                    onChange={(e) => setEnableReplies(e.target.checked)}
                    className="accent-[#5E43F3]"
                  />
                  <MessageSquare className="w-3.5 h-3.5 text-theme-tertiary" />
                  <span>Replies / Comments</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-theme-base text-theme-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableMedia}
                    onChange={(e) => setEnableMedia(e.target.checked)}
                    className="accent-[#5E43F3]"
                  />
                  <ImageIcon className="w-3.5 h-3.5 text-theme-tertiary" />
                  <span>Media gallery</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-theme-base text-theme-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableRallies}
                    onChange={(e) => setEnableRallies(e.target.checked)}
                    className="accent-[#5E43F3]"
                  />
                  <Flame className="w-3.5 h-3.5 text-theme-tertiary" />
                  <span>Group Rallies</span>
                </label>
              </div>
            ) : (
              <p className="text-[11px] text-theme-tertiary italic">
                Group will operate in clean messaging-only mode. You can enable community features anytime in settings.
              </p>
            )}
          </div>

          {/* Invite Contacts */}
          <div>
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-theme-primary">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#5E43F3]" />
                Invite Friends ({selectedMembers.length} selected)
              </span>
            </div>
            <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
              {messageContacts.map((contact) => {
                const selected = selectedMembers.includes(contact.id);
                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => toggleMember(contact.id)}
                    className="flex w-full items-center gap-3 rounded-xl border border-theme-divider bg-theme-surface p-2.5 text-left hover:bg-theme-surface-hover transition"
                  >
                    <Avatar src={contact.avatar} alt={contact.name} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-xs font-bold text-theme-primary">
                      {contact.name}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        selected
                          ? 'bg-[#5E43F3] text-white'
                          : 'bg-theme-base text-theme-secondary border border-theme-divider'
                      }`}
                    >
                      {selected ? 'Added' : 'Add'}
                    </span>
                  </button>
                );
              })}
              {messageContacts.length === 0 && (
                <p className="rounded-xl bg-theme-surface p-3 text-center text-xs text-theme-tertiary">
                  You can invite people after creating the group.
                </p>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleCreate}
            disabled={isCreating || !name.trim()}
            className="w-full rounded-xl bg-[#5E43F3] py-3 text-sm font-black text-white hover:bg-[#4d35d1] transition disabled:opacity-50 shadow-md shadow-[#5E43F3]/25"
          >
            {isCreating ? 'Creating Group...' : communityEnabled ? 'Create Community Group' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
};
