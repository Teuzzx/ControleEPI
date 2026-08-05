-- ════════════════════════════════════════════════════════════════════════
-- Controle de EPI — Marcação de movimentações lançadas offline
-- Executar no SQL Editor da MATRIZ E DE CADA FILIAL (depois de 0003).
--
-- O app mobile salva saídas/devoluções durante o período offline e envia
-- tudo de uma vez quando a internet volta. As movimentações entram com o
-- created_at real (data/hora em que o almoxarife registrou no celular) e
-- com offline_created = true para ficar marcado no sistema web que aquela
-- movimentação foi lançada durante o período offline.
-- ════════════════════════════════════════════════════════════════════════

alter table public.movements add column if not exists offline_created boolean not null default false;

create index if not exists movements_offline_created_idx on public.movements (offline_created);
