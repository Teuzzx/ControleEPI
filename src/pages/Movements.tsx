import { useState } from 'react'
import { Search, Activity, ChevronDown } from 'lucide-react'
import { movements } from '../data/mock'

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Entrega:   { bg: 'rgba(99,102,241,0.12)',  text: '#A5B4FC', border: 'rgba(99,102,241,0.25)' },
  Devolução: { bg: 'rgba(34,211,238,0.12)',  text: '#67E8F9', border: 'rgba(34,211,238,0.25)' },
  Troca:     { bg: 'rgba(245,158,11,0.12)',  text: '#FCD34D', border: 'rgba(245,158,11,0.25)' },
  Entrada:   { bg: 'rgba(16,185,129,0.12)',  text: '#4ADE80', border: 'rgba(16,185,129,0.25)' },
  Baixa:     { bg: 'rgba(244,63,94,0.12)',   text: '#F87171', border: 'rgba(244,63,94,0.25)' },
}

const ICONS: Record<string, string> = {
  Entrega: '📤', Devolução: '📥', Troca: '🔄', Entrada: '📦', Baixa: '🗑',
}

export default function Movements() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const filtered = movements.filter((m) => {
    const q = search.toLowerCase()
    const matchSearch = !q || m.employee.toLowerCase().includes(q) || m.epi.toLowerCase().includes(q)
    const matchType = typeFilter === 'all' || m.type === typeFilter
    return matchSearch && matchType
  })

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

      {/* Type pill filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => setTypeFilter('all')} style={{
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
            <button key={type} onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)} style={{
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
          <input className="input-field" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por colaborador ou EPI..." style={{ paddingLeft: 34, paddingTop: 9, paddingBottom: 9 }} />
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
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 48, color: '#3D4257' }}>Nenhuma movimentação encontrada.</td></tr>
              ) : filtered.map((m) => {
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
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {m.operator}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: '#3D4257', maxWidth: 180 }}>{m.notes || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: 12, color: '#3D4257', fontFamily: 'var(--font-mono)' }}>
            {filtered.length} movimentação{filtered.length !== 1 ? 'ões' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}
