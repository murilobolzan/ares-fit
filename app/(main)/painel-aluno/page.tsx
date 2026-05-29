'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  User, Search, Dumbbell, Star, MessageSquare, Send, ArrowRight, Loader2, Play 
} from 'lucide-react';
import ProGate from '@/components/ui/ProGate';

export default function PainelAlunoPage() {
  const router = useRouter();
  const supabase = createClient();

  // Estados de Controle Global
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Estados das Conexões
  const [vincAtivo, setVincAtivo] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [statusRequest, setStatusRequest] = useState<string | null>(null);

  // Fichas, Feedbacks e Chat
  const [routines, setRoutines] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      await checkRelationship(currentUser.id);
      setLoading(false);
    };
    init();
  }, [router, supabase]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Realtime para Mensagens do Chat com o Personal
  useEffect(() => {
    if (!vincAtivo || !user) return;

    // Marcar lidas
    const markAsRead = async () => {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', vincAtivo.trainer_id)
        .eq('receiver_id', user.id);
    };
    markAsRead();

    const channel = supabase
      .channel(`chat_aluno_${user.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages' 
      }, (payload) => {
        const msg = payload.new;
        if (
          (msg.sender_id === user.id && msg.receiver_id === vincAtivo.trainer_id) ||
          (msg.sender_id === vincAtivo.trainer_id && msg.receiver_id === user.id)
        ) {
          setChatMessages(prev => [...prev, msg]);
          if (msg.sender_id === vincAtivo.trainer_id) {
            markAsRead();
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vincAtivo, user, supabase]);

  const checkRelationship = async (studentId: string) => {
    // Busca vínculo ativo ou pendente
    const { data: relationship } = await supabase
      .from('trainer_students')
      .select('*, trainer:profiles!trainer_students_trainer_id_fkey(id, full_name, username)')
      .eq('student_id', studentId)
      .in('status', ['active', 'pending'])
      .maybeSingle();

    if (relationship) {
      if (relationship.status === 'active') {
        setVincAtivo(relationship);
        await loadPersonalDashboard(studentId, relationship.trainer_id);
      } else {
        setStatusRequest('Sua solicitação está pendente de aprovação com o Personal.');
      }
    } else {
      setVincAtivo(null);
      setStatusRequest(null);
    }
  };

  const loadPersonalDashboard = async (studentId: string, trainerId: string) => {
    // 1. Buscar fichas atribuídas por este personal
    const { data: routs } = await supabase
      .from('workout_routines')
      .select('*')
      .eq('assigned_to', studentId)
      .eq('owner_id', trainerId);
    setRoutines(routs || []);

    // 2. Buscar últimos 10 feedbacks recebidos
    const { data: feeds } = await supabase
      .from('workout_feedback')
      .select('*, workout_sessions(finished_at, workout_routines(name))')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(10);
    setFeedbacks(feeds || []);

    // 3. Histórico do Chat
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${studentId},receiver_id.eq.${trainerId}),and(sender_id.eq.${trainerId},receiver_id.eq.${studentId})`)
      .order('created_at', { ascending: true });
    setChatMessages(messages || []);
  };

  // Debounce Manual de Pesquisa de Professores
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);

    const searchTrainers = async () => {
      const cleanQuery = searchQuery.trim().replace('@', '');
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .eq('account_type', 'trainer')
        .ilike('username', `%${cleanQuery}%`);
      setSearchResults(data || []);
      setSearchLoading(false);
    };

    const handler = setTimeout(() => {
      searchTrainers();
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery, supabase]);

  const handleRequestLink = async (trainerId: string) => {
    if (!user) return;
    setActionLoading(true);
    await supabase.from('trainer_students').insert({
      trainer_id: trainerId,
      student_id: user.id,
      status: 'pending'
    });
    setStatusRequest('Solicitação enviada! Aguarde a aprovação do profissional.');
    setActionLoading(false);
  };

  const handleUnlink = async () => {
    if (!vincAtivo || !window.confirm('Deseja realmente romper o vínculo com seu personal?')) return;
    setActionLoading(true);
    await supabase.from('trainer_students').delete().eq('id', vincAtivo.id);
    setVincAtivo(null);
    setStatusRequest(null);
    setRoutines([]);
    setFeedbacks([]);
    setChatMessages([]);
    setActionLoading(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !vincAtivo || !user) return;
    const text = newMessage.trim();
    setNewMessage('');

    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: vincAtivo.trainer_id,
      content: text
    });
  };

  const handleStartWorkout = async (rotina: any) => {
    if (!user) return;
    setActionLoading(true);
    
    // Inicia treino padrão via ficha
    const { data: session } = await supabase
      .from('workout_sessions')
      .insert({ user_id: user.id, routine_id: rotina.id, status: 'in_progress', total_volume_kg: 0 })
      .select().single();

    if (session) {
      // Buscar exercícios para injeção inicial de séries
      const { data: routineExs } = await supabase
        .from('routine_exercises')
        .select('*')
        .eq('routine_id', rotina.id);

      const setsToInsert: any[] = [];
      (routineExs || []).forEach(ex => {
        for (let i = 1; i <= (ex.target_sets || 3); i++) {
          setsToInsert.push({
            session_id: session.id,
            exercise_id: ex.exercise_id,
            exercise_name: ex.exercise_name,
            set_number: i,
            weight_kg: 0,
            reps: ex.target_reps || 12,
            completed: false,
            set_type: 'normal'
          });
        }
      });

      if (setsToInsert.length > 0) {
        await supabase.from('workout_sets').insert(setsToInsert);
      }

      router.push(`/fichas/treino/${session.id}`);
    }
    setActionLoading(false);
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-[#FFE600]" /></div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pt-6 max-w-sm mx-auto flex flex-col gap-6 pb-20">
      
      {/* HEADER */}
      <header className="px-2">
        <h1 className="text-2xl font-black uppercase tracking-widest">Meu Personal</h1>
      </header>

      {/* SEÇÃO 1: CASO NÃO TENHA PERSONAL VINCULADO */}
      {!vincAtivo && (
        <section className="flex flex-col gap-4 flex-1 justify-start">
          <div className="bg-[#0F0F0F] border border-[#222225] rounded-3xl p-5 text-center space-y-2">
            <User size={40} className="text-[#555558] mx-auto" />
            <p className="text-sm font-bold text-white">Você não tem um personal vinculado.</p>
            <p className="text-xs text-[#A1A1AA]">Digite o username exato fornecido pelo seu treinador para conectar seu perfil.</p>
          </div>

          {statusRequest ? (
            <div className="bg-[#FF9F0A]/10 border border-[#FF9F0A]/30 p-4 rounded-2xl text-center">
              <p className="text-[#FF9F0A] text-xs font-bold uppercase">{statusRequest}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555558]" size={18} />
                <input 
                  type="text" placeholder="Buscar personal pelo username..." value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full h-14 bg-[#1A1A1A] border border-[#222225] rounded-2xl pl-12 pr-4 text-sm text-white placeholder-[#555558] outline-none focus:border-[#FFE600]"
                />
              </div>

              {searchLoading && <div className="flex justify-center py-4"><Loader2 className="animate-spin text-[#FFE600]"/></div>}

              <div className="flex flex-col gap-2">
                {searchResults.map(p => (
                  <div key={p.id} className="bg-[#0F0F0F] border border-[#222225] p-4 rounded-2xl flex justify-between items-center animate-fade-in">
                    <div>
                      <p className="text-sm font-bold text-white">{p.full_name}</p>
                      <p className="text-xs text-[#A1A1AA]">@{p.username}</p>
                    </div>
                    <button 
                      onClick={() => handleRequestLink(p.id)} disabled={actionLoading}
                      className="bg-[#FFE600] text-black font-black text-[10px] uppercase tracking-widest px-4 h-9 rounded-xl flex items-center gap-1 active:scale-95 transition-all"
                    >
                      Vincular <ArrowRight size={12}/>
                    </button>
                  </div>
                ))}
                {searchQuery.trim() !== '' && searchResults.length === 0 && !searchLoading && (
                  <p className="text-center text-xs text-[#555558] py-4">Nenhum profissional com esse username encontrado.</p>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* SEÇÃO 2: CARD SE JÁ EXISTE PERSONAL VINCULADO */}
      {vincAtivo && (
        <div className="flex flex-col gap-6 animate-fade-in">
          
          <section className="bg-[#0F0F0F] border border-[#222225] p-4 rounded-3xl flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#1A1A1A] border border-[#222225] rounded-full flex items-center justify-center font-black text-[#FFE600] text-sm">
                {vincAtivo.trainer?.full_name?.substring(0,2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase">{vincAtivo.trainer?.full_name}</h3>
                <p className="text-xs text-[#A1A1AA]">@{vincAtivo.trainer?.username}</p>
              </div>
            </div>
            <button 
              onClick={handleUnlink} disabled={actionLoading}
              className="text-[#FF3B30] text-[10px] font-black uppercase tracking-widest bg-[#FF3B30]/10 border border-[#FF3B30]/20 px-3 py-2 rounded-xl"
            >
              Desvincular
            </button>
          </section>

          {/* SEÇÃO 3: FICHAS EXCLUSIVAS DO PERSONAL */}
          <section className="flex flex-col gap-3">
            <h2 className="text-[#555558] text-[10px] font-black uppercase tracking-widest pl-2">Minhas Planilhas Customizadas</h2>
            {routines.length === 0 ? (
              <p className="text-xs text-[#555558] italic pl-2">Seu personal ainda não atribuiu planilhas de treino para você.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {routines.map(r => (
                  <div key={r.id} className="bg-[#0F0F0F] border border-[#222225] p-4 rounded-2xl flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-black uppercase text-white">{r.name}</h4>
                      <p className="text-[10px] text-[#A1A1AA] uppercase font-bold mt-0.5">Criada pelo Coach</p>
                    </div>
                    <button 
                      onClick={() => handleStartWorkout(r)} disabled={actionLoading}
                      className="bg-[#FFE600] text-black rounded-full p-2.5 shadow-[0_0_15px_rgba(255,230,0,0.2)]"
                    >
                      <Play size={16} fill="currentColor" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SEÇÃO 4: FEEDBACKS TÉCNICOS RECEBIDOS */}
          <section className="flex flex-col gap-3">
            <h2 className="text-[#FFE600] text-[10px] font-black uppercase tracking-widest pl-2">Avaliações do Coach ({feedbacks.length})</h2>
            {feedbacks.length === 0 ? (
              <p className="text-xs text-[#555558] italic pl-2">Você ainda não recebeu correções técnicas em seus treinos.</p>
            ) : (
              <div className="flex flex-col gap-3 max-h-48 overflow-y-auto hide-scroll pr-1">
                {feedbacks.map(f => (
                  <div key={f.id} className="bg-[#0F0F0F] border border-[#222225] p-3 rounded-2xl flex flex-col gap-1.5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-[#FFE600] text-black text-[8px] font-black uppercase px-2 py-0.5 rounded-bl-lg">Personal</div>
                    <p className="text-[9px] text-[#555558] font-black uppercase">
                      {f.workout_sessions?.workout_routines?.name || 'Treino Livre'} · {new Date(f.created_at).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-xs text-[#A1A1AA] leading-relaxed italic">"{f.message}"</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SEÇÃO 5: CHAT INTEGRADO ENVOLVIDO COM PROGATE */}
          <section className="flex flex-col gap-3">
            <h2 className="text-[#555558] text-[10px] font-black uppercase tracking-widest pl-2">Mensagens Diretas com o Personal</h2>
            
            <ProGate feature="Chat com Personal">
              <div className="flex flex-col h-[40vh] justify-between border border-[#222225] bg-[#0F0F0F] rounded-3xl overflow-hidden">
                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                  {chatMessages.map(msg => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${isMe ? 'bg-[#FFE600] text-black self-end rounded-tr-none' : 'bg-[#1A1A1A] text-white self-start rounded-tl-none'}`}>
                        {msg.content}
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-2 bg-black border-t border-[#222225] flex gap-2">
                  <input 
                    type="text" placeholder="Escrever resposta..." value={newMessage} 
                    onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' ? handleSendMessage() : null}
                    className="flex-1 bg-[#1A1A1A] border border-[#222225] text-xs text-white rounded-xl px-4 outline-none focus:border-[#FFE600]"
                  />
                  <button onClick={handleSendMessage} className="w-10 h-10 bg-[#FFE600] text-black rounded-xl flex items-center justify-center">
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </ProGate>
          </section>

        </div>
      )}

    </div>
  );
}