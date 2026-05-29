'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('A nova senha deve possuir no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
        router.refresh();
      }, 2000);
    } catch (err) {
      setError('Falha ao redefinir a senha. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white px-6 py-12 flex flex-col justify-center">
      <div className="w-full max-w-sm mx-auto flex flex-col">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Nova Senha</h1>
          <p className="text-sm text-[#A1A1AA]">Escolha com segurança sua nova credencial de acesso.</p>
        </div>

        {success ? (
          <div className="bg-[#0F0F0F] border border-[#22C55E]/30 p-6 rounded-2xl text-center space-y-2 animate-fade-in">
            <p className="text-[#22C55E] font-bold text-lg">Senha alterada!</p>
            <p className="text-xs text-[#A1A1AA]">Retornando para a tela de login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#555558]">
                <Lock size={20} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Nova senha"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full h-14 bg-[#1A1A1A] rounded-2xl pl-12 pr-12 text-white placeholder-[#555558] border border-[#222225] focus:border-[#FFE600] outline-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A1AA]"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#555558]">
                <Lock size={20} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirme a nova senha"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="w-full h-14 bg-[#1A1A1A] rounded-2xl pl-12 pr-5 text-white placeholder-[#555558] border border-[#222225] focus:border-[#FFE600] outline-none disabled:opacity-50"
              />
            </div>

            {error && <p className="text-[#FF3B30] text-sm font-medium pl-1">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-[#FFE600] text-black font-bold rounded-[100px] flex items-center justify-center transition-all disabled:opacity-50 active:scale-95"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Redefinir senha'}
            </button>
          </form>
        )}

      </div>
    </main>
  );
}