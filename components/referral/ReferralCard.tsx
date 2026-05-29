'use client';

import { useState, useEffect } from 'react';
import { Gift, Copy, Share2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/lib/hooks/useToast';
import { haptics } from '@/lib/haptics';
import { createClient } from '@/lib/supabase/client';

export default function ReferralCard() {
  const { showToast } = useToast();
  const supabase = createClient();
  
  const [code, setCode] = useState('');
  const [stats, setStats] = useState({ totalReferred: 0, totalRewarded: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadReferralData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('referral_code').eq('id', user.id).single();
      if (profile?.referral_code) setCode(profile.referral_code);

      const { data: refs } = await supabase.from('referrals').select('status').eq('referrer_id', user.id);
      if (refs) {
        setStats({ totalReferred: refs.length, totalRewarded: refs.filter(r => r.status === 'rewarded').length });
      }
    };
    loadReferralData();
  }, [supabase]);

  const shareLink = `aresfit.vercel.app/register?ref=${code}`;
  const shareMessage = `Estou usando o AresFit para evoluir meus treinos! 💪 Crie sua conta usando meu link e venha treinar: https://${shareLink}`;

  const handleCopy = () => {
    haptics.light();
    navigator.clipboard.writeText(`https://${shareLink}`);
    setCopied(true);
    showToast('Link de indicação copiado!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    haptics.light();
    if (navigator.share) {
      try { await navigator.share({ title: 'AresFit', text: shareMessage, url: `https://${shareLink}` }); haptics.success(); } 
      catch (err) { console.log('Compartilhamento cancelado.'); }
    } else {
      handleCopy();
    }
  };

  if (!code) return null;

  return (
    <div className="bg-[#0F0F0F] border border-[#FFE600]/30 rounded-3xl p-5 relative overflow-hidden flex flex-col gap-4">
      <div className="absolute -right-10 -top-10 w-28 h-28 bg-[#FFE600] rounded-full filter blur-[60px] opacity-10 pointer-events-none" />
      
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#FFE600]/10 border border-[#FFE600]/20 rounded-xl flex items-center justify-center text-[#FFE600]">
          <Gift size={20} />
        </div>
        <div>
          <h3 className="text-white font-black text-sm uppercase tracking-widest">Indique e Ganhe 🎁</h3>
          <p className="text-[10px] text-[#A1A1AA] uppercase font-bold tracking-wider">Mês PRO Gratuito</p>
        </div>
      </div>

      <p className="text-xs text-[#A1A1AA] leading-relaxed">
        Convide amigos para treinar. Você ganha <strong className="text-white font-black">+30 dias de PRO grátis</strong> quando seu amigo criar a conta e completar o primeiro treino no app!
      </p>

      <div className="bg-[#1A1A1A] border border-[#222225] h-12 rounded-xl flex items-center justify-between px-4 text-xs font-mono text-[#FFE600] select-all overflow-hidden truncate">
        <span>{shareLink}</span>
        <button onClick={handleCopy} className="text-[#A1A1AA] hover:text-white p-1 shrink-0 ml-2">
          {copied ? <CheckCircle2 size={16} className="text-[#22C55E]" /> : <Copy size={16} />}
        </button>
      </div>

      <button onClick={handleShare} className="w-full h-12 bg-[#FFE600] text-black font-black uppercase text-xs tracking-widest rounded-full flex items-center justify-center gap-2 transition-transform active:scale-95">
        <Share2 size={14} strokeWidth={3} /> Compartilhar Link
      </button>
    </div>
  );
}