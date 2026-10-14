import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { Plus, X, UserCog, Shield, Building2, Trash2, KeyRound, AlertCircle, CheckCircle2, Users, Mail, Lock, Monitor, Smartphone, Laptop } from 'lucide-react'
import { fetchUsers, fetchCompanies, createUser, deleteUser, resetUserPassword, updateUserAccess, type UserRow, type Company, type AccessLevel } from '../lib/auth'
import Modal from '../components/ui/Modal'

const ACCESS_LABEL: Record<AccessLevel, string> = {
  web: 'Web',
  mobile: 'Mobile',
  both: 'Web + Mobile',
}

const ACCESS_ICON: Record<AccessLevel, ReactNode> = {
  web: <Monitor size={13} />,
  mobile: <Smartphone size={13} />,
  both: <Laptop size={13} />,
}

export default function Settings({ userRole }: { userRole: 'matriz' | 'filial' }) {
  const isFilial = userRole === 'filial'
  const [users, setUsers] = useState<UserRow[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [migrationNeeded, setMigrationNeeded] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'filial' as 'matriz' | 'filial',
    companyId: '' as string,
    access: 'both' as AccessLevel,
  })

  const load = useCallback(async () => {
    setLoading(true)
    setMigrationNeeded(false)
    setErrorMsg('')
    try {
      const u = await fetchUsers()
      setUsers(u)
      if (!isFilial) {
        setCompanies(await fetchCompanies())
      }
    } catch (err) {
      const msg = (err as Error).message
      if (msg.includes('app_list_users') || msg.includes('does not exist') || msg.includes('PGRST')) {
        setMigrationNeeded(true)
      } else {
        setErrorMsg(msg)
      }
    } finally {
      setLoading(false)
    }
  }, [isFilial])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setErrorMsg('Preencha nome, e-mail e senha.')
      return
    }
    if (form.role === 'filial' && !form.companyId) {
      setErrorMsg('Selecione a empresa da filial (ou crie a empresa primeiro em Empresas).')
      return
    }
    setSaving(true)
    setErrorMsg('')
    setSuccess('')
    try {
      await createUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        companyId: form.role === 'filial' ? (isFilial ? null : Number(form.companyId)) : null,
        access: form.access,
      })
      setSuccess(`Usuário "${form.name}" criado com sucesso!`)
      setForm({ name: '', email: '', password: '', role: 'filial', companyId: '', access: 'both' })
      setShowAdd(false)
      await load()
    } catch (err) {
      setErrorMsg((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleChangeAccess = async (u: UserRow, access: AccessLevel) => {
    if (u.access === access) return
    setErrorMsg('')
    setSuccess('')
    try {
      await updateUserAccess(u.id, access)
      setSuccess(`Acesso de "${u.name}" alterado para ${ACCESS_LABEL[access]}.`)
      await load()
    } catch (err) {
      setErrorMsg((err as Error).message)
    }
  }

  const handleDelete = async (u: UserRow) => {
    if (!window.confirm(`Excluir o usuário "${u.name}" (${u.email})?`)) return
    setErrorMsg('')
    setSuccess('')
    try {
      await deleteUser(u.id)
      setSuccess(`Usuário "${u.name}" excluído.`)
      await load()
    } catch (err) {
      setErrorMsg((err as Error).message)
    }
  }

  const handleResetPassword = async (u: UserRow) => {
    const pwd = window.prompt(`Nova senha para ${u.email}:`)
    if (!pwd) return
    setErrorMsg('')
    setSuccess('')
    try {
      await resetUserPassword(u.id, pwd)
      setSuccess(`Senha de "${u.name}" redefinida.`)
    } catch (err) {
      setErrorMsg((err as Error).message)
    }
  }

  return (
    <div className="page-enter" style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#E8EAF6', margin: '0 0 4px', letterSpacing: '-0.03em' }}>Configurações</h2>
          <p style={{ fontSize: 13, color: '#3D4257', margin: 0 }}>
            Usuários de acesso do sistema • {users.length} cadastrados
            {isFilial && ' • sua empresa pode criar e gerenciar os próprios logins'}
          </p>
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
          <Plus size={15} strokeWidth={2.5} /> Novo Usuário
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

      {migrationNeeded && (
        <div style={{
          background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 14, padding: '18px 20px', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <AlertCircle size={16} color="#FCD34D" />
            <span style={{ fontSize: 13.5, fontWeight: 700, color: '#FCD34D' }}>
              Banco ainda não atualizado
            </span>
          </div>
          <p style={{ fontSize: 12.5, color: '#9BA3C4', lineHeight: 1.6, margin: '0 0 10px' }}>
            A gestão de usuários precisa de funções novas no banco. Abra o SQL Editor do Supabase da
            <strong style={{ color: '#E8EAF6' }}> matriz</strong>, execute o conteúdo de
            <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 12 }}> supabase/migrations/0009_users_access.sql</code>
            e recarregue esta página.
          </p>
          <pre style={{
            background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, padding: 14, maxHeight: 220, overflow: 'auto',
            fontSize: 11.5, fontFamily: 'var(--font-mono)', color: '#9BA3C4', lineHeight: 1.6, margin: 0,
          }}>
{`supabase/migrations/0009_users_access.sql`}
          </pre>
        </div>
      )}

      <div style={{ background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <UserCog size={15} color="#818CF8" />
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 700, color: '#E8EAF6', margin: 0 }}>Usuários do Sistema</h3>
          <span style={{ fontSize: 11, color: '#3D4257' }}>
            Cada login vê apenas os dados da empresa designada • acesso: web, mobile ou ambos
          </span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Papel</th>
              <th>Empresa</th>
              <th>Acesso</th>
              <th>Criado em</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#3D4257' }}>Carregando usuários...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#3D4257' }}>Nenhum usuário cadastrado ainda.</td></tr>
            ) : users.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600, color: '#C4C9E2' }}>{u.name}</td>
                <td style={{ color: '#6B7280', fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{u.email}</td>
                <td>
                  <span className={`badge ${u.role === 'matriz' ? 'badge-warning' : 'badge-info'}`}>
                    <Shield size={10} /> {u.role === 'matriz' ? 'MATRIZ' : 'FILIAL'}
                  </span>
                </td>
                <td style={{ color: '#9BA3C4' }}>
                  {u.role === 'matriz' && !isFilial ? 'Matriz Central' : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Building2 size={12} color="#67E8F9" /> {u.company_name ?? 'Sem empresa vinculada'}
                    </span>
                  )}
                </td>
                <td>
                  <select
                    title="Acesso do login"
                    value={u.access ?? 'both'}
                    onChange={(e) => handleChangeAccess(u, e.target.value as AccessLevel)}
                    style={{
                      background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                      color: '#A5B4FC', borderRadius: 8, padding: '6px 8px', fontSize: 12,
                      fontFamily: 'var(--font-sans)', fontWeight: 600, cursor: 'pointer',
                      outline: 'none', minWidth: 118,
                    }}
                  >
                    <option value="web">Web</option>
                    <option value="mobile">Mobile</option>
                    <option value="both">Web + Mobile</option>
                  </select>
                </td>
                <td style={{ color: '#5C6388', fontSize: 12 }}>
                  {u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '—'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleResetPassword(u)}
                      title="Redefinir senha"
                      style={{
                        width: 30, height: 30, borderRadius: 8, cursor: 'pointer',
                        background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                        color: '#A5B4FC', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <KeyRound size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(u)}
                      title="Excluir usuário"
                      style={{
                        width: 30, height: 30, borderRadius: 8, cursor: 'pointer',
                        background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
                        color: '#F87171', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create user modal */}
      {showAdd && (
        <Modal onClose={() => setShowAdd(false)}>
          <div className="modal-content glass-strong" style={{ width: '100%', maxWidth: 520, borderRadius: 20, padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#E8EAF6', margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Users size={17} color="#818CF8" /> Novo Usuário
              </h3>
              <button onClick={() => setShowAdd(false)} style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#5C6388' }}>
                <X size={15} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Nome</label>
                <div style={{ position: 'relative' }}>
                  <UserCog size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#3D4257', pointerEvents: 'none' }} />
                  <input className="input-field" style={{ paddingLeft: 34 }} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: João da Filial" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>E-mail (login)</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#3D4257', pointerEvents: 'none' }} />
                  <input className="input-field" style={{ paddingLeft: 34 }} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="usuario@empresa.com.br" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Senha</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#3D4257', pointerEvents: 'none' }} />
                  <input className="input-field" style={{ paddingLeft: 34 }} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Defina uma senha segura" />
                </div>
              </div>

              {!isFilial && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Papel do usuário</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <button
                        onClick={() => setForm({ ...form, role: 'matriz' })}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '11px 12px', borderRadius: 10,
                          border: `1px solid ${form.role === 'matriz' ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.08)'}`,
                          background: form.role === 'matriz' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.025)',
                          cursor: 'pointer', color: form.role === 'matriz' ? '#FCD34D' : '#5C6388',
                          fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, width: '100%', transition: 'all 0.15s',
                        }}
                      >
                        <Shield size={14} /> Matriz (total)
                      </button>
                      <button
                        onClick={() => setForm({ ...form, role: 'filial' })}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '11px 12px', borderRadius: 10,
                          border: `1px solid ${form.role === 'filial' ? 'rgba(34,211,238,0.5)' : 'rgba(255,255,255,0.08)'}`,
                          background: form.role === 'filial' ? 'rgba(34,211,238,0.08)' : 'rgba(255,255,255,0.025)',
                          cursor: 'pointer', color: form.role === 'filial' ? '#67E8F9' : '#5C6388',
                          fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, width: '100%', transition: 'all 0.15s',
                        }}
                      >
                        <Building2 size={14} /> Filial (empresa)
                      </button>
                    </div>
                  </div>

                  {form.role === 'filial' && (
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Empresa designada</label>
                      <select
                        className="input-field"
                        style={{ appearance: 'none' }}
                        value={form.companyId}
                        onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                      >
                        <option value="">Selecione a empresa...</option>
                        {companies.filter((c) => !c.is_matriz).map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <div style={{ marginTop: 8, fontSize: 11.5, color: '#3D4257', lineHeight: 1.5 }}>
                        <AlertCircle size={11} style={{ verticalAlign: '-2px', marginRight: 4 }} color="#FCD34D" />
                        Este login verá apenas o estoque, colaboradores e movimentações da empresa selecionada.
                      </div>
                    </div>
                  )}
                </>
              )}

              {isFilial && (
                <div style={{
                  background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.15)',
                  borderRadius: 10, padding: '12px 14px', fontSize: 12.5, color: '#67E8F9', lineHeight: 1.5,
                }}>
                  <Building2 size={13} style={{ verticalAlign: '-2px', marginRight: 6 }} />
                  Este login será criado para a sua empresa e enxergará apenas os dados dela.
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#5C6388', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Onde o usuário poderá entrar?</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <button
                    onClick={() => setForm({ ...form, access: 'web' })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7, padding: '11px 10px', borderRadius: 10,
                      border: `1px solid ${form.access === 'web' ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
                      background: form.access === 'web' ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.025)',
                      cursor: 'pointer', color: form.access === 'web' ? '#A5B4FC' : '#5C6388',
                      fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, width: '100%', transition: 'all 0.15s',
                      justifyContent: 'center',
                    }}
                  >
                    <Monitor size={14} /> Web
                  </button>
                  <button
                    onClick={() => setForm({ ...form, access: 'mobile' })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7, padding: '11px 10px', borderRadius: 10,
                      border: `1px solid ${form.access === 'mobile' ? 'rgba(34,211,238,0.5)' : 'rgba(255,255,255,0.08)'}`,
                      background: form.access === 'mobile' ? 'rgba(34,211,238,0.1)' : 'rgba(255,255,255,0.025)',
                      cursor: 'pointer', color: form.access === 'mobile' ? '#67E8F9' : '#5C6388',
                      fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, width: '100%', transition: 'all 0.15s',
                      justifyContent: 'center',
                    }}
                  >
                    <Smartphone size={14} /> Mobile
                  </button>
                  <button
                    onClick={() => setForm({ ...form, access: 'both' })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7, padding: '11px 10px', borderRadius: 10,
                      border: `1px solid ${form.access === 'both' ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.08)'}`,
                      background: form.access === 'both' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.025)',
                      cursor: 'pointer', color: form.access === 'both' ? '#4ADE80' : '#5C6388',
                      fontFamily: 'var(--font-sans)', fontSize: 12.5, fontWeight: 600, width: '100%', transition: 'all 0.15s',
                      justifyContent: 'center',
                    }}
                  >
                    <Laptop size={14} /> Ambos
                  </button>
                </div>
                <div style={{ marginTop: 8, fontSize: 11.5, color: '#3D4257', lineHeight: 1.5 }}>
                  <AlertCircle size={11} style={{ verticalAlign: '-2px', marginRight: 4 }} color="#FCD34D" />
                  Web = computador, Mobile = aplicativo do celular. O login só entra onde tiver acesso.
                </div>
              </div>
            </div>

            {errorMsg && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 10, padding: '10px 14px', marginTop: 14,
              }}>
                <AlertCircle size={14} color="#F87171" />
                <span style={{ fontSize: 12.5, color: '#F87171' }}>{errorMsg}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#9BA3C4', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleCreate} disabled={saving} style={{
                flex: 1, padding: '11px', borderRadius: 10,
                background: 'linear-gradient(135deg, #6366F1, #4F46E5)', border: 'none',
                color: 'white', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600,
                cursor: 'pointer', opacity: saving ? 0.7 : 1,
              }}>
                {saving ? 'Criando...' : 'Criar Usuário'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
