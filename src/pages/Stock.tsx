import { useState } from 'react'
import { Search, Plus, Eye, X, Package, ChevronDown, ChevronRight, Edit2, Trash2, Save } from 'lucide-react'
import { useSupabaseData } from '../hooks/useSupabaseData'
import type { Epi } from '../data/mock'

interface VariantRow {
  color: string
  size: string
  quantity: string
}

interface EpiForm {
  name: string
  category: string
  subcategory: string
  manufacturer: string
  supplier: string
  description: string
  caNumber: string
  caExpiry: string
  batchNumber: string
  manufacturingDate: string
  totalQuantity: string
  minQuantity: string
  location: string
  notes: string
}

const EMPTY_FORM: EpiForm = {
  name: '', category: '', subcategory: '', manufacturer: '', supplier: '',
  description: '', caNumber: '', caExpiry: '', batchNumber: '', manufacturingDate: '',
  totalQuantity: '', minQuantity: '', location: '', notes: '',
}

function caDaysLeft(expiry?: string): number | null {
  if (!expiry) return null
  const d = new Date(expiry)
  if (Number.isNaN(d.getTime())) return null
  return Math.ceil((d.getTime() - Date.now()) / 86400000)
}

function caChipColor(days: number | null): { bg: string; text: string } {
  if (days === null) return { bg: 'rgba(255,255,255,0.04)', text: '#5C6388' }
  if (days < 0) return { bg: 'rgba(244,63,94,0.12)', text: '#F87171' }
  if (days <= 60) return { bg: 'rgba(245,158,11,0.12)', text: '#FCD34D' }
  return { bg: 'rgba(16,185,129,0.12)', text: '#4ADE80' }
}

export default function Stock() {
  const { epis, categories, loading, addEpi, updateEpi, deleteEpi } = useSupabaseData()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<Epi | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Epi | null>(null)
  const [form, setForm] = useState<EpiForm>(EMPTY_FORM)
  const [variants, setVariants] = useState<VariantRow[]>([{ color: '', size: '', quantity: '' }])
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setVariants([{ color: '', size: '', quantity: '' }])
    setErrorMsg('')
    setShowModal(true)
  }

  const openEdit = (epi: Epi) => {
    setEditing(epi)
    setForm({
      name: epi.name,
      category: epi.category,
      subcategory: epi.subcategory,
      manufacturer: epi.manufacturer,
      supplier: epi.supplier,
      description: epi.description,
      caNumber: epi.caNumber || '',
      caExpiry: epi.caExpiry || '',
      batchNumber: epi.batchNumber,
      manufacturingDate: epi.manufacturingDate,
      totalQuantity: String(epi.totalQuantity),
      minQuantity: String(epi.minQuantity),
      location: epi.location,
      notes: epi.notes || '',
    })
    setVariants(epi.variants.length > 0
      ? epi.variants.map((v) => ({ color: v.color, size: v.size, quantity: String(v.quantity) }))
      : [{ color: '', size: '', quantity: '' }])
    setErrorMsg('')
    setShowModal(true)
  }

  const set = (key: keyof EpiForm, val: string) => setForm((prev) => ({ ...prev, [key]: val }))

  const setVariant = (idx: number, key: 'color' | 'size' | 'quantity', val: string) =>
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, [key]: val } : v)))

  const variantTotal = variants.reduce((s, v) => s + (parseInt(v.quantity) || 0), 0)

  const handleSave = async () => {
    if (!form.name.trim()) {
      setErrorMsg('Informe o nome do EPI.')
      return
    }
    const cleanVariants = variants
      .map((v) => ({ color: v.color.trim(), size: v.size.trim(), quantity: parseInt(v.quantity) || 0 }))
      .filter((v) => v.quantity > 0)
    setSaving(true)
    setErrorMsg('')
    try {
      const data = {
        name: form.name,
        category: form.category,
        subcategory: form.subcategory,
        manufacturer: form.manufacturer,
        supplier: form.supplier,
        description: form.description,
        caNumber: form.caNumber,
        caExpiry: form.caExpiry,
        batchNumber: form.batchNumber,
        manufacturingDate: form.manufacturingDate,
        totalQuantity: parseInt(form.totalQuantity) || 0,
        minQuantity: parseInt(form.minQuantity) || 0,
        location: form.location,
        variants: cleanVariants,
        notes: form.notes,
      }
      if (editing) {
        await updateEpi(editing.id, data)
      } else {
        await addEpi(data)
      }
      setShowModal(false)
    } catch (err) {
      setErrorMsg((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (epi: Epi) => {
    if (!window.confirm(`Excluir "${epi.name}" e suas variações?`)) return
    try {
      await deleteEpi(epi.id)
    } catch (err) {
      alert(`Erro ao excluir: ${(err as Error).message}`)
    }
  }

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
            {loading ? 'Carregando...' : `${epis.length} produtos cadastrados • ${epis.reduce((s, e) => s + e.totalQuantity, 0).toLocaleString('pt-BR')} unidades totais`}
          </p>
        </div>
        <button onClick={openAdd} style={{
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button onClick={() => openEdit(epi)} title="Editar" style={{
                      width: 28, height: 28, borderRadius: 7,
                      background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#67E8F9', transition: 'background 0.15s',
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(34,211,238,0.2)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(34,211,238,0.1)' }}
                    >
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleDelete(epi)} title="Excluir" style={{
                      width: 28, height: 28, borderRadius: 7,
                      background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#F87171', transition: 'background 0.15s',
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.2)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.1)' }}
                    >
                      <Trash2 size={12} />
                    </button>
                    <span className={`badge ${statusColor[epi.status]}`}>{epi.status}</span>
                  </div>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#3D4257', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>📍 {epi.location}</span>
                  {epi.caNumber && (() => {
                    const days = caDaysLeft(epi.caExpiry)
                    const chip = caChipColor(days)
                    return (
                      <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: chip.text, background: chip.bg, padding: '2px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>
                        {epi.caNumber}
                        {days !== null && (
                          <span style={{ marginLeft: 4 }}>
                            • {days < 0 ? 'CA vencido' : `CA vence ${days}d`}
                          </span>
                        )}
                      </span>
                    )
                  })()}
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

      {/* Add / Edit modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content glass-strong" style={{ width: '100%', maxWidth: 640, borderRadius: 20, padding: '32px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#E8EAF6', margin: '0 0 2px', letterSpacing: '-0.02em' }}>
                  {editing ? 'Editar EPI' : 'Cadastrar EPI'}
                </h3>
                <span style={{ fontSize: 12, color: '#3D4257' }}>Ficha do produto, quantidades e variações</span>
              </div>
              <button onClick={() => setShowModal(false)} style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#5C6388' }}>
                <X size={15} />
              </button>
            </div>

            {/* Basic info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Nome do EPI *</label>
                <input className="input-field" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex: Calça de Segurança" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Categoria</label>
                <select className="input-field" style={{ appearance: 'none' }} value={form.category} onChange={(e) => set('category', e.target.value)}>
                  <option value="">Selecione...</option>
                  {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Subcategoria</label>
                <input className="input-field" value={form.subcategory} onChange={(e) => set('subcategory', e.target.value)} placeholder="Ex: Calça com elastano" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Fabricante</label>
                <input className="input-field" value={form.manufacturer} onChange={(e) => set('manufacturer', e.target.value)} placeholder="Ex: 3M" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Fornecedor</label>
                <input className="input-field" value={form.supplier} onChange={(e) => set('supplier', e.target.value)} placeholder="Ex: Safety Plus Ltda" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Número CA</label>
                <input className="input-field" value={form.caNumber} onChange={(e) => set('caNumber', e.target.value)} placeholder="Ex: 12345" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Validade do CA</label>
                <input className="input-field" type="date" value={form.caExpiry} onChange={(e) => set('caExpiry', e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Lote</label>
                <input className="input-field" value={form.batchNumber} onChange={(e) => set('batchNumber', e.target.value)} placeholder="Ex: L2024-001" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Data de Fabricação</label>
                <input className="input-field" type="date" value={form.manufacturingDate} onChange={(e) => set('manufacturingDate', e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Local de Armazenamento</label>
                <input className="input-field" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Ex: Almoxarifado A3" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Quantidade Total</label>
                <input className="input-field" type="number" min={0} value={form.totalQuantity} onChange={(e) => set('totalQuantity', e.target.value)} placeholder="Ex: 100" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Estoque Mínimo</label>
                <input className="input-field" type="number" min={0} value={form.minQuantity} onChange={(e) => set('minQuantity', e.target.value)} placeholder="Ex: 20" />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Descrição</label>
                <input className="input-field" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Descrição do produto" />
              </div>
            </div>

            {/* Variants */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#818CF8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Variações (tamanho / cor)</label>
                <button onClick={() => setVariants((prev) => [...prev, { color: '', size: '', quantity: '' }])} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 11.5, fontWeight: 600, color: '#A5B4FC',
                  background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                  borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}>
                  <Plus size={11} /> Adicionar variação
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {variants.map((v, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input className="input-field" value={v.color} onChange={(e) => setVariant(idx, 'color', e.target.value)} placeholder="Cor (opcional)" style={{ flex: 1 }} />
                    <input className="input-field" value={v.size} onChange={(e) => setVariant(idx, 'size', e.target.value)} placeholder="Tamanho (ex: M, 42)" style={{ flex: 1 }} />
                    <input className="input-field" type="number" min={0} value={v.quantity} onChange={(e) => setVariant(idx, 'quantity', e.target.value)} placeholder="Qtd" style={{ flex: 0.6, fontFamily: 'var(--font-mono)' }} />
                    <button onClick={() => setVariants((prev) => prev.filter((_, i) => i !== idx))} disabled={variants.length === 1} title="Remover" style={{
                      width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                      background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: variants.length === 1 ? 'not-allowed' : 'pointer', color: '#F87171', opacity: variants.length === 1 ? 0.35 : 1,
                    }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: '#3D4257', fontFamily: 'var(--font-mono)' }}>
                Soma das variações: <strong style={{ color: variantTotal > 0 ? '#4ADE80' : '#5C6388' }}>{variantTotal}</strong> · Total do produto: <strong style={{ color: '#E8EAF6' }}>{parseInt(form.totalQuantity) || 0}</strong>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Observações</label>
              <input className="input-field" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Observações (opcional)" />
            </div>

            {errorMsg && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 10, padding: '10px 14px', marginBottom: 14,
              }}>
                <span style={{ fontSize: 12.5, color: '#F87171' }}>{errorMsg}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#9BA3C4', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} style={{
                flex: 1, padding: '11px', borderRadius: 10,
                background: 'linear-gradient(135deg, #6366F1, #4F46E5)', border: 'none',
                color: 'white', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600,
                cursor: 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <Save size={14} /> {saving ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Cadastrar EPI'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
