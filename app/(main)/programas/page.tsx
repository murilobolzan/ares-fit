'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { X, Calendar, Layers, Target, Library, BookOpen, TrendingUp, Compass, Flame } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function WorkoutProgramsPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [routines, setRoutines] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Filtros de Estado
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterGoal, setFilterGoal] = useState('all');
  const [filterDays, setFilterDays] = useState('all');

  useEffect(() => {
    async function fetchPrograms() {
      const { data } = await supabase.from('workout_programs').select('*').order('created_at');
      if (data) setPrograms(data);
      setLoading(false);
    }
    fetchPrograms();
  }, []);

  const openProgramDetails = async (program: any) => {
    setSelectedProgram(program);
    const { data } = await supabase
      .from('program_routines')
      .select(`*, exercises:program_routine_exercises(*)`)
      .eq('program_id', program.id)
      .order('order_index');
    if (data) setRoutines(data);
  };

  const startProgramWorkflow = async () => {
    if (!selectedProgram) return;
    setActionLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Usuário não autenticado.');
      setActionLoading(false);
      return;
    }

    // 1. Encerra qualquer programa ativo que o usuário possua antes
    await supabase
      .from('user_programs')
      .update({ status: 'paused' })
      .eq('user_id', user.id)
      .eq('status', 'active');

    // 2. Insere o novo vínculo de programa
    const { error: linkError } = await supabase
      .from('user_programs')
      .insert({
        user_id: user.id,
        program_id: selectedProgram.id,
        status: 'active'
      });

    if (linkError) {
      alert('Erro ao vincular programa: ' + linkError.message);
      setActionLoading(false);
      return;
    }

    // 3. Clona as rotinas padrão do programa na planilha operacional de treinos do usuário (workout_routines)
    for (const routine of routines) {
      const { data: userRoutine, error: routError } = await supabase
        .from('workout_routines')
        .insert({
          user_id: user.id,
          name: `${selectedProgram.name} - ${routine.name}`,
          tag: 'programa_alocado'
        })
        .select()
        .single();

      if (userRoutine && routine.exercises) {
        const exerciseInserts = routine.exercises.map((ex: any, idx: number) => ({
          routine_id: userRoutine.id,
          exercise_id: ex.exercise_id,
          order_index: idx,
          default_sets: ex.sets,
          default_reps: ex.reps
        }));
        await supabase.from('routine_exercises').insert(exerciseInserts);
      }
    }

    setActionLoading(false);
    setSelectedProgram(null);
    router.push('/fichas');
  };

  const filteredPrograms = programs.filter(p => {
    const levelMatch = filterLevel === 'all' || p.level === filterLevel;
    const daysMatch = filterDays === 'all' || p.days_per_week === Number(filterDays);
    const goalMatch = filterGoal === 'all' || p.goal === filterGoal;
    return levelMatch && daysMatch && goalMatch;
  });

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans max-w-5xl mx-auto space-y-6">
      
      {/* Sistema de Navegação Interna Consolidada */}
      <div className="flex gap-1 bg-[#0F0F0F] p-1 rounded-xl border border-[#222225]">
        <button onClick={() => router.push('/fichas')} className="flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider text-[#A1A1AA] hover:text-white flex items-center justify-center gap-2">
          <Library className="w-4 h-4" /> Minhas Fichas
        </button>
        <button onClick={() => router.push('/fichas')} className="flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider text-[#A1A1AA] hover:text-white flex items-center justify-center gap-2">
          <BookOpen className="w-4 h-4" /> Biblioteca
        </button>
        <button onClick={() => router.push('/evolucao')} className="flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider text-[#A1A1AA] hover:text-white flex items-center justify-center gap-2">
          <TrendingUp className="w-4 h-4" /> Histórico
        </button>
        <button onClick={() => router.push('/programas')} className="flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider bg-black text-[#FFE600] flex items-center justify-center gap-2">
          <Compass className="w-4 h-4" /> Programas
        </button>
      </div>

      <div>
        <h1 className="text-xl font-black tracking-tight text-white uppercase">Programas de Treino</h1>
        <p className="text-xs text-[#A1A1AA] mt-0.5">Montados por especialistas. É só selecionar e começar.</p>
      </div>

      {/* Painel de Filtros Avançados */}
      <div className="grid grid-cols-3 gap-2 bg-[#0F0F0F] border border-[#222225] p-3 rounded-xl text-xs">
        <div>
          <label className="block text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider mb-1">Nível</label>
          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="w-full h-9 bg-black border border-[#222225] rounded-lg text-white px-2 outline-none">
            <option value="all">Todos</option>
            <option value="beginner">Iniciante</option>
            <option value="intermediate">Intermediário</option>
            <option value="advanced">Avançado</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider mb-1">Objetivo</label>
          <select value={filterGoal} onChange={(e) => setFilterGoal(e.target.value)} className="w-full h-9 bg-black border border-[#222225] rounded-lg text-white px-2 outline-none">
            <option value="all">Todos</option>
            <option value="muscle_gain">Massa</option>
            <option value="strength">Força</option>
            <option value="definition">Definição</option>
            <option value="health">Saúde</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider mb-1">Frequência</label>
          <select value={filterDays} onChange={(e) => setFilterDays(e.target.value)} className="w-full h-9 bg-black border border-[#222225] rounded-lg text-white px-2 outline-none">
            <option value="all">Todos</option>
            <option value="3">3d / semana</option>
            <option value="4">4d / semana</option>
            <option value="5">5d / semana</option>
            <option value="6">6d / semana</option>
          </select>
        </div>
      </div>

      {/* Grid de Programas */}
      {loading ? (
        <p className="text-xs text-[#A1A1AA]">Carregando programas de treino disponíveis...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredPrograms.map((prog) => (
            <div key={prog.id} className="bg-[#0F0F0F] border border-[#222225] rounded-2xl p-4 flex flex-col justify-between h-52 hover:border-[#222225]/80 transition-all">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-2xl">{prog.thumbnail_emoji || '💪'}</span>
                  <div className="flex items-center gap-1">
                    {prog.is_premium && (
                      <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-black px-2 py-0.5 rounded-full font-black text-[8px] uppercase tracking-wider">PRO</span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                      prog.level === 'beginner' ? 'bg-green-500/10 text-green-400' :
                      prog.level === 'advanced' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {prog.level === 'beginner' ? 'Iniciante' : prog.level === 'advanced' ? 'Avançado' : 'Interm.'}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white line-clamp-1">{prog.name}</h3>
                  <p className="text-xs text-[#A1A1AA] line-clamp-2 mt-0.5">{prog.description}</p>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-[#1A1A1A] pt-3 mt-2">
                <span className="text-[11px] font-mono text-[#A1A1AA]">{prog.duration_weeks} semanas • {prog.days_per_week}x/sem</span>
                <button 
                  onClick={() => openProgramDetails(prog)}
                  className="h-8 px-4 border border-[#222225] text-white hover:bg-white hover:text-black font-bold text-xs transition-all"
                  style={{ borderRadius: '100px' }}
                >
                  Ver programa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Sobreposto de Detalhes Completo */}
      {selectedProgram && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F0F0F] border border-[#222225] rounded-2xl w-full max-w-lg p-6 relative max-h-[85vh] flex flex-col justify-between">
            <button onClick={() => setSelectedProgram(null)} className="absolute right-4 top-4 text-[#A1A1AA] hover:text-white">
              <X className="w-5 h-5" />
            </button>

            {/* Top Modal */}
            <div className="space-y-2 overflow-y-auto pr-1 flex-1 mb-5">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{selectedProgram.thumbnail_emoji}</span>
                <div>
                  <h3 className="text-base font-black text-white">{selectedProgram.name}</h3>
                  <p className="text-xs text-[#A1A1AA]">Desenvolvido por: <span className="text-white font-bold">{selectedProgram.author}</span></p>
                </div>
              </div>
              <p className="text-xs text-[#A1A1AA] leading-relaxed pt-1">{selectedProgram.description}</p>

              {/* Grid Rápido de Configuração */}
              <div className="grid grid-cols-2 gap-2 bg-black border border-[#222225] p-3 rounded-xl text-xs font-mono my-3">
                <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-[#FFE600]" /> Duração: {selectedProgram.duration_weeks} sem</div>
                <div className="flex items-center gap-1.5"><Layers className="w-4 h-4 text-[#FFE600]" /> Freq: {selectedProgram.days_per_week}x/semana</div>
                <div className="flex items-center gap-1.5 capitalize"><Target className="w-4 h-4 text-[#FFE600]" /> Objetivo: {selectedProgram.goal || 'Geral'}</div>
                <div className="flex items-center gap-1.5 capitalize"><Flame className="w-4 h-4 text-[#FFE600]" /> Nível: {selectedProgram.level}</div>
              </div>

              {/* Estrutura de Treinos/Rotinas Inclusas */}
              <div className="space-y-3 mt-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-white">Cronograma das Rotinas</h4>
                {routines.length === 0 ? (
                  <p className="text-xs text-[#A1A1AA]">Mapeando rotinas estruturais do programa...</p>
                ) : (
                  <div className="space-y-2">
                    {routines.map((routine) => (
                      <div key={routine.id} className="bg-black/50 border border-[#222225] p-3 rounded-xl space-y-1.5">
                        <div className="flex justify-between items-center border-b border-[#1A1A1A] pb-1">
                          <span className="text-xs font-black text-[#FFE600]">{routine.name}</span>
                          <span className="text-[10px] font-mono text-[#A1A1AA]">{routine.day_label || 'Dia Alocado'}</span>
                        </div>
                        <div className="space-y-1">
                          {routine.exercises?.map((ex: any) => (
                            <div key={ex.id} className="flex justify-between items-center text-[11px] text-[#A1A1AA]">
                              <span>• {ex.exercise_name}</span>
                              <span className="font-mono text-white">{ex.sets}x {ex.reps} ({ex.rest_seconds}s desc)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Modal CTA */}
            <button
              onClick={startProgramWorkflow}
              disabled={actionLoading}
              className="w-full h-12 bg-[#FFE600] text-black font-black text-xs uppercase tracking-widest hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-40"
              style={{ borderRadius: '100px' }}
            >
              {actionLoading ? 'Alocando Fichas no Perfil...' : 'Iniciar Este Programa'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}