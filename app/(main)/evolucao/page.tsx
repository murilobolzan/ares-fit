'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePlan } from '@/lib/hooks/usePlan';
import { useToast } from '@/lib/hooks/useToast';
import { haptics } from '@/lib/haptics';
import { 
  TrendingUp, Plus, Scale, Lock, Camera, BarChart3, Loader2, Trash2, Calendar
} from 'lucide-react';

type TimeFilter = '7D' | '1M' | '3M' | 'ALL';

export default function EvolucaoPage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();
  const { isPro, loading: planLoading } = usePlan();

  const [loading, setLoading] = useState(true);
  const [weightLogs, setWeightLogs] = useState<any[]>([]);
  const [newWeight, setNewWeight] = useState('');
  const [insertLoading, setInsertLoading] = useState(false);
  
  // Filtro Temporal de Histórico
  const [activeFilter, setActiveFilter] = useState<TimeFilter>('1M');

  useEffect(() => {
    const fetchWeights = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (data) setWeightLogs(data);
      setLoading(false);
    };

    fetchWeights();
  }, [supabase, router]);

  const handleAddWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = parseFloat(newWeight.replace(',', '.'));
    
    if (!weightNum || isNaN(weightNum)) {
      showToast('Insira um peso válido.', 'warning');
      return;
    }

    haptics.light();
    setInsertLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('weight_logs')
        .insert({ user_id: user.id, weight: weightNum })
        .select()
        .single();

      if (error) throw error;

      setWeightLogs([...weightLogs, data]);
      setNewWeight('');
      showToast('Peso registrado com sucesso!', 'success');
    } catch (err: any) {
      showToast('Erro ao salvar peso.', 'error');
    } finally {
      setInsertLoading(false);
    }
  };

  const handleDeleteWeight = async (id: string) => {
    haptics.heavy();
    if (!window.confirm('Excluir este registro de peso?')) return;

    const { error } = await supabase.from('weight_logs').delete().eq('id', id);
    if (!error) {
      setWeightLogs(weightLogs.filter((w: any) => w.id !== id));
      showToast('Registro removido.', 'info');
    }
  };

  // Filtragem Lógica de Dados Baseada no Tempo Decorrido
  const getFilteredLogs = () => {
    if (activeFilter === 'ALL') return weightLogs;
    
    const now = new Date();
    const cutoff = new Date();
    
    if (activeFilter === '7D') cutoff.setDate(now.getDate() - 7);
    if (activeFilter === '1M') cutoff.setMonth(now.getMonth() - 1);
    if (activeFilter === '3M') cutoff.setMonth(now.getMonth() - 3);

    return weightLogs.filter((log: any) => new Date(log.created_at) >= cutoff);
  };

  const displayedLogs = getFilteredLogs();
  const hasChartData = displayedLogs.length > 1;
  
  let pointsStr = "";
  let chartPoints: any[] = [];

  if (hasChartData) {
    const weights = displayedLogs.map((d: any) => d.weight);
    const maxW = Math.max(...weights);
    const minW = Math.min(...weights);
    const range = maxW - minW === 0 ? 1 : maxW - minW;

    chartPoints = displayedLogs.map((d: any, i: number) => {
      const cx = (i / (displayedLogs.length - 1)) * 280 + 25;
      const cy = 90 - ((d.weight - minW) / range) * 50;
      return { 
        cx, 
        cy, 
        weight: d.weight, 
        date: new Date(d.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) 
      };
    });

    pointsStr = chartPoints.map((p: any) => `${p.cx},${p.cy}`).join(" ");
  }

  if (loading || planLoading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-[#FFE600]" size={32} /></div>;
  }

  return (
    <div className="min-h-screen bg-[#000000] text-[#FFFFFF] p-6 pt-10 pb-36 max-w-sm mx-auto flex flex-col gap-6 animate-fade-in">
      
      {/* HEADER */}
      <header>
        <h1 className="text-3xl font-black uppercase tracking-widest flex items-center gap-2">
          <TrendingUp className="text-[#FFE600]" size={28} /> Evolução
        </h1>
        <p className="text-[#A1A1AA] text-xs font-bold uppercase tracking-wider mt-1">Acompanhe seus resultados corporais</p>
      </header>

      {/* REGISTRO E GRÁFICO DE PESO */}
      <section className="bg-[#0F0F0F] border border-[#222225] rounded-3xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale size={18} className="text-[#FFE600]" />
            <h3 className="font-black text-xs uppercase tracking-widest text-white">Registro de Peso</h3>
          </div>
        </div>

        <form onSubmit={handleAddWeight} className="flex gap-2">
          <input 
            type="text" inputMode="decimal" placeholder="Ex: 84.5" value={newWeight} onChange={e => setNewWeight(e.target.value)}
            className="flex-1 bg-[#1A1A1A] border border-[#222225] h-12 rounded-xl px-4 text-xs font-black text-white placeholder-[#555558] outline-none focus:border-[#FFE600]"
          />
          <button type="submit" disabled={insertLoading} className="w-12 h-12 bg-[#FFE600] text-black font-black rounded-xl flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50">
            {insertLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={20} />}
          </button>
        </form>

        {/* CONTAINER DOS FILTROS DA BIBLIOTECA DE PESO */}
        <div className="flex items-center gap-1.5 bg-[#1A1A1A] p-1 border border-[#222225] rounded-xl justify-between mt-2">
          {(['7D', '1M', '3M', 'ALL'] as TimeFilter[]).map((filter) => (
            <button
              type="button"
              key={filter}
              onClick={() => { haptics.light(); setActiveFilter(filter); }}
              className={`flex-1 text-[9px] font-black uppercase py-2 text-center rounded-lg transition-colors ${activeFilter === filter ? 'bg-[#FFE600] text-black' : 'text-[#A1A1AA]'}`}
            >
              {filter === 'ALL' ? 'Tudo' : filter}
            </button>
          ))}
        </div>

        {/* ÁREA DE EXIBIÇÃO DO GRÁFICO */}
        <div className="bg-[#1A1A1A] border border-[#222225] rounded-2xl p-3 mt-1 flex flex-col items-center justify-center">
          {hasChartData ? (
            <div className="w-full h-[150px] relative mt-2">
              <svg viewBox="0 0 330 150" className="w-full h-full overflow-visible">
                <polyline fill="none" stroke="#FFE600" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={pointsStr} className="drop-shadow-[0_2px_8px_rgba(255,230,0,0.3)]" />
                {chartPoints.map((p: any, i: number) => (
                  <g key={i}>
                    <line x1={p.cx} y1={p.cy} x2={p.cx} y2="120" stroke="#222225" strokeWidth="1" strokeDasharray="3,3" />
                    <circle cx={p.cx} cy={p.cy} r="5" fill="#000000" stroke="#FFE600" strokeWidth="2.5" />
                    <text x={p.cx} y={p.cy - 12} textAnchor="middle" fill="#FFE600" fontSize="10" fontWeight="900" className="font-mono bg-black">{p.weight}k</text>
                    <text x={p.cx} y="135" textAnchor="middle" fill="#555558" fontSize="8" fontWeight="bold">{p.date}</text>
                  </g>
                ))}
              </svg>
            </div>
          ) : (
            <div className="py-10 text-center text-[#555558] text-[9px] font-black uppercase tracking-widest px-4 leading-relaxed">
              {weightLogs.length <= 1 
                ? "Insira ao menos 2 registros no app para iniciar a análise" 
                : "Sem registros históricos no período selecionado"}
            </div>
          )}
        </div>

        {/* LISTAGEM HISTÓRICA FILTRADA */}
        {displayedLogs.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-1 max-h-[120px] overflow-y-auto pr-1">
            {([...displayedLogs].reverse()).map((log: any) => (
              <div key={log.id} className="flex justify-between items-center bg-[#1A1A1A] px-4 py-2 rounded-xl border border-[#222225] text-[11px]">
                <span className="text-[#A1A1AA] font-bold">{new Date(log.created_at).toLocaleDateString('pt-BR')}</span>
                <div className="flex items-center gap-3">
                  <span className="text-white font-black">{log.weight} kg</span>
                  <button type="button" onClick={() => handleDeleteWeight(log.id)} className="text-[#555558] hover:text-[#FF3B30] transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SEÇÃO CORRIGIDA: PROGRESSO VISUAL (PROPORÇÃO FIXA E ALINHAMENTO) */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <Camera size={15} className="text-[#A1A1AA]" />
          <h3 className="font-black text-[10px] uppercase tracking-widest text-[#A1A1AA]">Progresso Visual</h3>
        </div>

        <div className="bg-[#0F0F0F] border border-[#222225] rounded-3xl p-4 h-[105px] relative overflow-hidden flex items-center justify-between">
          <div className="flex items-center gap-3 z-10 text-left">
            <div className="w-8 h-8 rounded-full bg-[#FFE600]/10 border border-[#FFE600]/20 flex items-center justify-center text-[#FFE600] shrink-0">
              <Lock size={14} />
            </div>
            <div>
              <h4 className="text-white font-black text-xs uppercase tracking-tight">Fotos de Evolução</h4>
              <p className="text-[#A1A1AA] text-[9px] font-bold uppercase tracking-wide mt-0.5">Módulo de Análise e Assimetrias</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => router.push('/planos')} 
            className="h-9 bg-[#FFE600] text-black font-black text-[9px] uppercase tracking-widest rounded-full px-4 transition-transform active:scale-95 shrink-0 z-10 shadow-[0_0_15px_rgba(255,230,0,0.15)]"
          >
            Liberar
          </button>
          
          {/* Background Mock decorativo desfocado ao fundo */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#1A1A1A]/40 to-transparent pointer-events-none opacity-20 flex items-center justify-end pr-4">
            <div className="w-12 h-12 bg-zinc-800 rounded-lg border border-zinc-700 transform rotate-12" />
          </div>
        </div>
      </section>

      {/* SEÇÃO CORRIGIDA: ANÁLISE SEMANAL (MESMA PROPORÇÃO GEOMÉTRICA) */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <BarChart3 size={15} className="text-[#A1A1AA]" />
          <h3 className="font-black text-[10px] uppercase tracking-widest text-[#A1A1AA]">Análise Semanal</h3>
        </div>

        <div className="bg-[#0F0F0F] border border-[#222225] rounded-3xl p-4 h-[105px] relative overflow-hidden flex items-center justify-between">
          <div className="flex items-center gap-3 z-10 text-left">
            <div className="w-8 h-8 rounded-full bg-[#FFE600]/10 border border-[#FFE600]/20 flex items-center justify-center text-[#FFE600] shrink-0">
              <Lock size={14} />
            </div>
            <div>
              <h4 className="text-white font-black text-xs uppercase tracking-tight">Gráficos de Carga</h4>
              <p className="text-[#A1A1AA] text-[9px] font-bold uppercase tracking-wide mt-0.5">Cálculo de Tonelagem e Platôs</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => router.push('/planos')} 
            className="h-9 bg-[#FFE600] text-black font-black text-[9px] uppercase tracking-widest rounded-full px-4 transition-transform active:scale-95 shrink-0 z-10 shadow-[0_0_15px_rgba(255,230,0,0.15)]"
          >
            Liberar
          </button>

          {/* Background Mock decorativo */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#1A1A1A]/40 to-transparent pointer-events-none opacity-20 flex items-center justify-end pr-6">
            <div className="flex items-end gap-1 h-8 w-12">
              <div className="bg-zinc-700 w-2 h-4 rounded-t-sm" />
              <div className="bg-zinc-700 w-2 h-6 rounded-t-sm" />
              <div className="bg-zinc-600 w-2 h-8 rounded-t-sm" />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}