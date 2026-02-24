'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

const SubscriptionForm = dynamic(
    () => import('@/components/SubscriptionForm'),
    {
        loading: () => (
            <div className="mx-auto max-w-md rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-6">
                <p className="text-center text-white">
                    Cargando formulario de suscripción...
                </p>
            </div>
        ),
        ssr: false,
    },
);

export default function SubscriptionPage() {
    const t = useTranslations('auth.register');

    return (
        <div className="mx-auto min-h-[80vh] max-w-4xl px-4 py-8">
            <h1 className="mb-2 text-2xl font-bold text-white">Suscripción Premium</h1>
            <p className="mb-8 text-[var(--text-secondary)]">
                Únete al plan Premium para crear y gestionar tus propios eventos
            </p>

            <SubscriptionForm />
        </div>
    );
}
