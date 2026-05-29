import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { vapidKeys } from '@/lib/push/vapid';

webpush.setVapidDetails(
  vapidKeys.subject,
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export async function POST(request: Request) {
  try {
    const { userId, title, body, url } = await request.json();

    if (!userId || !title || !body) {
      return NextResponse.json({ error: 'Parâmetros incompletos' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)
      .single();

    if (!data || !data.subscription) {
      return NextResponse.json({ error: 'Usuário não possui inscrição ativa de Push' }, { status: 404 });
    }

    const payload = JSON.stringify({
      title,
      body,
      url: url || '/',
      icon: '/icon-192.png',
      badge: '/icon-192.png'
    });

    await webpush.sendNotification(data.subscription, payload);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao disparar WebPush:', error);
    if (error.statusCode === 410 || error.statusCode === 404) {
       // Opcional: remover subscription inválida do banco
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}