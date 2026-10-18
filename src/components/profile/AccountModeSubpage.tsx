import React, { useState } from 'react';
import { ArrowLeft, Shield, ExternalLink, UserCheck, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useLalao } from '../../context/LalaoContext';

interface AccountModeSubpageProps {
  onBack: () => void;
  role?: string;
  onCloseSettings: () => void;
}

export const AccountModeSubpage: React.FC<AccountModeSubpageProps> = ({
  onBack,
  role,
  onCloseSettings,
}) => {
  const navigate = useNavigate();
  const { triggerShareToast } = useLalao();
  const createAdminSession = useMutation(api.admin.createAdminSession);
  const [isCreatingAdminSession, setIsCreatingAdminSession] = useState(false);

  const isStaff = role === 'super_admin' || role === 'admin' || role === 'editor';

  const handleSwitchToAdmin = async () => {
    try {
      setIsCreatingAdminSession(true);
      const token = await createAdminSession({});
      sessionStorage.setItem('lalao_admin_token', token);
      onCloseSettings();
      navigate('/admin');
    } catch (e: any) {
      triggerShareToast(e.message || 'Failed to switch to Admin');
      setIsCreatingAdminSession(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-theme-surface animate-in fade-in duration-200">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-theme-surface/95 backdrop-blur-md border-b border-theme-divider-light px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-account-mode"
            type="button"
            onClick={onBack}
            className="p-1.5 -ml-1 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
            title="Back to Settings Hub"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-base text-theme-primary">Account Mode & Role</h1>
            <p className="text-[11px] text-theme-tertiary">Administrative access & platform privileges</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="px-3.5 py-1.5 rounded-full bg-theme-surface-hover hover:bg-theme-surface-active text-theme-primary text-xs font-bold transition-all cursor-pointer"
        >
          Done
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-xl mx-auto w-full pb-24">
        {/* Role Overview */}
        <div className="p-4 rounded-2xl bg-theme-base border border-theme-divider-light space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-theme-primary">Current Account Role</span>
            <span className="px-2.5 py-1 rounded-full bg-[#5E43F3]/10 text-[#5E43F3] text-xs font-extrabold capitalize">
              {role || 'Standard Member'}
            </span>
          </div>
          <p className="text-[11px] text-theme-tertiary leading-relaxed">
            {isStaff
              ? 'Your account has verified staff administration credentials. You can access internal platform tooling and moderation consoles.'
              : 'Standard member account for discovering, posting, and chatting in Delta State communities.'}
          </p>
        </div>

        {/* Admin Navigation (Staff Only) */}
        {isStaff ? (
          <div className="space-y-3">
            <div className="border-b border-theme-divider-light pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
                Staff Operations
              </h3>
            </div>

            <button
              id="btn-navigate-admin-panel"
              type="button"
              onClick={handleSwitchToAdmin}
              disabled={isCreatingAdminSession}
              className="w-full p-4 rounded-2xl border border-theme-divider bg-theme-surface hover:bg-theme-surface-hover transition-all cursor-pointer flex items-center justify-between gap-4 text-left group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-theme-inverse text-theme-text-inverse flex items-center justify-center shrink-0">
                  {isCreatingAdminSession ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <Shield className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-theme-primary block">
                    Launch Admin Dashboard
                  </span>
                  <p className="text-[11px] text-theme-tertiary mt-0.5 line-clamp-1">
                    Manage users, platform settings, content moderation, & beta releases
                  </p>
                </div>
              </div>

              <ExternalLink className="w-4 h-4 text-theme-tertiary group-hover:text-theme-primary group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl border border-dashed border-theme-divider text-center space-y-1">
            <UserCheck className="w-6 h-6 text-theme-tertiary mx-auto mb-1" />
            <p className="text-xs font-bold text-theme-secondary">No Administrative Privileges</p>
            <p className="text-[11px] text-theme-tertiary">
              Administrative switches are restricted to authorized platform editors and admins.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
