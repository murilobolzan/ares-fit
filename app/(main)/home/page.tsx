'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Flame, Calendar, Dumbbell, ChevronRight, Trophy, 
  TrendingUp, AlertTriangle, Search 
} from 'lucide-react';
import { SkeletonCard, SkeletonAvatar, SkeletonText } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/lib/hooks/useToast';
import { NotificationPrompt } from '@/components/ui/NotificationPrompt';

interface AnalyticsData {
  prs: { exerciseName: string; newMax: number; oldMax: number }[];
  plateaus: { exerciseName: string; currentMax: number }[];
  imbalances: string[];
  neglected: { muscle: string; days: string | number }[];
}

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    prs: [], plateaus: [], imbalances: [], neglected: []
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!localStorage.getItem('onboarding_complete')) {
        router.push('/onboarding');
        return;
      }
    }

    const loadDataAndAnalyze = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(prof);

        const { data: sessions } = await supabase
          .from('workout_sessions')
          .select('*, workout_routines(name)')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .order('finished_at', { ascending: false });

        if (!sessions || sessions.length === 0) {
          setRecentSessions([]);
          setLoading(false);
          return;
        }

        setRecentSessions(sessions.slice(0, 3));

        const sessionIds = sessions.map(s => s.id);
        const sessionMap = new Map(sessions.map(s => [s.id, s.finished_at]));

        const { data: sets } = await supabase
          .from('workout_sets')
          .select('*, base_exercises(name, muscle_group)')
          .in('session_id', sessionIds)
          .eq('completed', true)
          .neq('set_type', 'warmup');

        if (!sets) return;

        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const newPrs: any[] = [];
        const plateaus: any[] = [];
        const imbalances: string[] = [];
        const neglected: any[] = [];

        const exHistoricalMax = new Map<string, number>();
        const exRecentMax = new Map<string, number>();
        const exSessionMax = new Map<string, Map<string, number>>();
        const volume30d = { Peito: 0, Costas: 0, Bíceps: 0, Tríceps: 0, Quadríceps: 0, Posterior: 0 };
        const trainedLast7d = new Set<string>();
        const lastTrainedDate = new Map<string, string>();

        sets.forEach(set => {
          const dateStr = sessionMap.get(set.session_id);
          if (!dateStr) return;
          const date = new Date(dateStr);
          
          const exName = Array.isArray(set.base_exercises) ? set.base_exercises[0]?.name : set.base_exercises?.name;
          const muscle = Array.isArray(set.base_exercises) ? set.base_exercises[0]?.muscle_group : set.base_exercises?.muscle_group;
          if (!exName || !muscle) return;

          const weight = Number(set.weight_kg) || 0;
          const reps = Number(set.reps) || 0;
          const oneRM = weight * (1 + reps / 30);
          const volume = weight * reps;

          const currentLast = lastTrainedDate.get(muscle);
          if (!currentLast || date > new Date(currentLast)) {
            lastTrainedDate.set(muscle, dateStr);
          }

          if (date >= sevenDaysAgo) {
            trainedLast7d.add(muscle);
            const curRecent = exRecentMax.get(exName) || 0;
            if (oneRM > curRecent) exRecentMax.set(exName, oneRM);
          } else {
            const curHist = exHistoricalMax.get(exName) || 0;
            if (oneRM > curHist) exHistoricalMax.set(exName, oneRM);
          }

          if (date >= thirtyDaysAgo && muscle in volume30d) {
            volume30d[muscle as keyof typeof volume30d] += volume;
          }

          const dateKey = date.toISOString().split('T')[0];
          if (!exSessionMax.has(exName)) exSessionMax.set(exName, new Map());
          const sMap = exSessionMax.get(exName)!;
          const curSMax = sMap.get(dateKey) || 0;
          if (oneRM > curSMax) sMap.set(dateKey, oneRM);
        });

        exRecentMax.forEach((rm, exName) => {
          const histMax = exHistoricalMax.get(exName) || 0;
          if (histMax > 0 && rm > histMax) {
            newPrs.push({ exerciseName: exName, newMax: Math.round(rm), oldMax: Math.round(histMax) });
          }
        });

        exSessionMax.forEach((sMap, exName) => {
          const sortedSessions = Array.from(sMap.entries()).sort((a,b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
          if (sortedSessions.length >= 4) {
            const last4 = sortedSessions.slice(0, 4).map(s => s[1]);
            const max = Math.max(...last4);
            const min = Math.min(...last4);
            if (max > 0) {
              const variance = ((max - min) / max) * 100;
              if (variance < 2) {
                plateaus.push({ exerciseName: exName, currentMax: Math.round(max) });
              }
            }
          }
        });

        const checkPair = (m1: string, m2: string) => {
          const v1 = volume30d[m1 as keyof typeof volume30d] || 0;
          const v2 = volume30d[m2 as keyof typeof volume30d] || 0;
          const max = Math.max(v1, v2);
          if (max === 0) return;
          const diff = Math.abs(v1 - v2);
          if ((diff / max) * 100 > 40) {
            const over = v1 > v2 ? m1 : m2;
            const under = v1 > v2 ? m2 : m1;
            const pct = Math.round((diff / max) * 100);
            imbalances.push(`Você treina ${pct}% mais ${over} que ${under}`);
          }
        };
        checkPair('Peito', 'Costas');
        checkPair('Bíceps', 'Tríceps');
        checkPair('Quadríceps', 'Posterior');

        const targetMuscles = ['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Quadríceps', 'Posterior', 'Glúteos', 'Core'];
        targetMuscles.forEach(m => {
          if (!trainedLast7d.has(m)) {
            const lastD = lastTrainedDate.get(m);
            let daysStr: string | number = 'muito tempo';
            if (lastD) {
              daysStr = Math.floor((now.getTime() - new Date(lastD).getTime()) / 86400000);
            }
            neglected.push({ muscle: m, days: daysStr });
          }
        });

        setAnalytics({ prs: newPrs, plateaus, imbalances, neglected });

      } catch (err) {
        showToast('Falha ao processar análises.', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadDataAndAnalyze();
  }, [router, supabase, showToast]);

  return (
    <div className="min-h-screen bg-[#000000] text-[#FFFFFF] p-6 pb-24 max-w-sm mx-auto flex flex-col gap-8 animate-fade-in">
      
      <header className="flex items-center justify-between pt-4">
        {loading ? (
          <SkeletonText lines={2} className="w-40" />
        ) : (
          <div>
            <p className="text-[#A1A1AA] text-xs font-bold uppercase tracking-widest">Bem-vindo de volta,</p>
            <h1 className="text-2xl font-black uppercase tracking-tight">{profile?.full_name?.split(' ')[0] || 'Atleta'}</h1>
          </div>
        )}
        {loading ? (
          <SkeletonAvatar />
        ) : (
          <div className="w-12 h-12 bg-[#1A1A1A] border border-[#222225] rounded-full flex items-center justify-center font-black text-[#FFE600] shadow-[0_0_15px_rgba(255,230,0,0.1)]">
            {profile?.full_name?.substring(0,2).toUpperCase() || 'AR'}
          </div>
        )}
      </header>

      <NotificationPrompt />

      <section>
        {loading ? (
          <SkeletonCard className="h-24" />
        ) : (
          <div className="bg-[#0F0F0F] border border-[#222225] rounded-3xl p-5 flex items-center justify-between relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#FFE600] rounded-full filter blur-[50px] opacity-20" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-[#FFE600]/10 border border-[#FFE600]/30 rounded-full flex items-center justify-center">
                <Flame size={24} className="text-[#FFE600]" />
              </div>
              <div>
                <p className="text-[#555558] text-[10px] font-black uppercase tracking-widest">Ofensiva Atual</p>
                <p className="text-white text-2xl font-black">{profile?.current_streak || 0} <span className="text-[#A1A1AA] text-sm">dias</span></p>
              </div>
            </div>
            <div className="text-right relative z-10">
              <p className="text-[#555558] text-[9px] font-black uppercase tracking-widest">Melhor</p>
              <p className="text-[#FFE600] text-sm font-black">{profile?.best_streak || 0}</p>
            </div>
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3">
        {loading ? (
          <>
            <SkeletonCard className="h-16" />
            <SkeletonCard className="h-16" />
          </>
        ) : (
          <>
            <button onClick={() => router.push('/fichas')} className="bg-[#1A1A1A] border border-[#222225] p-4 rounded-2xl flex flex-col gap-2 hover:border-[#FFE600]/50 transition-colors active:scale-95">
              <Dumbbell size={18} className="text-[#FFE600]" />
              <span className="text-xs font-black text-white uppercase tracking-widest">Treinar</span>
            </button>
            <button onClick={() => router.push('/evolucao')} className="bg-[#1A1A1A] border border-[#222225] p-4 rounded-2xl flex flex-col gap-2 hover:border-[#FFE600]/50 transition-colors active:scale-95">
              <Calendar size={18} className="text-[#22C55E]" />
              <span className="text-xs font-black text-white uppercase tracking-widest">Progresso</span>
            </button>
          </>
        )}
      </section>

      {!loading && (analytics.prs.length > 0 || analytics.plateaus.length > 0 || analytics.imbalances.length > 0 || analytics.neglected.length > 0) && (
        <section className="flex flex-col gap-4 animate-slide-up">
          <h2 className="text-[#A1A1AA] text-[10px] font-black uppercase tracking-widest pl-1">Insights do seu Treino</h2>
          
          {analytics.prs.length > 0 && (
            <div className="bg-[#FFE600]/10 border border-[#FFE600]/30 rounded-3xl p-5 flex flex-col gap-3 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#FFE600] rounded-full filter blur-[40px] opacity-20" />
              <div className="flex items-center gap-2 relative z-10">
                <Trophy size={20} className="text-[#FFE600]" />
                <h3 className="text-[#FFE600] font-black uppercase tracking-widest text-sm">Novo Recorde!</h3>
              </div>
              <div className="flex flex-col gap-2 relative z-10">
                {analytics.prs.map((pr, i) => (
                  <p key={i} className="text-white text-xs font-medium">
                    <span className="font-bold">{pr.exerciseName}:</span> {pr.newMax}kg <span className="text-[#A1A1AA]">(anterior: {pr.oldMax}kg)</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {analytics.plateaus.length > 0 && (
            <div className="bg-[#0F0F0F] border border-[#FF9F0A]/30 rounded-3xl p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={20} className="text-[#FF9F0A]" />
                <h3 className="text-[#FF9F0A] font-black uppercase tracking-widest text-sm">Atenção: Platô Detectado</h3>
              </div>
              <div className="flex flex-col gap-2">
                {analytics.plateaus.map((plat, i) => (
                  <p key={i} className="text-white text-xs font-medium">
                    <span className="font-bold">{plat.exerciseName}:</span> sem evolução nas últimas 4 sessões (máx: {plat.currentMax}kg)
                  </p>
                ))}
                <p className="text-[#A1A1AA] text-[10px] uppercase font-bold tracking-widest mt-2 border-t border-[#222225] pt-2">
                  Dica: Tente aumentar as repetições, reduzir o descanso ou adotar métodos avançados (Rest-Pause, Drop-set).
                </p>
              </div>
            </div>
          )}

          {analytics.imbalances.length > 0 && (
            <div className="bg-[#0F0F0F] border border-[#FF9F0A]/30 rounded-3xl p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-[#FF9F0A]" />
                <h3 className="text-[#FF9F0A] font-black uppercase tracking-widest text-sm">Desequilíbrio Muscular</h3>
              </div>
              <div className="flex flex-col gap-2">
                {analytics.imbalances.map((imb, i) => (
                  <p key={i} className="text-white text-xs font-medium">{imb}</p>
                ))}
                <p className="text-[#A1A1AA] text-[10px] uppercase font-bold tracking-widest mt-2 border-t border-[#222225] pt-2">
                  Dica: Desequilíbrios entre agonistas e antagonistas aumentam severamente o risco de lesões.
                </p>
              </div>
            </div>
          )}

          {analytics.neglected.length > 0 && (
            <div className="bg-[#0F0F0F] border border-[#222225] rounded-3xl p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Search size={20} className="text-[#A1A1AA]" />
                <h3 className="text-[#FFFFFF] font-black uppercase tracking-widest text-sm">Radar de Frequência</h3>
              </div>
              <div className="flex flex-col gap-2">
                {analytics.neglected.slice(0, 3).map((neg, i) => (
                  <p key={i} className="text-white text-xs font-medium">
                    Você não treina <span className="font-bold text-[#FFE600]">{neg.muscle}</span> há {neg.days} dias.
                  </p>
                ))}
                {analytics.neglected.length > 3 && (
                  <p className="text-[#555558] text-xs font-bold">+ {analytics.neglected.length - 3} grupos musculares.</p>
                )}
                <button 
                  onClick={() => router.push('/fichas')}
                  className="mt-2 w-full bg-[#1A1A1A] border border-[#222225] text-white text-xs font-black uppercase tracking-widest py-3 rounded-full hover:border-[#FFE600] transition-colors"
                >
                  Ver Biblioteca de Exercícios
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-[#A1A1AA] text-[10px] font-black uppercase tracking-widest pl-1">Atividade Recente</h2>
        
        {loading ? (
          <div className="space-y-3">
            <SkeletonCard className="h-16" />
            <SkeletonCard className="h-16" />
          </div>
        ) : recentSessions.length === 0 ? (
          <EmptyState 
            emoji="📋" 
            title="Nenhum Treino" 
            description="Você ainda não concluiu nenhum treino. Vá em Fichas para começar!" 
            actionLabel="Ir para Fichas"
            onAction={() => router.push('/fichas')}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {recentSessions.map(sess => (
              <div key={sess.id} className="bg-[#0F0F0F] border border-[#222225] p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-black uppercase">{sess.workout_routines?.name || 'Treino Livre'}</p>
                  <p className="text-[#555558] text-[10px] font-bold uppercase mt-1">
                    {new Date(sess.finished_at).toLocaleDateString('pt-BR')} • {sess.total_volume_kg}kg movidos
                  </p>
                </div>
                <ChevronRight size={16} className="text-[#555558]" />
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}