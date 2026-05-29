'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

// Tipagem para o evento nativo do PWA
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Verifica se já foi dispensado na última semana
    const lastDismissed = localStorage.getItem('pwa_prompt_dismissed');
    if (lastDismissed) {
      const daysSinceDismissed = (Date.now() - parseInt(lastDismissed, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return; // Não mostra se dispensou há menos de 7 dias
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Previne o prompt padrão do Chrome de aparecer
      e.preventDefault();
      // Salva o evento para ser disparado depois
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Mostra o prompt de instalação
    deferredPrompt.prompt();
    
    // Aguarda a resposta do usuário
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-4 animate-slide-up max-w-sm mx-auto w-full pointer-events-none">
      <div className="bg-[#0F0F0F] border border-[#FFE600]/30 rounded-2xl p-4 shadow-[0_0_20px_rgba(0,0,0,0.8)] pointer-events-auto flex items-center justify-between gap-4">
        
        <div className="flex flex-col flex-1">
          <h4 className="text-white text-sm font-black uppercase tracking-widest">Instale o AresFit</h4>
          <p className="text-[#A1A1AA] text-xs mt-1">Tenha a experiência completa de aplicativo nativo no seu celular.</p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleInstallClick}
            className="bg-[#FFE600] text-black w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95"
          >
            <Download size={18} />
          </button>
          <button 
            onClick={handleDismiss}
            className="bg-[#1A1A1A] text-[#A1A1AA] border border-[#222225] w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

      </div>
    </div>
  );
}