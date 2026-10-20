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

**Etapa 3 inicial:** usuário executou no Windows `npm.cmd run typecheck` (sem erros), `npm.cmd test` (**33/33 aprovados**) e `npm.cmd run build` (aprovado). Commit `3cfe356c9f15a94f2ffda890448f15e8daf29588` auditado, com dez arquivos da Etapa 3, sem CI remoto.

**Hotfix visual:** após aplicar o incremento, repetir as três validações. Dois testes específicos conferem o contraste e a direção do gradiente escuro no card/foco, bem como o tema escuro das barras de rolagem vertical/horizontal em Firefox/WebKit. Esta entrega local não comprova a renderização visual no StackBlitz nem substitui sua homologação.

## Homologação funcional e visual (pendente do hotfix)

- Verificar **tema escuro**: contraste nítido entre extremos do gradiente no card e foco; barras de rolagem com trilho/indicador escuros nos dois modos. Confirmar que o tema claro não mudou.
- Selecionar **Transferências por Canal · Etapa 3** no StackBlitz. Testar URA e IAM com o conjunto mock sintético, mantendo indicadores dos outros dois modelos inalterados.
- **Card:** barras horizontais 18px, gradiente claro→forte, scroll vertical, ranking, rótulo à direita, nome longo truncado. Comparar ao card YDUQS v1.0.0 em largura equivalente.
- **Foco:** colunas verticais 72px máximo, gradiente forte no topo, rótulos inclinados 26°, rolagem horizontal para muitos canais, modal com título/seletor/fechamento. Conferir responsividade.
- Tooltip sobre scroll/card/foco sem recorte, nome escapado, Transferidas, Recebidas, Representatividade (%) e Total transferidas da solução; sem recalcular denominadores.
- Estados: vários canais, lista vazia, todos BLANK, zero real, carregando e erro; desktop/mobile; tema claro/escuro; hover, teclado, fechamento por X/Escape/backdrop.
- Validar `npm.cmd run typecheck`, `npm.cmd test` e `npm.cmd run build` no Windows. Se houver divergência, manter Etapa 3 parcial até hotfix e nova aprovação.

## Publicação

**Estado:** Etapa 3 inicial publicada em `3cfe356`; o hotfix de tema escuro exige testes completos, auditoria de qualquer novo SHA publicado e homologação visual do usuário. Registrar publicação e aprovação no Trello com as respectivas evidências; não concluir o checklist antecipadamente.
