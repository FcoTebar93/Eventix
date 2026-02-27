'use client';

import { useRouter, usePathname } from '@/i18n/routing';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useTranslations } from 'next-intl';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const loadFromStorage = useAuthStore((state) => state.loadFromStorage);
  const t = useTranslations('common');

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (user === undefined) return;
    if (user === null) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || '/admin')}`);
      return;
    }
    if (user.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [user, router, pathname]);

  if (user === null || user === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-[var(--text-secondary)]">{t('redirecting')}</p>
      </div>
    );
  }

  if (user.role !== 'ADMIN') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-[var(--text-secondary)]">Redirigiendo...</p>
      </div>
    );
  }

  return <>{children}</>;
}