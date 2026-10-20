# ATH do Monitoramento — gráfico de linha (funcionalidade 05)

**Objetivo:** reutilizar o gráfico de Transferência ao Humano acumulada por hora da TV YDUQS v1.0.0, com o mesmo TSX/CSS do catálogo, mas sem transportar indicadores operacionais, consultas Power BI ou regras de alarmística do cliente.

**Referência visual de origem:** release [YDUQS v1.0.0](https://github.com/Reenatin/ITV-YDUQS-DASH-URA-ALARMISTICO/releases/tag/v1.0.0), SHA `debdaeff078cc457651a8748a52d6d4eaefb4f51`. A extração desta funcionalidade **ainda não foi homologada visualmente** pelo usuário; a aprovação da release não homologa automaticamente a biblioteca.

**Páginas/indicadores:** página Monitoramento TV; gráfico “Evolução do % ATH Acumulado por Hora”, com limite visual externo (mock 45%), trechos vermelho acima do limite e madrugada agrupada em 06h pelo último acumulado válido. O KPI principal, o cálculo do acumulado e o disparo de alertas permanecem responsabilidade da integração.

**Arquivos da funcionalidade:**

- `componentes/ath-monitoramento/AthMonitoramento.tsx`: ECharts, geometrias de área/linha acima e abaixo do limite, guia de hover, tooltip, card/foco, contrato e ciclo de vida.
- `componentes/ath-monitoramento/ath-monitoramento.css`: regras visuais isoladas (cores, tema, card, foco, responsividade e estados).
- `mock/monitoramento-ath.ts`: duas amostras sintéticas com percentuais/volumes/estado já calculados, fora do componente.
- `tests/etapa5-monitoramento-ath.test.mjs`: testes de geometria, limites, dados/horas, tooltip e regressão.
- `src/App.tsx` e `src/app.css`: catálogo StackBlitz; preservam as quatro implementações anteriores.

**Estado:** Etapa 5 preparada localmente em ZIP incremental. Typecheck/build completos do usuário no Windows, publicação GitHub e homologação visual no StackBlitz são etapas **pendentes**. O mesmo ZIP contém a correção de documentação do estado homologado da Etapa 4; os TSX/CSS das funcionalidades 01–04 não foram alterados.

[Referência técnica](referencia-tecnica.md) · [Validação](validacao.md) · [Trello](https://trello.com/c/UXg3vc2A) · [GitHub](https://github.com/Reenatin/DASHBOARDS-DESIGN-SYSTEM)
