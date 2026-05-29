'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Users, Shield, Clock, Check, X, ChevronRight, Dumbbell, 
  TrendingUp, MessageSquare, Send, Copy, CheckCircle2, UserCheck, Loader2 
} from 'lucide-react';
import { useToast } from '@/lib/hooks/useToast';
import { EmptyState } from '@/components/ui/EmptyState';

export default function PainelPTPage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [trainerProfile, setTrainerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [activeStudents, setActiveStudents] = useState<any[]>([]);

  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'treinos' | 'fichas' | 'evolucao' | 'chat'>('treinos');
  
  const [studentSessions, setStudentSessions] = useState<any[]>([]);
  const [studentRoutines, setStudentRoutines] = useState<any[]>([]);
  const [trainerTemplates, setTrainerTemplates] = useState<any[]>([]);
  const [studentWeights, setStudentWeights] = useState<any[]>([]);
  const [studentPhotos, setStudentPhotos] = useState<any[]>([]);
  
  const [feedbackText, setFeedbackText] = useState<Record<string, string>>({});
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkTrainer = async () => {
      setLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
      setTrainerProfile(profile);

      if (profile && profile.account_type === 'trainer') {
        await loadDashboardData(currentUser.id);
      }
      setLoading(false);
    };
    checkTrainer();
  }, [router, supabase]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (!selectedStudent || activeTab !== 'chat' || !user) return;

    const markAsRead = async () => {
      await supabase.from('messages').update({ read: true }).eq('sender_id', selectedStudent.id).eq('receiver_id', user.id);
    };
    markAsRead();

    const channel = supabase
      .channel(`chat_pt_${selectedStudent.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new;
        if ((msg.sender_id === user.id && msg.receiver_id === selectedStudent.id) || (msg.sender_id === selectedStudent.id && msg.receiver_id === user.id)) {
          setChatMessages(prev => [...prev, msg]);
          if (msg.sender_id === selectedStudent.id) markAsRead();
        }
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedStudent, activeTab, user, supabase]);

  const loadDashboardData = async (trainerId: string) => {
    const { data: pending } = await supabase.from('trainer_students').select('*, student:profiles!trainer_students_student_id_fkey(id, full_name, username, avatar_url)').eq('trainer_id', trainerId).eq('status', 'pending');
    setPendingRequests(pending || []);

    const today = new Date().toISOString().split('T')[0];
    const { data: active } = await supabase.from('trainer_students').select('*, student:profiles!trainer_students_student_id_fkey(id, full_name, username, avatar_url)').eq('trainer_id', trainerId).eq('status', 'active');

    if (active) {
      const activeWithStatus = await Promise.all(active.map(async (vinc: any) => {
        const { data: sessions } = await supabase.from('workout_sessions').select('id').eq('user_id', vinc.student_id).eq('status', 'completed').gte('finished_at', `${today}T00:00:00Z`);
        return { ...vinc, treinouHoje: (sessions || []).length > 0 };
      }));
      setActiveStudents(activeWithStatus);
    }
  };

  const handleRequest = async (id: string, newStatus: 'active' | 'removed') => {
    setActionLoading(true);
    try {
      await supabase.from('trainer_students').update({ status: newStatus }).eq('id', id);
      
      if (newStatus === 'active') {
        const studentId = pendingRequests.find(req => req.id === id)?.student_id;
        if (studentId) {
          await fetch('/api/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userId: studentId, 
              title: 'Vínculo Aprovado! 💪', 
              body: `Seu treinador ${trainerProfile?.full_name || ''} aceitou sua solicitação.`,
              url: '/painel-aluno'
            })
          });
        }
        showToast('Aluno vinculado com sucesso.', 'success');
      } else {
        showToast('Solicitação recusada.', 'info');
      }

      if (user) await loadDashboardData(user.id);
    } catch(err) {
      showToast('Erro ao processar solicitação.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenStudentModal = async (student: any) => {
    setSelectedStudent(student);
    setActiveTab('treinos');
    await loadStudentData(student.id);
  };

  const loadStudentData = async (studentId: string) => {
    if (!user) return;
    const { data: sessions } = await supabase.from('workout_sessions').select('*, workout_routines(name)').eq('user_id', studentId).eq('status', 'completed').order('finished_at', { ascending: false }).limit(5);
    setStudentSessions(sessions || []);

    const { data: routines } = await supabase.from('workout_routines').select('*').eq('assigned_to', studentId);
    setStudentRoutines(routines || []);

    const { data: templates } = await supabase.from('workout_routines').select('*').eq('owner_id', user.id).is('assigned_to', null);
    setTrainerTemplates(templates || []);

    const { data: weights } = await supabase.from('body_weight_logs').select('*').eq('user_id', studentId).order('logged_at', { ascending: true });
    setStudentWeights(weights || []);

    const { data: photos } = await supabase.from('progress_photos').select('*').eq('user_id', studentId).eq('visible_to_trainer', true).order('taken_at', { ascending: false });
    setStudentPhotos(photos || []);

    const { data: messages } = await supabase.from('messages').select('*').or(`and(sender_id.eq.${user.id},receiver_id.eq.${studentId}),and(sender_id.eq.${studentId},receiver_id.eq.${user.id})`).order('created_at', { ascending: true });
    setChatMessages(messages || []);
  };

  const handleSendFeedback = async (sessionId: string) => {
    const text = feedbackText[sessionId];
    if (!text?.trim() || !selectedStudent || !user) return;

    try {
      await supabase.from('workout_feedback').insert({
        session_id: sessionId,
        trainer_id: user.id,
        student_id: selectedStudent.id,
        message: text.trim()
      });

      await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: selectedStudent.id, 
          title: 'Novo Feedback Técnico 📋', 
          body: `Seu coach ${trainerProfile?.full_name || ''} deixou comentários em seu treino recente.`,
          url: '/painel-aluno'
        })
      });

      setFeedbackText(prev => ({ ...prev, [sessionId]: '' }));
      showToast('Feedback enviado com sucesso!', 'success');
    } catch (err) {
      showToast('Erro ao enviar feedback.', 'error');
    }
  };

  const handleAssignRoutine = async (routineId: string) => {
    if (!selectedStudent) return;
    await supabase.from('workout_routines').update({ assigned_to: selectedStudent.id }).eq('id', routineId);
    await loadStudentData(selectedStudent.id);
    showToast('Ficha atribuída.', 'success');
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedStudent || !user) return;
    const text = newMessage.trim();
    setNewMessage('');
    await supabase.from('messages').insert({ sender_id: user.id, receiver_id: selectedStudent.id, content: text });
  };

  const copyUsername = () => {
    if (!trainerProfile?.username) return;
    navigator.clipboard.writeText(trainerProfile.username);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Username copiado!', 'info');
  };

  const renderWeightGraph = () => {
    if (studentWeights.length < 2) return null;
    const w = 300; const h = 100; const pad = 12;
    const weightsArr = studentWeights.map(d => d.weight_kg);
    const maxW = Math.max(...weightsArr);
    const minW = Math.min(...weightsArr);
    const range = maxW - minW || 1;
    const points = studentWeights.map((d, i) => {
      const x = pad + (i / (studentWeights.length - 1)) * (w - pad * 2);
      const y = h - pad - ((d.weight_kg - minW) / range) * (h - pad * 2);
      return `${x},${y}`;
    });

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24 overflow-visible">
        <path d={`M ${points.join(' L ')}`} stroke="#FFE600" strokeWidth="2" fill="none" />
        {studentWeights.map((d, i) => {
          const x = pad + (i / (studentWeights.length - 1)) * (w - pad * 2);
          const y = h - pad - ((d.weight_kg - minW) / range) * (h - pad * 2);
          return <circle key={d.id} cx={x} cy={y} r="3" fill="#000" stroke="#FFE600" strokeWidth="1.5" />;
        })}
      </svg>
    );
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-[#FFE600]" /></div>;

  if (!trainerProfile || (trainerProfile.account_type !== 'trainer' && trainerProfile.account_type !== 'pending_trainer')) {
    return (
      <main className="min-h-screen bg-black text-white p-6 flex flex-col justify-center items-center text-center max-w-sm mx-auto">
        <Shield size={64} className="text-[#FF3B30] mb-4" />
        <h1 className="text-xl font-black uppercase tracking-widest mb-2">Acesso Restrito</h1>
        <p className="text-[#A1A1AA] text-sm leading-relaxed">Esta área é exclusiva para Personal Trainers cadastrados na plataforma.</p>
      </main>
    );
  }

  if (trainerProfile.account_type === 'pending_trainer') {
    return (
      <main className="min-h-screen bg-black text-white p-6 flex flex-col justify-center items-center text-center max-w-sm mx-auto">
        <Clock size={64} className="text-[#FF9F0A] mb-4 animate-pulse" />
        <h1 className="text-xl font-black uppercase tracking-widest mb-2">Análise em Andamento</h1>
        <p className="text-[#A1A1AA] text-sm leading-relaxed">Seu registro profissional do CREF está sendo validado. Retorne em breve.</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pt-6 max-w-sm mx-auto flex flex-col gap-6 pb-24">
      <header className="flex justify-between items-end px-2">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest">Meus Alunos</h1>
          <p className="text-[#A1A1AA] text-xs font-bold mt-0.5 uppercase">{activeStudents.length} vinculados ativos</p>
        </div>
      </header>

      {pendingRequests.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[#FF9F0A] text-[10px] font-black uppercase tracking-widest pl-2">Pendentes de Vínculo ({pendingRequests.length})</h2>
          <div className="flex flex-col gap-2">
            {pendingRequests.map(req => (
              <div key={req.id} className="bg-[#0F0F0F] border border-[#222225] p-3 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center font-bold text-white uppercase">
                    {req.student?.full_name?.substring(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{req.student?.full_name}</p>
                    <p className="text-[#A1A1AA] text-xs">@{req.student?.username}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleRequest(req.id, 'active')} disabled={actionLoading} className="p-2 bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] rounded-xl"><Check size={16}/></button>
                  <button onClick={() => handleRequest(req.id, 'removed')} disabled={actionLoading} className="p-2 bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30] rounded-xl"><X size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3 flex-1">
        <h2 className="text-[#555558] text-[10px] font-black uppercase tracking-widest pl-2">Lista Geral de Alunos</h2>
        {activeStudents.length === 0 ? (
          <EmptyState 
            emoji="👥" 
            title="Nenhum Aluno" 
            description="Compartilhe seu username abaixo para que os atletas possam encontrá-lo e solicitar vínculo."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {activeStudents.map(item => (
              <div key={item.id} className="bg-[#0F0F0F] border border-[#222225] p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-[#222225] flex items-center justify-center font-black text-white text-sm">
                    {item.student?.full_name?.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{item.student?.full_name}</h3>
                    <p className="text-xs text-[#A1A1AA] mb-1">@{item.student?.username}</p>
                    {item.treinouHoje ? (
                      <span className="text-[10px] text-[#22C55E] font-black uppercase">✅ Treinou Hoje</span>
                    ) : (
                      <span className="text-[10px] text-[#555558] font-black uppercase">😴 Não Treinou</span>
                    )}
                  </div>
                </div>
                <button onClick={() => handleOpenStudentModal(item.student)} className="p-3 bg-[#1A1A1A] border border-[#222225] rounded-xl text-[#A1A1AA] hover:text-white">
                  <ChevronRight size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
        {activeStudents.length === 0 && (
           <button onClick={copyUsername} className="w-full mt-4 h-12 bg-[#1A1A1A] border border-[#222225] rounded-xl flex items-center justify-center gap-2 text-sm font-mono text-[#FFE600]">
             {copied ? <CheckCircle2 size={16} className="text-[#22C55E]"/> : <Copy size={16}/>} @{trainerProfile.username}
           </button>
        )}
      </section>

      {selectedStudent && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col animate-slide-up max-w-sm mx-auto border-x border-[#222225]">
          <div className="px-4 py-4 border-b border-[#222225] flex items-center justify-between bg-black">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center font-bold text-white text-xs">
                {selectedStudent.full_name?.substring(0,2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase">{selectedStudent.full_name}</h2>
                <p className="text-xs text-[#A1A1AA]">@{selectedStudent.username}</p>
              </div>
            </div>
            <button onClick={() => setSelectedStudent(null)} className="p-2 bg-[#1A1A1A] rounded-full border border-[#222225] text-[#A1A1AA]"><X size={20}/></button>
          </div>

          <div className="flex border-b border-[#222225] bg-black text-xs font-bold uppercase tracking-wider">
            {(['treinos', 'fichas', 'evolucao', 'chat'] as const).map(tab => (
              <button 
                key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-center border-b-2 transition-colors ${activeTab === tab ? 'border-[#FFE600] text-[#FFE600]' : 'border-transparent text-[#555558]'}`}
              >
                {tab === 'evolucao' ? 'Evolução' : tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {activeTab === 'treinos' && (
              <div className="flex flex-col gap-4">
                {studentSessions.length === 0 ? (
                  <p className="text-center text-[#555558] text-sm py-10">Nenhum treino concluído recentemente.</p>
                ) : (
                  studentSessions.map(sess => (
                    <div key={sess.id} className="bg-[#0F0F0F] border border-[#222225] p-4 rounded-2xl flex flex-col gap-3">
                      <div className="flex justify-between text-xs font-bold uppercase">
                        <span className="text-white">{sess.workout_routines?.name || 'Treino Livre'}</span>
                        <span className="text-[#555558]">{new Date(sess.finished_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex gap-4 text-xs font-medium text-[#A1A1AA]">
                        <span>Volume: <strong className="text-white">{sess.total_volume_kg}kg</strong></span>
                        <span>Pontuação: <strong className="text-[#FFE600]">★ {sess.rating || 0}/10</strong></span>
                      </div>
                      <div className="space-y-2 pt-2 border-t border-[#222225]">
                        <textarea 
                          placeholder="Digitar feedback técnico sobre este treino..."
                          value={feedbackText[sess.id] || ''}
                          onChange={(e) => setFeedbackText(prev => ({ ...prev, [sess.id]: e.target.value }))}
                          className="w-full bg-[#1A1A1A] border border-[#222225] rounded-xl p-3 text-xs text-white outline-none focus:border-[#FFE600] resize-none"
                          rows={2}
                        />
                        <button onClick={() => handleSendFeedback(sess.id)} className="w-full h-9 bg-[#1A1A1A] border border-[#FFE600] text-[#FFE600] font-bold text-[10px] uppercase tracking-widest rounded-lg">
                          Enviar Feedback
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'fichas' && (
              <div className="flex flex-col gap-4">
                <div>
                  <span className="text-[#555558] text-[9px] font-black uppercase tracking-widest block mb-2 pl-1">Atribuídas Atualmente</span>
                  {studentRoutines.length === 0 ? (
                    <p className="text-xs text-[#A1A1AA] italic pl-1">Nenhuma rotina atribuída a este atleta.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {studentRoutines.map(r => (
                        <div key={r.id} className="bg-[#0F0F0F] border border-[#222225] p-3 rounded-xl flex justify-between items-center">
                          <span className="text-sm font-bold text-white uppercase">{r.name}</span>
                          <span className="text-[10px] bg-[#FFE600]/10 border border-[#FFE600]/30 text-[#FFE600] px-2 py-0.5 rounded-full font-black">ATIVO</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-[#222225]">
                  <span className="text-[#FFE600] text-[9px] font-black uppercase tracking-widest block mb-3 pl-1">Vincular Nova da sua Biblioteca</span>
                  {trainerTemplates.length === 0 ? (
                    <p className="text-xs text-[#555558] pl-1">Crie rotinas na aba "Fichas" sem atribuir aluno para gerar modelos.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {trainerTemplates.map(t => (
                        <div key={t.id} className="bg-[#0F0F0F] border border-[#222225] p-3 rounded-xl flex justify-between items-center">
                          <span className="text-xs font-bold text-white uppercase">{t.name}</span>
                          <button onClick={() => handleAssignRoutine(t.id)} className="bg-[#FFE600] text-black text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg">
                            Vincular
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'evolucao' && (
              <div className="flex flex-col gap-5">
                <div className="bg-[#0F0F0F] border border-[#222225] p-4 rounded-2xl">
                  <span className="text-[#555558] text-[9px] font-black uppercase tracking-widest block mb-3">Histórico de Peso</span>
                  {studentWeights.length < 2 ? (
                    <p className="text-xs text-[#A1A1AA] italic">Dados insuficientes para gerar gráfico de pesagem (mínimo 2 registros).</p>
                  ) : (
                    <div className="bg-black border border-[#222225] rounded-xl p-3">{renderWeightGraph()}</div>
                  )}
                </div>

                <div>
                  <span className="text-[#555558] text-[9px] font-black uppercase tracking-widest block mb-2 pl-1">Galeria de Fotos Permitidas</span>
                  {studentPhotos.length === 0 ? (
                    <p className="text-xs text-[#555558] italic pl-1">O aluno não disponibilizou fotos de progresso para o treinador.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {studentPhotos.map(f => (
                        <div key={f.id} className="aspect-square bg-[#1A1A1A] border border-[#222225] rounded-xl overflow-hidden relative">
                          <img src={f.photo_url} alt="Progresso Aluno" className="w-full h-full object-cover" />
                          <div className="absolute bottom-1 right-2 bg-black/70 px-2 py-0.5 rounded text-[9px] text-white font-mono">
                            {new Date(f.taken_at).toLocaleDateString('pt-BR', {day:'2-digit', month:'short'})}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="flex flex-col h-[55vh] justify-between border border-[#222225] bg-[#0F0F0F] rounded-2xl overflow-hidden">
                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                  {chatMessages.map(msg => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${isMe ? 'bg-[#FFE600] text-black self-end rounded-tr-none' : 'bg-[#1A1A1A] text-white self-start rounded-tl-none'}`}>
                        {msg.content}
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-2 bg-black border-t border-[#222225] flex gap-2">
                  <input 
                    type="text" placeholder="Escreva uma mensagem..." value={newMessage} 
                    onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' ? handleSendMessage() : null}
                    className="flex-1 bg-[#1A1A1A] border border-[#222225] text-xs text-white rounded-xl px-4 outline-none focus:border-[#FFE600]"
                  />
                  <button onClick={handleSendMessage} className="w-10 h-10 bg-[#FFE600] text-black rounded-xl flex items-center justify-center transition-all active:scale-90">
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}