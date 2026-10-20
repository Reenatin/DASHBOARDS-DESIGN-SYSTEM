# Validação — ATH acumulado do Monitoramento (funcionalidade 05)

## Automática

Na raiz do projeto Windows, para reproduzir a validação:

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

`tests/etapa5-monitoramento-ath.test.mjs` cobre percentuais como fração, limite de 45% externo, cruzamentos exatos e segmentos vermelhos somente acima, área empilhada verde/vermelha, gradientes, limite tracejado, marcadores 8/12px, eixo Y em %, madrugada (último acumulado, não soma/média), lacunas, `null`/BLANK/zero, tooltip acumulado/estado externo, guia vertical pontilhada, foco, CSS claro/escuro/mobile e isolamentos dos modelos 01–04. Executar também os testes sintéticos e a regressão das quatro etapas anteriores.

Aprovação em testes sintéticos não equivale à validação TypeScript completa ou a uma homologação visual no navegador. Registre a contagem de testes, typecheck e build de fato executados em cada ambiente.

## Funcional e visual — homologado pelo usuário em 20/10/2026

- Abrir **ATH · Monitoramento · Etapa 5** no StackBlitz; conferir linha verde-água, trecho vermelho *somente acima* do limite 45%, área preenchida vermelho/verde, linha horizontal tracejada e marca vermelha acima do limiar.
- Comparar ao gráfico da release YDUQS v1.0.0, com as mesmas proporções: título, cabeçalho, eixo horário, escala %, rótulos, guia vertical pontilhada, tooltip PAN, legenda e nota de madrugada.
- Mudar de **Dia completo** para **Com lacunas**: a curva não atravessa dados ausentes/BLANK e zero explícito permanece zero. Na madrugada, `00h–06h` representa o último acumulado original; tooltip informa número de horários/último horário.
- Validar o tooltip de horário real com ATH, recebidas, transferidas, limite e situação, sem recálculo; testar casos acima/abaixo do limite, `null`, carregamento, erro e lista vazia.
- Testar tema claro/escuro, TV/desktop/mobile, foco, fechar por X/Escape/backdrop, responsividade, hover e movimento reduzido. Regressão dos modelos 1–4; não alterar os TSX/CSS anteriores.

## Publicação e conclusão

**Estado técnico/publicação:** no Windows o usuário executou `npm.cmd run typecheck` (aprovado), `npm.cmd test` (**67/67 aprovados**, dos quais 18 específicos da Etapa 5) e `npm.cmd run build` (aprovado, aviso não bloqueante de bundle >500 KB). Commit publicado e auditado na `main`: [`e67b6cf`](https://github.com/Reenatin/DASHBOARDS-DESIGN-SYSTEM/commit/e67b6cf648985aaab75f4359a7db075ae59a61e6), parent `cd08e6183f480384531725946126e7bbe1a5ae9c`, **11 arquivos** dentro do escopo autorizado; **nenhum check-run/status CI remoto** configurado. O usuário confirmou expressamente a homologação visual do ATH em 20/10/2026, após apresentar os cenários Dia completo/tema claro e Com lacunas/tema escuro. Os testes funcionais e automatizados estão descritos acima. A aprovação visual é evidência declarada pelo usuário, não execução remota de testes pelo assistente.

A publicação `e67b6cf` incluiu a **correção documental do estado da Etapa 4**, cuja implementação foi publicada e homologada em `cd08e6183f480384531725946126e7bbe1a5ae9c`. A auditoria confirmou essa atualização, sem alterações no código da Etapa 4. O item 4.6 da Etapa 4 foi concluído no Trello após publicação e auditoria documental. A Etapa 5 teve sua homologação visual aprovada pelo usuário. Esta atualização registra o estado final da funcionalidade; o item 5.6 será concluído após publicação e auditoria deste commit documental.
