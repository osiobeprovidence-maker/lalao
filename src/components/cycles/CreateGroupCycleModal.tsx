import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';
import { useAuth } from '../../context/AuthContext';
import { X, Users } from 'lucide-react';

const INTERESTS = ['Football', 'Music', 'Art', 'Technology', 'Travel', 'Food', 'Wellness', 'Community'];

export const CreateGroupCycleModal: React.FC = () => {
  const {
    currentUser,
    isCreateGroupCycleOpen,
    setIsCreateGroupCycleOpen,
    triggerShareToast,
    showAuthPrompt,
  } = useLalao();
  const { isAuthenticated } = useAuth();
  const createGroupCycle = useMutation(api.social.createGroupCycle);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(currentUser.interests || []);

  if (!isCreateGroupCycleOpen) return null;

  const toggleInterest = (interest: string) => {
    setSelectedInterests((items) => items.includes(interest) ? items.filter((item) => item !== interest) : [...items, interest]);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;

    if (!isAuthenticated) {
      setIsCreateGroupCycleOpen(false);
      showAuthPrompt('Sign in to create a group cycle');
      return;
    }

    try {
      await createGroupCycle({
        name: name.trim(),
        description: description.trim() || undefined,
        memberIds: [],
        interests: selectedInterests,
        avatarUrl: undefined,
        creatorUserId: currentUser.id,
      });
      setName('');
      setDescription('');
      setIsCreateGroupCycleOpen(false);
      triggerShareToast('Group Cycle created');
    } catch (error: any) {
      triggerShareToast(error?.message || 'Could not create the Group Cycle');
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-t-3xl bg-theme-base shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-theme-divider px-4 py-3 bg-theme-base/95">
          <div className="flex items-center gap-2">
            <div>
              <h2 className="text-lg font-black text-theme-primary">Create Group Cycle</h2>
              <p className="text-xs text-theme-tertiary">Share with members who share your interests.</p>
            </div>
          </div>
          <button onClick={() => setIsCreateGroupCycleOpen(false)} className="p-2 rounded-full hover:bg-theme-surface" aria-label="Close">
            <X className="w-5 h-5 text-theme-secondary" />
          </button>
        </div>
        <div className="space-y-5 p-4">
          <label className="block space-y-2">
            <span className="text-xs font-bold text-theme-primary">Cycle name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} placeholder="e.g. Creative Collective" className="w-full rounded-xl border border-theme-divider bg-theme-surface px-4 py-3 text-sm outline-none focus:border-[#5E43F3]" />
          </label>
          <label className="block space-y-2">
            <span className="text-xs font-bold text-theme-primary">Description</span>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={240} rows={3} placeholder="Describe the group’s shared focus." className="w-full resize-none rounded-xl border border-theme-divider bg-theme-surface px-4 py-3 text-sm outline-none focus:border-[#5E43F3]" />
          </label>
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold text-theme-primary">
              <Users className="w-4 h-4 text-[#5E43F3]" />
              Shared interests
            </div>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => {
                const selected = selectedInterests.includes(interest);
                return <button key={interest} type="button" onClick={() => toggleInterest(interest)} className={`rounded-full border px-3 py-2 text-xs font-bold ${selected ? 'border-[#5E43F3] bg-[#5E43F3] text-white' : 'border-theme-divider bg-theme-surface text-theme-secondary'}`}>{interest}</button>;
              })}
            </div>
          </div>
          <button onClick={handleCreate} disabled={!name.trim() || selectedInterests.length === 0} className="w-full rounded-xl bg-[#5E43F3] py-3 text-sm font-black text-white disabled:opacity-50">
            Create Group Cycle
          </button>
        </div>
      </div>
    </div>
  );
};
