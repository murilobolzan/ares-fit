import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Username obrigatório.' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // Tenta usar a chave de serviço (Admin), se não achar, usa a chave pública que já configuramos
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Erro de configuração do servidor: Chaves do banco ausentes.' },
        { status: 500 }
      );
    }

    // Instanciar DENTRO da função, não fora
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username.toLowerCase().trim().replace('@', ''))
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ email: data.email });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}