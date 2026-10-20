# Referência técnica — ATH acumulado do Monitoramento (funcionalidade 05)

## Origem e paridade visual

Fonte oficial de comparação: [YDUQS v1.0.0](https://github.com/Reenatin/ITV-YDUQS-DASH-URA-ALARMISTICO/releases/tag/v1.0.0), commit `debdaeff078cc457651a8748a52d6d4eaefb4f51`:

- `apps/web/src/monitoramento/opcoesGraficos.ts`: `opcoesMonitoramento(...,"ath")`, gradientes, linhas, marcador de limite, tooltip e escala.
- `apps/web/src/monitoramento/series.ts`: `compactarMadrugada(...,"acumulado")`, `agruparPontosConsecutivos`, `dividirLinhaEmTrechos`, `faixasDeAreaAth`.
- `apps/web/src/components/MonitoramentoChart.tsx` e `EChart.tsx`: guia vertical, montagem, resize/descarte do ECharts.
- `apps/web/src/components/MonitoramentoCard.tsx` / `MonitoramentoFocusModal.tsx`, `styles.css`: cabeçalho, rótulo do limite, legendas, card/foco e tema.
- `apps/web/src/graficos/{tooltip-pan,guia-vertical-pontilhada}.ts`: geometria do tooltip e ponteiro vertical tracejado.

O código consolidado em `AthMonitoramento.tsx` isola **apenas a visualização do gráfico**. A página original mantém três cards em linha conforme sua responsividade; a prévia da biblioteca apresenta um gráfico isolado. A área de KPI e o motor de alarmes do painel original NÃO são copiados nem substituídos.

**Série e limite:** percentuais vêm como fração e são multiplicados por 100 somente para apresentação. A linha do limite é horizontal tracejada (largura 1,5); exemplos usam `0.45` externo = 45%. Linha de 3,5px verde-água `#01ABBD` até o limite; vermelha `#DF4149` exclusivamente na parte acima, recortada exatamente na interseção. A área da taxa usa duas camadas empilhadas: base verde-água até o limite e excesso vermelho somente acima; gradientes diferentes por tema, sem introduzir dado operacional. Curva sem suavização (valor `smooth:0`, segundo fonte ATH); marcadores circulares 8px (12px na madrugada), coloridos segundo comparação visual com o limite, bordas originais.

**Eixos:** X numérico com horas operacionais `00h–23h`; quando existir madrugada agrupada, o ponto visual está em `06h` com rótulo **Madrugada**. Eixo Y percentual de 0 até o teto adaptativo original, mínimo 60%, máximo 100%, incluindo o limite. Grade pontilhada. Guia vertical 1,2px tracejada em `axisPointer`, `tooltip.trigger='axis'`, filtrando a série `pontos-reais` e ignorando áreas/trechos silenciosos.

**Madrugada 00h–06h:** agrupar apenas horas realmente retornadas, exibindo como um ponto na posição 06h; o valor é a **última taxa acumulada original** do bloco, e SOMENTE se todas as taxas retornadas forem válidas. Havendo `null`/BLANK, o ponto visual é nulo. Horas ausentes não são inventadas; não se faz média nem soma de percentuais. O tooltip mostra quantos horários retornaram, última hora original e informa que não é leitura de intervalo único. Todos os registros originais são preservados.

**Lacunas, zeros e ausência:** `null` representa valor indisponível; `0` é taxa conhecida zero. Horário não retornado não vira zero; linha e preenchimento são segmentados somente entre horas contíguas válidas. O HTML do tooltip usa exclusivamente números e estados predefinidos; o título React passa pelo escape nativo da renderização JSX.

**Tooltip:** estilo PAN (raio 20px, padding 11/14, tema, sombras). Por hora exibe **ATH acumulado**, **Recebidas acumuladas**, **Transferidas acumuladas**, **Limite diário** e **Situação**. Taxas, contagens acumuladas e estado (`normal`, `alerta`, `indisponivel`) vêm da fonte: **não há cálculo de alarmes, divisão de numerador/denominador nem decisão de referência/limite pelo gráfico**.

## Contrato React

```tsx
import {AthMonitoramento} from "./componentes/ath-monitoramento/AthMonitoramento";

<AthMonitoramento
  pontos={pontosDaApi}
  limiteDiario={0.45}
  tema="dark"
  titulo="Evolução do % ATH Acumulado por Hora"
/>
```

`HoraAth = { hourCode: number; percentualAcumulado: number | null; recebidasAcumuladas: number | null; transferidasAcumuladas: number | null; estado: 'normal' | 'alerta' | 'indisponivel' }`. `limiteDiario:number` é **fração recebida do integrador** (valor demonstrativo 0.45). `tema` é `light | dark`; `carregando` e `erro` opcionais. `pontos` deve conter observações horárias reais na data operacional apropriada à fonte. A ordenação de entrada não é alterada.

`mock/monitoramento-ath.ts` prepara dados externos para **Dia completo** e **Com lacunas**; esses dados não são importados no componente, não representam informação real da YDUQS e não podem fundamentar conclusões operacionais.

## Interações e dependências

Mesmo gráfico no card/foco; foco fecha por botão, Escape e backdrop; preserva acessibilidade de botão e retorno de foco, `ResizeObserver` e descarte de instância, claro/escuro e mobile. Estados: carregando, erro, sem horários, taxa zero, BLANK e sem referência de valor nulo. `prefers-reduced-motion` desativa transições decorativas.

Dependências de demonstração: React 19, TypeScript 5, ECharts 6 e Vite 7. Os binários da fonte **Circular Air Pro** não são distribuídos. Adaptadores de API, autenticação, polling, DAX, acumulados e alerta ATH não pertencem ao gráfico.
