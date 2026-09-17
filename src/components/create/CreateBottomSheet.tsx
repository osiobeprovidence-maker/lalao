import React from 'react';
import { X, PenLine, Hand, Building2, ChevronRight, ArrowLeft } from 'lucide-react';
import { useLalao, CreateOption } from '../../context/LalaoContext';
import { PostComposerModal } from './PostComposerModal';
import { RallyComposerModal } from './RallyComposerModal';
import { CreatePageView } from '../pages/CreatePageView';

export const CreateBottomSheet: React.FC = () => {
  const { isCreateSheetOpen, setIsCreateSheetOpen, setCreateFlowType, createFlowType } = useLalao();

  if (!isCreateSheetOpen) return null;

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

  const handleSelect = (type: CreateOption) => {
    setCreateFlowType(type);
  };

  const handleClose = () => {
    if (createFlowType) {
      setCreateFlowType(null);
      if (!isDesktop) {
        setIsCreateSheetOpen(false);
      }
      return;
    }

    setIsCreateSheetOpen(false);
  };

  if (isDesktop) {
    return (
      <div className="w-full bg-[#f6f3ee] min-h-[calc(100vh-2rem)] px-3 py-3 sm:px-4 lg:px-0">
        {createFlowType === 'post' && <PostComposerModal embedded />}
        {createFlowType === 'rally' && <RallyComposerModal embedded />}
        {createFlowType === 'page' && <CreatePageView embedded />}

        {createFlowType === null && (
          <div className="w-full max-w-[760px] bg-[#f6f3ee]">
            <div className="sticky top-0 z-10 rounded-t-3xl border-b border-neutral-200/80 bg-[#f6f3ee]/95 px-4 py-3 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateSheetOpen(false)}
                    className="p-1.5 -ml-1 rounded-full text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer"
                    title="Go back"
                    aria-label="Go back"
                  >
                    <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
                  </button>
                  <div>
                    <h2 className="text-base font-bold tracking-tight text-neutral-950">Create</h2>
                    <p className="text-[11px] text-neutral-500">What do you want to do?</p>
                  </div>
                </div>

                <button
                  id="btn-close-create-sheet"
                  type="button"
                  onClick={() => setIsCreateSheetOpen(false)}
                  className="p-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                  aria-label="Close create workspace"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4 p-4 pb-8 pt-4">
              <button
                id="btn-create-option-post"
                type="button"
                onClick={() => handleSelect('post')}
                className="w-full rounded-2xl border border-neutral-200 bg-white p-4 text-left transition-all hover:border-[#5E43F3]/30 hover:bg-[#f6f3ee] active:scale-[0.99] cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#5E43F3]/10 text-[#5E43F3] shadow-xs">
                    <PenLine className="h-6 w-6 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-base font-bold text-neutral-900">Post</span>
                      <ChevronRight className="h-4 w-4 text-neutral-400" />
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                      Share a photo, video or thought with your community.
                    </p>
                  </div>
                </div>
              </button>

              <button
                id="btn-create-option-rally"
                type="button"
                onClick={() => handleSelect('rally')}
                className="w-full rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 to-purple-50/60 p-4 text-left transition-all hover:border-[#5E43F3]/30 hover:from-indigo-100/70 hover:to-purple-100/70 active:scale-[0.99] cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#5E43F3] text-white shadow-md shadow-[#5E43F3]/30">
                    <Hand className="h-6 w-6 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-bold text-neutral-900">Rally</span>
                        <span className="rounded bg-[#5E43F3] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white">
                          Action
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-neutral-400" />
                    </div>
                    <p className="mt-1 text-xs font-normal leading-relaxed text-neutral-700">
                      Reach out to people near you — ask for something, offer help, or invite people to join you.
                    </p>
                  </div>
                </div>
              </button>

              <button
                id="btn-create-option-page"
                type="button"
                onClick={() => handleSelect('page')}
                className="w-full rounded-2xl border border-neutral-200 bg-white p-4 text-left transition-all hover:border-emerald-200 hover:bg-emerald-50/40 active:scale-[0.99] cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 shadow-xs">
                    <Building2 className="h-6 w-6 stroke-[2]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-base font-bold text-neutral-900">Create Page</span>
                      <ChevronRight className="h-4 w-4 text-neutral-400" />
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                      Build a distinct identity for your football club, brand, organization or community.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      id="create-bottom-sheet-backdrop"
      onClick={() => setIsCreateSheetOpen(false)}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity animate-in fade-in duration-200"
    >
      <div
        id="create-bottom-sheet-modal"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom duration-300 border-t sm:border border-neutral-200"
      >
        <div className="w-10 h-1 bg-neutral-300 rounded-full mx-auto sm:hidden" />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-neutral-950 font-sans">
              Create
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">What do you want to do?</p>
          </div>
          <button
            id="btn-close-create-sheet"
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <button
            id="btn-create-option-post"
            type="button"
            onClick={() => handleSelect('post')}
            className="w-full p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100/90 active:scale-[0.99] border border-neutral-100 transition-all text-left flex items-start gap-4 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center shrink-0 group-hover:bg-[#5E43F3] group-hover:text-white transition-colors shadow-xs">
              <PenLine className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-base text-neutral-900">Post</span>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                Share a photo, video or thought with your community.
              </p>
            </div>
          </button>

          <button
            id="btn-create-option-rally"
            type="button"
            onClick={() => handleSelect('rally')}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-indigo-50/70 to-purple-50/50 hover:from-indigo-100/70 hover:to-purple-100/70 active:scale-[0.99] border border-indigo-100/80 transition-all text-left flex items-start gap-4 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#5E43F3] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#5E43F3]/30">
              <Hand className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base text-neutral-900">Rally</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-[#5E43F3] text-white rounded">
                    Action
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-neutral-700 mt-1 leading-relaxed font-normal">
                Reach out to people near you — ask for something, offer help, or invite people to join you.
              </p>
            </div>
          </button>

          <button
            id="btn-create-option-page"
            type="button"
            onClick={() => handleSelect('page')}
            className="w-full p-4 rounded-2xl bg-neutral-50 hover:bg-neutral-100/90 active:scale-[0.99] border border-neutral-100 transition-all text-left flex items-start gap-4 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-xs">
              <Building2 className="w-6 h-6 stroke-[2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-base text-neutral-900">Create Page</span>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                Build a distinct identity for your football club, brand, organization or community.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
