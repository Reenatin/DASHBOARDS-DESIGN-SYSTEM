# Validação — Transferências por Canal (Etapa 3)

## Comandos na raiz (PowerShell)

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

## Validação automatizada

`tests/etapa3-canais.test.mjs` verifica opções card/foco, grid/eixos, gradientes, 18px/72px, rolagem, tooltip PAN com escape e `appendTo:'body'`, conteúdo do denominador e representatividade recebida externamente, tratamento de 0/BLANK, isolamento de estilos, mock externo e preservação dos modelos já publicados. Rodar também testes de regressão das Etapas 1 e 2 (19 testes existentes).

**Resultados no ambiente de preparação:** registrar apenas resultados efetivamente executados no ZIP/ambiente. Typecheck/build integrado dependem de React/ECharts instalados no computador/StackBlitz; não declarar aprovação antes do retorno dos comandos acima.

## Homologação funcional e visual (pendente)

- Selecionar **Transferências por Canal · Etapa 3** no StackBlitz. Testar URA e IAM com o conjunto mock sintético, mantendo indicadores dos outros dois modelos inalterados.
- **Card:** barras horizontais 18px, gradiente claro→forte, scroll vertical, ranking, rótulo à direita, nome longo truncado. Comparar ao card YDUQS v1.0.0 em largura equivalente.
- **Foco:** colunas verticais 72px máximo, gradiente forte no topo, rótulos inclinados 26°, rolagem horizontal para muitos canais, modal com título/seletor/fechamento. Conferir responsividade.
- Tooltip sobre scroll/card/foco sem recorte, nome escapado, Transferidas, Recebidas, Representatividade (%) e Total transferidas da solução; sem recalcular denominadores.
- Estados: vários canais, lista vazia, todos BLANK, zero real, carregando e erro; desktop/mobile; tema claro/escuro; hover, teclado, fechamento por X/Escape/backdrop.
- Validar `npm.cmd run typecheck`, `npm.cmd test` e `npm.cmd run build` no Windows. Se houver divergência, manter Etapa 3 parcial até hotfix e nova aprovação.

## Publicação

**Estado: entrega ZIP incremental local; ainda sem commit, sem push e sem homologação visual.** Depois do push, auditar SHA, parent, mensagem, arquivos exatos e verificações CI (se configuradas). Só então registrar o SHA no Trello; checklist completo depende da homologação do usuário.
