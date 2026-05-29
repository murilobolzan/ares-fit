import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createClient as createSupabaseServer } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { subscription } = await request.json();
    
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription ausente' }, { status: 400 });
    }

    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Usando Service Role para bypassar complexidades de RLS em Upsert caso haja falhas silenciosas
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert(
        { user_id: user.id, subscription }, 
        { onConflict: 'user_id' }
      );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}