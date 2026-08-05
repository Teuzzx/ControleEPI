-- ════════════════════════════════════════════════════════════════════════
-- Controle de EPI — Gestão de logins com controle de acesso (banco da MATRIZ)
-- Executar NO SQL Editor do Supabase da MATRIZ (depois da 0005).
--
-- A matriz E as filiais criam logins para os seus usuários. Cada login
-- escolhe onde terá acesso:
--   'web'    → somente no sistema web (computador)
--   'mobile' → somente no app (celular)
--   'both'   → nos dois (padrão)
--
-- A filial só gerencia usuários DA PRÓPRIA empresa (papel sempre 'filial').
-- O campo users.access também é retornado pelo app_login para o web e o app
-- bloquearem o acesso indevido.
-- ════════════════════════════════════════════════════════════════════════

-- ── Coluna de acesso ─────────────────────────────────────────────────────
alter table public.users add column if not exists access text not null default 'both'
  check (access in ('web', 'mobile', 'both'));

-- ── Helper: empresa do usuário da sessão atual ───────────────────────────
create or replace function public.app_session_company()
returns bigint language sql stable security definer set search_path = public, extensions as $$
  select company_id from public.sessions
  where token = public.app_request_token() and expires_at > now()
$$;

-- ── Login: devolve também o acesso do usuário ────────────────────────────
drop function if exists public.app_login(text, text);
create or replace function public.app_login(p_email text, p_password text)
returns table (
  user_id bigint, user_name text, user_email text, user_role text,
  company_id bigint, company_name text, company_url text, company_key text,
  user_access text, token text
)
language plpgsql security definer set search_path = public, extensions as $$
declare
  u public.users%rowtype;
  v_name text; v_url text; v_key text;
  v_token text;
begin
  select * into u from public.users where lower(email) = lower(p_email) limit 1;
  if not found then return; end if;
  if u.password <> encode(digest(p_password, 'sha256'), 'hex') then return; end if;

  v_token := encode(gen_random_bytes(32), 'hex');
  delete from public.sessions s where s.user_id = u.id or s.expires_at < now();
  insert into public.sessions (token, user_id, role, company_id, expires_at)
  values (v_token, u.id, u.role, u.company_id, now() + interval '12 hours');

  v_name := null; v_url := null; v_key := null;
  if u.company_id is not null then
    select c.name, c.supabase_url, c.anon_key into v_name, v_url, v_key
    from public.companies c where c.id = u.company_id;
  end if;

  return query
    select u.id, u.name, u.email, u.role, u.company_id, v_name, v_url, v_key,
           u.access, v_token;
end $$;

grant execute on function public.app_login(text, text) to anon, authenticated;

-- ── Matriz ou filial cria usuário (papel + empresa + acesso) ─────────────
drop function if exists public.app_create_user(text, text, text, text, bigint);
create or replace function public.app_create_user(
  p_name text, p_email text, p_password text, p_role text,
  p_company_id bigint default null, p_access text default 'both'
)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  v_role text;
  v_company_id bigint;
begin
  v_role := coalesce(public.app_session_role(), '');
  if v_role not in ('matriz', 'filial') then
    raise exception 'Apenas a matriz ou uma filial podem criar usuários.';
  end if;
  if p_access not in ('web', 'mobile', 'both') then
    raise exception 'Acesso inválido. Use "web", "mobile" ou "both".';
  end if;

  if v_role = 'filial' then
    -- Filial: papel fixo 'filial' e sempre na própria empresa
    v_company_id := public.app_session_company();
    if v_company_id is null then
      raise exception 'Sua empresa ainda não está vinculada. Peça à matriz para conectar o banco.';
    end if;
    p_role := 'filial';
    p_company_id := v_company_id;
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
  insert into public.users (company_id, name, email, password, role, access)
  values (p_company_id, trim(p_name), lower(trim(p_email)),
          encode(digest(p_password, 'sha256'), 'hex'), p_role, p_access);
end $$;

grant execute on function public.app_create_user(text, text, text, text, bigint, text) to anon, authenticated;

-- ── Lista usuários (matriz: todos; filial: apenas a própria empresa) ─────
drop function if exists public.app_list_users();
create or replace function public.app_list_users()
returns table (
  id bigint, name text, email text, role text, access text,
  company_id bigint, company_name text, created_at timestamptz
)
language plpgsql security definer set search_path = public, extensions as $$
begin
  if coalesce(public.app_session_role(), '') not in ('matriz', 'filial') then
    raise exception 'Apenas a matriz ou uma filial podem listar usuários.';
  end if;
  if public.app_session_role() = 'filial' then
    return query
      select u.id, u.name, u.email, u.role, u.access, u.company_id, c.name, u.created_at
      from public.users u
      left join public.companies c on c.id = u.company_id
      where u.company_id = public.app_session_company()
      order by u.id;
    return;
  end if;
  return query
    select u.id, u.name, u.email, u.role, u.access, u.company_id, c.name, u.created_at
    from public.users u
    left join public.companies c on c.id = u.company_id
    order by u.id;
end $$;

grant execute on function public.app_list_users() to anon, authenticated;

-- ── Exclui usuário (nunca a própria conta; filial só da própria empresa) ─
drop function if exists public.app_delete_user(bigint);
create or replace function public.app_delete_user(p_id bigint)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_me bigint; v_role text;
begin
  v_role := coalesce(public.app_session_role(), '');
  if v_role not in ('matriz', 'filial') then
    raise exception 'Apenas a matriz ou uma filial podem excluir usuários.';
  end if;
  select user_id into v_me from public.sessions
  where token = public.app_request_token() and expires_at > now();
  if p_id = v_me then
    raise exception 'Você não pode excluir a própria conta.';
  end if;
  if v_role = 'filial' then
    if not exists (
      select 1 from public.users
      where id = p_id and company_id = public.app_session_company()
    ) then
      raise exception 'Você só pode excluir usuários da sua própria empresa.';
    end if;
  end if;
  delete from public.users where id = p_id;
end $$;

grant execute on function public.app_delete_user(bigint) to anon, authenticated;

-- ── Redefine senha (matriz: todos; filial: só da própria empresa) ────────
drop function if exists public.app_reset_user_password(bigint, text);
create or replace function public.app_reset_user_password(p_id bigint, p_password text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_role text;
begin
  v_role := coalesce(public.app_session_role(), '');
  if v_role not in ('matriz', 'filial') then
    raise exception 'Apenas a matriz ou uma filial podem alterar senhas.';
  end if;
  if not exists (select 1 from public.users where id = p_id) then
    raise exception 'Usuário não encontrado.';
  end if;
  if v_role = 'filial' and not exists (
    select 1 from public.users
    where id = p_id and company_id = public.app_session_company()
  ) then
    raise exception 'Você só pode alterar a senha de usuários da sua própria empresa.';
  end if;
  update public.users set password = encode(digest(p_password, 'sha256'), 'hex') where id = p_id;
end $$;

grant execute on function public.app_reset_user_password(bigint, text) to anon, authenticated;

-- ── Altera o acesso (web/mobile/ambos) de um usuário ─────────────────────
create or replace function public.app_update_user_access(p_id bigint, p_access text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_role text;
begin
  v_role := coalesce(public.app_session_role(), '');
  if v_role not in ('matriz', 'filial') then
    raise exception 'Apenas a matriz ou uma filial podem alterar o acesso de usuários.';
  end if;
  if p_access not in ('web', 'mobile', 'both') then
    raise exception 'Acesso inválido. Use "web", "mobile" ou "both".';
  end if;
  if not exists (select 1 from public.users where id = p_id) then
    raise exception 'Usuário não encontrado.';
  end if;
  if v_role = 'filial' and not exists (
    select 1 from public.users
    where id = p_id and company_id = public.app_session_company()
  ) then
    raise exception 'Você só pode alterar o acesso de usuários da sua própria empresa.';
  end if;
  update public.users set access = p_access where id = p_id;
end $$;

grant execute on function public.app_update_user_access(bigint, text) to anon, authenticated;
