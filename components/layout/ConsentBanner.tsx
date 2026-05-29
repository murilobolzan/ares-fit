'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const consent = localStorage.getItem('lgpd_consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const closeBanner = () => {
    setVisible(false);
    localStorage.setItem('lgpd_consent', 'true');
  };

  if (!mounted || !visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 bg-black/95 backdrop-blur-md border-t border-[#222225] text-white">
      <div className="max-w-sm mx-auto flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#FFE600]/10 flex items-center justify-center text-[#FFE600] border border-[#FFE600]/20 shrink-0 mt-0.5">
            <ShieldCheck size={16} />
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="text-xs font-black uppercase tracking-widest text-white">Privacidade e Cookies</h4>
            <p className="text-[#A1A1AA] text-xs leading-relaxed">
              Usamos cookies essenciais e dados de treino para melhorar sua evolução. Conheça nossos{' '}
              <Link href="/termos" className="text-[#FFE600] underline font-bold">Termos</Link> e{' '}
              <Link href="/privacidade" className="text-[#FFE600] underline font-bold">Privacidade</Link>.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={closeBanner}
            className="flex-1 h-11 bg-[#FFE600] text-black text-xs font-black uppercase tracking-widest rounded-full transition-transform active:scale-95"
          >
            Aceitar tudo
          </button>
          <button 
            onClick={closeBanner}
            className="w-1/3 h-11 bg-transparent border border-[#222225] text-[#A1A1AA] text-xs font-bold uppercase tracking-widest rounded-full transition-colors hover:text-white"
          >
            Essenciais
          </button>
        </div>
      </div>
    </div>
  );
}