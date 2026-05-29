'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Timer, Dumbbell, Search, TrendingUp, Play, Lightbulb, X, Library, BookOpen, Compass } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ExerciseLibraryPage() {
  const router = useRouter();
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>('Todos');
  const [search, setSearch] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'progress' | 'how_to' | 'tips'>('progress');
  const [activeProgram, setActiveProgram] = useState<any>(null);

  const muscleGroups = ['Todos', 'Cardio', 'Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core'];

  useEffect(() => {
    async function initData() {
      // Carrega exercícios
      const { data: exData } = await supabase.from('base_exercises').select('*').order('name');
      if (exData) setExercises(exData);

      // Carrega programa ativo do usuário
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: progData } = await supabase
          .from('user_programs')
          .select('*, workout_programs(*)')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        if (progData) setActiveProgram(progData);
      }
      setLoading(false);
    }
    initData();
  }, []);

  const loadExerciseHistory = async (exercise: any) => {
    setSelectedExercise(exercise);
    setActiveTab('progress');
    const { data } = await supabase
      .from('workout_sets')
      .select(`*, workout_exercises!inner(exercise_id, session_id)`)
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

  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    if (url.includes('youtube.com/embed/')) return url;
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('/').pop();
      return `https://www.youtube.com/embed/${id}`;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans max-w-5xl mx-auto space-y-6">
      
      {/* Sistema de Navegação Interna de 4 Abas */}
      <div className="flex gap-1 bg-[#0F0F0F] p-1 rounded-xl border border-[#222225]">
        <button onClick={() => router.push('/fichas')} className="flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider bg-black text-[#FFE600] flex items-center justify-center gap-2">
          <Library className="w-4 h-4" /> Minhas Fichas
        </button>
        <button onClick={() => router.push('/fichas')} className="flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider text-[#A1A1AA] hover:text-white flex items-center justify-center gap-2">
          <BookOpen className="w-4 h-4" /> Biblioteca
        </button>
        <button onClick={() => router.push('/evolucao')} className="flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider text-[#A1A1AA] hover:text-white flex items-center justify-center gap-2">
          <TrendingUp className="w-4 h-4" /> Histórico
        </button>
        <button onClick={() => router.push('/programas')} className="flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider text-[#A1A1AA] hover:text-white flex items-center justify-center gap-2">
          <Compass className="w-4 h-4" /> Programas
        </button>
      </div>

      {/* Widget de Monitoramento de Programa Ativo */}
      {activeProgram && (
        <div className="bg-[#0F0F0F] border border-[#222225] p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 space-y-1">
            <span className="text-[10px] font-black tracking-widest text-[#FFE600] uppercase block">Programa Ativo</span>
            <h2 className="text-base font-black text-white">{activeProgram.workout_programs?.name}</h2>
            <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
              <span>Semana {activeProgram.current_week} de {activeProgram.workout_programs?.duration_weeks}</span>
              <span>•</span>
              <span>Dia {activeProgram.current_day}</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-black rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-[#FFE600] rounded-full transition-all duration-300" 
                style={{ width: `${(activeProgram.current_week / activeProgram.workout_programs?.duration_weeks) * 100}%` }}
              ></div>
            </div>
          </div>
          <button 
            onClick={() => router.push('/home')} 
            className="h-10 px-6 bg-[#FFE600] text-black font-bold text-xs uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all"
            style={{ borderRadius: '100px' }}
          >
            Continuar Treino
          </button>
        </div>
      )}

      {/* Grid e Biblioteca */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-[#A1A1AA] absolute left-4 top-3.5" />
          <input 
            type="text" 
            placeholder="Buscar exercício..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 bg-[#0F0F0F] border border-[#222225] rounded-xl pl-12 pr-4 text-white outline-none focus:border-[#FFE600]/40 text-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {muscleGroups.map(group => (
            <button
              key={group}
              onClick={() => setSelectedGroup(group)}
              className={`h-9 px-5 text-xs font-bold transition-all whitespace-nowrap ${
                selectedGroup === group ? 'bg-[#FFE600] text-black' : 'bg-[#0F0F0F] text-[#A1A1AA] border border-[#222225]'
              }`}
              style={{ borderRadius: '100px' }}
            >
              {group}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            {filteredExercises.map(ex => {
              const isCardio = ex.exercise_type === 'cardio' || ex.muscle_group === 'Cardio';
              return (
                <div 
                  key={ex.id}
                  onClick={() => loadExerciseHistory(ex)}
                  className={`p-4 bg-[#0F0F0F] border rounded-2xl cursor-pointer hover:scale-[1.01] transition-all flex items-center justify-between ${
                    selectedExercise?.id === ex.id ? 'border-[#FFE600]' : 'border-[#222225]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-black rounded-xl text-[#FFE600]">
                      {isCardio ? <Timer className="w-5 h-5" /> : <Dumbbell className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{ex.name}</h3>
                      <p className="text-xs text-[#A1A1AA]">{ex.muscle_group}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal Lateral Incorporado / Detalhes */}
          <div className="bg-[#0F0F0F] border border-[#222225] rounded-2xl p-5 h-fit min-h-[400px]">
            {selectedExercise ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-black text-white">{selectedExercise.name}</h2>
                    <p className="text-xs text-[#A1A1AA]">{selectedExercise.muscle_group}</p>
                  </div>
                  <button onClick={() => setSelectedExercise(null)} className="text-[#A1A1AA] hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Video Player Integrado */}
                <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black border border-[#222225] relative">
                  {selectedExercise.video_url ? (
                    getEmbedUrl(selectedExercise.video_url) ? (
                      <iframe 
                        src={getEmbedUrl(selectedExercise.video_url)!} 
                        className="w-full h-full border-0" 
                        allowFullScreen 
                      />
                    ) : (
                      <video src={selectedExercise.video_url} poster={selectedExercise.thumbnail_url} controls className="w-full h-full object-cover" />
                    )
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#A1A1AA] gap-2">
                      <Play className="w-8 h-8 opacity-40 text-[#FFE600]" />
                      <span className="text-xs font-bold">Demonstração em vídeo em breve</span>
                    </div>
                  )}
                </div>

                {/* Sub-Navegação de Abas do Modal */}
                <div className="flex border-b border-[#222225] text-xs font-bold">
                  <button onClick={() => setActiveTab('progress')} className={`flex-1 pb-2 border-b-2 text-center transition-all ${activeTab === 'progress' ? 'border-[#FFE600] text-white' : 'border-transparent text-[#A1A1AA]'}`}>Progressão</button>
                  <button onClick={() => setActiveTab('how_to')} className={`flex-1 pb-2 border-b-2 text-center transition-all ${activeTab === 'how_to' ? 'border-[#FFE600] text-white' : 'border-transparent text-[#A1A1AA]'}`}>Como fazer</button>
                  <button onClick={() => setActiveTab('tips')} className={`flex-1 pb-2 border-b-2 text-center transition-all ${activeTab === 'tips' ? 'border-[#FFE600] text-white' : 'border-transparent text-[#A1A1AA]'}`}>Dicas</button>
                </div>

                {/* Renderização de Conteúdo por Aba */}
                <div className="text-sm leading-relaxed">
                  {activeTab === 'progress' && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider">Histórico de Cargas</p>
                      {history.length === 0 ? (
                        <p className="text-xs text-[#A1A1AA]">Nenhum dado registrado para este exercício.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {history.slice(-5).map((h) => (
                            <div key={h.id} className="bg-black border border-[#222225] px-3 py-2 rounded-xl flex justify-between text-xs font-mono">
                              <span className="text-[#A1A1AA]">{new Date(h.completed_at).toLocaleDateString()}</span>
                              <span className="text-[#FFE600] font-bold">{h.weight}kg × {h.reps} reps</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'how_to' && (
                    <div className="space-y-4">
                      {/* Badges Principais */}
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          selectedExercise.difficulty === 'beginner' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                          selectedExercise.difficulty === 'advanced' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                          'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                        }`}>
                          {selectedExercise.difficulty || 'intermediário'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#1A1A1A] border border-[#222225] text-[#A1A1AA]">
                          🛠️ {selectedExercise.equipment || 'Geral'}
                        </span>
                      </div>

                      {/* Instruções */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-1">Execução</h4>
                        {selectedExercise.instructions ? (
                          <ol className="list-decimal pl-4 space-y-1 text-xs text-[#A1A1AA]">
                            {selectedExercise.instructions.split('\n').map((step: string, i: number) => (
                              <li key={i} className="pl-1"><span className="text-white">{step}</span></li>
                            ))}
                          </ol>
                        ) : (
                          <p className="text-xs text-[#A1A1AA] italic">Instruções estruturadas pendentes.</p>
                        )}
                      </div>

                      {/* Músculos */}
                      <div className="grid grid-cols-2 gap-4 border-t border-[#222225] pt-3 text-xs">
                        <div>
                          <h5 className="font-bold text-white mb-1.5 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#FFE600]" /> Primários</h5>
                          <p className="text-[#A1A1AA]">{selectedExercise.muscles_primary?.join(', ') || 'Alvo principal'}</p>
                        </div>
                        <div>
                          <h5 className="font-bold text-white mb-1.5 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#A1A1AA]" /> Secundários</h5>
                          <p className="text-[#A1A1AA]">{selectedExercise.muscles_secondary?.join(', ') || 'Estabilizadores'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'tips' && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider mb-2">Dicas do Especialista</h4>
                      {selectedExercise.tips ? (
                        selectedExercise.tips.split('\n').map((tip: string, idx: number) => (
                          <div key={idx} className="bg-black border border-[#222225] p-3 rounded-xl flex items-start gap-2.5 text-xs text-[#A1A1AA]">
                            <Lightbulb className="w-4 h-4 text-[#FFE600] shrink-0 mt-0.5" />
                            <span>{tip}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-[#A1A1AA] italic">Nenhuma dica de segurança registrada para este movimento.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-xs text-[#A1A1AA]">
                Selecione um exercício da lista para carregar vídeos e guia de execução.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}