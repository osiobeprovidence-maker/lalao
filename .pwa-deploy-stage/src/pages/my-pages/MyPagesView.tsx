import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Building2,
  Plus,
  Crown,
  ShieldCheck,
  Pencil,
  Eye,
  Settings2,
} from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { PageManagementView } from '../../components/pages/PageManagementView';

const ROLE_BADGE: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  owner: {
    label: 'Owner',
    icon: <Crown className="w-3 h-3" />,
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  admin: {
    label: 'Admin',
    icon: <ShieldCheck className="w-3 h-3" />,
    color: 'bg-[#5E43F3]/10 text-[#5E43F3] border-[#5E43F3]/20',
  },
  editor: {
    label: 'Editor',
    icon: <Pencil className="w-3 h-3" />,
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  moderator: {
    label: 'Moderator',
    icon: <Eye className="w-3 h-3" />,
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
};

export const MyPagesView: React.FC = () => {
  const myPages = useQuery(api.pages.getMyPages);
  const { setActiveTab } = useLalao();
  const [managingPage, setManagingPage] = useState<any | null>(null);

  if (managingPage) {
    return (
      <PageManagementView
        page={managingPage}
        onClose={() => setManagingPage(null)}
        onEditPage={() => {
          // Open the edit page flow — for now close management and let the user navigate
          setManagingPage(null);
        }}
        onManageAdmins={() => {
          setManagingPage(null);
        }}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[680px] px-4 py-8 pb-32">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-theme-primary">My Pages</h1>
          <p className="text-sm text-theme-tertiary mt-0.5">Pages you own or help manage</p>
        </div>
        <button
          onClick={() => setActiveTab('create-page')}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#5E43F3] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#4E34E0] active:scale-95"
        >
          <Plus className="h-4 w-4" />
          New Page
        </button>
      </div>

      {myPages === undefined ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-theme-surface border border-theme-divider animate-pulse" />
          ))}
        </div>
      ) : myPages.length === 0 ? (
        <div className="rounded-2xl border border-theme-divider bg-theme-surface p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-theme-surface-hover">
            <Building2 className="h-7 w-7 text-theme-tertiary" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-theme-primary">No pages yet</h3>
          <p className="mb-6 text-sm text-theme-tertiary max-w-xs mx-auto leading-relaxed">
            Create a page to build a community, business, organization, or other presence on Lalao.
          </p>
          <button
            onClick={() => setActiveTab('create-page')}
            className="inline-flex items-center gap-2 rounded-full bg-[#5E43F3] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#4E34E0]"
          >
            <Plus className="h-4 w-4" />
            Create Page
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {myPages.map((page: any) => {
            const roleCfg = ROLE_BADGE[page.role] ?? ROLE_BADGE['admin'];
            return (
              <div
                key={page.id}
                className="flex items-center gap-4 rounded-2xl border border-theme-divider bg-theme-surface p-4 transition hover:border-[#5E43F3]/30 hover:shadow-sm"
              >
                {/* Avatar */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-theme-surface-hover overflow-hidden">
                  {page.avatar ? (
                    <img src={page.avatar} alt={page.name} className="h-full w-full object-cover" />
                  ) : (
                    <Building2 className="h-5 w-5 text-theme-tertiary" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-theme-primary truncate">{page.name}</h3>
                    {/* Role badge */}
                    <span
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold shrink-0 ${roleCfg.color}`}
                    >
                      {roleCfg.icon}
                      {roleCfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="truncate text-[13px] text-theme-tertiary">@{page.username}</p>
                    <span className="shrink-0 rounded bg-theme-surface-hover px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-theme-secondary">
                      {page.type}
                    </span>
                  </div>
                  <p className="text-[12px] text-theme-tertiary mt-0.5">
                    {(page.followersCount ?? 0).toLocaleString()} followers
                  </p>
                </div>

                {/* Manage button */}
                <button
                  onClick={() => setManagingPage(page)}
                  className="shrink-0 rounded-full border border-theme-divider px-3.5 py-2 text-sm font-bold text-theme-secondary transition hover:border-[#5E43F3] hover:text-[#5E43F3] hover:bg-[#5E43F3]/5 flex items-center gap-1.5"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Manage
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
