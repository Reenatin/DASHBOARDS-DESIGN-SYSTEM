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

## Modelo 02 — Etapa 2 (publicado e homologado em 20/10/2026)

`componentes/grafico-linha-volume/` reúne um TSX e CSS do gráfico **Evolução do Volume URA/IAM**. Animação preservada: a linha/área surge inteira e os marcadores aparecem depois, com cancelamento em alternâncias rápidas. Tooltip original sem linha Recebidas duplicada, guia pontilhada, foco, claro/escuro e responsividade.

A prévia React oferece seletor de modelo; na Etapa 2 também alterna o mock **Dia / Vários dias**. Dados de demonstração em `mock/volume.ts`, nunca dentro do gráfico. Consulte a [referência técnica](docs/feat/02-grafico-linha-volume/referencia-tecnica.md).

### Visualização no StackBlitz

O repositório público é acessível no [StackBlitz](https://stackblitz.com/github/Reenatin/DASHBOARDS-DESIGN-SYSTEM). **Os cinco modelos estão publicados**. As Etapas 1–4 foram homologadas pelo usuário; a Etapa 5 está publicada, com validação visual inicial no tema claro e homologação integral ainda pendente.
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

O Trello controla etapas e histórico, o GitHub o código efetivamente publicado.
Os hotfixes visuais da Etapa 3 são documentados no Trello; os TSX/CSS das Etapas 1 e 2 permanecem intactos.

## Modelo 03 — Etapa 3 (publicado e homologado, inclusive hotfix de tema escuro)

`componentes/transferencias-por-canal/` adiciona o modelo **Transferências por Canal**
com o código TSX/ECharts e CSS isolados da release YDUQS v1.0.0. O card tem barras
horizontais de 18px e rolagem vertical; o foco apresenta colunas e rolagem
horizontal. O tooltip HTML usa `appendTo: "body"` para não ser recortado.
O hotfix desta etapa intensifica o gradiente no tema escuro (card e foco) e aplica rolagem escura nos dois contêineres, sem mudar dados ou o tema claro.
O seletor URA/IAM e os temas são independentes dos gráficos anteriores.

O componente recebe por `series` um ranking por solução e o total transferido
naquela solução; `participacao` já deve estar calculada como fração pelo adaptador
externo. `mock/canais.ts` é apenas dado fictício. Consulte
[docs/feat/03-transferencias-por-canal/](docs/feat/03-transferencias-por-canal/README.md).
**Etapas 1 e 2 permanecem publicadas e homologadas, sem alterações em seus TSX/CSS.**

## Modelo 04 — Etapa 4 (publicado e homologado em 20/10/2026)

`componentes/volumetria-monitoramento/` reúne **VolumetriaMonitoramento.tsx** e CSS próprios, extraídos do gráfico de linha do Monitoramento YDUQS v1.0.0. A série usa suavização 0,23, gradiente, marcadores 8px/12px na madrugada, guia vertical pontilhada e tooltips com contexto já preparado externamente. O agrupamento visual de 00h–06h soma somente horas válidas, respeita BLANK e não modifica a fonte. O piloto demonstra um dia normal e outro com lacunas via `mock/monitoramento-volume.ts`, sem API, cálculo H-3 ou alarmística.

O próprio TSX abre foco e possui escopos CSS claros/escuros. A Etapa 4 foi publicada no commit `cd08e6183f480384531725946126e7bbe1a5ae9c` e homologada pelo usuário nos temas claro/escuro, card/foco, tooltip/guia e lacunas. Testes 49/49, typecheck e build foram aprovados no Windows. Etapas 1–3 permaneceram intactas em seus TSX/CSS. [Documentação](docs/feat/04-grafico-volumetria-monitoramento/README.md).


## Modelo 05 — Etapa 5 (publicado; homologação visual integral pendente)

`componentes/ath-monitoramento/` contém `AthMonitoramento.tsx` e CSS isolado do gráfico **ATH acumulado por hora** da TV YDUQS v1.0.0: área azul até o limite visual recebido, excesso vermelho acima de 45% no mock, linha segmentada exatamente no cruzamento, marcador 8px (12px na madrugada), limite tracejado, tooltip PAN com acumulados e situação já calculados, guia pontilhada, foco, temas claro/escuro e estados vazios. A madrugada é representada pelo **último acumulado válido recebido até 06h** e não é uma média nem soma de percentuais.

A fonte de dados e o limite diário são propriedades externas: `pontos: HoraAth[]`, `limiteDiario: number` como fração (mock `0.45`), `tema`, `carregando`/`erro`. Não há chamadas ao Power BI, cálculos de alarmística nem dados reais de cliente. A demo usa `mock/monitoramento-ath.ts` com **Dia completo** e **Com lacunas**. [Documentação da funcionalidade 05](docs/feat/05-grafico-ath-monitoramento/README.md).

**Publicação auditada:** a Etapa 5 e a atualização documental da Etapa 4 foram publicadas na `main` no commit [`e67b6cf`](https://github.com/Reenatin/DASHBOARDS-DESIGN-SYSTEM/commit/e67b6cf648985aaab75f4359a7db075ae59a61e6) (parent `cd08e6183f480384531725946126e7bbe1a5ae9c`), com 11 arquivos previstos, typecheck, 67/67 testes e build aprovados no Windows; sem checks remotos configurados. Não houve alteração nos TSX/CSS homologados das Etapas 1–4. A homologação visual integral da Etapa 5 ainda depende da confirmação do usuário para tema escuro, foco, hover e lacunas.
