import { useState } from 'react'
import { Search, Plus, Eye, X, Package, ChevronDown, ChevronRight } from 'lucide-react'
import { epis as initialEpis, categories, type Epi } from '../data/mock'

export default function Stock() {
  const [epis] = useState(initialEpis)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<Epi | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const filtered = epis.filter((e) => {
    const q = search.toLowerCase()
    const matchSearch = !q || e.name.toLowerCase().includes(q) || e.manufacturer.toLowerCase().includes(q)
    const matchCat = catFilter === 'all' || e.category === catFilter
    const matchStatus = statusFilter === 'all' || e.status === statusFilter
    return matchSearch && matchCat && matchStatus
  })

  const statusColor: Record<string, string> = {
    'Disponível': 'badge-success',
    'Estoque Baixo': 'badge-warning',
    'Crítico': 'badge-danger',
  }

  return (
    <div style={{ padding: '24px 28px', animation: 'fade-up 0.5s ease both' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#E8EAF6', margin: '0 0 4px', letterSpacing: '-0.03em' }}>
            Estoque de EPIs
          </h2>
          <p style={{ fontSize: 13, color: '#3D4257', margin: 0 }}>
            {epis.length} produtos cadastrados • {epis.reduce((s, e) => s + e.totalQuantity, 0).toLocaleString('pt-BR')} unidades totais
          </p>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
          color: 'white', border: 'none', borderRadius: 10,
          padding: '10px 18px', cursor: 'pointer',
          fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 600,
          boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.4)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.3)' }}
        >
          <Plus size={15} strokeWidth={2.5} />
          Cadastrar EPI
        </button>
      </div>

      {/* Stat pills */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Disponível', count: epis.filter(e => e.status === 'Disponível').length, color: '#4ADE80' },
          { label: 'Estoque Baixo', count: epis.filter(e => e.status === 'Estoque Baixo').length, color: '#FCD34D' },
          { label: 'Crítico', count: epis.filter(e => e.status === 'Crítico').length, color: '#F87171' },
        ].map(({ label, count, color }) => (
          <button key={label}
            onClick={() => setStatusFilter(statusFilter === label ? 'all' : label)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10,
              background: statusFilter === label ? `${color}14` : 'rgba(13,15,24,0.9)',
              border: `1px solid ${statusFilter === label ? `${color}35` : 'rgba(255,255,255,0.07)'}`,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
            <span style={{ fontSize: 12.5, fontWeight: 500, color: '#9BA3C4' }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{count}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, padding: '14px 16px', marginBottom: 16,
        display: 'flex', gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#3D4257' }} />
          <input className="input-field" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produto ou fabricante..." style={{ paddingLeft: 34, paddingTop: 9, paddingBottom: 9 }} />
        </div>
        <div style={{ position: 'relative' }}>
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
            style={{ appearance: 'none', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, padding: '9px 32px 9px 14px', color: '#9BA3C4', fontSize: 13, fontFamily: 'var(--font-sans)', cursor: 'pointer', outline: 'none', minWidth: 180 }}>
            <option value="all">Todas as Categorias</option>
            {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <ChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#5C6388', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* Cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {filtered.map((epi, idx) => {
          const pct = Math.round((epi.totalQuantity / epi.minQuantity) * 100)
          const isExpanded = expanded[epi.id]
          return (
            <div key={epi.id} style={{
              background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, overflow: 'hidden',
              animation: `fade-up 0.5s ease both`, animationDelay: `${idx * 0.04}s`,
              transition: 'border-color 0.2s, transform 0.2s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = '' }}
            >
              <div style={{ padding: '16px 18px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Package size={18} color="#818CF8" />
                  </div>
                  <span className={`badge ${statusColor[epi.status]}`}>{epi.status}</span>
                </div>

                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#C4C9E2', margin: '0 0 3px', letterSpacing: '-0.015em', lineHeight: 1.3 }}>
                  {epi.name}
                </h4>
                <p style={{ fontSize: 11.5, color: '#3D4257', margin: '0 0 12px' }}>{epi.category} • {epi.manufacturer}</p>

                {/* Stock bar */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: '#5C6388' }}>Estoque atual</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#C4C9E2', fontFamily: 'var(--font-mono)' }}>
                      {epi.totalQuantity.toLocaleString('pt-BR')}
                      <span style={{ fontSize: 10.5, color: '#3D4257', fontWeight: 400 }}> / mín {epi.minQuantity}</span>
                    </span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      width: `${Math.min(Math.max(pct, 3), 100)}%`,
                      background: epi.status === 'Crítico'
                        ? 'linear-gradient(90deg, #F43F5E, #FB7185)'
                        : epi.status === 'Estoque Baixo'
                          ? 'linear-gradient(90deg, #F59E0B, #FCD34D)'
                          : 'linear-gradient(90deg, #6366F1, #818CF8)',
                      transition: 'width 1s ease',
                    }} />
                  </div>
                </div>

                {/* Location + CA */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: '#3D4257' }}>📍 {epi.location}</span>
                  {epi.caNumber && (
                    <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: '#5C6388', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 6 }}>
                      {epi.caNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Variants toggle */}
              <button
                onClick={() => setExpanded(prev => ({ ...prev, [epi.id]: !isExpanded }))}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 18px', background: 'rgba(255,255,255,0.025)',
                  borderTop: '1px solid rgba(255,255,255,0.05)', border: 'none',
                  cursor: 'pointer', color: '#5C6388',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.045)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
              >
                <span style={{ fontSize: 11.5, fontWeight: 600, color: '#5C6388', fontFamily: 'var(--font-mono)' }}>
                  {epi.variants.length} variação{epi.variants.length !== 1 ? 'ões' : ''}
                </span>
                {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>

              {isExpanded && (
                <div style={{ padding: '8px 18px 14px', animation: 'fade-up 0.2s ease' }}>
                  {/* Group by color */}
                  {Array.from(new Set(epi.variants.map(v => v.color))).map((color) => {
                    const colorVariants = epi.variants.filter(v => v.color === color)
                    return (
                      <div key={color} style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#3D4257', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
                          {color}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {colorVariants.map((v) => (
                            <div key={v.id} style={{
                              padding: '4px 10px', borderRadius: 7,
                              background: v.quantity <= v.minQuantity ? 'rgba(244,63,94,0.1)' : 'rgba(255,255,255,0.04)',
                              border: `1px solid ${v.quantity <= v.minQuantity ? 'rgba(244,63,94,0.2)' : 'rgba(255,255,255,0.07)'}`,
                            }}>
                              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#9BA3C4' }}>{v.size}</span>
                              <span style={{ fontSize: 11, color: v.quantity <= v.minQuantity ? '#F87171' : '#5C6388', marginLeft: 6 }}>{v.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

    </div>
  )
}
