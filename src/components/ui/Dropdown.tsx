'use client';

import { useState, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useClickOutside from '@/hooks/useClickOutside';

export interface DropdownItem {
  key: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export default function Dropdown({
  trigger,
  items,
  align = 'left',
  className = '',
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setOpen(false));

  return (
    <div className={`relative inline-block ${className}`} ref={ref}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className={`
              absolute z-50 mt-1 min-w-[180px]
              bg-zinc-800 border border-zinc-700 rounded-xl
              shadow-xl shadow-black/30 overflow-hidden py-1
              ${align === 'right' ? 'right-0' : 'left-0'}
            `}
          >
            {items.map((item) => {
              if (item.divider) {
                return <div key={item.key} className="my-1 border-t border-zinc-700" />;
              }
              return (
                <button
                  key={item.key}
                  disabled={item.disabled}
                  onClick={() => {
                    item.onClick?.();
                    setOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-2 px-4 py-2 text-sm text-left
                    transition-colors
                    ${item.disabled
                      ? 'opacity-40 cursor-not-allowed'
                      : item.danger
                        ? 'text-red-400 hover:bg-red-500/10'
                        : 'text-zinc-300 hover:bg-zinc-700 hover:text-white'
                    }
                  `}
                >
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  {item.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
