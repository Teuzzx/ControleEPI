-- ════════════════════════════════════════════════════════════════════════
-- Controle de EPI — Alinhamento departments/department_id
--
-- PROBLEMA
-- O arquivo `supabase-schema.sql` (referência para criar bancos) define:
--     create table teams (...)          -- e  employees.team_id  bigint
-- Mas TODO o código da aplicação (web `src/hooks/useSupabaseData.ts`,
-- `src/pages/Employees.tsx`, `src/pages/Departments.tsx`) usa:
--     tabela  "departments"
--     coluna  employees.department_id
-- e a migration 0001 já referencia `public.departments` no RLS.
--
-- Consequência em qualquer banco criado a partir do schema.sql (tipicamente
-- as FILIAIS): o app consulta `departments` → erro do PostgREST
-- ("relation public.departments does not exist"), e o `refresh()` falha
-- inteiro, derrubando todas as telas. Mesmo em banco que tenha a tabela,
-- o filtro por departamento nunca casa, porque a coluna lida é `team_id`.
--
-- ESTA MIGRATION
-- Reconcilia os dois nomes sem perder dado e sem quebrar consumidores
-- antigos: normaliza para `departments`/`department_id` e mantém
-- `team_id` como espelho sincronizado por trigger.
--
-- Rodar na MATRIZ e em CADA filial. Idempotente — pode rodar várias vezes.
-- ════════════════════════════════════════════════════════════════════════

do $$
begin
  -- ── 1) Tabela de departamentos ──────────────────────────────────────────
  if to_regclass('public.departments') is null
     and to_regclass('public.teams') is not null then
    execute 'alter table public.teams rename to departments';
    raise notice 'teams -> departments (renomeada)';
  elsif to_regclass('public.departments') is null then
    -- Nem `teams` nem `departments`: cria a tabela do zero, no mesmo formato
    -- usado pela aplicação (id BIGSERIAL + defaults da migration 0001).
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
    raise notice 'departments criada';
  end if;
end $$;

-- ── 2) Coluna department_id em employees ───────────────────────────────────
alter table public.employees add column if not exists department_id bigint;

do $$
begin
  -- A FK só é criada se `departments` existir de fato.
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'employees'
               and column_name = 'department_id')
     and not exists (
       select 1 from pg_constraint
       where conname = 'employees_department_id_fkey'
         and conrelid = 'public.employees'::regclass
     ) then
    execute 'alter table public.employees
             add constraint employees_department_id_fkey
             foreign key (department_id) references public.departments(id)
             on delete set null';
  end if;
end $$;

-- ── 3) Backfill: quem ainda usa team_id passa a ter department_id ─────────
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'employees'
               and column_name = 'team_id')
     and exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'employees'
                   and column_name = 'department_id') then
    execute 'update public.employees
             set department_id = team_id
             where department_id is null and team_id is not null';
    raise notice 'department_id populado a partir de team_id';
  end if;
end $$;

-- ── 4) Índice de consulta do filtro por departamento ───────────────────────
create index if not exists idx_employees_department_id
  on public.employees (department_id);

-- ── 5) Espelho team_id <-> department_id ───────────────────────────────────
-- Bases antigas (ou scriptsmanuais) podem gravar `team_id`; o app grava
-- `department_id`. O trigger garante que os dois fiquem sempre coerentes.
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'employees'
               and column_name = 'team_id') then

    execute $fn$
      create or replace function public.app_sync_employee_department()
      returns trigger language plpgsql as $body$
      begin
        if new.department_id is not null and new.team_id is distinct from new.department_id then
          new.team_id := new.department_id;
        elsif new.department_id is null and new.team_id is not null then
          new.department_id := new.team_id;
        end if;
        return new;
      end $body$
    $fn$;

    execute 'drop trigger if exists trg_sync_employee_department on public.employees';
    execute $trg$
      create trigger trg_sync_employee_department
      before insert or update on public.employees
      for each row execute function public.app_sync_employee_department()
    $trg$;
  end if;
end $$;