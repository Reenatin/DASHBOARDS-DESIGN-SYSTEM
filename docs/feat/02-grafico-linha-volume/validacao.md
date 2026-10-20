# Validação — Evolução do Volume (Etapa 2)

## Comandos na raiz (PowerShell)

```powershell
npm.cmd install
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

## Validação automática

`tests/etapa2-volume.test.mjs` cobre: estilo de linha/área, 7px no card/9px no foco, ausência do limite 45% (exclusivo do outro gráfico), eixo inteiro, horas faltantes e BLANK, zero visual, compactação de dias e preservação da data original, caso-limite de único dia com volume positivo, madrugada/tooltip, Recebidas sem duplicação, entrada progressiva de pontos, cancelamento de timers e CSS de foco/tema/mobile/movimento reduzido.

**Resultado no ambiente de preparação do ZIP:** 12/12 testes sintéticos da funcionalidade 02 aprovados usando TypeScript global temporariamente vinculado. O parsing TS/TSX será conferido antes da entrega. Como React/ECharts não estão instalados neste ambiente isolado e não há conectividade externa para instalá-los, **typecheck integrado, build e preview interativa não foram executados aqui**. Execute os comandos acima no Windows/StackBlitz para conferir também a regressão de Etapa 1 (7 testes).

## Homologação manual (pendente)

- Abrir o StackBlitz e selecionar **Evolução do Volume · Etapa 2**; a aba **Transferências · Etapa 1** continua funcionando exatamente como antes.
- Alternar URA/IAM repetidas vezes durante a animação; linha/área devem aparecer prontas imediatamente, marcadores depois, sem reaproveitar pontos da solução anterior.
- Comparar contra a release YDUQS v1.0.0, no **mesmo tamanho do card**, além do modo foco, claro/escuro e mobile.
- Verificar tooltip Recebidas (uma vez), Transferidas, guia vertical pontilhada, estados de dados ausentes, zero real, rótulos e representação de madrugada.
- Testar mock **Dia** e **Vários dias**, fechamento do foco por botão, Escape e clique fora; conferir layout sem cortes.
- Capturar qualquer diferença antes de homologar. Não marcar etapa como concluída só com testes sintéticos.

## Publicação

Estado: **ZIP incremental preparado, não publicado nem homologado**. Só atualizar o estado documental após commit auditado no GitHub e validação pelo usuário. Etapa 1 publicada/homologada permanece sem modificações nos dois arquivos do seu componente.
