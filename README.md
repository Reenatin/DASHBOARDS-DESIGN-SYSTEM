# DASHBOARDS-DESIGN-SYSTEM

Biblioteca enxuta de **códigos visuais reutilizáveis** em React/TypeScript.
O componente do catálogo é o **mesmo TSX/CSS** usado na integração com um dashboard.
A demo no StackBlitz recebe dados sintéticos externos; nenhum componente consulta APIs nem inclui mocks.

## Modelo 01 — Etapa 1 (publicado e homologado em 20/10/2026)

`componentes/grafico-linha-transferencias/` contém um TSX e seu CSS:
- gráfico Evolução das Transferências ao Humano, visual originalmente homologado na release YDUQS v1.0.0;
- seletor URA/IAM, tooltip com guia vertical, marcadores, gradientes, referência de 45% **apenas na IAM**;
- abertura de foco, claro/escuro e dimensionamento responsivo.

O modelo preserva comportamento do ECharts e não consulta dados do cliente. Consulte a
[referência técnica](docs/feat/01-grafico-linha-transferencias/referencia-tecnica.md) antes de integrar.

## Modelo 02 — Etapa 2 (ZIP incremental, homologação pendente)

`componentes/grafico-linha-volume/` reúne um TSX e CSS do gráfico **Evolução do Volume URA/IAM**. Animação preservada: a linha/área surge inteira e os marcadores aparecem depois, com cancelamento em alternâncias rápidas. Tooltip original sem linha Recebidas duplicada, guia pontilhada, foco, claro/escuro e responsividade.

A prévia React oferece seletor de modelo; na Etapa 2 também alterna o mock **Dia / Vários dias**. Dados de demonstração em `mock/volume.ts`, nunca dentro do gráfico. Consulte a [referência técnica](docs/feat/02-grafico-linha-volume/referencia-tecnica.md).

### Visualização no StackBlitz

O repositório público é acessível no [StackBlitz](https://stackblitz.com/github/Reenatin/DASHBOARDS-DESIGN-SYSTEM). O segundo gráfico aparecerá após a publicação/autorização da Etapa 2.
No ambiente do projeto, o `npm run dev` inicia a prévia React; `npm run build` valida e compila.
Para uso local: `npm install`, `npm run dev`; para verificações: `npm run typecheck`, `npm test`, `npm run build`.

### Integração real

Importe `GraficoLinhaTransferencias` e seu TSX já carrega o CSS. Informe
`series={{ura: dadosUra, iam: dadosIam}}`, `periodo={{from, to}}`, `tema="light" | "dark"`.
A taxa `percentual` é uma **fração**, por exemplo `0.455` para `45,50%`.
Converta contratos de APIs no projeto de destino, sem alterar o gráfico.

## Origem e segurança

Fonte de comparação: [release YDUQS v1.0.0](https://github.com/Reenatin/ITV-YDUQS-DASH-URA-ALARMISTICO/releases/tag/v1.0.0)
(commit `debdaeff078cc457651a8748a52d6d4eaefb4f51`).

**Não publicar sem confirmar autorização do titular dos códigos-fonte.** O projeto não contém
segredos, endpoints, imagens de clientes nem binários de fontes, mas ausência de segredos
não equivale a autorização de redistribuição. A fonte Circular Air Pro precisa estar
licenciada/instalada no dashboard que a utilizar; esta prévia usa fallback.

O Trello controla etapas e histórico, o GitHub o código efetivamente publicado. Neste ZIP:
**apenas arquivos novos/alterados da Etapa 2; a Etapa 1 permanece inalterada em seu TSX/CSS.**
