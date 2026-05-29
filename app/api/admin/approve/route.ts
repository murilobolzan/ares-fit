export const dynamic = 'force-dynamic';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

// Cliente Admin do Supabase (Service Role) - Bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { profileId, action, reason } = await request.json();

    if (!profileId || !action) {
      return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 });
    }

    // 1. Verificação de Segurança (Validar se quem chamou é o Admin)
    const cookieStore = cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {} // Leitura apenas
        },
      }
    );

    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Acesso negado. Apenas o administrador pode realizar esta ação.' }, { status: 403 });
    }

    // 2. Executar Ação no Banco via Admin Client
    if (action === 'approve') {
      const { error } = await supabaseAdmin.from('profiles').update({
        account_type: 'trainer',
        cref_status: 'approved'
      }).eq('id', profileId);
      
      if (error) throw error;
      
    } else if (action === 'reject') {
      const { error } = await supabaseAdmin.from('profiles').update({
        cref_status: 'rejected',
        // Caso queira no futuro adicionar o motivo na base, basta adicionar a coluna "rejection_reason" no banco e descomentar abaixo
        // rejection_reason: reason 
      }).eq('id', profileId);
      
      if (error) throw error;

    } else if (action === 'reactivate') {
      const { error } = await supabaseAdmin.from('profiles').update({
        account_type: 'pending_trainer',
        cref_status: 'pending'
      }).eq('id', profileId);

      if (error) throw error;
    } else {
      return NextResponse.json({ error: 'Ação desconhecida.' }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro interno no servidor.' }, { status: 500 });
  }
}