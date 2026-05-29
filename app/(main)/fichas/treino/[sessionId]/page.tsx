'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import html2canvas from 'html2canvas';
import { 
  ArrowLeft, Timer, Play, Pause, RotateCcw, Check, Plus, Search, X, 
  ChevronRight, Trophy, Star, Activity, Download, Share2, Home 
} from 'lucide-react';

const SET_TYPES = {
  normal: { label: 'Normal', letter: 'N', styles: 'text-zinc-400 border-zinc-700 bg-zinc-900' },
  warmup: { label: 'Aquecimento', letter: 'W', styles: 'text-zinc-500 border-zinc-800 bg-zinc-900/50' },
  top: { label: 'Top Set', letter: 'T', styles: 'text-[#FFE600] border-[#FFE600]/30 bg-[#FFE600]/10' },
  failure: { label: 'Falha', letter: 'F', styles: 'text-red-500 border-red-500/30 bg-red-500/10' },
  drop: { label: 'Drop Set', letter: 'D', styles: 'text-orange-500 border-orange-500/30 bg-orange-500/10' },
  rest_pause: { label: 'Rest Pause', letter: 'R', styles: 'text-purple-400 border-purple-400/30 bg-purple-400/10' },
  backoff: { label: 'Backoff Set', letter: 'B', styles: 'text-blue-400 border-blue-400/30 bg-blue-400/10' },
};

export default function TreinoAtivoPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  const supabase = createClient();

  // Dados Globais
  const [user, setUser] = useState<any>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [currentVolume, setCurrentVolume] = useState(0);
  const [historicalMaxes, setHistoricalMaxes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Timer
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [restTime, setRestTime] = useState(60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Drawers / Modals
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSetTypeSelector, setShowSetTypeSelector] = useState<{ exIdx: number, setIdx: number } | null>(null);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);

  // Busca de Exercícios (Modal)
  const [baseExercises, setBaseExercises] = useState<any[]>([]);
  const [searchEx, setSearchEx] = useState('');

  // Form de Finalização
  const [workoutRating, setWorkoutRating] = useState(10);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [prsBroken, setPrsBroken] = useState<any[]>([]);
  const [isFinishing, setIsFinishing] = useState(false);
  
  const shareCardRef = useRef<HTMLDivElement>(null);

  // 1. CARREGAR OS DADOS DA SESSÃO
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser || !sessionId) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      const { data: sessionData } = await supabase
        .from('workout_sessions')
        .select('*, workout_routines(name)')
        .eq('id', sessionId)
        .single();

      if (!sessionData) {
        router.push('/fichas');
        return;
      }

      const { data: setsData } = await supabase
        .from('workout_sets')
        .select('*, base_exercises(muscle_group)')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      // Agrupar sets por exercício e calcular volume inicial
      let volume = 0;
      const grouped: Record<string, any> = {};
      
      setsData?.forEach((set: any) => {
        const baseEx = Array.isArray(set.base_exercises) ? set.base_exercises[0] : set.base_exercises;
        if (!grouped[set.exercise_id]) {
          grouped[set.exercise_id] = {
            exercise_id: set.exercise_id,
            exercise_name: set.exercise_name,
            muscle_group: baseEx?.muscle_group || 'Geral',
            sets: [],
            lastWorkoutData: null
          };
        }
        grouped[set.exercise_id].sets.push(set);
        if (set.completed && set.set_type !== 'warmup') {
          volume += (Number(set.weight_kg) || 0) * (Number(set.reps) || 0);
        }
      });

      // Buscar dados históricos em bloco (N+1 evitado)
      const exerciseIds = Object.keys(grouped);
      const histMax: Record<string, number> = {};

      if (exerciseIds.length > 0) {
        const { data: previousSets } = await supabase
          .from('workout_sets')
          .select('exercise_id, weight_kg, reps, set_type, session_id, workout_sessions!inner(status, finished_at)')
          .in('exercise_id', exerciseIds)
          .eq('completed', true)
          .eq('workout_sessions.status', 'completed')
          .neq('session_id', sessionId)
          .order('workout_sessions(finished_at)', { ascending: false });

        // Identificar sessão mais recente por exercício e maxes históricos
        const latestSession: Record<string, string> = {};
        previousSets?.forEach((s: any) => {
          if (!latestSession[s.exercise_id]) latestSession[s.exercise_id] = s.session_id;
          
          const w = Number(s.weight_kg) || 0;
          if (!histMax[s.exercise_id] || w > histMax[s.exercise_id]) {
            histMax[s.exercise_id] = w;
          }
        });

        exerciseIds.forEach(exId => {
          const latestId = latestSession[exId];
          if (latestId) {
            grouped[exId].lastWorkoutData = (previousSets || [])
              .filter((s: any) => s.session_id === latestId && s.exercise_id === exId && s.set_type !== 'warmup')
              .map((s: any) => ({ weight_kg: s.weight_kg, reps: s.reps, set_type: s.set_type }));
          }
        });
      }

      setExercises(Object.values(grouped));
      setCurrentVolume(volume);
      setSessionInfo(sessionData);
      setHistoricalMaxes(histMax);
      setLoading(false);
    };

    fetchSession();
  }, [sessionId, router, supabase]);

  // 2. LÓGICA DO TIMER
  useEffect(() => {
    if (!timerActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setTimerActive(false);
          if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleTimerAction = (amount: number) => {
    setTimeLeft(amount);
    setRestTime(amount);
    setTimerActive(true);
  };

  // 3. AÇÕES DE SÉRIE
  const updateLocalSet = (exIdx: number, setIdx: number, field: string, value: any) => {
    const newExs = [...exercises];
    newExs[exIdx].sets[setIdx] = { ...newExs[exIdx].sets[setIdx], [field]: value };
    setExercises(newExs);
  };

  const toggleSet = async (exIndex: number, setIndex: number) => {
    const set = exercises[exIndex].sets[setIndex];
    const newCompleted = !set.completed;
    const safeWeight = Number(set.weight_kg) || 0;
    const safeReps = Number(set.reps) || 0;

    const newExercises = [...exercises];
    newExercises[exIndex].sets[setIndex] = {
      ...set,
      completed: newCompleted,
      weight_kg: safeWeight,
      reps: safeReps
    };
    setExercises(newExercises);

    if (set.set_type !== 'warmup') {
      const delta = safeWeight * safeReps;
      setCurrentVolume(prev => newCompleted ? prev + delta : Math.max(0, prev - delta));
    }

    if (newCompleted) {
      setTimeLeft(restTime);
      setTimerActive(true);
    }

    await supabase.from('workout_sets').update({
      completed: newCompleted,
      weight_kg: safeWeight,
      reps: safeReps,
      completed_at: newCompleted ? new Date().toISOString() : null
    }).eq('id', set.id);
  };

  const changeSetType = async (typeKey: string) => {
    if (!showSetTypeSelector) return;
    const { exIdx, setIdx } = showSetTypeSelector;
    const setId = exercises[exIdx].sets[setIdx].id;
    
    updateLocalSet(exIdx, setIdx, 'set_type', typeKey);
    setShowSetTypeSelector(null);
    
    await supabase.from('workout_sets').update({ set_type: typeKey }).eq('id', setId);
  };

  const addSet = async (exIdx: number) => {
    const exercise = exercises[exIdx];
    const lastSet = exercise.sets[exercise.sets.length - 1];
    
    const { data: newSet } = await supabase.from('workout_sets').insert({
      session_id: sessionId,
      exercise_id: exercise.exercise_id,
      exercise_name: exercise.exercise_name,
      set_number: (lastSet?.set_number || 0) + 1,
      weight_kg: lastSet?.weight_kg || 0,
      reps: lastSet?.reps || 0,
      set_type: lastSet?.set_type || 'normal',
      completed: false
    }).select().single();

    if (newSet) {
      const newExs = [...exercises];
      newExs[exIdx].sets.push(newSet);
      setExercises(newExs);
    }
  };

  // 4. ADICIONAR EXERCÍCIO EXTRA
  const openAddExercise = async () => {
    if (baseExercises.length === 0) {
      const { data } = await supabase.from('base_exercises').select('*').order('name');
      if (data) setBaseExercises(data);
    }
    setShowAddExercise(true);
  };

  const handleAddExtraExercise = async (ex: any) => {
    const { data: newSet } = await supabase.from('workout_sets').insert({
      session_id: sessionId,
      exercise_id: ex.id,
      exercise_name: ex.name,
      set_number: 1,
      weight_kg: 0,
      reps: 0,
      set_type: 'normal',
      completed: false
    }).select('*, base_exercises(muscle_group)').single();

    if (newSet) {
      const baseEx = Array.isArray(newSet.base_exercises) ? newSet.base_exercises[0] : newSet.base_exercises;
      setExercises(prev => [...prev, {
        exercise_id: ex.id,
        exercise_name: ex.name,
        muscle_group: baseEx?.muscle_group || 'Geral',
        sets: [newSet],
        lastWorkoutData: null
      }]);
    }
    setShowAddExercise(false);
  };

  // 5. FINALIZAÇÃO DO TREINO
  // 5. FINALIZAÇÃO DO TREINO
  const handleOpenFinish = () => {
    // CORREÇÃO AQUI: Tipagem explícita do array para evitar o erro implicitly any[]
    const broken: { name: string; weight: number }[] = [];
    
    exercises.forEach(ex => {
      const maxSessionWeight = Math.max(0, ...ex.sets.filter((s:any) => s.completed && s.set_type !== 'warmup').map((s:any) => Number(s.weight_kg) || 0));
      const histMax = historicalMaxes[ex.exercise_id] || 0;
      if (maxSessionWeight > 0 && maxSessionWeight > histMax) {
        broken.push({ name: ex.exercise_name, weight: maxSessionWeight });
      }
    });
    setPrsBroken(broken);
    setShowFinishModal(true);
  };

  const finishWorkout = async (shouldShare: boolean) => {
    setIsFinishing(true);

    await supabase.from('workout_sessions').update({
      status: 'completed',
      finished_at: new Date().toISOString(),
      total_volume_kg: currentVolume,
      rating: workoutRating,
      notes: workoutNotes
    }).eq('id', sessionId);

    const { data: profile } = await supabase
      .from('profiles')
      .select('current_streak, best_streak, last_workout_date')
      .eq('id', user.id)
      .single();

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let newStreak = 1;

    if (profile?.last_workout_date === today) {
      newStreak = profile.current_streak || 1;
    } else if (profile?.last_workout_date === yesterday) {
      newStreak = (profile.current_streak || 0) + 1;
    }

    await supabase.from('profiles').update({
      current_streak: newStreak,
      best_streak: Math.max(newStreak, profile?.best_streak || 0),
      last_workout_date: today
    }).eq('id', user.id);

    setIsFinishing(false);
    setShowFinishModal(false);

    if (shouldShare) {
      setShowShareCard(true);
    } else {
      router.push('/home');
      router.refresh();
    }
  };

  const generateAndShareImage = async () => {
    if (!shareCardRef.current) return;
    try {
      const canvas = await html2canvas(shareCardRef.current, { backgroundColor: '#000000', scale: 2 });
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) return;

      const file = new File([blob], 'aresfit-treino.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Meu treino no AresFit',
          files: [file]
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'aresfit-treino.png';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Erro ao compartilhar:', err);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Activity className="animate-spin text-[#FFE600]" /></div>;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative pb-32">
      
      {/* HEADER FIXO */}
      <header className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-[#222225] px-4 py-3 flex items-center justify-between">
        <button onClick={() => setShowExitConfirm(true)} className="p-2 -ml-2 text-[#A1A1AA] hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-sm font-black uppercase tracking-widest truncate max-w-[150px] text-center">
          {sessionInfo?.workout_routines?.name || 'Treino Livre'}
        </h1>
        <button onClick={handleOpenFinish} className="bg-[#FFE600] text-black text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-[100px] hover:bg-[#FFE600]/80">
          Finalizar
        </button>
      </header>

      {/* BARRA DO TIMER FIXA */}
      <div className="sticky top-[53px] z-30 bg-[#000000] px-4 py-3 border-b border-[#222225] shadow-lg">
        <div className="bg-[#0F0F0F] border border-[#222225] rounded-2xl p-3 flex justify-between items-center relative overflow-hidden">
          {/* Barra de progresso do timer */}
          {timerActive && (
            <div 
              className="absolute top-0 left-0 h-1 bg-[#FFE600] transition-all ease-linear" 
              style={{ width: `${(timeLeft / restTime) * 100}%` }}
            />
          )}
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Timer size={18} className={timerActive ? 'text-[#FFE600] animate-pulse' : 'text-[#555558]'} />
              <span className={`text-2xl font-black font-mono tracking-tight ${timerActive ? 'text-[#FFE600]' : 'text-[#FFFFFF]'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="flex gap-1.5">
              {[30, 60, 90, 120].map(t => (
                <button key={t} onClick={() => handleTimerAction(t)} className="bg-[#1A1A1A] text-[#A1A1AA] text-[10px] font-bold px-2 py-1 rounded-md border border-[#222225] hover:text-white">
                  {t >= 60 ? `${t/60}m` : `${t}s`}
                </button>
              ))}
              <div className="w-px h-full bg-[#222225] mx-1" />
              <button onClick={() => setTimerActive(!timerActive)} className="text-[#A1A1AA] hover:text-white px-1">
                {timerActive ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
              </button>
              <button onClick={() => { setTimerActive(false); setTimeLeft(0); }} className="text-[#A1A1AA] hover:text-white px-1">
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[#555558] text-[9px] font-bold uppercase tracking-widest mb-1">Volume Real</p>
            <p className="text-white text-xl font-black">{currentVolume} <span className="text-[#A1A1AA] text-sm">kg</span></p>
          </div>
        </div>
      </div>

      {/* LISTA DE EXERCÍCIOS */}
      <main className="p-4 flex flex-col gap-6 max-w-sm mx-auto w-full">
        {exercises.length === 0 ? (
          <div className="text-center text-[#555558] py-10 text-sm">Adicione exercícios para começar.</div>
        ) : (
          exercises.map((exGroup, exIdx) => (
            <div key={exGroup.exercise_id} className="flex flex-col gap-3">
              
              <div className="flex items-center gap-2">
                <span className="text-[#FFE600] text-[9px] uppercase tracking-widest font-black border border-[#FFE600]/30 bg-[#FFE600]/10 px-2 py-0.5 rounded-full">
                  {exGroup.muscle_group}
                </span>
                <div className="h-px bg-[#222225] flex-1" />
              </div>

              <div className="bg-[#0F0F0F] border border-[#222225] rounded-3xl p-4 flex flex-col gap-4">
                <div>
                  <h3 className="text-[#FFFFFF] font-bold text-sm uppercase tracking-wide">{exGroup.exercise_name}</h3>
                  {exGroup.lastWorkoutData && exGroup.lastWorkoutData.length > 0 && (
                    <p className="text-[#555558] text-[10px] font-bold mt-1 uppercase">
                      ↑ Treino anterior: {exGroup.lastWorkoutData.map((s:any)=>`${s.weight_kg}x${s.reps}`).join(', ')}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex text-[#555558] text-[9px] uppercase tracking-widest font-bold px-2">
                    <span className="w-10 text-center">Tipo</span>
                    <span className="flex-1 text-center">Peso</span>
                    <span className="flex-1 text-center">Reps</span>
                    <span className="w-12 text-center"></span>
                  </div>

                  {exGroup.sets.map((set: any, setIdx: number) => {
                    const typeConfig = SET_TYPES[set.set_type as keyof typeof SET_TYPES] || SET_TYPES.normal;
                    const prevSet = exGroup.lastWorkoutData?.[setIdx];

                    return (
                      <div key={set.id} className={`flex items-center gap-2 rounded-xl p-1 transition-colors ${set.completed ? 'bg-[#1A1A1A]/50' : ''}`}>
                        {/* TIPO */}
                        <button 
                          onClick={() => setShowSetTypeSelector({ exIdx, setIdx })}
                          className={`w-10 h-10 rounded-full border flex items-center justify-center font-black text-xs transition-colors ${typeConfig.styles}`}
                        >
                          {typeConfig.letter}
                        </button>
                        
                        {/* PESO */}
                        <div className="flex-1 relative">
                          <input 
                            type="number" inputMode="decimal"
                            value={set.weight_kg || ''}
                            onChange={(e) => updateLocalSet(exIdx, setIdx, 'weight_kg', e.target.value)}
                            placeholder={prevSet ? String(prevSet.weight_kg) : '0'}
                            className={`w-full h-12 bg-[#1A1A1A] border rounded-xl text-center text-lg font-black outline-none transition-colors ${set.completed ? 'border-transparent text-[#A1A1AA]' : 'border-[#222225] focus:border-[#FFE600] text-white'}`}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555558] text-[10px] font-bold pointer-events-none">kg</span>
                        </div>

                        {/* REPS */}
                        <div className="flex-1 relative">
                          <input 
                            type="number" inputMode="numeric"
                            value={set.reps || ''}
                            onChange={(e) => updateLocalSet(exIdx, setIdx, 'reps', e.target.value)}
                            placeholder={prevSet ? String(prevSet.reps) : '0'}
                            className={`w-full h-12 bg-[#1A1A1A] border rounded-xl text-center text-lg font-black outline-none transition-colors ${set.completed ? 'border-transparent text-[#A1A1AA]' : 'border-[#222225] focus:border-[#FFE600] text-white'}`}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555558] text-[10px] font-bold pointer-events-none">reps</span>
                        </div>

                        {/* CHECK */}
                        <button 
                          onClick={() => toggleSet(exIdx, setIdx)}
                          className={`w-12 h-12 flex items-center justify-center rounded-xl border transition-all active:scale-90 ${set.completed ? 'bg-[#FFE600] border-[#FFE600] text-black shadow-[0_0_15px_rgba(255,230,0,0.3)]' : 'bg-[#1A1A1A] border-[#222225] text-[#555558]'}`}
                        >
                          <Check size={20} strokeWidth={set.completed ? 3 : 2} />
                        </button>
                      </div>
                    )
                  })}
                </div>

                <button 
                  onClick={() => addSet(exIdx)}
                  className="w-full mt-2 py-3 border border-dashed border-[#222225] rounded-xl text-[#A1A1AA] text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:border-[#FFE600] hover:text-[#FFE600] transition-colors"
                >
                  <Plus size={14} /> Adicionar Série
                </button>
              </div>
            </div>
          ))
        )}

        <button 
          onClick={openAddExercise}
          className="w-full mt-4 py-4 bg-[#1A1A1A] border border-[#222225] rounded-2xl text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:border-[#FFE600] hover:text-[#FFE600] transition-colors"
        >
          <Plus size={16} /> Adicionar Exercício Extra
        </button>
      </main>

      {/* ======================= MODAIS ======================= */}

      {/* MODAL: SELETOR DE TIPO DE SÉRIE */}
      {showSetTypeSelector && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col justify-end">
          <div className="bg-[#0F0F0F] border-t border-[#222225] rounded-t-3xl p-6 pb-10 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black uppercase tracking-widest text-white">Tipo de Série</h3>
              <button onClick={() => setShowSetTypeSelector(null)} className="text-[#A1A1AA]"><X size={20}/></button>
            </div>
            <div className="flex flex-col gap-3">
              {Object.entries(SET_TYPES).map(([key, config]) => (
                <button 
                  key={key} 
                  onClick={() => changeSetType(key)}
                  className="w-full bg-[#1A1A1A] border border-[#222225] p-4 rounded-2xl flex items-center gap-4 hover:bg-[#222225] transition-colors"
                >
                  <span className={`w-10 h-10 rounded-full border flex items-center justify-center font-black text-sm ${config.styles}`}>
                    {config.letter}
                  </span>
                  <span className="text-white font-bold text-sm uppercase tracking-wider">{config.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR SAÍDA */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#0F0F0F] border border-[#222225] rounded-3xl p-6 w-full max-w-sm flex flex-col gap-6 animate-slide-up">
            <div className="text-center">
              <h3 className="text-xl font-black uppercase tracking-widest text-white mb-2">Pausar Treino?</h3>
              <p className="text-[#A1A1AA] text-sm">O treino continuará em andamento na tela de Fichas. Você poderá retomá-lo depois.</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={() => router.push('/fichas')} className="w-full h-14 bg-[#FFE600] text-black font-black uppercase tracking-widest rounded-[100px]">
                Sair
              </button>
              <button onClick={() => setShowExitConfirm(false)} className="w-full h-14 bg-transparent border border-[#555558] text-white font-black uppercase tracking-widest rounded-[100px]">
                Continuar Treinando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR EXERCÍCIO EXTRA */}
      {showAddExercise && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col animate-slide-up">
          <div className="px-4 py-4 border-b border-[#222225] flex items-center gap-4 bg-[#000000]">
             <button onClick={() => setShowAddExercise(false)} className="text-[#A1A1AA] p-2"><ArrowLeft size={24} /></button>
             <h2 className="text-white font-black uppercase tracking-widest">Adicionar Extra</h2>
          </div>
          <div className="px-4 py-4">
             <div className="relative mb-4">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555558]" size={18} />
               <input 
                 type="text" placeholder="Buscar..." 
                 value={searchEx} onChange={e => setSearchEx(e.target.value)}
                 className="w-full h-14 bg-[#1A1A1A] border border-[#222225] rounded-2xl pl-12 pr-4 text-white font-medium outline-none focus:border-[#FFE600]"
               />
             </div>
             <div className="flex flex-col gap-2 h-[75vh] overflow-y-auto hide-scroll pb-10">
               {baseExercises.filter(ex => ex.name.toLowerCase().includes(searchEx.toLowerCase())).map(ex => (
                 <button 
                   key={ex.id} onClick={() => handleAddExtraExercise(ex)}
                   className="bg-[#0F0F0F] border border-[#222225] rounded-2xl p-4 text-left flex justify-between items-center"
                 >
                   <span className="text-white font-bold text-sm">{ex.name}</span>
                   <span className="text-[#A1A1AA] text-[10px] uppercase">{ex.muscle_group}</span>
                 </button>
               ))}
             </div>
          </div>
       </div>
      )}

      {/* MODAL: FINALIZAR TREINO */}
      {showFinishModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col p-6 overflow-y-auto animate-slide-up">
          <div className="flex justify-between items-center mb-8 pt-4">
            <h2 className="text-2xl font-black uppercase text-white tracking-widest">Treino Concluído</h2>
            <button onClick={() => setShowFinishModal(false)} className="text-[#A1A1AA]"><X size={24}/></button>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-[#0F0F0F] border border-[#222225] rounded-3xl p-6 text-center flex flex-col items-center">
              <span className="text-[#A1A1AA] text-xs font-bold uppercase tracking-widest mb-2 block">Nota do Treino</span>
              <span className="text-[#FFE600] text-6xl font-black font-mono tracking-tighter block mb-4">{workoutRating}</span>
              <input type="range" min="1" max="10" value={workoutRating} onChange={e => setWorkoutRating(Number(e.target.value))} className="w-full accent-[#FFE600]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0F0F0F] border border-[#222225] rounded-2xl p-4">
                <span className="text-[#555558] text-[10px] font-bold uppercase tracking-widest block mb-1">Volume</span>
                <span className="text-white text-xl font-black">{currentVolume} <span className="text-sm text-[#A1A1AA]">kg</span></span>
              </div>
              <div className="bg-[#0F0F0F] border border-[#222225] rounded-2xl p-4">
                <span className="text-[#555558] text-[10px] font-bold uppercase tracking-widest block mb-1">Duração</span>
                <span className="text-white text-xl font-black">
                  {Math.round((Date.now() - new Date(sessionInfo?.created_at).getTime()) / 60000)} <span className="text-sm text-[#A1A1AA]">min</span>
                </span>
              </div>
            </div>

            {prsBroken.length > 0 && (
              <div className="bg-[#FFE600]/10 border border-[#FFE600]/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy size={16} className="text-[#FFE600]" />
                  <span className="text-[#FFE600] text-xs font-black uppercase tracking-widest">Recordes Pessoais</span>
                </div>
                <div className="flex flex-col gap-2">
                  {prsBroken.map((pr, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-white font-medium">{pr.name}</span>
                      <span className="text-[#FFE600] font-black">{pr.weight} kg</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="text-[#A1A1AA] text-[10px] font-bold uppercase tracking-widest block mb-2 px-1">Anotações</span>
              <textarea 
                rows={3} placeholder="Como foi o treino?" value={workoutNotes} onChange={e => setWorkoutNotes(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#222225] rounded-2xl p-4 text-white text-sm outline-none focus:border-[#FFE600]"
              />
            </div>

            <div className="flex flex-col gap-3 mt-4 pb-10">
              <button onClick={() => finishWorkout(true)} disabled={isFinishing} className="w-full h-14 bg-[#FFE600] text-black font-black uppercase tracking-widest rounded-[100px] flex items-center justify-center gap-2 disabled:opacity-50">
                {isFinishing ? <Activity className="animate-spin" size={20} /> : <Share2 size={20} />} Salvar e Compartilhar
              </button>
              <button onClick={() => finishWorkout(false)} disabled={isFinishing} className="w-full h-14 bg-transparent border border-[#555558] text-white font-black uppercase tracking-widest rounded-[100px] disabled:opacity-50">
                Apenas Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SHARE CARD (FULLSCREEN) */}
      {showShareCard && (
        <div className="fixed inset-0 bg-[#000000] z-[60] flex flex-col overflow-y-auto">
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            
            {/* O CARD QUE SERÁ SALVO NA IMAGEM */}
            <div ref={shareCardRef} className="bg-[#0F0F0F] border-2 border-[#FFE600] rounded-[2rem] p-8 w-full max-w-[340px] flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFE600] rounded-full mix-blend-screen filter blur-[70px] opacity-20" />
              
              <div className="text-center mb-8 relative z-10">
                <h1 className="text-3xl font-black tracking-tighter mb-1 text-white">Ares<span className="text-[#FFE600]">Fit</span></h1>
                <p className="text-[#A1A1AA] text-[9px] uppercase tracking-[0.3em] font-bold">Treino Concluído</p>
              </div>

              <div className="mb-6 text-center relative z-10">
                <p className="text-[#FFE600] text-lg font-black uppercase tracking-widest">{sessionInfo?.workout_routines?.name || 'Treino Livre'}</p>
                <p className="text-white font-medium text-sm mt-1">{new Date().toLocaleDateString('pt-BR')}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                <div className="bg-[#1A1A1A] rounded-2xl p-4 text-center border border-[#222225]">
                  <p className="text-[#555558] text-[9px] font-black uppercase tracking-widest mb-1">Volume</p>
                  <p className="text-white text-xl font-black">{currentVolume}<span className="text-[10px] text-[#A1A1AA] ml-1">kg</span></p>
                </div>
                <div className="bg-[#1A1A1A] rounded-2xl p-4 text-center border border-[#222225]">
                  <p className="text-[#555558] text-[9px] font-black uppercase tracking-widest mb-1">Nota</p>
                  <div className="flex items-center justify-center gap-1 text-xl font-black text-white">
                    <Star size={16} fill="#FFE600" className="text-[#FFE600] -mt-1" /> {workoutRating}
                  </div>
                </div>
                <div className="bg-[#1A1A1A] rounded-2xl p-4 text-center border border-[#222225] col-span-2">
                  <p className="text-[#555558] text-[9px] font-black uppercase tracking-widest mb-1">Duração</p>
                  <p className="text-white text-xl font-black">{Math.round((Date.now() - new Date(sessionInfo?.created_at).getTime()) / 60000)}<span className="text-[10px] text-[#A1A1AA] ml-1">minutos</span></p>
                </div>
              </div>

              {prsBroken.length > 0 && (
                <div className="bg-[#FFE600] rounded-2xl p-4 text-center relative z-10">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Trophy size={14} className="text-black" />
                    <p className="text-black text-[10px] font-black uppercase tracking-widest">Novos Recordes</p>
                  </div>
                  <p className="text-black font-bold text-sm">+{prsBroken.length} PRs batidos hoje!</p>
                </div>
              )}
            </div>
            {/* FIM DO CARD */}

            <div className="w-full max-w-[340px] flex flex-col gap-3 mt-8">
              <button onClick={generateAndShareImage} className="w-full h-14 bg-[#FFE600] text-black font-black uppercase tracking-widest rounded-[100px] flex items-center justify-center gap-2">
                <Download size={20} /> Baixar Imagem
              </button>
              <button onClick={() => router.push('/home')} className="w-full h-14 bg-transparent border border-[#555558] text-white font-black uppercase tracking-widest rounded-[100px] flex items-center justify-center gap-2">
                <Home size={20} /> Ir para Home
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}