import type { Metadata } from 'next';
import Providers from '../providers';
import { Navbar } from '../components/Navbar';
import './globals.css';

export const metadata: Metadata = {
    title: 'Eventix - Entradas de eventos',
    description: 'Compra y vende entradas de eventos con Eventix',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es">
            <body className="antialiased">
                <Providers>
                    <Navbar />
                    <main className="min-h-screen">
                        {children}
                    </main>
                </Providers>
            </body>
        </html>
    );
}