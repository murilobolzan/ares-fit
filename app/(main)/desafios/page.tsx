'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Target, Gift, Users, CheckCircle2 } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [participations, setParticipations] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function loadChallenges() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data: chalData } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString())
        .order('end_date', { ascending: true });

      if (user) {
        const { data: partData } = await supabase
          .from('challenge_participants')
          .select('*')
          .eq('user_id', user.id);
        
        if (partData) {
          const pMap: Record<string, any> = {};
          partData.forEach(p => pMap[p.challenge_id] = p);
          setParticipations(pMap);
        }
      }

      if (chalData) setChallenges(chalData);
      setLoading(false);
    }
    loadChallenges();
  }, []);

  const joinChallenge = async (challengeId: string) => {
    if (!currentUser) return;
    const { data, error } = await supabase
      .from('challenge_participants')
      .insert({ challenge_id: challengeId, user_id: currentUser.id })
      .select()
      .single();

    if (data && !error) {
      setParticipations(prev => ({ ...prev, [challengeId]: data }));
    }
  };

  const getDaysLeft = (endDate: string) => {
    const diff = new Date(endDate).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days > 0 ? `${days} dias restantes` : 'Termina hoje';
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans max-w-2xl mx-auto space-y-6">
      <header className="py-2">
        <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
          Desafios <Target className="w-6 h-6 text-[#FFE600]" />
        </h1>
        <p className="text-xs text-[#A1A1AA] mt-0.5">Cumpra missões semanais e desbloqueie conquistas.</p>
      </header>

      {loading ? (
        <p className="text-xs text-[#A1A1AA]">Mapeando desafios ativos...</p>
      ) : (
        <div className="space-y-4">
          {challenges.map((chal) => {
            const part = participations[chal.id];
            const isCompleted = part?.completed;
            const progressPct = part ? Math.min(100, (Number(part.current_value) / chal.target_value) * 100) : 0;

            return (
              <div key={chal.id} className={`bg-[#0F0F0F] border rounded-2xl p-5 relative overflow-hidden transition-all ${isCompleted ? 'border-[#FFE600]/50' : 'border-[#222225]'}`}>
                {/* Efeito Glow de Fundo se completo */}
                {isCompleted && <div className="absolute inset-0 bg-[#FFE600]/5 z-0" />}
                
                <div className="relative z-10 flex gap-4">
                  <div className="w-16 h-16 bg-black border border-[#222225] rounded-2xl flex items-center justify-center text-3xl shadow-lg shrink-0">
                    {chal.emoji}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-black text-white leading-tight">{chal.title}</h3>
                        <p className="text-[10px] text-[#A1A1AA] mt-0.5">{getDaysLeft(chal.end_date)}</p>
                      </div>
                      {isCompleted && <CheckCircle2 className="w-5 h-5 text-[#FFE600]" />}
                    </div>
                    
                    <p className="text-xs text-[#A1A1AA] leading-relaxed">{chal.description}</p>
                    
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#FFE600] bg-[#FFE600]/10 w-fit px-2 py-1 rounded">
                      <Gift className="w-3 h-3" /> {chal.reward_description}
                    </div>

                    {/* Progress / Actions */}
                    <div className="pt-3 mt-3 border-t border-[#1A1A1A]">
                      {!part ? (
                        <button 
                          onClick={() => joinChallenge(chal.id)}
                          className="w-full h-10 bg-white text-black text-xs font-black uppercase tracking-wider hover:bg-[#FFE600] transition-colors"
                          style={{ borderRadius: '100px' }}
                        >
                          Participar do Desafio
                        </button>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-mono font-bold">
                            <span className={isCompleted ? 'text-[#FFE600]' : 'text-[#A1A1AA]'}>
                              {isCompleted ? 'DESAFIO CONCLUÍDO' : 'PROGRESSO'}
                            </span>
                            <span className="text-white">{Number(part.current_value).toFixed(1)} / {chal.target_value}</span>
                          </div>
                          <div className="w-full h-2 bg-black rounded-full overflow-hidden border border-[#222225]">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${isCompleted ? 'bg-[#FFE600]' : 'bg-[#22D3EE]'}`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}