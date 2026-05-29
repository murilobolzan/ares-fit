'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Trophy, Flame, Activity, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RankingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState<any[]>([]);
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    const fetchRanking = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data } = await supabase
        .from('weekly_ranking')
        .select('*');

      if (data) {
        setRanking(data);
        const myRank = data.find(r => r.id === user?.id);
        if (myRank) setMe({ ...myRank, pos: data.indexOf(myRank) + 1 });
      }
      setLoading(false);
    };
    fetchRanking();
  }, [supabase]);

  // Cálculo do período da semana (Segunda a Domingo)
  const today = new Date();
  const first = today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1);
  const last = first + 6;
  const period = `${new Date(today.setDate(first)).getDate()} - ${new Date(today.setDate(last)).getDate()} de ${new Date().toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}`;

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Activity className="animate-spin text-[#FFE600]" /></div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24 max-w-sm mx-auto flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 bg-[#0F0F0F] border border-[#222225] rounded-full"><ArrowLeft size={20}/></button>
          <h1 className="text-2xl font-black uppercase tracking-widest">Ranking</h1>
        </div>
        <div className="flex items-center gap-2 text-[#555558] text-[10px] font-black uppercase tracking-widest pl-2">
          <Activity size={12} /> Período: {period}
        </div>
      </header>

      {/* Meu Rank (Sticky Top) */}
      {me && (
        <div className="bg-[#FFE600] rounded-3xl p-4 flex items-center justify-between shadow-[0_10px_20px_rgba(255,230,0,0.15)] animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3">
            <span className="text-black font-black text-xl">#{me.pos}</span>
            <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center font-black text-black">{me.full_name[0]}</div>
            <div>
              <p className="text-black font-black uppercase text-xs">Você</p>
              <p className="text-black/60 text-[10px] font-bold">@{me.username}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-black font-black text-sm">{me.weekly_volume.toLocaleString()} kg</p>
            <p className="text-black/60 text-[9px] font-black uppercase tracking-widest">Volume Semanal</p>
          </div>
        </div>
      )}

      {/* Lista Ranking */}
      <div className="flex flex-col gap-2 mt-2">
        {ranking.map((row, idx) => {
          const pos = idx + 1;
          const isTop3 = pos <= 3;
          const isMe = row.id === me?.id;

          return (
            <div 
              key={row.id}
              className={`bg-[#0F0F0F] border border-[#222225] p-4 rounded-2xl flex items-center justify-between transition-all ${isMe && 'opacity-50 pointer-events-none'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 text-center font-black text-sm ${pos === 1 ? 'text-[#FFE600]' : pos === 2 ? 'text-zinc-300' : pos === 3 ? 'text-orange-400' : 'text-[#555558]'}`}>
                  {pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : pos}
                </div>
                <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#222225] flex items-center justify-center font-black text-white text-xs uppercase">
                  {row.full_name[0]}
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-white truncate max-w-[100px]">{row.full_name}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[#555558] text-[9px] font-bold uppercase">@{row.username}</span>
                    <span className="text-[#22C55E] text-[9px] font-black flex items-center gap-0.5"><Flame size={8}/> {row.current_streak}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-black text-sm">{row.weekly_volume.toLocaleString()}</p>
                <p className="text-[#555558] text-[8px] font-black uppercase tracking-tighter">kg movidos</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}