import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type { SupabaseClient }

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase credentials missing. Check .env file.')
}

// O app não usa o Auth do Supabase (login é via RPC app_login), então
// desligamos o GoTrueClient: evita o aviso "Multiple GoTrueClient instances"
// e a colisão de storage entre os vários clients criados.
const clientOptions = {
  auth: { autoRefreshToken: false, persistSession: false },
} as const

/** Client raiz — banco da matriz. Autenticação (users/companies) sempre usa este. */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, clientOptions)

/** Cria um client apontando para o banco de outra empresa (filial). */
export function createCompanyClient(url: string, anonKey: string): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error('Empresa sem banco de dados configurado.')
  }
  return createClient(url, anonKey, clientOptions)
}
