'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Timer, Activity, Zap, Flame } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AnalyticsEvolutionPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    monthlyMinutes: 0,
    maxDistance: 0,
    avgPace: 0,
    weeklyBars: [0, 0, 0, 0] // Mock acumulado simulado das últimas 4 semanas
  });

  useEffect(() => {
    async function fetchEvolutionData() {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0,0,0,0);

      const { data } = await supabase
        .from('workout_sets')
        .select(`
          *,
          workout_exercises!inner(exercise_id, base_exercises(*))
        `)
        .eq('completed', true)
        .gte('completed_at', startOfMonth.toISOString());

      if (data) {
        let monthlyMins = 0;
        let maxDist = 0;
        let paces: number[] = [];
        let weekWeights = [0, 0, 0, 0];

        data.forEach((set: any) => {
          const isCardio = set.workout_exercises?.base_exercises?.exercise_type === 'cardio';
          if (isCardio) {
            const dur = Number(set.duration_minutes || 0);
            const dist = Number(set.distance_km || 0);
            
            monthlyMins += dur;
            if (dist > maxDist) maxDist = dist;
            if (set.pace_min_km) paces.push(Number(set.pace_min_km));

            // Agrupamento semanal básico do mês corrente (4 semanas)
            const day = new Date(set.completed_at).getDate();
            const weekIndex = Math.min(3, Math.floor(day / 7));
            weekWeights[weekIndex] += dist;
          }
        });

        const totalPaces = paces.length ? paces.reduce((a, b) => a + b, 0) / paces.length : 0;

        setStats({
          monthlyMinutes: monthlyMins,
          maxDistance: maxDist,
          avgPace: totalPaces,
          weeklyBars: weekWeights
        });
      }
      setLoading(false);
    }
    fetchEvolutionData();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-black">Histórico e Evolução</h1>
        <p className="text-xs text-[#A1A1AA] mt-0.5">Acompanhamento longitudinal de performance</p>
      </div>

      {/* SEÇÃO CARDIO EXCLUSIVA */}
      <section className="bg-[#0F0F0F] border border-[#222225] rounded-2xl p-5 space-y-6">
        <div className="flex items-center gap-2 border-b border-[#222225] pb-3">
          <Timer className="w-5 h-5 text-[#22D3EE]" />
          <h2 className="text-base font-black text-white uppercase tracking-wider">Métricas de Cardio</h2>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-black p-4 rounded-xl border border-[#222225]">
            <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Volume no Mês</p>
            <p className="text-xl font-black text-[#22D3EE] mt-1">{stats.monthlyMinutes} <span className="text-xs font-bold text-[#A1A1AA]">min</span></p>
          </div>
          <div className="bg-black p-4 rounded-xl border border-[#222225]">
            <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Maior Distância Unica</p>
            <p className="text-xl font-black text-[#22D3EE] mt-1">{stats.maxDistance.toFixed(2)} <span className="text-xs font-bold text-[#A1A1AA]">km</span></p>
          </div>
          <div className="bg-black p-4 rounded-xl border border-[#222225]">
            <p className="text-[10px] font-bold text-[#A1A1AA] uppercase tracking-wider">Pace Médio Global</p>
            <p className="text-xl font-black text-white mt-1">{stats.avgPace ? `${stats.avgPace.toFixed(2)}` : '--'} <span className="text-xs font-bold text-[#A1A1AA]">min/km</span></p>
          </div>
        </div>

        {/* Gráfico de Distância Semanal (Barras por Semana) */}
        <div className="space-y-2">
          <div>
            <h3 className="text-xs font-bold text-white">Distância Acumulada por Semana</h3>
            <p className="text-[10px] text-[#A1A1AA]">Evolução de quilômetros rodados nas últimas 4 semanas do mês</p>
          </div>

          <div className="h-36 bg-black rounded-xl border border-[#222225] p-4 flex items-end justify-around gap-4">
            {stats.weeklyBars.map((value, idx) => {
              const maxVal = Math.max(...stats.weeklyBars, 1);
              const heightPercent = (value / maxVal) * 100;

              return (
                <div key={idx} className="w-full max-w-[40px] flex flex-col items-center gap-2 group relative">
                  {/* Barra */}
                  <div 
                    className="w-full bg-[#22D3EE] rounded-t transition-all duration-500" 
                    style={{ height: `${Math.max(8, heightPercent)}%` }}
                  ></div>
                  
                  {/* Label X */}
                  <span className="text-[10px] font-bold text-[#A1A1AA]">Sem {idx + 1}</span>

                  {/* Popover com valores reais */}
                  <div className="absolute bottom-full mb-1 hidden group-hover:block bg-[#0F0F0F] border border-[#222225] text-[10px] font-bold px-2 py-1 rounded text-white whitespace-nowrap z-20 shadow-xl">
                    {value.toFixed(1)} km
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}