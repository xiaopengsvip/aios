'use client';

import { motion } from 'framer-motion';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export default function Switch({
  checked,
  onChange,
  disabled = false,
  label,
  size = 'md',
  className = '',
}: SwitchProps) {
  const sizes = {
    sm: { track: 'w-8 h-4.5', thumb: 'w-3.5 h-3.5', translate: 'translate-x-3.5' },
    md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
  };
  const s = sizes[size];

  return (
    <label className={`inline-flex items-center gap-2.5 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex items-center rounded-full
          transition-colors duration-200 focus:outline-none
          focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900
          ${s.track}
          ${checked ? 'bg-indigo-600' : 'bg-zinc-700'}
        `}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`
            ${s.thumb} rounded-full bg-white shadow-sm
            ${checked ? s.translate : 'translate-x-0.5'}
          `}
        />
      </button>
      {label && <span className="text-sm text-zinc-300">{label}</span>}
    </label>
  );
}
