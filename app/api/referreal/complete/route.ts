import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário ausente.' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Localizar se o usuário atual possui um vínculo de indicação pendente
    const { data: referral, error: fetchError } = await supabaseAdmin
      .from('referrals')
      .select('*, referrer:referrer_id(id, plan, pro_trial_expires_at)')
      .eq('referred_id', userId)
      .eq('status', 'pending')
      .maybeSingle();

    if (fetchError || !referral) {
      // Se não há indicação ativa ou pendente, encerra silenciosamente de forma bem-sucedida
      return NextResponse.json({ success: false, message: 'Nenhuma ação de indicação associada a este usuário.' });
    }

    const referrerInfo: any = referral.referrer;
    
    // 2. Calcular nova data de expiração do Plano PRO do indicador (+30 dias acumulados)
    let baseDate = new Date();
    if (referrerInfo.plan === 'pro' && referrerInfo.pro_trial_expires_at) {
      const currentExpiry = new Date(referrerInfo.pro_trial_expires_at);
      if (currentExpiry > baseDate) {
        baseDate = currentExpiry; // Se ele já tem um trial ativo, adiciona no fim dele
      }
    }
    
    baseDate.setDate(baseDate.getDate() + 30);

    // 3. Atualizar o perfil do indicador para o plano PRO com nova data estendida
    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update({
        plan: 'pro',
        pro_trial_expires_at: baseDate.toISOString()
      })
      .eq('id', referral.referrer_id);

    if (updateProfileError) throw updateProfileError;

    // 4. Mudar o status do referral para 'rewarded' e cravar a data de entrega da recompensa
    const { error: updateReferralError } = await supabaseAdmin
      .from('referrals')
      .update({
        status: 'rewarded',
        completed_at: new Date().toISOString()
      })
      .eq('id', referral.id);

    if (updateReferralError) throw updateReferralError;

    // 5. Disparar notificação Push para o indicador avisando da recompensa recebida
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://aresfit.vercel.app'}/api/push/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: referral.referrer_id,
          title: '🎁 Recompensa Ativada!',
          body: 'Seu amigo concluiu o primeiro treino e você ganhou +30 dias de AresFit PRO!',
          url: '/planos'
        })
      });
    } catch (e) {
      console.error('Falha ao disparar push da recompensa do referral, seguindo...', e);
    }

    return NextResponse.json({ success: true, rewarded: referral.referrer_id });

  } catch (err: any) {
    console.error('Erro na finalização do ciclo de indicação:', err);
    return NextResponse.json({ error: err.message || 'Erro interno operacional.' }, { status: 500 });
  }
}