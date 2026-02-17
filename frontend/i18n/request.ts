import { getRequestConfig, RequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }): Promise<RequestConfig> => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale: locale as string,
    messages: (await import(`../translations/${locale}.json`)).default
  };
});