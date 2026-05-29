'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Clock, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/lib/hooks/useToast';

export default function PendingApprovalPage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!prof) return;

      // Lógica de Redirecionamento Baseada no Parecer do Admin
      if (prof.cref_status === 'approved') {
        showToast('Parabéns! Seu CREF foi aprovado.', 'success');
        router.push('/home');
        return;
      }

      setProfile(prof);
      setLoading(false);
    };

    checkStatus();
  }, [router, supabase, showToast]);

  const handleUseAsStudent = async () => {
    setStudentLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ account_type: 'student' })
        .eq('id', profile.id);

      if (error) throw error;

      router.push('/home');
      router.refresh();
    } catch (err) {
      showToast('Erro ao converter perfil. Tente novamente.', 'error');
      setStudentLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLogoutLoading(true);
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-[#FFE600]" size={32}/></div>;
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-12 flex flex-col justify-center items-center">
      <div className="w-full max-w-sm mx-auto flex flex-col text-center space-y-6 animate-fade-in">
        
        {/* ESTADO: PENDENTE */}
        {profile?.cref_status === 'pending' && (
          <>
            <div className="flex justify-center mb-2">
              <div className="w-20 h-20 rounded-full bg-[#FFE600]/10 flex items-center justify-center border border-[#FFE600]/30 animate-pulse">
                <Clock size={40} className="text-[#FFE600]" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black uppercase tracking-tight">Cadastro em Análise</h1>
              <p className="text-sm text-[#A1A1AA] leading-relaxed max-w-[280px] mx-auto">
                Seu CREF ({profile.cref}) está sendo verificado. Você receberá uma notificação em até 24h.
              </p>
            </div>
          </>
        )}

        {/* ESTADO: REJEITADO */}
        {profile?.cref_status === 'rejected' && (
          <>
            <div className="flex justify-center mb-2">
              <div className="w-20 h-20 rounded-full bg-[#FF3B30]/10 flex items-center justify-center border border-[#FF3B30]/30">
                <XCircle size={40} className="text-[#FF3B30]" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black uppercase tracking-tight text-[#FF3B30]">Cadastro Rejeitado</h1>
              <p className="text-sm text-[#A1A1AA] leading-relaxed max-w-[280px] mx-auto">
                Infelizmente não foi possível validar o seu registro profissional. Verifique seus dados ou utilize a plataforma apenas como aluno.
              </p>
            </div>
          </>
        )}

        {/* BOTÕES DE AÇÃO */}
        <div className="flex flex-col space-y-3 pt-6 w-full mt-8 border-t border-[#222225]">
          <button
            onClick={handleUseAsStudent}
            disabled={studentLoading || logoutLoading}
            className="w-full h-14 bg-transparent border-2 border-[#FFE600] text-[#FFE600] font-black uppercase tracking-widest rounded-[100px] flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 text-xs"
          >
            {studentLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar apenas como aluno'}
          </button>

          <button
            onClick={handleSignOut}
            disabled={studentLoading || logoutLoading}
            className="w-full h-12 bg-transparent text-[#A1A1AA] text-xs font-black uppercase tracking-widest hover:text-white transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {logoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sair da conta'}
          </button>
        </div>

      </div>
    </main>
  );
}