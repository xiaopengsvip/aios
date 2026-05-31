'use client';

import { useState } from 'react';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: Size;
  className?: string;
}

const sizeClasses: Record<Size, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

const colors = [
  'bg-indigo-600',
  'bg-emerald-600',
  'bg-blue-600',
  'bg-purple-600',
  'bg-pink-600',
  'bg-orange-600',
  'bg-teal-600',
  'bg-cyan-600',
];

export default function Avatar({
  src,
  alt = '',
  name = '',
  size = 'md',
  className = '',
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const initials = name ? getInitials(name) : '?';
  const bgColor = colors[Math.abs(hashCode(name)) % colors.length];

  const showImage = src && !imgError;

  return (
    <div
      className={`
        relative inline-flex items-center justify-center rounded-full
        overflow-hidden shrink-0
        ${sizeClasses[size]} ${!showImage ? bgColor : ''} ${className}
      `}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt || name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="font-semibold text-white select-none">{initials}</span>
      )}
    </div>
  );
}
