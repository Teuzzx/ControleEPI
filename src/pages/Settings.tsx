import { useState, useEffect, useCallback } from 'react'
import { Plus, X, UserCog, Shield, Building2, Trash2, KeyRound, AlertCircle, CheckCircle2, Users, Mail, Lock } from 'lucide-react'
import { fetchUsers, fetchCompanies, createUser, deleteUser, resetUserPassword, type UserRow, type Company } from '../lib/auth'
import Modal from '../components/ui/Modal'

export default function Settings({ userRole }: { userRole: 'matriz' | 'filial' }) {
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
  })

  const load = useCallback(async () => {
    setLoading(true)
    setMigrationNeeded(false)
    setErrorMsg('')
    try {
      const [u, c] = await Promise.all([fetchUsers(), fetchCompanies()])
      setUsers(u)
      setCompanies(c)
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
  }, [])

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
        companyId: form.role === 'filial' ? Number(form.companyId) : null,
      })
      setSuccess(`Usuário "${form.name}" criado com sucesso!`)
      setForm({ name: '', email: '', password: '', role: 'filial', companyId: '' })
      setShowAdd(false)
      await load()
    } catch (err) {
      setErrorMsg((err as Error).message)
    } finally {
      setSaving(false)
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

  if (userRole === 'filial') {
    return (
      <div style={{ padding: '24px 28px', animation: 'fade-up 0.5s ease both' }}>
        <div style={{ background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '40px', textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
          <Shield size={32} color="#5C6388" style={{ marginBottom: 12 }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#E8EAF6', margin: '0 0 8px' }}>Configurações restritas</h2>
          <p style={{ fontSize: 13, color: '#5C6388', lineHeight: 1.6, margin: 0 }}>
            A gestão de usuários e da rede de empresas é feita pela matriz.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 28px', animation: 'fade-up 0.5s ease both' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: '#E8EAF6', margin: '0 0 4px', letterSpacing: '-0.03em' }}>Configurações</h2>
          <p style={{ fontSize: 13, color: '#3D4257', margin: 0 }}>Usuários de acesso do sistema • {users.length} cadastrados</p>
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
            <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 12 }}> supabase/migrations/0005_users_management.sql</code>
            e recarregue esta página.
          </p>
          <pre style={{
            background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, padding: 14, maxHeight: 220, overflow: 'auto',
            fontSize: 11.5, fontFamily: 'var(--font-mono)', color: '#9BA3C4', lineHeight: 1.6, margin: 0,
          }}>
{`create or replace function public.app_create_user(
  p_name text, p_email text, p_password text, p_role text, p_company_id bigint default null
)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if public.app_session_role() <> 'matriz' then raise exception 'Apenas a matriz pode criar usuários.'; end if;
  if p_role not in ('matriz', 'filial') then raise exception 'Papel inválido.'; end if;
  if exists (select 1 from public.users where lower(email) = lower(p_email)) then
    raise exception 'Já existe um usuário com esse e-mail.'; end if;
  if p_company_id is not null and not exists (select 1 from public.companies where id = p_company_id) then
    raise exception 'Empresa não encontrada.'; end if;
  insert into public.users (company_id, name, email, password, role)
  values (p_company_id, trim(p_name), lower(trim(p_email)),
          encode(digest(p_password, 'sha256'), 'hex'), p_role);
end $$;
grant execute on function public.app_create_user(text, text, text, text, bigint) to anon, authenticated;

create or replace function public.app_list_users()
returns table (id bigint, name text, email text, role text, company_id bigint, company_name text, created_at timestamptz)
language plpgsql security definer set search_path = public, extensions as $$
begin
  if public.app_session_role() <> 'matriz' then raise exception 'Apenas a matriz pode listar usuários.'; end if;
  return query select u.id, u.name, u.email, u.role, u.company_id, c.name, u.created_at
    from public.users u left join public.companies c on c.id = u.company_id order by u.id;
end $$;
grant execute on function public.app_list_users() to anon, authenticated;

create or replace function public.app_delete_user(p_id bigint)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_me bigint;
begin
  if public.app_session_role() <> 'matriz' then raise exception 'Apenas a matriz pode excluir usuários.'; end if;
  select user_id into v_me from public.sessions where token = public.app_request_token() and expires_at > now();
  if p_id = v_me then raise exception 'Você não pode excluir a própria conta.'; end if;
  delete from public.users where id = p_id;
end $$;
grant execute on function public.app_delete_user(bigint) to anon, authenticated;

create or replace function public.app_reset_user_password(p_id bigint, p_password text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if public.app_session_role() <> 'matriz' then raise exception 'Apenas a matriz pode alterar senhas.'; end if;
  if not exists (select 1 from public.users where id = p_id) then raise exception 'Usuário não encontrado.'; end if;
  update public.users set password = encode(digest(p_password, 'sha256'), 'hex') where id = p_id;
end $$;
grant execute on function public.app_reset_user_password(bigint, text) to anon, authenticated;`}
          </pre>
        </div>
      )}

      <div style={{ background: 'rgba(13,15,24,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <UserCog size={15} color="#818CF8" />
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 700, color: '#E8EAF6', margin: 0 }}>Usuários do Sistema</h3>
          <span style={{ fontSize: 11, color: '#3D4257' }}>
            Cada login vê apenas os dados da empresa designada
          </span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Papel</th>
              <th>Empresa</th>
              <th>Criado em</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#3D4257' }}>Carregando usuários...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#3D4257' }}>Nenhum usuário cadastrado ainda.</td></tr>
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
                  {u.role === 'matriz' ? 'Matriz Central' : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Building2 size={12} color="#67E8F9" /> {u.company_name ?? 'Sem empresa vinculada'}
                    </span>
                  )}
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
