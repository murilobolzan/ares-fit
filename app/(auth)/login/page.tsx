'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/hooks/useToast';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast, ToastComponent } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      showToast('E-mail ou senha incorretos.', 'error');
      setLoading(false);
      return;
    }

    router.push('/home');
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <main className="min-h-screen bg-background text-primary flex flex-col px-screenPadding animate-fade-in relative">
      <ToastComponent />
      
      <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto pb-safe">
        {/* Header */}
        <div className="text-center mb-10 animate-slide-up">
          <h1 className="text-4xl font-black tracking-tight mb-2">
            Ares<span className="text-brand">Fit</span>
          </h1>
          <p className="text-secondary text-sm">Sua evolução começa aqui.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="relative">
            <input
              type="email"
              inputMode="email"
              placeholder="E-mail"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-14 bg-surface-2 border border-border rounded-xl px-4 text-primary placeholder:text-secondary focus:outline-none focus:border-brand transition-colors"
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-14 bg-surface-2 border border-border rounded-xl px-4 pr-12 text-primary placeholder:text-secondary focus:outline-none focus:border-brand transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-brand text-black font-bold rounded-pill mt-2 flex items-center justify-center hover:bg-brand-hover transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Entrar'}
          </button>

          <Link href="/esqueci-minha-senha" className="text-secondary text-sm text-center mt-2 hover:text-primary transition-colors">
            Esqueci minha senha
          </Link>
        </form>

        {/* Separator */}
        <div className="flex items-center gap-4 my-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex-1 h-px bg-border"></div>
          <span className="text-secondary text-sm">ou</span>
          <div className="flex-1 h-px bg-border"></div>
        </div>

        {/* Social Login */}
        <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full h-14 bg-surface-2 border border-border text-primary font-medium rounded-pill flex items-center justify-center gap-3 hover:bg-surface-3 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar com Google
          </button>
        </div>

        {/* Sign up Link */}
        <div className="mt-auto pt-8 text-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <span className="text-secondary">Ainda não tem uma conta? </span>
          <Link href="/register" className="text-brand font-bold hover:underline">
            Criar conta
          </Link>
        </div>
      </div>
    </main>
  );
}