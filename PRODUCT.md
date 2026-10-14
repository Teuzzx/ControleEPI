# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users

- **Almoxarife** — opera o app em pé, no chão de fábrica ou depósito, com uma mão livre e pouca luz. Precisa localizar um colaborador, registrar a entrega ou devolução de EPI e capturar foto + assinatura. Frequência alta, sessão curta, repetitiva.
- **Gestor da matriz** — usa o painel web para acompanhar estoque, colaboradores e movimentações da rede. Sessão longa, teclado e mouse, tela grande.

## Product Purpose

Controlar o ciclo de vida do EPI (Equipamento de Proteção Individual): quem recebeu, quando, quanto, e com que comprovação. Registrar a entrega ou devolução no momento em que ela acontece, mesmo sem internet, e consolidar tudo num painel único da matriz e das filiais.

Sucesso = o almoxarife conclude uma entrega em segundos, sem perder registro quando a rede cai, e o gestor enxerga o estoque real da rede.

## Positioning

Offline-first: o registro nasce no celular, na hora, e sobe depois. A prova de que a entrega aconteceu (foto + assinatura) faz parte do registro, não é um extra.

## Operating Context

- O almoxarife alterna entre busca de colaborador, escolha de EPIs, captura de foto/assinatura e confirmação — muitas vezes repetindo o mesmo ciclo dezenas de vezes no turno.
- Aparelho intermediário Android, possivelmente com luva e em ambiente de alto ruído.
- A matriz distribui estoque para filiais; cada filial tem seu próprio projeto Supabase.

## Capabilities and Constraints

- Fluxo existente a preservar integralmente: `/login`, `/home`, `/saida`, `/devolucao`, `/estoque` (go_router, `app.dart`).
- Fila offline com sync_service.dart; realtime via Supabase.
- Captura de foto e assinatura são prova legal da entrega.
- Sessão via token `x-session-token`; RLS no Postgres valida `app_session_role()`.
- Matriz e filiais em projetos Supabase separados; `companies.supabase_url` guarda o vínculo.
- Termo do domínio: **EPI**, **almoxarife**, **colaborador**, **entrega**, **devolução**, **variação** (tamanho/cor de um EPI).

## Brand Commitments

- Nome: Controle de EPI / EPIAdmin, por **Norion**.
- Identidade já existente e a manter: fundo escuro, acento índigo, tipografia com display distinta de corpo.
- Usuário **não** pediu mudança de nome, fluxo, cor institucional ou tom de voz.

## Evidence on Hand

- Banco real com 17 colaboradores, 9 EPIs, 44 movimentações, 6 departamentos, 2 empresas — dados majoritariamente sintéticos para volume.
- Logo em `Logo padrão.png` / `public/logo-norion.png`.

## Product Principles

1. Um toque até a ação mais frequente. Se precisa de dois, está no lugar errado.
2. Nada se perde sem internet — a fila offline é妥協 com o usuário, não com o sistema.
3. A prova da entrega acompanha o registro, nunca depois dele.
4. O visual sustenta a confiança: o almoxarife precisa acreditar que o registro foi salvo.

## Accessibility & Inclusion

- Usado em pé, com uma mão só, às vezes com luvas — alvos de toque grandes e bem separados.
- Ambiente com pouca luz e sol forte — contraste alto é obrigatório.
- Ruído alto impede dependência de leitura em voz alta.