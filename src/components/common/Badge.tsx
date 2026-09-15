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
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    },
    ORG: {
      label: 'ORG',
      bg: 'bg-blue-50 text-blue-700 border-blue-200/80',
    },
    CLUB: {
      label: 'CLUB',
      bg: 'bg-amber-50 text-amber-800 border-amber-200/80',
    },
    COMMUNITY: {
      label: 'COMMUNITY',
      bg: 'bg-indigo-50 text-[#5E43F3] border-indigo-200/80',
    },
    BUSINESS: {
      label: 'BIZ',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    },
    ORGANIZATION: {
      label: 'ORG',
      bg: 'bg-blue-50 text-blue-700 border-blue-200/80',
    },
  }[normalized] || {
    label: normalized,
    bg: 'bg-neutral-100 text-neutral-700 border-neutral-200',
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
