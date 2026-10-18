import React from 'react';
import { ArrowLeft, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface AppearanceSubpageProps {
  onBack: () => void;
}

export const AppearanceSubpage: React.FC<AppearanceSubpageProps> = ({ onBack }) => {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    {
      id: 'light' as const,
      label: 'Light Mode',
      desc: 'Clean, high-contrast light background optimized for daylight',
      icon: Sun,
    },
    {
      id: 'dark' as const,
      label: 'Dark Mode',
      desc: 'Deep dark surfaces designed for nighttime browsing and battery saving',
      icon: Moon,
    },
    {
      id: 'system' as const,
      label: 'Automatic',
      desc: 'Match your device or system display settings automatically',
      icon: Monitor,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-theme-surface animate-in fade-in duration-200">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-theme-surface/95 backdrop-blur-md border-b border-theme-divider-light px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-appearance"
            type="button"
            onClick={onBack}
            className="p-1.5 -ml-1 rounded-full text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors cursor-pointer"
            title="Back to Settings Hub"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-base text-theme-primary">Appearance</h1>
            <p className="text-[11px] text-theme-tertiary">Theme and display mode</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="px-3.5 py-1.5 rounded-full bg-theme-surface-hover hover:bg-theme-surface-active text-theme-primary text-xs font-bold transition-all cursor-pointer"
        >
          Done
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-xl mx-auto w-full pb-24">
        <div className="space-y-3">
          <div className="border-b border-theme-divider-light pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-theme-tertiary">
              Color Theme
            </h3>
            <p className="text-[11px] text-theme-tertiary mt-0.5">
              Choose how Lalao looks on your device
            </p>
          </div>

          <div className="space-y-2.5">
            {themeOptions.map(({ id, label, desc, icon: Icon }) => {
              const isSelected = theme === id;
              return (
                <button
                  key={id}
                  id={`btn-theme-${id}`}
                  type="button"
                  onClick={() => setTheme(id)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-4 select-none ${
                    isSelected
                      ? 'border-[#5E43F3] bg-[#5E43F3]/5 dark:bg-[#5E43F3]/10 shadow-xs'
                      : 'border-theme-divider-light bg-theme-surface hover:bg-theme-surface-hover hover:border-theme-divider'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#5E43F3] text-white shadow-xs'
                          : 'bg-theme-surface-active text-theme-secondary'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs sm:text-sm font-bold text-theme-primary block">
                        {label}
                      </span>
                      <p className="text-[11px] text-theme-tertiary mt-0.5 leading-tight">
                        {desc}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'border-[#5E43F3] bg-[#5E43F3]'
                          : 'border-theme-divider-strong bg-transparent'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
