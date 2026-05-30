'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Dumbbell, 
  TrendingUp, 
  Activity, 
  Camera, 
  Users, 
  Flame, 
  Sparkles, 
  Check, 
  X, 
  Shield, 
  Star, 
  Award, 
  Smartphone, 
  ArrowRight, 
  MessageSquare, 
  Menu 
} from 'lucide-react';

// Hook personalizado simplificado para animação de fade-in via Intersection Observer
function useIntersectionObserver() {
  const ref = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isIntersecting };
}

// Componente de número animado para a prova social
function AnimatedCounter({ value, duration = 2000 }: { value: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const numericValue = parseInt(value.replace(/[^0-9]/g, ''), 10);
  const suffix = value.replace(/[0-9]/g, '');

  useEffect(() => {
    let startTimestamp: number | null = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && ref.current) {
          const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const currentCount = Math.floor(progress * numericValue);
            
            if (ref.current) {
              ref.current.innerText = currentCount.toLocaleString('pt-BR') + suffix;
            }

            if (progress < 1) {
              window.requestAnimationFrame(step);
            }
          };
          window.requestAnimationFrame(step);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [numericValue, suffix, duration]);

  return <span ref={ref} className="text-4xl md:text-5xl font-black text-[#FFE600] font-mono">0</span>;
}

export default function LandingPage() {
  const [billing, setBilling] = useState<'mensal' | 'anual'>('anual');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sectionHero = useIntersectionObserver();
  const sectionFeatures = useIntersectionObserver();
  const sectionTrainers = useIntersectionObserver();
  const sectionPricing = useIntersectionObserver();
  const sectionTestimonials = useIntersectionObserver();
  const sectionCta = useIntersectionObserver();

  // Ativa comportamento de scroll suave no documento cliente
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#000000] text-[#FFFFFF] antialiased selection:bg-[#FFE600]/30 selection:text-white">
      
      {/* ======================= NAVBAR FIXA ======================= */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-[#222225] h-16 transition-all">
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="#" className="text-2xl font-black tracking-tighter">
            Ares<span className="text-[#FFE600]">Fit</span>
          </Link>

          {/* Links Desktop */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold uppercase tracking-wider text-[#A1A1AA]">
            <Link href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</Link>
            <Link href="#para-personals" className="hover:text-white transition-colors">Para Personals</Link>
            <Link href="#planos" className="hover:text-white transition-colors">Planos</Link>
          </div>

          {/* Botões Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="px-5 py-2.5 border border-[#FFE600] text-[#FFE600] rounded-[100px] text-xs font-bold uppercase tracking-widest hover:bg-[#FFE600]/10 transition-all active:scale-95">
              Entrar
            </Link>
            <Link href="/register" className="px-5 py-2.5 bg-[#FFE600] text-black rounded-[100px] text-xs font-black uppercase tracking-widest hover:bg-[#FFE600]/90 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,230,0,0.2)]">
              Começar grátis
            </Link>
          </div>

          {/* Mobile Navigation Trigger */}
          <div className="flex md:hidden items-center gap-3">
            <Link href="/register" className="px-4 py-2 bg-[#FFE600] text-black rounded-[100px] text-xs font-black uppercase tracking-widest active:scale-95">
              Começar
            </Link>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-[#A1A1AA] active:text-white">
              <Menu size={24} />
            </button>
          </div>
        </div>

        {/* Menu Retrátil Mobile */}
        {mobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-[#0F0F0F] border-b border-[#222225] flex flex-col p-6 gap-4 font-black uppercase text-center tracking-widest text-sm animate-slide-down md:hidden shadow-2xl">
            <Link href="#funcionalidades" onClick={() => setMobileMenuOpen(false)} className="py-2 text-[#A1A1AA] active:text-white">Funcionalidades</Link>
            <Link href="#para-personals" onClick={() => setMobileMenuOpen(false)} className="py-2 text-[#A1A1AA] active:text-white">Para Personals</Link>
            <Link href="#planos" onClick={() => setMobileMenuOpen(false)} className="py-2 text-[#A1A1AA] active:text-white">Planos</Link>
            <div className="h-px bg-[#222225] my-2" />
            <Link href="/login" className="py-3 border border-[#FFE600] text-[#FFE600] rounded-[100px]">Entrar</Link>
          </div>
        )}
      </nav>

      {/* ======================= SEÇÃO 1: HERO ======================= */}
      <section ref={sectionHero.ref} className="pt-32 pb-20 px-6 flex flex-col items-center relative overflow-hidden">
        
        {/* Ambient Glows */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#FFE600] rounded-full filter blur-[140px] opacity-10 pointer-events-none" />
        
        <div className={`max-w-3xl text-center flex flex-col items-center transition-all duration-1000 transform ${sectionHero.isIntersecting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          <div className="bg-[#FFE600]/10 border border-[#FFE600]/30 text-[#FFE600] rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wider mb-6 flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,230,0,0.05)]">
            <span>🔥</span> Explore sua vida fitness na palma da sua mão!
          </div>

          <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] flex flex-col mb-6">
            <span>Treine.</span>
            <span>Evolua.</span>
            <span className="text-[#FFE600] filter drop-shadow-[0_0_30px_rgba(255,230,0,0.15)]">Domine.</span>
          </h2>

          <p className="text-[#A1A1AA] text-base md:text-xl font-medium leading-relaxed max-w-xl mb-10">
            O ecossistema de academia mais completo do Brasil. Desenvolvido para todos os tipos de atleta e personal trainers que levam o planejamento a sério.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-16">
            <Link href="/register" className="h-14 px-8 bg-[#FFE600] text-black font-black uppercase tracking-widest text-sm rounded-[100px] flex items-center justify-center transition-all hover:bg-[#FFE600]/90 active:scale-95 shadow-[0_0_30px_rgba(255,230,0,0.25)]">
              Começar grátis
            </Link>
            <Link href="#funcionalidades" className="h-14 px-8 border border-[#222225] bg-[#0F0F0F]/50 text-[#A1A1AA] font-bold uppercase tracking-widest text-xs rounded-[100px] flex items-center justify-center transition-all hover:text-white hover:border-[#555558] active:scale-95">
              Ver funcionalidades ↓
            </Link>
          </div>
        </div>

        {/* Mockup do App */}
        <div className={`w-full max-w-sm px-4 md:px-0 transition-all duration-1000 delay-300 transform ${sectionHero.isIntersecting ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="w-full bg-[#0F0F0F] border-4 border-[#222225] rounded-[48px] p-4 relative shadow-[0_0_80px_rgba(255,230,0,0.1)] overflow-hidden aspect-[9/18]">
            
            {/* Notch e UI do Telefone */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-20 flex items-center justify-center" />
            
            <div className="h-full w-full flex flex-col bg-black rounded-[36px] p-4 pt-8 overflow-y-auto hide-scroll text-left">
              {/* Home Mockup Content */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-[10px] text-[#555558] font-bold uppercase tracking-wider block">Atleta AresFit</span>
                  <span className="text-sm font-black uppercase">Seu Nome</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-[#222225] flex items-center justify-center text-[10px] font-black text-[#FFE600]">SN</div>
              </div>

              {/* Streak Widget */}
              <div className="bg-[#0F0F0F] border border-[#222225] rounded-2xl p-4 flex items-center justify-between mb-4 relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#FFE600]/10 border border-[#FFE600]/20 flex items-center justify-center">
                    <Flame size={18} className="text-[#FFE600]" />
                  </div>
                  <div>
                    <span className="text-[9px] text-[#555558] font-black uppercase block">Ofensiva Atual</span>
                    <span className="text-sm font-black font-mono">14 DIAS</span>
                  </div>
                </div>
                <span className="text-[9px] font-black text-[#FFE600] bg-[#FFE600]/10 px-2 py-0.5 border border-[#FFE600]/20 rounded-full">⚡ RECORDE</span>
              </div>

              {/* Muscle Recovery Widget */}
              <div className="bg-[#0F0F0F] border border-[#222225] rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-[#555558] font-black uppercase tracking-wider">Recuperação Muscular</span>
                  <span className="text-[9px] text-[#22C55E] font-black uppercase">Pronto para Treinar</span>
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    { m: 'Peito', p: '94%', c: 'bg-[#22C55E]' },
                    { m: 'Tríceps', p: '88%', c: 'bg-[#22C55E]' },
                    { m: 'Ombros', p: '32%', c: 'bg-[#FF9F0A]' }
                  ].map((mus, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] font-medium">
                      <span className="text-[#A1A1AA] w-12">{mus.m}</span>
                      <div className="flex-1 h-1.5 bg-[#1A1A1A] rounded-full mx-3 overflow-hidden">
                        <div className={`h-full ${mus.c}`} style={{ width: mus.p }} />
                      </div>
                      <span className="text-white font-mono font-bold">{mus.p}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Session Simulation Banner */}
              <div className="mt-4 bg-[#FFE600]/10 border border-dashed border-[#FFE600]/30 rounded-2xl p-3 text-center">
                <span className="text-[9px] font-black uppercase text-[#FFE600] tracking-widest block mb-1">Treino Ativo Disponível</span>
                <span className="text-xs font-bold text-white uppercase block">Treino A — Hipertrofia Peitoral</span>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* ======================= SEÇÃO 2: PROVA SOCIAL / NÚMEROS ======================= */}
      <section className="bg-[#0F0F0F] border-y border-[#222225] py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-[#222225]">
          <div className="pt-4 md:pt-0">
            <p className="mb-1"><AnimatedCounter value="3+ Fichas" /></p>
            <p className="text-[#A1A1AA] text-xs font-bold uppercase tracking-widest">Acompanhe seus treinos!</p>
          </div>
          <div className="pt-6 md:pt-0">
            <p className="mb-1"><AnimatedCounter value="100+" /></p>
            <p className="text-[#A1A1AA] text-xs font-bold uppercase tracking-widest">Treinos Registrados</p>
          </div>
          <div className="pt-6 md:pt-0">
            <p className="mb-1 flex items-center justify-center gap-1">
              <AnimatedCounter value="4.9" /><span className="text-3xl font-black text-[#FFE600] -mt-1">★</span>
            </p>
            <p className="text-[#A1A1AA] text-xs font-bold uppercase tracking-widest">Avaliação Média</p>
          </div>
        </div>
      </section>

      {/* ======================= SEÇÃO 3: FUNCIONALIDADES ======================= */}
      <section id="funcionalidades" ref={sectionFeatures.ref} className="py-24 px-6 max-w-5xl mx-auto scroll-mt-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-2">Tudo que você precisa</h2>
          <p className="text-[#FFE600] text-sm font-bold uppercase tracking-widest">Em um só lugar</p>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-1000 transform ${sectionFeatures.isIntersecting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          <div className="bg-[#0F0F0F] border border-[#222225] rounded-3xl p-6 hover:border-[#FFE600]/40 transition-all flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] flex items-center justify-center text-[#FFE600]"><Dumbbell size={24}/></div>
            <h3 className="text-lg font-black uppercase text-white">Treino Ativo</h3>
            <p className="text-[#A1A1AA] text-sm leading-relaxed">Cronômetro de descanso regressivo automatizado, seletor de tipos de série (top set, drop set) e anotações atômicas.</p>
          </div>

          <div className="bg-[#0F0F0F] border border-[#222225] rounded-3xl p-6 hover:border-[#FFE600]/40 transition-all flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] flex items-center justify-center text-[#FFE600]"><TrendingUp size={24}/></div>
            <h3 className="text-lg font-black uppercase text-white">Progressão de Carga</h3>
            <p className="text-[#A1A1AA] text-sm leading-relaxed">Gráficos de volumetria e estimativa de 1RM por sessão. Identifique padrões claros e garanta a sobrecarga progressiva.</p>
          </div>

          <div className="bg-[#0F0F0F] border border-[#222225] rounded-3xl p-6 hover:border-[#FFE600]/40 transition-all flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] flex items-center justify-center text-[#FFE600]"><Activity size={24}/></div>
            <h3 className="text-lg font-black uppercase text-white">Mapa de Recuperação</h3>
            <p className="text-[#A1A1AA] text-sm leading-relaxed">Painel fisiológico baseado no tempo de restauração das fibras musculares. Saiba exatamente quando bater o PR.</p>
          </div>

          <div className="bg-[#0F0F0F] border border-[#222225] rounded-3xl p-6 hover:border-[#FFE600]/40 transition-all flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] flex items-center justify-center text-[#FFE600]"><Camera size={24}/></div>
            <h3 className="text-lg font-black uppercase text-white">Fotos de Progresso</h3>
            <p className="text-[#A1A1AA] text-sm leading-relaxed">Armazenamento privado e criptografado de imagens temporais. Modo comparador antes e depois integrado com pesagem do dia.</p>
          </div>

          <div className="bg-[#0F0F0F] border border-[#222225] rounded-3xl p-6 hover:border-[#FFE600]/40 transition-all flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] flex items-center justify-center text-[#FFE600]"><Users size={24}/></div>
            <h3 className="text-lg font-black uppercase text-white">Integração Coach</h3>
            <p className="text-[#A1A1AA] text-sm leading-relaxed">Conexão direta ponta-a-ponta. Seu personal monta e gerencia planilhas de treinos e analisa sua execução de forma remota.</p>
          </div>

          <div className="bg-[#0F0F0F] border border-[#222225] rounded-3xl p-6 hover:border-[#FFE600]/40 transition-all flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] flex items-center justify-center text-[#FFE600]"><Flame size={24}/></div>
            <h3 className="text-lg font-black uppercase text-white">Streak de Consistência</h3>
            <p className="text-[#A1A1AA] text-sm leading-relaxed">Gamificação focada em disciplina. Contadores de ofensiva e histórico linear para manter a rotina blindada contra desculpas.</p>
          </div>

          {/* Destaque Analytics */}
          <div className="bg-[#FFE600]/5 border border-[#FFE600]/30 rounded-3xl p-6 md:col-span-3 flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:border-[#FFE600]/60 transition-all relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-48 h-48 bg-[#FFE600] rounded-full filter blur-[80px] opacity-10 pointer-events-none" />
            <div className="flex flex-col gap-2 relative z-10 max-w-xl">
              <div className="flex items-center gap-2 text-[#FFE600]">
                <Sparkles size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Análises de Dados Avançadas</span>
              </div>
              <h3 className="text-xl font-black uppercase text-white">Análise Pura de Platô e Desequilíbrio</h3>
              <p className="text-[#A1A1AA] text-sm leading-relaxed">
                Nosso motor analisa seus dados reais para detectar estagnações de força (platô), assimetrias de volume entre músculos antagonistas e sugere o planejamento ideal. Sem termos vagos de inteligência artificial genérica.
              </p>
            </div>
            <Link href="/register" className="h-12 px-6 bg-[#FFE600] text-black font-black uppercase text-xs tracking-widest rounded-[100px] flex items-center justify-center hover:bg-[#FFE600]/90 active:scale-95 shrink-0 self-start sm:self-center relative z-10">
              Testar Agora
            </Link>
          </div>

        </div>
      </section>

      {/* ======================= SEÇÃO 4: PARA PERSONAL TRAINERS ======================= */}
      <section id="para-personals" ref={sectionTrainers.ref} className="bg-[#0F0F0F] border-y border-[#222225] py-24 px-6 scroll-mt-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          
          <div className={`flex-1 flex flex-col items-start transition-all duration-1000 transform ${sectionTrainers.isIntersecting ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            <span className="text-[#FFE600] text-xs font-black uppercase tracking-widest border border-[#FFE600]/30 bg-[#FFE600]/10 px-3 py-1 rounded-full mb-4">
              👨‍💼 Personal Trainers
            </span>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4">
              Gerencie todos os seus alunos em um só lugar
            </h2>
            <p className="text-[#A1A1AA] text-sm md:text-base leading-relaxed mb-8">
              Otimize seu tempo de consultoria. Esqueça planilhas manuais ou blocos de notas no WhatsApp. Prescreva planilhas completas e acompanhe métricas de execução em tempo real.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-8">
              {[
                'Criar e atribuir fichas customizadas',
                'Acompanhar histórico em tempo real',
                'Enviar feedbacks direto nos treinos',
                'Análise de peso e medidas do atleta',
                'Chat integrado criptografado',
                'Dashboard unificado com todos os alunos'
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-[#A1A1AA] font-semibold">
                  <Check size={16} className="text-[#FFE600] shrink-0" strokeWidth={3} />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            <Link href="/register" className="h-14 px-8 bg-[#FFE600] text-black font-black uppercase tracking-widest text-xs rounded-[100px] flex items-center justify-center hover:bg-[#FFE600]/90 transition-all active:scale-95">
              Cadastrar como Personal
            </Link>
            <span className="text-[10px] text-[#555558] font-bold uppercase tracking-wider mt-2.5 block pl-1">
              * Cadastro sujeito a verificação e validação do registro CREF
            </span>
          </div>

          <div className={`w-full max-w-sm shrink-0 transition-all duration-1000 delay-300 transform ${sectionTrainers.isIntersecting ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <div className="bg-black border border-[#222225] rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-[#222225] pb-4 mb-2">
                <Shield size={18} className="text-[#FFE600]" />
                <span className="text-xs font-black uppercase tracking-widest">Painel do Professor</span>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { n: 'Rodrigo Ramos', s: '✅ Treinou Hoje', c: 'text-[#22C55E]' },
                  { n: 'Amanda Costa', s: '✅ Treinou Hoje', c: 'text-[#22C55E]' },
                  { n: 'Lucas Antunes', s: '😴 Não Treinou', c: 'text-[#555558]' }
                ].map((st, i) => (
                  <div key={i} className="bg-[#0F0F0F] border border-[#222225] p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white uppercase">{st.n}</p>
                      <p className={`text-[9px] font-black uppercase tracking-wider mt-0.5 ${st.c}`}>{st.s}</p>
                    </div>
                    <div className="text-[10px] bg-[#1A1A1A] border border-[#222225] px-2.5 py-1 text-[#A1A1AA] rounded-md font-bold">Ver Perfil</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ======================= SEÇÃO 5: PLANOS ======================= */}
      <section id="planos" ref={sectionPricing.ref} className="py-24 px-6 max-w-4xl mx-auto scroll-mt-12">
        <div className="text-center mb-12 flex flex-col items-center">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-6">Planos simples e transparentes</h2>
          
          {/* Toggle Billing */}
          <div className="bg-[#1A1A1A] p-1 rounded-[100px] flex border border-[#222225] relative w-60">
            <button onClick={() => setBilling('mensal')} className={`flex-1 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-[100px] z-10 transition-colors ${billing === 'mensal' ? 'text-black' : 'text-[#A1A1AA]'}`}>Mensal</button>
            <button onClick={() => setBilling('anual')} className={`flex-1 text-[10px] font-black uppercase tracking-widest py-2.5 rounded-[100px] z-10 transition-colors ${billing === 'anual' ? 'text-black' : 'text-[#A1A1AA]'}`}>Anual</button>
            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#FFE600] rounded-[100px] transition-transform duration-300 ease-in-out ${billing === 'anual' ? 'translate-x-[calc(100%-4px)]' : 'translate-x-0'}`} />
          </div>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch transition-all duration-1000 transform ${sectionPricing.isIntersecting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          {/* Card Free */}
          <div className="bg-[#0F0F0F] border border-[#222225] rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <span className="text-[#A1A1AA] text-xs font-black uppercase tracking-widest block mb-2">GRATUITO</span>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-black text-white">R$0</span>
                <span className="text-[#A1A1AA] text-xs font-bold uppercase mb-1">/ para sempre</span>
              </div>
              
              <div className="flex flex-col gap-3.5 border-t border-[#222225] pt-6 mb-8 text-xs font-semibold text-[#A1A1AA]">
                <div className="flex items-center gap-2"><Check size={14} className="text-[#22C55E]" /> <span>Até 3 fichas de treino criadas</span></div>
                <div className="flex items-center gap-2"><Check size={14} className="text-[#22C55E]" /> <span>Histórico de treinos (últimos 30 dias)</span></div>
                <div className="flex items-center gap-2"><Check size={14} className="text-[#22C55E]" /> <span>Biblioteca base de exercícios</span></div>
                <div className="flex items-center gap-2"><Check size={14} className="text-[#22C55E]" /> <span>Módulo de Treino Ativo</span></div>
                <div className="flex items-center gap-2"><X size={14} className="text-[#555558]" /> <span className="line-through opacity-50">Análise de Platô e Desequilíbrios</span></div>
                <div className="flex items-center gap-2"><X size={14} className="text-[#555558]" /> <span className="line-through opacity-50">Galeria de Fotos de Progresso</span></div>
                <div className="flex items-center gap-2"><X size={14} className="text-[#555558]" /> <span className="line-through opacity-50">Chat integrado com Personal</span></div>
              </div>
            </div>

            <Link href="/register" className="w-full h-12 bg-[#1A1A1A] text-[#555558] border border-[#222225] font-black uppercase text-xs tracking-widest rounded-[100px] flex items-center justify-center cursor-not-allowed">
              Plano Atual
            </Link>
          </div>

          {/* Card Pro */}
          <div className="bg-[#0F0F0F] border-2 border-[#FFE600] rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden shadow-[0_0_40px_rgba(255,230,0,0.1)]">
            <div className="absolute top-0 right-0 bg-[#FFE600] text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl">MAIS POPULAR</div>
            
            <div>
              <span className="text-[#FFE600] text-xs font-black uppercase tracking-widest block mb-2">PRO MASTER</span>
              <div className="flex flex-col mb-6 justify-center">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black text-white">R${billing === 'anual' ? '12,49' : '19,90'}</span>
                  <span className="text-[#A1A1AA] text-xs font-bold uppercase mb-1">/ mês</span>
                </div>
                {billing === 'anual' && <span className="text-[10px] text-[#22C55E] font-black uppercase tracking-wider mt-1">Cobrado anualmente (R$149,90) • Economize 37%</span>}
              </div>
              
              <div className="flex flex-col gap-3.5 border-t border-[#222225] pt-6 mb-8 text-xs font-semibold text-white">
                <div className="flex items-center gap-2"><Check size={14} className="text-[#22C55E]" strokeWidth={3} /> <span>Fichas de treino ilimitadas</span></div>
                <div className="flex items-center gap-2"><Check size={14} className="text-[#22C55E]" strokeWidth={3} /> <span>Histórico de treinos completo e vitalício</span></div>
                <div className="flex items-center gap-2"><Check size={14} className="text-[#22C55E]" strokeWidth={3} /> <span>Biblioteca base de exercícios + customizados</span></div>
                <div className="flex items-center gap-2"><Check size={14} className="text-[#22C55E]" strokeWidth={3} /> <span>Módulo de Treino Ativo com Logs em tempo real</span></div>
                <div className="flex items-center gap-2"><Check size={14} className="text-[#22C55E]" strokeWidth={3} /> <span className="text-[#FFE600]">Análise Inteligente de Platô e Desequilíbrios</span></div>
                <div className="flex items-center gap-2"><Check size={14} className="text-[#22C55E]" strokeWidth={3} /> <span>Galeria de Fotos de Progresso Privada</span></div>
                <div className="flex items-center gap-2"><Check size={14} className="text-[#22C55E]" strokeWidth={3} /> <span>Chat integrado e relatórios de métricas do Coach</span></div>
              </div>
            </div>

            <Link href="/register" className="w-full h-12 bg-[#FFE600] text-black font-black uppercase text-xs tracking-widest rounded-[100px] flex items-center justify-center hover:bg-[#FFE600]/90 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,230,0,0.2)]">
              Começar com PRO
            </Link>
          </div>

        </div>
      </section>

      {/* ======================= SEÇÃO 6: DEPOIMENTOS ======================= */}
      <section ref={sectionTestimonials.ref} className="py-24 px-6 bg-[#0F0F0F] border-y border-[#222225]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-2">O que dizem nossos atletas</h2>
            <p className="text-[#555558] text-xs font-black uppercase tracking-widest">Opinião de quem treina sério</p>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-1000 transform ${sectionTestimonials.isIntersecting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            
            <div className="bg-black border border-[#222225] rounded-3xl p-6 flex flex-col justify-between h-56">
              <p className="text-[#A1A1AA] text-sm leading-relaxed italic">"O mapa de recuperação muscular mudou minha forma de dividir os treinos. Agora sei exatamente quando posso dar o meu máximo sem risco."</p>
              <div className="border-t border-[#222225] pt-4 mt-4">
                <p className="text-white font-bold text-xs uppercase">Carlos M.</p>
                <p className="text-[#555558] text-[10px] font-bold mt-0.5">Atleta • 8 meses de AresFit</p>
              </div>
            </div>

            <div className="bg-black border border-[#222225] rounded-3xl p-6 flex flex-col justify-between h-56 border-l-[#FFE600]/40">
              <p className="text-[#A1A1AA] text-sm leading-relaxed italic">"Como personal, consigo prescrever e auditar a carga de todos os meus alunos remotamente de forma fluida. O AresFit virou meu dashboard principal."</p>
              <div className="border-t border-[#222225] pt-4 mt-4">
                <p className="text-[#FFE600] font-bold text-xs uppercase flex items-center gap-1">Fernanda P. <Award size={12} /></p>
                <p className="text-[#555558] text-[10px] font-bold mt-0.5">Personal Trainer • CREF 045123</p>
              </div>
            </div>

            <div className="bg-black border border-[#222225] rounded-3xl p-6 flex flex-col justify-between h-56">
              <p className="text-[#A1A1AA] text-sm leading-relaxed italic">"Bati 3 recordes pessoais (PR) em uma semana. A análise matemática de platô me deu o insight exato para quebrar a estagnação de força."</p>
              <div className="border-t border-[#222225] pt-4 mt-4">
                <p className="text-white font-bold text-xs uppercase">Rafael S.</p>
                <p className="text-[#555558] text-[10px] font-bold mt-0.5">Powerlifter Amador</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ======================= SEÇÃO 7: CTA FINAL ======================= */}
      <section ref={sectionCta.ref} className="py-32 px-6 flex flex-col items-center relative overflow-hidden text-center">
        
        {/* Glow de fundo */}
        <div className="absolute inset-0 bg-radial-gradient from-[#FFE600]/5 via-transparent to-transparent pointer-events-none filter blur-2xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#FFE600] rounded-full filter blur-[120px] opacity-10 pointer-events-none" />

        <div className={`max-w-xl flex flex-col items-center transition-all duration-1000 transform ${sectionCta.isIntersecting ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 leading-none text-white">
            Pronto para <span className="text-[#FFE600]">evoluir?</span>
          </h2>
          <p className="text-[#A1A1AA] text-sm md:text-base font-medium max-w-sm mb-10 leading-relaxed">
            Junte-se a milhares de atletas e treinadores que transformaram as métricas e a consistência dos seus treinos.
          </p>

          <Link href="/register" className="h-16 px-12 bg-[#FFE600] text-black font-black uppercase tracking-widest text-base rounded-[100px] flex items-center justify-center transition-all hover:scale-105 hover:bg-[#FFE600]/90 active:scale-95 shadow-[0_0_40px_rgba(255,230,0,0.3)]">
            Começar grátis agora
          </Link>
          
          <span className="text-[10px] text-[#555558] font-bold uppercase tracking-wider mt-4">
            Sem cartão de crédito. Grátis para sempre no plano básico.
          </span>
        </div>
      </section>

      {/* ======================= FOOTER ======================= */}
      

      {/* ======================= FOOTER ATUALIZADO LGPD ======================= */}
      <footer className="bg-[#0F0F0F] border-t border-[#222225] py-12 px-6 text-xs text-[#555558] font-medium">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          
          {/* Logo e Copyright */}
          <div className="flex flex-col items-center sm:items-start gap-1.5">
            <span className="text-lg font-black text-white tracking-tighter">
              Ares<span className="text-[#FFE600]">Fit</span>
            </span>
            <p>© 2026 AresFit. Todos os direitos reservados.</p>
          </div>

          {/* Links Legais atualizados em conformidade com as diretrizes */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-[#A1A1AA] uppercase tracking-wider text-[10px] font-black">
            <Link href="#funcionalidades" className="hover:text-[#FFE600] transition-colors">Funcionalidades</Link>
            <Link href="/termos" className="hover:text-[#FFE600] transition-colors text-white border-b border-dashed border-[#555558]">Termos de Uso</Link>
            <Link href="/privacidade" className="hover:text-[#FFE600] transition-colors text-white border-b border-dashed border-[#555558]">Privacidade</Link>          </div>

          {/* Redes Sociais */}
          <div className="flex items-center gap-4 text-[#A1A1AA]">
            <Link href="#" className="p-2.5 bg-black border border-[#222225] rounded-full hover:text-[#FFE600] transition-all active:scale-95">
              <span className="text-[9px] font-black tracking-tighter uppercase font-mono">IG</span>
            </Link>
            <Link href="#" className="p-2.5 bg-black border border-[#222225] rounded-full hover:text-[#FFE600] transition-all active:scale-95">
              <MessageSquare size={16} />
            </Link>
          </div>

        </div>
      </footer>
    </div>
  );
}