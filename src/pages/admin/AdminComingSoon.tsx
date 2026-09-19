import React from 'react';
import { Construction } from 'lucide-react';

interface AdminComingSoonProps {
  title: string;
  description?: string;
}

export const AdminComingSoon: React.FC<AdminComingSoonProps> = ({
  title,
  description,
}) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-8">
    <div className="w-16 h-16 rounded-2xl bg-indigo-900/30 border border-indigo-700/40 flex items-center justify-center mb-5">
      <Construction className="w-8 h-8 text-indigo-400" />
    </div>
    <h2 className="text-2xl font-black text-white mb-2">{title}</h2>
    <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
      {description ??
        'This section is being built. Check back soon — it will connect to real Lalao platform data.'}
    </p>
    <span className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-indigo-700/50 bg-indigo-900/30 px-3 py-1 text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
      Coming Soon
    </span>
  </div>
);
