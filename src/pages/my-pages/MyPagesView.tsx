import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Building2, Plus, ArrowRight } from 'lucide-react';
import { useLalao } from '../../context/LalaoContext';
import { useNavigate } from 'react-router-dom';

export const MyPagesView: React.FC = () => {
  const myPages = useQuery(api.pages.getMyPages);
  const { setActiveTab } = useLalao();
  const navigate = useNavigate();

  return (
    <div className="mx-auto w-full max-w-[680px] px-4 py-8 pb-32">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-theme-primary">My Pages</h1>
        <p className="text-sm text-theme-tertiary mt-1">Pages you own and manage</p>
      </div>

      {myPages === undefined ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-theme-surface border border-theme-divider animate-pulse" />
          ))}
        </div>
      ) : myPages.length === 0 ? (
        <div className="rounded-2xl border border-theme-divider bg-theme-surface p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-theme-surface-hover">
            <Building2 className="h-6 w-6 text-theme-tertiary" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-theme-primary">You don't own any pages yet.</h3>
          <p className="mb-6 text-sm text-theme-tertiary max-w-sm mx-auto">
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
        <div className="space-y-4">
          {myPages.map((page: any) => (
            <div
              key={page.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-theme-divider bg-theme-surface p-4 transition hover:border-[#5E43F3]/30 hover:shadow-sm"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-theme-surface-hover overflow-hidden">
                  {page.avatar ? (
                    <img src={page.avatar} alt={page.name} className="h-full w-full object-cover" />
                  ) : (
                    <Building2 className="h-5 w-5 text-theme-tertiary" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-bold text-theme-primary">{page.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="truncate text-[13px] text-theme-tertiary">@{page.username}</p>
                    <span className="shrink-0 rounded bg-theme-surface-hover px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-theme-secondary">
                      {page.type}
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => navigate(`/app/page/${page.id}`)}
                className="shrink-0 rounded-full border border-theme-divider px-4 py-2 text-sm font-bold text-theme-secondary transition hover:border-[#5E43F3] hover:text-[#5E43F3] flex items-center gap-2"
              >
                Manage Page
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
