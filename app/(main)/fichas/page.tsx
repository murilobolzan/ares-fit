'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePlan } from '@/lib/hooks/usePlan';
import {
  Plus, Search, Edit3, Trash2, UserCheck, Dumbbell, TrendingUp, User,
  Clock, Star, X, ChevronUp, ChevronDown, Play, Info, Activity, History, ArrowLeft, CheckCircle2
} from 'lucide-react';
import { haptics } from '@/lib/haptics';
import { useToast } from '@/lib/hooks/useToast';

const MUSCLE_GROUPS = [
  "Todos", "Peito", "Costas", "Ombros", "Bíceps", "Tríceps",
  "Quadríceps", "Posterior", "Glúteos", "Core", "Panturrilha"
];

export default function FichasPage() {
  const router = useRouter();
  const supabase = createClient();
  const { isPro } = usePlan();
  const { showToast } = useToast();

  // Global States
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'fichas' | 'biblioteca' | 'historico'>('fichas');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  // Data States
  const [activeSession, setActiveSession] = useState<any>(null);
  const [routines, setRoutines] = useState<any[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [userSets, setUserSets] = useState<any[]>([]);

  // Biblioteca / Picker States
  const [searchEx, setSearchEx] = useState('');
  const [filterGroup, setFilterGroup] = useState('Todos');
  const [multiSelectEx, setMultiSelectEx] = useState<Set<string>>(new Set());

  // Modals Visibility
  const [showRoutineBuilder, setShowRoutineBuilder] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showExerciseDetail, setShowExerciseDetail] = useState(false);
  const [showCreateExercise, setShowCreateExercise] = useState(false);

  // Selection/Draft States
  const [selectedExercise, setSelectedExercise] = useState<any>(null);

  // Routine Builder Draft
  const [draftRoutineId, setDraftRoutineId] = useState<string | null>(null);
  const [draftRoutineName, setDraftRoutineName] = useState('');
  const [draftRoutineExercises, setDraftRoutineExercises] = useState<any[]>([]);

  // Create Exercise Draft
  const [newExName, setNewExName] = useState('');
  const [newExGroup, setNewExGroup] = useState('Peito');

  // Limit Check
  const myRoutinesCount = routines.filter(r => r.owner_id === userId).length;
  const canCreateMore = isPro || myRoutinesCount < 3;

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);
      
      const { data: session } = await supabase
        .from('workout_sessions')
        .select('*, workout_routines(name)')
        .eq('user_id', user.id)
        .eq('status', 'in_progress')
        .maybeSingle();
      setActiveSession(session);

      const { data: sets } = await supabase
        .from('workout_sets')
        .select('*, workout_sessions!inner(user_id)')
        .eq('workout_sessions.user_id', user.id)
        .eq('completed', true);
      setUserSets(sets || []);

      const { data: exData } = await supabase
        .from('base_exercises')
        .select('*')
        .order('muscle_group')
        .order('name');
      setExercises(exData || []);

      setLoading(false);
    };
    init();
  }, [supabase, router]);

  useEffect(() => {
    if (!userId) return;

    const fetchRoutines = async () => {
      const { data } = await supabase
        .from('workout_routines')
        .select('*, routine_exercises(id, exercise_id, exercise_name, order_index, target_sets, target_reps, target_rest_seconds)')
        .or(`owner_id.eq.${userId},assigned_to.eq.${userId}`)
        .order('created_at', { ascending: false });
      setRoutines(data || []);
    };

    const fetchHistory = async () => {
      const { data } = await supabase
        .from('workout_sessions')
        .select('*, workout_routines(name)')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('finished_at', { ascending: false })
        .limit(20);
      setHistory(data || []);
    };

    if (activeTab === 'fichas') fetchRoutines();
    if (activeTab === 'historico') fetchHistory();
  }, [activeTab, userId, supabase]);


  // ===================== ACTIONS =====================

  const handleStartWorkout = async (rotina: any) => {
    if (!userId) return;
    haptics.success();
    setActionLoading(true);

    try {
      const { data: session, error: sessionErr } = await supabase
        .from('workout_sessions')
        .insert({ user_id: userId, routine_id: rotina.id, status: 'in_progress', total_volume_kg: 0 })
        .select().single();

      if (sessionErr || !session) throw new Error('Erro ao criar sessão.');

      const setsToInsert: any[] = [];
      (rotina.routine_exercises || []).forEach((ex: any) => {
        const numSets = ex.target_sets || 3;
        for (let i = 1; i <= numSets; i++) {
          setsToInsert.push({
            session_id: session.id, exercise_id: ex.exercise_id, exercise_name: ex.exercise_name,
            set_number: i, weight_kg: 0, reps: ex.target_reps || 0, completed: false, set_type: 'normal'
          });
        }
      });

      if (setsToInsert.length > 0) {
        await supabase.from('workout_sets').insert(setsToInsert);
      }
      router.push(`/fichas/treino/${session.id}`);
    } catch (err: any) {
      showToast(err?.message || 'Erro ao iniciar treino', 'error');
      setActionLoading(false);
    }
  };

  const handleDiscardWorkout = async () => {
    if (!activeSession) return;
    haptics.heavy();
    setActionLoading(true);
    await supabase.from('workout_sessions').update({ status: 'discarded' }).eq('id', activeSession.id);
    setActiveSession(null);
    setActionLoading(false);
  };

  const handleDeleteRoutine = async (id: string) => {
    haptics.heavy();
    if (!window.confirm('Tem certeza que deseja excluir esta ficha?')) return;
    setRoutines(prev => prev.filter(r => r.id !== id));
    await supabase.from('workout_routines').delete().eq('id', id);
    showToast('Ficha excluída com sucesso', 'info');
  };

  const openCreateRoutine = () => {
    if (!canCreateMore) {
      showToast('Limite de fichas do plano grátis atingido.', 'warning');
      router.push('/planos');
      return;
    }
    setDraftRoutineId(null);
    setDraftRoutineName('');
    setDraftRoutineExercises([]);
    setGlobalError('');
    setShowRoutineBuilder(true);
  };

  const openEditRoutine = (rotina: any) => {
    setDraftRoutineId(rotina.id);
    setDraftRoutineName(rotina.name || '');
    const exs = (rotina.routine_exercises || []).map((ex: any) => ({
      ...ex, uid: Math.random().toString(36).substr(2, 9)
    })).sort((a: any, b: any) => a.order_index - b.order_index);
    setDraftRoutineExercises(exs);
    setGlobalError('');
    setShowRoutineBuilder(true);
  };

  const handleSaveRoutine = async () => {
    if (!draftRoutineName.trim()) { setGlobalError('Dê um nome para a ficha.'); return; }
    if (draftRoutineExercises.length === 0) { setGlobalError('Adicione pelo menos um exercício.'); return; }

    haptics.light();
    setActionLoading(true);
    setGlobalError('');

    try {
      let routineId = draftRoutineId;
      if (!routineId) {
        const { data: newR, error: iErr } = await supabase
          .from('workout_routines').insert({ name: draftRoutineName.trim(), owner_id: userId, assigned_to: userId, is_template: false }).select().single();
        if (iErr) throw iErr;
        routineId = newR.id;
      } else {
        await supabase.from('workout_routines').update({ name: draftRoutineName.trim() }).eq('id', routineId);
        await supabase.from('routine_exercises').delete().eq('routine_id', routineId);
      }

      const mappedExs = draftRoutineExercises.map((ex, idx) => ({
        routine_id: routineId, exercise_id: ex.exercise_id, exercise_name: ex.exercise_name,
        order_index: idx + 1, target_sets: Number(ex.target_sets) || 3, target_reps: Number(ex.target_reps) || 12, target_rest_seconds: Number(ex.target_rest_seconds) || 60
      }));

      await supabase.from('routine_exercises').insert(mappedExs);
      
      setShowRoutineBuilder(false);
      showToast('Ficha salva com sucesso!', 'success');
      
      const { data } = await supabase.from('workout_routines').select('*, routine_exercises(*)').or(`owner_id.eq.${userId},assigned_to.eq.${userId}`).order('created_at', { ascending: false });
      setRoutines(data || []);
    } catch (err: any) {
      setGlobalError(err?.message || 'Erro ao salvar ficha.');
    } finally {
      setActionLoading(false);
    }
  };

  const moveExDraft = (index: number, dir: -1 | 1) => {
    const arr = [...draftRoutineExercises];
    if (index + dir < 0 || index + dir >= arr.length) return;
    const temp = arr[index];
    arr[index] = arr[index + dir];
    arr[index + dir] = temp;
    setDraftRoutineExercises(arr);
  };

  const removeExDraft = (index: number) => {
    setDraftRoutineExercises(prev => prev.filter((_, i) => i !== index));
  };

  // --- Bulk Add Logic (Multi-Select) ---
  const toggleMultiSelect = (exId: string) => {
    haptics.light();
    setMultiSelectEx(prev => {
      const next = new Set(prev);
      if (next.has(exId)) next.delete(exId);
      else next.add(exId);
      return next;
    });
  };

  const confirmBulkAdd = () => {
    haptics.success();
    const newDrafts = Array.from(multiSelectEx).map(id => {
      const ex = exercises.find((e: any) => e.id === id);
      return {
        uid: Math.random().toString(36).substr(2, 9),
        exercise_id: ex.id, exercise_name: ex.name, target_sets: 3, target_reps: 12, target_rest_seconds: 60
      };
    });
    setDraftRoutineExercises(prev => [...prev, ...newDrafts]);
    setMultiSelectEx(new Set());
    setShowExercisePicker(false);
    setSearchEx('');
  };

  const closePicker = () => {
    setMultiSelectEx(new Set());
    setSearchEx('');
    setShowExercisePicker(false);
  };

  const handleCreateExercise = async () => {
    if (!newExName.trim()) { setGlobalError('Dê um nome ao exercício'); return; }
    haptics.light();
    setActionLoading(true);
    setGlobalError('');
    try {
      const { data, error } = await supabase.from('base_exercises').insert({ name: newExName.trim(), muscle_group: newExGroup, created_by: userId, is_system: false }).select().single();
      if (error) throw error;
      setExercises(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setShowCreateExercise(false);
      setNewExName('');
      showToast('Exercício criado!', 'success');
    } catch(err: any) {
      setGlobalError(err?.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getExercisePR = (exerciseId: string) => {
    const exSets = (userSets || []).filter((s: any) => s.exercise_id === exerciseId);
    if (!exSets.length) return 0;
    return Math.max(...exSets.map((s: any) => Number(s.weight_kg) || 0));
  };

  const getExerciseHistory = (exerciseId: string) => {
    const exSets = (userSets || []).filter((s: any) => s.exercise_id === exerciseId);
    const sessionMap = new Map();
    exSets.forEach((s: any) => {
      const date = s.completed_at ? new Date(s.completed_at).toISOString().split('T')[0] : 'Desconhecido';
      const weight = Number(s.weight_kg) || 0;
      if (!sessionMap.has(date) || sessionMap.get(date) < weight) sessionMap.set(date, weight);
    });
    return Array.from(sessionMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const filteredExercises = (exercises || []).filter((ex: any) => {
    const matchesSearch = ex.name?.toLowerCase().includes(searchEx.toLowerCase());
    const matchesGroup = filterGroup === 'Todos' || ex.muscle_group === filterGroup;
    return matchesSearch && matchesGroup;
  });

  if (loading) {
    return <div className="min-h-screen bg-[#000000] flex items-center justify-center"><Activity className="animate-spin text-[#FFE600] w-8 h-8" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#000000] text-[#FFFFFF] flex flex-col relative pb-20 max-w-sm mx-auto">
      
      {/* ACTIVE WORKOUT BANNER */}
      {activeSession && (
        <div className="sticky top-0 z-40 bg-[#0F0F0F] border-b border-[#FFE600]/30 p-4 px-6 flex flex-col gap-3 backdrop-blur-md shadow-[0_10px_20px_rgba(255,230,0,0.1)]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#FFE600] animate-pulse" />
            <span className="text-[#FFE600] text-sm font-black uppercase tracking-widest">Treino em andamento</span>
          </div>
          <p className="text-white font-bold text-lg">{activeSession.workout_routines?.name || 'Treino Livre'}</p>
          <div className="flex gap-3 mt-1">
            <button onClick={() => router.push(`/fichas/treino/${activeSession.id}`)} className="flex-1 bg-[#FFE600] text-black text-xs font-black uppercase tracking-wider py-3 rounded-full active:scale-95 transition-transform">Continuar</button>
            <button onClick={handleDiscardWorkout} disabled={actionLoading} className="flex-1 bg-[#1A1A1A] border border-[#FF3B30] text-[#FF3B30] text-xs font-black uppercase tracking-wider py-3 rounded-full disabled:opacity-50 active:scale-95 transition-transform">Descartar</button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="px-6 pt-8 pb-4 flex items-center justify-between">
        <h1 className="text-3xl font-black uppercase tracking-widest text-[#FFFFFF]">Fichas</h1>
        <button onClick={openCreateRoutine} className="w-10 h-10 bg-[#1A1A1A] border border-[#222225] rounded-full flex items-center justify-center text-[#FFE600] active:bg-[#FFE600] active:text-black transition-colors">
          <Plus size={20} />
        </button>
      </header>

      {/* TABS */}
      <div className="px-6 flex gap-2 overflow-x-auto hide-scroll pb-4 shrink-0">
        {['Minhas Fichas', 'Biblioteca', 'Histórico'].map((tab) => {
          const tabId = tab.toLowerCase().replace(' ', '') as any;
          const isActive = activeTab === tabId || (activeTab === 'fichas' && tab === 'Minhas Fichas');
          return (
            <button
              key={tab} onClick={() => setActiveTab(tab === 'Minhas Fichas' ? 'fichas' : tabId)}
              className={`whitespace-nowrap px-4 py-2.5 rounded-[100px] text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${isActive ? 'bg-[#FFE600] text-black' : 'bg-[#1A1A1A] border border-[#222225] text-[#A1A1AA]'}`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: MINHAS FICHAS */}
      {activeTab === 'fichas' && (
        <div className="px-6 flex flex-col gap-4">
          {!isPro && myRoutinesCount >= 3 && (
            <div className="bg-[#FFE600]/10 border border-[#FFE600]/30 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[#FFE600] text-xs font-black uppercase tracking-widest">Limite Atingido</p>
                <p className="text-[#A1A1AA] text-[10px] font-bold uppercase mt-1">Free: 3 fichas max</p>
              </div>
              <button onClick={() => router.push('/planos')} className="text-black bg-[#FFE600] px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Ser PRO</button>
            </div>
          )}

          {routines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-80 border border-dashed border-[#222225] rounded-3xl mt-4">
              <Dumbbell size={64} className="text-[#555558] mb-4" />
              <p className="text-[#A1A1AA] font-bold text-xs uppercase tracking-widest mb-6">Nenhuma ficha ainda.</p>
              <button onClick={openCreateRoutine} className="bg-[#FFE600] text-black font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-full">Criar primeira ficha</button>
            </div>
          ) : (
            (routines || []).map((r) => (
              <div key={r.id} className="bg-[#0F0F0F] border border-[#222225] rounded-3xl p-5 flex flex-col gap-4 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-black uppercase text-white">{r.name}</h3>
                    {r.assigned_to === userId && r.owner_id !== userId && (
                      <div className="flex items-center gap-1.5 mt-1 bg-[#FFE600]/10 w-fit px-2 py-0.5 rounded-full border border-[#FFE600]/20">
                        <UserCheck size={12} className="text-[#FFE600]" />
                        <span className="text-[10px] text-[#FFE600] font-bold uppercase tracking-wider">Do seu Personal</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditRoutine(r)} className="p-2 text-[#A1A1AA] hover:text-[#FFE600] bg-[#1A1A1A] rounded-full border border-[#222225]"><Edit3 size={16} /></button>
                    <button onClick={() => handleDeleteRoutine(r.id)} className="p-2 text-[#A1A1AA] hover:text-[#FF3B30] bg-[#1A1A1A] rounded-full border border-[#222225]"><Trash2 size={16} /></button>
                  </div>
                </div>

                <div className="text-xs text-[#A1A1AA] font-medium leading-relaxed">
                  {r.routine_exercises && r.routine_exercises.length > 0 ? (
                    <>{r.routine_exercises.slice(0, 3).map((ex: any) => ex.exercise_name).join(' · ')}{r.routine_exercises.length > 3 && <span className="text-[#555558]"> + {r.routine_exercises.length - 3}</span>}</>
                  ) : 'Ficha vazia. Edite para adicionar exercícios.'}
                </div>

                <div className="flex items-center justify-between mt-2 pt-4 border-t border-[#222225]">
                  <span className="text-[10px] text-[#555558] font-black uppercase tracking-widest flex items-center gap-1.5"><Clock size={12}/> Pronta para uso</span>
                  <button onClick={() => handleStartWorkout(r)} disabled={actionLoading || !!activeSession} className="bg-[#FFE600] text-black font-black text-[10px] uppercase tracking-widest px-6 py-2.5 rounded-[100px] flex items-center gap-2 disabled:opacity-50 active:scale-95 transition-transform">
                    <Play size={12} fill="currentColor" /> Iniciar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB CONTENT: BIBLIOTECA */}
      {activeTab === 'biblioteca' && (
        <div className="px-6 flex flex-col gap-4 flex-1">
          <div className="relative shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555558]" size={18} />
            <input 
              type="text" placeholder="Buscar exercício..." value={searchEx} onChange={e => setSearchEx(e.target.value)}
              className="w-full h-12 bg-[#1A1A1A] border border-[#222225] rounded-full pl-11 pr-4 text-white text-xs outline-none focus:border-[#FFE600]"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto hide-scroll pb-2 -mx-6 px-6 shrink-0">
            {MUSCLE_GROUPS.map(g => (
              <button key={g} onClick={() => setFilterGroup(g)} className={`whitespace-nowrap px-4 py-2 rounded-[100px] text-[10px] uppercase tracking-widest font-black transition-colors ${filterGroup === g ? 'bg-[#FFE600] text-black' : 'bg-[#1A1A1A] border border-[#222225] text-[#A1A1AA]'}`}>
                {g}
              </button>
            ))}
          </div>

          <button onClick={() => setShowCreateExercise(true)} className="w-full border border-dashed border-[#555558] bg-[#0F0F0F] text-[#A1A1AA] rounded-2xl p-4 text-[10px] font-black uppercase tracking-widest hover:border-[#FFE600] hover:text-[#FFE600] flex items-center justify-center gap-2 transition-colors active:scale-95 shrink-0">
            <Plus size={16} /> Criar Exercício Personalizado
          </button>

          <div className="flex flex-col gap-2 mt-2 pb-24">
            {filteredExercises.length === 0 ? (
              <p className="text-center text-[#555558] py-10 text-xs font-bold uppercase">Nenhum exercício encontrado.</p>
            ) : (
              filteredExercises.map((ex: any) => {
                const pr = getExercisePR(ex.id);
                return (
                  <button key={ex.id} onClick={() => { setSelectedExercise(ex); setShowExerciseDetail(true); }} className="bg-[#0F0F0F] border border-[#222225] rounded-2xl p-4 flex justify-between items-center text-left hover:border-[#FFE600]/50 transition-colors active:scale-95">
                    <div>
                      <p className="text-white font-black text-xs uppercase">{ex.name}</p>
                      <p className="text-[#A1A1AA] text-[9px] font-bold uppercase tracking-widest mt-1">{ex.muscle_group}</p>
                    </div>
                    <div className="text-right">
                      {pr > 0 ? <p className="text-[#FFE600] font-black text-sm">PR: {pr}kg</p> : <p className="text-[#555558] font-bold text-sm">—</p>}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: HISTORICO */}
      {activeTab === 'historico' && (
        <div className="px-6 flex flex-col gap-4 flex-1">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-80 border border-dashed border-[#222225] rounded-3xl mt-4">
              <History size={64} className="text-[#555558] mb-4" />
              <p className="text-[#A1A1AA] font-bold text-xs uppercase tracking-widest">Nenhum treino concluído ainda.</p>
            </div>
          ) : (
            (history || []).map((sess: any) => {
              const start = new Date(sess.created_at);
              const end = new Date(sess.finished_at);
              const durationMins = Math.round((end.getTime() - start.getTime()) / 60000);
              const dateStr = start.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

              return (
                <div key={sess.id} className="bg-[#0F0F0F] border border-[#222225] rounded-3xl p-5 flex flex-col gap-4 relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-black uppercase text-sm">{sess.workout_routines?.name || 'Treino Livre'}</p>
                      <p className="text-[#A1A1AA] text-[10px] uppercase font-bold tracking-widest mt-1 capitalize">{dateStr}</p>
                    </div>
                    {sess.rating && (
                      <div className="flex items-center gap-1 bg-[#1A1A1A] px-2 py-1 rounded-full border border-[#222225]">
                        <Star size={10} className="text-[#FFE600]" fill="#FFE600" />
                        <span className="text-white text-[10px] font-black">{sess.rating}/10</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-6 border-t border-[#222225] pt-4">
                    <div>
                      <p className="text-[#555558] text-[9px] uppercase tracking-widest font-black">Duração</p>
                      <p className="text-white text-sm font-bold mt-0.5">{durationMins > 0 ? `${durationMins} min` : '< 1 min'}</p>
                    </div>
                    <div>
                      <p className="text-[#555558] text-[9px] uppercase tracking-widest font-black">Volume</p>
                      <p className="text-white text-sm font-bold mt-0.5">{sess.total_volume_kg || 0} kg</p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}


      {/* ======================= MODALS ======================= */}

      {/* MODAL 1: BUILDER DE FICHA */}
      {showRoutineBuilder && (
        <div className="fixed inset-0 z-[100] h-[100dvh] bg-[#000000] flex flex-col max-w-sm mx-auto animate-in slide-in-from-bottom-full duration-300">
          
          <div className="shrink-0 px-6 py-4 border-b border-[#222225] flex items-center justify-between bg-[#0F0F0F]">
            <button onClick={() => setShowRoutineBuilder(false)} className="text-[#A1A1AA] hover:text-white p-2 -ml-2 bg-[#1A1A1A] rounded-full border border-[#222225]"><X size={20} /></button>
            <h2 className="text-[#FFFFFF] font-black uppercase tracking-widest text-sm">
              {draftRoutineId ? 'Editar Ficha' : 'Nova Ficha'}
            </h2>
            <div className="w-10" />
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6 flex flex-col gap-6">
            <div>
              <label className="text-[#A1A1AA] text-[10px] uppercase font-black tracking-widest block mb-2 pl-1">Nome da Ficha</label>
              <input 
                type="text" placeholder="Ex: Treino A - Peito e Tríceps" value={draftRoutineName} onChange={e => setDraftRoutineName(e.target.value)}
                className="w-full h-14 bg-[#1A1A1A] border border-[#222225] rounded-2xl px-5 text-white text-xs font-black uppercase tracking-wider placeholder-[#555558] outline-none focus:border-[#FFE600]"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-4 pl-1 pr-1">
                <label className="text-[#A1A1AA] text-[10px] uppercase font-black tracking-widest">Exercícios</label>
                <span className="text-[#555558] text-[10px] font-black uppercase">{draftRoutineExercises.length} adicionados</span>
              </div>

              <div className="flex flex-col gap-3">
                {draftRoutineExercises.length === 0 ? (
                  <div className="border border-dashed border-[#222225] rounded-3xl p-6 text-center">
                    <p className="text-[#555558] text-xs font-bold uppercase">Nenhum exercício adicionado.</p>
                  </div>
                ) : (
                  draftRoutineExercises.map((ex, i) => (
                    <div key={ex.uid || i} className="bg-[#0F0F0F] border border-[#222225] rounded-3xl p-5 flex flex-col gap-4 relative">
                      <div className="flex justify-between items-center pr-8">
                        <span className="text-white font-black text-xs uppercase">{i + 1}. {ex.exercise_name}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <div className="flex-1 bg-[#1A1A1A] rounded-2xl p-2 border border-[#222225] flex flex-col items-center justify-center">
                          <span className="block text-[#555558] text-[8px] uppercase font-black text-center mb-1 tracking-widest">Séries</span>
                          <input type="number" min="1" value={ex.target_sets || ''} onChange={e => {
                            const arr = [...draftRoutineExercises]; arr[i].target_sets = e.target.value; setDraftRoutineExercises(arr);
                          }} className="w-full bg-transparent text-white text-center text-sm font-black outline-none" />
                        </div>
                        <div className="flex-1 bg-[#1A1A1A] rounded-2xl p-2 border border-[#222225] flex flex-col items-center justify-center">
                          <span className="block text-[#555558] text-[8px] uppercase font-black text-center mb-1 tracking-widest">Reps</span>
                          <input type="number" min="1" value={ex.target_reps || ''} onChange={e => {
                            const arr = [...draftRoutineExercises]; arr[i].target_reps = e.target.value; setDraftRoutineExercises(arr);
                          }} className="w-full bg-transparent text-white text-center text-sm font-black outline-none" />
                        </div>
                        <div className="flex-1 bg-[#1A1A1A] rounded-2xl p-2 border border-[#222225] flex flex-col items-center justify-center">
                          <span className="block text-[#555558] text-[8px] uppercase font-black text-center mb-1 tracking-widest">Desc (s)</span>
                          <input type="number" step="15" min="0" value={ex.target_rest_seconds || ''} onChange={e => {
                            const arr = [...draftRoutineExercises]; arr[i].target_rest_seconds = e.target.value; setDraftRoutineExercises(arr);
                          }} className="w-full bg-transparent text-white text-center text-sm font-black outline-none" />
                        </div>
                      </div>

                      <div className="absolute right-3 top-3 flex flex-col gap-1">
                        <button onClick={() => moveExDraft(i, -1)} disabled={i === 0} className="p-1 text-[#A1A1AA] disabled:opacity-30"><ChevronUp size={16}/></button>
                        <button onClick={() => removeExDraft(i)} className="p-1 text-[#FF3B30]"><Trash2 size={14}/></button>
                        <button onClick={() => moveExDraft(i, 1)} disabled={i === draftRoutineExercises.length - 1} className="p-1 text-[#A1A1AA] disabled:opacity-30"><ChevronDown size={16}/></button>
                      </div>
                    </div>
                  ))
                )}

                <button 
                  onClick={() => setShowExercisePicker(true)}
                  className="w-full h-14 border border-[#FFE600] text-[#FFE600] rounded-full flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest mt-2 hover:bg-[#FFE600]/10 transition-colors active:scale-95 shrink-0"
                >
                  <Plus size={16} /> Adicionar Exercício
                </button>
              </div>
            </div>
            
            {globalError && <p className="text-[#FF3B30] text-[10px] font-black uppercase tracking-widest text-center">{globalError}</p>}
          </div>

          <div className="shrink-0 px-6 pt-4 pb-10 bg-[#000000] border-t border-[#222225]">
            <button 
              onClick={handleSaveRoutine} disabled={actionLoading}
              className="w-full h-14 bg-[#FFE600] text-black font-black uppercase tracking-widest text-xs rounded-full flex items-center justify-center disabled:opacity-50 active:scale-95 transition-transform"
            >
              {actionLoading ? 'Salvando...' : 'Salvar Ficha'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: EXERCISE PICKER (BULK ADD & FILTROS) */}
      {showExercisePicker && (
        <div className="fixed inset-0 z-[100] h-[100dvh] bg-black flex flex-col max-w-sm mx-auto animate-in slide-in-from-bottom-full duration-300">
           
           <div className="shrink-0 px-6 py-4 border-b border-[#222225] flex items-center justify-between bg-[#0F0F0F]">
              <button onClick={closePicker} className="text-[#A1A1AA] p-2 -ml-2 bg-[#1A1A1A] rounded-full border border-[#222225]"><ArrowLeft size={20} /></button>
              <h2 className="text-white font-black uppercase tracking-widest text-sm">Biblioteca</h2>
              <div className="w-10" />
           </div>

           <div className="shrink-0 px-6 pt-4 pb-2 border-b border-[#222225] bg-[#000000]">
              <div className="relative mb-3">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555558]" size={18} />
                <input 
                  type="text" placeholder="Buscar exercício..." value={searchEx} onChange={e => setSearchEx(e.target.value)}
                  className="w-full h-12 bg-[#1A1A1A] border border-[#222225] rounded-full pl-11 pr-4 text-white text-xs outline-none focus:border-[#FFE600]"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto hide-scroll pb-2 -mx-6 px-6">
                {MUSCLE_GROUPS.map(g => (
                  <button 
                    key={g} onClick={() => setFilterGroup(g)} 
                    className={`whitespace-nowrap px-4 py-2 rounded-[100px] text-[10px] uppercase tracking-widest font-black transition-colors ${filterGroup === g ? 'bg-[#FFE600] text-black' : 'bg-[#1A1A1A] border border-[#222225] text-[#A1A1AA]'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
           </div>

           <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4">
              <div className="flex flex-col gap-2 pb-10">
                {filteredExercises.map((ex: any) => {
                  const isSelected = multiSelectEx.has(ex.id);
                  return (
                    <button 
                      key={ex.id} onClick={() => toggleMultiSelect(ex.id)}
                      className={`border rounded-2xl p-4 text-left flex justify-between items-center transition-all ${isSelected ? 'bg-[#FFE600]/10 border-[#FFE600]' : 'bg-[#0F0F0F] border-[#222225]'}`}
                    >
                      <div>
                        <span className={`font-black text-xs uppercase ${isSelected ? 'text-[#FFE600]' : 'text-white'}`}>{ex.name}</span>
                        <span className="text-[#A1A1AA] text-[9px] font-black tracking-widest uppercase block mt-1">{ex.muscle_group}</span>
                      </div>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center border border-[#555558] bg-[#1A1A1A]">
                        {isSelected && <CheckCircle2 size={14} className="text-[#FFE600]" />}
                      </div>
                    </button>
                  )
                })}
              </div>
           </div>

           {multiSelectEx.size > 0 && (
             <div className="shrink-0 px-6 pt-4 pb-10 bg-[#000000] border-t border-[#222225] animate-slide-up">
                <button 
                  onClick={confirmBulkAdd}
                  className="w-full h-14 bg-[#FFE600] text-black font-black uppercase tracking-widest text-xs rounded-full flex items-center justify-center active:scale-95 transition-transform"
                >
                  Adicionar {multiSelectEx.size} {multiSelectEx.size === 1 ? 'Exercício' : 'Exercícios'}
                </button>
             </div>
           )}
        </div>
      )}

      {/* MODAL 3: CRIAR EXERCICIO */}
      {showCreateExercise && (
        <div className="fixed inset-0 z-[100] h-[100dvh] bg-black/90 backdrop-blur-sm flex flex-col justify-end max-w-sm mx-auto">
          <div className="bg-[#0F0F0F] border-t border-[#222225] rounded-t-3xl p-6 pb-12 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-black text-white uppercase tracking-widest">Novo Exercício</h2>
              <button onClick={() => setShowCreateExercise(false)} className="text-[#A1A1AA] bg-[#1A1A1A] p-2 rounded-full border border-[#222225]"><X size={20}/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[#A1A1AA] text-[10px] uppercase font-black tracking-widest mb-2 block pl-1">Nome</label>
                <input type="text" value={newExName} onChange={e => setNewExName(e.target.value)} className="w-full h-14 bg-[#1A1A1A] border border-[#222225] rounded-2xl px-5 text-xs text-white font-black uppercase tracking-wider focus:border-[#FFE600] outline-none" />
              </div>
              <div>
                <label className="text-[#A1A1AA] text-[10px] uppercase font-black tracking-widest mb-2 block pl-1">Grupo Muscular</label>
                <select value={newExGroup} onChange={e => setNewExGroup(e.target.value)} className="w-full h-14 bg-[#1A1A1A] border border-[#222225] rounded-2xl px-5 text-xs text-white font-black uppercase tracking-wider focus:border-[#FFE600] outline-none appearance-none">
                  {MUSCLE_GROUPS.filter(g => g !== 'Todos').map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              {globalError && <p className="text-[#FF3B30] text-[10px] font-black uppercase tracking-widest text-center">{globalError}</p>}
              <button onClick={handleCreateExercise} disabled={actionLoading} className="w-full h-14 bg-[#FFE600] text-black font-black text-xs uppercase tracking-widest rounded-full mt-4 active:scale-95 transition-transform">
                Salvar Exercício
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DETALHE EXERCICIO (PR e Gráfico) */}
      {showExerciseDetail && selectedExercise && (
        <div className="fixed inset-0 z-[100] h-[100dvh] bg-[#000000] flex flex-col max-w-sm mx-auto animate-in slide-in-from-bottom-full duration-300 border-x border-[#222225]">
          <div className="shrink-0 px-6 py-4 flex justify-between items-center bg-[#0F0F0F] border-b border-[#222225]">
            <h2 className="text-xs font-black text-white uppercase tracking-widest">Desempenho</h2>
            <button onClick={() => setShowExerciseDetail(false)} className="text-[#A1A1AA] bg-[#1A1A1A] p-2 rounded-full border border-[#222225]"><X size={20}/></button>
          </div>
          
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 pb-20 pt-6 flex flex-col gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{selectedExercise.name}</h2>
              <span className="text-[#FFE600] bg-[#FFE600]/10 text-[10px] font-black uppercase tracking-widest border border-[#FFE600]/20 rounded-full px-3 py-1 mt-3 inline-block">
                {selectedExercise.muscle_group}
              </span>
            </div>

            {(() => {
              const pr = getExercisePR(selectedExercise.id);
              const oneRM = Math.round(pr * (1 + 10/30)); 
              const histData = getExerciseHistory(selectedExercise.id);
              const hasData = histData.length > 0;
              
              let pointsStr = "";
              if (hasData) {
                const maxW = Math.max(...histData.map((d: any) => d[1]));
                const minW = Math.min(...histData.map((d: any) => d[1]));
                const range = maxW - minW === 0 ? 1 : maxW - minW; 
                pointsStr = histData.map((d: any, i: number) => {
                  const cx = (i / Math.max(histData.length - 1, 1)) * 280 + 10;
                  const cy = 100 - ((d[1] - minW) / range) * 80;
                  return `${cx},${cy}`;
                }).join(" ");
              }

              return (
                <>
                  <div className="flex gap-4">
                    <div className="flex-1 bg-[#0F0F0F] border border-[#222225] rounded-3xl p-5 text-center relative overflow-hidden">
                      <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-[#FFE600] rounded-full filter blur-[30px] opacity-10" />
                      <p className="text-[#555558] text-[9px] font-black uppercase tracking-widest mb-1 relative z-10">PR Máximo</p>
                      <p className="text-[#FFE600] text-3xl font-black relative z-10">{pr > 0 ? `${pr}kg` : '—'}</p>
                    </div>
                    <div className="flex-1 bg-[#0F0F0F] border border-[#222225] rounded-3xl p-5 text-center relative overflow-hidden">
                      <p className="text-[#555558] text-[9px] font-black uppercase tracking-widest mb-1">1RM Estimado</p>
                      <p className="text-white text-3xl font-black">{pr > 0 ? `${oneRM}kg` : '—'}</p>
                    </div>
                  </div>

                  <div className="bg-[#0F0F0F] border border-[#222225] rounded-3xl p-5">
                    <p className="text-[#A1A1AA] text-[10px] font-black uppercase tracking-widest mb-4">Progressão de Carga</p>
                    {hasData ? (
                      <div className="w-full h-[120px] relative">
                        <svg viewBox="0 0 300 120" className="w-full h-full overflow-visible">
                          <polyline fill="none" stroke="#FFE600" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={pointsStr} />
                          {histData.map((d: any, i: number) => {
                            const maxW = Math.max(...histData.map((d: any) => d[1]));
                            const minW = Math.min(...histData.map((d: any) => d[1]));
                            const range = maxW - minW === 0 ? 1 : maxW - minW;
                            const cx = (i / Math.max(histData.length - 1, 1)) * 280 + 10;
                            const cy = 100 - ((d[1] - minW) / range) * 80;
                            return <circle key={i} cx={cx} cy={cy} r="4" fill="#000000" stroke="#FFE600" strokeWidth="2" />;
                          })}
                        </svg>
                      </div>
                    ) : (
                      <div className="h-[120px] flex items-center justify-center border border-dashed border-[#222225] rounded-2xl">
                        <p className="text-[#555558] text-[10px] font-black uppercase tracking-widest">Nenhum registro ainda</p>
                      </div>
                    )}
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

    </div>
  );
}