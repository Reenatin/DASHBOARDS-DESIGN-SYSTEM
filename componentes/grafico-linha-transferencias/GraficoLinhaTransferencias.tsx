/**
 * Design System — modelo de Transferências ao Humano (Visão Geral).
 * Extração controlada da tag YDUQS v1.0.0, SHA debdaeff078cc457651a8748a52d6d4eaefb4f51.
 * Sem chamadas API, medidas DAX ou dados de demonstração neste arquivo.
 *
 * Originais: visao-geral/opcoesGraficos.ts; monitoramento/series.ts;
 * graficos/tooltip-pan.ts; graficos/guia-vertical-pontilhada.ts;
 * components/EChart.tsx; VisaoGeralPage.tsx; FocusModal.tsx.
 * A estrutura JSX/CSS foi isolada do layout global do produto; opções ECharts,
 * graduação, marcadores e regras de ausência preservam o comportamento original.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { init, use, type EChartsType } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsOption } from "echarts";
import "./grafico-linha-transferencias.css";

use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

/** Percentual é FRAÇÃO: 0.455 -> 45,50%. Nunca enviar 45.5. */
export type PontoTransferencia = {
  ordem: string;       // YYYY-MM-DD (dias) ou YYYY-MM-DD-HH (horas)
  rotulo: string;      // rótulo original: 14/10 ou 08h
  percentual: number | null;
  recebidas: number | null;
  transferidas: number | null;
  madrugada?: boolean;
  horasRegistradas?: number;
  ultimaHoraOriginal?: number;
};
export type FonteTransferencias = "ura" | "iam";
export type TemaTransferencias = "light" | "dark";
export type PropsGraficoLinhaTransferencias = {
  series: Record<FonteTransferencias, PontoTransferencia[]>;
  periodo: { from: string; to: string };
  tema: TemaTransferencias;
  origemInicial?: FonteTransferencias;
  titulo?: string;
  carregando?: boolean;
  erro?: string | null;
};

type PontoSerie = { hourCode: number; value: number | null };
type TrechoLinha = { inicio: [number,number]; fim: [number,number]; faixa: "principal" | "alerta" };
type PontoFaixa = {hourCode:number;base:number;excesso:number};

/** Fonte: monitoramento/series.ts — não atravessa horas ou valores faltantes. */
export function dividirLinhaEmTrechos(pontos: PontoSerie[], limite?: number): TrechoLinha[] {
  const resultado: TrechoLinha[] = [];
  const ordenados = [...pontos].sort((a, b) => a.hourCode - b.hourCode);
  for (let i = 1; i < ordenados.length; i++) {
    const anterior = ordenados[i - 1]!;
    const atual = ordenados[i]!;
    if (atual.hourCode !== anterior.hourCode + 1 || anterior.value === null || atual.value === null) continue;
    if (!Number.isFinite(anterior.value) || !Number.isFinite(atual.value)) continue;
    const x1 = anterior.hourCode, x2 = atual.hourCode;
    const y1 = anterior.value, y2 = atual.value;
    if (limite === undefined) {
      resultado.push({ inicio: [x1, y1], fim: [x2, y2], faixa: "principal" });
      continue;
    }
    const acima1 = y1 > limite, acima2 = y2 > limite;
    if (acima1 === acima2 || y1 === y2) {
      resultado.push({ inicio: [x1, y1], fim: [x2, y2], faixa: acima1 ? "alerta" : "principal" });
      continue;
    }
    const xCruzamento = x1 + (limite - y1) / (y2 - y1) * (x2 - x1);
    resultado.push({ inicio: [x1, y1], fim: [xCruzamento, limite], faixa: acima1 ? "alerta" : "principal" });
    resultado.push({ inicio: [xCruzamento, limite], fim: [x2, y2], faixa: acima2 ? "alerta" : "principal" });
  }
  return resultado;
}

function agruparPontosConsecutivos(pontos: PontoSerie[]): Array<Array<[number, number]>> {
  const grupos: Array<Array<[number, number]>> = [];
  let corrente: Array<[number, number]> = [];
  for (const ponto of [...pontos].sort((a,b)=>a.hourCode-b.hourCode)) {
    if (ponto.value === null || !Number.isFinite(ponto.value)) {
      if(corrente.length>=2)grupos.push(corrente);
      corrente=[];continue;
    }
    const anterior=corrente.at(-1);
    if(anterior && ponto.hourCode!==anterior[0]+1) {
      if(corrente.length>=2)grupos.push(corrente);
      corrente=[];
    }
    corrente.push([ponto.hourCode,ponto.value]);
  }
  if(corrente.length>=2)grupos.push(corrente);
  return grupos;
}

export function faixasDeAreaAth(pontos:PontoSerie[],limite:number):PontoFaixa[][] {
  return agruparPontosConsecutivos(pontos).map(grupo=>{
    const comCruzamentos:Array<[number,number]>=[grupo[0]!];
    for(let i=1;i<grupo.length;i++) {
      const [x1,y1]=grupo[i-1]!,[x2,y2]=grupo[i]!;
      if ((y1-limite)*(y2-limite)<0) {
        const x=x1+(limite-y1)*(x2-x1)/(y2-y1);
        comCruzamentos.push([x,limite]);
      }
      comCruzamentos.push([x2,y2]);
    }
    return comCruzamentos.map(([hourCode,percentual])=>({
      hourCode,base:Math.min(percentual,limite),excesso:Math.max(0,percentual-limite),
    }));
  });
}

/** Fonte: graficos/tooltip-pan.ts, aparência original. */
function estiloTooltipPan(escuro: boolean) {
  return {
    trigger: "item" as const,
    confine: true,
    backgroundColor: escuro ? "#0d1b2d" : "#ffffff",
    borderColor: escuro ? "rgba(130,171,222,.22)" : "#e5e8eb",
    borderWidth: 1,
    borderRadius: 20,
    padding: [11, 14],
    extraCssText: `box-shadow: 0 10px 28px ${escuro ? "rgba(0,0,0,.34)" : "rgba(22,43,62,.16)"}; border-radius:20px;`,
    textStyle: { color: escuro ? "#f7f9fc" : "#0d1317" },
  };
}

const marca = "#01ABBD";
const alerta = "#DF4149";
const inteiros = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export function escaparTooltip(valor: string): string {
  return valor.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
function marcadorTooltip(cor: string): string {
  return `<span aria-hidden="true" style="display:inline-block;width:9px;height:9px;`+
    `border-radius:50%;background:${cor};margin-right:7px"></span>`;
}
function detalheMadrugada(p: PontoTransferencia): string {
  if (!p.madrugada) return "";
  const qtd=p.horasRegistradas??0;
  const ultima=p.ultimaHoraOriginal;
  const final=typeof ultima==="number"?` · último horário: ${String(ultima).padStart(2,"0")}h`:"";
  return `<div style="margin-top:5px;font-size:11px;opacity:.78">`+
    `Bloco 00h–06h · ${qtd} horário(s) retornado(s)${final}</div>`;
}
function gradiente(corForte: string, corFraca: string) {
  return { type: "linear" as const, x: 0, y: 0, x2: 0, y2: 1,
    colorStops: [{ offset: 0, color: corForte }, { offset: 1, color: corFraca }] };
}

/** Fonte: graficos/guia-vertical-pontilhada.ts. */
function comGuiaVerticalPontilhada(opcoes: EChartsOption, escuro: boolean, serieDeTooltip?: string): EChartsOption {
  const x=opcoes.xAxis;
  if (!x || Array.isArray(x) || typeof x!=="object") return opcoes;
  const t=opcoes.tooltip;
  if (!t || Array.isArray(t) || typeof t!=="object") return opcoes;
  const cor=escuro?"#748BA2":"#9BAFBD";
  const pointer={show:true,type:"line" as const,snap:true,
    lineStyle:{color:cor,type:"dashed" as const,width:1.2,opacity:.95}};
  const formatter=t.formatter;
  const formata=typeof formatter==="function"
    ? (params:unknown)=>{
        const args=serieDeTooltip&&Array.isArray(params)
          ? params.find((p:unknown)=>p!==null&&typeof p==="object"
              &&"seriesId" in p&&p.seriesId===serieDeTooltip
              &&"data" in p&&p.data!==null&&typeof p.data==="object"
              &&"value" in p.data&&Array.isArray(p.data.value)
              &&p.data.value[1]!==null&&p.data.value[1]!==undefined)
          :params;
        return formatter(args as never,undefined as never,undefined as never);
      }
    :formatter;
  return {...opcoes,xAxis:{...x,axisPointer:pointer},
    tooltip:{...t,trigger:"axis",triggerOn:"mousemove",
      axisPointer:pointer,...(formata===undefined?{}:{formatter:formata})}};
}

/**
 * Fonte: visao-geral/representacao-sem-zeros.ts.
 * Só o traço visual omite taxa 0; a origem externa mantém o valor real.
 */
export function prepararSerieVisual(
  pontos:PontoTransferencia[],periodo:{from:string;to:string},
): {pontos:PontoTransferencia[];periodo:{from:string;to:string};rotulos:string[];compacto:boolean} {
  if(periodo.from===periodo.to) return {
    pontos:pontos.map(p=>p.percentual===0?{...p,percentual:null}:p),
    periodo,rotulos:[],compacto:false,
  };
  const validos=pontos.filter(p=>p.percentual!==null&&Number.isFinite(p.percentual)&&p.percentual>0)
    .sort((a,b)=>a.ordem.localeCompare(b.ordem));
  const base=validos[0]?.ordem.slice(0,10)??periodo.from;
  const inicio=Date.parse(`${base}T00:00:00Z`);
  const diaSlot=(n:number)=>new Date(inicio+n*86_400_000).toISOString().slice(0,10);
  const visuais=validos.map((p,i)=>({...p,ordem:diaSlot(i)}));
  return {pontos:visuais,periodo:{from:base,to:diaSlot(Math.max(0,visuais.length-1))},
    rotulos:validos.map(p=>p.rotulo),compacto:true};
}

/** Fonte: visao-geral/representacao-sem-zeros.ts — eixo URA com rótulos reais. */
function rotulosReaisDoEixo(opcao:EChartsOption, rotulos:string[]):EChartsOption {
  const x=opcao.xAxis;
  if(!x||typeof x!=="object"||Array.isArray(x))return opcao;
  if(x.type!=="value")return opcao;
  return {...opcao,xAxis:{...x,axisLabel:{...x.axisLabel,
    formatter:(indice:number)=>Number.isInteger(indice)?rotulos[indice]??"":""}}};
}

/** Fonte: visao-geral/opcoesGraficos.ts — variante IAM com limiar de 45%. */
export function opcoesTransferenciaIam(pontos: PontoTransferencia[], escuro: boolean, foco = false): EChartsOption {
  const legenda = escuro ? "#AEBBD0" : "#728193";
  const bordaEixo = escuro ? "rgba(174,187,208,.24)" : "#DFE5EB";
  const limite = 45;
  const porHora = (pontos[0]?.ordem.length??0)>10;
  const primeiraData = pontos[0]?.ordem.slice(0,10)??"";
  const diaBase = Date.parse(`${primeiraData}T00:00:00Z`);
  const coordenada = (p:PontoTransferencia) => porHora
    ? Number(p.ordem.slice(-2))
    : (Date.parse(`${p.ordem.slice(0,10)}T00:00:00Z`)-diaBase)/86_400_000;
  const eixoRotulos = new Map<number,string>();
  const valores: PontoSerie[] = pontos.map(p=>{
    const x=coordenada(p);eixoRotulos.set(x,p.rotulo);
    return {hourCode:x,value:p.percentual===null?null:p.percentual*100};
  });
  const taxas = valores.filter((p):p is PontoSerie&{value:number}=>p.value!==null&&Number.isFinite(p.value));
  const maior = Math.max(limite,...taxas.map(p=>p.value));
  const ymax = Math.max(50,Math.min(100,Math.ceil((maior+5)/10)*10));
  const inicio = valores[0]?.hourCode??0;
  const fim = Math.max(inicio+1,valores.at(-1)?.hourCode??inicio);
  const saltoRotulo = Math.max(1,Math.ceil(Math.max(1,fim-inicio)/7));
  const faixas = faixasDeAreaAth(valores,limite);
  const trechos = dividirLinhaEmTrechos(valores,limite);
  const series: NonNullable<EChartsOption["series"]> = [
    ...faixas.flatMap((grupo,i)=>[
      { id:`ath-base-${i}`, type:"line" as const, stack:`vg-ath-${i}`, silent:true, showSymbol:false,
        smooth:0, animationDuration:450, lineStyle:{width:0,opacity:0},
        areaStyle:{color:gradiente(escuro?"rgba(1,171,189,.40)":"rgba(1,171,189,.24)","rgba(1,171,189,.015)")},
        data:grupo.map(p=>[p.hourCode,p.base]), z:1 },
      { id:`ath-excesso-${i}`, type:"line" as const, stack:`vg-ath-${i}`, silent:true, showSymbol:false,
        smooth:0, animationDuration:450, lineStyle:{width:0,opacity:0},
        areaStyle:{color:gradiente(escuro?"rgba(223,65,73,.54)":"rgba(223,65,73,.38)","rgba(223,65,73,.07)")},
        data:grupo.map(p=>[p.hourCode,p.excesso]), z:2 },
    ]),
    ...trechos.map((trecho,i)=>({id:`ath-trecho-${i}`,type:"line" as const,silent:true,
      showSymbol:false,smooth:0,animationDuration:450,
      lineStyle:{color:trecho.faixa==="alerta"?alerta:marca,width:3.3,cap:"round" as const},
      data:[trecho.inicio,trecho.fim],z:3})),
    { id:"limite-ath", type:"line", silent:true, showSymbol:false,
      data:[[inicio,limite],[fim,limite]],lineStyle:{color:alerta,type:"dashed",width:1.3},z:2 },
    { id:"pontos-reais", name:"Taxa de transferência", type:"line",showSymbol:true,symbol:"circle",symbolSize:foco?9:7,
      smooth:0,lineStyle:{opacity:0,width:0},
      emphasis:{focus:"none",scale:true,
        itemStyle:{borderColor:escuro?"#11243A":"#FFFFFF",borderWidth:2}},
      data:valores.map(p=>({value:[p.hourCode,p.value],itemStyle:{color:p.value!==null&&p.value>limite?alerta:marca}})),z:5 },
  ];
  return {
    animationDuration:450,
    grid:foco?{left:52,right:35,top:38,bottom:48,containLabel:false}:{left:43,right:18,top:24,bottom:29,containLabel:false},
    xAxis:{type:"value",min:inicio,max:fim,interval:saltoRotulo,
      axisLabel:{color:legenda,fontSize:foco?12:10,showMinLabel:true,showMaxLabel:true,hideOverlap:true,
        formatter:(value:number)=>Number.isInteger(value)?eixoRotulos.get(value)??"":""},
      axisTick:{show:false},axisLine:{lineStyle:{color:bordaEixo}},splitLine:{show:false}},
    yAxis:{type:"value",min:0,max:ymax,splitNumber:4,
      axisLabel:{color:legenda,fontSize:foco?12:10,formatter:"{value}%"},
      axisTick:{show:false},axisLine:{show:false},splitLine:{show:false}},
    tooltip:{...estiloTooltipPan(escuro),
      trigger:"axis",
      axisPointer:{type:"line",snap:true,
        lineStyle:{color:escuro?"#667D96":"#B8C3CE",type:"dashed",width:1}},
      formatter:(payload:unknown)=>{
        const params=Array.isArray(payload)?payload:[payload];
        const p=params.find((item):item is {seriesId:string;data?:{value?:unknown};value?:unknown}=>
          !!item && typeof item==="object" && "seriesId" in item && item.seriesId==="pontos-reais");
        if(!p)return "";
        const valor=p.data?.value??p.value;
        if(!Array.isArray(valor))return "";
        const [posicao] = valor;
        const row=pontos.find(item=>coordenada(item)===posicao);if(!row)return "";
        const pct=row.percentual===null?"Indisponível":`${percent.format(row.percentual*100)}%`;
        const rec=row.recebidas===null?"—":inteiros.format(row.recebidas);
        const tra=row.transferidas===null?"—":inteiros.format(row.transferidas);
        const cor=row.percentual!==null&&row.percentual*100>limite?alerta:marca;
        return `<strong>${escaparTooltip(row.madrugada?"Madrugada (00h–06h)":row.rotulo)}</strong>`+
          `<div style="margin-top:6px">${marcadorTooltip(cor)}Transferência: <strong>${pct}</strong></div>`+
          `<div style="margin-top:3px">Recebidas: <strong>${rec}</strong></div>`+
          `<div>Transferidas: <strong>${tra}</strong></div>`+
          detalheMadrugada(row);
      },
    },
    series,
  };
}

/** Fonte: opcoesLinhaSolucao(..., 'transferencias') — variante URA SEM limite de IAM. */
export function opcoesTransferenciaUra(
  pontos:PontoTransferencia[], periodo:{from:string;to:string}, escuro:boolean, foco:boolean,
): EChartsOption {
  const legenda=escuro?"#AEBBD0":"#728193";
  const bordaEixo=escuro?"rgba(174,187,208,.24)":"#DFE5EB";
  const porHora=periodo.from===periodo.to;
  const base=Date.parse(`${periodo.from}T00:00:00Z`);
  const diaFinal=(Date.parse(`${periodo.to}T00:00:00Z`)-base)/86_400_000;
  const registrados=pontos.flatMap(ponto=>{
    if(porHora){
      if(!ponto.ordem.startsWith(`${periodo.from}-`))return [];
      const h=Number(ponto.ordem.slice(-2));
      return Number.isInteger(h)&&h>=0&&h<=23?[{x:h,ponto}]:[];
    }
    const x=(Date.parse(`${ponto.ordem.slice(0,10)}T00:00:00Z`)-base)/86_400_000;
    return Number.isInteger(x)&&x>=0&&x<=diaFinal?[{x,ponto}]:[];
  }).sort((a,b)=>a.x-b.x);
  const inicio=porHora?(registrados[0]?.x??0):0;
  const ultimo=porHora?(registrados.at(-1)?.x??inicio):diaFinal;
  const fim=Math.max(inicio+1,ultimo);
  const mapa=new Map(registrados.map(({x,ponto})=>[x,ponto]));
  const valores=new Map(registrados.map(({x,ponto})=>[x,ponto.percentual===null?null:ponto.percentual*100]));
  const dados:Array<[number,number|null]>=Array.from({length:Math.floor(fim-inicio)+1},(_,i)=>{
    const x=inicio+i;return [x,valores.get(x)??null];
  });
  const temMadrugada=porHora&&registrados.some(({x,ponto})=>x===6&&ponto.madrugada);
  const maior=Math.max(0,...dados.map(([,y])=>y??0));
  const maxPct=Math.min(100,Math.max(10,Math.ceil((maior+5)/10)*10));
  const intervalo=Math.max(1,Math.ceil((fim-inicio)/(foco?12:7)));
  const rotulo=(x:number)=>{
    if(!Number.isInteger(x))return "";
    if(porHora&&temMadrugada&&x===6)return "Madrugada";
    if(porHora)return `${String(x).padStart(2,"0")}h`;
    const dt=new Date(base+x*86_400_000);
    return `${String(dt.getUTCDate()).padStart(2,"0")}/${String(dt.getUTCMonth()+1).padStart(2,"0")}`;
  };
  return {
    animationDuration:450,
    grid:foco?{left:52,right:35,top:38,bottom:48,containLabel:false}
      :{left:43,right:18,top:24,bottom:29,containLabel:false},
    xAxis:{type:"value",min:inicio,max:fim,interval:intervalo,
      axisLabel:{color:legenda,fontSize:foco?12:10,showMinLabel:true,showMaxLabel:true,
        hideOverlap:true,formatter:rotulo},
      axisTick:{show:false},axisLine:{lineStyle:{color:bordaEixo}},splitLine:{show:false}},
    yAxis:{type:"value",min:0,max:maxPct,splitNumber:4,
      axisLabel:{color:legenda,fontSize:foco?12:10,formatter:"{value}%"},
      axisTick:{show:false},axisLine:{show:false},splitLine:{show:false}},
    tooltip:{...estiloTooltipPan(escuro),trigger:"axis",axisPointer:{type:"line",snap:true,
      lineStyle:{color:escuro?"#667D96":"#B8C3CE",type:"dashed",width:1}},
      formatter:(payload:unknown)=>{
        const params=Array.isArray(payload)?payload:[payload];
        const parametro=params.find((p):p is {seriesId:string;data?:unknown;value?:unknown}=>
          !!p&&typeof p==="object"&&"seriesId" in p&&p.seriesId==="solucao-linha");
        const valor=parametro?.data??parametro?.value;
        if(!Array.isArray(valor)||typeof valor[0]!=="number")return "";
        const ponto=mapa.get(valor[0]);
        if(!ponto||ponto.percentual===null)return "";
        const recebido=ponto.recebidas===null?"—":inteiros.format(ponto.recebidas);
        const transferido=ponto.transferidas===null?"—":inteiros.format(ponto.transferidas);
        const percentual=`${percent.format(ponto.percentual*100)}%`;
        return `<strong>${escaparTooltip(ponto.madrugada?"Madrugada (00h–06h)":ponto.rotulo)} · URA</strong>`+
          `<div style="margin-top:6px">${marcadorTooltip(marca)}Transferência: <strong>${percentual}</strong></div>`+
          `<div style="margin-top:3px">Recebidas: <strong>${recebido}</strong></div>`+
          `<div>Transferidas: <strong>${transferido}</strong></div>`+
          detalheMadrugada(ponto);
      },
    },
    series:[{id:"solucao-linha",name:"Transferência",type:"line",data:dados,
      connectNulls:false,smooth:0,showSymbol:true,symbol:"circle",symbolSize:foco?9:7,
      lineStyle:{color:marca,width:3.3,cap:"round"},itemStyle:{color:marca},
      areaStyle:{color:gradiente(escuro?"rgba(1,171,189,.42)":"rgba(1,171,189,.27)","rgba(1,171,189,.018)")},
      emphasis:{focus:"none",scale:true,itemStyle:{borderColor:escuro?"#11243A":"#FFFFFF",borderWidth:2}},
    }],
  };
}

/** Adaptador do EChart original: somente a linha de Transferências; sem sequência de Volume. */
function EChartTransferencias({option,className}:{option:EChartsOption;className:string}){
  const elementRef=useRef<HTMLDivElement|null>(null);
  const chartRef=useRef<EChartsType|null>(null);
  useEffect(()=>{
    const element=elementRef.current;if(!element)return;
    const chart=init(element);chartRef.current=chart;
    let resizeFrame=0,settleTimer=0;
    const resize=()=>{
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame=window.requestAnimationFrame(()=>{
        if(!chart.isDisposed())chart.resize({animation:{duration:0}});
      });
    };
    const resizeAndSettle=()=>{resize();window.clearTimeout(settleTimer);settleTimer=window.setTimeout(resize,360);};
    const observer=new ResizeObserver(resizeAndSettle);
    observer.observe(element);if(element.parentElement)observer.observe(element.parentElement);
    const area=element.closest(".ds-transferencias-area");
    const end=(ev:Event)=>{if(ev.target===area)resize();};
    area?.addEventListener("transitionend",end);
    window.addEventListener("resize",resizeAndSettle);resizeAndSettle();
    return()=>{
      window.cancelAnimationFrame(resizeFrame);window.clearTimeout(settleTimer);
      observer.disconnect();area?.removeEventListener("transitionend",end);
      window.removeEventListener("resize",resizeAndSettle);
      chart.dispose();chartRef.current=null;
    };
  },[]);
  useEffect(()=>{
    const chart=chartRef.current;if(!chart||chart.isDisposed())return;
    chart.setOption(option,true);
    window.requestAnimationFrame(()=>{if(!chart.isDisposed())chart.resize({animation:{duration:0}});});
  },[option]);
  return <div ref={elementRef} className={className}/>;
}

function IconeFoco(){return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/></svg>;}

/** Card, seletor e foco são do MESMO modelo. Nenhum mock é importado aqui. */
export function GraficoLinhaTransferencias({
  series,periodo,tema,origemInicial="ura",titulo="Evolução das Transferências ao Humano",carregando=false,erro=null,
}:PropsGraficoLinhaTransferencias){
  const [origem,setOrigem]=useState<FonteTransferencias>(origemInicial);
  const [foco,setFoco]=useState(false);
  const escuro=tema==="dark";
  const selecionados=series[origem];
  const visual=useMemo(()=>prepararSerieVisual(selecionados,periodo),[selecionados,periodo]);
  const temDados=visual.pontos.some(p=>p.percentual!==null&&Number.isFinite(p.percentual));
  const criarOpcoes=(modoFoco:boolean)=>{
    const opcoes=origem==="iam"?opcoesTransferenciaIam(visual.pontos,escuro,modoFoco):
      opcoesTransferenciaUra(visual.pontos,visual.periodo,escuro,modoFoco);
    // Mesmo ajuste de rótulos calendáricos da release: URA compactada usa datas ORIGINAIS.
    const opcoesRotulos=origem==="ura"&&visual.compacto?
      rotulosReaisDoEixo(opcoes,visual.rotulos):opcoes;
    return comGuiaVerticalPontilhada(opcoesRotulos,escuro);
  };
  const option=useMemo(()=>criarOpcoes(false),[origem,visual,escuro]);
  const optionFoco=useMemo(()=>criarOpcoes(true),[origem,visual,escuro]);
  const closeRef=useRef<HTMLButtonElement|null>(null);
  useEffect(()=>{
    if(!foco)return;
    const anterior=document.activeElement instanceof HTMLElement?document.activeElement:null;
    const overflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    closeRef.current?.focus();
    const aoTeclar=(e:KeyboardEvent)=>{if(e.key==="Escape")setFoco(false);};
    document.addEventListener("keydown",aoTeclar);
    return()=>{document.removeEventListener("keydown",aoTeclar);document.body.style.overflow=overflow;anterior?.focus();};
  },[foco]);
  const seletor=()=><div className="ds-tf-seletor" role="group" aria-label={`Solução de ${titulo}`}>
    {(["ura","iam"] as const).map(chave=><button key={chave} type="button"
      className={`ds-tf-opcao ${chave===origem?"is-active":""}`}
      aria-pressed={chave===origem} onClick={()=>setOrigem(chave)}>{chave.toUpperCase()}</button>)}
  </div>;
  const corpo=(modoFoco:boolean)=>erro?<div className="ds-tf-vazio" role="alert">Não foi possível carregar transferências: {erro}</div>
    :carregando?<div className="ds-tf-vazio" role="status">Carregando transferências…</div>
    :!temDados?<div className="ds-tf-vazio" role="status">Sem dados do indicador para o período selecionado.</div>
    :<EChartTransferencias option={modoFoco?optionFoco:option} className="ds-tf-echart"/>;
  return <div className={`ds-tf-root ds-transferencias-area`} data-theme={tema}>
    <article className="ds-tf-card" aria-label={titulo}>
      <header className="ds-tf-cabecalho"><div className="ds-tf-titulo"><span className="ds-tf-kicker">TRANSFERÊNCIAS</span><h2>{titulo}</h2></div>
        <div className="ds-tf-acoes">{seletor()}<button type="button" className="ds-tf-botao-foco" title="Modo foco"
          aria-label="Abrir transferências em modo foco" onClick={()=>setFoco(true)}><IconeFoco/></button></div>
      </header>
      <div className="ds-tf-corpo">{corpo(false)}</div>
    </article>
    {foco&&<div className="ds-tf-backdrop" role="presentation" onMouseDown={()=>setFoco(false)}>
      <section className="ds-tf-modal" role="dialog" aria-modal="true" aria-labelledby="ds-tf-foco-titulo"
        onMouseDown={e=>e.stopPropagation()}>
        <header className="ds-tf-modal-head"><div><span className="ds-tf-kicker">MODO FOCO</span>
          <h2 id="ds-tf-foco-titulo">{titulo}</h2><p>Visualização ampliada do indicador</p></div>
          <div className="ds-tf-modal-acoes">{seletor()}
            <button ref={closeRef} type="button" className="ds-tf-fechar" aria-label="Fechar modo foco"
              onClick={()=>setFoco(false)}>×</button></div>
        </header><div className="ds-tf-modal-corpo">{corpo(true)}</div>
      </section>
    </div>}
  </div>;
}
