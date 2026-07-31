# App Mobile — Controle de EPI

Aplicativo Android (Flutter) para **saída de EPI** (com foto e assinatura digital),
**devolução** e **consulta de estoque**, com sincronização offline (fila no Hive)
e Supabase.

## Pré-requisitos

- Flutter 3.24+ instalado (https://flutter.dev)
- Android SDK / emulador ou dispositivo
- Projeto Supabase com as migrations aplicadas (veja `../supabase/migrations`)

## 1. Aplicar as migrations no Supabase

No SQL Editor do Supabase, execute na ordem (a matriz primeiro, depois as filiais):

1. **Matriz** (servidor central): `0001_security_matriz.sql` → `0003_mobile_app.sql`
2. **Cada filial**: `0002_filial.sql` → `0003_mobile_app.sql`

> Sem a migration `0001`, o login falha (a função `app_login` não existe).
> Sem a `0003`, não existem as colunas de foto/assinatura/estado nem o bucket `movements`.

## 2. Gerar as pastas de plataforma (Android/iOS)

O código Dart está pronto; as pastas de plataforma são geradas pelo Flutter:

```bash
cd mobile
flutter create --org com.norion --project-name epi_mobile .
```

Isso cria `android/`, `ios/`, etc. sem tocar no código em `lib/`.

## 3. Rodar

```bash
flutter pub get
flutter run --dart-define=SUPABASE_URL=https://SEU-PROJETO.supabase.co \
            --dart-define=SUPABASE_ANON_KEY=SUA_CHAVE_ANON
```

- `SUPABASE_URL`/`SUPABASE_ANON_KEY`: chave **pública** da **matriz**
  (o app se conecta à matriz e resolve a empresa/filial do usuário no login).
- Sem `--dart-define`, o app mostra a tela de configuração no primeiro acesso.

## Estrutura

```
lib/
  core/        config, tema, Hive (cache + fila offline), serviço de sync
  models/      sessão, colaborador, EPI, item de carrinho
  repositories/ auth (RPC app_login), dados da filial, upload de fotos
  features/
    login/     login via app_login
    home/      menu principal + badge de operações pendentes
    saida/     carrinho → foto → assinatura → confirmar
    devolucao/ mesmo fluxo com estado (Novo/Usado/Danificado)
    estoque/   consulta agrupada por EPI → cor → tamanho
    widgets/   pickers de colaborador/EPI e tela de captura
  app.dart     rotas (GoRouter)
  providers.dart  sessão, cliente Supabase, dados com cache offline
```

## Comportamento offline

- Com internet: saída/devolução vão direto ao Supabase (com rollback em caso de erro).
- Sem internet: a operação entra na fila local (fotos e assinaturas ficam no
  dispositivo) e é sincronizada automaticamente quando a conexão voltar
  (badge de pendências na tela inicial).
- Erros de validação (ex.: estoque insuficiente) **não** vão para a fila.
- EPIs devolvidos como **Danificado** não voltam ao estoque.

## Modelo de dados usado pelo app

| Coluna (movements)        | Uso                                          |
| ------------------------- | -------------------------------------------- |
| `employee_id`             | colaborador (tabela `employees`)             |
| `epi_id`, `color`, `size` | variação exata entregue/devolvida            |
| `state`                   | Novo / Usado / Danificado                    |
| `photo_url`               | foto do equipamento (bucket `movements`)     |
| `signature_url`           | assinatura digital (bucket `movements`)      |
| `cart_id`                 | agrupa os itens de uma mesma operação        |
