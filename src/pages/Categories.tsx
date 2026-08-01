import { useState } from 'react'
import { Plus, Edit2, Trash2, X, Tag } from 'lucide-react'
import { useSupabaseData } from '../hooks/useSupabaseData'
import Modal from '../components/ui/Modal'

const COLORS = ['#6366F1', '#22D3EE', '#F59E0B', '#10B981', '#F43F5E', '#8B5CF6', '#EC4899', '#F97316']
const ICONS_LIST = ['🪖', '👢', '🥽', '🎧', '😷', '🧤', '👕', '🔗', '⚙️', '🏗️', '🔦', '🦺']

interface CategoryForm { id?: number; name: string; description: string; icon: string; color: string }

export default function Categories() {
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useSupabaseData()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<CategoryForm | null>(null)

  const openAdd = () => {
    setEditing({ name: '', description: '', icon: '🪖', color: '#6366F1' })
    setShowModal(true)
  }
  const openEdit = (cat: { id: number; name: string; description: string; icon: string; color: string }) => {
    setEditing({ id: cat.id, name: cat.name, description: cat.description, icon: cat.icon, color: cat.color })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!editing?.name?.trim()) return
    try {
      if (editing.id != null) {
        await updateCategory(editing.id, { name: editing.name, description: editing.description, icon: editing.icon, color: editing.color })
      } else {
        await addCategory({ name: editing.name, description: editing.description, icon: editing.icon, color: editing.color })
      }
    } catch (err) {
      alert(`Erro ao salvar categoria: ${(err as Error).message}`)
      return
    }
    setShowModal(false)
    setEditing(null)
  }

  const handleDelete = async (cat: { id: number; name: string }) => {
    if (!window.confirm(`Excluir a categoria "${cat.name}"?`)) return
    try {
      await deleteCategory(cat.id)
    } catch (err) {
      alert(`Erro ao excluir categoria: ${(err as Error).message}`)
    }
  }

  return (
    <div style={{ padding: '24px 28px', animation: 'fade-up 0.5s ease both' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#E8EAF6', margin: '0 0 4px', letterSpacing: '-0.03em' }}>Categorias</h2>
          <p style={{ fontSize: 13, color: '#3D4257', margin: 0 }}>{loading ? 'Carregando...' : `${categories.length} categorias cadastradas`}</p>
        </div>
        <button onClick={openAdd} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: 'white', border: 'none',
          borderRadius: 10, padding: '10px 18px', cursor: 'pointer',
          fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 600,
          boxShadow: '0 4px 16px rgba(99,102,241,0.3)', transition: 'transform 0.15s',
        }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
        >
          <Plus size={15} strokeWidth={2.5} /> Nova Categoria
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {categories.map((cat, idx) => (
          <div key={cat.id} style={{
            background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '20px 22px',
            animation: `fade-up 0.5s ease both`, animationDelay: `${idx * 0.05}s`,
            transition: 'border-color 0.2s, transform 0.2s',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${cat.color}35`; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = '' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 13,
                background: `${cat.color}18`, border: `1px solid ${cat.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>
                {cat.icon}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => openEdit(cat)} style={{ width: 28, height: 28, borderRadius: 7, background: `${cat.color}12`, border: `1px solid ${cat.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: cat.color }}>
                  <Edit2 size={12} />
                </button>
                <button onClick={() => handleDelete(cat)} style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#F87171' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 700, color: '#E8EAF6', margin: '0 0 5px', letterSpacing: '-0.02em' }}>{cat.name}</h3>
            <p style={{ fontSize: 12.5, color: '#5C6388', margin: '0 0 14px', lineHeight: 1.5 }}>{cat.description}</p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ height: 3, flex: 1, background: `linear-gradient(90deg, ${cat.color}, transparent)`, borderRadius: 2, opacity: 0.5 }} />
              <span style={{ marginLeft: 12, fontSize: 12, fontWeight: 700, color: cat.color, fontFamily: 'var(--font-mono)' }}>
                {cat.itemCount} EPI{cat.itemCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showModal && editing && (
        <Modal onClose={() => { setShowModal(false); setEditing(null) }}>
          <div className="modal-content glass-strong" style={{ width: '100%', maxWidth: 440, borderRadius: 20, padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#E8EAF6', margin: 0 }}>
                {editing.id != null ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button onClick={() => { setShowModal(false); setEditing(null) }} style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#5C6388' }}>
                <X size={15} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Nome</label>
                <input className="input-field" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Ex: Proteção da Cabeça" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Descrição</label>
                <input className="input-field" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Descrição da categoria" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Ícone</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ICONS_LIST.map((ic) => (
                    <button key={ic} onClick={() => setEditing({ ...editing, icon: ic })} style={{ width: 36, height: 36, borderRadius: 9, border: editing.icon === ic ? '2px solid #6366F1' : '1px solid rgba(255,255,255,0.1)', background: editing.icon === ic ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Cor</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {COLORS.map((c) => <button key={c} onClick={() => setEditing({ ...editing, color: c })} style={{ width: 28, height: 28, borderRadius: 8, background: c, border: editing.color === c ? '2px solid white' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.15s', boxShadow: editing.color === c ? `0 0 12px ${c}70` : 'none' }} />)}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => { setShowModal(false); setEditing(null) }} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#9BA3C4', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleSave} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'linear-gradient(135deg, #6366F1, #4F46E5)', border: 'none', color: 'white', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
                {editing.id != null ? 'Salvar Alterações' : 'Criar Categoria'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
