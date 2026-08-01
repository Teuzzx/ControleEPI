/**
 * Versão atual do sistema web (bump manual a cada release).
 * A mesma versão deve constar no `app-version.json` publicado no site.
 */
export const APP_VERSION = '1.0.10'

export interface AppUpdate {
  version: string
  notes: string
}

function isNewer(a: string, b: string): boolean {
  const parts = (s: string) => s.split('.').map((p) => Number.parseInt(p.trim(), 10) || 0)
  const pa = parts(a)
  const pb = parts(b)
  for (let i = 0; i < pa.length || i < pb.length; i++) {
    const da = i < pa.length ? pa[i] : 0
    const db = i < pb.length ? pb[i] : 0
    if (da !== db) return da > db
  }
  return false
}

/** Consulta `app-version.json` e devolve os dados se houver versão mais nova. */
export async function checkForAppUpdate(): Promise<AppUpdate | null> {
  try {
    const res = await fetch('/app-version.json', { cache: 'no-store' })
    if (!res.ok) return null
    const json = (await res.json()) as { version?: string; notes?: string }
    if (!json.version || !isNewer(json.version, APP_VERSION)) return null
    return { version: json.version, notes: json.notes ?? '' }
  } catch {
    return null
  }
}
