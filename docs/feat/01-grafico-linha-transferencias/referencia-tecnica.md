# Referência técnica — Transferências ao Humano

## Fontes auditadas

Tag `v1.0.0`, commit `debdaeff078cc457651a8748a52d6d4eaefb4f51` do projeto YDUQS:

- `apps/web/src/visao-geral/opcoesGraficos.ts`: opções ECharts originais (IAM e URA).
- `apps/web/src/monitoramento/series.ts`: separação de trechos e áreas.
- `apps/web/src/graficos/tooltip-pan.ts`: geometria do tooltip.
- `apps/web/src/graficos/guia-vertical-pontilhada.ts`: ponteiro vertical.
- `apps/web/src/visao-geral/representacao-sem-zeros.ts`: zeros visuais e compactação de dias.
- `apps/web/src/components/EChart.tsx`, `FocusModal.tsx`, `VisaoGeralPage.tsx`.
- `apps/web/src/styles.css`: regras de card, seletor, foco, claro/escuro e responsividade.

O TSX reúne as funções necessárias e substitui seletores CSS globais por escopo
`ds-tf-`; portanto, **o isolamento estrutural exige homologação visual** antes de afirmar
paridade literal de pixels no novo ambiente.

## Contrato e dados

`series: {ura: PontoTransferencia[], iam: PontoTransferencia[]}`;
`periodo: {from: string, to: string}` (ISO YYYY-MM-DD),
`tema: 'light' | 'dark'`, `origemInicial?: 'ura' | 'iam'`,
`carregando?: boolean`, `erro?: string | null`, `titulo?: string`.

Cada ponto tem `ordem` (`YYYY-MM-DD` ou `YYYY-MM-DD-HH`), `rotulo`,
`percentual` **fração** (0 a 1), `recebidas`, `transferidas` (números ou null).
Para bloco de madrugada são opcionais `madrugada`, `horasRegistradas`, `ultimaHoraOriginal`.

**A origem de dados é sempre externa:** mock somente em `mock/transferencias.ts`.
O componente não calcula os percentuais de origem, não acessa API/DAX e não altera
valores oficiais. O novo dashboard deve fornecer a taxa por intervalo já calculada
com o denominador correto.

## Comportamentos homologados na origem

- IAM: limite informativo 45%, base turquesa, área vermelha apenas acima do limite,
  interpolação do ponto de cruzamento, marcadores e linha com espessura 3,3.
- URA: mesma geometria geral, mas **sem limite de 45%** nem vermelho de alerta.
- Tooltip HTML: arredondamento 20px, dados da mesma observação, escape de texto,
  guia vertical tracejada, foco sem atenuar outros marcadores.
- Um dia: eixo de horas reais; zero de taxa não desenha marcador, mas continua dado original.
- Vários dias: pontos positivos são compactados **somente visualmente**;
  rótulos originais preservados. Ausências e BLANK não viram observação fictícia.
- Foco: mesmo seletor URA/IAM, tema e valores, porém tamanhos ECharts de foco;
  fecha pelo botão, pelo backdrop ou por Escape.
- CSS: 300px card desktop, 52px de cabeçalho, 28px de borda,
  seletor pill e foco responsivo; tipografia depende da fonte instalada no consumidor.

## Dependências

React `^19.1.1`, React DOM `^19.1.1`, ECharts `^6.0.0`, Vite `^7.1.9`,
TypeScript `^5.9.3`. Esses intervalos espelham os pacotes declarados na release,
**não provam as versões exatas do lockfile**. Não transportar fontes comerciais.

## Estados e limites

`carregando`, `erro`, `sem dados` são mutuamente priorizados nessa ordem:
`erro` > `carregando` > `sem dados`. Erro/BLANK não é zero. Sem dados válidos
não mostrar série artificial. Fonte/acesso e autorização de uso público são
pendências de publicação, não impeditivos para preparar o ZIP local.
