'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut, Loader2, AlertTriangle, X, Trophy, Lock } from 'lucide-react';
import { useToast } from '@/lib/hooks/useToast';
import { haptics } from '@/lib/haptics';
import ReferralCard from '@/components/referral/ReferralCard';

export default function PerfilPage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // Gamificação (Preview Misto: Bloqueadas e Desbloqueadas)
  const [previewAchievements, setPreviewAchievements] = useState<any[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);

  // Estados de Exclusão de Conta (LGPD)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (prof) setProfile(prof);

      // Busca 3 conquistas gerais do banco para servir de mostruário
      const { data: achData } = await supabase.from('achievements').select('*').limit(3);
      setPreviewAchievements(achData || []);

      // Busca QUAIS conquistas ESSE usuário tem
      const { data: userAch } = await supabase.from('user_achievements').select('achievement_id').eq('user_id', user.id);
      setUnlockedIds(userAch?.map(a => a.achievement_id) || []);

      setLoading(false);
    };
    loadData();
  }, [router, supabase]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationInput !== 'EXCLUIR') return;
    haptics.heavy();
    setDeleteLoading(true);

    try {
      const res = await fetch('/api/legal/delete-account', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao deletar a conta.');

      showToast('Seus dados foram permanentemente eliminados sob a LGPD.', 'info');
      await supabase.auth.signOut();
      router.push('/register');
      router.refresh();
    } catch (err: any) {
      showToast(err.message, 'error');
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-[#FFE600]" size={32} /></div>;
  }

  return (
    <div className="min-h-screen bg-[#000000] p-6 pt-10 pb-32 max-w-sm mx-auto flex flex-col gap-6">
      
      {/* Avatar Card */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="w-20 h-20 rounded-full bg-[#FFE600] flex items-center justify-center shadow-[0_0_20px_rgba(255,230,0,0.2)]">
          <span className="text-black font-black text-2xl">{profile?.full_name?.substring(0, 2).toUpperCase()}</span>
        </div>
        <div>
          <h1 className="text-xl font-black text-[#FFFFFF]">{profile?.full_name}</h1>
          <p className="text-[#A1A1AA] text-sm">@{profile?.username}</p>
        </div>
        <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full border bg-[#1A1A1A] text-[#A1A1AA] border-[#222225]">
          {profile?.plan === 'pro' ? '⚡ PRO' : 'FREE'}
        </span>
      </div>

      {/* GAMIFICAÇÃO: Conquistas Recentes */}
      <section className="space-y-3 bg-[#0F0F0F] border border-[#222225] p-4 rounded-3xl mt-2">
        <div className="flex justify-between items-center mb-1">
          <p className="text-[10px] font-black text-[#555558] uppercase tracking-widest">Suas Conquistas</p>
          <button onClick={() => router.push('/conquistas')} className="text-[#FFE600] text-[10px] font-black uppercase tracking-widest hover:underline">
            Ver Todas
          </button>
        </div>
        
        <p className="text-[10px] text-[#A1A1AA] leading-relaxed -mt-2 mb-3">
          Desbloqueie selos exclusivos mantendo a consistência nos treinos e batendo recordes de carga.
        </p>
        
        <div className="grid grid-cols-3 gap-2">
          {previewAchievements.map(ach => {
            const isUnlocked = unlockedIds.includes(ach.id);
            return (
              <div 
                key={ach.id} 
                className={`bg-[#1A1A1A] border p-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${isUnlocked ? 'border-[#FFE600]/30 opacity-100' : 'border-[#222225] opacity-40 grayscale'}`}
              >
                <span className="text-2xl relative">
                  {ach.emoji}
                  {!isUnlocked && (
                    <div className="absolute -bottom-1 -right-1 bg-[#1A1A1A] rounded-full p-0.5">
                      <Lock size={10} className="text-[#A1A1AA]" />
                    </div>
                  )}
                </span>
                <span className={`text-[8px] font-black uppercase text-center line-clamp-2 leading-tight mt-1 ${isUnlocked ? 'text-white' : 'text-[#555558]'}`}>
                  {ach.name}
                </span>
              </div>
            );
          })}
        </div>
        
        <button 
          onClick={() => router.push('/ranking')}
          className="w-full h-12 mt-2 bg-[#1A1A1A] border border-[#222225] text-white font-black rounded-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Trophy size={16} className="text-[#FFE600]" /> Ver Ranking Semanal
        </button>
      </section>

      {/* SEÇÃO DE INDICAÇÃO */}
      <section className="space-y-2 mt-1">
        <ReferralCard />
      </section>

      {/* Dados Pessoais */}
      <section className="space-y-2 mt-2">
        <p className="text-[10px] font-black text-[#555558] uppercase tracking-widest pl-1">Informações</p>
        <div className="bg-[#0F0F0F] border border-[#222225] rounded-3xl divide-y divide-[#222225] overflow-hidden">
          {[
            { label: 'E-mail', value: profile?.email || '—' },
            { label: 'Conta', value: profile?.account_type === 'trainer' ? 'Personal' : 'Atleta' },
            { label: 'Plano', value: profile?.plan === 'pro' ? 'Premium ⚡' : 'Básico' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between px-5 py-4">
              <span className="text-[#A1A1AA] text-sm font-bold">{item.label}</span>
              <span className="text-[#FFFFFF] text-sm font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Botões e Zona de Perigo */}
      <div className="flex flex-col gap-3 mt-4">
        {profile?.plan !== 'pro' && (
          <button onClick={() => router.push('/planos')} className="w-full h-14 bg-[#FFE600] text-black font-black rounded-[100px] uppercase tracking-widest text-sm transition-transform active:scale-95">
            ⚡ Fazer upgrade para PRO
          </button>
        )}

        <button onClick={handleLogout} disabled={loggingOut} className="w-full h-14 bg-[#0F0F0F] border border-[#222225] text-white font-bold rounded-[100px] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 text-sm">
          {loggingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />} Sair da Conta
        </button>

        <button 
          onClick={() => { haptics.medium(); setShowDeleteModal(true); }}
          className="w-full h-12 bg-transparent text-[#FF3B30] text-xs font-black uppercase tracking-widest mt-4 active:scale-95"
        >
          Excluir minha conta e dados
        </button>
      </div>

      {/* MODAL DE EXCLUSÃO LGPD */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0F0F0F] border border-[#222225] rounded-3xl p-6 w-full max-w-sm flex flex-col gap-4 relative">
            <button onClick={() => setShowDeleteModal(false)} className="absolute top-4 right-4 text-[#A1A1AA]"><X size={20}/></button>
            <div className="flex items-center gap-2 text-[#FF3B30] mb-2">
              <AlertTriangle size={24} />
              <h3 className="font-black uppercase text-sm tracking-widest">Aviso Destrutivo</h3>
            </div>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Sob as garantias da LGPD, essa ação irá <strong className="text-white">eliminar permanentemente</strong> seu perfil, histórico de cargas, fotos, medidas e vínculos de forma irrecuperável.
            </p>
            <div className="space-y-2 mt-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#555558] block pl-1">Confirme digitando EXCLUIR</label>
              <input 
                type="text" placeholder="EXCLUIR" value={deleteConfirmationInput} onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                className="w-full h-12 bg-[#1A1A1A] border border-[#222225] rounded-xl text-center text-white font-black uppercase placeholder-[#555558] tracking-widest outline-none focus:border-[#FF3B30]"
              />
            </div>
            <button
              onClick={handleDeleteAccount} disabled={deleteConfirmationInput !== 'EXCLUIR' || deleteLoading}
              className="w-full h-14 bg-[#FF3B30] text-white font-black uppercase tracking-widest rounded-full text-xs disabled:opacity-20 transition-all flex items-center justify-center gap-2 mt-2 shadow-[0_0_20px_rgba(255,59,48,0.15)]"
            >
              {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : 'Eliminar Meus Dados'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}