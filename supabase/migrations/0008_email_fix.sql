-- ════════════════════════════════════════════════════════════════════════
-- Controle de EPI — Fix recuperação de senha (banco da MATRIZ)
-- Executar NO SQL Editor do Supabase da MATRIZ.
--
-- BUG CORRIGIDO: na 0007 o envio de e-mail chamava net.http_post com o
-- argumento `content_type`, que NÃO existe na versão do pg_net instalada
-- (0.20.4). A assinatura real é http_post(url, body, params, headers,
-- timeout_milliseconds) e o Content-Type deve ir no jsonb de headers.
-- ════════════════════════════════════════════════════════════════════════

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
  -- pg_net 0.20: http_post(url, body, params, headers, timeout_milliseconds);
  -- Content-Type é passado no jsonb de headers.
  perform net.http_post(
    url := 'https://api.brevo.com/v3/smtp/email',
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
    headers := jsonb_build_object(
      'api-key', v_key,
      'Content-Type', 'application/json'
    ),
    timeout_milliseconds := 15000
  );
end $$;

grant execute on function public.app_request_password_reset(text) to anon, authenticated;