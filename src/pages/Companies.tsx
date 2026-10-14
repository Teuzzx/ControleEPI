import { useState, useEffect, useCallback } from 'react'
import { Plus, X, Building2, KeyRound, Database, Users, CheckCircle2, AlertCircle } from 'lucide-react'
import { fetchCompanies, createCompanyAndUser, updateCompanyConnection, type Company } from '../lib/auth'
import { createCompanyClient } from '../lib/supabase'
import Modal from '../components/ui/Modal'

const COLORS = ['#6366F1', '#22D3EE', '#F59E0B', '#10B981', '#F43F5E', '#8B5CF6', '#EC4899', '#F97316']

interface CompanyStock {
  companyId: number
  name: string
  color: string
  count: number
  units: number
  loading: boolean
  error?: string
}

function useCompanyStock(companies: Company[]): [CompanyStock[], () => void] {
  const [stocks, setStocks] = useState<CompanyStock[]>([])

  const load = useCallback(() => {
    setStocks(
      companies.map((c) => ({
        companyId: c.id,
        name: c.name,
        color: c.color,
        count: 0,
        units: 0,
        loading: true,
      })),
    )
    for (const c of companies) {
      if (c.is_matriz || !c.supabase_url || !c.anon_key) {
        setStocks((prev) =>
          prev.map((s) =>
            s.companyId === c.id ? { ...s, loading: false, count: 0, units: 0 } : s,
          ),
        )
        continue
      }
      const client = createCompanyClient(c.supabase_url, c.anon_key)
      ;(async () => {
        try {
          const { data, error } = await client
            .from('epis')
            .select('total_quantity')
          setStocks((prev) =>
            prev.map((s) =>
              s.companyId === c.id
                ? {
                    ...s,
                    loading: false,
                    count: data?.length ?? 0,
                    units: (data ?? []).reduce((acc, e) => acc + (e.total_quantity ?? 0), 0),
                    error: error ? error.message : undefined,
                  }
                : s,
            ),
          )
        } catch (e: unknown) {
          setStocks((prev) =>
            prev.map((s) =>
              s.companyId === c.id
                ? {
                    ...s,
                    loading: false,
                    count: 0,
                    units: 0,
                    error: (e as Error)?.message || 'Falha ao consultar o banco da filial.',
                  }
                : s,
            ),
          )
        }
      })()
    }
  }, [companies])

  useEffect(() => {
    load()
  }, [load])

  return [stocks, load]
}

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    name: '',
    supabaseUrl: '',
    anonKey: '',
    color: COLORS[0],
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  })

  const [stocks, reloadStocks] = useCompanyStock(companies)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setCompanies(await fetchCompanies())
    } catch (err) {
      setErrorMsg((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async () => {
    if (!form.name.trim() || !form.adminName.trim() || !form.adminEmail.trim() || !form.adminPassword) {
      setErrorMsg('Preencha nome da empresa e dados do administrador.')
      return
    }
    setSaving(true)
    setErrorMsg('')
    setSuccess('')
    try {
      await createCompanyAndUser({
        name: form.name,
        supabaseUrl: form.supabaseUrl,
        anonKey: form.anonKey,
        color: form.color,
        adminName: form.adminName,
        adminEmail: form.adminEmail,
        adminPassword: form.adminPassword,
      })
      setSuccess(`Empresa "${form.name}" criada com sucesso! A conta ${form.adminEmail} foi criada (herança).`)
      setForm({ name: '', supabaseUrl: '', anonKey: '', color: COLORS[0], adminName: '', adminEmail: '', adminPassword: '' })
      setShowAdd(false)
      await load()
      reloadStocks()
    } catch (err) {
      setErrorMsg((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleLinkDb = async (id: number) => {
    const url = prompt('URL do banco da empresa (https://xxxx.supabase.co):')
    if (!url) return
    const key = prompt('Chave anon do banco da empresa (Settings → API Keys):')
    if (!key) return
    try {
      await updateCompanyConnection(id, url.trim(), key)
      await load()
      reloadStocks()
    } catch (err) {
      alert(`Erro: ${(err as Error).message}`)
    }
  }

  return (
    <div className="page-enter" style={{ padding: '24px 28px' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#E8EAF6', margin: '0 0 4px', letterSpacing: '-0.03em' }}>Empresas</h2>
          <p style={{ fontSize: 13, color: '#3D4257', margin: 0 }}>Rede de empresas vinculadas à matriz • {companies.length} cadastradas</p>
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
          <Plus size={15} strokeWidth={2.5} /> Nova Empresa
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {loading ? (
          <div style={{ color: '#3D4257', fontSize: 13, padding: 24 }}>Carregando empresas...</div>
        ) : companies.map((c, idx) => {
          const stock = stocks.find((s) => s.companyId === c.id)
          return (
            <div key={c.id} style={{
              background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: '22px 24px',
              animation: `fade-up 0.5s ease both`, animationDelay: `${idx * 0.06}s`,
              transition: 'border-color 0.2s, transform 0.2s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${c.color}35`; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = '' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: `${c.color}18`, border: `1px solid ${c.color}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Building2 size={20} color={c.color} />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#E8EAF6', margin: '0 0 3px', letterSpacing: '-0.02em' }}>
                      {c.name}
                    </h3>
                    <span className={`badge ${c.is_matriz ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: 9.5 }}>
                      {c.is_matriz ? 'MATRIZ' : 'FILIAL'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Database status */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 12px', borderRadius: 10, marginBottom: 12,
                background: c.supabase_url ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)',
                border: `1px solid ${c.supabase_url ? 'rgba(16,185,129,0.18)' : 'rgba(245,158,11,0.18)'}`,
              }}>
                <Database size={13} color={c.supabase_url ? '#4ADE80' : '#FCD34D'} />
                <span style={{ fontSize: 12, color: c.supabase_url ? '#4ADE80' : '#FCD34D', flex: 1 }}>
                  {c.supabase_url ? 'Banco de dados conectado' : 'Sem banco vinculado (pendente)'}
                </span>
                {!c.is_matriz && (
                  <button
                    onClick={() => handleLinkDb(c.id)}
                    style={{
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#9BA3C4', borderRadius: 7, padding: '4px 10px',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <KeyRound size={10} style={{ verticalAlign: '-1px', marginRight: 4 }} />
                    Vincular
                  </button>
                )}
              </div>

              {/* Live stock */}
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10.5, color: '#3D4257', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Produtos</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#E8EAF6', fontFamily: 'var(--font-display)' }}>
                    {stock?.loading ? '—' : stock?.count ?? '—'}
                  </div>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10.5, color: '#3D4257', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Unidades</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#E8EAF6', fontFamily: 'var(--font-display)' }}>
                    {stock?.loading ? '—' : (stock?.units ?? 0).toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>

              {stock?.error && !stock.loading && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginTop: 12,
                  padding: '9px 12px', borderRadius: 10,
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                }}>
                  <AlertCircle size={13} color="#F87171" />
                  <span style={{ fontSize: 11.5, color: '#F87171', lineHeight: 1.4 }}>
                    {stock.error}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add modal */}
      {showAdd && (
        <Modal onClose={() => setShowAdd(false)}>
          <div className="modal-content glass-strong" style={{ width: '100%', maxWidth: 560, borderRadius: 20, padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#E8EAF6', margin: 0, letterSpacing: '-0.02em' }}>
                Criar Empresa Filha
              </h3>
              <button onClick={() => setShowAdd(false)} style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#5C6388' }}>
                <X size={15} />
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#818CF8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building2 size={12} /> Empresa
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Nome da Empresa</label>
                  <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Filial Rio de Janeiro" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>URL do Banco (opcional)</label>
                  <input className="input-field" value={form.supabaseUrl} onChange={(e) => setForm({ ...form, supabaseUrl: e.target.value })} placeholder="https://xxxx.supabase.co" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Chave Anon (opcional)</label>
                  <input className="input-field" value={form.anonKey} onChange={(e) => setForm({ ...form, anonKey: e.target.value })} placeholder="eyJhbGciOi..." />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Cor</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {COLORS.map((c) => <button key={c} onClick={() => setForm({ ...form, color: c })} style={{ width: 28, height: 28, borderRadius: 8, background: c, border: form.color === c ? '2px solid white' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.15s', boxShadow: form.color === c ? `0 0 12px ${c}70` : 'none' }} />)}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#818CF8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={12} /> Conta do Administrador (herança)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Nome do Admin</label>
                  <input className="input-field" value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} placeholder="Ex: João da Filial" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>E-mail</label>
                  <input className="input-field" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} placeholder="admin@filial.com.br" />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Senha</label>
                  <input className="input-field" type="password" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} placeholder="Defina uma senha segura" />
                </div>
              </div>
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
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#9BA3C4', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleCreate} disabled={saving} style={{
                flex: 1, padding: '11px', borderRadius: 10,
                background: 'linear-gradient(135deg, #6366F1, #4F46E5)', border: 'none',
                color: 'white', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                opacity: saving ? 0.7 : 1,
              }}>
                {saving ? 'Criando...' : 'Criar Empresa + Conta'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
