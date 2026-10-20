import React from 'react';
import { UserType } from '../../types';

interface BadgeProps {
  type?: 'BIZ' | 'ORG' | 'CLUB' | 'COMMUNITY' | UserType;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ type, className = '', size = 'sm' }) => {
  if (!type || type === 'person') return null;

  const normalized = (typeof type === 'string' ? type.toUpperCase() : 'BIZ') as 'BIZ' | 'ORG' | 'CLUB' | 'COMMUNITY';

  const config = {
    BIZ: {
      label: 'BIZ',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
    },
    ORG: {
      label: 'ORG',
      bg: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60',
    },
    CLUB: {
      label: 'CLUB',
      bg: 'bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60',
    },
    COMMUNITY: {
      label: 'COMMUNITY',
      bg: 'bg-indigo-50 text-[#5E43F3] border-indigo-200/80 dark:bg-indigo-950/40 dark:text-[#7C65F6] dark:border-indigo-800/60',
    },
    BUSINESS: {
      label: 'BIZ',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
    },
    ORGANIZATION: {
      label: 'ORGANIZATION',
      bg: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60',
    },
  }[normalized] || {
    label: normalized,
    bg: 'bg-theme-surface-hover text-theme-secondary border-theme-divider',
  };

  const sizeClass = size === 'sm' ? 'px-1.5 py-0.5 text-[10px] tracking-wider' : 'px-2 py-0.5 text-xs';

  return (
    <span
      id={`badge-${config.label.toLowerCase()}`}
      className={`inline-flex items-center font-bold uppercase rounded border ${config.bg} ${sizeClass} font-mono ${className}`}
    >
      {config.label}
    </span>
  );
};
