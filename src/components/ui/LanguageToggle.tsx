'use client';

import { useUIStore } from '@/store/ui';

export default function LanguageToggle({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useUIStore();
  const isZh = locale === 'zh' || locale === 'zh-CN';

  const toggle = () => {
    const newLocale = isZh ? 'en-US' : 'zh-CN';
    // Set cookie first (synchronous)
    document.cookie = `locale=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    // Update client store
    setLocale(isZh ? 'en' : 'zh');
    // Force full page reload using pathname (no query params)
    window.location.assign(window.location.pathname);
  };

  return (
    <button
      onClick={toggle}
      className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-xs font-bold ${className}`}
      title={isZh ? 'Switch to English' : '切换中文'}
    >
      {isZh ? 'En' : '中'}
    </button>
  );
}
