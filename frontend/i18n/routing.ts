import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
    locales: ['en', 'es', 'pt', 'fr', 'it'],

    defaultLocale: 'es',

    localePrefix: 'as-needed',
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);