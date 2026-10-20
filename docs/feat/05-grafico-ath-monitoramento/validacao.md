# Validação — ATH acumulado do Monitoramento (funcionalidade 05)

## Automática

Na raiz do projeto, após aplicar o incremento no Windows:

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

`tests/etapa5-monitoramento-ath.test.mjs` cobre percentuais como fração, limite de 45% externo, cruzamentos exatos e segmentos vermelhos somente acima, área empilhada verde/vermelha, gradientes, limite tracejado, marcadores 8/12px, eixo Y em %, madrugada (último acumulado, não soma/média), lacunas, `null`/BLANK/zero, tooltip acumulado/estado externo, guia vertical pontilhada, foco, CSS claro/escuro/mobile e isolamentos dos modelos 01–04. Executar também os testes sintéticos e a regressão das quatro etapas anteriores.

Aprovação em testes sintéticos não equivale à validação TypeScript completa ou a uma homologação visual no navegador. Registre a contagem de testes, typecheck e build de fato executados em cada ambiente.

## Funcional e visual — homologação do usuário pendente

- Abrir **ATH · Monitoramento · Etapa 5** no StackBlitz; conferir linha verde-água, trecho vermelho *somente acima* do limite 45%, área preenchida vermelho/verde, linha horizontal tracejada e marca vermelha acima do limiar.
- Comparar ao gráfico da release YDUQS v1.0.0, com as mesmas proporções: título, cabeçalho, eixo horário, escala %, rótulos, guia vertical pontilhada, tooltip PAN, legenda e nota de madrugada.
- Mudar de **Dia completo** para **Com lacunas**: a curva não atravessa dados ausentes/BLANK e zero explícito permanece zero. Na madrugada, `00h–06h` representa o último acumulado original; tooltip informa número de horários/último horário.
- Validar o tooltip de horário real com ATH, recebidas, transferidas, limite e situação, sem recálculo; testar casos acima/abaixo do limite, `null`, carregamento, erro e lista vazia.
- Testar tema claro/escuro, TV/desktop/mobile, foco, fechar por X/Escape/backdrop, responsividade, hover e movimento reduzido. Regressão dos modelos 1–4; não alterar os TSX/CSS anteriores.

## Publicação e conclusão

**Estado atual desta entrega: incremento ZIP local, sem commit/push.** Typecheck/build integrados e homologação visual do usuário precisam ser confirmados após aplicação. Após autorização do push, auditar SHA, parent, mensagem, arquivos e CI (caso existente); atualizar Trello e checklist somente com evidências compatíveis.

O pacote inclui também a **correção documental do estado da Etapa 4**, publicada e homologada em `cd08e6183f480384531725946126e7bbe1a5ae9c`. O item 4.6 só poderá ser concluído após a atualização documental estar publicada e auditada. Nenhuma alteração de código da Etapa 4 deve acompanhar essa correção.
