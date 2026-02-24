'use client';

import { useEffect, useState } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { useAuthStore } from '@/store/authStore';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';

export default function SubscriptionSuccessPage() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const setAuth = useAuthStore((state) => state.setAuth);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const refreshUser = async () => {
            let attempts = 0;
            const maxAttempts = 15;
            
            const tryRefresh = async () => {
                try {
                    const response = await api.get('/users/profile');
                    const updatedUser = response.data.data.user;
                    const currentTokens = useAuthStore.getState();
                    
                    console.log(`[SubscriptionSuccess] Intento ${attempts + 1}/${maxAttempts} - Rol: ${updatedUser.role}`);
                    
                    if (updatedUser && currentTokens.accessToken) {
                        // Actualizar siempre el usuario en el store
                        setAuth(updatedUser, {
                            accessToken: currentTokens.accessToken,
                            refreshToken: currentTokens.refreshToken || '',
                        });
                        
                        // Verificar si el rol se actualizó correctamente a ORGANIZER
                        if (updatedUser.role === 'ORGANIZER') {
                            console.log('[SubscriptionSuccess] ✅ Rol actualizado correctamente a ORGANIZER');
                            setLoading(false);
                            return;
                        } else if (attempts < maxAttempts - 1) {
                            // Aún no se actualizó, intentar de nuevo después de 1 segundo
                            attempts++;
                            setTimeout(tryRefresh, 1000);
                            return;
                        } else {
                            console.warn(`[SubscriptionSuccess] ⚠️ Máximo de intentos alcanzado. Rol final: ${updatedUser.role}`);
                            console.warn('[SubscriptionSuccess] El webhook puede no haberse procesado aún. El usuario puede necesitar refrescar la página.');
                            setLoading(false);
                        }
                    }
                } catch (err) {
                    console.error('[SubscriptionSuccess] Error refrescando usuario:', err);
                    if (attempts < maxAttempts - 1) {
                        attempts++;
                        setTimeout(tryRefresh, 1000);
                    } else {
                        setLoading(false);
                    }
                }
            };

            // Esperar 3 segundos antes del primer intento para que el webhook procese
            setTimeout(tryRefresh, 3000);
        };

        if (user) {
            refreshUser();
        } else {
            setLoading(false);
        }
    }, [user, setAuth]);

    useEffect(() => {
        if (!loading && user?.role === 'ORGANIZER') {
            setTimeout(() => {
                router.push('/organizer/events');
            }, 2000);
        }
    }, [loading, user, router]);

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
                        {loading ? (
                            <div className="space-y-2">
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Esperando confirmación del pago...
                                </p>
                                <div className="flex items-center justify-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent"></div>
                                    <span className="text-xs text-[var(--text-secondary)]">
                                        Verificando suscripción...
                                    </span>
                                </div>
                            </div>
                        ) : user?.role === 'ORGANIZER' ? (
                            <>
                                <Link
                                    href="/organizer/events"
                                    className="inline-block rounded bg-[var(--accent)] px-6 py-2 font-medium text-white hover:bg-[var(--accent-hover)]"
                                >
                                    Ir a Mis Eventos
                                </Link>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Redirigiendo automáticamente en 3 segundos...
                                </p>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-sm text-yellow-400">
                                    ⚠️ Tu suscripción aún se está procesando. El rol actual es: <strong>{user?.role}</strong>
                                </p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="rounded bg-[var(--accent)] px-6 py-2 font-medium text-white hover:bg-[var(--accent-hover)]"
                                >
                                    Recargar página
                                </button>
                                <p className="text-xs text-[var(--text-secondary)]">
                                    Si el problema persiste, verifica que el webhook de Stripe esté funcionando correctamente.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
