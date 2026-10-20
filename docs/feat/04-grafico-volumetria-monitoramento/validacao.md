# Validação — Volumetria do Monitoramento (funcionalidade 04)

## Automática

Na raiz do projeto Windows/StackBlitz:

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

Testes específicos em `tests/etapa4-monitoramento-volume.test.mjs` cobrem: geometria original, 3.5px/suavização, marca 8/12px, gradientes e temas, somatória visual de madrugada, horário original, BLANK, zero explícito, lacunas, tooltip com métricas externas, referência H-3, texto sem referência, guia vertical, isolamento CSS e preservação dos três gráficos homologados.

**Estado do ZIP:** testes sintéticos e análise sintática no ambiente de preparação; só registrar contagem realmente executada. Typecheck/build completos dependem das dependências React/ECharts do Windows/StackBlitz; não declarar aprovados até receber a saída do usuário. Nada publicado no GitHub neste incremento local.

## Funcional e visual — requer homologação do usuário

- Comparar com a release YDUQS v1.0.0 usando largura semelhante à área do gráfico de Monitoramento, inclusive no card e foco (gráfico isolado; não replica KPI/alerta do card completo).
- Validar curva verde-água, preenchimento, espessura, eixos, guia vertical tracejada, tooltip completo e hover nos marcadores.
- Testar **Dia completo** e **Com lacunas**: não unir 08h e 10h se 09h estiver ausente; BLANK não se transforma em zero.
- Conferir marcador e tooltip "Madrugada (00h–06h)", soma visual de horas retornadas, horário final e contagem.
- Verificar tema claro/escuro, responsividade TV e mobile, modo foco, Escape/backdrop, carregando/erro/sem dados.
- Regressão breve de Transferências (Etapa 1), Evolução do Volume (Etapa 2) e Transferências por Canal (Etapa 3), incluindo hotfix de scrollbar/gradiente dark.

## Publicação e conclusão

Etapa 4 permanece **parcial** enquanto typecheck, build, publicação auditada e homologação visual não forem concluídos. Após push, auditar SHA/parent, arquivos e checks; registrar uma vez no card correto e só então marcar checklist com evidência. Não iniciar Etapa 5 automaticamente.
