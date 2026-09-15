import React from 'react';
import { X, PenLine, Hand, Building2, ChevronRight } from 'lucide-react';
import { useLalao, CreateOption } from '../../context/LalaoContext';

export const CreateBottomSheet: React.FC = () => {
  const { isCreateSheetOpen, setIsCreateSheetOpen, setCreateFlowType } = useLalao();

  if (!isCreateSheetOpen) return null;

  const handleSelect = (type: CreateOption) => {
    setCreateFlowType(type);
  };

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
        {/* Grab Handle (mobile only) */}
        <div className="w-10 h-1 bg-neutral-300 rounded-full mx-auto sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-neutral-950 font-sans">
              Create
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">What do you want to do?</p>
          </div>
          <button
            id="btn-close-create-sheet"
            onClick={() => setIsCreateSheetOpen(false)}
            className="p-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {/* 1. POST */}
          <button
            id="btn-create-option-post"
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

          {/* 2. RALLY */}
          <button
            id="btn-create-option-rally"
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

          {/* 3. CREATE PAGE */}
          <button
            id="btn-create-option-page"
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
