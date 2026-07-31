import { useMemo, useState } from 'react'
import { Search, Activity, ChevronDown, UserCheck } from 'lucide-react'
import { useSupabaseData } from '../hooks/useSupabaseData'
import type { Movement } from '../data/mock'

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Entrega:   { bg: 'rgba(99,102,241,0.12)',  text: '#A5B4FC', border: 'rgba(99,102,241,0.25)' },
  Devolução: { bg: 'rgba(34,211,238,0.12)',  text: '#67E8F9', border: 'rgba(34,211,238,0.25)' },
  Troca:     { bg: 'rgba(245,158,11,0.12)',  text: '#FCD34D', border: 'rgba(245,158,11,0.25)' },
  Entrada:   { bg: 'rgba(16,185,129,0.12)',  text: '#4ADE80', border: 'rgba(16,185,129,0.25)' },
  Baixa:     { bg: 'rgba(244,63,94,0.12)',   text: '#F87171', border: 'rgba(244,63,94,0.25)' },
  Distribuição: { bg: 'rgba(168,85,247,0.12)', text: '#D8B4FE', border: 'rgba(168,85,247,0.25)' },
}

const ICONS: Record<string, string> = {
  Entrega: '📤', Devolução: '📥', Troca: '🔄', Entrada: '📦', Baixa: '🗑', Distribuição: '🚚',
}

export default function Movements() {
  const { movements, loading } = useSupabaseData()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [mode, setMode] = useState<'lista' | 'conferencia'>('lista')
  const PER_PAGE = 50

  const filtered = movements.filter((m) => {
    const q = search.toLowerCase()
    const matchSearch = !q || m.employee.toLowerCase().includes(q) || m.epi.toLowerCase().includes(q)
    const matchType = typeFilter === 'all' || m.type === typeFilter
    return matchSearch && matchType
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const setTypeAndReset = (t: string) => { setTypeFilter(t); setPage(1) }

  // ── Conferência: agrupa saídas do app (mesmo cart_id) com foto + assinatura ──
  const withMedia = movements.filter((m) => m.photoUrl || m.signatureUrl)

  const groups = useMemo(() => {
    const map = new Map<string, Movement[]>()
    for (const m of withMedia) {
      const key = m.cartId ?? `mv-${m.id}`
      const list = map.get(key) ?? []
      list.push(m)
      map.set(key, list)
    }
    return Array.from(map.entries())
      .map(([key, list]) => ({
        key,
        list,
        date: list.reduce((max, m) => (m.date > max ? m.date : max), ''),
      }))
      .sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0))
  }, [withMedia])

  const filteredGroups = groups.filter((g) => {
    const q = search.toLowerCase()
    return !q || g.list.some((m) => m.employee.toLowerCase().includes(q) || m.epi.toLowerCase().includes(q))
  })

  const totalSaidas = groups.reduce((s, g) => s + g.list.reduce((t, m) => t + m.quantity, 0), 0)

  return (
    <div style={{ padding: '24px 28px', animation: 'fade-up 0.5s ease both' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#E8EAF6', margin: '0 0 4px', letterSpacing: '-0.03em' }}>
            Movimentações
          </h2>
          <p style={{ fontSize: 13, color: '#3D4257', margin: 0 }}>
            Sincronizado em tempo real com o aplicativo mobile
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ADE80', animation: 'pulse-glow 2s ease-in-out infinite', boxShadow: '0 0 8px rgba(74,222,128,0.6)' }} />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#4ADE80' }}>Tempo real</span>
        </div>
      </div>

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setMode('lista')} style={{
          padding: '8px 16px', borderRadius: 9, border: '1px solid',
          borderColor: mode === 'lista' ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)',
          background: mode === 'lista' ? 'rgba(99,102,241,0.12)' : 'rgba(13,15,24,0.9)',
          color: mode === 'lista' ? '#A5B4FC' : '#5C6388',
          fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
          display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-sans)',
        }}>
          <Activity size={14} /> Movimentações
        </button>
        <button onClick={() => setMode('conferencia')} style={{
          padding: '8px 16px', borderRadius: 9, border: '1px solid',
          borderColor: mode === 'conferencia' ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.07)',
          background: mode === 'conferencia' ? 'rgba(16,185,129,0.12)' : 'rgba(13,15,24,0.9)',
          color: mode === 'conferencia' ? '#4ADE80' : '#5C6388',
          fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
          display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-sans)',
        }}>
          <UserCheck size={14} /> Conferência
          {groups.length > 0 && (
            <span style={{
              background: mode === 'conferencia' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
              borderRadius: 20, padding: '1px 8px', fontSize: 10.5, fontWeight: 700, fontFamily: 'var(--font-mono)',
            }}>
              {groups.length}
            </span>
          )}
        </button>
      </div>

      {mode === 'conferencia' ? (
        <>
          {/* Conferência: saídas com foto + assinatura */}
          <div style={{
            background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 12,
          }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#3D4257' }} />
              <input className="input-field" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por colaborador ou EPI..." style={{ paddingLeft: 34, paddingTop: 9, paddingBottom: 9 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: 12, color: '#5C6388', fontFamily: 'var(--font-mono)' }}>
                {filteredGroups.length} saída{filteredGroups.length !== 1 ? 's' : ''} • {totalSaidas} un.
              </span>
            </div>
          </div>

          {loading ? (
            <div style={{ background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 48, textAlign: 'center', color: '#3D4257', fontSize: 13 }}>
              Carregando conferências...
            </div>
          ) : filteredGroups.length === 0 ? (
            <div style={{ background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 48, textAlign: 'center', color: '#3D4257', fontSize: 13 }}>
              Nenhuma saída com foto e assinatura encontrada.
              <div style={{ fontSize: 12, marginTop: 6, color: '#2D3050' }}>
                As saídas registradas no aplicativo mobile aparecem aqui para conferência.
              </div>
            </div>
          ) : (
            filteredGroups.map((g) => {
              const total = g.list.reduce((s, m) => s + m.quantity, 0)
              const first = g.list[0]
              return (
                <div key={g.key} style={{
                  background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 14, padding: '16px 18px', marginBottom: 12, animation: 'fade-up 0.3s ease both',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                        background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, color: '#A5B4FC', fontSize: 13.5, fontFamily: 'var(--font-mono)',
                      }}>
                        {first.employee.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#E8EAF6' }}>{first.employee}</div>
                        <div style={{ fontSize: 11.5, color: '#5C6388', fontFamily: 'var(--font-mono)' }}>{g.date}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 11, padding: '3px 8px', borderRadius: 6,
                        background: 'rgba(99,102,241,0.08)', color: '#818CF8',
                        border: '1px solid rgba(99,102,241,0.18)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap',
                      }}>
                        {first.operator}
                      </span>
                      {first.company && (
                        <span style={{ fontSize: 11, color: '#3D4257', fontFamily: 'var(--font-mono)' }}>→ {first.company}</span>
                      )}
                      <span style={{
                        fontSize: 11.5, padding: '4px 10px', borderRadius: 20, fontWeight: 700, fontFamily: 'var(--font-mono)',
                        background: 'rgba(16,185,129,0.12)', color: '#4ADE80', border: '1px solid rgba(16,185,129,0.25)',
                      }}>
                        {total} un.
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                    {g.list.map((m) => (
                      <span key={m.id} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '5px 10px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                        fontSize: 12, color: '#9BA3C4',
                      }}>
                        {m.epi}
                        <strong style={{ color: '#E8EAF6', fontFamily: 'var(--font-mono)' }}>x{m.quantity}</strong>
                        {(m.color || m.size) && (
                          <span style={{ color: '#3D4257', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                            {[m.color, m.size].filter(Boolean).join(' / ')}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <MediaCard
                      title="Foto do colaborador"
                      url={first.photoUrl}
                      emptyIcon="👤"
                      onOpen={() => first.photoUrl && window.open(first.photoUrl, '_blank')}
                    />
                    <MediaCard
                      title="Assinatura"
                      url={first.signatureUrl}
                      emptyIcon="✍️"
                      onOpen={() => first.signatureUrl && window.open(first.signatureUrl, '_blank')}
                    />
                  </div>
                </div>
              )
            })
          )}
        </>
      ) : (
      <>
      {/* Type pill filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => setTypeAndReset('all')} style={{
          padding: '7px 14px', borderRadius: 9, border: '1px solid',
          borderColor: typeFilter === 'all' ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)',
          background: typeFilter === 'all' ? 'rgba(99,102,241,0.12)' : 'rgba(13,15,24,0.9)',
          color: typeFilter === 'all' ? '#A5B4FC' : '#5C6388',
          fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
          fontFamily: 'var(--font-sans)',
        }}>
          Todos ({movements.length})
        </button>
        {Object.entries(TYPE_COLORS).map(([type, colors]) => {
          const count = movements.filter((m) => m.type === type).length
          return (
            <button key={type} onClick={() => setTypeAndReset(typeFilter === type ? 'all' : type)} style={{
              padding: '7px 14px', borderRadius: 9, border: `1px solid`,
              borderColor: typeFilter === type ? colors.border : 'rgba(255,255,255,0.07)',
              background: typeFilter === type ? colors.bg : 'rgba(13,15,24,0.9)',
              color: typeFilter === type ? colors.text : '#5C6388',
              fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--font-sans)',
            }}>
              <span>{ICONS[type]}</span> {type} ({count})
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div style={{
        background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 12,
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#3D4257' }} />
          <input className="input-field" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Buscar por colaborador ou EPI..." style={{ paddingLeft: 34, paddingTop: 9, paddingBottom: 9 }} />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Tipo</th>
                <th>Colaborador</th>
                <th>EPI</th>
                <th>Quantidade</th>
                <th>Data / Hora</th>
                <th>Origem</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 48, color: '#3D4257' }}>Carregando movimentações...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 48, color: '#3D4257' }}>Nenhuma movimentação encontrada.</td></tr>
              ) : paged.map((m) => {
                const colors = TYPE_COLORS[m.type]
                return (
                  <tr key={m.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#3D4257' }}>#{m.id.toString().padStart(4, '0')}</td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '4px 10px', borderRadius: 20,
                        background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
                        fontSize: 11.5, fontWeight: 600,
                      }}>
                        {ICONS[m.type]} {m.type}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: '#C4C9E2', fontWeight: 500 }}>{m.employee}</td>
                    <td style={{ fontSize: 12.5, color: '#9BA3C4' }}>{m.epi}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: '#E8EAF6' }}>{m.quantity}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: '#5C6388' }}>{m.date}</td>
                    <td>
                      <span style={{
                        fontSize: 11, padding: '3px 8px', borderRadius: 6,
                        background: m.operator === 'App Mobile' ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.04)',
                        color: m.operator === 'App Mobile' ? '#818CF8' : '#5C6388',
                        border: `1px solid ${m.operator === 'App Mobile' ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.07)'}`,
                        fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap',
                      }}>
                        {m.operator}
                      </span>
                      {m.company && (
                        <div style={{ fontSize: 10.5, color: '#3D4257', marginTop: 3, fontFamily: 'var(--font-mono)' }}>
                          → {m.company}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: '#3D4257', maxWidth: 180 }}>{m.notes || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: '#3D4257', fontFamily: 'var(--font-mono)' }}>
            {filtered.length} movimentação{filtered.length !== 1 ? 'ões' : ''} • Página {page}/{totalPages}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: page <= 1 ? 'not-allowed' : 'pointer',
              background: page <= 1 ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.12)',
              border: `1px solid ${page <= 1 ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.3)'}`,
              color: page <= 1 ? '#3D4257' : '#A5B4FC', fontFamily: 'var(--font-sans)',
            }}>‹ Anterior</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              background: page >= totalPages ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.12)',
              border: `1px solid ${page >= totalPages ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.3)'}`,
              color: page >= totalPages ? '#3D4257' : '#A5B4FC', fontFamily: 'var(--font-sans)',
            }}>Próxima ›</button>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  )
}

function MediaCard({ title, url, emptyIcon, onOpen }: {
  title: string
  url?: string
  emptyIcon: string
  onOpen: () => void
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 12, padding: 10, display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#5C6388', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {title}
      </div>
      {url ? (
        <div style={{ cursor: 'pointer' }} onClick={onOpen} title="Clique para ampliar">
          <img
            src={url}
            alt={title}
            style={{ width: '100%', height: 170, objectFit: 'contain', borderRadius: 10, background: 'rgba(0,0,0,0.25)' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextElementSibling?.setAttribute('style', 'display:flex')
            }}
          />
          <div style={{ display: 'none', height: 170, alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#3D4257', borderRadius: 10 }}>
            Imagem indisponível
          </div>
        </div>
      ) : (
        <div style={{
          height: 170, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 10, background: 'rgba(0,0,0,0.25)', fontSize: 28, color: '#2D3050',
        }}>
          {emptyIcon}
        </div>
      )}
    </div>
  )
}
