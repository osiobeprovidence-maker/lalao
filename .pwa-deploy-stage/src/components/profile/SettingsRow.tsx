import React from 'react';
import { ChevronRight } from 'lucide-react';

interface SettingsRowProps {
  id?: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  badge?: React.ReactNode;
  statusText?: string;
  onClick: () => void;
  destructive?: boolean;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
  id,
  icon: Icon,
  title,
  description,
  badge,
  statusText,
  onClick,
  destructive = false,
}) => {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group ${
        destructive
          ? 'border-rose-200 bg-rose-50/40 hover:bg-rose-100/60 text-rose-600'
          : 'border-theme-divider-light bg-theme-surface hover:bg-theme-surface-hover/80 hover:border-theme-divider active:scale-[0.99]'
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
            destructive
              ? 'bg-rose-100 text-rose-600'
              : 'bg-[#5E43F3]/10 text-[#5E43F3] dark:bg-[#5E43F3]/20 dark:text-[#7C66FF]'
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs sm:text-sm font-bold truncate ${
                destructive ? 'text-rose-600' : 'text-theme-primary'
              }`}
            >
              {title}
            </span>
            {badge}
          </div>
          <p className="text-[11px] text-theme-tertiary mt-0.5 line-clamp-1 leading-snug">
            {description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {statusText && (
          <span className="text-[11px] font-semibold text-theme-tertiary hidden sm:inline-block">
            {statusText}
          </span>
        )}
        <ChevronRight
          className={`w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 ${
            destructive ? 'text-rose-400' : 'text-theme-tertiary'
          }`}
        />
      </div>
    </button>
  );
};
