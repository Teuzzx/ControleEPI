-- ════════════════════════════════════════════════════════════════════════
-- Controle de EPI — App Android (movimentações do almoxarife)
-- Executar no SQL Editor da MATRIZ E DE CADA FILIAL (depois de 0001/0002).
-- ════════════════════════════════════════════════════════════════════════

-- ── Movimentações: colunas usadas pelo app mobile ───────────────────────
-- (colunas extras são ignoradas pelo sistema web — compatível)
alter table public.movements add column if not exists employee_id bigint;
alter table public.movements add column if not exists epi_id bigint;
alter table public.movements add column if not exists color  text not null default '';
alter table public.movements add column if not exists size   text not null default '';
alter table public.movements add column if not exists state  text not null default 'Novo';
alter table public.movements add column if not exists photo_url text;
alter table public.movements add column if not exists signature_url text;
alter table public.movements add column if not exists cart_id text;

create index if not exists movements_cart_id_idx    on public.movements (cart_id);
create index if not exists movements_employee_idx   on public.movements (employee_id);
create index if not exists movements_created_idx    on public.movements (created_at desc);

-- ── Storage: bucket para fotos e assinaturas ────────────────────────────
insert into storage.buckets (id, name, public)
values ('movements', 'movements', true)
on conflict (id) do update set public = true;

create policy "movements_bucket_select" on storage.objects for select
  using (bucket_id = 'movements');
create policy "movements_bucket_insert" on storage.objects for insert
  with check (bucket_id = 'movements');
create policy "movements_bucket_update" on storage.objects for update
  using (bucket_id = 'movements');
create policy "movements_bucket_delete" on storage.objects for delete
  using (bucket_id = 'movements');
