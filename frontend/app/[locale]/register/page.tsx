'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Link, useRouter } from '@/i18n/routing';
import { authRegister } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useTranslations } from 'next-intl';

const PlanCard = dynamic(() => import('@/components/PlanCard'), {
    loading: () => (
        <div className="h-40 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] animate-pulse" />
    ),
});

type PlanSelection = 'FREE' | 'PREMIUM';

export default function RegisterPage() {
    const router = useRouter();
    const t = useTranslations('auth.register');
    const setAuth = useAuthStore((state) => state.setAuth);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedPlan, setSelectedPlan] = useState<PlanSelection>('FREE');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { user, tokens } = await authRegister({ name, email, password });
            
            if (selectedPlan === 'PREMIUM') {
                if (typeof window !== 'undefined') {
                    localStorage.setItem('pendingAuth', JSON.stringify({ user, tokens }));
                }
                router.push('/subscription');
            } else {
                setAuth(user, tokens);
                router.push('/register/success');
            }
        } catch (error) {
            const message = error && typeof error === 'object' && 'response' in error ? (error as { response?: { data?: { error?: string } } }).response?.data?.error : t('error');
            setError(message || t('error'));
        } finally {
            setLoading(false);
        }
    };

    const freeFeatures = [
        t('plans.free.features.0'),
        t('plans.free.features.1'),
        t('plans.free.features.2'),
        t('plans.free.features.3'),
    ];

    const premiumFeatures = [
        t('plans.premium.features.0'),
        t('plans.premium.features.1'),
        t('plans.premium.features.2'),
        t('plans.premium.features.3'),
        t('plans.premium.features.4'),
    ];

    return (
        <div className="mx-auto min-h-[80vh] max-w-4xl px-4 py-8">
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            {t('hasAccount')} <Link href="/login" className="text-[var(--accent)] hover:underline">{t('loginLink')}</Link>
          </p>

          <div className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-white">{t('selectPlan')}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <PlanCard
                plan="FREE"
                selected={selectedPlan === 'FREE'}
                onSelect={setSelectedPlan}
                price="€0"
                features={freeFeatures}
              />
              <PlanCard
                plan="PREMIUM"
                selected={selectedPlan === 'PREMIUM'}
                onSelect={setSelectedPlan}
                price="€29.99"
                features={premiumFeatures}
                popular={true}
              />
            </div>
          </div>
    
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[var(--text-secondary)]">
                {t('name')}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-white placeholder-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none"
                placeholder={t('namePlaceholder')}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--text-secondary)]">
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
              <label htmlFor="password" className="block text-sm font-medium text-[var(--text-secondary)]">
                {t('password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-white placeholder-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none"
                placeholder={t('passwordPlaceholder')}
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