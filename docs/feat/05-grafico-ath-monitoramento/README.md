# ATH do Monitoramento — gráfico de linha (funcionalidade 05)

**Objetivo:** reutilizar o gráfico de Transferência ao Humano acumulada por hora da TV YDUQS v1.0.0, com o mesmo TSX/CSS do catálogo, mas sem transportar indicadores operacionais, consultas Power BI ou regras de alarmística do cliente.

**Referência visual de origem:** release [YDUQS v1.0.0](https://github.com/Reenatin/ITV-YDUQS-DASH-URA-ALARMISTICO/releases/tag/v1.0.0), SHA `debdaeff078cc457651a8748a52d6d4eaefb4f51`. A extração desta funcionalidade **já foi publicada** no Design System. O usuário avaliou como aparentemente correta a prévia de Dia completo no tema claro; a homologação visual integral da biblioteca ainda precisa ser confirmada nos demais estados, foco, hover e tema escuro.

**Páginas/indicadores:** página Monitoramento TV; gráfico “Evolução do % ATH Acumulado por Hora”, com limite visual externo (mock 45%), trechos vermelho acima do limite e madrugada agrupada em 06h pelo último acumulado válido. O KPI principal, o cálculo do acumulado e o disparo de alertas permanecem responsabilidade da integração.

**Arquivos da funcionalidade:**

- `componentes/ath-monitoramento/AthMonitoramento.tsx`: ECharts, geometrias de área/linha acima e abaixo do limite, guia de hover, tooltip, card/foco, contrato e ciclo de vida.
- `componentes/ath-monitoramento/ath-monitoramento.css`: regras visuais isoladas (cores, tema, card, foco, responsividade e estados).
- `mock/monitoramento-ath.ts`: duas amostras sintéticas com percentuais/volumes/estado já calculados, fora do componente.
- `tests/etapa5-monitoramento-ath.test.mjs`: testes de geometria, limites, dados/horas, tooltip e regressão.
- `src/App.tsx` e `src/app.css`: catálogo StackBlitz; preservam as quatro implementações anteriores.

**Estado:** Etapa 5 publicada e auditada em [`e67b6cf`](https://github.com/Reenatin/DASHBOARDS-DESIGN-SYSTEM/commit/e67b6cf648985aaab75f4359a7db075ae59a61e6) (parent `cd08e6183f480384531725946126e7bbe1a5ae9c`). O usuário executou no Windows typecheck, **67/67 testes** (18 específicos do ATH) e build com sucesso; não há CI remoto configurado. A publicação incluiu a atualização documental da Etapa 4 e preservou os TSX/CSS das funcionalidades 01–04. **Homologação visual integral pendente:** confirmar tema escuro, modo foco, hover/tooltip, guia vertical, cenários com lacunas e responsividade antes de fechar a Etapa 5.

[Referência técnica](referencia-tecnica.md) · [Validação](validacao.md) · [Trello](https://trello.com/c/UXg3vc2A) · [GitHub](https://github.com/Reenatin/DASHBOARDS-DESIGN-SYSTEM)
