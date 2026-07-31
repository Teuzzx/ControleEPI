import { useState } from 'react'
import { Plus, X, Package, Warehouse, Trash2 } from 'lucide-react'
import { useSupabaseData } from '../hooks/useSupabaseData'

interface VariantRow {
  color: string
  size: string
  quantity: string
}

export default function Entries() {
  const { entries, loading, addEntry } = useSupabaseData()
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [form, setForm] = useState({
    epi: '',
    manufacturer: '',
    supplier: '',
    batch: '',
    date: '',
    notes: '',
  })
  const [variants, setVariants] = useState<VariantRow[]>([{ color: '', size: '', quantity: '' }])
  const [page, setPage] = useState(1)
  const PER_PAGE = 30
  const totalPages = Math.max(1, Math.ceil(entries.length / PER_PAGE))
  const pagedEntries = entries.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const set = (key: string, val: string) => setForm((prev) => ({ ...prev, [key]: val }))

  const setVariant = (idx: number, key: 'color' | 'size' | 'quantity', val: string) =>
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, [key]: val } : v)))

  const addVariantRow = () => setVariants((prev) => [...prev, { color: '', size: '', quantity: '' }])
  const removeVariantRow = (idx: number) => setVariants((prev) => prev.filter((_, i) => i !== idx))

  const totalUnits = variants.reduce((s, v) => s + (parseInt(v.quantity) || 0), 0)

  const resetForm = () => {
    setForm({ epi: '', manufacturer: '', supplier: '', batch: '', date: '', notes: '' })
    setVariants([{ color: '', size: '', quantity: '' }])
    setErrorMsg('')
  }

  const handleAdd = async () => {
    if (!form.epi.trim()) {
      setErrorMsg('Informe o nome do produto.')
      return
    }
    if (totalUnits <= 0) {
      setErrorMsg('Informe ao menos uma quantidade (linhas com quantidade 0 serão ignoradas).')
      return
    }
    const cleanVariants = variants
      .map((v) => ({ color: v.color.trim(), size: v.size.trim(), quantity: parseInt(v.quantity) || 0 }))
      .filter((v) => v.quantity > 0)
    if (cleanVariants.length === 0) return

    setSaving(true)
    setErrorMsg('')
    try {
      await addEntry({
        epi: form.epi.trim(),
        manufacturer: form.manufacturer,
        supplier: form.supplier,
        batch: form.batch,
        date: form.date,
        variants: cleanVariants,
        notes: form.notes,
      })
      resetForm()
      setShowAdd(false)
    } catch (err) {
      setErrorMsg((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: '24px 28px', animation: 'fade-up 0.5s ease both' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#E8EAF6', margin: '0 0 4px', letterSpacing: '-0.03em' }}>Entradas de Estoque</h2>
          <p style={{ fontSize: 13, color: '#3D4257', margin: 0 }}>Registro de produtos recebidos de fornecedores</p>
        </div>
        <button onClick={() => { setShowAdd(true); resetForm() }} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: 'white', border: 'none',
          borderRadius: 10, padding: '10px 18px', cursor: 'pointer',
          fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 600,
          boxShadow: '0 4px 16px rgba(99,102,241,0.3)', transition: 'transform 0.15s',
        }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
        >
          <Plus size={15} strokeWidth={2.5} /> Registrar Entrada
        </button>
      </div>

      {/* Info banner */}
      <div style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Warehouse size={16} color="#67E8F9" />
        <span style={{ fontSize: 13, color: '#67E8F9' }}>Entradas registradas aqui atualizam automaticamente o estoque de cada produto e suas variações.</span>
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Produto</th>
                <th>Fabricante / Fornecedor</th>
                <th>Lote</th>
                <th>Data</th>
                <th>Qtd</th>
                <th>Cor / Tamanho</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 48, color: '#3D4257' }}>Carregando entradas...</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 48, color: '#3D4257' }}>Nenhuma entrada registrada.</td></tr>
              ) : pagedEntries.map((entry, idx) => {
                const detail = [entry.color, entry.size].filter(Boolean).join(' / ')
                return (
                  <tr key={entry.id} style={{ animation: `fade-up 0.4s ease both`, animationDelay: `${idx * 0.04}s` }}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#3D4257' }}>#{entry.id.toString().padStart(4, '0')}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Package size={14} color="#818CF8" />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#C4C9E2' }}>{entry.epi}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13, color: '#9BA3C4' }}>{entry.manufacturer || '—'}</div>
                      <div style={{ fontSize: 11.5, color: '#3D4257' }}>{entry.supplier || '—'}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#818CF8' }}>{entry.batch || '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#5C6388' }}>
                      {entry.date ? new Date(entry.date).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: '#4ADE80' }}>+{entry.quantity}</span>
                    </td>
                    <td style={{ fontSize: 12.5, color: '#6B7280' }}>{detail || '—'}</td>
                    <td style={{ fontSize: 12, color: '#3D4257' }}>{entry.notes || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: '#3D4257', fontFamily: 'var(--font-mono)' }}>{entries.length} entrada{entries.length !== 1 ? 's' : ''} registrada{entries.length !== 1 ? 's' : ''} • Página {page}/{totalPages}</span>
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

      {/* Add modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal-content glass-strong" style={{ width: '100%', maxWidth: 620, borderRadius: 20, padding: '32px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#E8EAF6', margin: '0 0 2px', letterSpacing: '-0.02em' }}>Registrar Entrada</h3>
                <span style={{ fontSize: 12, color: '#3D4257' }}>Chegou mercadoria? Informe o produto e as quantidades por tamanho/cor.</span>
              </div>
              <button onClick={() => setShowAdd(false)} style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#5C6388' }}>
                <X size={15} />
              </button>
            </div>

            {/* Product info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Produto *</label>
                <input className="input-field" value={form.epi} onChange={(e) => set('epi', e.target.value)} placeholder="Ex: Calça de Segurança" />
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
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Número do Lote</label>
                <input className="input-field" value={form.batch} onChange={(e) => set('batch', e.target.value)} placeholder="Ex: L2024-001" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Data de Entrada</label>
                <input className="input-field" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
              </div>
            </div>

            {/* Variants */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#818CF8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                  Tamanhos / Cores
                </label>
                <button onClick={addVariantRow} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 11.5, fontWeight: 600, color: '#A5B4FC',
                  background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                  borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}>
                  <Plus size={11} /> Adicionar linha
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {variants.map((v, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input className="input-field" value={v.color} onChange={(e) => setVariant(idx, 'color', e.target.value)} placeholder="Cor (opcional)" style={{ flex: 1 }} />
                    <input className="input-field" value={v.size} onChange={(e) => setVariant(idx, 'size', e.target.value)} placeholder="Tamanho (ex: M, 42)" style={{ flex: 1 }} />
                    <input className="input-field" type="number" min={0} value={v.quantity} onChange={(e) => setVariant(idx, 'quantity', e.target.value)} placeholder="Qtd" style={{ flex: 0.6, fontFamily: 'var(--font-mono)' }} />
                    <button onClick={() => removeVariantRow(idx)} disabled={variants.length === 1} title="Remover linha" style={{
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
                Total: <strong style={{ color: totalUnits > 0 ? '#4ADE80' : '#5C6388' }}>{totalUnits} unidade(s)</strong>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Observações</label>
              <input className="input-field" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Observações da entrada (opcional)" />
            </div>

            {errorMsg && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 10, padding: '10px 14px', marginTop: 14,
              }}>
                <span style={{ fontSize: 12.5, color: '#F87171' }}>{errorMsg}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#9BA3C4', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleAdd} disabled={saving} style={{
                flex: 1, padding: '11px', borderRadius: 10,
                background: 'linear-gradient(135deg, #6366F1, #4F46E5)', border: 'none',
                color: 'white', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600,
                cursor: 'pointer', opacity: saving ? 0.7 : 1,
              }}>
                {saving ? 'Registrando...' : `Registrar Entrada (${totalUnits})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
