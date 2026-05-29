'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, TrendingUp, Users, ArrowRight, Check } from 'lucide-react';
import { haptics } from '@/lib/haptics';

const SLIDES = [
  {
    title: 'Bem-vindo ao AresFit',
    subtitle: 'Sua evolução começa aqui. 🏆',
    description: 'O aplicativo definitivo para acompanhar seus treinos, conectar-se com profissionais e extrair o seu máximo.',
    icon: null // Renderizaremos o logo customizado
  },
  {
    title: 'Registre seus Treinos',
    subtitle: 'Precisão em cada série 💪',
    description: 'Acompanhe cargas, repetições e intervalos em tempo real. Diga adeus ao caderninho e planilhas confusas.',
    icon: <Dumbbell size={64} className="text-[#FFE600] mb-6" />
  },
  {
    title: 'Acompanhe sua Evolução',
    subtitle: 'Dados que geram resultados 📈',
    description: 'Visualize seu volume semanal, recordes pessoais (PRs) e o mapa de recuperação muscular inteligente.',
    icon: <TrendingUp size={64} className="text-[#FFE600] mb-6" />
  },
  {
    title: 'Conecte-se com seu Personal',
    subtitle: 'Treinamento Guiado 👨‍💼',
    description: 'Vincule seu perfil ao do seu treinador para receber fichas personalizadas e feedbacks técnicos direto no app.',
    icon: <Users size={64} className="text-[#FFE600] mb-6" />
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('onboarding_complete')) {
      router.push('/home');
    }
  }, [router]);

  const handleNext = () => {
    haptics.light();
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = () => {
    haptics.success();
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboarding_complete', 'true');
    }
    router.push('/home');
  };

  const slide = SLIDES[currentSlide];

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col max-w-sm mx-auto p-6 pb-12 relative overflow-hidden">
      
      {/* Pular */}
      <div className="flex justify-end pt-4 h-12">
        {currentSlide < SLIDES.length - 1 && (
          <button onClick={finishOnboarding} className="text-[#555558] text-xs font-black uppercase tracking-widest hover:text-[#A1A1AA]">
            Pular
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in" key={currentSlide}>
        {currentSlide === 0 ? (
          <div className="mb-10">
            <h1 className="text-6xl font-black tracking-tighter mb-2">
              Ares<span className="text-[#FFE600]">Fit</span>
            </h1>
          </div>
        ) : (
          slide.icon
        )}
        
        <h2 className="text-2xl font-black uppercase tracking-widest text-[#FFFFFF] mb-2">{slide.title}</h2>
        <h3 className="text-[#FFE600] text-sm font-bold uppercase tracking-wider mb-6">{slide.subtitle}</h3>
        <p className="text-[#A1A1AA] text-sm leading-relaxed px-4">{slide.description}</p>
      </div>

      <div className="flex flex-col gap-8 mt-auto">
        {/* Indicadores */}
        <div className="flex justify-center gap-2">
          {SLIDES.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-6 bg-[#FFE600]' : 'w-1.5 bg-[#222225]'}`}
            />
          ))}
        </div>

        <button 
          onClick={handleNext}
          className="w-full h-14 bg-[#FFE600] text-black font-black uppercase tracking-widest rounded-[100px] flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          {currentSlide === SLIDES.length - 1 ? (
            <>Começar Agora <Check size={20} strokeWidth={3} /></>
          ) : (
            <>Próximo <ArrowRight size={20} strokeWidth={3} /></>
          )}
        </button>
      </div>

    </div>
  );
}