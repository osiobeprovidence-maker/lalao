// @ts-nocheck
import React from 'react';
import { X, PenLine, Hand, Building2, ChevronRight, ArrowLeft, Sparkles } from 'lucide-react';
import { useLalao, CreateOption } from '../../context/LalaoContext';
import { PostComposerModal } from './PostComposerModal';
import { RallyComposerModal } from './RallyComposerModal';
import { CreatePageView } from '../pages/CreatePageView';

export const CreateBottomSheet: React.FC = () => {
  const { isCreateSheetOpen, setIsCreateSheetOpen, setCreateFlowType, createFlowType, setActiveTab, setIsCreateCycleOpen } = useLalao();

  if (!isCreateSheetOpen) return null;

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

  const handleSelect = (type: CreateOption) => {
    if (type === 'post') {
      setCreateFlowType(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('lalao:navigate-create-post'));
      }
      return;
    }

    if (type === 'rally') {
      setCreateFlowType('rally');
      return;
    }

    if (type === 'cycle') {
      setIsCreateSheetOpen(false);
      setCreateFlowType(null);
      setIsCreateCycleOpen(true);
      return;
    }

    if (type === 'page') {
      setIsCreateSheetOpen(false);
      setCreateFlowType(null);
      setActiveTab('create-page');
      return;
    }

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

  const renderCreateOptions = () => {
    if (isDesktop) {
      return (
        <div className="w-full max-w-[760px] bg-theme-base">
          <div className="sticky top-0 z-10 rounded-t-3xl border-b border-theme-divider/80 bg-theme-base/95 px-4 py-3 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateSheetOpen(false)}
                  className="p-1.5 -ml-1 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
                  title="Go back"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
                </button>
                <div>
                  <h2 className="text-base font-bold tracking-tight text-theme-primary">Create</h2>
                  <p className="text-[11px] text-theme-tertiary">What do you want to do?</p>
                </div>
              </div>

              <button
                id="btn-close-create-sheet"
                type="button"
                onClick={() => setIsCreateSheetOpen(false)}
                className="p-2 rounded-full text-theme-tertiary hover:text-theme-secondary hover:bg-theme-surface-hover transition-colors cursor-pointer"
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
              className="w-full rounded-2xl border border-theme-divider bg-theme-surface p-4 text-left transition-all hover:border-[#5E43F3]/30 hover:bg-theme-base active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#5E43F3]/10 text-[#5E43F3] shadow-xs">
                  <PenLine className="h-6 w-6 stroke-[2.2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-base font-bold text-theme-primary">Normal Post</span>
                    <ChevronRight className="h-4 w-4 text-theme-tertiary" />
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-theme-secondary">
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
                      <span className="text-base font-bold text-theme-primary">Rally</span>
                      <span className="rounded bg-[#5E43F3] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white">
                        Action
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-theme-tertiary" />
                  </div>
                  <p className="mt-1 text-xs font-normal leading-relaxed text-theme-secondary">
                    Reach out to people near you — ask for something, offer help, or invite people to join you.
                  </p>
                </div>
              </div>
            </button>

            <button
              id="btn-create-option-cycle"
              type="button"
              onClick={() => handleSelect('cycle')}
              className="w-full rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50/60 to-pink-50/50 p-4 text-left transition-all hover:border-[#5E43F3]/30 hover:from-purple-100/70 hover:to-pink-100/60 active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#5E43F3] to-pink-500 text-white shadow-md shadow-[#5E43F3]/20">
                  <Sparkles className="h-6 w-6 stroke-[2.2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-bold text-theme-primary">Cycle Status</span>
                      <span className="rounded bg-gradient-to-r from-[#5E43F3] to-pink-500 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white">
                        24 Hours
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-theme-tertiary" />
                  </div>
                  <p className="mt-1 text-xs font-normal leading-relaxed text-theme-secondary">
                    Share a 24-hour photo, video, audio note, or text status to your local cycle.
                  </p>
                </div>
              </div>
            </button>

            <button
              id="btn-create-option-page"
              type="button"
              onClick={() => handleSelect('page')}
              className="w-full rounded-2xl border border-theme-divider bg-theme-surface p-4 text-left transition-all hover:border-emerald-200 hover:bg-emerald-50/40 active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 shadow-xs">
                  <Building2 className="h-6 w-6 stroke-[2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-base font-bold text-theme-primary">Page</span>
                    <ChevronRight className="h-4 w-4 text-theme-tertiary" />
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-theme-secondary">
                    Build a distinct identity for your football club, brand, organization or community.
                  </p>
                </div>
              </div>
            </button>
          </div>
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
          className="w-full max-w-lg bg-theme-surface rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom duration-300 border-t sm:border border-theme-divider"
        >
          <div className="w-10 h-1 bg-theme-divider-strong rounded-full mx-auto sm:hidden" />

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black tracking-tight text-theme-primary font-sans">
                Create
              </h2>
              <p className="text-xs text-theme-tertiary mt-0.5">What do you want to do?</p>
            </div>
            <button
              id="btn-close-create-sheet"
              type="button"
              onClick={handleClose}
              className="p-2 rounded-full text-theme-tertiary hover:text-theme-secondary hover:bg-theme-surface-hover transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* @ts-ignore */}
            <DiscoverView embedded />
          </div>

          <div className="space-y-3">
            <button
              id="btn-create-option-post"
              type="button"
              onClick={() => handleSelect('post')}
              className="w-full p-4 rounded-2xl bg-theme-base hover:bg-theme-surface-hover/90 active:scale-[0.99] border border-theme-divider-light transition-all text-left flex items-start gap-4 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#5E43F3]/10 text-[#5E43F3] flex items-center justify-center shrink-0 group-hover:bg-[#5E43F3] group-hover:text-white transition-colors shadow-xs">
                <PenLine className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-theme-primary">Normal Post</span>
                  <ChevronRight className="w-4 h-4 text-theme-tertiary group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-xs text-theme-secondary mt-1 leading-relaxed">
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
                    <span className="font-bold text-base text-theme-primary">Rally</span>
                    <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-[#5E43F3] text-white rounded">
                      Action
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-theme-tertiary group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-xs text-theme-secondary mt-1 leading-relaxed font-normal">
                  Reach out to people near you — ask for something, offer help, or invite people to join you.
                </p>
              </div>
            </button>

            <button
              id="btn-create-option-cycle"
              type="button"
              onClick={() => handleSelect('cycle')}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-50/70 to-pink-50/50 hover:from-purple-100/70 hover:to-pink-100/70 active:scale-[0.99] border border-purple-100/80 transition-all text-left flex items-start gap-4 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5E43F3] to-pink-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-[#5E43F3]/20">
                <Sparkles className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-base text-theme-primary">Cycle Status</span>
                    <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-[#5E43F3] to-pink-500 text-white rounded">
                      24h Story
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-theme-tertiary group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-xs text-theme-secondary mt-1 leading-relaxed font-normal">
                  Share a 24-hour photo, video, audio note, or text status to your local cycle.
                </p>
              </div>
            </button>

            <button
              id="btn-create-option-page"
              type="button"
              onClick={() => handleSelect('page')}
              className="w-full p-4 rounded-2xl bg-theme-base hover:bg-theme-surface-hover/90 active:scale-[0.99] border border-theme-divider-light transition-all text-left flex items-start gap-4 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-xs">
                <Building2 className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-theme-primary">Page</span>
                  <ChevronRight className="w-4 h-4 text-theme-tertiary group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-xs text-theme-secondary mt-1 leading-relaxed">
                  Build a distinct identity for your football club, brand, organization or community.
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (createFlowType === 'post') {
    return <PostComposerModal embedded={isDesktop} />;
  }

  if (createFlowType === 'rally') {
    return <RallyComposerModal embedded={isDesktop} />;
  }

  if (createFlowType === 'page') {
    return <CreatePageView embedded={isDesktop} />;
  }

  return renderCreateOptions();
};
