import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import { Avatar } from '../common/Avatar';
import { Users, X } from 'lucide-react';

export const CreateGroupChatModal: React.FC = () => {
  const {
    currentUser,
    messageContacts,
    setActiveChatId,
    setActiveTab,
    setIsCreateGroupChatOpen,
    isCreateGroupChatOpen,
    triggerShareToast,
  } = useLalao();
  const createGroupChat = useMutation(api.social.createGroupChat);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  if (!isCreateGroupChatOpen) return null;

  const toggleMember = (id: string) => {
    setSelectedMembers((members) => members.includes(id) ? members.filter((member) => member !== id) : [...members, id]);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      const result = await createGroupChat({
        name: name.trim(),
        description: description.trim() || undefined,
        memberIds: selectedMembers,
        avatarUrl: undefined,
        interests: currentUser.interests || [],
      });
      setActiveChatId(result.conversationId);
      setActiveTab('messages');
      setName('');
      setDescription('');
      setSelectedMembers([]);
      setIsCreateGroupChatOpen(false);
      triggerShareToast('Private group chat created');
    } catch (error) {
      triggerShareToast('Could not create the group chat');
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg h-[88vh] sm:h-auto max-h-[85vh] overflow-y-auto rounded-t-3xl bg-theme-base shadow-2xl flex flex-col">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-theme-divider px-4 py-3 bg-theme-base/95 backdrop-blur">
          <div>
            <h2 className="text-lg font-black text-theme-primary">New private group</h2>
            <p className="text-xs text-theme-tertiary">Only invited members can see this chat.</p>
          </div>
          <button onClick={() => setIsCreateGroupChatOpen(false)} className="p-2 rounded-full hover:bg-theme-surface" aria-label="Close">
            <X className="w-5 h-5 text-theme-secondary" />
          </button>
        </div>
        <div className="space-y-5 p-4">
          <label className="block space-y-2">
            <span className="text-xs font-bold text-theme-primary">Group name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} placeholder="e.g. Weekend Crew" className="w-full rounded-xl border border-theme-divider bg-theme-surface px-4 py-3 text-sm outline-none focus:border-[#5E43F3]" />
          </label>
          <label className="block space-y-2">
            <span className="text-xs font-bold text-theme-primary">Description</span>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={240} rows={3} placeholder="What is this group for?" className="w-full resize-none rounded-xl border border-theme-divider bg-theme-surface px-4 py-3 text-sm outline-none focus:border-[#5E43F3]" />
          </label>
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold text-theme-primary">
              <Users className="w-4 h-4 text-[#5E43F3]" />
              Invite members
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {messageContacts.map((contact) => {
                const selected = selectedMembers.includes(contact.id);
                return (
                  <button key={contact.id} type="button" onClick={() => toggleMember(contact.id)} className="flex w-full items-center gap-3 rounded-xl border border-theme-divider bg-theme-surface p-3 text-left hover:bg-theme-surface-hover">
                    <Avatar src={contact.avatar} alt={contact.name} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-theme-primary">{contact.name}</span>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold ${selected ? 'bg-[#5E43F3] text-white' : 'bg-theme-surface-hover text-theme-secondary'}`}>{selected ? 'Added' : 'Add'}</span>
                  </button>
                );
              })}
              {messageContacts.length === 0 && <p className="rounded-xl bg-theme-surface p-4 text-center text-xs text-theme-tertiary">Add friends to invite them into a private group.</p>}
            </div>
          </div>
          <button onClick={handleCreate} disabled={isCreating || !name.trim()} className="w-full rounded-xl bg-[#5E43F3] py-3 text-sm font-black text-white disabled:opacity-50">
            {isCreating ? 'Creating…' : 'Create private group'}
          </button>
        </div>
      </div>
    </div>
  );
};
