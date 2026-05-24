'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Plus, UserCheck, Play, Trash2, Edit2, History, Library, FileText, Loader2, X, Search, GripVertical } from 'lucide-react';
import { useToast } from '@/lib/hooks/useToast';

const ExerciseLibrary = ({ onSelect }: { onSelect: (exercise: { id: string; name: string }) => void }) => {
  const mockExercises = [
    { id: 'ex1', name: 'Agachamento' },
    { id: 'ex2', name: 'Supino' },
    { id: 'ex3', name: 'Remada' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full max-w-md border border-border rounded-full px-4 py-3 bg-surface-2">
          <Search size={18} className="text-secondary" />
          <input
            type="text"
            placeholder="Buscar exercício"
            className="w-full bg-transparent outline-none text-primary text-sm"
            disabled
          />
        </div>
      </div>
      <div className="grid gap-3">
        {mockExercises.map((exercise) => (
          <button
            key={exercise.id}
            onClick={() => onSelect(exercise)}
            className="w-full text-left bg-surface border border-border rounded-3xl p-4 flex items-center justify-between hover:bg-surface-3 transition"
          >
            <span>{exercise.name}</span>
            <Plus size={18} />
          </button>
        ))}
      </div>
    </div>
  );
};

type TabType = 'Minhas Fichas' | 'Biblioteca' | 'Histórico';

export default function FichasPage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast, ToastComponent } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('Minhas Fichas');
  const [routines, setRoutines] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Modal Criar Ficha
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    if (activeTab === 'Minhas Fichas') {
      const { data } = await supabase
        .from('workout_routines')
        .select('*, routine_exercises(exercise_name)')
        .or(`owner_id.eq.${user.id},assigned_to.eq.${user.id}`)
        .order('created_at', { ascending: false });
      setRoutines(data || []);
    } else if (activeTab === 'Histórico') {
      const { data } = await supabase
        .from('workout_sessions')
        .select('*, workout_routines(name)')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(20);
      setHistory(data || []);
    }
    setLoading(false);
  };

  const handleStartWorkout = async (routineId: string) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: userId,
        routine_id: routineId,
        status: 'in_progress',
      })
      .select('id')
      .single();

    if (error) {
      showToast('Erro ao iniciar treino.', 'error');
      return;
    }
    router.push(`/fichas/treino/${data.id}`);
  };

  const handleSaveRoutine = async () => {
    if (!newRoutineName.trim()) return showToast('Dê um nome para a ficha.', 'warning');
    if (selectedExercises.length === 0) return showToast('Adicione pelo menos um exercício.', 'warning');
    
    setIsSaving(true);
    const { data: routine, error: routineError } = await supabase
      .from('workout_routines')
      .insert({ name: newRoutineName, owner_id: userId })
      .select('id')
      .single();

    if (routineError) {
      showToast('Erro ao salvar ficha.', 'error');
      setIsSaving(false);
      return;
    }

    const exercisesToInsert = selectedExercises.map((ex, idx) => ({
      routine_id: routine.id,
      exercise_id: ex.id,
      exercise_name: ex.name,
      order_index: idx,
      target_sets: ex.target_sets || 3,
      target_reps: ex.target_reps || 12,
      target_rest_seconds: ex.target_rest_seconds || 60
    }));

    await supabase.from('routine_exercises').insert(exercisesToInsert);
    
    setIsCreateModalOpen(false);
    setNewRoutineName('');
    setSelectedExercises([]);
    setIsSaving(false);
    showToast('Ficha criada com sucesso!', 'success');
    fetchData();
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newArr = [...selectedExercises];
    if (direction === 'up' && index > 0) {
      [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
    } else if (direction === 'down' && index < newArr.length - 1) {
      [newArr[index + 1], newArr[index]] = [newArr[index], newArr[index + 1]];
    }
    setSelectedExercises(newArr);
  };

  return (
    <div className="min-h-screen bg-background text-primary pb-safe">
      <ToastComponent />
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-border px-5 py-4 flex items-center justify-between">
        <h1 className="text-xl font-black uppercase tracking-widest text-primary">Fichas</h1>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="w-10 h-10 bg-brand text-black rounded-full flex items-center justify-center hover:bg-[#E6CF00] transition-colors"
        >
          <Plus size={24} />
        </button>
      </header>

      {/* TABS */}
      <div className="px-5 py-4">
        <div className="flex gap-2 overflow-x-auto hide-scroll">
          {(['Minhas Fichas', 'Biblioteca', 'Histórico'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-colors ${
                activeTab === tab ? 'bg-brand text-black' : 'bg-surface-2 text-secondary hover:bg-surface-3'
              }`}
            >
              {tab === 'Minhas Fichas' && <FileText size={16} className="inline mr-2" />}
              {tab === 'Biblioteca' && <Library size={16} className="inline mr-2" />}
              {tab === 'Histórico' && <History size={16} className="inline mr-2" />}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <main className="px-5">
        {loading ? (
          <div className="flex justify-center mt-20"><Loader2 className="animate-spin text-brand" size={32} /></div>
        ) : (
          <>
            {/* MINHAS FICHAS */}
            {activeTab === 'Minhas Fichas' && (
              <div className="flex flex-col gap-4 animate-fade-in">
                {routines.length === 0 ? (
                  <div className="text-center mt-20 opacity-50">
                    <FileText size={48} className="mx-auto mb-4 text-secondary" />
                    <p className="text-secondary font-medium">Nenhuma ficha ainda.<br/>Crie a sua primeira!</p>
                  </div>
                ) : (
                  routines.map((routine) => (
                    <div key={routine.id} className="bg-surface border border-border rounded-3xl p-5 relative overflow-hidden group">
                      {routine.assigned_to === userId && routine.owner_id !== userId && (
                        <div className="absolute top-0 right-0 bg-brand/10 text-brand text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl flex items-center gap-1">
                          <UserCheck size={12} /> Do seu Personal
                        </div>
                      )}
                      <h3 className="text-lg font-bold mb-1 mt-1">{routine.name}</h3>
                      <p className="text-sm text-secondary mb-4 line-clamp-1">
                        {routine.routine_exercises?.slice(0, 3).map((e: any) => e.exercise_name).join(', ')}
                        {routine.routine_exercises?.length > 3 && ` e mais ${routine.routine_exercises.length - 3}`}
                      </p>
                      
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleStartWorkout(routine.id)}
                          className="flex-1 h-12 bg-brand text-black font-bold rounded-full flex items-center justify-center gap-2 hover:bg-[#E6CF00]"
                        >
                          <Play size={18} fill="currentColor" /> Iniciar
                        </button>
                        <button className="w-12 h-12 bg-surface-2 border border-border text-secondary rounded-full flex items-center justify-center hover:bg-surface-3">
                          <Edit2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* BIBLIOTECA */}
            {activeTab === 'Biblioteca' && (
              <div className="animate-fade-in">
                <ExerciseLibrary onSelect={() => {}} />
              </div>
            )}

            {/* HISTÓRICO */}
            {activeTab === 'Histórico' && (
              <div className="flex flex-col gap-4 animate-fade-in">
                {history.length === 0 ? (
                  <p className="text-center text-secondary mt-10">Nenhum treino finalizado.</p>
                ) : (
                  history.map((session) => (
                    <div key={session.id} className="bg-surface border border-border rounded-2xl p-4 flex justify-between items-center active:scale-95 transition-transform cursor-pointer">
                      <div>
                        <p className="text-xs text-secondary font-medium mb-1">
                          {new Date(session.created_at).toLocaleDateString('pt-BR')}
                        </p>
                        <h4 className="font-bold text-primary">{session.workout_routines?.name || 'Treino Livre'}</h4>
                        <div className="flex gap-3 mt-2 text-xs text-secondary">
                          <span>Vol: <strong className="text-primary">{session.total_volume_kg}kg</strong></span>
                          {session.rating && <span>Nota: <strong className="text-brand">{session.rating}/10</strong></span>}
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center">
                        <History size={16} className="text-brand" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL CRIAR FICHA */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 animate-slide-up flex flex-col">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-black">
            <button onClick={() => setIsCreateModalOpen(false)} className="text-secondary"><X size={24} /></button>
            <h2 className="text-lg font-black uppercase tracking-widest text-primary">Nova Ficha</h2>
            <button onClick={handleSaveRoutine} disabled={isSaving} className="text-brand font-bold">
              {isSaving ? <Loader2 size={20} className="animate-spin" /> : 'Salvar'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <input 
              type="text" 
              placeholder="Nome da ficha (ex: Treino A - Peito)" 
              value={newRoutineName}
              onChange={(e) => setNewRoutineName(e.target.value)}
              className="w-full h-14 bg-surface-2 border border-border rounded-xl px-4 text-primary font-bold focus:border-brand outline-none mb-6"
            />

            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-secondary uppercase tracking-widest text-xs">Exercícios</h3>
              <button 
                onClick={() => showToast('Busca na biblioteca mockada', 'success')} 
                className="text-brand text-sm font-bold flex items-center gap-1"
              >
                <Plus size={16} /> Adicionar
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {/* Mock de exercícios selecionados - em uma doc real viria da seleção do modal */}
              {selectedExercises.map((ex, idx) => (
                <div key={idx} className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-3">
                  <div className="flex flex-col gap-2">
                    <button onClick={() => moveExercise(idx, 'up')} className="text-secondary hover:text-white"><GripVertical size={16} /></button>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold mb-2">{ex.name}</p>
                    <div className="flex gap-2">
                      <input type="number" placeholder="Séries" value={ex.target_sets || ''} className="w-16 h-10 bg-surface-2 border border-border rounded-lg text-center text-sm" />
                      <input type="number" placeholder="Reps" value={ex.target_reps || ''} className="w-16 h-10 bg-surface-2 border border-border rounded-lg text-center text-sm" />
                      <input type="number" placeholder="Desc. (s)" value={ex.target_rest_seconds || ''} className="w-20 h-10 bg-surface-2 border border-border rounded-lg text-center text-sm" />
                    </div>
                  </div>
                  <button onClick={() => setSelectedExercises(prev => prev.filter((_, i) => i !== idx))} className="text-danger p-2"><Trash2 size={20} /></button>
                </div>
              ))}
              {selectedExercises.length === 0 && (
                <div className="text-center py-10 border border-dashed border-border rounded-2xl">
                  <p className="text-secondary text-sm">Nenhum exercício adicionado.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}