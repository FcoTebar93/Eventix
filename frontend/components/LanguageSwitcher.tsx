'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

const locales = [
  { code: 'es', key: 'spanish' },
  { code: 'en', key: 'english' },
  { code: 'pt', key: 'portuguese' },
  { code: 'fr', key: 'french' },
  { code: 'it', key: 'italian' },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('language');

  const handleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <select
      value={locale}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-sm text-white"
    >
      {locales.map((loc) => (
        <option key={loc.code} value={loc.code}>
          {t(loc.key)}
        </option>
      ))}
    </select>
  );
}