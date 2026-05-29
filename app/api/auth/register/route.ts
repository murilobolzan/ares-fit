import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { generateReferralCode } from '@/lib/referral/generateCode';

export async function POST(request: Request) {
  try {
    const { email, password, username, fullName } = await request.json();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Criar usuário no Auth nativo do Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError || !authData.user) throw authError;

    // 2. Gerar código determinístico de referral
    const uniqueReferralCode = generateReferralCode(authData.user.id, username);

    // 3. Inserir perfil na tabela public.profiles com o código injetado
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        username: username.toLowerCase().replace(/[^a-z0-9]/g, ''),
        referral_code: uniqueReferralCode,
        plan: 'free'
      });

    if (profileError) throw profileError;

    return NextResponse.json({ success: true, userId: authData.user.id, code: uniqueReferralCode });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Falha técnica interna.' }, { status: 500 });
  }
}