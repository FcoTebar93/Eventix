'use client';

import dynamic from 'next/dynamic';
import { Link, usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

const AdminGuard = dynamic(() => import('@/components/AdminGuard'), {
  ssr: false,
  loading: () => (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="h-8 w-48 animate-pulse rounded bg-[var(--bg-card)]" />
      <div className="mt-8 h-64 animate-pulse rounded-xl bg-[var(--bg-card)]" />
    </div>
  ),
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('admin');
  const pathname = usePathname();

  return (
    <AdminGuard>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <nav className="flex flex-wrap gap-2">
            <Link
              href="/admin"
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname === '/admin' || pathname?.endsWith('/admin')
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-white'
              }`}
            >
              {t('dashboard')}
            </Link>
          </nav>
        </div>
        {children}
      </div>
    </AdminGuard>
  );
}