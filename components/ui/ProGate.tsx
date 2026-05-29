'use client';

import { usePlan } from '@/lib/hooks/usePlan';
import { Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProGate({ feature, children, fallback }: ProGateProps) {
  const { isPro, loading } = usePlan();
  const router = useRouter();

  if (loading) {
    return <div className="opacity-50 pointer-events-none">{children}</div>;
  }

  if (isPro) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="relative overflow-hidden rounded-3xl">
      <div className="opacity-20 pointer-events-none select-none blur-[4px]">
        {children}
      </div>
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 p-6 text-center backdrop-blur-sm border border-[#222225] rounded-3xl">
        <div className="w-12 h-12 bg-[#FFE600]/10 rounded-full flex items-center justify-center mb-3 border border-[#FFE600]/20">
          <Lock size={20} className="text-[#FFE600]" />
        </div>
        <h3 className="text-[#FFFFFF] font-black uppercase tracking-widest text-sm mb-2">Exclusivo PRO</h3>
        <p className="text-[#A1A1AA] text-xs mb-5 px-4 leading-relaxed">
          A funcionalidade "{feature}" está disponível apenas no plano premium.
        </p>
        <button 
          onClick={() => router.push('/planos')} 
          className="bg-[#FFE600] text-black font-black uppercase tracking-widest text-[10px] px-6 py-3 rounded-[100px] hover:scale-95 transition-transform"
        >
          Desbloquear com PRO
        </button>
      </div>
    </div>
  );
}