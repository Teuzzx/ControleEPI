-- ════════════════════════════════════════════════════════════════════════
-- Controle de EPI — Segurança (banco da MATRIZ)
-- Executar no SQL Editor do projeto Supabase da matriz (e NÃO nas filiais).
-- ════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── Sessões: token gerado no banco, expira em 12h ────────────────────────
create table if not exists public.sessions (
  token      text primary key,
  user_id    bigint not null references public.users(id) on delete cascade,
  role       text not null,
  company_id bigint,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- ── Helpers (lidos pelas políticas de RLS) ───────────────────────────────
create or replace function public.app_request_token()
returns text language sql stable security definer set search_path = public, extensions as $$
  select coalesce(nullif(current_setting('request.headers', true)::json->>'x-session-token', ''), '')
$$;

create or replace function public.app_session_role()
returns text language sql stable security definer set search_path = public, extensions as $$
  select role::text from public.sessions
  where token = public.app_request_token() and expires_at > now()
$$;

-- ── Login: compara a senha no banco e devolve um token ───────────────────
-- (search_path inclui `extensions`: no Supabase o pgcrypto fica nesse schema)
create or replace function public.app_login(p_email text, p_password text)
returns table (
  user_id bigint, user_name text, user_email text, user_role text,
  company_id bigint, company_name text, company_url text, company_key text, token text
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

  return query select u.id, u.name, u.email, u.role, u.company_id, v_name, v_url, v_key, v_token;
end $$;

grant execute on function public.app_login(text, text) to anon, authenticated;

-- ── Matriz cria empresa + usuário filial (senha com hash no banco) ──────
create or replace function public.app_create_company(
  p_name text, p_admin_name text, p_admin_email text, p_admin_password text,
  p_supabase_url text default '', p_anon_key text default '', p_color text default '#22D3EE'
)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_company_id bigint;
begin
  if public.app_session_role() <> 'matriz' then
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

grant execute on function public.app_create_company(text, text, text, text, text, text, text) to anon, authenticated;

-- ── Matriz vincula o banco de uma filial ─────────────────────────────────
create or replace function public.app_update_company_connection(p_id bigint, p_url text, p_key text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if public.app_session_role() <> 'matriz' then
    raise exception 'Apenas a matriz pode vincular bancos de dados.';
  end if;
  update public.companies set supabase_url = p_url, anon_key = p_key where id = p_id;
end $$;

grant execute on function public.app_update_company_connection(bigint, text, text) to anon, authenticated;

-- ── RLS: sem token de sessão válido, ninguém lê/escreve nada ─────────────
alter table public.sessions       enable row level security;
alter table public.users          enable row level security;
alter table public.companies      enable row level security;
alter table public.departments    enable row level security;
alter table public.categories     enable row level security;
alter table public.employees      enable row level security;
alter table public.epis           enable row level security;
alter table public.epi_variants   enable row level security;
alter table public.movements      enable row level security;
alter table public.stock_entries  enable row level security;
alter table public.notifications  enable row level security;

-- sessions: acesso direto bloqueado (só as funções security definer mexem)
-- users: cada usuário vê apenas a própria linha (via app_login não precisa de nada)
create policy "users_select_self" on public.users for select
  using (id = (select user_id from public.sessions
               where token = public.app_request_token() and expires_at > now()));

-- companies: só a matriz lê (chaves das filiais ficam protegidas)
create policy "companies_select_matriz" on public.companies for select
  using (public.app_session_role() = 'matriz');

-- tabelas de negócio: somente sessão de matriz válida
do $$
declare t text;
begin
  foreach t in array array['departments','categories','employees','epis','epi_variants','movements','stock_entries','notifications']
  loop
    execute format('create policy "business_all_matriz" on public.%I for all
                    using (public.app_session_role() = ''matriz'')
                    with check (public.app_session_role() = ''matriz'')', t);
  end loop;
end $$;

-- ── Realtime: habilita as tabelas na publicação ──────────────────────────
do $$
declare t text;
begin
  foreach t in array array['departments','categories','employees','epis','epi_variants','movements','stock_entries','notifications']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when others then null;
    end;
  end loop;
end $$;

-- ── Validade do CA (NR-6) ────────────────────────────────────────────────
alter table public.epis add column if not exists ca_expiry date;

-- ── EPIs sem nome duplicado (opcional: remova duplicados antes) ──────────
do $$
begin
  create unique index if not exists epis_name_unique_idx on public.epis (lower(trim(name)));
exception when others then
  raise notice 'Índice único de EPIs não criado: existem nomes duplicados. Exclua os duplicados e rode o comando novamente.';
end $$;
