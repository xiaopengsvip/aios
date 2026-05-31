'use client';

import { useState, ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface TabItem {
  key: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  defaultKey?: string;
  onChange?: (key: string) => void;
  className?: string;
}

export default function Tabs({
  items,
  defaultKey,
  onChange,
  className = '',
}: TabsProps) {
  const [active, setActive] = useState(defaultKey || items[0]?.key || '');

  const handleChange = (key: string) => {
    setActive(key);
    onChange?.(key);
  };

  const activeItem = items.find((item) => item.key === active);

  return (
    <div className={className}>
      <div className="flex gap-1 border-b border-zinc-800 overflow-x-auto">
        {items.map((item) => (
          <button
            key={item.key}
            disabled={item.disabled}
            onClick={() => handleChange(item.key)}
            className={`
              relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium
              transition-colors whitespace-nowrap
              ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
              ${active === item.key
                ? 'text-white'
                : 'text-zinc-400 hover:text-zinc-200'
              }
            `}
          >
            {item.icon}
            {item.label}
            {active === item.key && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
      <div className="pt-4">
        {activeItem?.content}
      </div>
    </div>
  );
}
