'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  ShieldCheck, CheckCircle2, XCircle, Clock, 
  Search, Users, Activity, X, RefreshCcw 
} from 'lucide-react';
import { useToast } from '@/lib/hooks/useToast';
import { EmptyState } from '@/components/ui/EmptyState';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const [pending, setPending] = useState<any[]>([]);
  const [approved, setApproved] = useState<any[]>([]);
  const [rejected, setRejected] = useState<any[]>([]);

  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; profileId: string | null }>({ isOpen: false, profileId: null });
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push('/home');
        return;
      }
      await loadData();
      setLoading(false);
    };
    init();
  }, [router, supabase]);

  const loadData = async () => {
    const { data: pData } = await supabase.from('profiles').select('*').eq('account_type', 'pending_trainer').eq('cref_status', 'pending').order('created_at', { ascending: false });
    setPending(pData || []);

    const { data: aData } = await supabase.from('profiles').select('*, trainer_students!trainer_students_trainer_id_fkey(id)').eq('account_type', 'trainer').eq('cref_status', 'approved').order('created_at', { ascending: false });
    setApproved(aData || []);

    const { data: rData } = await supabase.from('profiles').select('*').eq('cref_status', 'rejected').order('created_at', { ascending: false });
    setRejected(rData || []);
  };

  const handleAction = async (profileId: string, action: 'approve' | 'reject' | 'reactivate', reason?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, action, reason })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao processar ação.');

      if (action === 'approve') {
        // Dispara o PUSH informando que o CREF foi aprovado
        await fetch('/api/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: profileId, 
            title: 'CREF Aprovado! ✅', 
            body: 'Seu cadastro como Personal foi validado. Acesse o painel de alunos.',
            url: '/painel-pt'
          })
        });
      }

      showToast(`Personal ${action === 'approve' ? 'aprovado' : action === 'reject' ? 'rejeitado' : 'reativado'} com sucesso!`, 'success');
      
      if (action === 'reject') {
        setRejectModal({ isOpen: false, profileId: null });
        setRejectReason('');
      }

      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Activity className="animate-spin text-[#FFE600]" size={32} /></div>;

  return (
    <div className="min-h-screen bg-[#000000] text-[#FFFFFF] p-6 pb-24 max-w-sm mx-auto flex flex-col gap-6 animate-fade-in">
      <header className="flex flex-col gap-2 pt-4">
        <div className="w-12 h-12 bg-[#FFE600]/10 border border-[#FFE600]/30 rounded-full flex items-center justify-center mb-2">
          <ShieldCheck size={24} className="text-[#FFE600]" />
        </div>
        <h1 className="text-xl font-black uppercase tracking-widest text-[#FFFFFF]">Painel Admin</h1>
        <p className="text-[#A1A1AA] text-xs font-bold uppercase tracking-wider">Aprovação de Personals</p>
      </header>

      <div className="flex bg-[#1A1A1A] border border-[#222225] rounded-[100px] p-1">
        {[{ id: 'pending', label: 'Pendentes' }, { id: 'approved', label: 'Aprovados' }, { id: 'rejected', label: 'Rejeitados' }].map(tab => (
          <button 
            key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 text-[10px] font-black uppercase tracking-widest py-3 rounded-[100px] transition-colors ${activeTab === tab.id ? 'bg-[#FFE600] text-black' : 'text-[#A1A1AA]'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {activeTab === 'pending' && (
          pending.length === 0 ? <EmptyState emoji="⏳" title="Tudo em dia" description="Nenhuma solicitação pendente de análise." /> : (
            pending.map(p => (
              <div key={p.id} className="bg-[#0F0F0F] border border-[#222225] p-5 rounded-3xl flex flex-col gap-4">
                <div>
                  <h3 className="text-white font-black uppercase text-sm">{p.full_name}</h3>
                  <p className="text-[#A1A1AA] text-xs">@{p.username} • {p.email}</p>
                </div>
                <div className="bg-[#1A1A1A] border border-[#222225] p-3 rounded-xl flex justify-between items-center">
                  <span className="text-[#555558] text-[10px] uppercase font-bold tracking-widest">CREF</span>
                  <span className="text-[#FFE600] font-mono font-black text-sm uppercase">{p.cref}</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleAction(p.id, 'approve')} disabled={actionLoading} className="flex-1 bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] h-12 rounded-[100px] flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest disabled:opacity-50">
                    <CheckCircle2 size={16}/> Aprovar
                  </button>
                  <button onClick={() => setRejectModal({ isOpen: true, profileId: p.id })} disabled={actionLoading} className="flex-1 bg-[#FF3B30]/10 border border-[#FF3B30]/30 text-[#FF3B30] h-12 rounded-[100px] flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest disabled:opacity-50">
                    <XCircle size={16}/> Rejeitar
                  </button>
                </div>
              </div>
            ))
          )
        )}

        {activeTab === 'approved' && (
          approved.length === 0 ? <EmptyState emoji="✅" title="Vazio" description="Nenhum personal aprovado." /> : (
            approved.map(p => (
              <div key={p.id} className="bg-[#0F0F0F] border border-[#222225] p-4 rounded-2xl flex justify-between items-center">
                <div>
                  <h3 className="text-white font-bold text-sm uppercase">{p.full_name}</h3>
                  <p className="text-[#22C55E] text-[10px] font-bold uppercase tracking-widest mt-0.5">CREF: {p.cref}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#555558] text-[9px] uppercase font-bold tracking-widest mb-0.5">Alunos</p>
                  <p className="text-white font-black">{p.trainer_students?.length || 0}</p>
                </div>
              </div>
            ))
          )
        )}

        {activeTab === 'rejected' && (
          rejected.length === 0 ? <EmptyState emoji="❌" title="Vazio" description="Nenhum personal rejeitado." /> : (
            rejected.map(p => (
              <div key={p.id} className="bg-[#0F0F0F] border border-[#222225] p-5 rounded-3xl flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-white font-bold text-sm uppercase">{p.full_name}</h3>
                    <p className="text-[#FF3B30] text-[10px] font-bold uppercase tracking-widest mt-0.5">CREF: {p.cref}</p>
                  </div>
                  <button onClick={() => handleAction(p.id, 'reactivate')} disabled={actionLoading} className="p-2 bg-[#1A1A1A] border border-[#222225] rounded-full text-[#A1A1AA] hover:text-[#FFE600] disabled:opacity-50">
                    <RefreshCcw size={16} />
                  </button>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {rejectModal.isOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-[#0F0F0F] border border-[#222225] rounded-3xl p-6 w-full max-w-sm animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[#FF3B30] font-black uppercase tracking-widest text-lg">Motivo da Rejeição</h3>
              <button onClick={() => setRejectModal({ isOpen: false, profileId: null })} className="text-[#A1A1AA]"><X size={20}/></button>
            </div>
            <textarea 
              rows={4} placeholder="Ex: CREF inválido ou nome não confere..." value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#222225] rounded-2xl p-4 text-white text-sm outline-none focus:border-[#FF3B30] mb-4"
            />
            <button 
              onClick={() => handleAction(rejectModal.profileId!, 'reject', rejectReason)}
              disabled={actionLoading || !rejectReason.trim()}
              className="w-full h-14 bg-[#FF3B30] text-white font-black uppercase tracking-widest rounded-[100px] disabled:opacity-50"
            >
              Confirmar Rejeição
            </button>
          </div>
        </div>
      )}
    </div>
  );
}