'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Timer, Check, Dumbbell, Trophy, Flame, TrendingUp, X } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ActiveWorkoutPage() {
  const router = useRouter();
  const { sessionId } = useParams();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [inputs, setInputs] = useState<Record<string, { duration?: string; distance?: string; weight?: string; reps?: string }>>({});

  useEffect(() => {
    async function loadWorkoutSession() {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select(`
          *,
          exercises:workout_exercises(
            *,
            base:base_exercises(*),
            sets:workout_sets(*)
          )
        `)
        .eq('id', sessionId)
        .single();

      if (data) {
        setSession(data);
        const initialInputs: typeof inputs = {};
        data.exercises.forEach((ex: any) => {
          ex.sets.forEach((set: any) => {
            initialInputs[set.id] = {
              duration: set.duration_minutes?.toString() || '',
              distance: set.distance_km?.toString() || '',
              weight: set.weight?.toString() || '',
              reps: set.reps?.toString() || ''
            };
          });
        });
        setInputs(initialInputs);
      }
      setLoading(false);
    }
    loadWorkoutSession();
  }, [sessionId]);

  const handleInputChange = (setId: string, field: 'duration' | 'distance' | 'weight' | 'reps', value: string) => {
    setInputs(prev => ({
      ...prev,
      [setId]: { ...prev[setId], [field]: value }
    }));
  };

  const toggleSetComplete = async (setId: string, isCardio: boolean) => {
    const currentInput = inputs[setId];
    const targetSet = session.exercises.flatMap((e: any) => e.sets).find((s: any) => s.id === setId);
    const isCurrentlyCompleted = targetSet?.completed;

    if (isCurrentlyCompleted) {
      await supabase.from('workout_sets').update({ completed: false, completed_at: null }).eq('id', setId);
    } else {
      if (isCardio) {
        const duration = Number(currentInput?.duration || 0);
        const distance = currentInput?.distance ? Number(currentInput.distance) : null;
        const pace = (distance && duration) ? duration / distance : null;
        const calories = Math.round(duration * 8);

        await supabase.from('workout_sets').update({
          completed: true,
          duration_minutes: duration,
          distance_km: distance,
          pace_min_km: pace,
          calories_burned: calories,
          completed_at: new Date().toISOString()
        }).eq('id', setId);
      } else {
        await supabase.from('workout_sets').update({
          completed: true,
          weight: Number(currentInput?.weight || 0),
          reps: Number(currentInput?.reps || 0),
          completed_at: new Date().toISOString()
        }).eq('id', setId);
      }
    }

    // Recarregar dados locais simplificado
    const { data } = await supabase
      .from('workout_sessions')
      .select('*, exercises:workout_exercises(*, base:base_exercises(*), sets:workout_sets(*))')
      .eq('id', sessionId)
      .single();
    if (data) setSession(data);
  };

  if (loading) return <div className="min-h-screen bg-black text-white p-6">Carregando sessão...</div>;
  if (!session) return <div className="min-h-screen bg-black text-white p-6">Sessão não encontrada.</div>;

  // Cálculos de métricas agregadas
  let totalVolumeKg = 0;
  let totalCardioMinutes = 0;
  let totalCardioDistance = 0;
  let totalCalories = 0;
  let hasCardio = false;

  session.exercises.forEach((ex: any) => {
    const isCardio = ex.base?.exercise_type === 'cardio' || ex.base?.muscle_group === 'Cardio';
    if (isCardio) hasCardio = true;

    ex.sets.forEach((set: any) => {
      if (set.completed) {
        if (isCardio) {
          totalCardioMinutes += Number(set.duration_minutes || 0);
          totalCardioDistance += Number(set.distance_km || 0);
          totalCalories += Number(set.calories_burned || 0);
        } else {
          totalVolumeKg += Number(set.weight || 0) * Number(set.reps || 0);
        }
      }
    });
  });

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans selection:bg-[#FFE600]/30">
      {/* Header Treino Ativo */}
      <header className="border-b border-[#222225] bg-[#0F0F0F] -mx-4 -mt-4 p-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white">{session.name || 'Treino do Dia'}</h1>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Volume Musculação: <span className="text-[#FFE600] font-bold">{totalVolumeKg.toLocaleString('pt-BR')}kg</span>
              {hasCardio && (
                <>
                  <span className="text-[#222225] mx-2">·</span>
                  Cardio Total: <span className="text-[#22D3EE] font-bold">{totalCardioMinutes}min</span>
                </>
              )}
            </p>
          </div>
          <button 
            onClick={() => setShowFinishModal(true)}
            className="h-10 px-6 font-bold bg-[#FFE600] text-black hover:opacity-90 active:scale-95 transition-all text-sm"
            style={{ borderRadius: '100px' }}
          >
            Finalizar Treino
          </button>
        </div>
      </header>

      {/* Lista de Exercícios */}
      <main className="max-w-4xl mx-auto py-6 space-y-4">
        {session.exercises.map((ex: any) => {
          const isCardio = ex.base?.exercise_type === 'cardio' || ex.base?.muscle_group === 'Cardio';
          return (
            <div key={ex.id} className="bg-[#0F0F0F] border border-[#222225] rounded-2xl overflow-hidden p-4">
              {/* Header Exercício */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-black" style={{ color: isCardio ? '#22D3EE' : '#FFE600' }}>
                    {isCardio ? <Timer className="w-5 h-5" /> : <Dumbbell className="w-5 h-5" />}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">{ex.base?.name}</h2>
                    <p className="text-xs text-[#A1A1AA]">{ex.base?.muscle_group}</p>
                  </div>
                </div>
                {isCardio && (
                  <span className="px-2.5 py-0.5 text-[9px] font-black tracking-wider text-[#22D3EE] bg-[#22D3EE]/10 border border-[#22D3EE]/30 rounded-full uppercase">
                    Cardio
                  </span>
                )}
              </div>

              {/* Sub-headers das colunas */}
              <div className="grid grid-cols-12 gap-2 text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA] px-2 mb-2">
                <div className="col-span-2 text-center">Série</div>
                {isCardio ? (
                  <>
                    <div className="col-span-4 text-center">Duração</div>
                    <div className="col-span-4 text-center">Distância</div>
                  </>
                ) : (
                  <>
                    <div className="col-span-4 text-center">Carga (kg)</div>
                    <div className="col-span-4 text-center">Reps</div>
                  </>
                )}
                <div className="col-span-2 text-center">Status</div>
              </div>

              {/* Séries do Exercício */}
              <div className="space-y-2">
                {ex.sets.sort((a: any, b: any) => a.set_number - b.set_number).map((set: any, index: number) => {
                  const setInput = inputs[set.id] || {};
                  const durationNum = Number(setInput.duration || 0);
                  const distanceNum = Number(setInput.distance || 0);
                  const calculatedPace = (durationNum && distanceNum) ? (durationNum / distanceNum) : 0;
                  const estimatedKcal = Math.round(durationNum * 8);

                  return (
                    <div 
                      key={set.id} 
                      className={`grid grid-cols-12 gap-2 items-center p-1.5 rounded-xl transition-all ${
                        set.completed ? 'bg-black/40 opacity-70' : 'bg-black/20'
                      }`}
                    >
                      {/* Número Série */}
                      <div className="col-span-2 text-center text-sm font-black text-[#A1A1AA]">
                        {index + 1}
                      </div>

                      {/* Inputs Condicionais (Cardio vs Musculação) */}
                      {isCardio ? (
                        <>
                          {/* Duração Cardio */}
                          <div className="col-span-4 relative flex items-center">
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="30"
                              disabled={set.completed}
                              value={setInput.duration || ''}
                              onChange={(e) => handleInputChange(set.id, 'duration', e.target.value)}
                              className="w-full bg-[#1A1A1A] text-center text-lg font-black h-12 text-white border border-transparent focus:border-[#22D3EE]/50 outline-none rounded-xl pr-8"
                            />
                            <span className="absolute right-3 text-xs font-bold text-[#A1A1AA] pointer-events-none">min</span>
                          </div>

                          {/* Distância Cardio */}
                          <div className="col-span-4 relative flex items-center">
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder="5.0"
                              disabled={set.completed}
                              value={setInput.distance || ''}
                              onChange={(e) => handleInputChange(set.id, 'distance', e.target.value)}
                              className="w-full bg-[#1A1A1A] text-center text-lg font-black h-12 text-white border border-transparent focus:border-[#22D3EE]/50 outline-none rounded-xl pr-8"
                            />
                            <span className="absolute right-3 text-xs font-bold text-[#A1A1AA] pointer-events-none">km</span>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Carga Musculação */}
                          <div className="col-span-4 relative flex items-center">
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="0"
                              disabled={set.completed}
                              value={setInput.weight || ''}
                              onChange={(e) => handleInputChange(set.id, 'weight', e.target.value)}
                              className="w-full bg-[#1A1A1A] text-center text-lg font-black h-12 text-white border border-transparent focus:border-[#FFE600]/50 outline-none rounded-xl"
                            />
                          </div>

                          {/* Repetições Musculação */}
                          <div className="col-span-4 relative flex items-center">
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="10"
                              disabled={set.completed}
                              value={setInput.reps || ''}
                              onChange={(e) => handleInputChange(set.id, 'reps', e.target.value)}
                              className="w-full bg-[#1A1A1A] text-center text-lg font-black h-12 text-white border border-transparent focus:border-[#FFE600]/50 outline-none rounded-xl"
                            />
                          </div>
                        </>
                      )}

                      {/* Botão de Check */}
                      <div className="col-span-2 flex justify-center">
                        <button
                          onClick={() => toggleSetComplete(set.id, isCardio)}
                          className="w-10 h-10 flex items-center justify-center border transition-all"
                          style={{ 
                            borderRadius: '100px',
                            borderColor: set.completed ? (isCardio ? '#22D3EE' : '#FFE600') : '#222225',
                            backgroundColor: set.completed ? (isCardio ? '#22D3EE' : '#FFE600') : 'transparent',
                            color: set.completed ? '#000000' : '#FFFFFF'
                          }}
                        >
                          <Check className="w-5 h-5 stroke-[3]" />
                        </button>
                      </div>

                      {/* Métricas Dinâmicas Inline para Cardio */}
                      {isCardio && durationNum > 0 && (
                        <div className="col-span-12 flex items-center gap-4 px-2 mt-1 border-t border-[#1A1A1A] pt-1.5 text-[11px]">
                          {calculatedPace > 0 && (
                            <span className="text-[#22D3EE] font-medium">
                              Pace: <span className="font-bold">{calculatedPace.toFixed(2)} min/km</span>
                            </span>
                          )}
                          <span className="text-[#A1A1AA] font-medium">
                            Calorias estimadas: <span className="font-bold text-white">~{estimatedKcal} kcal</span>
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </main>

      {/* Modal Resumo Finalização */}
      {showFinishModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F0F0F] border border-[#222225] rounded-2xl w-full max-w-md p-6 relative">
            <button 
              onClick={() => setShowFinishModal(false)}
              className="absolute right-4 top-4 text-[#A1A1AA] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-6 h-6 text-[#FFE600]" />
              <h3 className="text-lg font-black text-white">Resumo da Sessão</h3>
            </div>

            <div className="space-y-3 my-5 border-y border-[#222225] py-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#A1A1AA]">Volume Total Levantado:</span>
                <span className="text-[#FFE600] font-black">{totalVolumeKg.toLocaleString()} kg</span>
              </div>
              
              {hasCardio && (
                <>
                  <div className="flex justify-between items-center text-sm border-t border-[#1A1A1A] pt-3">
                    <span className="text-[#A1A1AA]">Tempo de Cardio:</span>
                    <span className="text-[#22D3EE] font-black">{totalCardioMinutes} minutos</span>
                  </div>
                  {totalCardioDistance > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#A1A1AA]">Distância Percorrida:</span>
                      <span className="text-[#22D3EE] font-black">{totalCardioDistance.toFixed(2)} km</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#A1A1AA] flex items-center gap-1">
                      <Flame className="w-4 h-4 text-orange-500 fill-orange-500" /> Calorias Estimadas:
                    </span>
                    <span className="text-white font-black">{totalCalories} kcal</span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={async () => {
                await supabase.from('workout_sessions').update({ completed: true, ended_at: new Date().toISOString() }).eq('id', sessionId);
                router.push('/home');
              }}
              className="w-full h-12 bg-[#FFE600] text-black font-black hover:opacity-90 transition-all text-sm"
              style={{ borderRadius: '100px' }}
            >
              Confirmar e Salvar Treino
            </button>
          </div>
        </div>
      )}
    </div>
  );
}