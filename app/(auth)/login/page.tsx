'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AtSign, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('msg') === 'cadastro_ok') {
      setSuccessMsg('Conta criada! Faça login para continuar.');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('Preencha todos os campos.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg(''); // Limpa a mensagem de sucesso ao tentar logar

    try {
      // PASSO 1: Buscar email pelo username
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim().toLowerCase().replace('@', '')
        })
      });

      // Verificar se a resposta é JSON válido
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setError('Erro no servidor. Tente novamente.');
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Usuário não encontrado.');
        setLoading(false);
        return;
      }

      if (!data.email) {
        setError('Usuário não encontrado.');
        setLoading(false);
        return;
      }

      // PASSO 2: Login com email + senha
      const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: password.trim()
      });

      if (loginError) {
        if (loginError.message.includes('Invalid login credentials')) {
          setError('Senha incorreta. Tente novamente.');
        } else if (loginError.message.includes('Email not confirmed')) {
          setError('Email não confirmado. Entre em contato com o suporte.');
        } else {
          setError('Erro ao entrar: ' + loginError.message);
        }
        setLoading(false);
        return;
      }

      if (!authData?.user) {
        setError('Erro ao autenticar. Tente novamente.');
        setLoading(false);
        return;
      }

      // PASSO 3: Redirecionar
      router.push('/home');
      router.refresh();

    } catch (err: any) {
      // Mostrar o erro real em vez da mensagem genérica
      setError('Erro inesperado: ' + (err?.message || 'desconhecido'));
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    
    setForgotLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: window.location.origin + '/auth/reset-password'
    });
    
    if (resetError) {
      setForgotMessage('Erro ao enviar. Verifique se o e-mail está correto.');
    } else {
      setForgotMessage('Link enviado! Verifique sua caixa de entrada.');
      setForgotEmail('');
    }
    setForgotLoading(false);
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col animate-fade-in">
      {/* LOGO */}
      <div className="text-center mb-10">
        <h1 className="text-5xl font-black tracking-tighter mb-2">
          Ares<span className="text-[#FFE600]">Fit</span>
        </h1>
        <p className="text-[#A1A1AA] text-sm uppercase tracking-widest font-medium">
          Treine. Evolua. Domine.
        </p>
      </div>

      {successMsg && (
        <div className="bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-xl p-3 mb-6 text-center">
          <p className="text-[#22C55E] text-sm font-semibold">{successMsg}</p>
        </div>
      )}

      {/* FORM LOGIN */}
      <form onSubmit={handleLogin} className="flex flex-col space-y-4">
        <div className="relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#555558]">
            <AtSign size={20} />
          </span>
          <input
            type="text"
            placeholder="@seuusername"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            className="w-full h-14 bg-[#1A1A1A] rounded-2xl pl-12 pr-5 text-[#FFFFFF] placeholder-[#555558] border border-[#222225] focus:border-[#FFE600] outline-none transition-colors"
          />
        </div>

        <div className="relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#555558]">
            <Lock size={20} />
          </span>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full h-14 bg-[#1A1A1A] rounded-2xl pl-12 pr-12 text-[#FFFFFF] placeholder-[#555558] border border-[#222225] focus:border-[#FFE600] outline-none transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {error && <p className="text-[#FF3B30] text-sm font-medium pl-1 mt-1">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-14 bg-[#FFE600] text-black font-bold rounded-[100px] flex items-center justify-center transition-all disabled:opacity-50 mt-2"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Entrar'}
        </button>
      </form>

      {/* ESQUECI A SENHA */}
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => setShowForgot(!showForgot)}
          className="text-[#A1A1AA] text-xs hover:text-[#FFFFFF] font-medium transition-colors"
        >
          Esqueci minha senha
        </button>
      </div>

      {showForgot && (
        <form onSubmit={handleForgotPassword} className="mt-4 p-5 bg-[#0F0F0F] rounded-2xl border border-[#222225] space-y-3 animate-slide-up">
          <input
            type="email"
            placeholder="E-mail de recuperação"
            required
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            className="w-full h-12 bg-[#1A1A1A] rounded-xl px-4 text-[#FFFFFF] text-sm placeholder-[#555558] border border-[#222225] focus:border-[#FFE600] outline-none"
          />
          {forgotMessage && (
            <p className={`text-xs font-semibold ${forgotMessage.includes('Erro') ? 'text-[#FF3B30]' : 'text-[#22C55E]'}`}>
              {forgotMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={forgotLoading}
            className="w-full h-12 bg-transparent border border-[#FFE600] text-[#FFE600] text-xs font-bold rounded-[100px] flex items-center justify-center disabled:opacity-50"
          >
            {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar link'}
          </button>
        </form>
      )}

      {/* SEPARADOR E GOOGLE */}
      <div className="flex items-center gap-3 my-8">
        <div className="flex-1 h-px bg-[#222225]"></div>
        <span className="text-[#555558] text-sm">ou</span>
        <div className="flex-1 h-px bg-[#222225]"></div>
      </div>

      <button
        type="button"
        disabled
        className="relative w-full h-14 bg-[#1A1A1A] border border-[#222225] text-[#A1A1AA] font-medium rounded-[100px] flex items-center justify-center gap-3 cursor-not-allowed opacity-60"
      >
        <div className="absolute -top-2 bg-[#222225] text-[#555558] text-[9px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wider border border-[#222225]">
          Em breve
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continuar com Google
      </button>

      {/* LINK CADASTRO */}
      <div className="mt-10 text-center">
        <span className="text-[#A1A1AA] text-sm">Não tem conta? </span>
        <Link href="/register" className="text-[#FFE600] text-sm font-bold hover:underline">
          Criar conta
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#000000] text-[#FFFFFF] px-6 py-12 flex flex-col justify-center">
      <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-[#FFE600] w-8 h-8" /></div>}>
        <LoginContent />
      </Suspense>
    </main>
  );
}