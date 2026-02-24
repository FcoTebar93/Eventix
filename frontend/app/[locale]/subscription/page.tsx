'use client';

import SubscriptionForm from '@/components/SubscriptionForm';
import { useTranslations } from 'next-intl';

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
