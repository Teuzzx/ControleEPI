-- ════════════════════════════════════════════════════════════════════════
-- Controle de EPI — Alertas de estoque baixo + notificações enriquecidas
-- Executar no SQL Editor da MATRIZ E DE CADA FILIAL (depois de 0003).
--
-- 1) Cria a tabela notifications se ainda não existir (idempotente).
-- 2) Adiciona colunas de apoio:
--      epi_id  → vincula o alerta ao EPI (usado para deduplicar/limpar)
--      ref_id  → id global de avisos criados pela matriz (mesmo aviso em
--                bancos diferentes tem o mesmo ref_id, permitindo excluir
--                em todas as filiais pelo mesmo identificador)
-- 3) Triggers: toda vez que a quantidade de um EPI (ou de suas variações)
--    ficar abaixo do mínimo, cria um alerta; quando o estoque se recupera,
--    os alertas abertos daquele EPI são marcados como lidos.
-- ════════════════════════════════════════════════════════════════════════

-- ── Tabela notifications (idempotente) ──────────────────────────────────
create table if not exists public.notifications (
  id                 bigserial primary key,
  type               text not null default 'info',
  title              text not null,
  message            text not null default '',
  sender_company_id  bigint,
  read               boolean not null default false,
  created_at         timestamptz not null default now()
);

alter table public.notifications add column if not exists epi_id bigint;
alter table public.notifications add column if not exists ref_id text;

create index if not exists notifications_unread_idx on public.notifications (read);
create index if not exists notifications_ref_id_idx on public.notifications (ref_id);
create index if not exists notifications_epi_id_idx on public.notifications (epi_id);

-- ── Alerta de estoque baixo ─────────────────────────────────────────────
-- Efetivo = soma das variações quando o EPI tem variações; senão total_quantity.
-- Cria alerta apenas se ainda não existir um NÃO lido do mesmo EPI (sem spam).
create or replace function public.refresh_low_stock_alert(p_epi_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_epi      public.epis%rowtype;
  v_effective int;
  v_low       boolean;
begin
  select * into v_epi from public.epis where id = p_epi_id;
  if not found then return; end if;

  select coalesce(sum(quantity), 0) into v_effective
  from public.epi_variants where epi_id = p_epi_id;

  if v_effective <= 0 then
    select v_epi.total_quantity into v_effective;
  end if;

  v_low := v_epi.min_quantity > 0 and v_effective < v_epi.min_quantity;

  if v_low then
    if not exists (
      select 1 from public.notifications
      where type = 'alerta' and epi_id = p_epi_id and read = false
    ) then
      insert into public.notifications (type, title, message, epi_id)
      values (
        'alerta',
        'Estoque baixo',
        v_epi.name || ' está com ' || v_effective || ' unidade(s) (mínimo: ' || v_epi.min_quantity || ').'
        , p_epi_id);
    end if;
  else
    -- Estoque recuperado: limpa os alertas pendentes do EPI.
    update public.notifications
    set read = true
    where type = 'alerta' and epi_id = p_epi_id and read = false;
  end if;
end $$;

-- Trigger no EPI: quantidade total ou mínimo alterados
create or replace function public.handle_epis_low_stock()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.refresh_low_stock_alert(new.id);
  return new;
end $$;

drop trigger if exists trg_epis_low_stock on public.epis;
create trigger trg_epis_low_stock
  after insert or update of total_quantity, min_quantity on public.epis
  for each row execute function public.handle_epis_low_stock();

-- Trigger nas variações: a soma muda quando uma variação é inserida,
-- atualizada ou excluída.
create or replace function public.handle_variants_low_stock()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'DELETE' then
    perform public.refresh_low_stock_alert(old.epi_id);
    return old;
  end if;
  perform public.refresh_low_stock_alert(new.epi_id);
  return new;
end $$;

drop trigger if exists trg_epi_variants_low_stock on public.epi_variants;
create trigger trg_epi_variants_low_stock
  after insert or update of quantity or delete on public.epi_variants
  for each row execute function public.handle_variants_low_stock();

-- ── Backfill: alerta para EPIs que já estão abaixo do mínimo ────────────
do $$
declare
  r record;
begin
  for r in
    select e.id from public.epis e where e.min_quantity > 0
    and (
      (exists (select 1 from public.epi_variants v where v.epi_id = e.id) and
       (select coalesce(sum(quantity), 0) from public.epi_variants v where v.epi_id = e.id) < e.min_quantity)
      or
      (not exists (select 1 from public.epi_variants v where v.epi_id = e.id) and
       e.total_quantity < e.min_quantity)
    )
  loop
    perform public.refresh_low_stock_alert(r.id);
  end loop;
end $$;
