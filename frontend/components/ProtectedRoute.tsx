'use client';

import { usePathname, useRouter } from '@/i18n/routing';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useTranslations } from 'next-intl';

export default function ProtectedRouter({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const pathName = usePathname();
    const loadFromStorage = useAuthStore((state) => state.loadFromStorage);
    const t = useTranslations('common');

    useEffect(() => {
        loadFromStorage();
    }, [loadFromStorage]);

    useEffect(() => {
        if (user === undefined) {
            return;
        }

        if (user === null) {
            router.replace(`/login?redirect=${encodeURIComponent(pathName || '/')}`);
        }
    }, [user, router, pathName]);

    if (user === null) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
              <p className="text-[var(--text-secondary)]">{t('redirecting')}</p>
            </div>
        );
    }

    return <>{children}</>
}