import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'LSC Recognition - Lengua de Señas Colombiana',
  description: 'Plataforma educativa para el aprendizaje de Lengua de Señas Colombiana mediante inteligencia artificial',
  keywords: ['LSC', 'Lengua de Señas', 'Colombia', 'Educación', 'IA', 'Universidad de Nariño'],
  authors: [{ name: 'Universidad de Nariño' }],
  openGraph: {
    title: 'LSC Recognition',
    description: 'Aprende Lengua de Señas Colombiana con IA',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
