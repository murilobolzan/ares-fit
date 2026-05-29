import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createClient as createSupabaseServer } from '@/lib/supabase/server';

export async function DELETE(request: Request) {
  try {
    const supabase = createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    // Bloqueia se a requisição não tiver sessão válida ativa no cliente
    if (!user) {
      return NextResponse.json({ error: 'Operação não autorizada.' }, { status: 401 });
    }

    // Instancia o cliente administrativo master para bypassar as travas do RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Limpar arquivos de mídia anexados do Storage
    const { data: photos } = await supabaseAdmin
      .from('progress_photos')
      .select('photo_url')
      .eq('user_id', user.id);

    if (photos && photos.length > 0) {
      const pathsToDelete = photos
        .map(photo => photo.photo_url.split('/progress-photos/')[1])
        .filter(Boolean); // Remove strings vazias ou nulas geradas por split incorreto

      if (pathsToDelete.length > 0) {
        await supabaseAdmin.storage.from('progress-photos').remove(pathsToDelete);
      }
    }

    // 2. Apagar usuário do Authentication. O cascading delete limpa profiles, logs, sets e treinos.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    
    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Erro crítico na deleção de conta:', err);
    return NextResponse.json({ error: err.message || 'Falha técnica interna.' }, { status: 500 });
  }
}