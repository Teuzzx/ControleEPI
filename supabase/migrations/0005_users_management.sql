-- ════════════════════════════════════════════════════════════════════════
-- Controle de EPI — Gestão de usuários (banco da MATRIZ)
-- Executar NO SQL Editor do Supabase da MATRIZ.
--
-- Permite a matriz criar usuários com login/senha, escolher o papel
-- (matriz ou filial) e designar a empresa (filial). O login do usuário
-- só enxerga os dados da empresa designada (app_login já retorna o
-- banco da empresa; filiais acessam o próprio banco e a matriz o dela).
-- ════════════════════════════════════════════════════════════════════════

-- ── Matriz cria usuário (papel + empresa designada) ─────────────────────
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

grant execute on function public.app_create_user(text, text, text, text, bigint) to anon, authenticated;

-- ── Lista usuários com a empresa designada (senha nunca sai) ─────────────
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

grant execute on function public.app_list_users() to anon, authenticated;

-- ── Matriz exclui usuário (nunca a própria conta) ────────────────────────
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

grant execute on function public.app_delete_user(bigint) to anon, authenticated;

-- ── Matriz redefine a senha de um usuário ────────────────────────────────
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

grant execute on function public.app_reset_user_password(bigint, text) to anon, authenticated;

