import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { supabase, supabaseUrl, supabaseAnonKey } from './supabase'

export interface SessionUser {
  id: number
  name: string
  email: string
  role: 'matriz' | 'filial'
  companyId: number | null
  companyName: string
  companyUrl: string
  companyKey: string
  /** Token de sessão gerado no banco (tabela sessions). */
  token: string
  /** Timestamp de expiração da sessão. */
  expiresAt: number
}

export interface Company {
  id: number
  name: string
  is_matriz: boolean
  supabase_url: string
  anon_key: string
  color: string
}

const SESSION_KEY = 'epi_session'
const SESSION_TTL_MS = 12 * 60 * 60 * 1000

/**
 * Cliente autenticado (matriz) — envia o token de sessão no header
 * `x-session-token` para as políticas de RLS validarem.
 */
let authedClient: SupabaseClient | null = null

function tokenHeader(token?: string): Record<string, string> {
  return token ? { 'x-session-token': token } : {}
}

export function getAuthClient(): SupabaseClient {
  if (authedClient) return authedClient
  const session = loadSession()
  authedClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: tokenHeader(session?.token) },
  })
  return authedClient
}

export function resetAuthClient(): void {
  authedClient = null
}

/** Cliente apontando para o banco de uma filial, autenticado com o token. */
export function createSessionClient(url: string, anonKey: string, token: string): SupabaseClient {
  return createClient(url, anonKey, { global: { headers: tokenHeader(token) } })
}

/**
 * Login verificado no banco pela função `app_login` (security definer):
 * a senha é comparada com o hash dentro do Postgres e o usuário nunca é
 * listado via anon key. Retorna um token de sessão válido por 12h.
 */
export async function login(email: string, password: string): Promise<SessionUser> {
  const { data, error } = await supabase.rpc('app_login', {
    p_email: email.trim(),
    p_password: password,
  })

  if (error || !Array.isArray(data) || data.length === 0 || !data[0]?.token) {
    throw new Error('Credenciais inválidas. Verifique e tente novamente.')
  }

  const row = data[0] as Record<string, unknown>

  return {
    id: Number(row.user_id),
    name: String(row.user_name),
    email: String(row.user_email),
    role: String(row.user_role) === 'filial' ? 'filial' : 'matriz',
    companyId: row.company_id != null ? Number(row.company_id) : null,
    companyName: String(row.company_name || 'Matriz Central'),
    companyUrl: String(row.company_url || ''),
    companyKey: String(row.company_key || ''),
    token: String(row.token),
    expiresAt: Date.now() + SESSION_TTL_MS,
  }
}

export async function fetchCompanies(): Promise<Company[]> {
  const { data, error } = await getAuthClient()
    .from('companies')
    .select('*')
    .order('is_matriz', { ascending: false })
    .order('id', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Company[]
}

/** Matriz cria uma empresa filha e a conta de login dela (feito no banco via RPC). */
export async function createCompanyAndUser(params: {
  name: string
  supabaseUrl?: string
  anonKey?: string
  color?: string
  adminName: string
  adminEmail: string
  adminPassword: string
}): Promise<void> {
  const { error } = await getAuthClient().rpc('app_create_company', {
    p_name: params.name.trim(),
    p_admin_name: params.adminName.trim(),
    p_admin_email: params.adminEmail.trim(),
    p_admin_password: params.adminPassword,
    p_supabase_url: params.supabaseUrl ?? '',
    p_anon_key: params.anonKey ?? '',
    p_color: params.color ?? '#22D3EE',
  })
  if (error) throw new Error(error.message)
}

export async function updateCompanyConnection(id: number, url: string, key: string): Promise<void> {
  const { error } = await getAuthClient().rpc('app_update_company_connection', {
    p_id: id,
    p_url: url,
    p_key: key,
  })
  if (error) throw new Error(error.message)
}

/** Sessão em sessionStorage: sobrevive a recarregamentos (F5), mas exige login ao fechar a aba. */
export function saveSession(user: SessionUser): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function loadSession(): SessionUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const user = JSON.parse(raw) as SessionUser
    if (!user.token || !user.expiresAt || user.expiresAt <= Date.now()) {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }
    return user
  } catch {
    return null
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY)
  resetAuthClient()
}
