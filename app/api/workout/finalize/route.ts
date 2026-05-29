import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAndUnlockAchievements } from '@/lib/achievements/checkAchievements';

export async function POST(request: Request) {
  try {
    const { sessionId, totalVolume, newPRsCount } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'ID da sessão é obrigatório.' }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    // 1. Marcar sessão como concluída e salvar o volume total real
    const { error: sessionError } = await supabase
      .from('workout_sessions')
      .update({ 
        status: 'completed', 
        finished_at: new Date().toISOString(),
        total_volume_kg: totalVolume || 0
      })
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (sessionError) throw sessionError;

    // 2. Buscar perfil atual para verificação de Streak, Trainer e Plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('Perfil não encontrado.');

    // Calcular novo streak
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const ultimaData = profile.last_workout_date ? new Date(profile.last_workout_date) : null;
    
    let novoStreak = profile.current_streak || 0;
    
    // Se o último treino foi ontem, incrementa. Se for antes de ontem, reseta. Se for hoje, mantém.
    if (ultimaData) {
      ultimaData.setHours(0, 0, 0, 0);
      const diffTime = Math.abs(hoje.getTime() - ultimaData.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        novoStreak += 1;
      } else if (diffDays > 1) {
        novoStreak = 1; // Reseta se quebrou a corrente
      }
    } else {
      novoStreak = 1; // Primeiro treino da vida
    }

    const novoBestStreak = Math.max(novoStreak, profile.best_streak || 0);

    // 3. Contar total de treinos concluídos históricos
    const { count: countWorkouts } = await supabase
      .from('workout_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed');

    // 4. Checar se tem personal vinculado
    const { count: countTrainer } = await supabase
      .from('trainer_students')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', user.id)
      .eq('status', 'active');

    // 5. Atualizar perfil com novos metadados de atividade
    await supabase.from('profiles').update({
      current_streak: novoStreak,
      best_streak: novoBestStreak,
      last_workout_date: new Date().toISOString()
    }).eq('id', user.id);

    // ... [Mantenha todo o código da Seção 1 até a Seção 5 intacto conforme a etapa anterior] ...
    // ... [Logo abaixo da atualização do perfil e do motor de gamificação, insira a ativação do referral]:

    // ... [Mantenha todo o código da Seção 1 até a Seção 5 intacto conforme a etapa anterior] ...
    // ... [Logo abaixo da atualização do perfil e do motor de gamificação, insira a ativação do referral]:

    // 6. 🏆 MOTOR DE GAMIFICAÇÃO: Checar Conquistas (Lógica Existente)
    const newlyUnlocked = await checkAndUnlockAchievements(user.id, {
      totalVolume: totalVolume || 0,
      newPRsCount: newPRsCount || 0,
      currentStreak: novoStreak,
      totalWorkouts: countWorkouts || 1,
      hasTrainer: (countTrainer || 0) > 0,
      isPro: profile.plan === 'pro'
    });

    // 7. 🎁 GATILHO DE CRESCIMENTO: Completar indicação se for o primeiro treino concluído da vida do atleta
    if (countWorkouts === 1) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://aresfit.vercel.app'}/api/referral/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
      } catch (err) {
        console.error('Falha de execução na API de conclusão de referral, seguindo fluxo comum:', err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      newlyUnlocked 
    });

  } catch (err: any) {
    console.error('Erro ao finalizar treino:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}