'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { Loader2, Clock } from 'lucide-react';

// 1. Separamos o conteúdo em um subcomponente
function PendingApprovalContent() {
  return (
    <div className="bg-[#0F0F0F] border border-[#222225] p-8 rounded-3xl flex flex-col items-center text-center gap-4 max-w-sm w-full shadow-[0_0_40px_rgba(0,0,0,0.5)]">
      <div className="w-16 h-16 rounded-full bg-[#FFE600]/10 border border-[#FFE600]/20 flex items-center justify-center text-[#FFE600] mb-2 animate-pulse">
        <Clock size={32} />
      </div>
      
      <h1 className="text-2xl font-black uppercase tracking-widest text-white">Em Análise</h1>
      
      <p className="text-[#A1A1AA] text-xs leading-relaxed font-medium">
        Sua conta de Personal Trainer foi registrada com sucesso. Nossa equipe está validando seu <strong className="text-white">CREF</strong> para liberar seu acesso ao painel.
      </p>
      
      <p className="text-[#555558] text-[10px] font-black uppercase tracking-widest mt-2">
        Prazo estimado: até 24h úteis
      </p>

      <Link 
        href="/login"
        className="w-full h-12 mt-4 bg-[#1A1A1A] border border-[#222225] text-white font-black uppercase tracking-widest rounded-full text-xs flex items-center justify-center transition-transform active:scale-95 hover:border-[#FFE600]"
      >
        Voltar para o Login
      </Link>
    </div>
  );
}

// 2. A página principal exporta o conteúdo envelopado em Suspense
export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 animate-fade-in">
      <Suspense fallback={<Loader2 className="animate-spin text-[#FFE600]" size={32} />}>
        <PendingApprovalContent />
      </Suspense>
    </div>
  );
}