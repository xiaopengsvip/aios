'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore, Toast } from '@/store/ui';

const typeStyles: Record<string, { bg: string; icon: string }> = {
  success: {
    bg: 'border-emerald-500/30 bg-emerald-500/10',
    icon: '✓',
  },
  error: {
    bg: 'border-red-500/30 bg-red-500/10',
    icon: '✕',
  },
  warning: {
    bg: 'border-yellow-500/30 bg-yellow-500/10',
    icon: '⚠',
  },
  info: {
    bg: 'border-blue-500/30 bg-blue-500/10',
    icon: 'ℹ',
  },
};

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useUIStore((s) => s.removeToast);
  const style = typeStyles[toast.type || 'info'];

  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, removeToast]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`
        flex items-start gap-3 w-80 p-4 rounded-xl border backdrop-blur-xl
        bg-zinc-900/90 shadow-xl shadow-black/30 ${style.bg}
      `}
    >
      <span className="text-lg shrink-0">{style.icon}</span>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-semibold text-white">{toast.title}</p>
        )}
        {toast.message && (
          <p className="text-sm text-zinc-400 mt-0.5">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-zinc-500 hover:text-white transition-colors shrink-0"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
}

export default function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Convenience function to add toasts from anywhere
export function toast(options: Omit<Toast, 'id'>) {
  useUIStore.getState().addToast(options);
}
