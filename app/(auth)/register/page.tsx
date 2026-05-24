'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, Users, Minus, Plus, Upload, Loader2, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/lib/hooks/useToast';
import { AccountType } from '@/lib/theme';

const GOALS = ['Ganhar Massa', 'Perder Gordura', 'Ganhar Força', 'Definição', 'Saúde'];

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast, ToastComponent } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form Data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('student');
  
  // Student Data
  const [goal, setGoal] = useState('Saúde');
  const [frequency, setFrequency] = useState(3);
  
  // Trainer Data
  const [cref, setCref] = useState('');
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);

  const handleNextStep = () => {
    if (!name || !email || !password || !confirmPassword) {
      showToast('Preencha todos os campos.', 'warning');
      return;
    }
    if (password !== confirmPassword) {
      showToast('As senhas não coincidem.', 'error');
      return;
    }
    setStep(2);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocumentUrl(URL.createObjectURL(file));
    }
  };

  const handleRegister = async () => {
    if (accountType === 'trainer' && (!cref || !documentUrl)) {
      showToast('Preencha o CREF e envie uma foto do documento.', 'warning');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        }
      }
    });

    if (error) {
      showToast(error.message, 'error');
      setLoading(false);
      return;
    }

    if (data.user) {
      // Atualiza os dados extras no profile recém criado via trigger
      const profileUpdate: any = { account_type: accountType === 'trainer' ? 'pending_trainer' : 'student' };
      
      if (accountType === 'student') {
        profileUpdate.goal = goal;
        profileUpdate.training_frequency = frequency;
      } else {
        profileUpdate.cref = cref;
        profileUpdate.cref_status = 'pending';
      }

      await supabase.from('profiles').update(profileUpdate).eq('id', data.user.id);
    }

    if (accountType === 'student') {
      router.push('/home');
    } else {
      router.push('/pending-approval');
    }
  };

  return (
    <main className="min-h-screen bg-background text-primary px-screenPadding pt-10 pb-safe relative flex flex-col">
      <ToastComponent />
      
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          {step === 2 && (
            <button onClick={() => setStep(1)} className="p-2 -ml-2 bg-surface-2 rounded-full text-primary hover:bg-surface-3 transition-colors">
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold">Criar conta</h1>
            <p className="text-secondary text-sm">Etapa {step} de 2</p>
          </div>
        </div>

        {/* STEP 1: Basic Info */}
        {step === 1 && (
          <div className="flex flex-col gap-5 animate-slide-up">
            <input type="text" placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} className="w-full h-14 bg-surface-2 border border-border rounded-xl px-4 text-primary placeholder:text-secondary focus:outline-none focus:border-brand transition-colors" />
            <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-14 bg-surface-2 border border-border rounded-xl px-4 text-primary placeholder:text-secondary focus:outline-none focus:border-brand transition-colors" />
            <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-14 bg-surface-2 border border-border rounded-xl px-4 text-primary placeholder:text-secondary focus:outline-none focus:border-brand transition-colors" />
            <input type="password" placeholder="Confirmar Senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full h-14 bg-surface-2 border border-border rounded-xl px-4 text-primary placeholder:text-secondary focus:outline-none focus:border-brand transition-colors" />

            <div className="mt-4">
              <label className="text-sm font-medium mb-3 block">Qual o seu perfil?</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setAccountType('student')}
                  className={`flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-colors ${accountType === 'student' ? 'border-brand bg-brand-soft text-brand' : 'border-border bg-surface text-secondary hover:bg-surface-2'}`}
                >
                  <Dumbbell size={32} />
                  <span className="font-medium text-sm">Sou Aluno</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('trainer')}
                  className={`flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-colors ${accountType === 'trainer' ? 'border-brand bg-brand-soft text-brand' : 'border-border bg-surface text-secondary hover:bg-surface-2'}`}
                >
                  <Users size={32} />
                  <span className="font-medium text-sm text-center">Sou Personal</span>
                </button>
              </div>
            </div>

            <button onClick={handleNextStep} className="w-full h-14 bg-brand text-black font-bold rounded-pill mt-6 hover:bg-brand-hover transition-colors">
              Continuar
            </button>
          </div>
        )}

        {/* STEP 2A: Student */}
        {step === 2 && accountType === 'student' && (
          <div className="flex flex-col gap-8 animate-fade-in">
            <div>
              <label className="text-sm font-medium mb-3 block">Qual o seu principal objetivo?</label>
              <div className="flex gap-3 overflow-x-auto hide-scroll pb-2">
                {GOALS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGoal(g)}
                    className={`whitespace-nowrap px-6 py-3 rounded-pill border-2 transition-colors text-sm font-medium ${goal === g ? 'border-brand bg-brand-soft text-brand' : 'border-border bg-surface text-secondary hover:bg-surface-2'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block text-center">Frequência de treino semanal</label>
              <div className="flex items-center justify-center gap-6">
                <button onClick={() => setFrequency(Math.max(2, frequency - 1))} className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center text-primary hover:bg-surface-3 transition-colors active:scale-95">
                  <Minus size={20} />
                </button>
                <div className="text-4xl font-black w-12 text-center">{frequency}</div>
                <button onClick={() => setFrequency(Math.min(6, frequency + 1))} className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center text-primary hover:bg-surface-3 transition-colors active:scale-95">
                  <Plus size={20} />
                </button>
              </div>
              <p className="text-center text-secondary text-sm mt-3">dias por semana</p>
            </div>

            <div className="mt-auto pt-8">
              <button onClick={handleRegister} disabled={loading} className="w-full h-14 bg-brand text-black font-bold rounded-pill flex items-center justify-center hover:bg-brand-hover transition-colors disabled:opacity-50">
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Criar conta'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2B: Trainer */}
        {step === 2 && accountType === 'trainer' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <input type="text" placeholder="Número do CREF (ex: 012345-G/SP)" value={cref} onChange={(e) => setCref(e.target.value)} className="w-full h-14 bg-surface-2 border border-border rounded-xl px-4 text-primary placeholder:text-secondary focus:outline-none focus:border-brand transition-colors uppercase" />

            <div>
              <label className="text-sm font-medium mb-3 block">Foto do documento (CREF)</label>
              <label className="border-2 border-dashed border-border rounded-2xl h-40 flex flex-col items-center justify-center gap-3 bg-surface cursor-pointer hover:bg-surface-2 transition-colors relative overflow-hidden">
                {documentUrl ? (
                  <img src={documentUrl} alt="Documento" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                ) : (
                  <>
                    <Upload size={32} className="text-secondary" />
                    <span className="text-sm text-secondary font-medium">Toque para anexar</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>

            <div className="bg-surface-2 p-4 rounded-xl border border-border mt-4">
              <p className="text-sm text-secondary leading-relaxed">
                <strong className="text-primary">Atenção:</strong> Seu cadastro será analisado por nossa equipe em até 24h para garantir a segurança da plataforma. Você receberá um e-mail quando for aprovado.
              </p>
            </div>

            <div className="mt-auto pt-8">
              <button onClick={handleRegister} disabled={loading} className="w-full h-14 bg-brand text-black font-bold rounded-pill flex items-center justify-center hover:bg-brand-hover transition-colors disabled:opacity-50">
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Enviar para análise'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}