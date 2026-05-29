import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  // Inicializa uma resposta base
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    // Blinda a criação do cliente com fallbacks para evitar o crash 500
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fallback.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fallback-key';

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options });
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options });
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Opcional: Chama o getUser para atualizar os cookies de sessão se necessário
    await supabase.auth.getUser();

    return response;
  } catch (e) {
    // Se der qualquer erro no Supabase, ao invés de derrubar o site com erro 500,
    // ele simplesmente deixa o usuário seguir em frente como "deslogado".
    console.error('Erro no Middleware do Supabase:', e);
    return response;
  }
}

// Protege apenas as rotas necessárias para não pesar o site inteiro
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};