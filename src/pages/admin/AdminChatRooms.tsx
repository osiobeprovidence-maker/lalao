import React, { useMemo, useState } from 'react';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { uploadImageWithFallback } from '../../lib/cloudinary';
import { Archive, ImagePlus, Pencil, Plus, Search, Users, X } from 'lucide-react';

type Room = any;
const emptyForm = { name: '', description: '', coverImage: '', category: 'General', visibility: 'public' as 'public'|'private_discoverable', chatroomStatus: 'active' as 'active'|'inactive', roomIcon: '', welcomeMessage: '', requiresJoinApproval: false };

export const AdminChatRooms: React.FC = () => {
  const generateCloudinarySignatureAction = useAction(api.cloudinary.generateSignature);
  const generateCloudinarySignature = (folder?: string) => generateCloudinarySignatureAction({ folder });
  const rooms = useQuery(api.groups.listChatroomsForAdmin, {}) as Room[] | undefined;
  const createRoom = useMutation(api.groups.createChatroomForAdmin);
  const updateRoom = useMutation(api.groups.updateChatroomForAdmin);
  const archiveRoom = useMutation(api.groups.archiveChatroomForAdmin);
  const ensureDefault = useMutation(api.groups.ensureDefaultChatroomForAdmin);
  const removeMember = useMutation(api.groups.removeChatroomMemberForAdmin);
  const setRole = useMutation(api.groups.setChatroomMemberRoleForAdmin);
  const uploadUrl = useMutation(api.groups.generateChatroomBannerUploadUrl);
  const resolveUrl = useMutation(api.groups.resolveChatroomBannerStorageUrl);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Room | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [busy, setBusy] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [memberRoom, setMemberRoom] = useState<Room | null>(null);
  const members = useQuery(api.groups.getChatroomMembersForAdmin, memberRoom ? { groupId: memberRoom._id } : 'skip') as any[] | undefined;

  const filtered = useMemo(() => (rooms ?? []).filter((room) =>
    (room.name.toLowerCase().includes(search.toLowerCase()) || room.description?.toLowerCase().includes(search.toLowerCase())) &&
    (category === 'all' || room.category === category) && (status === 'all' || (room.chatroomStatus ?? 'active') === status)
  ), [rooms, search, category, status]);
  const categories = [...new Set((rooms ?? []).map((room) => room.category || 'General'))];
  const active = (rooms ?? []).filter((room) => (room.chatroomStatus ?? 'active') === 'active');

  const openEdit = (room: Room) => {
    setFormOpen(true);
    setEditing(room);
    setForm({ name: room.name, description: room.description ?? '', coverImage: room.coverImage ?? '', category: room.category ?? 'General', visibility: room.visibility === 'public' ? 'public' : 'private_discoverable', chatroomStatus: room.chatroomStatus ?? 'active', roomIcon: room.roomIcon ?? '', welcomeMessage: room.welcomeMessage ?? '', requiresJoinApproval: room.requiresJoinApproval ?? false });
  };
  const closeForm = () => { setFormOpen(false); setEditing(null); setForm(emptyForm); };
  const pickBanner = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadImageWithFallback(file, 'chatrooms', generateCloudinarySignature, () => uploadUrl({}), resolveUrl);
      setForm((prev) => ({ ...prev, coverImage: url }));
    } catch (error: any) { alert(error.message || 'Banner upload failed'); }
    finally { setBusy(false); }
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (editing) await updateRoom({ groupId: editing._id, ...form });
      else await createRoom(form);
      closeForm();
    } catch (error: any) { alert(error.message || 'Could not save room'); }
    finally { setBusy(false); }
  };
  const showMembers = async (room: Room) => {
    setMemberRoom(room);
  };

  return <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div><h1 className="text-xl sm:text-2xl font-black text-theme-primary">Chat Rooms</h1><p className="text-sm text-theme-tertiary mt-1">Create and manage rooms shown under Explore.</p></div>
      <button onClick={() => { setEditing(null); setForm(emptyForm); setFormOpen(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5E43F3] text-white font-bold text-sm"><Plus size={17}/> Create New Room</button>
    </div>
    {!rooms?.some(room => room.username === 'room-lalao-general') && <div className="p-4 rounded-2xl border border-[#5E43F3]/30 bg-[#5E43F3]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><div className="font-bold text-theme-primary">Set up the default Lalao General room</div><div className="text-xs text-theme-secondary mt-1">Creates the requested welcome room once, if it does not already exist.</div></div><button onClick={async()=>{try{await ensureDefault({});}catch(error:any){alert(error.message||'Could not create default room');}}} className="px-4 py-2 rounded-xl bg-[#5E43F3] text-white text-sm font-bold">Set up default</button></div>}
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {[["Total rooms", rooms?.length ?? '…'], ["Active rooms", active.length], ["Inactive rooms", (rooms?.length ?? 0) - active.length], ["Total members", (rooms ?? []).reduce((sum, room) => sum + room.memberCount, 0)]].map(([label, value]) => <div key={String(label)} className="p-4 rounded-2xl bg-theme-surface border border-theme-divider"><div className="text-xs uppercase tracking-wide text-theme-tertiary">{label}</div><div className="text-2xl font-black text-theme-primary mt-1">{value}</div></div>)}
    </div>
    <div className="flex flex-col sm:flex-row gap-3">
      <label className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl bg-theme-surface border border-theme-divider"><Search size={16}/><input className="bg-transparent outline-none w-full text-sm text-theme-primary" placeholder="Search rooms" value={search} onChange={e=>setSearch(e.target.value)}/></label>
      <select className="px-3 py-2 rounded-xl bg-theme-surface border border-theme-divider text-theme-primary" value={category} onChange={e=>setCategory(e.target.value)}><option value="all">All categories</option>{categories.map(c=><option key={c}>{c}</option>)}</select>
      <select className="px-3 py-2 rounded-xl bg-theme-surface border border-theme-divider text-theme-primary" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
    </div>
    <div className="space-y-3">{filtered.map(room=><article key={room._id} className="overflow-hidden rounded-2xl bg-theme-surface border border-theme-divider">
      <div className="h-36 bg-theme-base relative">{room.coverImage && <img src={room.coverImage} alt="" className="w-full h-full object-cover"/>}<span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold ${room.chatroomStatus === 'inactive' ? 'bg-neutral-800 text-neutral-200' : 'bg-emerald-600 text-white'}`}>{room.chatroomStatus ?? 'active'}</span></div>
      <div className="p-4 flex flex-col lg:flex-row lg:items-center gap-4"><div className="flex-1 min-w-0"><h2 className="font-black text-theme-primary">{room.name}</h2><p className="text-sm text-theme-secondary line-clamp-2 mt-1">{room.description}</p><div className="text-xs text-theme-tertiary mt-2">{room.visibility === 'public' ? 'Public' : 'Private'} · {room.category} · {room.memberCount} members</div></div><div className="flex flex-wrap gap-2"><button onClick={()=>showMembers(room)} className="px-3 py-2 rounded-lg border border-theme-divider text-theme-primary text-sm"><Users size={15} className="inline mr-1"/>Members</button><button onClick={()=>openEdit(room)} className="px-3 py-2 rounded-lg border border-theme-divider text-theme-primary text-sm"><Pencil size={15} className="inline mr-1"/>Edit</button><button onClick={async()=>{if(confirm(`Archive ${room.name}? It will no longer appear in Explore, and messages will be preserved.`)) await archiveRoom({groupId:room._id});}} className="px-3 py-2 rounded-lg border border-theme-divider text-theme-primary text-sm"><Archive size={15} className="inline mr-1"/>{room.chatroomStatus === 'inactive' ? 'Archived' : 'Archive'}</button></div></div>
    </article>)}{rooms && filtered.length===0 && <div className="p-10 rounded-2xl border border-theme-divider bg-theme-surface text-center text-theme-tertiary">No chat rooms match these filters.</div>}</div>

    {formOpen && <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4" onMouseDown={e=>{if(e.target===e.currentTarget)closeForm();}}><form onSubmit={save} className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-theme-surface border border-theme-divider p-5 space-y-4"><div className="flex justify-between"><div><h2 className="text-lg font-black text-theme-primary">{editing?'Edit chat room':'Create chat room'}</h2><p className="text-xs text-theme-tertiary">Changes are saved to Lalao’s existing room records.</p></div><button type="button" onClick={closeForm}><X/></button></div>
      <label className="block text-sm text-theme-secondary">Room name<input required className="mt-1 w-full p-3 rounded-xl bg-theme-base border border-theme-divider text-theme-primary" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
      <label className="block text-sm text-theme-secondary">Description<textarea required rows={3} className="mt-1 w-full p-3 rounded-xl bg-theme-base border border-theme-divider text-theme-primary" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
      <div className="space-y-2"><span className="text-sm text-theme-secondary">Room banner</span>{form.coverImage && <img src={form.coverImage} className="w-full h-40 object-cover rounded-xl" alt="Banner preview"/>}<label className="flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-theme-divider cursor-pointer text-theme-secondary"><ImagePlus size={18}/>Upload banner<input type="file" accept="image/*" className="hidden" onChange={e=>void pickBanner(e.target.files?.[0])}/></label></div>
      <div className="grid sm:grid-cols-2 gap-3"><label className="text-sm text-theme-secondary">Category<select className="mt-1 w-full p-3 rounded-xl bg-theme-base border border-theme-divider text-theme-primary" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{['General','Social','Entertainment','Discussion','Nigeria','Education','Technology','Other'].map(c=><option key={c}>{c}</option>)}</select></label><label className="text-sm text-theme-secondary">Visibility<select className="mt-1 w-full p-3 rounded-xl bg-theme-base border border-theme-divider text-theme-primary" value={form.visibility} onChange={e=>setForm({...form,visibility:e.target.value as any})}><option value="public">Public</option><option value="private_discoverable">Private</option></select></label><label className="text-sm text-theme-secondary">Status<select className="mt-1 w-full p-3 rounded-xl bg-theme-base border border-theme-divider text-theme-primary" value={form.chatroomStatus} onChange={e=>setForm({...form,chatroomStatus:e.target.value as any})}><option value="active">Active</option><option value="inactive">Inactive</option></select></label><label className="text-sm text-theme-secondary">Room icon (optional)<input className="mt-1 w-full p-3 rounded-xl bg-theme-base border border-theme-divider text-theme-primary" value={form.roomIcon} onChange={e=>setForm({...form,roomIcon:e.target.value})}/></label></div>
      <label className="block text-sm text-theme-secondary">Welcome message (optional)<textarea className="mt-1 w-full p-3 rounded-xl bg-theme-base border border-theme-divider text-theme-primary" value={form.welcomeMessage} onChange={e=>setForm({...form,welcomeMessage:e.target.value})}/></label>
      <label className="flex items-center gap-2 text-sm text-theme-secondary"><input type="checkbox" checked={form.requiresJoinApproval} onChange={e=>setForm({...form,requiresJoinApproval:e.target.checked})}/>Require approval to join</label>
      <div className="flex justify-end gap-2"><button type="button" onClick={closeForm} className="px-4 py-2 rounded-xl border border-theme-divider text-theme-primary">Cancel</button><button disabled={busy||!form.coverImage} className="px-4 py-2 rounded-xl bg-[#5E43F3] text-white font-bold disabled:opacity-50">{busy?'Working…':editing?'Save changes':'Create room'}</button></div>
    </form></div>}
    {memberRoom && <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4"><div className="w-full max-w-lg max-h-[80vh] overflow-y-auto p-5 rounded-2xl bg-theme-surface border border-theme-divider"><div className="flex justify-between mb-4"><h2 className="font-black text-theme-primary">{memberRoom.name} members ({memberRoom.memberCount})</h2><button onClick={()=>setMemberRoom(null)}><X/></button></div><div className="space-y-2">{(members ?? []).map((member:any)=><div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-theme-base"><img src={member.avatar||undefined} className="w-9 h-9 rounded-full object-cover bg-theme-surface"/><div className="flex-1 min-w-0"><div className="text-sm font-bold text-theme-primary truncate">{member.name}</div><div className="text-xs text-theme-tertiary">@{member.username} · {member.role}</div></div>{member.role!=='owner'&&<><select value={member.role} onChange={async e=>{await setRole({groupId:memberRoom._id,userId:member.id,role:e.target.value as any});}} className="text-xs p-1 rounded bg-theme-surface text-theme-primary"><option value="member">Member</option><option value="moderator">Moderator</option><option value="admin">Admin</option></select><button onClick={async()=>{if(confirm(`Remove @${member.username} from this room?`)) await removeMember({groupId:memberRoom._id,userId:member.id});}} className="text-xs text-rose-400">Remove</button></>}</div>)}</div>{members?.length===0&&<p className="text-sm text-theme-tertiary">No members found.</p>}<button onClick={()=>setMemberRoom(null)} className="mt-4 px-4 py-2 rounded-xl bg-[#5E43F3] text-white">Done</button></div></div>}
  </div>;
};
