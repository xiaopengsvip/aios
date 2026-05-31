import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['zh-CN', 'en-US'],
  defaultLocale: 'zh-CN',
  localePrefix: 'never', // 不使用 URL 前缀，使用 cookie
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
