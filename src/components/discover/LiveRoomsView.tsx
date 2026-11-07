import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { ArrowLeft, MessageSquare, Send, Users } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

type Room = {
  id: string;
  name: string;
  username: string;
  description: string;
  coverImage: string;
  category: string;
  memberCount: number;
  isMember: boolean;
  requiresJoinApproval?: boolean;
  [key: string]: any;
};

export const LiveRoomsView: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinStates, setJoinStates] = useState<Record<string, 'pending' | 'joined'>>({});

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const rooms = useQuery(api.groups.listDiscoverableGroups, {
    isChatroom: true,
    search: debouncedSearch || undefined,
    category: category === 'All' ? undefined : category,
  }) as Room[] | undefined;
  const selectedRoom = rooms?.find((room) => room.id === selectedRoomId) ?? null;
  const conversation = useQuery(
    api.groups.getChatroomConversation,
    selectedRoomId ? { groupId: selectedRoomId } : 'skip',
  ) as any;
  const requestToJoin = useMutation(api.groups.requestToJoin);
  const sendMessage = useMutation(api.social.sendMessage);
  const markConversationRead = useMutation(api.social.markConversationRead);
  useEffect(() => {
    if (conversation?.id) void markConversationRead({ conversationId: conversation.id }).catch(() => undefined);
  }, [conversation?.id, markConversationRead]);

  const joinRoom = async (room: Room) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setError(null);
    try {
      const result = await requestToJoin({ groupId: room.id });
      if (result.status === 'joined') {
        setJoinStates((current) => ({ ...current, [room.id]: 'joined' }));
        setSelectedRoomId(room.id);
      } else {
        setJoinStates((current) => ({ ...current, [room.id]: 'pending' }));
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not join this room.');
    }
  };

  const submitMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !conversation?.id || busy) return;
    setBusy(true);
    setError(null);
    try {
      await sendMessage({ conversationId: conversation.id, text, type: 'text' });
      setDraft('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not send this message.');
    } finally {
      setBusy(false);
    }
  };

  if (selectedRoomId) {
    return <section className="overflow-hidden rounded-2xl border border-theme-divider bg-theme-surface">
      <header className="flex items-center gap-3 border-b border-theme-divider p-4">
        <button type="button" onClick={() => setSelectedRoomId(null)} aria-label="Back to rooms" className="rounded-lg p-2 hover:bg-theme-surface-hover"><ArrowLeft size={18}/></button>
        <div className="min-w-0 flex-1"><h2 className="truncate font-bold text-theme-primary">{selectedRoom?.name ?? 'Live Room'}</h2><p className="text-xs text-theme-tertiary">Room messages are served by the existing Convex chat backend.</p></div>
      </header>
      {error && <p role="alert" className="m-4 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
      {!conversation && <p className="p-6 text-center text-sm text-theme-tertiary" role="status">{conversation === undefined ? 'Loading room messages…' : 'This room conversation is not available to your account.'}</p>}
      {conversation && <>
        <div className="max-h-[55vh] min-h-48 space-y-3 overflow-y-auto p-4" aria-live="polite">
          {(conversation.messages ?? []).map((message: any) => <article key={message.id} className={`max-w-[85%] rounded-2xl px-4 py-2 ${message.isMine ? 'ml-auto bg-[#5E43F3] text-white' : 'bg-theme-base text-theme-primary'}`}>
            {!message.isMine && <p className="mb-1 text-[11px] font-semibold text-theme-tertiary">Room member</p>}
            <p className="whitespace-pre-wrap break-words text-sm">{message.text}</p>
            {message.mediaUrl && (message.type === 'video'
              ? <video controls src={message.mediaUrl} className="mt-2 max-h-64 rounded-lg" />
              : <img src={message.mediaUrl} alt={message.fileName || 'Room attachment'} className="mt-2 max-h-64 rounded-lg object-contain" />)}
            <p className={`mt-1 text-right text-[10px] ${message.isMine ? 'text-white/70' : 'text-theme-tertiary'}`}>{message.timestamp}</p>
          </article>)}
          {conversation.messages?.length === 0 && <p className="py-8 text-center text-sm text-theme-tertiary">Start the conversation in this room.</p>}
        </div>
        <form onSubmit={submitMessage} className="flex gap-2 border-t border-theme-divider p-3">
          <input value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="Message" maxLength={4000} placeholder="Write a message…" className="min-w-0 flex-1 rounded-xl border border-theme-divider bg-theme-base px-4 py-3 text-sm text-theme-primary outline-none focus:border-[#5E43F3]"/>
          <button disabled={busy || !draft.trim()} aria-label="Send message" className="rounded-xl bg-[#5E43F3] px-4 text-white disabled:opacity-50"><Send size={17}/></button>
        </form>
      </>}
    </section>;
  }

  return <section className="space-y-4">
    <div><h2 className="text-xl font-bold text-theme-primary">Live Rooms</h2><p className="mt-1 text-sm text-theme-tertiary">Find and join community conversations.</p></div>
    {!isAuthenticated && <p className="rounded-xl border border-theme-divider bg-theme-surface p-3 text-sm text-theme-secondary">You can browse public rooms. Sign in to join and chat.</p>}
    {error && <p role="alert" className="rounded-xl bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
    <div className="flex flex-col gap-2 sm:flex-row">
      <input aria-label="Search rooms" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search rooms" className="min-w-0 flex-1 rounded-xl border border-theme-divider bg-theme-surface px-4 py-2 text-sm text-theme-primary"/>
      <select aria-label="Room category" value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-theme-divider bg-theme-surface px-3 py-2 text-sm text-theme-primary">
        {['All', 'General', 'Social', 'Entertainment', 'Discussion', 'Nigeria', 'Education', 'Technology', 'Other'].map((item) => <option key={item}>{item}</option>)}
      </select>
    </div>
    {rooms === undefined ? <p className="py-8 text-center text-sm text-theme-tertiary" role="status">Loading rooms…</p>
      : rooms.length === 0 ? <p className="rounded-2xl border border-theme-divider p-8 text-center text-sm text-theme-tertiary">No active rooms found.</p>
      : <div className="grid gap-3 sm:grid-cols-2">{rooms.map((room) => {
        const status = joinStates[room.id];
        const isMember = room.isMember || status === 'joined';
        return <article key={room.id} className="overflow-hidden rounded-2xl border border-theme-divider bg-theme-surface">
          {room.coverImage && <img src={room.coverImage} alt="" className="h-28 w-full object-cover"/>}
          <div className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-2"><h3 className="font-bold text-theme-primary">{room.name}</h3><span className="rounded-full bg-[#5E43F3]/10 px-2 py-1 text-[10px] font-semibold text-[#5E43F3]">{room.category}</span></div>
            <p className="line-clamp-2 text-sm text-theme-secondary">{room.description}</p>
            <p className="flex items-center gap-1 text-xs text-theme-tertiary"><Users size={14}/>{room.memberCount} members</p>
            {isMember ? <button type="button" onClick={() => setSelectedRoomId(room.id)} className="inline-flex items-center gap-2 rounded-lg border border-theme-divider px-3 py-2 text-sm text-theme-primary hover:bg-theme-surface-hover"><MessageSquare size={15}/>Open Room</button>
              : status === 'pending' ? <span className="inline-block rounded-lg border border-amber-500/30 px-3 py-2 text-sm text-amber-300">Request pending</span>
                : <button type="button" onClick={() => void joinRoom(room)} className="rounded-lg bg-[#5E43F3] px-3 py-2 text-sm font-semibold text-white">Join Room</button>}
          </div>
        </article>;
      })}</div>}
  </section>;
};
