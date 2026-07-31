-- ════════════════════════════════════════════════════════════════════════
-- Controle de EPI — Tabela users + usuários de acesso (banco da MATRIZ)
-- Executar NO SQL Editor do Supabase da MATRIZ, ANTES da migration 0001
-- (a 0001 faz referência à tabela users).
-- ════════════════════════════════════════════════════════════════════════

create table if not exists public.users (
  id          bigserial primary key,
  company_id  bigint references public.companies(id) on delete set null,
  name        text not null,
  email       text not null unique,
  password    text not null,
  role        text not null default 'filial' check (role in ('matriz', 'filial')),
  created_at  timestamptz not null default now()
);

-- Usuários de demonstração (senha armazenada como hash SHA-256 hex).
-- admin@norion.com / admin123   → papel matriz
-- filial@norion.com / filial123 → papel filial (empresa vinculada pelo painel da matriz)
insert into public.users (company_id, name, email, password, role) values
  (null, 'Administrador Matriz', 'admin@norion.com',
   '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'matriz'),
  (null, 'Almoxarife Filial', 'filial@norion.com',
   'bd1dcf07745727d9e5a99a6ab60f8e095f2fb7578a8fb357765b8ec1874b4417', 'filial')
on conflict (email) do nothing;
