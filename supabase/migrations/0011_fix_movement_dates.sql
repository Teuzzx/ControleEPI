-- ════════════════════════════════════════════════════════════════════════
-- Correção de datas das movimentações
-- Executar na MATRIZ (e em cada FILIAL com banco próprio).
--
-- Registros criados online pelo app mobile gravavam `created_at = null`
-- (o insert enviava null e sobrescrevia o default now()). O web então
-- exibia 01/01/1970. Corrige o passado e evita que isso volte a acontecer:
--   1) Backfill dos registros sem data (usa now() — o horário exato não
--      pode ser recuperado).
--   2) Default da coluna garante now() mesmo se um cliente enviar null.
-- ════════════════════════════════════════════════════════════════════════

update public.movements
set created_at = now()
where created_at is null;

alter table public.movements
  alter column created_at set default now(),
  alter column created_at set not null;