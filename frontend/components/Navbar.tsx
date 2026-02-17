'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { useAuthStore } from '../store/authStore';
import { useRouter } from '@/i18n/routing';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function Navbar() {
    const t = useTranslations('nav');
    const router = useRouter();
    const pathname = usePathname();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-secondary)]/95 backdrop-blur">
            <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
                <LanguageSwitcher />
                <Link
                    href="/"
                    className="text-xl font-bold tracking-tight text-white hover:opacity-90"
                >
                    TicketMonster
                </Link>

                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className={`text-sm font-medium transition-colors ${
                            pathname === '/' ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-white'
                        }`}
                    >
                        {t('events')}
                    </Link>

                    {user ? (
                        <>
                            <Link
                                href="/orders"
                                className={`text-sm font-medium transition-colors ${
                                    pathname === '/orders' ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-white'
                                }`}
                            >
                                {t('myOrders')}
                            </Link>
                            <span className="text-sm text-[var(--text-secondary)]">
                                {user.name}
                            </span>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="rounded bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
                            >
                                {t('logout')}
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="text-sm font-medium text-[var(--text-secondary)] hover:text-white"
                            >
                                {t('login')}
                            </Link>
                            <Link
                                href="/register"
                                className="text-sm font-medium text-[var(--text-secondary)] hover:text-white"
                            >
                                {t('register')}
                            </Link>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
}