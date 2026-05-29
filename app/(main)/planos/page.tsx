'use client';

import { useState } from 'react';
import { usePlan } from '@/lib/hooks/usePlan';
import { Check, X as XIcon, Loader2, MessageCircle } from 'lucide-react';

export default function PlanosPage() {
  const { isPro, loading: planLoading } = usePlan();
  const [billing, setBilling] = useState<'mensal' | 'anual'>('anual');

  const features = [
    { name: 'Fichas de treino', free: 'Até 3', pro: 'Ilimitadas' },
    { name: 'Histórico de treinos', free: '30 dias', pro: 'Completo' },
    { name: 'Biblioteca de exercícios', free: true, pro: true },
    { name: 'Treino ativo', free: true, pro: true },
    { name: 'Mapa de recuperação', free: true, pro: true },
    { name: 'Fotos de progresso', free: false, pro: true },
    { name: 'Relatório semanal', free: false, pro: true },
    { name: 'Chat com personal', free: false, pro: true },
  ];

  const handleAssinarWhatsApp = () => {
    const telefone = "5511999321203";
    const planoEscolhido = billing === 'mensal' ? 'Mensal (R$ 14,90)' : 'Anual (R$ 112,64)';
    const mensagem = encodeURIComponent(`Olá! Tenho interesse em assinar o plano PRO do AresFit no formato ${planoEscolhido}. Como procedemos?`);
    window.open(`https://wa.me/${telefone}?text=${mensagem}`, '_blank');
  };

  if (planLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-[#FFE600]" /></div>;

  return (
    <div className="min-h-screen bg-[#000000] text-[#FFFFFF] p-6 pb-24 max-w-sm mx-auto flex flex-col gap-8 animate-fade-in">
      <header className="text-center pt-4">
        <h1 className="text-3xl font-black uppercase tracking-widest text-[#FFFFFF]">Evolua ao Máximo</h1>
        <p className="text-[#A1A1AA] text-xs font-bold mt-2 uppercase tracking-wider">Escolha o plano ideal para seus objetivos</p>
      </header>

      {/* TOGGLE */}
      <div className="bg-[#1A1A1A] p-1 rounded-[100px] flex border border-[#222225] relative">
        <button onClick={() => setBilling('mensal')} className={`flex-1 text-[10px] font-black uppercase tracking-widest py-3 rounded-[100px] z-10 transition-colors ${billing === 'mensal' ? 'text-black' : 'text-[#A1A1AA]'}`}>Mensal</button>
        <button onClick={() => setBilling('anual')} className={`flex-1 text-[10px] font-black uppercase tracking-widest py-3 rounded-[100px] z-10 transition-colors ${billing === 'anual' ? 'text-black' : 'text-[#A1A1AA]'}`}>Anual (-37%)</button>
        <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#FFE600] rounded-[100px] transition-transform duration-300 ease-in-out ${billing === 'anual' ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'}`} />
      </div>

      <div className="flex flex-col gap-6">
        {/* CARD PRO */}
        <div className="bg-[#0F0F0F] border-2 border-[#FFE600] rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-[#FFE600] text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl">Recomendado</div>
          
          <h2 className="text-[#FFE600] font-black text-2xl uppercase tracking-tighter mb-1">PRO</h2>
          <div className="flex items-end gap-1 mb-6">
            <span className="text-3xl font-black">R${billing === 'anual' ? '9,38' : '14,90'}</span>
            <span className="text-[#A1A1AA] text-xs font-bold uppercase mb-1">/mês</span>
          </div>
          {billing === 'anual' && <p className="text-[#22C55E] text-[10px] font-bold uppercase tracking-widest -mt-4 mb-4">Cobrado R$ 112,64 ao ano</p>}
          
          <button 
            onClick={handleAssinarWhatsApp}
            disabled={isPro}
            className={`w-full h-14 font-black uppercase tracking-widest rounded-[100px] text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 ${isPro ? 'bg-[#1A1A1A] text-[#555558] border border-[#222225]' : 'bg-[#FFE600] text-black shadow-[0_0_20px_rgba(255,230,0,0.2)]'}`}
          >
            {isPro ? 'Seu Plano Atual' : <><MessageCircle size={18} /> Assinar PRO via WhatsApp</>}
          </button>
        </div>

        {/* CARD FREE */}
        <div className="bg-[#0F0F0F] border border-[#222225] rounded-3xl p-6">
          <h2 className="text-[#A1A1AA] font-black text-xl uppercase tracking-tighter mb-1">FREE</h2>
          <div className="flex items-end gap-1 mb-6">
            <span className="text-3xl font-black">R$0</span>
            <span className="text-[#A1A1AA] text-xs font-bold uppercase mb-1">/sempre</span>
          </div>
          <button disabled className="w-full h-14 bg-[#1A1A1A] border border-[#222225] text-[#555558] font-black uppercase tracking-widest rounded-[100px] text-xs">
            {!isPro ? 'Seu Plano Atual' : 'Plano Básico'}
          </button>
        </div>
      </div>

      {/* COMPARATIVO */}
      <section className="bg-[#0F0F0F] border border-[#222225] rounded-3xl p-4">
        <h3 className="text-center font-black uppercase tracking-widest text-xs text-[#555558] mb-4 mt-2">Comparativo Completo</h3>
        <div className="flex flex-col divide-y divide-[#222225]">
          <div className="flex text-[9px] font-black uppercase text-[#555558] tracking-widest pb-2 px-2">
            <span className="flex-1">Funcionalidade</span>
            <span className="w-12 text-center">Free</span>
            <span className="w-12 text-center text-[#FFE600]">Pro</span>
          </div>
          {features.map((f, i) => (
            <div key={i} className="flex items-center py-4 px-2">
              <span className="flex-1 text-xs font-bold text-[#A1A1AA]">{f.name}</span>
              <span className="w-12 flex justify-center text-[10px] font-black text-[#555558]">
                {f.free === true ? <Check size={14} className="text-[#555558]" /> : f.free === false ? <XIcon size={14} /> : f.free}
              </span>
              <span className="w-12 flex justify-center text-[10px] font-black text-[#FFE600]">
                {f.pro === true ? <Check size={14} /> : f.pro}
              </span>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}