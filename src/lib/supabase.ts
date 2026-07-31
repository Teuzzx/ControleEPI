import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type { SupabaseClient }

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase credentials missing. Check .env file.')
}

/** Client raiz — banco da matriz. Autenticação (users/companies) sempre usa este. */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/** Cria um client apontando para o banco de outra empresa (filial). */
export function createCompanyClient(url: string, anonKey: string): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error('Empresa sem banco de dados configurado.')
  }
  return createClient(url, anonKey)
}
