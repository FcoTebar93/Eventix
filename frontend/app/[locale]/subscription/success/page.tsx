'use client';

import { useEffect } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { useAuthStore } from '@/store/authStore';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function SubscriptionSuccessPage() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        const t = setTimeout(() => {
            router.push('/organizer/events');
        }, 2000);
        return () => clearTimeout(t);
    }, [router]);

    return (
        <ProtectedRoute>
            <div className="mx-auto max-w-2xl px-4 py-8">
                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center">
                    <div className="mb-4 text-6xl">✅</div>
                    <h1 className="mb-4 text-2xl font-bold text-white">
                        ¡Suscripción Premium Activada!
                    </h1>
                    <p className="mb-6 text-[var(--text-secondary)]">
                        Tu suscripción Premium ha sido activada exitosamente. 
                        Ahora puedes crear y gestionar eventos.
                    </p>
                    <div className="space-y-4">
                        <Link
                            href="/organizer/events"
                            className="inline-block rounded bg-[var(--accent)] px-6 py-2 font-medium text-white hover:bg-[var(--accent-hover)]"
                        >
                            Ir a Mis Eventos
                        </Link>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Redirigiendo automáticamente en 2 segundos...
                        </p>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
