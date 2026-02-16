'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function ProtectedRouter({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const pathName = usePathname();
    const loadFromStorage = useAuthStore((state) => state.loadFromStorage);

    useEffect(() => {
        loadFromStorage();
    }, [loadFromStorage]);

    useEffect(() => {
        if (user === undefined) {
            return;
        }

        if (user === null) {
            router.replace(`/login?redirect=${encodeURIComponent(pathName || '/')}`);
        }
    }, [user, router, pathName]);

    if (user === null) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
              <p className="text-[var(--text-secondary)]">Redirigiendo al login...</p>
            </div>
        );
    }

    return <>{children}</>
}