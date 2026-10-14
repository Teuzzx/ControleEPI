-- ════════════════════════════════════════════════════════════════════════
-- Controle de EPI — Sessão expirada visível (matriz)
--
-- O PROBLEMA
-- O app se autentica com a chave anon + header `x-session-token`, e o RLS
-- libera as tabelas de negócio quando app_session_role() = 'matriz'. Quando
-- o token expira (12h) ou é revogado, app_session_role() devolve NULL e o
-- RLS barra tudo.
--
-- O sintoma era silencioso: o app carregava, o login funcionava, mas todas
-- as listas voltavam VAZIAS — colaboradores 0, estoque 0, avisos 0, e o
-- "registro de saída" falhava com "variação não encontrada" mesmo com o EPI
-- existente. Sem mensagem de erro em lugar nenhum: parecia banco sem dados.
--
-- A CORREÇÃO
-- Uma função security definer que responde "essa sessão está viva?" sem o
-- RLS atrapalhar, para o app poder distinguir:
--   - sessão inválida  → mostrar "sua sessão expirou, entre de novo"
--   - sessão válida    → buscar os dados normalmente
--
-- É security definer de propósito: precisa ler `sessions`, que o RLS bloqueia
-- para o anon. Busca pontual por token, nunca lista.
-- ════════════════════════════════════════════════════════════════════════

create or replace function public.app_session_is_valid()
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1
    from public.sessions s
    where s.token = public.app_request_token()
      and s.expires_at > now()
  );
$$;

grant execute on function public.app_session_is_valid() to anon, authenticated;

comment on function public.app_session_is_valid() is
  'true quando o header x-session-token aponta para uma sessao valida e nao expirada. Use no app para distinguir "sessao expirada" de "banco vazio".';