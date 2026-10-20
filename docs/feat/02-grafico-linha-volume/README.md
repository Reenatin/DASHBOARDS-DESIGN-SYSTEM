# Evolução do Volume — Gráfico de Linha (funcionalidade 02)

**Objetivo:** disponibilizar o gráfico Evolução do Volume da Visão Geral em modelo reutilizável React/TypeScript, mantendo linha/área prontas antes da entrada dos marcadores, tooltip original, guia vertical, URA/IAM, tema e foco.

**Estado desta entrega:** ZIP incremental preparado localmente; publicação, build com dependências e homologação visual no StackBlitz ainda **pendentes**. Não confundir com a Etapa 1, já publicada e homologada.

**Páginas/indicadores de referência:** Visão Geral; Evolução do Volume por solução URA/IAM, unidade chamadas recebidas (inteiro). O agrupamento de madrugada é recebido por props, não calculado pelo gráfico.

**Arquivos da funcionalidade:**
- `componentes/grafico-linha-volume/GraficoLinhaVolume.tsx`: componente principal, opções ECharts e animação sequencial original.
- `componentes/grafico-linha-volume/grafico-linha-volume.css`: aparência, tema, foco e responsividade isolados.
- `mock/volume.ts`: dados sintéticos apenas para a prévia.
- `tests/etapa2-volume.test.mjs`: testes sintéticos.
- `src/App.tsx` e `src/app.css`: seleção visual do catálogo sem alterar o gráfico homologado da Etapa 1.

**Referências:** [tag original v1.0.0](https://github.com/Reenatin/ITV-YDUQS-DASH-URA-ALARMISTICO/releases/tag/v1.0.0), commit `debdaeff078cc457651a8748a52d6d4eaefb4f51`. GitHub de destino: https://github.com/Reenatin/DASHBOARDS-DESIGN-SYSTEM. Planejamento e histórico no card Trello https://trello.com/c/UXg3vc2A.

Consulte [referencia-tecnica.md](referencia-tecnica.md) e [validacao.md](validacao.md).
