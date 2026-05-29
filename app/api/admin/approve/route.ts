export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    // 1. Inicialização blindada DENTRO da função (com fallbacks de segurança)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fallback.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fallback-key';
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Recebe os dados da requisição
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário não fornecido' }, { status: 400 });
    }

    // 3. Atualiza o status do treinador para aprovado
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'approved' })
      .eq('id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Erro na API de aprovação:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

// Bloqueia o método GET para evitar erros de compilação
export async function GET() {
  return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
}