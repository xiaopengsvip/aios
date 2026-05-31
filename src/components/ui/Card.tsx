'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  noPadding?: boolean;
  hover?: boolean;
}

export default function Card({
  children,
  header,
  footer,
  className = '',
  noPadding = false,
  hover = false,
}: CardProps) {
  return (
    <div
      className={`
        bg-zinc-900/60 backdrop-blur-xl border border-zinc-800
        rounded-xl shadow-xl shadow-black/10
        ${hover ? 'hover:border-zinc-700 hover:bg-zinc-900/80 transition-all duration-200' : ''}
        ${className}
      `}
    >
      {header && (
        <div className="px-5 py-4 border-b border-zinc-800">
          {header}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900/40 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
}
