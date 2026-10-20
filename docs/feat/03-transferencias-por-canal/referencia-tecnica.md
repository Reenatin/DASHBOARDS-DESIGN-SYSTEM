# Referência técnica — Transferências por Canal

## Fonte e comportamento visual

A implementação principal consolida as opções visuais publicadas na tag **YDUQS v1.0.0**, commit `debdaeff078cc457651a8748a52d6d4eaefb4f51`:

- `apps/web/src/transferencias-por-canal/opcoesGraficos.ts` — `opcoesTransferenciasPorCanal`, `tooltipCanal`; as geometrias diferem intencionalmente entre card e foco.
- `apps/web/src/components/TransferenciasPorCanalPage.tsx` — `GraficoCanal` e `TransferenciasPorCanalCard`; tratamento de vazio, scroll, card e ações.
- `apps/web/src/components/EChart.tsx` — inicialização ECharts, ResizeObserver e descarte da instância.
- `apps/web/src/components/FocusModal.tsx` — foco, fechamento, teclado e título.
- `apps/web/src/graficos/tooltip-pan.ts` e `apps/web/src/visao-geral/opcoesGraficos.ts` — tooltip e escape HTML.
- `apps/web/src/styles.css` — card PAN (300px, raio 28px, padding 18/22/16), cabeçalho 52px, seletor, foco, rolagem e temas.

**Card:** barras de 18px, gradiente da esquerda (claro) para a direita (forte), extremidade direita arredondada, eixo categórico invertido, rótulo do valor à direita, labels do canal truncadas em 98px, ordenação recebida sem recalcular. Contêiner com `overflow-y:auto` e altura de conteúdo `max(170, canais * 37 + 8)`.

**Foco:** colunas com largura máxima 72px, gradiente vertical forte em cima, eixo X inclinado 26° e rótulos truncados após 22 caracteres, barra com cantos superiores 9px. Gráfico rola horizontalmente, largura mínima `max(640, canais * 82)`; o modal adapta a 97vw / 94vh até 1540x840.

**Hotfix visual da Etapa 3 (tema escuro):** nas barras horizontais, gradiente da esquerda em `#84DCE5` para `#01ABBD` à direita; nas colunas do foco, `#01ABBD` no topo para `#84DCE5` na base. Tema claro continua com `#BDEEF2`/`#01ABBD` e orientação original. Os contêineres `.ds-tc-card-scroll` e `.ds-tc-foco-scroll` recebem trilho `#1B2C42` e polegar `#627F96` **somente quando `data-theme="dark"`**, com `scrollbar-color`/`color-scheme` e fallback `::-webkit-scrollbar`; sentidos, espessura das barras, valores e ordenação não mudam. Não altera o CSS de outros modelos.

**Tooltip:** PAN (raio 20px, padding 11/14, sombras originais), `renderMode:'html'`, `appendTo:'body'` e `confine:false`; não é cortado pela rolagem. Exibe nome escapado, transferidas, recebidas, representatividade e denominador da solução. Tema claro/escuro mantém contraste. ECharts 6 / React 19, sem imagem, logo ou fonte comercial embutida.

## Contrato externo

```tsx
<TransferenciasPorCanal
  tema="light"
  series={{
    ura: { ranking: canaisUra, totalTransferidas: totalUra },
    iam: { ranking: canaisIam, totalTransferidas: totalIam },
  }}
/>
```

`LinhaTransferenciaCanal = { canal: string, recebidas: number | null, transferidas: number | null, participacao: number | null }`.

- **`transferidas` / `recebidas`** são contagens (unidade: chamadas). `null` = sem medição; `0` = volume conhecido igual a zero. O gráfico não transforma ausência em zero.
- **`participacao`** é uma fração, de `0` a `1`, calculada antes de renderizar como `transferidasDoCanal / totalTransferidasDaSolucao`, somente quando o denominador oficial é válido. O gráfico apenas formata a fração × 100 em %. Se a definição do denominador variar, o dashboard mantém responsabilidade pela regra.
- **`totalTransferidas`** é contagem global da própria solução no contexto dos filtros. Não equivale à soma dos canais visíveis, salvo se o contrato de negócio garantir isso.
- **`ranking`** chega ordenado do adaptador externo (transferidas decrescente, BLANK por último e desempate por nome); o gráfico preserva a ordem e não calcula ranking, métricas, filtros ou DAX.
- **`origemInicial`**: `ura` (padrão) ou `iam`; seletor interno alterna entre os dois rankings sem modificar as props.
- **`tema`**: `light` ou `dark`; `carregando` e `erro` são estados controlados pelo dashboard. `[]` mostra ausência de canais; todos `transferidas:null` indicam sem dados de transferências. Valores conhecidos zero permanecem como zero.
- Interações: scroll vertical no card, horizontal no foco, hover, tooltip, seletor, fechamento do foco por botão, Escape e backdrop, retorno do foco ao controle anterior. `prefers-reduced-motion` remove transições decorativas. A biblioteca não consulta APIs.

## Restrições de integração e publicação

Este modelo contém somente a implementação visual. O mock fica em `mock/canais.ts` e não é importado no TSX. O seletor é **independente** dos gráficos Evolução do Volume e Transferências ao Humano, já homologados.

Fonte comercial **Circular Air Pro** não é distribuída; o CSS usa fallback Arial/Segoe UI. Não publicar sem autorização para reutilizar/distribuir código originado de clientes. Alterações visuais adicionais precisam ser homologadas em vez de consideradas automaticamente fiéis.
