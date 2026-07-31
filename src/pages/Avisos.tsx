import { useState, useEffect, useCallback } from 'react'
import { Plus, X, Megaphone, Trash2, CheckCircle2, AlertCircle, Send } from 'lucide-react'
import { fetchCompanies, type Company } from '../lib/auth'
import { createCompanyClient } from '../lib/supabase'
import { useDataClient } from '../lib/clientContext'
import type { Notification } from '../hooks/useSupabaseData'

export default function Avisos() {
  const client = useDataClient()
  const [avisos, setAvisos] = useState<Notification[]>([])
  const [filiais, setFiliais] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({ title: '', message: '', broadcast: true })

  const load = useCallback(async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const [notifRes, companies] = await Promise.all([
        client.from('notifications').select('*').eq('type', 'aviso').order('id', { ascending: false }),
        fetchCompanies(),
      ])
      if (notifRes.error) throw new Error(notifRes.error.message)
      setAvisos((notifRes.data ?? []) as Notification[])
      setFiliais((companies as Company[]).filter((c) => !c.is_matriz))
    } catch (err) {
      setErrorMsg((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [client])

  useEffect(() => {
    load()
  }, [load])

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const handleCreate = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      setErrorMsg('Preencha título e mensagem do aviso.')
      return
    }
    setSaving(true)
    setErrorMsg('')
    setSuccess('')
    const refId = crypto.randomUUID()
    const targets = form.broadcast ? filiais.filter((f) => f.supabase_url && f.anon_key) : []

    try {
      const { error } = await client.from('notifications').insert({
        type: 'aviso',
        title: form.title.trim(),
        message: form.message.trim(),
        ref_id: refId,
        sender_company_id: null,
      })
      if (error) throw new Error(error.message)

      const sentNames: string[] = []
      for (const f of targets) {
        const target = createCompanyClient(f.supabase_url, f.anon_key)
        const { error: tErr } = await target.from('notifications').insert({
          type: 'aviso',
          title: form.title.trim(),
          message: form.message.trim(),
          ref_id: refId,
          sender_company_id: f.id,
        })
        if (!tErr) sentNames.push(f.name)
      }

      setSuccess(
        `Aviso publicado! ${targets.length > 0 ? `Enviado para ${sentNames.length} filial(is): ${sentNames.join(', ')}` : 'Apenas na matriz.'}`,
      )
      setForm({ title: '', message: '', broadcast: true })
      setShowNew(false)
      await load()
    } catch (err) {
      setErrorMsg((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (aviso: Notification) => {
    if (!window.confirm(`Excluir o aviso "${aviso.title}"?`)) return
    setErrorMsg('')
    setSuccess('')
    try {
      const { error } = await client.from('notifications').delete().eq('id', aviso.id)
      if (error) throw new Error(error.message)

      const companies = await fetchCompanies()
      const targets = (companies as Company[]).filter((c) => !c.is_matriz && c.supabase_url && c.anon_key)
      await Promise.all(
        targets.map(async (c) => {
          if (aviso.ref_id) {
            await createCompanyClient(c.supabase_url, c.anon_key)
              .from('notifications')
              .delete()
              .eq('ref_id', aviso.ref_id)
          }
        }),
      )
      setSuccess('Aviso excluído (inclusive das filiais).')
      await load()
    } catch (err) {
      setErrorMsg((err as Error).message)
    }
  }

  return (
    <div style={{ padding: '24px 28px', animation: 'fade-up 0.5s ease both' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#E8EAF6', margin: '0 0 4px', letterSpacing: '-0.03em' }}>Avisos</h2>
          <p style={{ fontSize: 13, color: '#3D4257', margin: 0 }}>
            Comunicados do sistema exibidos no sino de notificações da matriz e das filiais
          </p>
        </div>
        <button onClick={() => setShowNew(true)} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: 'white', border: 'none',
          borderRadius: 10, padding: '10px 18px', cursor: 'pointer',
          fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 600,
          boxShadow: '0 4px 16px rgba(99,102,241,0.3)', transition: 'transform 0.15s',
        }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
        >
          <Plus size={15} strokeWidth={2.5} /> Novo Aviso
        </button>
      </div>

      {success && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: 12, padding: '12px 16px', marginBottom: 16,
          animation: 'fade-up 0.3s ease',
        }}>
          <CheckCircle2 size={16} color="#4ADE80" />
          <span style={{ fontSize: 13, color: '#4ADE80' }}>{success}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 12, padding: '12px 16px', marginBottom: 16,
        }}>
          <AlertCircle size={16} color="#F87171" />
          <span style={{ fontSize: 13, color: '#F87171' }}>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div style={{ color: '#3D4257', fontSize: 13, padding: 24 }}>Carregando avisos...</div>
      ) : avisos.length === 0 ? (
        <div className="glass-strong" style={{ borderRadius: 16, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📢</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#E8EAF6', margin: '0 0 6px' }}>
            Nenhum aviso publicado
          </h3>
          <p style={{ fontSize: 13, color: '#3D4257', margin: 0 }}>
            Crie um aviso para avisar a matriz e as filiais no sino de notificações.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {avisos.map((a, idx) => (
            <div key={a.id} style={{
              background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: '20px 24px',
              display: 'flex', alignItems: 'flex-start', gap: 16,
              animation: `fade-up 0.5s ease both`, animationDelay: `${idx * 0.05}s`,
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                background: 'rgba(246,135,179,0.12)', border: '1px solid rgba(246,135,179,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Megaphone size={19} color="#F472B6" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 700, color: '#E8EAF6', margin: 0 }}>
                    {a.title}
                  </h3>
                  {!a.read && (
                    <span style={{
                      fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                      padding: '2px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.2)', color: '#A5B4FC',
                    }}>
                      Ativo
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: '#9BA3C4', lineHeight: 1.5, margin: '0 0 6px' }}>{a.message}</p>
                <div style={{ fontSize: 11, color: '#3D4257', fontFamily: 'var(--font-mono)' }}>{formatDate(a.created_at)}</div>
              </div>
              <button onClick={() => handleDelete(a)} title="Excluir aviso" style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#F87171', transition: 'background 0.15s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* New aviso modal */}
      {showNew && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowNew(false)}>
          <div className="modal-content glass-strong" style={{ width: '100%', maxWidth: 540, borderRadius: 20, padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#E8EAF6', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Megaphone size={18} color="#F472B6" /> Publicar Aviso
              </h3>
              <button onClick={() => setShowNew(false)} style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#5C6388' }}>
                <X size={15} />
              </button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Título</label>
              <input
                className="input-field"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Manutenção programada no sistema"
                maxLength={80}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Mensagem</label>
              <textarea
                className="input-field"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Descreva o comunicado exibido no sino de notificações..."
                rows={4}
                style={{ resize: 'vertical', minHeight: 96 }}
              />
            </div>

            <div style={{ marginBottom: 20, padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.broadcast}
                  onChange={(e) => setForm({ ...form, broadcast: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: '#6366F1', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 13, color: '#9BA3C4', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Send size={13} color="#67E8F9" />
                  Enviar também para as filiais com banco conectado
                  {filiais.some((f) => f.supabase_url && f.anon_key) && (
                    <span style={{ fontSize: 11, color: '#3D4257' }}>
                      ({filiais.filter((f) => f.supabase_url && f.anon_key).length} conectada(s))
                    </span>
                  )}
                </span>
              </label>
            </div>

            {errorMsg && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 10, padding: '10px 14px', marginBottom: 14,
              }}>
                <AlertCircle size={14} color="#F87171" />
                <span style={{ fontSize: 12.5, color: '#F87171' }}>{errorMsg}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowNew(false)} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#9BA3C4', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleCreate} disabled={saving} style={{
                flex: 1, padding: '11px', borderRadius: 10,
                background: 'linear-gradient(135deg, #6366F1, #4F46E5)', border: 'none',
                color: 'white', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                opacity: saving ? 0.7 : 1,
              }}>
                {saving ? 'Publicando...' : 'Publicar Aviso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
