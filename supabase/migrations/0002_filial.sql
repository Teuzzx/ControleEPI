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
