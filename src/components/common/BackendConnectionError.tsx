import React from 'react';
import { RefreshCw } from 'lucide-react';

export const BackendConnectionError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="min-h-[50vh] flex items-center justify-center bg-theme-surface px-5 text-center">
    <div className="max-w-sm space-y-4">
      <h2 className="text-lg font-semibold text-theme-primary">Could not load your profile</h2>
      <p className="text-sm text-theme-secondary">Check your connection, then try again.</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-xl bg-[#5E43F3] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5037df]"
      >
        <RefreshCw className="h-4 w-4" />
        Retry
      </button>
    </div>
  </div>
);
