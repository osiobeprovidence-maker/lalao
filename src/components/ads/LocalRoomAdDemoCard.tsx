import React, { useState } from 'react';
import { ExternalLink, Megaphone } from 'lucide-react';

export const LocalRoomAdDemoCard: React.FC = () => {
  const [impressions, setImpressions] = useState(0);
  const [clicks, setClicks] = useState(0);

  return (
    <article className="mx-auto w-full max-w-2xl rounded-2xl border border-amber-500/25 bg-theme-surface p-4 shadow-xs">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-theme-primary">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5E43F3]/10 text-[#5E43F3]">
            <Megaphone size={18} />
          </span>
          JointheQ
        </div>
        <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
          Sponsored · Local demo
        </span>
      </div>

      <h3 className="text-base font-bold text-theme-primary">Hey lalao</h3>
      <p className="mt-1 text-sm leading-relaxed text-theme-secondary">
        Find your people and join the conversation on Lalao.
      </p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-theme-divider pt-3">
        <p className="text-xs text-theme-tertiary">
          ₦1,000 demo budget · Approved / paid (demo only) · Not billed
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setImpressions((count) => count + 1)}
            className="rounded-lg border border-theme-divider px-3 py-2 text-xs font-semibold text-theme-primary hover:bg-theme-surface-hover"
          >
            Simulate impression ({impressions})
          </button>
          <button
            type="button"
            onClick={() => setClicks((count) => count + 1)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#5E43F3] px-3 py-2 text-xs font-bold text-white hover:bg-[#4E34E0]"
          >
            Preview ad ({clicks}) <ExternalLink size={13} />
          </button>
        </div>
      </div>
    </article>
  );
};
