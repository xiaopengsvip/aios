'use client';

import { ReactNode } from 'react';

type Color = 'gray' | 'indigo' | 'green' | 'yellow' | 'red' | 'blue' | 'purple';

interface BadgeProps {
  children: ReactNode;
  color?: Color;
  dot?: boolean;
  className?: string;
}

const colorClasses: Record<Color, string> = {
  gray: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  red: 'bg-red-500/10 text-red-400 border-red-500/20',
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const dotColorClasses: Record<Color, string> = {
  gray: 'bg-zinc-400',
  indigo: 'bg-indigo-400',
  green: 'bg-emerald-400',
  yellow: 'bg-yellow-400',
  red: 'bg-red-400',
  blue: 'bg-blue-400',
  purple: 'bg-purple-400',
};

export default function Badge({
  children,
  color = 'gray',
  dot = false,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5
        text-xs font-medium rounded-full border
        ${colorClasses[color]} ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColorClasses[color]}`} />
      )}
      {children}
    </span>
  );
}
