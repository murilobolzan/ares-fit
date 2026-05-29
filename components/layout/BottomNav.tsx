'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Dumbbell, TrendingUp, User, Users, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const baseNavItems: NavItem[] = [
  { href: '/home', label: 'Home', icon: LayoutDashboard },
  { href: '/fichas', label: 'Fichas', icon: Dumbbell },
  { href: '/evolucao', label: 'Evolução', icon: TrendingUp },
  { href: '/perfil', label: 'Perfil', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [accountType, setAccountType] = useState<string>('student');

  useEffect(() => {
    const getProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('account_type')
        .eq('id', user.id)
        .single();
        
      if (data) setAccountType(data.account_type);
    };
    
    getProfile();
  }, []);

  const navItems: NavItem[] = [
    ...baseNavItems,
    ...(accountType === 'trainer'
      ? [{ href: '/painel-pt', label: 'Alunos', icon: Users }]
      : accountType === 'student'
      ? [{ href: '/painel-aluno', label: 'Meu PT', icon: UserCheck }]
      : [])
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-t border-[#222225] select-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-sm mx-auto flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/home' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full relative transition-transform active:scale-95 touch-manipulation"
            >
              <Icon
                size={22}
                className={isActive ? 'text-[#FFE600]' : 'text-[#555558] transition-colors duration-200'}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span className={`text-[9px] uppercase tracking-widest font-bold transition-colors duration-200 ${
                isActive ? 'text-[#FFE600]' : 'text-[#555558]'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FFE600] animate-fade-in" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}