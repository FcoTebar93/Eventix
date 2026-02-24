'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/routing';
import { authLogin } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get('redirect');
    const t = useTranslations('auth.login');
    
    const setAuth = useAuthStore((state) => state.setAuth);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { user, tokens } = await authLogin({ email, password });
            setAuth(user, tokens);
            router.push(redirect || '/');
        } catch (error) {
            const message = error && typeof error === 'object' && 'response' in error ? (error as { response?: { data?: { error?: string } } }).response?.data?.error : t('error');
            setError(message || t('error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4">
            <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
            <p className="mt-1 text-[var(--text-secondary)]">
                {t('noAccount')}{' '}
                <Link href="/register" className="text-[var(--accent)] hover:underline">
                    {t('registerLink')}
                </Link>
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                <div>
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium text-[var(--text-secondary)]"
                    >
                        {t('email')}
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-white placeholder-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none"
                        placeholder={t('emailPlaceholder')}
                    />
                </div>
                <div>
                    <label
                        htmlFor="password"
                        className="block text-sm font-medium text-[var(--text-secondary)]"
                    >
                        {t('password')}
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-white placeholder-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none"
                    />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <button
                    type="submit"
                    disabled={loading}
                    className="rounded bg-[var(--accent)] py-2 font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
                >
                    {loading ? t('submitting') : t('submit')}
                </button>
            </form>
        </div>
    );
}