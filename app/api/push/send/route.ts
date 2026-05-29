import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Aqui entrará a lógica real do web-push futuramente usando as chaves VAPID.
    // Por enquanto, apenas recebemos a requisição e retornamos sucesso para não quebrar o app.
    console.log('Push notification solicitada:', payload);

    return NextResponse.json({ 
      success: true, 
      message: 'Notificação processada com sucesso.' 
    });

  } catch (error: any) {
    console.error('Erro na API de Push:', error);
    return NextResponse.json(
      { error: error.message || 'Falha interna no servidor.' }, 
      { status: 500 }
    );
  }
}

// Opcional: Bloqueia métodos não permitidos para evitar erros de compilação
export async function GET() {
  return NextResponse.json({ error: 'Método não permitido.' }, { status: 405 });
}