import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aresfit.vercel.app';

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'AresFit — Treine. Evolua. Domine.',
    template: '%s | AresFit'
  },
  description: 'O app de academia mais completo do Brasil. Registre treinos, acompanhe sua evolução e conecte-se com seu personal trainer.',
  keywords: ['academia', 'treino', 'musculação', 'personal trainer', 'fitness', 'evolução', 'app de treino'],
  authors: [{ name: 'AresFit' }],
  creator: 'AresFit',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: APP_URL,
    siteName: 'AresFit',
    title: 'AresFit — Treine. Evolua. Domine.',
    description: 'O app de academia mais completo do Brasil. Registre treinos, acompanhe evolução e conecte-se com seu personal.',
    images: [
      {
        url: '/og',
        width: 1200,
        height: 630,
        alt: 'AresFit — App de Academia'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AresFit — Treine. Evolua. Domine.',
    description: 'O app de academia mais completo do Brasil.',
    images: ['/og']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.png',
    shortcut: '/icon-192.png'
  },
  verification: {
    // google: 'adicionar-codigo-do-google-search-console-aqui'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AresFit" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${inter.className} bg-[#000000] text-white antialiased`}>
        {children}
        
        {/* A "caixa de som" dos balões de notificação */}
        <Toaster />
        
        {/* Registro do Service Worker (PWA) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('Service Worker registrado com sucesso: ', registration.scope);
                    },
                    function(err) {
                      console.log('Falha no registro do Service Worker: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}