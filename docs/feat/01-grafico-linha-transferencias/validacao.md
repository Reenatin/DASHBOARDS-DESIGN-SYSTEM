# Validação — Etapa 1

## Comandos

```powershell
npm install
npm run typecheck
npm test
npm run build
npm run dev
```

## Testes de opção/contrato

`tests/etapa1.test.mjs`: IAM com linha 45%, URA sem linha, largura e marcadores,
cruzamento de limiar, BLANK e horário ausente, zero só na representação,
compactação de dias com rótulo original, formatter seguro de tooltip e CSS para
tema/foco/responsividade. Os testes podem ser executados após instalar os pacotes.

## Aceite funcional e visual manual (NÃO HOMOLOGADO)

- Abrir o mesmo TSX no StackBlitz e confirmar renderização do card.
- URA: linha turquesa, sem 45%; IAM: limite 45%, segmento vermelho acima.
- Tooltip em cada marcador, guia vertical, sem recorte nem séries artificiais.
- Foco: abrir, trocar URA/IAM, fechar por X, backdrop e tecla Escape.
- Claro e escuro; telas largas, tablet e mobile; hover e foco de teclado.
- Comparar lado a lado com a release YDUQS v1.0.0 em dimensões equivalentes;
  fonte Circular Air Pro só pode ser comparada quando licenciada e instalada.
- Confirmar permissões de redistribuição antes de qualquer push público.

## Estado

**Evidência local:** `node --test tests/etapa1.test.mjs` executado com acesso à
instalação global de TypeScript por link temporário, **7/7 testes aprovados**.
O parser TypeScript verificou os quatro arquivos TS/TSX, sem erros sintáticos.

**Limitação:** não foi possível instalar/obter React e ECharts neste ambiente.
`npm run typecheck` foi tentado e falhou com TS2307 (módulos React/ECharts e
suas declarações ausentes, além de erros derivados). Isso **não constitui**
typecheck aprovado. `npm run build` não foi executado. Os pacotes não foram
incluídos no ZIP. `npm install`, o typecheck real, o build e o teste manual
no StackBlitz continuam pendentes.

**Homologação visual pendente.** Publicação e auditoria do commit devem ser registradas separadamente no Trello.
Registrar evidências de comparação antes de concluir a etapa no Trello.
