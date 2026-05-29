'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Trophy, Lock, Activity, ArrowLeft, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ConquistasPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [allAchievements, setAllAchievements] = useState<any[]>([]);
  const [userUnlockedIds, setUserUnlockedIds] = useState<string[]>([]);
  const [filter, setFilter] = useState('Todas');

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [achRes, userAchRes] = await Promise.all([
        supabase.from('achievements').select('*'),
        supabase.from('user_achievements').select('achievement_id').eq('user_id', user.id)
      ]);

      setAllAchievements(achRes.data || []);
      setUserUnlockedIds(userAchRes.data?.map((a: any) => a.achievement_id) || []);
      setLoading(false);
    };
    fetchData();
  }, [supabase]);

  const categories = ['Todas', 'Consistência', 'Volume', 'Força', 'Intensidade', 'Social'];
  
  const filtered = allAchievements.filter(ach => 
    filter === 'Todas' || ach.category.toLowerCase() === filter.toLowerCase()
  );

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Activity className="animate-spin text-[#FFE600]" /></div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24 max-w-sm mx-auto flex flex-col gap-8">
      <header className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 bg-[#0F0F0F] border border-[#222225] rounded-full"><ArrowLeft size={20}/></button>
        <h1 className="text-2xl font-black uppercase tracking-widest">Conquistas</h1>
      </header>

      {/* Progresso Geral */}
      <section className="bg-[#0F0F0F] border border-[#222225] rounded-3xl p-5">
        <div className="flex justify-between items-end mb-3">
          <p className="text-xs font-black uppercase text-[#555558] tracking-widest">Progresso Total</p>
          <p className="text-[#FFE600] font-black text-lg">{userUnlockedIds.length} / {allAchievements.length}</p>
        </div>
        <div className="w-full h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#FFE600] shadow-[0_0_10px_rgba(255,230,0,0.5)] transition-all duration-1000"
            style={{ width: `${(userUnlockedIds.length / allAchievements.length) * 100}%` }}
          />
        </div>
      </section>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto hide-scroll pb-2 -mx-2 px-2">
        {categories.map(cat => (
          <button 
            key={cat} onClick={() => setFilter(cat)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${filter === cat ? 'bg-[#FFE600] text-black' : 'bg-[#0F0F0F] text-[#555558] border border-[#222225]'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map(ach => {
          const isUnlocked = userUnlockedIds.includes(ach.id);
          return (
            <div 
              key={ach.id}
              className={`bg-[#0F0F0F] border p-4 rounded-3xl flex flex-col items-center text-center gap-3 transition-all ${isUnlocked ? 'border-[#FFE600]/30 opacity-100' : 'border-[#222225] opacity-40'}`}
            >
              <span className={`text-4xl ${!isUnlocked && 'grayscale brightness-50'}`}>{ach.emoji}</span>
              <div>
                <h4 className={`text-[11px] font-black uppercase tracking-tight leading-none mb-1 ${isUnlocked ? 'text-white' : 'text-[#555558]'}`}>
                  {ach.name}
                </h4>
                <p className="text-[9px] text-[#A1A1AA] leading-tight line-clamp-2">{ach.description}</p>
              </div>
              {!isUnlocked && <Lock size={12} className="text-[#555558] mt-1" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}