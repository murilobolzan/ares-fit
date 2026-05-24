'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Dumbbell, 
  TrendingUp, 
  User, 
  Users, 
  UserCheck 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type TabItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function BottomNav() {
  const pathname = usePathname();
  const supabase = createClient();
  const [extraTab, setExtraTab] = useState<TabItem | null>(null);

  // 4 Abas Padrão (Sempre Visíveis)
  const defaultTabs: TabItem[] = [
    { label: 'Home', href: '/home', icon: LayoutDashboard },
    { label: 'Fichas', href: '/fichas', icon: Dumbbell },
    { label: 'Evolução', href: '/evolucao', icon: TrendingUp },
    { label: 'Perfil', href: '/perfil', icon: User },
  ];

  useEffect(() => {
    async function checkAccountType() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Busca dados do perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_type')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      if (profile.account_type === 'trainer') {
        // Personal Aprovado -> Aba Alunos
        setExtraTab({ label: 'Alunos', href: '/painel-pt', icon: Users });
      } else if (profile.account_type === 'student') {
        // Aluno -> Verifica se tem algum vínculo aceito/ativo com personal
        const { data: relationship } = await supabase
          .from('trainer_students')
          .select('status')
          .eq('student_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (relationship) {
          setExtraTab({ label: 'Meu PT', href: '/painel-aluno', icon: UserCheck });
        }
      }
    }

    checkAccountType();
  }, [supabase]);

  // Se houver aba extra, injeta dinamicamente na penúltima posição antes de Perfil
  const renderedTabs = [...defaultTabs];
  if (extraTab) {
    renderedTabs.splice(3, 0, extraTab);
  }

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-[calc(64px+env(safe-area-inset-bottom))] border-t border-border backdrop-blur-md bg-black/90 px-4 flex justify-around items-center z-50 select-none pb-[env(safe-area-inset-bottom)]">
      {renderedTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname.startsWith(tab.href);

        return (
          <Link 
            key={tab.href} 
            href={tab.href}
            className="flex flex-col items-center justify-center flex-1 h-full relative group transition-transform active:scale-95"
          >
            <div className="relative flex flex-col items-center">
              <Icon 
                className={`w-6 h-6 transition-colors duration-200 ${
                  isActive ? 'text-brand' : 'text-muted group-hover:text-secondary'
                }`} 
              />
              
              <span 
                className={`text-[9px] uppercase font-bold tracking-widest mt-1 transition-colors duration-200 ${
                  isActive ? 'text-brand' : 'text-muted group-hover:text-secondary'
                }`}
              >
                {tab.label}
              </span>

              {/* Indicador de Aba Ativa (Dot Circular) */}
              {isActive && (
                <span className="absolute -bottom-2 w-1 h-1 bg-brand rounded-full animate-fade-in" />
              )}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}