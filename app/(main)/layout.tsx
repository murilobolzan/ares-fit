import React from 'react';
import BottomNav from '@/components/layout/BottomNav';
import { ToastProvider } from '@/components/ui/Toast';
import InstallPrompt from '@/components/ui/InstallPrompt';
import ConsentBanner from '@/components/layout/ConsentBanner';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#000000] relative">
        
        {/* Container Centralizado Mobile-First */}
        <main className="max-w-sm mx-auto min-h-screen pb-[calc(64px+env(safe-area-inset-bottom)+16px)] relative flex flex-col">
          {children}
        </main>
        
        {/* Banner de Cookies e Consentimento LGPD */}
        <ConsentBanner />

        {/* Prompt PWA */}
        <InstallPrompt />

        {/* Barra de Navegação Inferior Global */}
        <BottomNav />
        
      </div>
    </ToastProvider>
  );
}