'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Gift } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/lib/hooks/useToast';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<'student' | 'pending_trainer'>('student');
  const [cref, setCref] = useState('');
  
  // Growth State
  const [referralCode, setReferralCode] = useState('');
  const [legalAccepted, setLegalAccepted] = useState(false);

  // Capturar parâmetro "?ref=CODIGO" da URL automaticamente
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode.toUpperCase());
      showToast('Código de indicação detectado! Conclua o cadastro para ganhar seu bônus.', 'info');
    }
  }, [searchParams, showToast]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalAccepted) return;
    if (!fullName || !username || !email || !password) {
      showToast('Preencha os campos obrigatórios.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const cleanUsername = username.trim().toLowerCase().replace('@', '');
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password
      });

      if (authError || !authData.user) throw new Error(authError?.message || 'Erro de cadastro.');

      // Criar Perfil do usuário
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          username: cleanUsername,
          account_type: accountType,
          cref: accountType === 'pending_trainer' ? cref.trim() : null,
          cref_status: accountType === 'pending_trainer' ? 'pending' : null,
          lgpd_accepted: true,
          lgpd_accepted_at: new Date().toISOString()
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      // Executar validação de indicação se houver código preenchido
      if (referralCode.trim()) {
        try {
          const res = await fetch('/api/referral/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ referralCode: referralCode.trim().toUpperCase(), newUserId: authData.user.id })
          });
          const refResult = await res.json();
          if (res.ok && refResult.success) {
            showToast('🎁 Indicação ativada! Você ganhou 15 dias de PRO grátis!', 'success');
          }
        } catch (err) {
          console.error('Falha de rede ao validar código, seguindo fluxo comum...', err);
        }
      }

      showToast('Cadastro efetuado com sucesso!', 'success');
      
      if (accountType === 'pending_trainer') {
        router.push('/pending-approval');
      } else {
        router.push('/home');
      }
      router.refresh();

    } catch (err: any) {
      showToast(err.message || 'Falha ao registrar conta.', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col justify-center max-w-sm mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Ares<span className="text-[#FFE600]">Fit</span></h1>
        <p className="text-xs text-[#A1A1AA] uppercase font-bold tracking-widest mt-1">Crie sua conta de performance</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <input type="text" placeholder="Nome Completo" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full h-12 bg-[#1A1A1A] border border-[#222225] rounded-xl px-4 text-sm text-white focus:border-[#FFE600] outline-none" required />
        <input type="text" placeholder="Nome de Usuário (@username)" value={username} onChange={e => setUsername(e.target.value)} className="w-full h-12 bg-[#1A1A1A] border border-[#222225] rounded-xl px-4 text-sm text-white focus:border-[#FFE600] outline-none" required />
        <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className="w-full h-12 bg-[#1A1A1A] border border-[#222225] rounded-xl px-4 text-sm text-white focus:border-[#FFE600] outline-none" required />
        <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full h-12 bg-[#1A1A1A] border border-[#222225] rounded-xl px-4 text-sm text-white focus:border-[#FFE600] outline-none" required />

        {/* Input Opcional de Referral (Growth Hacking) */}
        <div className="relative">
          <Gift size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555558]" />
          <input 
            type="text" 
            placeholder="Código de um amigo (Opcional)" 
            value={referralCode} 
            onChange={e => setReferralCode(e.target.value.toUpperCase())} 
            className="w-full h-12 bg-[#1A1A1A] border border-[#222225] rounded-xl pl-11 pr-4 text-sm text-[#FFE600] font-black uppercase placeholder-[#555558] focus:border-[#FFE600] outline-none" 
          />
        </div>

        <div className="grid grid-cols-2 gap-2 bg-[#0F0F0F] p-1 border border-[#222225] rounded-xl">
          <button type="button" onClick={() => setAccountType('student')} className={`py-2 text-xs font-black uppercase rounded-lg ${accountType === 'student' ? 'bg-[#FFE600] text-black' : 'text-[#A1A1AA]'}`}>Atleta</button>
          <button type="button" onClick={() => setAccountType('pending_trainer')} className={`py-2 text-xs font-black uppercase rounded-lg ${accountType === 'pending_trainer' ? 'bg-[#FFE600] text-black' : 'text-[#A1A1AA]'}`}>Personal</button>
        </div>

        {accountType === 'pending_trainer' && (
          <input type="text" placeholder="Registro CREF" value={cref} onChange={e => setCref(e.target.value)} className="w-full h-12 bg-[#1A1A1A] border border-[#222225] rounded-xl px-4 text-sm text-white focus:border-[#FFE600] outline-none animate-slide-up" required />
        )}

        <label className="flex items-start gap-3 bg-[#0F0F0F] border border-[#222225] p-3 rounded-xl cursor-pointer">
          <input type="checkbox" checked={legalAccepted} onChange={e => setLegalAccepted(e.target.checked)} className="w-5 h-5 rounded accent-[#FFE600] shrink-0 mt-0.5" />
          <span className="text-[11px] text-[#A1A1AA] leading-relaxed font-semibold">
            Li e estou ciente com os <Link href="/termos" target="_blank" className="text-[#FFE600] underline font-bold">Termos de Uso</Link> e a <Link href="/privacidade" target="_blank" className="text-[#FFE600] underline font-bold">Política de Privacidade</Link>.
          </span>
        </label>

        <button type="submit" disabled={!legalAccepted || loading} className="w-full h-14 bg-[#FFE600] text-black font-black uppercase tracking-widest text-xs rounded-full flex items-center justify-center disabled:opacity-20 transition-all active:scale-95 mt-2">
          {loading ? <Loader2 className="animate-spin" size={20} /> : 'Criar Conta'}
        </button>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-[#FFE600]" size={32} /></div>}>
      <RegisterForm />
    </Suspense>
  );
}