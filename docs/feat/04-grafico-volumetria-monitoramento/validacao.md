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

**Evidência Windows (20/10/2026):** `npm.cmd run typecheck` aprovado, `npm.cmd test` **49/49 aprovados** (incluindo 14 testes da funcionalidade 04) e `npm.cmd run build` concluído. Publicado no GitHub no commit `cd08e6183f480384531725946126e7bbe1a5ae9c`, auditado com parent `75f8b36f6aacc13f621d6921c0a507abeed146f3` e exatamente 10 arquivos previstos; sem CI/status checks remotos.

## Funcional e visual — homologado pelo usuário em 20/10/2026

- Comparar com a release YDUQS v1.0.0 usando largura semelhante à área do gráfico de Monitoramento, inclusive no card e foco (gráfico isolado; não replica KPI/alerta do card completo).
- Validar curva verde-água, preenchimento, espessura, eixos, guia vertical tracejada, tooltip completo e hover nos marcadores.
- Testar **Dia completo** e **Com lacunas**: não unir 08h e 10h se 09h estiver ausente; BLANK não se transforma em zero.
- Conferir marcador e tooltip "Madrugada (00h–06h)", soma visual de horas retornadas, horário final e contagem.
- Verificar tema claro/escuro, responsividade TV e mobile, modo foco, Escape/backdrop, carregando/erro/sem dados.
- Regressão breve de Transferências (Etapa 1), Evolução do Volume (Etapa 2) e Transferências por Canal (Etapa 3), incluindo hotfix de scrollbar/gradiente dark.

## Publicação e conclusão

**Etapa 4:** testes, publicação auditada e homologação visual foram concluídos. O usuário confirmou os quatro critérios: cenário com lacunas/BLANK, aparência nos dois temas, modo foco e hover com tooltip e guia pontilhada, em claro/escuro. A pendência do item 4.6 é somente publicar esta atualização documental e auditar seu novo commit. O histórico e os registros de decisão permanecem no Trello. **Esta documentação corrigida ainda integra o ZIP local da Etapa 5, não o GitHub até o próximo push.**
