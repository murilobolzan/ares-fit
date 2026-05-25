import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'AresFit',
  description: 'Sua evolução começa aqui — Web App Mobile-First de Academia',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} bg-black text-white dark`}>
      <body className="antialiased font-sans bg-black text-primary min-h-screen">
        {children}
      </body>
    </html>
  );
}