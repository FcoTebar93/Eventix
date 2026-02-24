'use client';

import { useEffect, useState } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { useAuthStore } from '@/store/authStore';
import { useTranslations } from 'next-intl';

export default function RegisterSuccessPage() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const t = useTranslations('auth.register');
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        // Contador regresivo
        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Redirigir a la página principal después de 3 segundos
        const timer = setTimeout(() => {
            router.push('/');
        }, 3000);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [router]);

    return (
        <div className="mx-auto max-w-2xl px-4 py-8">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center">
                <div className="mb-4 text-6xl">✅</div>
                <h1 className="mb-4 text-2xl font-bold text-white">
                    ¡Usuario registrado con éxito!
                </h1>
                <p className="mb-6 text-[var(--text-secondary)]">
                    Te redirigiremos a la página principal en {countdown} segundo{countdown !== 1 ? 's' : ''}...
                </p>
                <div className="space-y-4">
                    <Link
                        href="/"
                        className="inline-block rounded bg-[var(--accent)] px-6 py-2 font-medium text-white hover:bg-[var(--accent-hover)]"
                    >
                        Ir a la página principal
                    </Link>
                </div>
            </div>
        </div>
    );
}
