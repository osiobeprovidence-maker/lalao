import React from 'react';
import { useLalao } from '../../context/LalaoContext';
import { PostComposer } from './PostComposer';

export const PostComposerModal: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const { createFlowType, setCreateFlowType, setIsCreateSheetOpen } = useLalao();

  if (createFlowType !== 'post') return null;

  const handleClose = () => {
    setCreateFlowType(null);
    setIsCreateSheetOpen(false);
  };

  if (embedded) {
    return (
      <div className="relative w-full min-h-[calc(100vh-5rem)] bg-[#f6f3ee] flex flex-col overflow-y-auto animate-in fade-in duration-200">
        <PostComposer embedded onClose={handleClose} />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="w-full max-w-[640px] my-auto">
        <PostComposer embedded={false} onClose={handleClose} />
      </div>
    </div>
  );
};
