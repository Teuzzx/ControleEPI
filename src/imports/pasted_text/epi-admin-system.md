PROMPT PREMIUM — SISTEMA WEB ADMINISTRATIVO DE GESTÃO DE EPI
CONTEXTO

Atue como uma equipe formada pelos melhores profissionais de tecnologia do mundo, composta por:

Arquiteto de Software Sênior
Engenheiro Full Stack
UX/UI Designer nível Apple, Stripe, Linear, Notion e Vercel
Especialista em Sistemas Corporativos (ERP)
Especialista em Controle de Estoque
Especialista em Banco de Dados
Especialista em Segurança da Informação
Especialista em Performance
Especialista em Experiência do Usuário

Sua missão é desenvolver um Sistema Web Administrativo de Gestão de EPIs, moderno, elegante, altamente profissional e preparado para uso em empresas de pequeno, médio e grande porte.

Este sistema será exclusivamente o painel administrativo da plataforma.

IMPORTANTE

Este sistema não será responsável por realizar entregas, devoluções ou baixas de EPIs manualmente.

Essas movimentações serão realizadas futuramente por um aplicativo mobile.

O sistema web deve funcionar como o cérebro da plataforma, responsável por:

cadastrar colaboradores;
cadastrar EPIs;
controlar o estoque;
organizar categorias;
visualizar movimentações vindas do aplicativo;
gerar relatórios;
fornecer indicadores gerenciais;
administrar todas as informações armazenadas no banco de dados.

Toda movimentação exibida neste sistema deverá ser sincronizada automaticamente com o banco de dados do Supabase, alimentado pelo aplicativo mobile.

OBJETIVO

Criar um sistema extremamente profissional.

Não quero um dashboard comum.

Quero um sistema com aparência de software corporativo vendido para grandes empresas.

Todo o design deve transmitir organização, confiança e tecnologia.

A interface precisa parecer desenvolvida por uma agência internacional especializada em softwares empresariais.

TECNOLOGIAS

Você possui liberdade total para escolher as tecnologias mais modernas e adequadas para este projeto.

Escolha o stack ideal considerando:

escalabilidade;
segurança;
organização do código;
facilidade de manutenção;
desempenho;
arquitetura limpa.

Utilize as melhores bibliotecas e frameworks disponíveis atualmente.

Caso existam tecnologias superiores às inicialmente pensadas, utilize-as livremente.

O banco de dados deverá ser o Supabase (PostgreSQL).

Toda a arquitetura deverá ser preparada para futura integração com um aplicativo mobile.

DESIGN

Desenvolva uma interface inspirada em produtos como:

Stripe Dashboard
Notion
Linear
Vercel
Apple
Atlassian
SAP Fiori

Características:

Design minimalista
Aparência premium
Glassmorphism discreto
Bordas suaves
Excelente hierarquia visual
Espaçamento perfeito
Tipografia moderna
Componentes reutilizáveis
Dark Mode
Light Mode
Responsividade completa

Nada deve parecer um template.

DASHBOARD

Ao acessar o sistema, o usuário deverá visualizar um painel executivo contendo informações importantes do estoque.

Exibir indicadores como:

quantidade total de colaboradores;
quantidade total de EPIs cadastrados;
quantidade total de categorias;
quantidade em estoque;
itens com estoque baixo;
produtos próximos do estoque mínimo;
últimas entradas registradas;
últimas movimentações sincronizadas;
colaboradores cadastrados recentemente;
gráficos de estoque por categoria;
gráficos por equipe;
gráficos por setor;
evolução das movimentações por período.

Todos os gráficos deverão ser dinâmicos.

CADASTRO DE COLABORADORES

Criar um módulo completo para gerenciamento dos colaboradores.

Permitir:

cadastrar;
editar;
excluir (soft delete);
pesquisar;
filtrar;
visualizar detalhes.

Cada colaborador deverá possuir:

ID gerado automaticamente em ordem crescente;
Nome completo;
CPF;
Telefone;
Matrícula;
Cargo;
Equipe;
Setor;
Empresa;
Data de admissão;
Status (Ativo/Inativo);
Observações.

O usuário poderá criar novas equipes e novos cargos diretamente pelo sistema.

EQUIPES

Criar um módulo específico para gerenciamento das equipes.

Permitir:

cadastrar;
editar;
excluir;
pesquisar.

Cada equipe poderá possuir:

nome;
descrição;
cor de identificação;
quantidade de colaboradores.
CARGOS

Criar gerenciamento completo dos cargos.

Permitir:

cadastro;
edição;
exclusão;
pesquisa.
MÓDULO DE ESTOQUE

Este será o principal módulo do sistema.

O objetivo é controlar tudo o que existe dentro do almoxarifado.

O usuário deverá conseguir cadastrar qualquer tipo de EPI ou uniforme.

Exemplos:

capacetes;
botas;
óculos;
protetores auriculares;
respiradores;
luvas;
cintos;
coletes;
camisas;
calças;
jaquetas;
uniformes;
ferramentas;
qualquer outro item.

O sistema deverá permitir criar categorias ilimitadas.

CADASTRO DOS EPIs

Cada item deverá possuir informações completas.

Campos:

Nome do produto;
Foto principal do produto;
Categoria;
Subcategoria;
Fabricante;
Fornecedor;
Descrição;
Observações;
Número do lote;
Data de fabricação;
Quantidade mínima;
Quantidade atual;
Localização física no almoxarifado.

O campo CA (Certificado de Aprovação) deverá existir, porém não será obrigatório, pois alguns produtos não possuem CA.

VARIAÇÕES DOS PRODUTOS

O sistema deverá permitir cadastrar variações de um mesmo produto.

Exemplo:

Camisa Operacional

Cor Azul

P → 80 unidades
M → 120 unidades
G → 95 unidades
GG → 40 unidades

Cor Laranja

P → 25 unidades
M → 60 unidades
G → 70 unidades

Cada combinação de cor e tamanho deve possuir seu próprio controle de quantidade.

Outro exemplo:

Calça Operacional

Cor Azul

36 → 40 unidades

38 → 65 unidades

40 → 90 unidades

42 → 120 unidades

44 → 60 unidades

Ou seja, um único produto poderá possuir diversas cores, e cada cor poderá possuir diversos tamanhos, sendo que cada combinação terá seu próprio estoque.

IMAGENS DOS PRODUTOS

O sistema deverá permitir cadastrar uma ou mais fotografias de cada produto.

O objetivo dessas imagens não é realizar leitura por câmera, QR Code ou código de barras.

As fotografias servirão apenas para facilitar a identificação visual do item durante a consulta do estoque.

Exemplo:

Ao abrir o cadastro de uma camisa, o usuário poderá visualizar suas fotos para identificar rapidamente o modelo correto antes de realizar qualquer operação.

ENTRADAS NO ESTOQUE

O sistema web permitirá registrar apenas a entrada inicial dos produtos vindos dos fornecedores ou da fábrica.

Exemplo:

Chegaram 300 capacetes.

Chegaram 150 botas.

Chegaram 800 camisas.

Chegaram 500 calças.

Durante esse cadastro será possível informar:

produto;
fabricante;
fornecedor;
lote;
data;
quantidade;
cor;
tamanho;
observações.

Essas informações atualizarão automaticamente o estoque no banco de dados.

MOVIMENTAÇÕES

O sistema web não permitirá registrar manualmente entregas ou devoluções.

Ele será apenas um painel de consulta.

Todas essas informações deverão ser sincronizadas automaticamente pelo banco de dados do Supabase.

Sempre que o aplicativo mobile registrar:

uma entrega;
uma devolução;
uma troca;
uma baixa;
uma reposição.

O sistema web deverá refletir essas alterações em tempo real.

RELATÓRIOS

Criar um módulo extremamente completo.

Permitir filtros por:

período;
colaborador;
equipe;
setor;
categoria;
produto;
fabricante.

Gerar relatórios como:

estoque atual;
entradas realizadas;
movimentações recebidas do aplicativo;
devoluções registradas;
itens disponíveis;
histórico de um colaborador;
histórico de um produto;
produtos mais distribuídos;
produtos menos utilizados;
produtos próximos do estoque mínimo.

Permitir exportação em PDF e Excel.

BANCO DE DADOS

Toda a aplicação deverá utilizar Supabase.

Toda alteração realizada pelo sistema web deverá ser salva automaticamente.

Todas as movimentações realizadas pelo aplicativo mobile deverão ser refletidas automaticamente neste sistema através da sincronização do banco de dados.

A arquitetura deverá ser preparada para comunicação em tempo real utilizando os recursos do Supabase.

EXPERIÊNCIA DO USUÁRIO

A navegação deve ser extremamente intuitiva.

Utilizar:

animações suaves;
skeleton loading;
tabelas inteligentes;
filtros instantâneos;
paginação;
pesquisa em tempo real;
notificações elegantes;
feedback visual;
carregamento otimizado.
RESULTADO ESPERADO

Desenvolva um sistema administrativo de gestão de EPIs com padrão internacional de qualidade, arquitetura escalável e código limpo. O foco deve ser a administração do estoque, dos colaboradores e das informações corporativas, enquanto todas as movimentações operacionais (entregas, devoluções, trocas e baixas) serão consumidas automaticamente do banco de dados do Supabase, alimentado por um aplicativo mobile desenvolvido futuramente. O resultado deve ser um software que pareça um produto comercial de alto nível, com excelente usabilidade, desempenho, segurança e design refinado, sem aparência de template ou de projeto gerado por IA.