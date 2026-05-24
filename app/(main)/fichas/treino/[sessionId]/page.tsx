'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { X, Play, Pause, Check, Plus, Share2, Home } from 'lucide-react';
import html2canvas from 'html2canvas';

const SET_TYPES = {
  normal: { label: 'N', style: 'text-zinc-400 bg-surface-2 border-transparent' },
  warmup: { label: 'W', style: 'text-zinc-600 bg-surface-2 border-transparent' },
  top: { label: 'T', style: 'text-brand bg-brand/10 border-brand/30 border' },
  failure: { label: 'F', style: 'text-red-500 bg-red-500/10 border-red-500/30 border' },
  drop: { label: 'D', style: 'text-orange-500 bg-orange-500/10 border-orange-500/30 border' },
  rest_pause: { label: 'R', style: 'text-purple-400 bg-purple-400/10 border-purple-400/30 border' },
  backoff: { label: 'B', style: 'text-blue-400 bg-blue-400/10 border-blue-400/30 border' },
};

export default function ActiveWorkoutPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const shareRef = useRef<HTMLDivElement>(null);

  // Core State
  const [session, setSession] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [previousStats, setPreviousStats] = useState<Record<string, string>>({});
  const [globalElapsed, setGlobalElapsed] = useState(0);

  // Modals
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [summary, setSummary] = useState({ volume: 0, prs: 0 });

  // Rest Timer State
  const [timerActive, setTimerActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerMax, setTimerMax] = useState(60);
  const [currentVolume, setCurrentVolume] = useState(0);

  // 1. CARREGAMENTO INICIAL
  useEffect(() => {
    loadWorkoutData();
  }, []);

  const loadWorkoutData = async () => {
    const { data: sess } = await supabase
      .from('workout_sessions')
      .select('*, workout_routines(name)')
      .eq('id', params.sessionId)
      .single();

    if (!sess) return;
    setSession(sess);

    // Calc global timer
    const started = new Date(sess.started_at).getTime();
    setGlobalElapsed(Math.floor((Date.now() - started) / 1000));

    // Load template exercises
    const { data: routinesEx } = await supabase
      .from('routine_exercises')
      .select('*, base_exercises(muscle_group)')
      .eq('routine_id', sess.routine_id)
      .order('order_index');

    // Load sets already saved for this session (Resume capability)
    const { data: currentSets } = await supabase
      .from('workout_sets')
      .select('*')
      .eq('session_id', sess.id)
      .order('set_number');

    // Mount structure
    const exIds: string[] = [];
    const structure = routinesEx?.map((re: any) => {
      exIds.push(re.exercise_id);
      const exSets = currentSets?.filter((s: any) => s.exercise_id === re.exercise_id) || [];
      
      // Pad sets if missing
      const sets = Array.from({ length: Math.max(re.target_sets, exSets.length || 1) }).map((_, i) => {
        if (exSets[i]) return exSets[i];
        return {
          id: `temp-${Date.now()}-${i}`,
          session_id: sess.id,
          exercise_id: re.exercise_id,
          exercise_name: re.exercise_name,
          set_number: i + 1,
          set_type: 'normal',
          weight_kg: '',
          reps: re.target_reps,
          completed: false,
        };
      });

      return {
        ...re,
        muscle_group: re.base_exercises?.muscle_group,
        sets,
      };
    }) || [];

    setExercises(structure);
    calculateCurrentVolume(structure);

    // Optimized Query for Previous Data
    if (exIds.length > 0) {
      const { data: prevSets } = await supabase
        .from('workout_sets')
        .select(`
          exercise_id, weight_kg, reps, set_type, session_id,
          workout_sessions!inner(status, finished_at)
        `)
        .in('exercise_id', exIds)
        .eq('completed', true)
        .eq('workout_sessions.status', 'completed')
        .neq('session_id', params.sessionId);

      // Group by exercise, getting the most recent top set
      const stats: Record<string, string> = {};
      if (prevSets) {
        prevSets.sort((a: any, b: any) => {
          // TS Fix: Supabase might return array for joins, or object
          const dateB = Array.isArray(b.workout_sessions) ? b.workout_sessions[0]?.finished_at : b.workout_sessions?.finished_at;
          const dateA = Array.isArray(a.workout_sessions) ? a.workout_sessions[0]?.finished_at : a.workout_sessions?.finished_at;
          return new Date(dateB || 0).getTime() - new Date(dateA || 0).getTime();
        });

        exIds.forEach(id => {
          const exSet = prevSets.find((s: any) => s.exercise_id === id);
          if (exSet) stats[id] = `Último: ${exSet.weight_kg}kg × ${exSet.reps}`;
        });
      }
      setPreviousStats(stats);
    }
  };

  // 2. TIMERS
  useEffect(() => {
    const interval = setInterval(() => {
      setGlobalElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setTimerActive(false);
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeRemaining]);

  const startRestTimer = (seconds: number) => {
    setTimerMax(seconds);
    setTimeRemaining(seconds);
    setTimerActive(true);
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 3. SET INTERACTIONS (AUTO-SAVE)
  const updateSet = (exIndex: number, setIndex: number, field: string, value: any) => {
    const newEx = [...exercises];
    newEx[exIndex].sets[setIndex][field] = value;
    setExercises(newEx);
  };

  const toggleSetComplete = async (exIndex: number, setIndex: number) => {
    const newEx = [...exercises];
    const targetSet = newEx[exIndex].sets[setIndex];
    targetSet.completed = !targetSet.completed;
    targetSet.completed_at = targetSet.completed ? new Date().toISOString() : null;
    setExercises(newEx);

    calculateCurrentVolume(newEx);

    if (targetSet.completed) {
      startRestTimer(newEx[exIndex].target_rest_seconds || 60);
    }

    if (targetSet.id.toString().startsWith('temp-')) {
      const { data } = await supabase.from('workout_sets').insert({
        session_id: targetSet.session_id,
        exercise_id: targetSet.exercise_id,
        exercise_name: targetSet.exercise_name,
        set_number: targetSet.set_number,
        set_type: targetSet.set_type,
        weight_kg: Number(targetSet.weight_kg) || 0,
        reps: Number(targetSet.reps) || 0,
        completed: targetSet.completed,
        completed_at: targetSet.completed_at,
      }).select('id').single();
      
      if (data) newEx[exIndex].sets[setIndex].id = data.id;
    } else {
      await supabase.from('workout_sets').update({
        weight_kg: Number(targetSet.weight_kg) || 0,
        reps: Number(targetSet.reps) || 0,
        set_type: targetSet.set_type,
        completed: targetSet.completed,
        completed_at: targetSet.completed_at,
      }).eq('id', targetSet.id);
    }
  };

  const addSet = (exIndex: number) => {
    const newEx = [...exercises];
    const sets = newEx[exIndex].sets;
    const lastSet = sets[sets.length - 1];
    
    sets.push({
      id: `temp-${Date.now()}`,
      session_id: session.id,
      exercise_id: newEx[exIndex].exercise_id,
      exercise_name: newEx[exIndex].exercise_name,
      set_number: sets.length + 1,
      set_type: 'normal',
      weight_kg: lastSet ? lastSet.weight_kg : '',
      reps: lastSet ? lastSet.reps : newEx[exIndex].target_reps,
      completed: false,
    });
    setExercises(newEx);
  };

  const calculateCurrentVolume = (exs: any[]) => {
    let vol = 0;
    exs.forEach(e => {
      e.sets.forEach((s: any) => {
        if (s.completed) vol += (Number(s.weight_kg) || 0) * (Number(s.reps) || 0);
      });
    });
    setCurrentVolume(vol);
  };

  // 4. FINISH & SHARE
  const handleLongPressExit = () => {
    if (confirm('Deseja sair sem salvar? O progresso será descartado.')) {
      router.back();
    }
  };

  const finishWorkout = async () => {
    await supabase.from('workout_sessions').update({
      status: 'completed',
      finished_at: new Date().toISOString(),
      total_volume_kg: currentVolume,
      rating,
      notes,
    }).eq('id', session.id);

    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('last_workout_date, current_streak, best_streak').eq('id', user?.id).single();
    
    if (profile) {
      const today = new Date().toISOString().split('T')[0];
      const lastDate = profile.last_workout_date;
      
      let newStreak = profile.current_streak;
      if (!lastDate) newStreak = 1;
      else {
        const diff = Math.floor((new Date(today).getTime() - new Date(lastDate).getTime()) / (1000 * 3600 * 24));
        if (diff === 1) newStreak += 1;
        else if (diff > 1) newStreak = 1;
      }

      await supabase.from('profiles').update({
        last_workout_date: today,
        current_streak: newStreak,
        best_streak: Math.max(profile.best_streak, newStreak)
      }).eq('id', user?.id);
    }

    setSummary({ volume: currentVolume, prs: Math.floor(Math.random() * 3) });
    setIsFinishModalOpen(false);
    setIsShareModalOpen(true);
  };

  const shareCard = async () => {
    if (shareRef.current) {
      const canvas = await html2canvas(shareRef.current, { backgroundColor: '#000000' });
      // TS Fix: Explicit Blob type
      canvas.toBlob(async (blob: Blob | null) => {
        if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], 'treino.png', { type: 'image/png' })] })) {
          await navigator.share({
            title: 'Meu treino no AresFit',
            files: [new File([blob], 'treino.png', { type: 'image/png' })],
          });
        }
      });
    }
  };

  if (!session) return <div className="min-h-screen bg-black" />;

  const groupedExercises = exercises.reduce((acc, ex) => {
    const group = ex.muscle_group || 'Outros';
    if (!acc[group]) acc[group] = [];
    acc[group].push(ex);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="min-h-screen bg-background text-primary pb-32">
      
      {/* HEADER FIXO */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <button onDoubleClick={handleLongPressExit} className="p-2 text-secondary hover:text-white">
          <X size={24} />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-black uppercase tracking-widest truncate max-w-[200px]">{session.workout_routines?.name || 'Treino Livre'}</h1>
          <p className="text-brand font-mono text-xs">{formatTime(globalElapsed)}</p>
        </div>
        <button onClick={() => setIsFinishModalOpen(true)} className="px-4 py-1.5 bg-brand text-black font-bold text-xs rounded-full uppercase tracking-widest">
          Finalizar
        </button>
      </header>

      {/* BARRA DE TIMER FIXA */}
      <div className="sticky top-[60px] z-30 bg-surface border-b border-border p-3 shadow-lg">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-4">
            <span className="text-3xl font-black font-mono text-brand w-20">{formatTime(timeRemaining)}</span>
            <div className="flex gap-2">
              <button onClick={() => setTimeRemaining(p => Math.max(0, p - 15))} className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-xs font-bold text-secondary">-15</button>
              <button onClick={() => setTimerActive(!timerActive)} className="w-8 h-8 rounded-full bg-brand text-black flex items-center justify-center">
                {timerActive ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
              </button>
              <button onClick={() => setTimeRemaining(p => p + 15)} className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-xs font-bold text-secondary">+15</button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-secondary uppercase tracking-widest">Volume Acumulado</p>
            <p className="font-bold">{currentVolume} kg</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-1 bg-surface-2 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-brand transition-all duration-1000 ease-linear" style={{ width: `${(timeRemaining / timerMax) * 100}%` }} />
        </div>

        {/* Quick Chips */}
        <div className="flex gap-2 overflow-x-auto hide-scroll">
          {[30, 60, 90, 120].map(sec => (
            <button key={sec} onClick={() => startRestTimer(sec)} className="px-3 py-1 rounded-full border border-border text-xs text-secondary whitespace-nowrap active:bg-brand/10 active:text-brand">
              {sec >= 60 ? `${sec/60}min` : `${sec}s`}
            </button>
          ))}
        </div>
      </div>

      {/* LISTA DE EXERCÍCIOS */}
      <main className="p-4 flex flex-col gap-8">
        {Object.entries(groupedExercises).map(([muscle, exs]) => (
          <div key={muscle} className="animate-fade-in">
            <h2 className="text-xs font-black text-brand uppercase tracking-widest mb-3">{muscle}</h2>
            
            <div className="flex flex-col gap-4">
              {/* TS Fix: explicitly map over exs as an any array */}
              {(exs as any[]).map((ex: any, _exIndex: number) => {
                const globalExIndex = exercises.findIndex(e => e.id === ex.id);
                return (
                  <div key={ex.id} className="bg-surface border border-border rounded-2xl p-4">
                    <h3 className="font-bold text-lg mb-1 leading-tight">{ex.exercise_name}</h3>
                    {previousStats[ex.exercise_id] && (
                      <p className="text-xs text-secondary mb-4">{previousStats[ex.exercise_id]}</p>
                    )}

                    {/* SETS HEADER */}
                    <div className="grid grid-cols-[40px_1fr_1fr_48px] gap-2 mb-2 px-1 text-[10px] uppercase font-bold text-secondary tracking-widest text-center">
                      <span>Tipo</span>
                      <span>Kg</span>
                      <span>Reps</span>
                      <span></span>
                    </div>

                    {/* SETS ROWS */}
                    <div className="flex flex-col gap-2">
                      {ex.sets.map((set: any, setIndex: number) => {
                        const typeStyle = SET_TYPES[set.set_type as keyof typeof SET_TYPES] || SET_TYPES.normal;
                        
                        return (
                          <div key={set.id} className={`grid grid-cols-[40px_1fr_1fr_48px] gap-2 items-center p-1 rounded-xl transition-colors ${set.completed ? 'bg-brand/5' : ''}`}>
                            <button 
                              onClick={() => {
                                const map: Record<string, string> = { normal: 'top', top: 'failure', failure: 'normal' };
                                updateSet(globalExIndex, setIndex, 'set_type', map[set.set_type] || 'normal');
                              }}
                              className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${typeStyle.style}`}
                            >
                              {typeStyle.label}
                            </button>
                            
                            <input 
                              type="number" 
                              inputMode="decimal"
                              value={set.weight_kg}
                              onChange={(e) => updateSet(globalExIndex, setIndex, 'weight_kg', e.target.value)}
                              disabled={set.completed}
                              className="w-full h-10 bg-surface-2 border border-border rounded-lg text-center font-bold font-mono focus:border-brand outline-none disabled:opacity-50"
                            />
                            
                            <input 
                              type="number" 
                              inputMode="numeric"
                              value={set.reps}
                              onChange={(e) => updateSet(globalExIndex, setIndex, 'reps', e.target.value)}
                              disabled={set.completed}
                              className="w-full h-10 bg-surface-2 border border-border rounded-lg text-center font-bold font-mono focus:border-brand outline-none disabled:opacity-50"
                            />
                            
                            <button 
                              onClick={() => toggleSetComplete(globalExIndex, setIndex)}
                              className={`w-12 h-10 rounded-lg flex items-center justify-center transition-colors ${set.completed ? 'bg-brand text-black shadow-[0_0_12px_rgba(255,230,0,0.4)]' : 'bg-surface-2 border border-border text-secondary'}`}
                            >
                              <Check size={20} />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <button 
                      onClick={() => addSet(globalExIndex)}
                      className="w-full h-10 border border-dashed border-border rounded-lg mt-3 text-secondary text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-surface-2 transition-colors"
                    >
                      <Plus size={16} /> Adicionar Série
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </main>

      {/* MODAL FINALIZAÇÃO */}
      {isFinishModalOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 animate-slide-up flex flex-col p-5">
          <h2 className="text-2xl font-black uppercase tracking-widest mt-10 mb-2 text-center">Treino Concluído!</h2>
          <p className="text-secondary text-center mb-10">Como foi o treino hoje?</p>

          <div className="flex flex-col items-center mb-10">
            <span className="text-7xl font-black text-brand mb-4">{rating}</span>
            <input 
              type="range" min="0" max="10" step="1" 
              value={rating} onChange={(e) => setRating(Number(e.target.value))}
              className="w-full max-w-[250px] accent-brand"
            />
            <div className="w-full max-w-[250px] flex justify-between text-xs text-secondary mt-2 font-bold uppercase">
              <span>Leve</span>
              <span>Brutal</span>
            </div>
          </div>

          <textarea 
            placeholder="Anotações do treino (opcional)..."
            value={notes} onChange={(e) => setNotes(e.target.value)}
            className="w-full h-32 bg-surface-2 border border-border rounded-2xl p-4 text-sm resize-none focus:border-brand outline-none mb-auto"
          />

          <div className="flex flex-col gap-3">
            <button onClick={finishWorkout} className="w-full h-14 bg-brand text-black font-bold rounded-full">
              Salvar Treino
            </button>
            <button onClick={() => setIsFinishModalOpen(false)} className="w-full h-14 bg-transparent border border-border text-secondary font-bold rounded-full">
              Voltar ao Treino
            </button>
          </div>
        </div>
      )}

      {/* MODAL SHARE */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black z-50 animate-fade-in flex flex-col p-5 justify-center">
          
          <div ref={shareRef} className="w-full aspect-[4/5] bg-surface rounded-3xl border-2 border-brand p-6 relative overflow-hidden flex flex-col items-center justify-center text-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand/20 blur-[80px] rounded-full pointer-events-none" />
            
            <h2 className="text-2xl font-black tracking-tighter mb-1 relative z-10">
              Ares<span className="text-brand">Fit</span>
            </h2>
            <p className="text-secondary text-xs uppercase tracking-widest font-bold mb-8 relative z-10">{session.workout_routines?.name || 'Treino Concluído'}</p>

            <div className="grid grid-cols-2 gap-4 w-full relative z-10">
              <div className="bg-surface-2 border border-border rounded-2xl p-4">
                <p className="text-[10px] uppercase text-secondary font-bold tracking-widest mb-1">Volume</p>
                <p className="text-3xl font-black text-white">{summary.volume}<span className="text-sm text-brand ml-1">kg</span></p>
              </div>
              <div className="bg-surface-2 border border-border rounded-2xl p-4">
                <p className="text-[10px] uppercase text-secondary font-bold tracking-widest mb-1">Duração</p>
                <p className="text-3xl font-black text-white">{formatTime(globalElapsed)}</p>
              </div>
              <div className="bg-surface-2 border border-border rounded-2xl p-4 col-span-2 flex items-center justify-between">
                <p className="text-[10px] uppercase text-secondary font-bold tracking-widest">Intensidade</p>
                <p className="text-2xl font-black text-brand">{rating}/10</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-10">
            <button onClick={shareCard} className="w-full h-14 bg-surface-2 border border-border text-primary font-bold rounded-full flex items-center justify-center gap-2">
              <Share2 size={20} /> Compartilhar Card
            </button>
            <button onClick={() => router.push('/home')} className="w-full h-14 bg-brand text-black font-bold rounded-full flex items-center justify-center gap-2">
              <Home size={20} /> Ir para o Início
            </button>
          </div>
        </div>
      )}
    </div>
  );
}