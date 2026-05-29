import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { referralCode, newUserId } = await request.json();

    if (!referralCode || !newUserId) {
      return NextResponse.json({ error: 'Parâmetros ausentes.' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Localizar o indicador pelo código (caixa alta padronizada)
    const { data: referrer, error: refError } = await supabaseAdmin
      .from('profiles')
      .select('id, plan, pro_trial_expires_at')
      .eq('referral_code', referralCode.toUpperCase())
      .maybeSingle();

    if (refError || !referrer) {
      return NextResponse.json({ error: 'Código de indicação inválido.' }, { status: 404 });
    }

    if (referrer.id === newUserId) {
      return NextResponse.json({ error: 'Você não pode utilizar seu próprio código.' }, { status: 400 });
    }

    // 2. Registrar a relação de indicação na tabela
    const { error: insertError } = await supabaseAdmin
      .from('referrals')
      .insert({
        referrer_id: referrer.id,
        referred_id: newUserId,
        referral_code: referralCode.toUpperCase(),
        status: 'pending'
      });

    if (insertError) {
      return NextResponse.json({ error: 'Relação de indicação já existente.' }, { status: 400 });
    }

    // 3. Conceder recompensa de Onboarding: 15 dias de Plano PRO
    const trialExpires = new Date();
    trialExpires.setDate(trialExpires.getDate() + 15);

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        plan: 'pro',
        pro_trial_expires_at: trialExpires.toISOString(),
        referred_by: referralCode.toUpperCase()
      })
      .eq('id', newUserId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, trialDays: 15 });

  } catch (err: any) {
    console.error('Erro na validação do referral:', err);
    return NextResponse.json({ error: err.message || 'Erro operacional interno.' }, { status: 500 });
  }
}