'use client';

import { motion } from 'framer-motion';

interface ProgressProps {
  value: number; // 0–100
  max?: number;
  color?: 'indigo' | 'green' | 'red' | 'yellow' | 'blue';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const colorClasses: Record<string, string> = {
  indigo: 'bg-indigo-500',
  green: 'bg-emerald-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  blue: 'bg-blue-500',
};

const sizeClasses: Record<string, string> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export default function Progress({
  value,
  max = 100,
  color = 'indigo',
  size = 'md',
  showLabel = false,
  className = '',
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-xs text-zinc-400">{Math.round(pct)}%</span>
        </div>
      )}
      <div className={`w-full bg-zinc-800 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`${sizeClasses[size]} rounded-full ${colorClasses[color]}`}
        />
      </div>
    </div>
  );
}
