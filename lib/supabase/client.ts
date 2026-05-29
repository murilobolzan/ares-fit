import { createBrowserClient } from '@supabase/ssr';

/**
 * Instanciação sênior do cliente Supabase para o lado do navegador (Client Components).
 * Utiliza o pacote unificado `@supabase/ssr` mitigando incompatibilidades de estado.
 */
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Faltam variáveis de ambiente críticas: NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};