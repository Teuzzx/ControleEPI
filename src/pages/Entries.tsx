import { useState } from 'react'
import { Plus, X, Package, Warehouse } from 'lucide-react'
import { epis } from '../data/mock'

interface Entry {
  id: number
  epi: string
  manufacturer: string
  supplier: string
  batch: string
  date: string
  quantity: number
  color: string
  size: string
  notes: string
}

const SAMPLE_ENTRIES: Entry[] = [
  { id: 1, epi: 'Respirador PFF2 Sem Válvula', manufacturer: '3M', supplier: 'Safety Plus Ltda', batch: 'L2024-009-R', date: '2024-03-14', quantity: 500, color: 'Branco', size: 'Único', notes: 'Reposição emergencial' },
  { id: 2, epi: 'Capacete de Segurança ABS', manufacturer: '3M', supplier: 'Safety Plus Ltda', batch: 'L2024-001-B', date: '2024-03-10', quantity: 80, color: 'Branco', size: 'Único', notes: '' },
  { id: 3, epi: 'Camisa Operacional FR', manufacturer: 'Tecbrasil', supplier: 'Uniformes Pro Ltda', batch: 'L2024-022-M', date: '2024-03-08', quantity: 200, color: 'Azul Royal', size: 'M', notes: 'Entrada de reposição mensal' },
]

export default function Entries() {
  const [entries, setEntries] = useState<Entry[]>(SAMPLE_ENTRIES)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ epi: '', manufacturer: '', supplier: '', batch: '', date: '', quantity: '', color: '', size: '', notes: '' })

  const set = (key: string, val: string) => setForm((prev) => ({ ...prev, [key]: val }))

  const handleAdd = () => {
    if (!form.epi || !form.quantity) return
    setEntries((prev) => [...prev, { id: Date.now(), ...form, quantity: parseInt(form.quantity) || 0 }])
    setForm({ epi: '', manufacturer: '', supplier: '', batch: '', date: '', quantity: '', color: '', size: '', notes: '' })
    setShowAdd(false)
  }

  return (
    <div style={{ padding: '24px 28px', animation: 'fade-up 0.5s ease both' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#E8EAF6', margin: '0 0 4px', letterSpacing: '-0.03em' }}>Entradas de Estoque</h2>
          <p style={{ fontSize: 13, color: '#3D4257', margin: 0 }}>Registro de produtos recebidos de fornecedores</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{
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
              {entries.map((entry, idx) => (
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
                    <div style={{ fontSize: 13, color: '#9BA3C4' }}>{entry.manufacturer}</div>
                    <div style={{ fontSize: 11.5, color: '#3D4257' }}>{entry.supplier}</div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#818CF8' }}>{entry.batch}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#5C6388' }}>{new Date(entry.date).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: '#4ADE80' }}>+{entry.quantity}</span>
                  </td>
                  <td style={{ fontSize: 12.5, color: '#6B7280' }}>{entry.color} / {entry.size}</td>
                  <td style={{ fontSize: 12, color: '#3D4257' }}>{entry.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: 12, color: '#3D4257', fontFamily: 'var(--font-mono)' }}>{entries.length} entrada{entries.length !== 1 ? 's' : ''} registrada{entries.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal-content glass-strong" style={{ width: '100%', maxWidth: 560, borderRadius: 20, padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#E8EAF6', margin: 0 }}>Registrar Entrada</h3>
              <button onClick={() => setShowAdd(false)} style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#5C6388' }}>
                <X size={15} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { label: 'Produto', key: 'epi', colSpan: 2, placeholder: 'Nome do produto' },
                { label: 'Fabricante', key: 'manufacturer', placeholder: 'Ex: 3M' },
                { label: 'Fornecedor', key: 'supplier', placeholder: 'Ex: Safety Plus Ltda' },
                { label: 'Número do Lote', key: 'batch', placeholder: 'Ex: L2024-001' },
                { label: 'Data de Entrada', key: 'date', placeholder: 'AAAA-MM-DD', type: 'date' },
                { label: 'Quantidade', key: 'quantity', placeholder: 'Ex: 100', type: 'number' },
                { label: 'Cor', key: 'color', placeholder: 'Ex: Azul Royal' },
                { label: 'Tamanho', key: 'size', placeholder: 'Ex: M ou 42' },
                { label: 'Observações', key: 'notes', colSpan: 2, placeholder: 'Observações da entrada (opcional)' },
              ].map(({ label, key, colSpan, placeholder, type }) => (
                <div key={key} style={{ gridColumn: colSpan ? `span ${colSpan}` : undefined }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</label>
                  <input
                    className="input-field"
                    type={type || 'text'}
                    value={(form as any)[key]}
                    onChange={(e) => set(key, e.target.value)}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#9BA3C4', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleAdd} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'linear-gradient(135deg, #6366F1, #4F46E5)', border: 'none', color: 'white', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>Registrar Entrada</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
