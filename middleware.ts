import { NextResponse } from 'next/server';

// Middleware pass-through (ignora verificações no Edge para evitar o Erro 500)
export function middleware() {
  return NextResponse.next();
}

// Configuração vazia para não interceptar nenhuma rota por enquanto
export const config = {
  matcher: [],
};