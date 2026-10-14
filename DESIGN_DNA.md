# DESIGN DNA — Controle de EPI (Norion)

> Fonte de verdade visual do sistema. Web (`src/`) e mobile (`mobile/lib/`) partilham
> a mesma identidade. Qualquer tela nova deve ser desenhada **dentro** deste DNA —
> nunca introduzir um segundo sistema visual.

---

## 1. Identidade

**Negócio.** Sistema interno de gestão de Equipamentos de Proteção Individual.
Não é vitrine: é o terminal onde o **almoxarife** registra entrega e devolução de
EPI no celular, no galpão, e onde a **matriz** audita a rede de empresas.

**Público primário — o almoxarife.** Uma mão só, celular, ambiente com ruído e
luz ruim. Precisa ler número de matrícula e quantidade sem esforço, e precisa
confirmar a operação sem medo de errar. **Público secundário** — supervisor e
gestor de matriz, no desktop, para consulta e auditoria.

**Indústria.** Segurança do trabalho, NR-6 (EPI) e NR-12 (máquinas). O vocabulário
do domínio é **concreto e físico**: lote, CA, validade, tamanho, cor, matrícula,
assinatura, foto do equipamento entregue.

**Posicionamento.** Ferramenta de campo, não dashboard de marketing. Aposta em
**legibilidade sob condição adversa** e em **rastreabilidade** (cada saída tem
foto + assinatura + autor + horário).

**Keywords visuais:** industrial noturno, vidro fumê, dado monoespaçado,
painel de controle,光度 baixa sem perder contraste.

### O que ancora o design nesta empresa (teste "remove o logo")

Sem logo e sem o nome "Norion", o sistema ainda pertence a esta empresa por:

1. **Monoespaçado obrigatório em todo dado técnico** — matrícula, CPF, CA, lote,
   quantidade, data e operador usam `--font-mono` (JetBrains Mono). Um ERP
   genérico usaria a fonte de texto. Aqui o número *é* o registro legal do
   documento; ele precisa parecer campo de formulário, não parágrafo.
2. **Vidro fumê sobre fundo quase-preto** com brilho de holofote — referência
   direta ao painel de instrumentos de equipamento industrial à noite, não ao
   "dark mode" genérico.
3. **Chip de status como linguagem** — `Ativo`/`Inativo`, `Novo`/`Usado`/
   `Danificado`, `ESGOTADO`. O estado do EPI é informação de primeira classe,
   sempre visível como etiqueta, nunca escondida em tooltip.

---

## 2. Tipografia

| Papel | Família | Pesos | Uso |
|---|---|---|---|
| Display | **Instrument Sans** | 500–700 | Títulos de página, números de métrica, h2/h3 |
| Corpo/UI | **Inter** | 300–600 | Labels, tabelas, inputs, corpo de texto |
| Dado | **JetBrains Mono** | 400–700 | Todo valor técnico: id, CPF, matrícula, CA, lote, quantidade, data, operador, token |

**Porquê.** `Instrument Sans` tem largura variável e é mais "de instrumento"
que `Poppins`/`Montserrat` — carrega a ideia de painel técnico sem cair no
clichê. `Inter` fica restrito ao texto corrido pequeno, onde a legibilidade em
tela pequena é o que importa. O `JetBrains Mono` é a decisão mais específica do
projeto e não pode ser removida.

**Escala (px).** 10 (micro-label, uppercase) · 11,5 (legenda) · 12–13 (meta) ·
13,5–15 (corpo/tabela) · 17–20 (título de página) · 28 (métrica do dashboard).
Line-height 1.5 no corpo, 1.2–1.3 nos números grandes. Tracking negativo
(-0.02em a -0.03em) nos títulos; **nunca** itálico em dado técnico.

**Regra de refutação.** Se a empresa passar a ter fonte de marca proprietária,
`--font-display` e `--font-sans` devem ser substituídas. O `--font-mono`
permanece por função, não por moda.

---

## 3. Cor

**Primária `#6366F1` (índigo).** Ação primária, seleção, estado ativo.
**Acento `#22D3EE` (ciano).** Informação, link, dado em destaque. **Nunca** usar
os dois como par decorativo: um ou o outro tem função semântica.

**Semânticas (fixas, não negociáveis):**
`#10B981` disponível/ok · `#F59E0B` atenção/pendente · `#F43F5E` crítico/erro ·
`#3D4257` desabilitado/muted.

**Superfícies (fundos).**
`#07090F` app · `#0D0F18` card · `#131520` surface-2 ·
`rgba(255,255,255,.03 / .055 / .08)` surface-1 / surface-2 / hover ·
borda `rgba(255,255,255,.065)`.

**Texto.** `#E8EAF6` primário · `#9BA3C4` secundário · `#5C6388` terciário ·
`#3D4257` desabilitado.

**Regra dura:** cor semântica nunca é usada para decorar, e a marca não troca a
paleta por "modernidade". Se um elemento é âmbar, é porque **está pendente**.

---

## 4. Iconografia

Família única **lucide-react** (web) e **Material Icons** (mobile), ambos
outline, mesmo peso visual (1.8–2.0 de stroke), tamanho 12–20px, `currentColor`.

**Ícone por função, nunca por decoração.** Um card só recebe ícone quando o
ícone acrescenta informação que o rótulo não dá.

**Clichês PROIBIDOS** (não descrevem nada aqui): estrela = qualidade, escudo =
segurança/proteção, coração = cuidado, lâmpada = ideia, foguete = crescimento,
sparkles = premium.

> Correção aplicada (2026-10): a tela de login usava `ShieldCheck` com o texto
> "Seus dados estão protegidos" — o cliché "escudo = segurança" literal, sobre um
> sistema cuja segurança é garantida por token no Postgres (RLS), não por
> símbolo. Substituído por informação verdadeira.

---

## 5. Imagem

**Web.** Fotografia **documental** de ambiente de trabalho real (galpão, bancada,
caixa de EPI). Luz natural ou de galpão, horizontal, com **espaço negativo à
esquerda** para o headline. Nunca: aperto de mão, equipe sorrindo em reunião,
render 3D de capacete flutuando, céu.

**Login (asset atual).** Foto de fundo real + máscara em 4 camadas (gradiente
vertical, vinheta, dois brilhos laterais) para garantir contraste do texto sobre
qualquer imagem. Fallback automático (`onError`) para uma segunda foto real —
nunca para um gradiente abstrato.

**Mobile.** **Nenhuma imagem de banco.** O app é usado em campo; imagem aqui
custaria latência e não informa nada. O que substitui a imagem é a **foto real
do colaborador e a assinatura** capturadas no ato da entrega.

---

## 6. Layout

- **Web.** Shell de aplicação: sidebar fixa (240px) + área de conteúdo com
  scroll próprio. Densidade **alta** — é ferramenta de trabalho, não landing.
  Padding de página 24/28px. Tabelas em `overflow-x: auto`.
- **Mobile.** Fluxo vertical de 3 passos numerados (`1. Colaborador`,
  `2. Itens`, `3. Foto e assinatura`) com rodapé fixo de confirmação. O passo
  ativo é o que destoa; os concluídos ficam esmaecidos, nunca escondidos.
- **Ritmo de espaçamento:** escala de 4px (4/8/12/14/16/20/24/28/32).
- **Alinhamento:** à esquerda por padrão. Centralizado apenas em estado vazio
  e em tela de login.
- **Assimetria:** o dashboard privilegia a tabela demovimentações (uso real) em
  relação aos gráficos (uso de管理). Gráficos não ocupam a dobra principal.

---

## 7. Shape language

Raio único: **12px** (`--radius`). Chips e badges são totalmente arredondados
(pílula, raio 999px) porque são etiquetas, não superfícies.
Borda de 1px em `rgba(255,255,255,.065)`. Sombra só em camada flutuante de fato
(modal, dropdown) — nunca em card de página. Nada de "card flutuando".

---

## 8. Motion

Personalidade: **curta e funcional**. Nada de entrada ornamental em ferramenta
de trabalho.

- Duração: **120–200ms**. Easing: `ease-out` para entrada, `ease` para hover.
- Entrada de página: **fade + 8px de deslocamento, uma vez**. Nada de stagger
  repetido em todas as seções (ver AI Smell Audit §10).
- Hover: mudança de superfície (`--surface-hover`) + `translateY(-1px)` em botão.
- Toast/SnackBar: entra flutuante, some em 4–5s. Sucesso em verde, erro em
  âmbar/vermelho — nunca só texto.
- Mobile: sem animação de transição entre telas (a latência de toque é
  sacred). Feedback por cor do estado e por snackbar.

---

## 9. Componentes

| Componente | Regra |
|---|---|
| Botão primário | Gradiente índigo `#6366F1 → #4F46E5`, texto branco, raio 10, `translateY(-1px)` no hover |
| Botão de ícone | 28–32px, fundo `${cor}12`, borda `${cor}25` |
| Card | `#0D0F18`, borda 1px, raio 12–16. **Um card = uma ação** |
| Badge de status | Pílula, cor semântica a 12% de fundo / 35% de borda, texto 700 |
| Tabela | Cabeçalho em muted uppercase, linha com hover, sem zebra |
| Input | `#171B28`, borda `#23273C`, foco índigo 1.4px, sem sombra |
| Modal | Portal no `document.body`, overlay `rgba(0,0,0,.7)`, scroll travado, fecha em Esc e no backdrop |
| Estado vazio | Texto muted centralizado + ação de recuperação (retry), **nunca** só texto |
| Estado de erro | Mensagem legível em pt-BR + botão "Tentar novamente". **Nunca** despejar exceção técnica |

---

## 10. AI Smell Audit (executado sobre a UI real)

| # | Item | Status | Onde | Diagnóstico | Correção |
|---|---|---|---|---|---|
| 1 | Hero genérico | — | — | Não há hero; é app interno | — |
| 2 | Copy genérica | ✔ | Login, páginas | Textos são do domínio (matrícula, CA, lote,Collaborator) | — |
| 3 | Tipografia genérica | ⚠→✔ | `index.css:1-3` | `Inter` no corpo é escolha legível; display é Instrument Sans (não é da lista padrão) | Aceito com justificativa; **manter** Instrument Sans no display |
| 4 | Ícones genéricos | ⚠→✔ | `LoginPage.tsx:842` `ShieldCheck` | Clichê "escudo = segurança" | **Corrigido**: escudo removido, texto substituído por informação verdadeira |
| 5 | Imagens stock genéricas | ✔ | Login | Foto real + 2º fallback real, nunca render/aperto de mão | — |
| 6 | Cards excessivos | ✔ | páginas | Card = uma ação; tabelas são tabelas | — |
| 7 | Border radius excessivo | ✔ | todo o sistema | Raio único 12px, pílula só em badge | — |
| 8 | Gradientes sem função | ✔ | botões, hero do login | Só em ação primária e no holofote do login | — |
| 9 | Glassmorphism sem justificativa | ✔ | login, modal | Justificado: leitura de texto sobre foto | — |
| 10 | Fade-up em todas as seções | ⚠→✔ | 12 páginas (`animation: fade-up 0.5s ease both`) | Toda página entra igual → sem personalidade | **Corrigido**: unificado em `.page-enter` (fade + 8px, 180ms) |
| 11 | Layout excessivamente centralizado | ✔ | login, estados vazios | Centered só onde é correto | — |
| 12 | Seções repetidas | — | não se aplica (app, não landing) | — | — |
| 13 | CTAs repetidos | ✔ | páginas | Um CTA primário por contexto | — |
| 14 | Cores sem origem na marca | ✔ | `index.css` | Índigo/ciano fixos e semânticos, tied ao tema mobile | — |
| 15 | Componentes intercambiáveis | ✔ | — | Badge de estado diferencia visualmente | — |
| 16 | Ausência de personalidade | ⚠→✔ | animação de página | Personalidade real está no mono + vidro fumê | **Corrigido** em §10 |
| 17 | Ausência de elementos da empresa | ✔ | logo Norion, "Norion • Tecnologia e Inovação" em login e PDF | — | — |
| 18 | Aparência de template | ✔ | — | Densidade e mono quebram o template | — |
| 19 | Landing gerada automaticamente | — | não se aplica | — | — |
| 20 | Hero + 3 cards + números | — | não se aplica | — | — |
| 21 | Estados de erro cru | ⚠→✔ | telas web + mobile | Erro técnico vazava para o usuário | **Corrigido**: `ErrorRetry`/`friendlyDataError` no mobile; mensagens de erro no web |

**Resultado do teste "remove the logo": pertence a esta empresa** — ancorado pelo
uso obrigatório de monoespaçado em dado técnico, pelo vidro fumê de painel
industrial noturno e pelo chip de status como linguagem de domínio. Nenhum desses
três é alcançável por um ERP genérico com logo trocada.

---

## 11. Anti-AI rules (as regras que valem para este projeto)

1. **Dado técnico sempre em mono.** Matrícula, CPF, CA, lote, quantidade, data e
   operador **nunca** na fonte de texto. É a regra que mais identifica este sistema.
2. **Cor tem semântica.** Se não é status, é ação ou é informação, não use cor de marca.
3. **Ícone precisa explicar algo que o rótulo não diz.** Zero ícone decorativo.
4. **Estado de erro sempre recuperável** — mensagem em pt-BR + ação. Exceção técnica
   nunca chega ao usuário final.
5. **Densidade de ferramenta.** Se a tela parece uma landing page, está errada.
6. **Uma animação, uma vez.** Sem stagger decorativo, sem loop infinito na
   área de trabalho.
7. **Mobile sem imagem de banco.** O ativo visual do app é a foto real do
   colaborador.