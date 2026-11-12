import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import {
  AlertCircle,
  ArrowLeft,
  AtSign,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Hash,
  Image as ImageIcon,
  Megaphone,
  MessageSquare,
  Mic,
  Pin,
  PinOff,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../common/Avatar';
import { SponsoredPostCard } from '../feed/SponsoredPostCard';
import { RoomAdPurchaseModal } from '../ads/RoomAdPurchaseModal';

type Room = {
  id: string;
  name: string;
  username: string;
  hostName: string;
  hostUsername?: string;
  description: string;
  coverImage: string;
  category: string;
  memberCount: number;
  onlineMemberCount: number;
  isMember: boolean;
  chatroomStatus: 'active' | 'inactive';
  requiresJoinApproval?: boolean;
  [key: string]: any;
};

type FlatStory = {
  memberIdx: number;
  storyIdx: number;
};

function formatTimeLeft(expiresAt: number): string {
  const remaining = expiresAt - Date.now();
  if (remaining <= 0) return 'expiring soon';
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${Math.max(1, minutes)}m left`;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

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
  const [showRoomAdModal, setShowRoomAdModal] = useState(false);
  const [showDemoAd, setShowDemoAd] = useState(false);
  const [showPinned, setShowPinned] = useState(false);
  const [statusComposerOpen, setStatusComposerOpen] = useState(false);
  const [statusCaption, setStatusCaption] = useState('');
  const [statusUploading, setStatusUploading] = useState(false);
  const [viewingStatus, setViewingStatus] = useState<FlatStory | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLInputElement | null>(null);
  const statusFileRef = useRef<HTMLInputElement | null>(null);
  const chatFileRef = useRef<HTMLInputElement | null>(null);

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
  const roomStatuses = useQuery(
    api.liveRooms.listRoomStatuses,
    selectedRoomId ? { groupId: selectedRoomId as any } : 'skip',
  ) as any;
  const roomTopics = useQuery(
    api.liveRooms.getRoomTopics,
    selectedRoomId ? { groupId: selectedRoomId as any } : 'skip',
  ) as any;
  const pinnedMessages = useQuery(
    api.liveRooms.listPinnedMessages,
    selectedRoomId ? { groupId: selectedRoomId as any } : 'skip',
  ) as any;
  const roomAdPlacement = useQuery(
    api.ads.getGroupAdPlacement,
    conversation?.id ? { conversationId: conversation.id as any } : 'skip',
  ) as any;

  const mentionMatch = mentionMatchFromDraft(draft);
  const topicMatch = !mentionMatch ? topicMatchFromDraft(draft) : null;
  const mentionQuery = mentionMatch ? mentionMatch[2] : null;
  const mentionMembers = useQuery(
    api.liveRooms.getRoomMentionMembers,
    selectedRoomId && mentionQuery !== null
      ? { groupId: selectedRoomId as any, search: mentionQuery || undefined }
      : 'skip',
  ) as any;

  const requestToJoin = useMutation(api.groups.requestToJoin);
  const sendMessage = useMutation(api.social.sendMessage);
  const markConversationRead = useMutation(api.social.markConversationRead);
  const generateUploadUrl = useMutation(api.social.generateUploadUrl);
  const pinMessage = useMutation(api.liveRooms.pinRoomMessage);
  const unpinMessage = useMutation(api.liveRooms.unpinRoomMessage);
  const createTopic = useMutation(api.liveRooms.createRoomTopic);
  const extendTopic = useMutation(api.liveRooms.extendRoomTopic);
  const postRoomStatus = useMutation(api.liveRooms.postRoomStatus);
  const deleteRoomStatus = useMutation(api.liveRooms.deleteRoomStatus);
  const recordStatusView = useMutation(api.cycles.viewStory);

  useEffect(() => {
    if (conversation?.id) void markConversationRead({ conversationId: conversation.id }).catch(() => undefined);
  }, [conversation?.id, markConversationRead]);

  useEffect(() => {
    if (!selectedRoomId || !rooms || rooms.some((room) => room.id === selectedRoomId)) return;
    setSelectedRoomId(null);
    setError('This room is no longer available.');
  }, [rooms, selectedRoomId]);

  useEffect(() => {
    if (chatScrollRef.current && conversation?.messages?.length) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [conversation?.messages?.length]);

  useEffect(() => () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    mediaRecorderRef.current?.stream?.getTracks().forEach((track) => track.stop());
  }, []);

  const activeTopic = roomTopics?.active?.find((topic: any) => topic.pinned) ?? roomTopics?.active?.[0] ?? null;
  const allStories = useMemo(() => {
    const members: any[] = roomStatuses?.members ?? [];
    const out: Array<{ member: any; story: any }> = [];
    for (const member of members) {
      for (const story of member.stories) out.push({ member, story });
    }
    return out;
  }, [roomStatuses]);

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

  const uploadAndSend = async (file: File) => {
    if (!conversation?.id || busy) return;
    setBusy(true);
    setError(null);
    try {
      const uploadUrl = await generateUploadUrl({});
      const response = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
      if (!response.ok) throw new Error('Upload failed');
      const { storageId } = await response.json();
      const isVideo = file.type.startsWith('video');
      await sendMessage({
        conversationId: conversation.id,
        text: isVideo ? '🎬 Video' : '🖼️ Photo',
        type: isVideo ? 'video' : 'image',
        mediaStorageId: storageId,
        mimeType: file.type,
        fileName: file.name,
        fileSize: file.size,
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not send this attachment.');
    } finally {
      setBusy(false);
    }
  };

  const submitMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !conversation?.id || busy) return;
    setBusy(true);
    setError(null);
    try {
      await sendMessage({ conversationId: conversation.id, text, type: 'text', topicId: activeTopic?._id as any });
      setDraft('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not send this message.');
    } finally {
      setBusy(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => { audioChunksRef.current.push(event.data); };
      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setRecordSeconds(0);
      setIsRecording(true);
      recordTimerRef.current = setInterval(() => setRecordSeconds((seconds) => seconds + 1), 1000);
    } catch {
      setError('Microphone access is required to record a voice note.');
    }
  };

  const stopRecordingAndSend = async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    const duration = recordSeconds;
    recorder.onstop = async () => {
      recorder.stream?.getTracks().forEach((track) => track.stop());
      const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      try {
        const uploadUrl = await generateUploadUrl({});
        const response = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': blob.type }, body: blob });
        if (!response.ok) throw new Error('Upload failed');
        const { storageId } = await response.json();
        if (conversation?.id) {
          await sendMessage({ conversationId: conversation.id, text: '🎙️ Voice note', audioStorageId: storageId, audioDuration: duration });
        }
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Could not send the voice note.');
      }
      setIsRecording(false);
      setRecordSeconds(0);
    };
    recorder.stop();
  };

  const insertMention = (username: string) => {
    setDraft((current) => current.replace(/(^|\s)@[A-Za-z0-9_.]{0,30}$/, `$1@${username} `));
    composerRef.current?.focus();
  };

  const createTopicFromDraft = async () => {
    const title = topicMatch?.[2]?.trim();
    if (!title || !selectedRoomId) return;
    try {
      await createTopic({ groupId: selectedRoomId as any, title });
      setDraft((current) => current.replace(/(^|\s)#[A-Za-z0-9_-]{0,30}$/, '').trimStart());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not create that topic.');
    }
  };

  const togglePin = async (message: any) => {
    try {
      if (message.pinnedAt) {
        await unpinMessage({ messageId: message._id as any });
      } else {
        await pinMessage({ messageId: message._id as any });
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Pinning requires room moderator permissions.');
    }
  };

  const submitStatus = async (file: File) => {
    if (!selectedRoomId || statusUploading) return;
    setStatusUploading(true);
    try {
      const uploadUrl = await generateUploadUrl({});
      const response = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
      if (!response.ok) throw new Error('Upload failed');
      const { storageId } = await response.json();
      const isVideo = file.type.startsWith('video');
      await postRoomStatus({
        groupId: selectedRoomId as any,
        mediaType: isVideo ? 'video' : 'image',
        mediaStorageId: storageId,
        caption: statusCaption.trim() || undefined,
      });
      setStatusCaption('');
      setStatusComposerOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not publish that status.');
    } finally {
      setStatusUploading(false);
    }
  };

  const flatStories = allStories;
  const activeViewed = viewingStatus ? flatStories[viewingStatus.storyIdx] : null;
  const viewedMember = activeViewed?.member ?? null;
  const viewedStory = activeViewed?.story ?? null;
  useEffect(() => {
    if (!viewedStory || viewedStory.isOwn) return;
    void recordStatusView({ storyId: viewedStory._id as any }).catch(() => undefined);
  }, [recordStatusView, viewedStory?._id, viewedStory?.isOwn]);
  const goStory = (delta: 1 | -1) => {
    if (!flatStories.length) return;
    const current = viewingStatus?.storyIdx ?? 0;
    setViewingStatus({ memberIdx: 0, storyIdx: (current + delta + flatStories.length) % flatStories.length });
  };

  if (selectedRoomId) {
    const adPlacement = roomAdPlacement?.placement;
    return (
      <section className="overflow-hidden rounded-2xl border border-theme-divider bg-theme-surface">
        {/* ─── Header ─── */}
        <header className="flex items-center gap-3 border-b border-theme-divider p-4">
          <button type="button" onClick={() => { setSelectedRoomId(null); setShowPinned(false); }} aria-label="Back to rooms" className="rounded-lg p-2 hover:bg-theme-surface-hover">
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-bold text-theme-primary">{selectedRoom?.name ?? 'Live Room'}</h2>
            <p className="text-xs text-theme-tertiary">
              {selectedRoom
                ? `LIVE · Hosted by ${selectedRoom.hostName} · ${selectedRoom.onlineMemberCount} here · ${selectedRoom.memberCount} members`
                : 'Room messages are served by the existing Convex chat backend.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPinned((current) => !current)}
            aria-label="Pinned messages"
            aria-pressed={showPinned}
            className="relative rounded-lg p-2 text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary"
          >
            <Pin size={18} />
            {pinnedMessages?.messages?.length ? (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#5E43F3] text-[10px] font-bold text-white">{pinnedMessages.messages.length}</span>
            ) : null}
          </button>
        </header>

        {/* ─── Pinned messages panel ─── */}
        {showPinned && (
          <div className="border-b border-theme-divider bg-theme-surface-hover/40 p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-theme-tertiary">Pinned messages</p>
            {(pinnedMessages?.messages?.length ?? 0) === 0 ? (
              <p className="text-xs text-theme-tertiary">No pinned messages yet. Room moderators can pin important messages.</p>
            ) : (
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {pinnedMessages.messages.map((message: any) => (
                  <button
                    key={message._id}
                    type="button"
                    onClick={() => {
                      setShowPinned(false);
                      document.getElementById(`live-room-msg-${message._id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
                    }}
                    className="flex w-full items-start gap-2 rounded-xl border border-theme-divider bg-theme-surface p-2 text-left transition-colors hover:border-[#5E43F3]/40"
                  >
                    <Pin size={12} className="mt-1 shrink-0 text-[#5E43F3]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-theme-primary">{message.senderName} · {timeAgo(message.createdAt)}</span>
                      <span className="line-clamp-2 block text-xs text-theme-secondary">{message.text || (message.type === 'image' ? '🖼️ Photo' : '🎬 Video')}</span>
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="Unpin message"
                      onClick={(event) => { event.stopPropagation(); void togglePin(message); }}
                      onKeyDown={(event) => { if (event.key === 'Enter') { event.stopPropagation(); void togglePin(message); } }}
                      className="shrink-0 rounded-md p-1.5 text-theme-tertiary hover:bg-theme-surface-hover hover:text-theme-primary"
                    >
                      <PinOff size={14} />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Topic banner ─── */}
        {activeTopic && (
          <div className="border-b border-theme-divider bg-gradient-to-r from-[#5E43F3]/15 via-[#5E43F3]/10 to-cyan-500/10 p-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#5E43F3] text-white"><Hash size={16} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-theme-primary">#{activeTopic.title}</p>
                {activeTopic.description && <p className="line-clamp-2 text-xs text-theme-secondary">{activeTopic.description}</p>}
                <p className="mt-1 text-[11px] text-theme-tertiary">
                  <Clock3 size={10} className="mr-1 inline" />
                  {formatTimeLeft(activeTopic.expiresAt)} · by {activeTopic.creator?.name ?? 'Room member'} · {activeTopic.extensionCount} extension{activeTopic.extensionCount === 1 ? '' : 's'}
                </p>
              </div>
              {activeTopic.canManage && (
                <button
                  type="button"
                  onClick={() => void extendTopic({ topicId: activeTopic._id as any }).catch((reason) => setError(reason instanceof Error ? reason.message : 'Could not extend topic'))}
                  className="shrink-0 rounded-lg border border-[#5E43F3]/40 bg-[#5E43F3]/10 px-2.5 py-1.5 text-[10px] font-bold text-[#5E43F3] transition-colors hover:bg-[#5E43F3] hover:text-white"
                >
                  +24h
                </button>
              )}
            </div>
          </div>
        )}

        {/* ─── Header advertisement slot ─── */}
        {adPlacement && (
          <div className="flex items-center gap-2 border-b border-theme-divider bg-theme-surface-hover/30 px-4 py-2">
            <Megaphone size={13} className="shrink-0 text-[#5E43F3]" />
            <span className="shrink-0 rounded bg-[#5E43F3]/10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#5E43F3]">Ad</span>
            <p className="min-w-0 flex-1 truncate text-[11px] text-theme-secondary"><span className="font-semibold text-theme-primary">{adPlacement.advertiser?.name ?? 'Sponsored'}</span> — {adPlacement.headline}</p>
            {adPlacement.destinationUrl && (
              <button
                type="button"
                onClick={() => window.open(adPlacement.destinationUrl, '_blank', 'noopener')}
                className="shrink-0 rounded-md bg-[#5E43F3] px-2.5 py-1 text-[10px] font-bold text-white hover:bg-[#4E34E0]"
              >
                {adPlacement.ctaLabel || 'Visit'}
              </button>
            )}
          </div>
        )}

        {/* ─── Member status strip ─── */}
        <div className="flex items-center gap-3 overflow-x-auto border-b border-theme-divider p-3">
          <button type="button" onClick={() => statusFileRef.current?.click()} aria-label="Add a status" className="group flex shrink-0 flex-col items-center gap-1">
            <span className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-[#5E43F3]/50 bg-[#5E43F3]/10 text-[#5E43F3] transition-colors group-hover:bg-[#5E43F3] group-hover:text-white">
              <Plus size={22} />
            </span>
            <span className="text-[10px] font-medium text-theme-tertiary">Status</span>
          </button>
          <input ref={statusFileRef} type="file" accept="image/*,video/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void submitStatus(file); event.target.value = ''; }} />
          {(roomStatuses?.members ?? []).length === 0 && (
            <p className="text-[11px] text-theme-tertiary">No statuses yet. Tap + to post the first one.</p>
          )}
          {(roomStatuses?.members ?? []).map((member: any) => (
            <button key={member.id} type="button" onClick={() => setViewingStatus({ memberIdx: 0, storyIdx: flatStories.findIndex((entry) => entry.story._id === member.stories[0]._id) })} className="flex shrink-0 flex-col items-center gap-1">
              <span className="rounded-full bg-gradient-to-tr from-[#818CF8] via-[#5E43F3] to-[#06B6D4] p-[2px]">
                <Avatar src={member.avatarUrl} alt={member.name} size="md" className="border-2 border-theme-surface" />
              </span>
              <span className="max-w-[3.5rem] truncate text-[10px] font-medium text-theme-secondary">{member.isOwn ?? false ? 'You' : member.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* ─── Chat ─── */}
        {error && <p role="alert" className="m-3 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
        {!conversation && <p className="p-6 text-center text-sm text-theme-tertiary" role="status">{conversation === undefined ? 'Loading room messages…' : 'This room conversation is not available to your account.'}</p>}
        {conversation && (
          <>
            <div ref={chatScrollRef} className="max-h-[52vh] min-h-48 space-y-3 overflow-y-auto p-4" aria-live="polite">
              {(conversation.messages ?? []).map((message: any, index: number) => {
                const isAnchor = adPlacement && adPlacement.anchorMessageId === message._id;
                return (
                  <React.Fragment key={message.id}>
                    <article id={`live-room-msg-${message._id}`} className={`group relative max-w-[85%] rounded-2xl px-4 py-2 ${message.isMine ? 'ml-auto bg-[#5E43F3] text-white' : 'bg-theme-base text-theme-primary'}`}>
                      {!message.isMine && <p className="mb-1 text-[11px] font-semibold text-theme-tertiary">{message.sender?.name ?? 'Room member'}</p>}
                      {message.pinnedAt && <Pin size={11} className={`mb-1 ${message.isMine ? 'text-white/70' : 'text-[#5E43F3]'}`} aria-label="Pinned" />}
                      <MessageText text={message.text ?? ''} mine={message.isMine} onClickMention={(username) => navigate(`/manga/${username}`)} />
                      {message.mediaUrl && (message.type === 'video'
                        ? <video controls src={message.mediaUrl} className="mt-2 max-h-64 rounded-lg" />
                        : message.type === 'image'
                          ? <img src={message.mediaUrl} alt={message.fileName || 'Room attachment'} className="mt-2 max-h-64 rounded-lg object-contain" />
                          : null)}
                      {message.audioUrl && (
                        <audio controls src={message.audioUrl} className="mt-2 max-w-[220px]" />
                      )}
                      <p className={`mt-1 flex items-center justify-end gap-2 text-[10px] ${message.isMine ? 'text-white/70' : 'text-theme-tertiary'}`}>
                        {message.expiresAt && !message.isExpired && (
                          <span className="inline-flex items-center gap-1"><Clock3 size={10} />{formatTimeLeft(message.expiresAt)}</span>
                        )}
                        {message.isExpired && <span className="italic">Mention kept for mentioned members</span>}
                        {message.createdAt ? timeAgo(message.createdAt) : ''}
                      </p>
                      <button
                        type="button"
                        onClick={() => void togglePin(message)}
                        aria-label={message.pinnedAt ? 'Unpin message' : 'Pin message'}
                        title={message.pinnedAt ? 'Unpin' : 'Pin (moderators)'}
                        className={`absolute ${message.isMine ? 'left-[-2rem]' : 'right-[-2rem]'} top-2 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-theme-surface-hover ${message.isMine ? 'text-theme-tertiary' : 'text-[#5E43F3]'}`}
                      >
                        {message.pinnedAt ? <PinOff size={14} /> : <Pin size={14} />}
                      </button>
                    </article>
                    {isAnchor && (
                      <div className="mx-auto w-full max-w-2xl py-2" aria-label="Sponsored room advertisement">
                        <SponsoredPostCard placement={adPlacement} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
              {conversation.messages?.length === 0 && <p className="py-8 text-center text-sm text-theme-tertiary">Start the conversation in this room.</p>}
            </div>

            {/* Autocomplete menu (mentions / topic creation) */}
            {(mentionMatch || topicMatch || (import.meta.env?.DEV && showDemoAd)) && (
              <div className="pointer-events-none relative mx-3 -mt-2 mb-1 flex justify-start">
                <div className="pointer-events-auto w-full max-w-md overflow-hidden rounded-xl border border-theme-divider bg-theme-surface shadow-lg">
                  {mentionMatch && (
                    <>
                      <p className="border-b border-theme-divider px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-theme-tertiary">Room members</p>
                      {(mentionMembers?.members?.length ?? 0) === 0 && <p className="px-3 py-2 text-xs text-theme-tertiary">No members match “{mentionMatch[2]}”.</p>}
                      {(mentionMembers?.members ?? []).map((member: any) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => insertMention(member.username)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-theme-surface-hover"
                        >
                          <Avatar src={member.avatarUrl} alt={member.name} size="xs" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-semibold text-theme-primary">{member.name}</span>
                            <span className="block truncate text-[10px] text-theme-tertiary">@{member.username}</span>
                          </span>
                        </button>
                      ))}
                    </>
                  )}
                  {topicMatch && (
                    <button
                      type="button"
                      onClick={() => void createTopicFromDraft()}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-theme-surface-hover"
                    >
                      <Hash size={16} className="shrink-0 text-[#5E43F3]" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold text-theme-primary">Create topic</span>
                        <span className="block truncate text-[11px] text-theme-tertiary">#{topicMatch[2]} · 24h, extendable by room moderators</span>
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* In-feed ad / Advertise here fallback (only when an opportunity is due) */}
            {!adPlacement && roomAdPlacement?.opportunity && (
              <button
                type="button"
                onClick={() => setShowRoomAdModal(true)}
                className="group mx-3 mb-2 flex w-[calc(100%-1.5rem)] items-center gap-3 rounded-xl border border-dashed border-[#5E43F3]/30 bg-gradient-to-r from-[#5E43F3]/[0.06] via-theme-surface to-cyan-500/[0.06] px-3 py-2.5 text-left transition-colors hover:border-[#5E43F3]/60"
              >
                <Megaphone size={15} className="shrink-0 text-[#5E43F3]" />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-extrabold text-theme-primary">Advertise here</span>
                  <span className="block truncate text-[10px] text-theme-tertiary">Promote your business in this room</span>
                </span>
                <span className="shrink-0 rounded-full bg-[#5E43F3]/10 px-2 py-0.5 text-[10px] font-bold text-[#5E43F3] group-hover:bg-[#5E43F3] group-hover:text-white">Create</span>
              </button>
            )}

            {/* Dev-only demo advertisement */}
            {import.meta.env.DEV && (
              <div className="mx-3 mb-2 flex items-center gap-2 overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2">
                <Sparkles size={14} className="shrink-0 text-amber-400" />
                <p className="min-w-0 flex-1 text-[10px] font-semibold text-amber-200">Demo Ad (development only, never delivered to production)</p>
                <button type="button" onClick={() => window.open('https://placehold.co/600x200?text=Your+Ad+Here', '_blank', 'noopener')} className="shrink-0 rounded-md bg-amber-500/20 px-2 py-1 text-[10px] font-bold text-amber-300">Visit</button>
              </div>
            )}

            {/* Composer */}
            <form onSubmit={submitMessage} className="flex items-center gap-2 border-t border-theme-divider p-3">
              <input ref={chatFileRef} type="file" accept="image/*,video/*" capture="environment" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadAndSend(file); event.target.value = ''; }} />
              <button type="button" onClick={() => chatFileRef.current?.click()} aria-label="Attach photo or video" className="rounded-lg p-2 text-theme-tertiary hover:bg-theme-surface-hover hover:text-theme-primary">
                <ImageIcon size={18} />
              </button>
              <button type="button" onClick={() => chatFileRef.current?.click()} aria-label="Camera" className="rounded-lg p-2 text-theme-tertiary hover:bg-theme-surface-hover hover:text-theme-primary sm:hidden">
                <Camera size={18} />
              </button>
              {isRecording ? (
                <>
                  <span className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 text-xs text-rose-300">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-rose-400" /> Recording… {recordSeconds}s
                  </span>
                  <button type="button" onClick={() => void stopRecordingAndSend()} aria-label="Stop and send voice note" className="rounded-lg bg-[#5E43F3] p-2 text-white"><Check size={18} /></button>
                  <button type="button" onClick={() => { mediaRecorderRef.current?.stream?.getTracks().forEach((track) => track.stop()); setIsRecording(false); if (recordTimerRef.current) clearInterval(recordTimerRef.current); }} aria-label="Cancel recording" className="rounded-lg p-2 text-theme-tertiary"><X size={18} /></button>
                </>
              ) : (
                <>
                  <input ref={composerRef} value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="Message" maxLength={4000} placeholder="Message · @mention members · #topic" className="min-w-0 flex-1 rounded-xl border border-theme-divider bg-theme-base px-4 py-2.5 text-sm text-theme-primary outline-none focus:border-[#5E43F3]" />
                  <button type="button" onClick={() => void startRecording()} aria-label="Record voice note" className="rounded-lg p-2 text-theme-tertiary hover:bg-theme-surface-hover hover:text-theme-primary"><Mic size={18} /></button>
                  <button type="submit" disabled={busy || !draft.trim()} aria-label="Send message" className="rounded-lg bg-[#5E43F3] p-2 text-white disabled:opacity-50"><Send size={18} /></button>
                </>
              )}
            </form>
          </>
        )}
        {showRoomAdModal && <RoomAdPurchaseModal roomId={selectedRoomId as any} roomName={selectedRoom?.name} onClose={() => setShowRoomAdModal(false)} />}

        {/* Status composer (bottom sheet) */}
        {statusComposerOpen && (
          <div className="absolute inset-0 z-20 flex items-end bg-black/60" onClick={() => setStatusComposerOpen(false)}>
            <div className="w-full rounded-t-2xl bg-theme-surface p-4" onClick={(event) => event.stopPropagation()}>
              <p className="mb-2 text-sm font-bold text-theme-primary">Add a caption to your status</p>
              <input autoFocus value={statusCaption} onChange={(event) => setStatusCaption(event.target.value)} placeholder="Caption (optional)" maxLength={200} className="w-full rounded-xl border border-theme-divider bg-theme-base px-3 py-2.5 text-sm text-theme-primary outline-none" />
              <button type="button" disabled={statusUploading} onClick={() => setStatusComposerOpen(false)} className="mt-3 w-full rounded-xl bg-[#5E43F3] py-2.5 text-sm font-bold text-white disabled:opacity-50">{statusUploading ? 'Publishing…' : 'Done'}</button>
            </div>
          </div>
        )}

        {/* Full-screen status viewer */}
        {viewingStatus && flatStories.length > 0 && (
          <div className="fixed inset-0 z-30 flex flex-col bg-black/95" role="dialog" aria-label="Status viewer">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <Avatar src={viewedMember?.avatarUrl} alt={viewedMember?.name ?? 'Member'} size="sm" />
                <div>
                  <p className="text-sm font-bold text-white">{viewedMember?.name}</p>
                  <p className="text-[10px] text-white/60">{viewedStory ? timeAgo(viewedStory.createdAt) : ''}{viewedStory?.isOwn ? ` · ${viewedStory.viewsCount ?? 0} views` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {viewedStory?.isOwn && (
                  <button type="button" onClick={() => { void deleteRoomStatus({ storyId: viewedStory._id as any }).catch((reason) => setError(reason instanceof Error ? reason.message : 'Could not delete status')); setViewingStatus(null); }} aria-label="Delete status" className="rounded-lg p-2 text-white/70 hover:text-white"><Trash2 size={20} /></button>
                )}
                <button type="button" onClick={() => setViewingStatus(null)} aria-label="Close status" className="rounded-lg p-2 text-white/70 hover:text-white"><X size={22} /></button>
              </div>
            </div>
            <div className="relative flex min-h-0 flex-1 items-center justify-center p-2">
              {viewedStory?.mediaType === 'video'
                ? <video src={viewedStory.mediaUrl} autoPlay controls className="max-h-full max-w-full rounded-2xl object-contain" />
                : viewedStory?.mediaType === 'image'
                  ? <img src={viewedStory.mediaUrl} alt={viewedStory.caption ?? 'Status'} className="max-h-full max-w-full rounded-2xl object-contain" />
                  : <div className="max-w-md rounded-2xl bg-white/5 p-6 text-center text-lg text-white">{viewedStory?.text ?? viewedStory?.caption}</div>}
              <button type="button" onClick={() => goStory(-1)} aria-label="Previous status" className="absolute left-2 rounded-full bg-black/40 p-2 text-white"><ChevronLeft size={22} /></button>
              <button type="button" onClick={() => goStory(1)} aria-label="Next status" className="absolute right-2 rounded-full bg-black/40 p-2 text-white"><ChevronRight size={22} /></button>
            </div>
            <p className="p-4 text-center text-xs text-white/50">{(viewingStatus.storyIdx + 1)} / {flatStories.length}{viewedStory?.caption ? ` · ${viewedStory.caption}` : ''}</p>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div><h2 className="text-xl font-bold text-theme-primary">Live Rooms</h2><p className="mt-1 text-sm text-theme-tertiary">Find and join community conversations.</p></div>
      {!isAuthenticated && <p className="rounded-xl border border-theme-divider bg-theme-surface p-3 text-sm text-theme-secondary">You can browse public rooms. Sign in to join and chat.</p>}
      {error && <p role="alert" className="rounded-xl bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <input aria-label="Search rooms" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search rooms" className="min-w-0 flex-1 rounded-xl border border-theme-divider bg-theme-surface px-4 py-2 text-sm text-theme-primary" />
        <select aria-label="Room category" value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-theme-divider bg-theme-surface px-3 py-2 text-sm text-theme-primary">
          {['All', 'General', 'Social', 'Entertainment', 'Discussion', 'Nigeria', 'Education', 'Technology', 'Other'].map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      {rooms === undefined ? <p className="py-8 text-center text-sm text-theme-tertiary" role="status">Loading rooms…</p>
        : rooms.length === 0 ? <p className="rounded-2xl border border-theme-divider p-8 text-center text-sm text-theme-tertiary">No active rooms found.</p>
        : <div className="grid gap-3 sm:grid-cols-2">{rooms.map((room) => {
          const status = joinStates[room.id];
          const isMember = room.isMember || status === 'joined';
          return (
            <article key={room.id} className="overflow-hidden rounded-2xl border border-theme-divider bg-theme-surface">
              {room.coverImage && <img src={room.coverImage} alt="" className="h-28 w-full object-cover" />}
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-theme-primary">{room.name}</h3>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> LIVE
                  </span>
                </div>
                <p className="text-xs text-theme-tertiary">Hosted by {room.hostName} · {room.category}</p>
                <p className="line-clamp-2 text-sm text-theme-secondary">{room.description}</p>
                <p className="flex items-center gap-1 text-xs text-theme-tertiary"><Users size={14} />{room.onlineMemberCount} here · {room.memberCount} members</p>
                {isMember ? <button type="button" onClick={() => setSelectedRoomId(room.id)} className="inline-flex items-center gap-2 rounded-lg border border-theme-divider px-3 py-2 text-sm text-theme-primary hover:bg-theme-surface-hover"><MessageSquare size={15} />Open Room</button>
                  : status === 'pending' ? <span className="inline-block rounded-lg border border-amber-500/30 px-3 py-2 text-sm text-amber-300">Request pending</span>
                  : <button type="button" onClick={() => void joinRoom(room)} className="rounded-lg bg-[#5E43F3] px-3 py-2 text-sm font-semibold text-white">Join Room</button>}
              </div>
            </article>
          );
        })}</div>}
    </section>
  );
};

function mentionMatchFromDraft(draft: string): RegExpMatchArray | null {
  return /(^|\s)@([A-Za-z0-9_.]{0,30})$/.exec(draft);
}

function topicMatchFromDraft(draft: string): RegExpMatchArray | null {
  return /(^|\s)#([A-Za-z0-9][A-Za-z0-9_-]{0,30})$/.exec(draft);
}

function MessageText({ text, mine, onClickMention }: { text: string; mine: boolean; onClickMention: (username: string) => void }) {
  const parts = useMemo(() => {
    const out: Array<{ type: 'text' | 'mention'; value: string }> = [];
    const regex = /@([A-Za-z0-9_.]{2,30})/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) out.push({ type: 'text', value: text.slice(lastIndex, match.index) });
      out.push({ type: 'mention', value: match[1] });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) out.push({ type: 'text', value: text.slice(lastIndex) });
    return out;
  }, [text]);

  return (
    <p className="whitespace-pre-wrap break-words text-sm">
      {parts.map((part, index) => part.type === 'mention'
        ? (
          <button
            key={index}
            type="button"
            onClick={() => onClickMention(part.value)}
            className={`font-bold underline underline-offset-2 ${mine ? 'text-white underline-white/60' : 'text-[#5E43F3] underline-[#5E43F3]/50'}`}
          >
            @{part.value}
          </button>
        )
        : <React.Fragment key={index}>{part.value}</React.Fragment>)}
    </p>
  );
}
