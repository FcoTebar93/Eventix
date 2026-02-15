'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authRegister } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function RegisterPage() {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { user, tokens } = await authRegister({ name, email, password });
            setAuth(user, tokens);
            router.push('/');
        } catch (error) {
            const message = error && typeof error === 'object' && 'response' in error ? (error as { response?: { data?: { error?: string } } }).response?.data?.error : 'Error al registrar';
            setError(message || 'Error al registrar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4">
          <h1 className="text-2xl font-bold text-white">Crear cuenta</h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            ¿Ya tienes cuenta? <Link href="/login" className="text-[var(--accent)] hover:underline">Inicia sesión</Link>
          </p>
    
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[var(--text-secondary)]">
                Nombre
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-white placeholder-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none"
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--text-secondary)]">
                Email
              </label>
              <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-white placeholder-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none"
            placeholder="tu@email.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[var(--text-secondary)]">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-white placeholder-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none"
            placeholder="Mínimo 8 caracteres"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-[var(--accent)] py-2 font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {loading ? 'Creando cuenta...' : 'Registrarse'}
        </button>
      </form>
    </div>
  );
}