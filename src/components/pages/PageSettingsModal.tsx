import React, { useState } from 'react';
import {
  ArrowLeft,
  Settings,
  Shield,
  Eye,
  MessageSquare,
  UserPlus,
  Trash2,
  Check,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { Page } from '../../types';
import { useLalao } from '../../context/LalaoContext';

interface PageSettingsModalProps {
  page: Page;
  isOpen: boolean;
  onClose: () => void;
}

export const PageSettingsModal: React.FC<PageSettingsModalProps> = ({
  page,
  isOpen,
  onClose,
}) => {
  const { triggerShareToast, setActivePageId } = useLalao();

  const [visibility, setVisibility] = useState<'public' | 'unlisted'>('public');
  const [messagingPolicy, setMessagingPolicy] = useState<'anyone' | 'followers' | 'disabled'>('anyone');
  const [allowReviews, setAllowReviews] = useState(true);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    triggerShareToast('Page settings updated!');
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 bg-white overflow-y-auto flex flex-col animate-in fade-in slide-in-from-right-4 duration-250">
      {/* Top Sticky Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-neutral-100 px-4 py-3 sm:px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-neutral-100 text-neutral-800 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="text-base font-black text-neutral-950">Page Settings</h3>
            <p className="text-xs text-neutral-500 font-medium truncate max-w-[180px] sm:max-w-md">
              @{page.username} · Privacy, messaging & manager roles
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 rounded-xl bg-[#5E43F3] text-white text-xs font-bold hover:bg-[#4E34E0] shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>Save</span>
        </button>
      </div>

      {/* Page Content Container */}
      <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 pb-24 flex-1 space-y-6">
        {/* Visibility Section */}
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-wider text-neutral-500 block">
            Page Discoverability & Visibility
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setVisibility('public')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                visibility === 'public'
                  ? 'border-[#5E43F3] bg-violet-50/50 text-[#5E43F3]'
                  : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">Public & Indexed</span>
                {visibility === 'public' && <Check className="w-4 h-4 text-[#5E43F3] stroke-[3]" />}
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Discoverable in search, map radar & local feeds across Nigeria.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setVisibility('unlisted')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                visibility === 'unlisted'
                  ? 'border-[#5E43F3] bg-violet-50/50 text-[#5E43F3]'
                  : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">Unlisted Direct Link</span>
                {visibility === 'unlisted' && <Check className="w-4 h-4 text-[#5E43F3] stroke-[3]" />}
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Accessible only via direct URL link or QR code scan.
              </p>
            </button>
          </div>
        </div>

        {/* Direct Messaging Permissions */}
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-wider text-neutral-500 block">
            Direct Inquiries & Messaging
          </label>
          <div className="space-y-2.5">
            {[
              { id: 'anyone', title: 'Open to Everyone', desc: 'Any user on LAO LINE can tap "Message" to inquire directly' },
              { id: 'followers', title: 'Followers Only', desc: 'Only users following your page can send inquiry DMs' },
              { id: 'disabled', title: 'Disabled', desc: 'Direct messaging inquiry button is hidden from public profile' },
            ].map((opt) => (
              <label
                key={opt.id}
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  messagingPolicy === opt.id
                    ? 'border-[#5E43F3] bg-violet-50/30'
                    : 'border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                <div>
                  <p className="text-sm font-bold text-neutral-900">{opt.title}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{opt.desc}</p>
                </div>
                <input
                  type="radio"
                  name="msg_policy"
                  checked={messagingPolicy === opt.id}
                  onChange={() => setMessagingPolicy(opt.id as any)}
                  className="accent-[#5E43F3] w-4 h-4"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Roles and Managers */}
        <div className="space-y-3 pt-2 border-t border-neutral-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black uppercase tracking-wider text-neutral-500">
              Page Managers & Admins
            </label>
            <button
              type="button"
              onClick={() => triggerShareToast('Invite co-manager link copied!')}
              className="text-xs font-bold text-[#5E43F3] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Co-Manager</span>
            </button>
          </div>

          <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#5E43F3] text-white flex items-center justify-center font-bold text-sm">
                P
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-900">Providence (You)</p>
                <p className="text-xs text-neutral-500">Primary Page Owner · Full Access</p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-violet-100 text-[#5E43F3]">
              OWNER
            </span>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="pt-4 border-t border-neutral-100 space-y-3">
          <label className="text-xs font-black uppercase tracking-wider text-red-500 block">
            Danger Zone
          </label>
          {!showConfirmDelete ? (
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              className="w-full py-3 px-4 rounded-2xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete or Archive Page</span>
            </button>
          ) : (
            <div className="p-4 bg-red-50 rounded-2xl border border-red-200 space-y-3 animate-in fade-in">
              <p className="text-xs font-bold text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                Are you sure you want to permanently delete this page?
              </p>
              <p className="text-xs text-red-700">
                This action immediately removes <strong>{page.name}</strong>, its storefront catalog, posts, and events.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerShareToast(`Page ${page.name} deleted.`);
                    setActivePageId(null);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer shadow-sm"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-neutral-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-[#5E43F3] text-white text-xs font-bold hover:bg-[#4E34E0] shadow-md shadow-[#5E43F3]/25 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
