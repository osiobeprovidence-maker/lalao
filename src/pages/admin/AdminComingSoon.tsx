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
    <div className="w-16 h-16 rounded-2xl bg-[#5200FF]/5 border border-[#5200FF]/10 flex items-center justify-center mb-5">
      <Construction className="w-8 h-8 text-[#5200FF]" />
    </div>
    <h2 className="text-2xl font-black text-neutral-900 mb-2">{title}</h2>
    <p className="text-sm text-neutral-500 max-w-sm leading-relaxed">
      {description ??
        'This section is being built. Check back soon — it will connect to real Lalao platform data.'}
    </p>
    <span className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-[#5200FF]/20 bg-[#5200FF]/5 px-3 py-1 text-[11px] font-bold text-[#5200FF] uppercase tracking-wider">
      Coming Soon
    </span>
  </div>
);
