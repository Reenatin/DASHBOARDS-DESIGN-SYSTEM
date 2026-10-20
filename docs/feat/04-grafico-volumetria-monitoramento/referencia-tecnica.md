# Referência técnica — Volumetria do Monitoramento

## Fontes oficiais e preservação visual

Origem auditada na tag YDUQS **v1.0.0** (`debdaeff078cc457651a8748a52d6d4eaefb4f51`):
- `apps/web/src/monitoramento/opcoesGraficos.ts`: `pontosDoGrafico`, configuração `opcoesMonitoramento(dados, "volume", escuro)`, área, suavização, grade, eixos e tooltip;
- `apps/web/src/monitoramento/series.ts`: `compactarMadrugada(...,"somar")`, `agruparPontosConsecutivos`, sem preenchimento artificial de horas;
- `apps/web/src/components/MonitoramentoChart.tsx`, `components/EChart.tsx`: inclusão da guia vertical, renderização React/ECharts, ResizeObserver e dispose;
- `apps/web/src/graficos/tooltip-pan.ts` e `guia-vertical-pontilhada.ts`: aparência do tooltip PAN e eixo vertical tracejado;
- `apps/web/src/components/MonitoramentoCard.tsx`, `MonitoramentoFocusModal.tsx`, `FocusModal.tsx` e `apps/web/src/styles.css`: cabeçalho, corpo do gráfico, foco, temas e responsividade.

O gráfico reutilizável mantém `smooth: .23`, `smoothMonotone: "x"`, espessura de linha `3.5px`, gradiente vertical #01ABBD, marcador 8px (12px na madrugada), eixos por hora e grid 52/18/22/45. A guia vertical tracejada segue o mesmo estilo do original. Foco abre o mesmo TSX, em tamanho ampliado. **A moldura de demonstração é do gráfico isolado; o card de KPI/alertas da TV não foi incorporado**, pois contém regras de operação específicas do cliente.

## Contrato mínimo de entrada

```tsx
<VolumetriaMonitoramento
  pontos={meusPontosHorarios}
  tema="light"
  titulo="Evolução de Chamadas por Hora"
/>
```

`HoraVolumetria`: `{hourCode, recebidas, horasReferencia, mediaTresHorasAnteriores, variacao, estado}`.
- `hourCode`: hora operacional inteira de 0 a 23; a fonte mantém sua data e timezone. Um item é uma hora realmente retornada.
- `recebidas`: contagem conhecida ou `null` (BLANK). `0` é dado válido; horas que não chegam não são inventadas.
- `horasReferencia`: horas já definidas pelo motor oficial. `mediaTresHorasAnteriores` é média calculada fora do componente ou `null`.
- `variacao`: fração (ex.: `-0.17` = `-17,00%`), não percentual já multiplicado por 100.
- `estado`: `normal | alerta | sem-referencia | indisponivel`, proveniente da camada de negócio; o gráfico apenas exibe o texto.
- `tema`: `light | dark`, `carregando` e `erro` opcionais; não consulta API nem recalcula média/alerta.

## Regras visuais e estados

**Madrugada:** a representação visual agrupa somente horas **retornadas** entre 00 e 06h em ponto 06h. Soma os valores quando **todos os registros recebidos** são válidos; caso algum seja BLANK, o ponto agrupado será BLANK. O tooltip indica total somado, quantidade de horários e último horário original. O gráfico não cria horas 00–06 ausentes; a origem calcula os dados de negócio fora da biblioteca.

**Sem lacunas artificiais:** a curva de área é composta apenas de grupos com horas consecutivas e valores válidos (`connectNulls` não necessário para a série auxiliar). Quando há um horário ausente ou BLANK, não conecta as partes. A série de marcadores inclui somente horas efetivamente recebidas, sem converter BLANK para 0. Zero explícito continua 0.

**Tooltip:** PAN com fundo, borda, sombra, raio 20px, tipografia do tema; contém volume, três horas anteriores, média, variação e situação pré-calculadas. Na madrugada, exibe a soma visual e aviso de que não equivale a um intervalo único. O trigger `axis` usa guia vertical pontilhada de 1.2px e a informação da série `pontos-reais` para não duplicar tooltip.

**Interações:** hover e foco com fechamento por X, Escape e backdrop; CSS isolado, claro/escuro, desktop/mobile, respeito à preferência de movimento reduzido, resize e descarte de ECharts. A preview não carrega fontes comerciais, logo, endpoints ou documentos de clientes.

## Restrições e dependências

React 19, TypeScript 5, ECharts 6 e Vite 7 no catálogo. Para transportar para outro cliente, substituir somente a fonte/adaptador de `pontos`, respeitando unidades, estados e horas reais. O componente **não** executa polling, Power BI, cálculo H-3, alerta por queda de volumetria, ou agregação de KPI. A validação visual depende do StackBlitz e dos testes de regressão dos modelos 1–3.
