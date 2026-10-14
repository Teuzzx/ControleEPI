import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type { SupabaseClient }

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? ''
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? ''

export const supabaseUrl = rawUrl.trim()
export const supabaseAnonKey = rawKey.trim()

/**
 * `true` quando as variáveis `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
 * existem no ambiente do build.
 *
 * Antes este módulo lançava uma exceção no import quando faltavam as
 * credenciais. Isso derrubava a árvore inteira do React na hora do
 * bundle (tela branca) e também impedia qualquer teste de rodar, porque
 * o erro acontecia antes do primeiro `render`. Agora o app carrega
 * normalmente e mostra uma mensagem clara de configuração.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

/** Mensagem exibida ao usuário quando o build não tem credenciais. */
export const supabaseConfigError =
  'Configuração ausente: o sistema não foi compilado com as variáveis ' +
  'VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY. Fale com o responsável ' +
  'pelo servidor para reconfigurar o deploy.'

// O app não usa o Auth do Supabase (login é via RPC app_login), então
// desligamos o GoTrueClient: evita o aviso "Multiple GoTrueClient instances"
// e a colisão de storage entre os vários clients criados.
const clientOptions = {
  auth: { autoRefreshToken: false, persistSession: false },
} as const

/**
 * Quando as credenciais faltam, criamos o client apontando para um
 * endereço placeholder em vez de estourar no import. `createClient`
 * valida apenas o formato da URL, então o client é criado com sucesso e
 * qualquer chamada de rede falha de forma controlada — que é exatamente
 * o comportamento desejado enquanto a configuração não existe.
 */
const clientUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co'
const clientKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key'

/**
 * URL/chave efetivamente usadas para criar clients.
 *
 * Qualquer módulo que precise criar um client próprio (o `auth.ts`, para
 * mandar o header `x-session-token`) tem que usar ISTES valores, e não as
 * constantes cruas. Usar as cruas com o build sem `.env` fazia
 * `createClient('', '')` lançar "supabaseUrl is required" dentro de um
 * `useState`, derrubando a tela inteira em branco.
 */
export const effectiveSupabaseUrl = clientUrl
export const effectiveSupabaseAnonKey = clientKey

/** Client raiz — banco da matriz. Autenticação (users/companies) sempre usa este. */
export const supabase = createClient(clientUrl, clientKey, clientOptions)

/** Cria um client apontando para o banco de outra empresa (filial). */
export function createCompanyClient(url: string, anonKey: string): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error('Empresa sem banco de dados configurado.')
  }
  return createClient(url, anonKey, clientOptions)
}