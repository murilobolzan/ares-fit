'use client';

import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/lib/hooks/usePushNotifications';
import { Bell, X, Loader2 } from 'lucide-react';
import { haptics } from '@/lib/haptics';

export function NotificationPrompt() {
  const { permission, subscribe, loading } = usePushNotifications();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Só aparece se for a primeira vez e se o usuário não aceitou/negou ainda
    if (typeof window !== 'undefined' && permission === 'default') {
      const dismissed = localStorage.getItem('notification_prompt_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    }
  }, [permission]);

  const handleSubscribe = async () => {
    haptics.light();
    const success = await subscribe();
    if (success) {
      haptics.success();
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('notification_prompt_dismissed', 'true');
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="mb-6 bg-[#0F0F0F] border border-[#FFE600]/30 rounded-3xl p-4 flex flex-col gap-3 shadow-[0_0_30px_rgba(255,230,0,0.05)] animate-slide-down relative overflow-hidden">
      <div className="absolute right-0 top-0 w-24 h-24 bg-[#FFE600] rounded-full filter blur-[50px] opacity-10 pointer-events-none" />
      
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#FFE600]/10 rounded-full flex items-center justify-center border border-[#FFE600]/20">
            <Bell size={20} className="text-[#FFE600]" />
          </div>
          <div>
            <h4 className="text-white text-sm font-black uppercase tracking-widest">Receber Lembretes?</h4>
            <p className="text-[#A1A1AA] text-[10px] uppercase font-bold mt-0.5">Alertas de treino e Feedbacks</p>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-[#555558] hover:text-[#A1A1AA] transition-colors p-1">
          <X size={18} />
        </button>
      </div>

      <div className="flex gap-2 mt-1 relative z-10">
        <button 
          onClick={handleSubscribe}
          disabled={loading}
          className="flex-1 h-10 bg-[#FFE600] text-black text-xs font-black uppercase tracking-widest rounded-full flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Ativar Alertas'}
        </button>
        <button 
          onClick={handleDismiss}
          disabled={loading}
          className="w-1/3 h-10 bg-[#1A1A1A] border border-[#222225] text-[#A1A1AA] text-xs font-bold uppercase tracking-widest rounded-full flex items-center justify-center transition-colors hover:text-white"
        >
          Agora Não
        </button>
      </div>
    </div>
  );
}