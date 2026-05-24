'use client';

import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function PendingApprovalPage() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleEnterAsStudent = () => {
    // Permite que ele navegue pelo app como aluno enquanto aguarda
    router.push('/home');
  };

  return (
    <main className="min-h-screen bg-background text-primary flex flex-col items-center justify-center px-screenPadding text-center relative overflow-hidden">
      
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-brand/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="animate-slide-up flex flex-col items-center max-w-sm z-10">
        <div className="w-24 h-24 bg-surface-2 rounded-full border border-border flex items-center justify-center mb-8 relative">
          <Clock size={40} className="text-brand animate-pulse" />
        </div>

        <h1 className="text-2xl font-bold mb-4">Cadastro em análise</h1>
        
        <p className="text-secondary text-sm leading-relaxed mb-10">
          Recebemos o seu documento e nossa equipe já está validando o seu CREF. 
          Esse processo leva até <strong className="text-primary">24 horas</strong>. 
          Avisaremos você por e-mail assim que seu perfil de Treinador for liberado.
        </p>

        <div className="w-full flex flex-col gap-4">
          <button 
            onClick={handleEnterAsStudent}
            className="w-full h-14 bg-transparent border border-brand text-brand font-bold rounded-pill flex items-center justify-center hover:bg-brand-soft transition-colors"
          >
            Entrar como aluno enquanto isso
          </button>
          
          <button 
            onClick={handleLogout}
            className="w-full h-12 text-secondary font-medium rounded-pill flex items-center justify-center hover:bg-surface hover:text-primary transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </main>
  );
}