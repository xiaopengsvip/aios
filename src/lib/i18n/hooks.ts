import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from './routing';

export { useTranslations, useLocale };

// 便捷 hook: 获取当前语言并判断是否中文
export function useIsChinese() {
  const locale = useLocale();
  return locale === 'zh-CN';
}

// 获取本地化字段
export function getLocalizedField(
  field: Record<string, string> | null | undefined,
  locale: string,
  fallback = ''
): string {
  if (!field) return fallback;
  return field[locale] || field['zh-CN'] || field['en-US'] || fallback;
}
