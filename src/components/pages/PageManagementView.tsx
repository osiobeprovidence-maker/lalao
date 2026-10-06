import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Settings,
  Users,
  Edit3,
  Trash2,
  LogOut,
  Crown,
  ShieldCheck,
  Pencil,
  Eye,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';

interface PageManagementViewProps {
  page: {
    id: string;
    name: string;
    username: string;
    type: string;
    badge?: string;
    avatar?: string;
    coverImage?: string;
    description?: string;
    followersCount?: number;
    isOwner: boolean;
    role: string;
  };
  onClose: () => void;
  onEditPage?: () => void;
  onManageAdmins?: () => void;
}

const ROLE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  owner: {
    label: 'Owner',
    icon: <Crown className="w-3.5 h-3.5" />,
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  admin: {
    label: 'Admin',
    icon: <ShieldCheck className="w-3.5 h-3.5" />,
    color: 'bg-[#5E43F3]/10 text-[#5E43F3] border-[#5E43F3]/20',
  },
  editor: {
    label: 'Editor',
    icon: <Pencil className="w-3.5 h-3.5" />,
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  moderator: {
    label: 'Moderator',
    icon: <Eye className="w-3.5 h-3.5" />,
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
};

type DialogState =
  | null
  | 'confirmLeave'
  | 'confirmDelete'
  | 'deleteTyping';

export const PageManagementView: React.FC<PageManagementViewProps> = ({
  page,
  onClose,
  onEditPage,
  onManageAdmins,
}) => {
  const { setActiveTab } = useLalao();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isActioning, setIsActioning] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const deletePage = useMutation(api.pages.deletePage);
  const leavePageManagement = useMutation(api.pages.leavePageManagement);
  const members = useQuery(api.pages.getPageMembers, { pageId: page.id as any });

  const roleInfo = ROLE_CONFIG[page.role] ?? ROLE_CONFIG['admin'];
  const isOwner = page.isOwner || page.role === 'owner';

  const handleCopyUsername = () => {
    navigator.clipboard.writeText(`@${page.username}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleLeave = async () => {
    setIsActioning(true);
    setActionError(null);
    try {
      await leavePageManagement({ pageId: page.id as any });
      setDialog(null);
      onClose();
    } catch (err: any) {
      setActionError(err?.message ?? 'Failed to leave page management.');
    } finally {
      setIsActioning(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== page.name) return;
    setIsActioning(true);
    setActionError(null);
    try {
      await deletePage({ pageId: page.id as any });
      setDialog(null);
      onClose();
      setActiveTab('home');
    } catch (err: any) {
      setActionError(err?.message ?? 'Failed to delete page.');
    } finally {
      setIsActioning(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-theme-surface overflow-y-auto flex flex-col animate-in fade-in slide-in-from-right-4 duration-250">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 bg-theme-surface/95 backdrop-blur-md border-b border-theme-divider-light px-4 py-3 sm:px-6 flex items-center gap-3 z-20 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-theme-surface-hover text-theme-primary transition-colors cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-black text-theme-primary">Page Management</h3>
          <p className="text-xs text-theme-tertiary truncate">@{page.username}</p>
        </div>
        {/* Role badge in header */}
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold shrink-0 ${roleInfo.color}`}>
          {roleInfo.icon}
          {roleInfo.label}
        </span>
      </div>

      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-5 pb-24 space-y-6">

        {/* ── Page Preview Card ──────────────────────────────────────────── */}
        <div className="rounded-2xl border border-theme-divider bg-theme-surface overflow-hidden">
          {page.coverImage && (
            <div className="h-24 bg-theme-surface-hover overflow-hidden">
              <img src={page.coverImage} alt="Cover" className="w-full h-full object-cover" />
            </div>
          )}
          <div className={`flex items-center gap-4 px-4 ${page.coverImage ? 'pb-4 pt-3' : 'py-4'}`}>
            <div className="w-14 h-14 rounded-xl border border-theme-divider-light overflow-hidden bg-theme-surface-hover shrink-0 flex items-center justify-center">
              {page.avatar ? (
                <img src={page.avatar} alt={page.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-6 h-6 text-theme-tertiary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-black text-theme-primary text-base truncate">{page.name}</h2>
              <button
                onClick={handleCopyUsername}
                className="flex items-center gap-1 text-[13px] text-theme-tertiary hover:text-theme-primary transition-colors mt-0.5"
              >
                @{page.username}
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              </button>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold uppercase tracking-wide bg-theme-surface-hover text-theme-secondary px-1.5 py-0.5 rounded">
                  {page.type}
                </span>
                {page.badge && page.badge !== page.type.toUpperCase() && (
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-[#5E43F3]/10 text-[#5E43F3] px-1.5 py-0.5 rounded">
                    {page.badge}
                  </span>
                )}
                <span className="text-[12px] text-theme-tertiary">
                  {(page.followersCount ?? 0).toLocaleString()} followers
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                setActiveTab('pages');
              }}
              className="p-2 rounded-full hover:bg-theme-surface-hover text-theme-tertiary hover:text-theme-primary transition-colors shrink-0"
              title="View page"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Your access ───────────────────────────────────────────────── */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary mb-2">Your access</h4>
          <div className="rounded-2xl border border-theme-divider bg-theme-surface divide-y divide-theme-divider-light overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${roleInfo.color}`}>
                {roleInfo.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-theme-primary">{roleInfo.label}</p>
                <p className="text-xs text-theme-tertiary">
                  {page.role === 'owner'
                    ? 'Full control — you created and own this page'
                    : page.role === 'admin'
                    ? 'Can edit page, manage members, and publish content'
                    : page.role === 'editor'
                    ? 'Can publish and edit content on this page'
                    : 'Can moderate content and comments'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-8 h-8 rounded-full bg-theme-surface-active flex items-center justify-center shrink-0 text-theme-secondary">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-theme-primary">Team size</p>
                <p className="text-xs text-theme-tertiary">
                  {members === undefined ? '…' : `${members.length} member${members.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Page Management actions ───────────────────────────────────── */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary mb-2">Management</h4>
          <div className="rounded-2xl border border-theme-divider bg-theme-surface divide-y divide-theme-divider-light overflow-hidden">
            <button
              onClick={onEditPage}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-theme-surface-hover transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center shrink-0">
                <Edit3 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-theme-primary">Edit Page</p>
                <p className="text-xs text-theme-tertiary">Update name, bio, avatar, cover & details</p>
              </div>
              <ChevronRight className="w-4 h-4 text-theme-tertiary shrink-0" />
            </button>

            {(isOwner || page.role === 'admin') && (
              <button
                onClick={onManageAdmins}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-theme-surface-hover transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-theme-primary">Manage Admins</p>
                  <p className="text-xs text-theme-tertiary">Invite, remove or update team members</p>
                </div>
                <ChevronRight className="w-4 h-4 text-theme-tertiary shrink-0" />
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                // Navigate to the page's settings
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-theme-surface-hover transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-theme-surface-active text-theme-secondary flex items-center justify-center shrink-0">
                <Settings className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-theme-primary">Page Settings</p>
                <p className="text-xs text-theme-tertiary">Visibility, discovery, and advanced options</p>
              </div>
              <ChevronRight className="w-4 h-4 text-theme-tertiary shrink-0" />
            </button>
          </div>
        </div>

        {/* ── Danger Zone ───────────────────────────────────────────────── */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-2">Danger Zone</h4>
          <div className="rounded-2xl border border-rose-500/20 bg-theme-surface divide-y divide-rose-500/10 overflow-hidden">
            {!isOwner && (
              <button
                onClick={() => setDialog('confirmLeave')}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-rose-500/5 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                  <LogOut className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-rose-600">Remove myself from page</p>
                  <p className="text-xs text-theme-tertiary">Leave this page's management team</p>
                </div>
              </button>
            )}

            {isOwner && (
              <button
                onClick={() => setDialog('confirmDelete')}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-rose-500/5 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-rose-600">Delete Page</p>
                  <p className="text-xs text-theme-tertiary">
                    Permanently delete this page and all its content. Cannot be undone.
                  </p>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          CONFIRM LEAVE DIALOG
      ═════════════════════════════════════════════════════════════════════ */}
      {dialog === 'confirmLeave' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-theme-surface rounded-3xl border border-theme-divider shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4 mx-auto">
              <LogOut className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="text-lg font-black text-theme-primary text-center mb-1">Leave "{page.name}"?</h3>
            <p className="text-sm text-theme-tertiary text-center leading-relaxed mb-5">
              You will be removed from the management team and lose your{' '}
              <strong className="text-theme-primary">{roleInfo.label}</strong> access to this page.
              The page itself will not be affected.
            </p>
            {actionError && (
              <p className="text-xs text-rose-500 bg-rose-500/10 px-3 py-2 rounded-xl mb-4">{actionError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setDialog(null); setActionError(null); }}
                disabled={isActioning}
                className="flex-1 py-2.5 rounded-xl border border-theme-divider text-sm font-bold text-theme-primary hover:bg-theme-surface-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLeave}
                disabled={isActioning}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isActioning && <Loader2 className="w-4 h-4 animate-spin" />}
                Leave Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          CONFIRM DELETE DIALOG — Step 1
      ═════════════════════════════════════════════════════════════════════ */}
      {dialog === 'confirmDelete' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-theme-surface rounded-3xl border border-theme-divider shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="text-lg font-black text-theme-primary text-center mb-1">Delete "{page.name}"?</h3>
            <p className="text-sm text-theme-tertiary text-center leading-relaxed mb-5">
              This will permanently remove the page, all posts, media, followers and other page data.{' '}
              <strong className="text-rose-500">This action cannot be undone.</strong>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDialog(null)}
                className="flex-1 py-2.5 rounded-xl border border-theme-divider text-sm font-bold text-theme-primary hover:bg-theme-surface-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setDialog('deleteTyping')}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 active:scale-95 transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          CONFIRM DELETE DIALOG — Step 2 (type name to confirm)
      ═════════════════════════════════════════════════════════════════════ */}
      {dialog === 'deleteTyping' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-theme-surface rounded-3xl border border-theme-divider shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4 mx-auto">
              <Trash2 className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="text-lg font-black text-theme-primary text-center mb-1">Final confirmation</h3>
            <p className="text-sm text-theme-tertiary text-center leading-relaxed mb-4">
              Type <span className="font-bold text-rose-500 font-mono">{page.name}</span> below to confirm you want to permanently delete this page.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={page.name}
              className="w-full border border-theme-divider rounded-xl px-3.5 py-2.5 text-sm bg-theme-base text-theme-primary placeholder:text-theme-tertiary focus:outline-none focus:border-rose-500 transition-colors mb-4"
              autoFocus
            />
            {actionError && (
              <p className="text-xs text-rose-500 bg-rose-500/10 px-3 py-2 rounded-xl mb-4">{actionError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setDialog(null); setDeleteConfirmText(''); setActionError(null); }}
                disabled={isActioning}
                className="flex-1 py-2.5 rounded-xl border border-theme-divider text-sm font-bold text-theme-primary hover:bg-theme-surface-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirmText !== page.name || isActioning}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isActioning && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
