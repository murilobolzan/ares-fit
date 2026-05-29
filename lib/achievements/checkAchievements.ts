import { createClient } from '@supabase/supabase-js';

export async function checkAndUnlockAchievements(userId: string, sessionData: {
  totalVolume: number,
  newPRsCount: number,
  currentStreak: number,
  totalWorkouts: number,
  hasTrainer: boolean,
  isPro: boolean
}) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Buscar o que o usuário já tem para não duplicar e nem gastar recursos
  const { data: existing } = await supabaseAdmin
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId);

  const unlocked = new Set(existing?.map(e => e.achievement_id) || []);
  const newlyUnlocked: any[] = [];

  // 2. Mapeamento de condições baseadas no SQL inicial
  const checks = [
    { id: 'streak_7', condition: sessionData.currentStreak >= 7 },
    { id: 'streak_30', condition: sessionData.currentStreak >= 30 },
    { id: 'streak_100', condition: sessionData.currentStreak >= 100 },
    { id: 'workouts_10', condition: sessionData.totalWorkouts >= 10 },
    { id: 'workouts_50', condition: sessionData.totalWorkouts >= 50 },
    { id: 'workouts_100', condition: sessionData.totalWorkouts >= 100 },
    { id: 'workouts_365', condition: sessionData.totalWorkouts >= 365 },
    { id: 'pr_first', condition: sessionData.newPRsCount >= 1 },
    { id: 'volume_1000', condition: sessionData.totalVolume >= 1000 },
    { id: 'volume_10000', condition: sessionData.totalVolume >= 10000 },
    { id: 'first_trainer', condition: sessionData.hasTrainer },
    { id: 'pro_plan', condition: sessionData.isPro },
  ];

  // 3. Processamento de inserção
  for (const check of checks) {
    if (check.condition && !unlocked.has(check.id)) {
      const { data: achievementInfo } = await supabaseAdmin
        .from('achievements')
        .select('*')
        .eq('id', check.id)
        .single();

      if (achievementInfo) {
        await supabaseAdmin.from('user_achievements').insert({
          user_id: userId,
          achievement_id: check.id
        });
        newlyUnlocked.push(achievementInfo);
      }
    }
  }

  return newlyUnlocked;
}