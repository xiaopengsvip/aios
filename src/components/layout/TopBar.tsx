'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import ThemeToggle from '@/components/ui/ThemeToggle';
import LanguageToggle from '@/components/ui/LanguageToggle';
import { useDrawer } from '@/components/layout/Sidebar';

const pageTitles: Record<string, string> = {
  '/chat': 'chat',
  '/image': 'image',
  '/video': 'video',
  '/audio': 'audio',
  '/agent': 'agent',
  '/workflow': 'workflow',
  '/files': 'files',
  '/knowledge': 'knowledge',
  '/prompts': 'prompts',
  '/settings': 'settings',
  '/admin/users': 'users',
  '/admin/models': 'models',
  '/admin/providers': 'providers',
  '/admin/keys': 'keys',
  '/admin/billing': 'billing',
  '/admin/logs': 'logs',
  '/admin/monitor': 'monitor',
  '/admin/settings': 'settings',
  '/admin/tenants': 'tenants',
  '/code': 'code',
  '/credits': 'credits',
  '/api-platform': 'apiPlatform',
  '/marketplace': 'marketplace',
  '/usage': 'usage',
};

export default function TopBar() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const { toggle: toggleDrawer } = useDrawer();

  const matchedKey = Object.entries(pageTitles).find(([path]) =>
    pathname === path || pathname.startsWith(path + '/')
  )?.[1];

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-card lg:hidden shrink-0">
      {/* Left: Menu button + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleDrawer}
          className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
          aria-label="Menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <h1 className="text-sm font-semibold">
          {matchedKey ? t(matchedKey) : 'AIOS'}
        </h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
        <button className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-accent transition-colors text-muted-foreground">
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
          </svg>
        </button>
        <button className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-accent transition-colors text-muted-foreground relative">
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
