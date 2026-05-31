import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

const locales = ['zh-CN', 'en-US'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'zh-CN';

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  let locale = cookieStore.get('locale')?.value || defaultLocale;

  if (!isValidLocale(locale)) {
    locale = defaultLocale;
  }

  // Load all message namespaces
  const common = (await import(`../../../messages/${locale}/common.json`)).default;
  const auth = (await import(`../../../messages/${locale}/auth.json`)).default;
  const chat = (await import(`../../../messages/${locale}/chat.json`)).default;
  const landing = (await import(`../../../messages/${locale}/landing.json`)).default;
  const image = (await import(`../../../messages/${locale}/image.json`)).default;
  const video = (await import(`../../../messages/${locale}/video.json`)).default;
  const audioNs = (await import(`../../../messages/${locale}/audio.json`)).default;
  const agent = (await import(`../../../messages/${locale}/agent.json`)).default;
  const workflow = (await import(`../../../messages/${locale}/workflow.json`)).default;
  const files = (await import(`../../../messages/${locale}/files.json`)).default;
  const settings = (await import(`../../../messages/${locale}/settings.json`)).default;
  const admin = (await import(`../../../messages/${locale}/admin.json`)).default;
  const errors = (await import(`../../../messages/${locale}/errors.json`)).default;

  return {
    locale,
    messages: {
      ...common,
      auth,
      chat: chat.chat,
      landing,
      image: image.image,
      video: video.video,
      audio: audioNs.audio,
      agent: agent.agent,
      workflow: workflow.workflow,
      files: files.files,
      settings: settings.settings,
      admin: admin.admin,
      errors: errors.errors,
    },
  };
});
