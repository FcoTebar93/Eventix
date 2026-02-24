'use client';

import { useState, useEffect } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import {
    PaymentElement,
    useStripe,
    useElements,
    Elements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { createSubscription } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function SubscriptionForm() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const setAuth = useAuthStore((state) => state.setAuth);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
    const [creating, setCreating] = useState(true);

    useEffect(() => {
        if (!user && typeof window !== 'undefined') {
            const pendingAuthStr = localStorage.getItem('pendingAuth');
            if (pendingAuthStr) {
                try {
                    JSON.parse(pendingAuthStr);
                } catch (err) {
                    // Error silenciado
                }
            }
        }
    }, [user]);

    useEffect(() => {
        const createSubscriptionIntent = async () => {
            let currentUser = user;
            if (!currentUser && typeof window !== 'undefined') {
                const pendingAuthStr = localStorage.getItem('pendingAuth');
                if (pendingAuthStr) {
                    try {
                        const pendingAuth = JSON.parse(pendingAuthStr);
                        currentUser = pendingAuth.user;
                    } catch (err) {
                        // Error silenciado
                    }
                }
            }

            if (!currentUser) {
                setError('Debes iniciar sesión para suscribirte');
                setCreating(false);
                return;
            }

            try {
                let tokensToUse = null;
                if (!user && typeof window !== 'undefined') {
                    const pendingAuthStr = localStorage.getItem('pendingAuth');
                    if (pendingAuthStr) {
                        const pendingAuth = JSON.parse(pendingAuthStr);
                        tokensToUse = pendingAuth.tokens;
                        localStorage.setItem('accessToken', pendingAuth.tokens.accessToken);
                        localStorage.setItem('refreshToken', pendingAuth.tokens.refreshToken);
                    }
                }

                const result = await createSubscription();
                setClientSecret(result.clientSecret);
                setSubscriptionId(result.subscriptionId);
                
                if (!result.clientSecret) {
                    setError('No se pudo obtener el client secret. Verifica que STRIPE_PREMIUM_PRICE_ID esté configurado correctamente.');
                }
            } catch (err: any) {
                const errorMsg = 
                    err?.response?.data?.error || 
                    err?.response?.data?.message || 
                    err?.message || 
                    'Error al crear suscripción. Verifica que las variables de entorno de Stripe estén configuradas correctamente.';
                setError(errorMsg);
                setCreating(false);
            }
        };

        createSubscriptionIntent();
    }, [user, setAuth]);

    const hasUserOrPending = user || (typeof window !== 'undefined' && localStorage.getItem('pendingAuth'));

    if (!hasUserOrPending) {
        return (
            <div className="mx-auto max-w-md rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-6">
                <p className="text-center text-white">Debes iniciar sesión para suscribirte al plan Premium</p>
                <Link
                    href="/login"
                    className="mt-4 block text-center text-[var(--accent)] hover:underline"
                >
                    Ir a iniciar sesión
                </Link>
            </div>
        );
    }

    if (creating) {
        return (
            <div className="mx-auto max-w-md rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-6">
                <p className="text-center text-white">Creando suscripción...</p>
            </div>
        );
    }

    if (!clientSecret) {
        return (
            <div className="mx-auto max-w-md rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-6">
                {error ? (
                    <div className="space-y-4">
                        <p className="text-center text-red-400">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full rounded bg-[var(--accent)] py-2 text-white hover:bg-[var(--accent-hover)]"
                        >
                            Reintentar
                        </button>
                    </div>
                ) : (
                    <p className="text-center text-white">Cargando formulario de pago...</p>
                )}
            </div>
        );
    }

    return (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
            <SubscriptionFormContent
                subscriptionId={subscriptionId}
                onSuccess={() => router.push('/subscription/success')}
            />
        </Elements>
    );
}

function SubscriptionFormContent({
    subscriptionId,
    onSuccess,
}: {
    subscriptionId: string | null;
    onSuccess: () => void;
}) {
    const stripe = useStripe();
    const elements = useElements();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/subscription/success`,
                },
                redirect: 'if_required',
            });

            if (stripeError) {
                setError(stripeError.message || 'Error al procesar el pago');
                setLoading(false);
                return;
            }

            if (paymentIntent?.status === 'succeeded') {
                let tokensToUse = null;
                if (typeof window !== 'undefined') {
                    const pendingAuthStr = localStorage.getItem('pendingAuth');
                    if (pendingAuthStr) {
                        try {
                            const pendingAuth = JSON.parse(pendingAuthStr);
                            tokensToUse = pendingAuth.tokens;
                            setAuth(pendingAuth.user, pendingAuth.tokens);
                            localStorage.removeItem('pendingAuth');
                        } catch (err) {
                            // Error silenciado
                        }
                    }
                }

                let attempts = 0;
                const maxAttempts = 15;
                const refreshUser = async () => {
                    try {
                        const api = (await import('@/lib/api')).default;
                        const response = await api.get('/users/profile');
                        const updatedUser = response.data.data.user;
                        const currentTokens = useAuthStore.getState();
                        
                        if (updatedUser && currentTokens.accessToken) {
                            setAuth(updatedUser, {
                                accessToken: currentTokens.accessToken,
                                refreshToken: currentTokens.refreshToken || '',
                            });
                            
                            if (updatedUser.role === 'ORGANIZER') {
                                onSuccess();
                                return;
                            } else if (attempts < maxAttempts - 1) {
                                attempts++;
                                setTimeout(refreshUser, 1000);
                                return;
                            } else {
                                onSuccess();
                            }
                        }
                    } catch (err) {
                        if (attempts < maxAttempts - 1) {
                            attempts++;
                            setTimeout(refreshUser, 1000);
                        } else {
                            onSuccess();
                        }
                    }
                };

                setTimeout(refreshUser, 3000);
            }
        } catch (err: any) {
            setError(err.message || 'Error al procesar el pago');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-md rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-6">
            <h2 className="mb-4 text-2xl font-bold text-white">
                Suscripción Premium - €29.99/mes
            </h2>
            <p className="mb-6 text-[var(--text-secondary)]">
                Accede a todas las funciones premium para crear y gestionar eventos.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] p-4">
                    <PaymentElement />
                </div>
                
                {error && (
                    <div className="rounded bg-red-100 p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={!stripe || loading}
                    className="w-full rounded bg-[var(--accent)] py-2 font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
                >
                    {loading ? 'Procesando...' : 'Suscribirse ahora'}
                </button>
            </form>

            {subscriptionId && (
                <p className="mt-4 text-xs text-[var(--text-secondary)]">
                    ID de suscripción: {subscriptionId}
                </p>
            )}
        </div>
    );
}
