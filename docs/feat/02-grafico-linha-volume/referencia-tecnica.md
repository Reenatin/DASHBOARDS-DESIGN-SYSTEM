# Referência técnica — Evolução do Volume

## Origem e fidelidade

Extração/consolidação dos arquivos oficiais da **tag YDUQS v1.0.0**, commit `debdaeff078cc457651a8748a52d6d4eaefb4f51`:
- `apps/web/src/visao-geral/opcoesGraficos.ts`: `coordenadasEvolucaoSolucao`, `lacunasEvolucaoSolucao`, `opcoesLinhaSolucao(..., "volume")` e `opcoesEvolucaoVolumeSolucao`.
- `apps/web/src/visao-geral/animacao-linha-marcadores.ts`: `linhaAntesDosMarcadores`, `prepararEntradaMarcadores`, `iniciarEntradaMarcadores`.
- `apps/web/src/visao-geral/representacao-sem-zeros.ts`: `compactarDiasVolume`/rótulos reais do eixo.
- `apps/web/src/visao-geral/tooltip-volume-sem-duplicacao.ts`: supressão apenas da **segunda** linha "Recebidas" no tooltip, mantendo seu valor em destaque.
- `apps/web/src/graficos/tooltip-pan.ts`, `guia-vertical-pontilhada.ts`, `components/EChart.tsx`, `components/VisaoGeralPage.tsx`, `components/FocusModal.tsx`, `apps/web/src/styles.css`.

Original usa ECharts 6, React 19 e TypeScript. TSX contém toda a geometria do gráfico, React/ECharts e o mecanismo de animação. CSS isolado preserva card 300px, canto 28px, cabeçalho 52px e foco responsivo. Não importar fonte Circular Air Pro, logo, imagem, endpoint, token ou medida DAX de cliente.

## Contrato e cálculo

```tsx
<GraficoLinhaVolume
  series={{ura: meusPontosUra, iam: meusPontosIam}}
  periodo={{from: "2026-10-11", to: "2026-10-19"}}
  tema="light"
/>
```

`PontoVolume = {ordem, rotulo, recebidas, transferidas, madrugada?, horasRegistradas?, ultimaHoraOriginal?}`.

- `ordem`: `YYYY-MM-DD-HH` (um dia) ou `YYYY-MM-DD` (vários dias); horário de 00–06h já consolidado como `-06` pelo adaptador externo, quando aplicável.
- `rotulo`: nome real da data/hora, ex.: `08h`, `15/10`, `Madrugada`.
- `recebidas`, `transferidas`: volumes inteiros já tratados pelo dashboard, ou `null` quando informação não existe. Zero real continua na entrada e não é fabricado quando falta medição.
- `periodo`: datas operacionais YYYY-MM-DD inclusivas, já provenientes do dashboard.
- `tema`: `light` ou `dark`. `origemInicial` opcional, padrão `ura`.
- `carregando` e `erro`: estados controlados pelo integrador; não são implementados fetch, polling nem regras de negócio nesta biblioteca.

### Regras da representação

**Período de um dia:** eixo X usa horas reais e os dados já recebidos, sem inventar horas. Horários intermediários ausentes são inseridos como `null` apenas na série ECharts; `connectNulls:false`. Zero explícito é omitido visualmente sem mudar o array original. Madrugada 00h–06h tem um ponto em 06h e tooltip com contagem de horários recebidos, se metadados vierem prontos.

**Vários dias:** a cópia visual inclui apenas observações com `recebidas > 0`; os slots X são compactos e o rótulo/tooltip original é preservado. A API/histórico/totais do dashboard não são modificados. Para o caso-limite de apenas um dia positivo em intervalo multi-dia, a janela visual usa dois slots para manter eixo diário, sem fabricar valor para o segundo dia; o rótulo IAM desse caso único também preserva a data original.

**Tooltip:** recebe `trigger:axis`, guia vertical pontilhada `snap:true`, contagem pt-BR e cor de fundo/borda/sombra originais. Exibe Recebidas apenas uma vez e Transferidas, sem duplicação de valor.

**Animação:** `solucao-linha` recebe a série principal de linha/área inteira com `showSymbol:false` e `animation:false`; a camada auxiliar silenciosa `solucao-marcadores-pos-linha` inicia com todos `null`; após 60ms adiciona marcadores (até ~850ms, com até 48 quadros). Novos dados, alternância URA/IAM e desmontagem cancelam timers antigos; `prefers-reduced-motion:reduce` mostra os pontos sem sequência. A legenda e o tooltip pertencem à série principal, não à auxiliar.

**UI:** mesmo modelo TSX nos dois tamanhos (card/foco), seletor URA/IAM independente do modelo Transferências, fechamento por Escape/botão/backdrop, temas, ResizeObserver e resposta à variação do contêiner. Fontes comerciais licenciadas não incluídas; fallback pode diferir levemente do original.

## Dependências e limites

`react` 19, `react-dom` 19, `echarts` 6, `typescript` 5, Vite 7; sem APIs/DAX. Dependências herdadas do `package.json` da biblioteca. `mock/volume.ts` é apenas ilustrativo.

**Estado:** a fidelidade de aparência precisa ser confirmada visualmente no StackBlitz contra a release; não há homologação prévia da extração desta funcionalidade.
