-- ════════════════════════════════════════════════════════════════════════
-- Controle de EPI — Correção de segurança (banco da MATRIZ)
-- Executar NO SQL Editor do Supabase da MATRIZ.
--
-- BUG CORRIGIDO: os guards `if app_session_role() <> 'matriz'` não
-- disparavam quando não havia sessão (NULL <> 'matriz' é NULL, tratado
-- como falso no IF) — qualquer um com a chave anon podia listar usuários
-- e criar empresas. Agora usa coalesce(app_session_role(), '') <> 'matriz'.
-- ════════════════════════════════════════════════════════════════════════

-- ── Fix: matriz cria empresa + usuário filial ────────────────────────────
create or replace function public.app_create_company(
  p_name text, p_admin_name text, p_admin_email text, p_admin_password text,
  p_supabase_url text default '', p_anon_key text default '', p_color text default '#22D3EE'
)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_company_id bigint;
begin
  if coalesce(public.app_session_role(), '') <> 'matriz' then
    raise exception 'Apenas a matriz pode criar empresas.';
  end if;
  if exists (select 1 from public.companies where lower(name) = lower(p_name)) then
    raise exception 'Já existe uma empresa com esse nome.';
  end if;
  if exists (select 1 from public.users where lower(email) = lower(p_admin_email)) then
    raise exception 'Já existe um usuário com esse e-mail.';
  end if;

  insert into public.companies (name, is_matriz, supabase_url, anon_key, color)
  values (p_name, false, p_supabase_url, p_anon_key, p_color)
  returning id into v_company_id;

  insert into public.users (company_id, name, email, password, role)
  values (v_company_id, p_admin_name, lower(p_admin_email), encode(digest(p_admin_password, 'sha256'), 'hex'), 'filial');
end $$;

-- ── Fix: matriz vincula o banco de uma filial ────────────────────────────
create or replace function public.app_update_company_connection(p_id bigint, p_url text, p_key text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if coalesce(public.app_session_role(), '') <> 'matriz' then
    raise exception 'Apenas a matriz pode vincular bancos de dados.';
  end if;
  update public.companies set supabase_url = p_url, anon_key = p_key where id = p_id;
end $$;

-- ── Fix: matriz cria usuário ─────────────────────────────────────────────
create or replace function public.app_create_user(
  p_name text, p_email text, p_password text, p_role text, p_company_id bigint default null
)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if coalesce(public.app_session_role(), '') <> 'matriz' then
    raise exception 'Apenas a matriz pode criar usuários.';
  end if;
  if p_role not in ('matriz', 'filial') then
    raise exception 'Papel inválido. Use "matriz" ou "filial".';
  end if;
  if exists (select 1 from public.users where lower(email) = lower(p_email)) then
    raise exception 'Já existe um usuário com esse e-mail.';
  end if;
  if p_company_id is not null and not exists (select 1 from public.companies where id = p_company_id) then
    raise exception 'Empresa não encontrada.';
  end if;
  insert into public.users (company_id, name, email, password, role)
  values (p_company_id, trim(p_name), lower(trim(p_email)),
          encode(digest(p_password, 'sha256'), 'hex'), p_role);
end $$;

-- ── Fix: lista usuários ──────────────────────────────────────────────────
create or replace function public.app_list_users()
returns table (
  id bigint, name text, email text, role text,
  company_id bigint, company_name text, created_at timestamptz
)
language plpgsql security definer set search_path = public, extensions as $$
begin
  if coalesce(public.app_session_role(), '') <> 'matriz' then
    raise exception 'Apenas a matriz pode listar usuários.';
  end if;
  return query
    select u.id, u.name, u.email, u.role, u.company_id, c.name, u.created_at
    from public.users u
    left join public.companies c on c.id = u.company_id
    order by u.id;
end $$;

-- ── Fix: matriz exclui usuário ───────────────────────────────────────────
create or replace function public.app_delete_user(p_id bigint)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_me bigint;
begin
  if coalesce(public.app_session_role(), '') <> 'matriz' then
    raise exception 'Apenas a matriz pode excluir usuários.';
  end if;
  select user_id into v_me from public.sessions
  where token = public.app_request_token() and expires_at > now();
  if p_id = v_me then
    raise exception 'Você não pode excluir a própria conta.';
  end if;
  delete from public.users where id = p_id;
end $$;

-- ── Fix: matriz redefine senha ───────────────────────────────────────────
create or replace function public.app_reset_user_password(p_id bigint, p_password text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if coalesce(public.app_session_role(), '') <> 'matriz' then
    raise exception 'Apenas a matriz pode alterar senhas.';
  end if;
  if not exists (select 1 from public.users where id = p_id) then
    raise exception 'Usuário não encontrado.';
  end if;
  update public.users set password = encode(digest(p_password, 'sha256'), 'hex') where id = p_id;
end $$;

grant execute on function public.app_create_company(text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.app_update_company_connection(bigint, text, text) to anon, authenticated;
grant execute on function public.app_create_user(text, text, text, text, bigint) to anon, authenticated;
grant execute on function public.app_list_users() to anon, authenticated;
grant execute on function public.app_delete_user(bigint) to anon, authenticated;
grant execute on function public.app_reset_user_password(bigint, text) to anon, authenticated;
