# Volumetria do Monitoramento — gráfico de linha (funcionalidade 04)

**Objetivo:** tornar reutilizável o gráfico horário de chamadas recebidas da página Monitoramento (TV), com o TSX e CSS reais e dados preparados externamente, sem replicar regras de alarmística do cliente.

**Referência homologada de origem:** YDUQS v1.0.0, commit `debdaeff078cc457651a8748a52d6d4eaefb4f51`. A extração da biblioteca **ainda exige homologação visual própria** no StackBlitz.

**Páginas e indicadores:** Monitoramento TV; gráfico "Evolução de Chamadas por Hora", com agrupamento visual da Madrugada (00h–06h). KPI do volume total, regra H-3/H-2/H-1, limiares/alertas e seleção de fontes são responsabilidades do dashboard integrador, não do gráfico.

**Arquivos:**
- `componentes/volumetria-monitoramento/VolumetriaMonitoramento.tsx`: geometria ECharts, curva, pontos, tooltip, guia, resize, foco e contrato;
- `componentes/volumetria-monitoramento/volumetria-monitoramento.css`: recorte de aparência PAN/YDUQS com escopo independente, claro/escuro e responsividade;
- `mock/monitoramento-volume.ts`: amostras fictícias de dia completo e com lacunas, usadas apenas no StackBlitz;
- `tests/etapa4-monitoramento-volume.test.mjs`: testes isolados e de regressão;
- `src/App.tsx` e `src/app.css`: opção da Etapa 4 no catálogo; não substitui os outros três gráficos.

**Estado desta entrega:** incremento local em preparação para publicação; typecheck/build integrados e homologação visual pendentes de execução pelo usuário antes do commit. A publicação não altera os componentes homologados 01–03.

[Referência técnica](referencia-tecnica.md) · [Validação](validacao.md) · [Planejamento Trello](https://trello.com/c/UXg3vc2A) · [GitHub](https://github.com/Reenatin/DASHBOARDS-DESIGN-SYSTEM)
