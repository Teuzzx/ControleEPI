-- ════════════════════════════════════════════════════════════════════════
-- Controle de EPI — Recuperação de senha por e-mail (banco da MATRIZ)
-- Executar NO SQL Editor do Supabase da MATRIZ.
--
-- Fluxo:
--   1. app_request_password_reset(e-mail) → gera código de 6 dígitos com
--      validade de 15 min, grava o HASH na tabela password_resets e envia
--      o e-mail via API da Brevo (extensão pg_net).
--   2. app_reset_password_with_code(e-mail, código, nova senha) → valida
--      o código (com trava de tentativas), troca a senha e derruba todas
--      as sessões ativas do usuário.
-- O envio usa a conta Brevo gratuita (300 e-mails/dia). A chave da API e
-- o e-mail remetente ficam na tabela app_config, configuráveis apenas
-- pela matriz via app_set_email_config.
-- ════════════════════════════════════════════════════════════════════════

-- ── Envio HTTP direto do Postgres (usado para o e-mail) ─────────────────
create extension if not exists pg_net;

-- ── Configurações do sistema (chave de API do e-mail etc.) ──────────────
create table if not exists public.app_config (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

-- ── Pedidos de redefinição de senha ─────────────────────────────────────
create table if not exists public.password_resets (
  id         bigint generated always as identity primary key,
  user_id    bigint not null references public.users(id) on delete cascade,
  code_hash  text not null,
  attempts   int not null default 0,
  used       boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_password_resets_user on public.password_resets(user_id);

-- Tabelas sensíveis: nada direto para anon/authenticated (só via RPC).
revoke all on table public.app_config, public.password_resets from anon, authenticated, public;

-- ── Matriz configura a conta de e-mail (Brevo) ──────────────────────────
create or replace function public.app_set_email_config(p_api_key text, p_sender_email text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if coalesce(public.app_session_role(), '') <> 'matriz' then
    raise exception 'Apenas a matriz pode configurar o e-mail.';
  end if;
  if p_sender_email is null or trim(p_sender_email) = '' then
    raise exception 'Informe o e-mail do remetente (verificado na Brevo).';
  end if;
  insert into public.app_config (key, value, updated_at) values
    ('brevo_api_key',     coalesce(p_api_key, ''), now()),
    ('brevo_sender_email', lower(trim(p_sender_email)), now())
  on conflict (key) do update set value = excluded.value, updated_at = now();
end $$;

grant execute on function public.app_set_email_config(text, text) to anon, authenticated;

-- ── Matriz consulta se o e-mail está configurado (nunca expõe a chave) ──
create or replace function public.app_get_email_config()
returns table (configured boolean, sender_email text)
language plpgsql security definer set search_path = public, extensions as $$
declare v_key text; v_sender text;
begin
  if coalesce(public.app_session_role(), '') <> 'matriz' then
    raise exception 'Apenas a matriz pode consultar a configuração de e-mail.';
  end if;
  select value into v_key    from public.app_config where key = 'brevo_api_key';
  select value into v_sender from public.app_config where key = 'brevo_sender_email';
  return query select
    (v_key is not null and v_key <> '' and v_sender is not null and v_sender <> '') as configured,
    coalesce(v_sender, '') as sender_email;
end $$;

grant execute on function public.app_get_email_config() to anon, authenticated;

-- ── Gera o código e envia o e-mail ───────────────────────────────────────
create or replace function public.app_request_password_reset(p_email text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  v_uid    bigint;
  v_name   text;
  v_code   text;
  v_key    text;
  v_sender text;
begin
  if p_email is null or trim(p_email) = '' then return; end if;

  -- Sem resposta para e-mail inexistente (não revela contas cadastradas).
  select u.id, u.name into v_uid, v_name
  from public.users u
  where lower(u.email) = lower(trim(p_email));
  if v_uid is null then return; end if;

  -- Configuração de e-mail precisa existir.
  select value into v_key    from public.app_config where key = 'brevo_api_key';
  select value into v_sender from public.app_config where key = 'brevo_sender_email';
  if v_key is null or v_key = '' or v_sender is null or v_sender = '' then
    raise exception 'A recuperação de senha por e-mail ainda não foi configurada. Contate o administrador.';
  end if;

  -- Anti-spam: um pedido recente não gera outro e-mail.
  if exists (
    select 1 from public.password_resets
    where user_id = v_uid and created_at > now() - interval '2 minutes'
  ) then return; end if;

  delete from public.password_resets where user_id = v_uid;

  v_code := lpad(floor(random() * 1000000)::int::text, 6, '0');
  insert into public.password_resets (user_id, code_hash, expires_at)
  values (v_uid, encode(digest(v_code, 'sha256'), 'hex'), now() + interval '15 minutes');

  -- Envia o e-mail de forma assíncrona (pg_net não bloqueia a transação).
  perform net.http_post(
    url := 'https://api.brevo.com/v3/smtp/email',
    headers := jsonb_build_object(
      'api-key', v_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'sender', jsonb_build_object('name', 'Controle de EPI', 'email', v_sender),
      'to', jsonb_build_array(jsonb_build_object('email', p_email, 'name', v_name)),
      'subject', 'Seu código de recuperação de senha — Controle de EPI',
      'htmlContent', format(
        '<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto">
           <h2 style="color:#6D5EF8;margin-bottom:4px">Controle de EPI</h2>
           <p style="color:#333">Olá <strong>%s</strong>,</p>
           <p style="color:#333">Recebemos um pedido para redefinir a senha do seu acesso.</p>
           <p style="color:#333">Digite o código abaixo na tela de recuperação:</p>
           <div style="background:#f3f1ff;border-radius:12px;padding:18px 24px;margin:16px 0;text-align:center">
             <span style="font-size:30px;font-weight:bold;letter-spacing:10px;color:#4F46E5">%s</span>
           </div>
           <p style="color:#666;font-size:13px">O código expira em <strong>15 minutos</strong>.</p>
           <p style="color:#666;font-size:13px">Se você não solicitou essa recuperação, pode ignorar este e-mail — sua senha continua segura.</p>
           <p style="color:#aaa;font-size:12px;margin-top:24px">Norion • Tecnologia e Inovação</p>
         </div>',
        v_name, v_code
      )
    ),
    timeout_milliseconds := 15000,
    content_type := 'application/json'
  );
end $$;

grant execute on function public.app_request_password_reset(text) to anon, authenticated;

-- ── Valida o código e redefine a senha ───────────────────────────────────
create or replace function public.app_reset_password_with_code(
  p_email text, p_code text, p_password text
)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  v_id  bigint;
  v_uid bigint;
begin
  if p_email is null or trim(p_email) = '' or p_code is null or trim(p_code) = '' then
    raise exception 'Informe o e-mail e o código recebido.';
  end if;
  if p_password is null or length(p_password) < 6 then
    raise exception 'A nova senha deve ter pelo menos 6 caracteres.';
  end if;

  -- Reset ativo do usuário (não usado, não expirado).
  select pr.id, pr.user_id into v_id, v_uid
  from public.password_resets pr
  join public.users u on u.id = pr.user_id
  where pr.used = false
    and pr.expires_at > now()
    and lower(u.email) = lower(trim(p_email));

  if v_id is null then
    raise exception 'Código inválido ou expirado.';
  end if;

  -- Código errado: conta a tentativa e bloqueia após 5.
  if not exists (
    select 1 from public.password_resets
    where id = v_id and code_hash = encode(digest(p_code, 'sha256'), 'hex')
  ) then
    update public.password_resets
    set attempts = attempts + 1,
        used     = case when attempts + 1 >= 5 then true else used end
    where id = v_id;
    raise exception 'Código inválido ou expirado.';
  end if;

  update public.users
  set password = encode(digest(p_password, 'sha256'), 'hex')
  where id = v_uid;

  update public.password_resets set used = true where id = v_id;

  -- Derruba todas as sessões ativas do usuário (segurança).
  delete from public.sessions where user_id = v_uid;
end $$;

grant execute on function public.app_reset_password_with_code(text, text, text) to anon, authenticated;
