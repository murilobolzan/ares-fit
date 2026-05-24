import React from 'react';
import { BottomNav } from '../../components/layout/BottomNav';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen bg-zinc-950 flex justify-center items-stretch">
      {/* Container Centralizado para simular dispositivo Mobile (Max 430px) */}
      <div className="w-full max-w-[430px] bg-background border-x border-border/40 min-h-screen flex flex-col relative pb-[calc(64px+env(safe-area-inset-bottom)+16px)]">
        <div className="flex-1 w-full flex flex-col overflow-y-auto hide-scroll">
          {children}
        </div>
        
        {/* Menu Inferior Fixo */}
        <BottomNav />
      </div>
    </div>
  );
}