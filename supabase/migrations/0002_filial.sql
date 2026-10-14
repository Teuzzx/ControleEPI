-- ════════════════════════════════════════════════════════════════════════
-- Controle de EPI — Filiais (OPCIONAL)
-- Executar no SQL Editor de CADA projeto Supabase de filial.
--
-- As filiais têm apenas as tabelas de negócio (sem users/companies/sessions).
-- Este script mantém as tabelas sincronizadas com o schema da matriz e
-- habilita o realtime. Não ativa RLS (a chave anon da filial não é pública).
-- ════════════════════════════════════════════════════════════════════════

-- Validade do CA (NR-6)
alter table public.epis add column if not exists ca_expiry date;

-- ── Departamentos: reconcilia `teams`/`team_id` → `departments`/`department_id` ──
-- O app consulta a tabela `departments` e a coluna `employees.department_id`,
-- mas bancos criados a partir do `supabase-schema.sql` antigo tinham
-- `teams`/`team_id`. Sem esta reconciliação o `refresh()` do app falha
-- inteiro ("relation public.departments does not exist") e nenhuma tela
-- do sistema carrega na filial. Ver migration 0012 da matriz.
do $$
begin
  if to_regclass('public.departments') is null
     and to_regclass('public.teams') is not null then
    execute 'alter table public.teams rename to departments';
  elsif to_regclass('public.departments') is null then
    execute $ddl$
      create table if not exists public.departments (
        id          bigserial primary key,
        name        text not null unique,
        description text default '',
        color       text not null default '#6366F1',
        created_at  timestamptz default now(),
        updated_at  timestamptz default now()
      )
    $ddl$;
  end if;
end $$;

alter table public.employees add column if not exists department_id bigint;

do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'employees'
               and column_name = 'team_id') then
    execute 'update public.employees
             set department_id = team_id
             where department_id is null and team_id is not null';
  end if;
end $$;

create index if not exists idx_employees_department_id
  on public.employees (department_id);

-- Realtime
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
