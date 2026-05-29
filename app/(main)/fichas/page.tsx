'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Timer, Dumbbell, Search, TrendingUp } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ExerciseLibraryPage() {
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>('Todos');
  const [search, setSearch] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  // Grupos musculares incluindo o novo filtro "Cardio"
  const muscleGroups = ['Todos', 'Cardio', 'Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core'];

  useEffect(() => {
    async function fetchExercises() {
      const { data } = await supabase.from('base_exercises').select('*').order('name');
      if (data) setExercises(data);
      setLoading(false);
    }
    fetchExercises();
  }, []);

  const loadExerciseHistory = async (exercise: any) => {
    setSelectedExercise(exercise);
    const { data } = await supabase
      .from('workout_sets')
      .select(`
        *,
        workout_exercises!inner(exercise_id, session_id)
      `)
      .eq('workout_exercises.exercise_id', exercise.id)
      .eq('completed', true)
      .order('completed_at', { ascending: true });

    if (data) setHistory(data);
  };

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    if (selectedGroup === 'Todos') return matchesSearch;
    if (selectedGroup === 'Cardio') return (ex.exercise_type === 'cardio' || ex.muscle_group === 'Cardio') && matchesSearch;
    return ex.muscle_group === selectedGroup && ex.exercise_type !== 'cardio' && matchesSearch;
  });

  // Métricas rápidas calculadas para o histórico de Cardio
  const cardioMetrics = () => {
    if (!history.length) return { bestTime: 0, maxDistance: 0, avgPace: 0 };
    let bestTime = Math.max(...history.map(h => Number(h.duration_minutes || 0)));
    let maxDistance = Math.max(...history.map(h => Number(h.distance_km || 0)));
    let validPaces = history.map(h => Number(h.pace_min_km || 0)).filter(p => p > 0);
    let avgPace = validPaces.length ? (validPaces.reduce((a, b) => a + b, 0) / validPaces.length) : 0;
    return { bestTime, maxDistance, avgPace };
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans max-w-5xl mx-auto">
      <h1 className="text-2xl font-black mb-4">Biblioteca de Exercícios</h1>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="w-5 h-5 text-[#A1A1AA] absolute left-4 top-3.5" />
        <input 
          type="text" 
          placeholder="Buscar exercício..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 bg-[#0F0F0F] border border-[#222225] rounded-xl pl-12 pr-4 text-white outline-none focus:border-[#FFE600]/40 text-sm"
        />
      </div>

      {/* Chips de Grupo Muscular */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 -mx-4 px-4 scrollbar-none">
        {muscleGroups.map(group => (
          <button
            key={group}
            onClick={() => setSelectedGroup(group)}
            className={`h-9 px-5 text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
              selectedGroup === group 
                ? (group === 'Cardio' ? 'bg-[#22D3EE] text-black' : 'bg-[#FFE600] text-black') 
                : 'bg-[#0F0F0F] text-[#A1A1AA] border border-[#222225] hover:text-white'
            }`}
            style={{ borderRadius: '100px' }}
          >
            {group}
          </button>
        ))}
      </div>

      {/* Listagem em duas seções/colunas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Grid de Exercícios */}
        <div className="space-y-2">
          {loading ? (
            <p className="text-[#A1A1AA] text-sm">Buscando biblioteca...</p>
          ) : filteredExercises.map(ex => {
            const isCardio = ex.exercise_type === 'cardio' || ex.muscle_group === 'Cardio';
            return (
              <div 
                key={ex.id}
                onClick={() => loadExerciseHistory(ex)}
                className={`p-4 bg-[#0F0F0F] border rounded-2xl cursor-pointer hover:scale-[1.01] transition-all flex items-center justify-between ${
                  selectedExercise?.id === ex.id ? (isCardio ? 'border-[#22D3EE]' : 'border-[#FFE600]') : 'border-[#222225]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-black rounded-xl" style={{ color: isCardio ? '#22D3EE' : '#FFE600' }}>
                    {isCardio ? <Timer className="w-5 h-5" /> : <Dumbbell className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{ex.name}</h3>
                    <p className="text-xs text-[#A1A1AA]">{ex.muscle_group}</p>
                  </div>
                </div>
                {isCardio && (
                  <span className="px-2 py-0.5 text-[9px] font-black tracking-wider text-[#22D3EE] bg-[#22D3EE]/10 border border-[#22D3EE]/20 rounded-full uppercase">
                    Cardio
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Histórico e Progressão */}
        <div className="bg-[#0F0F0F] border border-[#222225] rounded-2xl p-5 h-fit min-h-[300px]">
          {selectedExercise ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-black text-white">{selectedExercise.name}</h2>
                <TrendingUp className="w-5 h-5" style={{ color: selectedExercise.exercise_type === 'cardio' ? '#22D3EE' : '#FFE600' }} />
              </div>

              {selectedExercise.exercise_type === 'cardio' ? (
                /* Layout Progressão de Cardio */
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-black p-3 rounded-xl border border-[#222225] text-center">
                      <p className="text-[10px] font-bold text-[#A1A1AA] uppercase">Melhor Tempo</p>
                      <p className="text-base font-black text-[#22D3EE] mt-0.5">{cardioMetrics().bestTime}m</p>
                    </div>
                    <div className="bg-black p-3 rounded-xl border border-[#222225] text-center">
                      <p className="text-[10px] font-bold text-[#A1A1AA] uppercase">Maior Dist.</p>
                      <p className="text-base font-black text-[#22D3EE] mt-0.5">{cardioMetrics().maxDistance.toFixed(1)}k</p>
                    </div>
                    <div className="bg-black p-3 rounded-xl border border-[#222225] text-center">
                      <p className="text-[10px] font-bold text-[#A1A1AA] uppercase">Pace Médio</p>
                      <p className="text-base font-black text-white mt-0.5">{cardioMetrics().avgPace ? `${cardioMetrics().avgPace.toFixed(2)}` : '--'}</p>
                    </div>
                  </div>

                  {/* Gráfico Simulado/Barras de Cardio */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA] mb-2">Eixo Y: Duração (minutos)</h4>
                    <div className="h-28 bg-black rounded-xl border border-[#222225] p-3 flex items-end justify-between gap-1">
                      {history.slice(-8).map((h, i) => {
                        const heightPercent = Math.min(100, (Number(h.duration_minutes || 0) / (cardioMetrics().bestTime || 1)) * 100);
                        return (
                          <div key={h.id} className="flex-1 flex flex-col items-center gap-1 group relative">
                            <div className="w-full bg-[#22D3EE] rounded-t" style={{ height: `${heightPercent || 10}%` }}></div>
                            <span className="text-[8px] text-[#A1A1AA] font-mono">S{i+1}</span>
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-1 hidden group-hover:block bg-neutral-900 border border-neutral-800 text-[9px] p-1 rounded whitespace-nowrap z-10">
                              {h.duration_minutes} min | {h.distance_km ? `${h.distance_km}km` : ''}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* Layout Progressão de Musculação */
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">Eixo Y: Carga Máxima Estimada</h4>
                  <div className="h-40 bg-black rounded-xl border border-[#222225] p-3 flex items-end justify-between gap-1">
                    {history.slice(-8).map((h, i) => {
                      return (
                        <div key={h.id} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full bg-[#FFE600] rounded-t" style={{ height: `${Math.min(100, (h.weight / 150) * 100)}%` }}></div>
                          <span className="text-[8px] text-[#A1A1AA] font-mono">{h.weight}k</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center text-xs text-[#A1A1AA]">
              Selecione um exercício para verificar histórico e gráficos de progressão.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}