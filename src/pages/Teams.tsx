import { useState } from 'react'
import { Plus, Edit2, Trash2, X, Users } from 'lucide-react'
import { teams as initialTeams, employees } from '../data/mock'

const COLORS = ['#6366F1', '#22D3EE', '#F59E0B', '#10B981', '#F43F5E', '#8B5CF6', '#EC4899', '#F97316']

export default function Teams() {
  const [teams, setTeams] = useState(initialTeams)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newColor, setNewColor] = useState(COLORS[0])

  const handleAdd = () => {
    if (!newName.trim()) return
    setTeams((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: newName,
        description: newDesc,
        color: newColor,
        memberCount: 0,
      },
    ])
    setNewName(''); setNewDesc(''); setNewColor(COLORS[0]); setShowAdd(false)
  }

  const handleDelete = (id: number) => setTeams((prev) => prev.filter((t) => t.id !== id))

  return (
    <div style={{ padding: '24px 28px', animation: 'fade-up 0.5s ease both' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#E8EAF6', margin: '0 0 4px', letterSpacing: '-0.03em' }}>Equipes</h2>
          <p style={{ fontSize: 13, color: '#3D4257', margin: 0 }}>{teams.length} equipes cadastradas</p>
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
          <Plus size={15} strokeWidth={2.5} /> Nova Equipe
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {teams.map((team, idx) => {
          const members = employees.filter((e) => e.team === team.name)
          return (
            <div key={team.id} style={{
              background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: '22px 24px',
              animation: `fade-up 0.5s ease both`, animationDelay: `${idx * 0.06}s`,
              transition: 'border-color 0.2s, transform 0.2s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${team.color}35`; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = '' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: `${team.color}18`, border: `1px solid ${team.color}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Users size={20} color={team.color} />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#E8EAF6', margin: '0 0 2px', letterSpacing: '-0.02em' }}>
                      {team.name}
                    </h3>
                    <div style={{ width: 20, height: 3, borderRadius: 2, background: team.color }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button style={{
                    width: 28, height: 28, borderRadius: 7, background: `${team.color}12`,
                    border: `1px solid ${team.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: team.color, transition: 'background 0.15s',
                  }}>
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => handleDelete(team.id)} style={{
                    width: 28, height: 28, borderRadius: 7, background: 'rgba(244,63,94,0.1)',
                    border: '1px solid rgba(244,63,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#F87171', transition: 'background 0.15s',
                  }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <p style={{ fontSize: 13, color: '#5C6388', margin: '0 0 16px', lineHeight: 1.5 }}>{team.description}</p>

              {/* Members preview */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex' }}>
                  {members.slice(0, 4).map((m, i) => {
                    const initials = m.name.split(' ').slice(0, 2).map((n) => n[0]).join('')
                    return (
                      <div key={m.id} style={{
                        width: 28, height: 28, borderRadius: 9, marginLeft: i > 0 ? -8 : 0,
                        background: `${team.color}25`, border: `2px solid rgba(13,15,24,0.9)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, color: team.color,
                        zIndex: 10 - i,
                      }} title={m.name}>
                        {initials}
                      </div>
                    )
                  })}
                  {members.length > 4 && (
                    <div style={{
                      width: 28, height: 28, borderRadius: 9, marginLeft: -8,
                      background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(13,15,24,0.9)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, color: '#5C6388',
                    }}>
                      +{members.length - 4}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: team.color, fontFamily: 'var(--font-mono)' }}>
                  {members.length} membro{members.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal-content glass-strong" style={{ width: '100%', maxWidth: 440, borderRadius: 20, padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#E8EAF6', margin: 0, letterSpacing: '-0.02em' }}>
                Nova Equipe
              </h3>
              <button onClick={() => setShowAdd(false)} style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#5C6388' }}>
                <X size={15} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Nome da Equipe</label>
                <input className="input-field" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Operações Norte" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Descrição</label>
                <input className="input-field" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Descrição da equipe" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Cor de Identificação</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setNewColor(c)} style={{
                      width: 28, height: 28, borderRadius: 8, background: c, border: newColor === c ? '2px solid white' : '2px solid transparent',
                      cursor: 'pointer', boxShadow: newColor === c ? `0 0 12px ${c}70` : 'none',
                      transition: 'all 0.15s',
                    }} />
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#9BA3C4', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleAdd} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'linear-gradient(135deg, #6366F1, #4F46E5)', border: 'none', color: 'white', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>Criar Equipe</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
