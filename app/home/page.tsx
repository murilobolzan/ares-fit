import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Bell, Flame, Dumbbell, Activity, Calendar, Trophy, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface RoutineExercise {
  base_exercises: {
    muscle_group: string;
  } | null;
}

interface Routine {
  id: string;
  name: string;
  routine_exercises: RoutineExercise[] | null;
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-primary px-[20px] pt-8 pb-32 flex flex-col gap-8 animate-fade-in">
      <Suspense fallback={<HomeSkeleton />}>
        <DashboardData />
      </Suspense>
    </main>
  );
}

async function DashboardData() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const [profileRes, sessionsRes, routinesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('workout_sessions').select('*').eq('user_id', user.id),
      supabase.from('workout_routines').select('id, name, routine_exercises(base_exercises(muscle_group))').or(`owner_id.eq.${user.id},assigned_to.eq.${user.id}`)
    ]);

    const profile = profileRes.data;
    const sessions = sessionsRes.data || [];
    const sessionIds = sessions.map(s => s.id);

    const setsRes = sessionIds.length > 0 
      ? await supabase.from('workout_sets').select('*, base_exercises(muscle_group)').in('session_id', sessionIds).eq('completed', true)
      : { data: [] };
    const sets = setsRes.data || [];

    const now = new Date();
    const hour = now.getHours();
    let greeting = 'Boa noite';
    if (hour >= 5 && hour < 12) greeting = 'Bom dia';
    else if (hour >= 12 && hour < 18) greeting = 'Boa tarde';

    const firstName = profile?.full_name?.split(' ')[0] || 'Atleta';
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const thisWeekSessions = sessions.filter(s => new Date(s.finished_at || s.created_at) >= startOfWeek && s.status === 'completed');
    const workoutsCount = thisWeekSessions.length;
    const totalVolume = thisWeekSessions.reduce((sum, s) => sum + (Number(s.total_volume_kg) || 0), 0);
    const avgRating = workoutsCount > 0 ? (thisWeekSessions.reduce((sum, s) => sum + (s.rating || 0), 0) / workoutsCount).toFixed(1) : '-';

    let prCount = 0;
    const historicalMaxes: Record<string, number> = {};
    
    const sortedSets = [...sets].sort((a, b) => new Date(a.completed_at || a.created_at).getTime() - new Date(b.completed_at || b.created_at).getTime());
    
    sortedSets.forEach(set => {
      const date = new Date(set.completed_at || set.created_at);
      const isThisWeek = date >= startOfWeek;
      const weight = Number(set.weight_kg) || 0;
      const exId = set.exercise_id;

      if (!exId) return;

      if (isThisWeek) {
        if (weight > (historicalMaxes[exId] || 0)) {
          prCount++;
          historicalMaxes[exId] = weight;
        }
      } else {
        if (weight > (historicalMaxes[exId] || 0)) {
          historicalMaxes[exId] = weight;
        }
      }
    });

    const targetMuscles = ['Peito', 'Costas', 'Ombro', 'Bíceps', 'Tríceps', 'Quadríceps', 'Posterior', 'Glúteos', 'Core', 'Panturrilha'];
    
    const muscleRecovery = targetMuscles.map(muscle => {
      const muscleSets = sortedSets.filter(s => s.base_exercises?.muscle_group === muscle);
      if (!muscleSets.length) return { muscle, state: 'PRONTO', readyIn: 0 };

      const latestSet = muscleSets[muscleSets.length - 1];
      const isHeavy = ['failure', 'top'].includes(latestSet.set_type);
      
      const thresholdFadiga = isHeavy ? 36 : 24;
      const thresholdPronto = isHeavy ? 60 : 48;
      
      const hoursSince = (Date.now() - new Date(latestSet.completed_at || latestSet.created_at).getTime()) / (1000 * 60 * 60);

      if (hoursSince < thresholdFadiga) {
        return { muscle, state: 'FADIGADO', readyIn: Math.ceil(thresholdPronto - hoursSince) };
      } else if (hoursSince < thresholdPronto) {
        return { muscle, state: 'RECUPERANDO', readyIn: Math.ceil(thresholdPronto - hoursSince) };
      }
      return { muscle, state: 'PRONTO', readyIn: 0 };
    });

    const routines: Routine[] = (routinesRes.data as unknown as Routine[]) || [];
    let suggestedRoutine: any = null;    let maxScore = -999;
    let suggestedMusclesReady: string[] = [];

    routines.forEach(routine => {
      let score = 0;
      const rawMuscles = routine.routine_exercises?.map((re) => re.base_exercises?.muscle_group).filter(Boolean) || [];
      const routineMuscles = [...new Set(rawMuscles)] as string[];

      const musclesReady: string[] = [];

      routineMuscles.forEach(m => {
        const rec = muscleRecovery.find(r => r.muscle === m);
        if (!rec || rec.state === 'PRONTO') {
          score += 2;
          musclesReady.push(m);
        } else if (rec.state === 'RECUPERANDO') {
          score -= 1;
        } else if (rec.state === 'FADIGADO') {
          score -= 3;
        }
      });

      if (score > maxScore) {
        maxScore = score;
        suggestedRoutine = routine;
        suggestedMusclesReady = musclesReady;
      }
    });

    const streak = profile?.current_streak || 0;

    return (
      <>
        {/* HEADER */}
        <header className="flex justify-between items-center animate-slide-up">
          <div>
            <p className="text-secondary text-sm">{greeting},</p>
            <h1 className="text-2xl font-black">{firstName}</h1>
          </div>
          <button className="w-12 h-12 bg-surface border border-border rounded-full flex items-center justify-center text-primary relative">
            <Bell size={20} />
            <span className="absolute top-3 right-3 w-2 h-2 bg-brand rounded-full"></span>
          </button>
        </header>

        {/* STREAK CARD */}
        <div className={`p-6 rounded-3xl flex items-center justify-between animate-slide-up ${streak > 0 ? 'bg-brand text-black' : 'bg-surface-2 text-primary border border-border'}`} style={{ animationDelay: '0.1s' }}>
          <div>
            <p className={`text-sm font-medium ${streak > 0 ? 'opacity-80' : 'text-secondary'}`}>Sequência atual</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-5xl font-black">{streak}</span>
              <span className={`text-lg font-bold ${streak > 0 ? 'opacity-80' : 'text-secondary'}`}>dias</span>
            </div>
            {streak >= 7 && <p className="text-sm font-bold mt-2">Em chamas! 🔥</p>}
            {streak === 0 && <p className="text-sm font-medium mt-2 text-secondary">Comece hoje. Não há amanhã.</p>}
          </div>
          <Flame size={64} className={streak > 0 ? 'text-black opacity-20' : 'text-secondary opacity-20'} />
        </div>

        {/* RESUMO SEMANAL */}
        <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-xs font-black uppercase tracking-widest text-secondary mb-4">Esta Semana</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface border border-border rounded-3xl p-5 flex flex-col justify-between aspect-square">
              <Calendar size={24} className="text-brand mb-2" />
              <div>
                <span className="text-3xl font-black block">{workoutsCount}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-secondary">Treinos</span>
              </div>
            </div>
            <div className="bg-surface border border-border rounded-3xl p-5 flex flex-col justify-between aspect-square">
              <Dumbbell size={24} className="text-brand mb-2" />
              <div>
                <span className="text-3xl font-black block">{totalVolume}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-secondary">Vol. (kg)</span>
              </div>
            </div>
            <div className="bg-surface border border-border rounded-3xl p-5 flex flex-col justify-between aspect-square">
              <Activity size={24} className="text-brand mb-2" />
              <div>
                <span className="text-3xl font-black block">{avgRating}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-secondary">Média Nota</span>
              </div>
            </div>
            <div className="bg-surface border border-border rounded-3xl p-5 flex flex-col justify-between aspect-square">
              <Trophy size={24} className="text-brand mb-2" />
              <div>
                <span className="text-3xl font-black block">{prCount}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-secondary">Novos PRs</span>
              </div>
            </div>
          </div>
        </section>

        {/* MAPA DE RECUPERAÇÃO MUSCULAR */}
        <section className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-xs font-black uppercase tracking-widest text-secondary mb-4">Recuperação Muscular</h2>
          <div className="grid grid-cols-2 gap-3">
            {muscleRecovery.map((rec) => {
              let dotColor = 'bg-success';
              let statusText = 'Pronto';
              
              if (rec.state === 'FADIGADO') {
                dotColor = 'bg-danger shadow-[0_0_8px_rgba(255,59,48,0.5)]';
                statusText = 'Fadigado';
              } else if (rec.state === 'RECUPERANDO') {
                dotColor = 'bg-warning';
                statusText = `+${rec.readyIn}h`;
              }

              return (
                <div key={rec.muscle} className="bg-surface-2 border border-border rounded-2xl p-3 flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold truncate">{rec.muscle}</p>
                    <p className="text-xs text-secondary font-medium">{statusText}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SUGESTÃO DO DIA */}
        <section className="animate-slide-up mb-10" style={{ animationDelay: '0.4s' }}>
          <h2 className="text-xs font-black uppercase tracking-widest text-secondary mb-4">Sugestão do Dia</h2>
          <div className="bg-surface border border-border rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-[40px] pointer-events-none" />
            
            {!routines.length ? (
              <div className="text-center py-4">
                <p className="text-primary font-bold mb-1">Nenhuma ficha encontrada</p>
                <p className="text-secondary text-sm mb-6">Crie sua primeira ficha para receber sugestões inteligentes.</p>
                <Link href="/fichas" className="bg-surface-2 text-primary border border-border font-bold h-12 px-6 rounded-full inline-flex items-center justify-center">
                  Ir para fichas
                </Link>
              </div>
            ) : maxScore < 0 ? (
              <div className="text-center py-4">
                <p className="text-primary font-bold text-lg mb-2">Descanso Merecido 💤</p>
                <p className="text-secondary text-sm">Seus músculos ainda estão se recuperando. Um dia de descanso evitará lesões.</p>
              </div>
            ) : (
              <div>
                <span className="inline-block px-3 py-1 bg-brand-soft text-brand text-xs font-bold uppercase tracking-widest rounded-full mb-3">
                  Match Perfeito
                </span>
                <h3 className="text-2xl font-black mb-2">{suggestedRoutine?.name}</h3>
                
                {suggestedMusclesReady.length > 0 && (
                  <p className="text-sm text-secondary mb-6">
                    Músculos <strong className="text-success font-bold">100% recuperados</strong>: {suggestedMusclesReady.join(', ')}.
                  </p>
                )}

                <button className="w-full h-14 bg-brand text-black font-bold rounded-full flex items-center justify-center gap-2 hover:bg-[#E6CF00] transition-colors">
                  Iniciar treino <ArrowRight size={20} />
                </button>
              </div>
            )}
          </div>
        </section>
      </>
    );

  } catch (err) {
    console.error(err);
    return (
      <div className="bg-danger/10 border border-danger p-6 rounded-3xl flex flex-col items-center justify-center text-center mt-20">
        <AlertCircle size={40} className="text-danger mb-4" />
        <h3 className="text-lg font-bold text-primary mb-2">Ops, algo deu errado.</h3>
        <p className="text-sm text-secondary">Não foi possível carregar o painel. Recarregue a página.</p>
      </div>
    );
  }
}

function HomeSkeleton() {
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="w-24 h-4 bg-surface-2 rounded mb-2 animate-pulse"></div>
          <div className="w-40 h-8 bg-surface-2 rounded animate-pulse"></div>
        </div>
        <div className="w-12 h-12 bg-surface-2 rounded-full animate-pulse"></div>
      </div>
      <div className="h-32 bg-surface-2 rounded-3xl animate-pulse"></div>
      <div>
        <div className="w-32 h-4 bg-surface-2 rounded mb-4 animate-pulse"></div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-surface-2 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      </div>
      <div>
        <div className="w-48 h-4 bg-surface-2 rounded mb-4 animate-pulse"></div>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-12 bg-surface-2 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
      <div className="flex justify-center mt-8">
        <Loader2 size={32} className="text-brand animate-spin" />
      </div>
    </>
  );
}