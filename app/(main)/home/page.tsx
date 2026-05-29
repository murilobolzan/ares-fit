'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Timer, Activity, Zap, ShieldCheck } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function HomeDashboard() {
  const [loading, setLoading] = useState(true);
  const [weeklyCardioMinutes, setWeeklyCardioMinutes] = useState(0);
  const [cardioThresholdHours, setCardioThresholdHours] = useState(0);

  useEffect(() => {
    async function loadDashboardStats() {
      // Data de 7 dias atrás
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data } = await supabase
        .from('workout_sets')
        .select(`
          *,
          workout_exercises!inner(exercise_id, base_exercises(*))
        `)
        .eq('completed', true)
        .gte('completed_at', sevenDaysAgo.toISOString());

      if (data) {
        let totalMinutes = 0;
        let lastSessionDuration = 0;
        let lastSessionIsHiit = false;
        let lastCompletedAt: Date | undefined = undefined;
        data.forEach((set: any) => {
          const isCardio = set.workout_exercises?.base_exercises?.exercise_type === 'cardio';
          if (isCardio) {
            totalMinutes += Number(set.duration_minutes || 0);
            
            const setDate = new Date(set.completed_at);
            if (!lastCompletedAt || setDate > lastCompletedAt) {
              lastCompletedAt = setDate;
              lastSessionDuration = Number(set.duration_minutes || 0);
              if (set.workout_exercises?.base_exercises?.name?.toLowerCase().includes('hiit')) {
                lastSessionIsHiit = true;
              }
            }
          }
        });

        setWeeklyCardioMinutes(totalMinutes);

        // Lógica de recuperação baseada nas regras de limite fornecidas
        if (lastCompletedAt) {
          const now = new Date();
          const diffHours = Math.abs(now.getTime() - (lastCompletedAt as Date).getTime()) / (1000 * 60 * 60);          
          let requiredRecovery = 12; // Cardio moderado default
          if (lastSessionIsHiit || lastSessionDuration > 45) {
            requiredRecovery = 24; // Cardio intenso
          }

          const remainingRecovery = Math.max(0, requiredRecovery - diffHours);
          setCardioThresholdHours(Math.round(remainingRecovery));
        }
      }
      setLoading(false);
    }
    loadDashboardStats();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-black">Seu Painel AresFit</h1>
        <p className="text-xs text-[#A1A1AA] mt-0.5">Métricas semanais consolidadas e recuperação</p>
      </div>

      {/* Widgets do Resumo Semanal */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Cardio Semanal */}
        <div className="bg-[#0F0F0F] border border-[#222225] rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#A1A1AA] uppercase tracking-wider">
              <Timer2 className="w-4 h-4 text-[#22D3EE]" />
              Cardio Semanal
            </div>
            <div>
              <span className="text-3xl font-black text-white">{weeklyCardioMinutes}</span>
              <span className="text-sm font-bold text-[#A1A1AA] ml-1">min</span>
            </div>
            
            {weeklyCardioMinutes >= 150 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#22C55E] bg-[#22C55E]/10 px-2.5 py-0.5 rounded-full border border-[#22C55E]/20 mt-1">
                ✓ Meta semanal OMS
              </span>
            )}
          </div>
          <div className="w-12 h-12 bg-[#22D3EE]/5 border border-[#22D3EE]/10 rounded-xl flex items-center justify-center text-[#22D3EE]">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Card Mapa de Recuperação Integrada */}
        <div className="bg-[#0F0F0F] border border-[#222225] rounded-2xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-[#A1A1AA] uppercase tracking-wider">
              <Zap className="w-4 h-4 text-amber-500" />
              Status de Recuperação
            </div>
            <p className="text-sm font-bold text-white mt-1">
              {cardioThresholdHours > 0 ? (
                <span>Recuperação sistêmica Cardio: <span className="text-[#22D3EE] font-black">{cardioThresholdHours}h restantes</span></span>
              ) : (
                <span className="text-[#22C55E] flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Prontidão Muscular e Cardio 100%</span>
              )}
            </p>
            <p className="text-[10px] text-[#A1A1AA] max-w-xs leading-relaxed">
              O tempo é ajustado dinamicamente com base nas sessões moderadas ou treinos intensos e HIIT.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}