# Transferências por Canal — Gráfico de Barras (funcionalidade 03)

**Objetivo:** disponibilizar o modelo visual originalmente homologado na Visão Geral YDUQS v1.0.0 para uso em múltiplos dashboards sem redesenhar o gráfico ou transportar dados e regras de cliente.

**Entrega do piloto:** card com ranking de canais em barras horizontais, rolagem vertical e seletor independente URA/IAM; modo foco com colunas e rolagem horizontal; tooltip PAN renderizado no `body`; temas claro/escuro, responsividade e estados vazios/carregando/erro. Dados demonstrativos totalmente externos ao componente.

**Estado:** versão inicial da Etapa 3 publicada em `3cfe356c9f15a94f2ffda890448f15e8daf29588`. Testes integrados e build aprovados no Windows (33/33). Após comparação no StackBlitz, ajustes de tema escuro no gradiente e nas barras de rolagem foram solicitados; o hotfix precisa de validação técnica e **homologação visual do usuário**; sua publicação é auditada no GitHub e registrada no Trello. Etapas 1 e 2 permanecem aprovadas e preservadas.

**Arquivos:**
- `componentes/transferencias-por-canal/TransferenciasPorCanal.tsx`: implementação React/ECharts, interação, tooltip, foco e opções horizontais/verticais.
- `componentes/transferencias-por-canal/transferencias-por-canal.css`: recorte isolado de estilo, inclusive temas e breakpoint.
- `mock/canais.ts`: mock sintético por solução, não importado no gráfico.
- `tests/etapa3-canais.test.mjs`: testes de opções, contrato, tooltip, rolagem e isolamento.
- `src/App.tsx` e `src/app.css`: seleção do terceiro modelo na demonstração.

**Referência homologada:** [YDUQS v1.0.0](https://github.com/Reenatin/ITV-YDUQS-DASH-URA-ALARMISTICO/releases/tag/v1.0.0) — commit `debdaeff078cc457651a8748a52d6d4eaefb4f51`.

**Biblioteca:** https://github.com/Reenatin/DASHBOARDS-DESIGN-SYSTEM. Planejamento e histórico no [card do Trello](https://trello.com/c/UXg3vc2A).

Ver [referencia-tecnica.md](referencia-tecnica.md) e [validacao.md](validacao.md).
