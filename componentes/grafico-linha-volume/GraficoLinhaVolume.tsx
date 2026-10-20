/**
 * Etapa 2 — Evolução do Volume, cópia/consolidação controlada das opções homologadas.
 * YDUQS v1.0.0: debdaeff078cc457651a8748a52d6d4eaefb4f51.
 * Fontes: visao-geral/opcoesGraficos.ts, animacao-linha-marcadores.ts,
 * representacao-sem-zeros.ts, tooltip-volume-sem-duplicacao.ts,
 * graficos/tooltip-pan.ts, guia-vertical-pontilhada.ts,
 * components/EChart.tsx, VisaoGeralPage.tsx e FocusModal.tsx.
 * Sem importação de mock, API, DAX, ativos ou fontes comerciais.
 */
import {useEffect,useMemo,useRef,useState} from "react";
import {LineChart,type LineSeriesOption} from "echarts/charts";
import {GridComponent,TooltipComponent} from "echarts/components";
import {init,use,type EChartsType} from "echarts/core";
import {CanvasRenderer} from "echarts/renderers";
import type {EChartsOption} from "echarts";
import "./grafico-linha-volume.css";

use([LineChart,GridComponent,TooltipComponent,CanvasRenderer]);
export type FonteVolume="ura"|"iam";
export type TemaVolume="light"|"dark";
/** Volumes são contagens; 0 é distinto de null (BLANK), não reescrever os dados da API. */
export type PontoVolume={
  ordem:string; // YYYY-MM-DD ou YYYY-MM-DD-HH
  rotulo:string; // rótulo original de data/hora
  recebidas:number|null;
  transferidas:number|null;
  madrugada?:boolean;
  horasRegistradas?:number;
  ultimaHoraOriginal?:number;
};
export type PropsGraficoLinhaVolume={
  series:Record<FonteVolume,PontoVolume[]>;
  periodo:{from:string;to:string};
  tema:TemaVolume;
  origemInicial?:FonteVolume;
  titulo?:string;
  carregando?:boolean;
  erro?:string|null;
};
const marca="#01ABBD";
const inteiros=new Intl.NumberFormat("pt-BR",{maximumFractionDigits:0});
export function escaparTooltipVolume(valor:string):string{
  return valor.replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
}
function marcadorTooltip(cor:string):string{
  return `<span aria-hidden="true" style="display:inline-block;width:9px;height:9px;`+
    `border-radius:50%;background:${cor};margin-right:7px"></span>`;
}
function detalheMadrugada(p:PontoVolume):string{
  if(!p.madrugada)return "";
  const ultima=p.ultimaHoraOriginal;
  const final=typeof ultima==="number"?` · último horário: ${String(ultima).padStart(2,"0")}h`:"";
  return `<div style="margin-top:5px;font-size:11px;opacity:.78">`+
    `Bloco 00h–06h · ${p.horasRegistradas??0} horário(s) retornado(s)${final}</div>`;
}
/** Tooltip PAN/YDUQS original — formato e cores intactos. */
function estiloTooltipPan(escuro:boolean){return{
  trigger:"item" as const,confine:true,
  backgroundColor:escuro?"#0d1b2d":"#ffffff",
  borderColor:escuro?"rgba(130,171,222,.22)":"#e5e8eb",
  borderWidth:1,borderRadius:20,padding:[11,14],
  extraCssText:`box-shadow: 0 10px 28px ${escuro?"rgba(0,0,0,.34)":"rgba(22,43,62,.16)"}; border-radius:20px;`,
  textStyle:{color:escuro?"#f7f9fc":"#0d1317"},
};}
function gradiente(forte:string,fraca:string){return{
  type:"linear" as const,x:0,y:0,x2:0,y2:1,
  colorStops:[{offset:0,color:forte},{offset:1,color:fraca}],
};}

/** Mesma regra de representação visao-geral/representacao-sem-zeros.ts.
 * Em um dia, zero vira null APENAS na cópia visual; em múltiplos dias só os
 * dias com volume positivo ocupam slot visual, mantendo rótulos originais.
 */
export function prepararVolumeVisual(pontos:PontoVolume[],periodo:{from:string;to:string}):{
  pontos:PontoVolume[];periodo:{from:string;to:string};rotulos:string[];compacto:boolean;
}{
  if(periodo.from===periodo.to)return{
    pontos:pontos.map(p=>p.recebidas===0?{...p,recebidas:null}:p),
    periodo,rotulos:[],compacto:false,
  };
  const validos=pontos.filter(p=>p.recebidas!==null&&Number.isFinite(p.recebidas)&&p.recebidas>0)
    .sort((a,b)=>a.ordem.localeCompare(b.ordem));
  const base=validos[0]?.ordem.slice(0,10)??periodo.from;
  const inicio=Date.parse(`${base}T00:00:00Z`);
  const diaSlot=(n:number)=>new Date(inicio+n*86_400_000).toISOString().slice(0,10);
  const visuais=validos.map((p,i)=>({...p,ordem:diaSlot(i)}));
  return {pontos:visuais,periodo:{from:base,to:diaSlot(Math.max(1,visuais.length-1))},
    rotulos:validos.map(p=>p.rotulo),compacto:true};
}

/** Coordenadas e lacunas exatamente como opcoesGraficos.ts para evolução do volume. */
export function coordenadasVolume(pontos:PontoVolume[],periodo:{from:string;to:string}){
  const porHora=periodo.from===periodo.to;
  const base=Date.parse(`${periodo.from}T00:00:00Z`);
  const ultimaData=Date.parse(`${periodo.to}T00:00:00Z`);
  const diaFinal=(ultimaData-base)/86_400_000;
  const registrados=pontos.flatMap(ponto=>{
    if(porHora){
      if(!ponto.ordem.startsWith(`${periodo.from}-`))return [];
      const h=Number(ponto.ordem.slice(-2));
      return Number.isInteger(h)&&h>=0&&h<=23?[{x:h,ponto}]:[];
    }
    const dia=ponto.ordem.slice(0,10);
    const x=(Date.parse(`${dia}T00:00:00Z`)-base)/86_400_000;
    return Number.isInteger(x)&&x>=0&&x<=diaFinal?[{x,ponto}]:[];
  }).sort((a,b)=>a.x-b.x);
  const inicio=porHora?(registrados[0]?.x??0):0;
  const ultimo=porHora?(registrados.at(-1)?.x??inicio):diaFinal;
  return {inicio,fim:Math.max(inicio+1,ultimo),porHora,registrados};
}
export function lacunasVolume(pontos:PontoVolume[],periodo:{from:string;to:string}):Array<[number,number|null]>{
  const {inicio,fim,registrados}=coordenadasVolume(pontos,periodo);
  const valores=new Map(registrados.map(({x,ponto})=>[x,ponto.recebidas]));
  return Array.from({length:Math.floor(fim-inicio)+1},(_,i)=>{
    const x=inicio+i;
    return [x,valores.get(x)??null];
  });
}

/** Fonte: opcoesEvolucaoVolumeSolucao -> opcoesLinhaSolucao(volume).
 * Hotfix original semRecebidasDuplicadas: não repetir Recebidas no tooltip.
 */
export function opcoesEvolucaoVolume(pontos:PontoVolume[],periodo:{from:string;to:string},
  solucao:FonteVolume,escuro:boolean,foco=false):EChartsOption{
  const legenda=escuro?"#AEBBD0":"#728193";
  const bordaEixo=escuro?"rgba(174,187,208,.24)":"#DFE5EB";
  const dom=coordenadasVolume(pontos,periodo);
  const dados=lacunasVolume(pontos,periodo);
  const mapa=new Map(dom.registrados.map(({x,ponto})=>[x,ponto]));
  const temMadrugada=dom.porHora&&dom.registrados.some(({x,ponto})=>x===6&&ponto.madrugada);
  const intervalo=Math.max(1,Math.ceil((dom.fim-dom.inicio)/(foco?12:7)));
  const rotulo=(x:number)=>{
    if(!Number.isInteger(x))return "";
    if(dom.porHora&&temMadrugada&&x===6)return "Madrugada";
    if(dom.porHora)return `${String(x).padStart(2,"0")}h`;
    const dt=new Date(Date.parse(`${periodo.from}T00:00:00Z`)+x*86_400_000);
    return `${String(dt.getUTCDate()).padStart(2,"0")}/${String(dt.getUTCMonth()+1).padStart(2,"0")}`;
  };
  return {
    animationDuration:450,
    grid:foco?{left:52,right:35,top:38,bottom:48,containLabel:false}
      :{left:43,right:18,top:24,bottom:29,containLabel:false},
    xAxis:{type:"value",min:dom.inicio,max:dom.fim,interval:intervalo,
      axisLabel:{color:legenda,fontSize:foco?12:10,showMinLabel:true,showMaxLabel:true,
        hideOverlap:true,formatter:rotulo},
      axisTick:{show:false},axisLine:{lineStyle:{color:bordaEixo}},splitLine:{show:false}},
    yAxis:{type:"value",min:0,splitNumber:4,
      axisLabel:{color:legenda,fontSize:foco?12:10,formatter:(x:number)=>inteiros.format(x)},
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
        if(!ponto||ponto.recebidas===null)return "";
        const recebido=inteiros.format(ponto.recebidas);
        const transferido=ponto.transferidas===null?"—":inteiros.format(ponto.transferidas);
        return `<strong>${escaparTooltipVolume(ponto.madrugada?"Madrugada (00h–06h)":ponto.rotulo)} · ${solucao.toUpperCase()}</strong>`+
          `<div style="margin-top:6px">${marcadorTooltip(marca)}Recebidas: <strong>${recebido}</strong></div>`+
          `<div>Transferidas: <strong>${transferido}</strong></div>`+
          detalheMadrugada(ponto);
      },
    },
    series:[{id:"solucao-linha",name:"Recebidas",type:"line",
      data:dados,connectNulls:false,smooth:0,showSymbol:true,symbol:"circle",symbolSize:foco?9:7,
      lineStyle:{color:marca,width:3.3,cap:"round"},itemStyle:{color:marca},
      areaStyle:{color:gradiente(escuro?"rgba(1,171,189,.42)":"rgba(1,171,189,.27)","rgba(1,171,189,.018)")},
      emphasis:{focus:"none",scale:true,itemStyle:{borderColor:escuro?"#11243A":"#FFFFFF",borderWidth:2}},
    }],
  };
}

/** A guia é a mesma de graficos/guia-vertical-pontilhada.ts. */
function comGuiaVerticalPontilhada(opcoes:EChartsOption,escuro:boolean):EChartsOption{
  const x=opcoes.xAxis;
  if(!x||Array.isArray(x)||typeof x!=="object")return opcoes;
  const t=opcoes.tooltip;
  if(!t||Array.isArray(t)||typeof t!=="object")return opcoes;
  const cor=escuro?"#748BA2":"#9BAFBD";
  const pointer={show:true,type:"line" as const,snap:true,
    lineStyle:{color:cor,type:"dashed" as const,width:1.2,opacity:.95}};
  return {...opcoes,xAxis:{...x,axisPointer:pointer},
    tooltip:{...t,trigger:"axis",triggerOn:"mousemove",axisPointer:pointer}};
}
/** Restore label mapping of original multi-day URA volume; never invent timestamps. */
function rotulosReaisVolume(opcao:EChartsOption,rotulos:string[],compacto:boolean,solucao:FonteVolume):EChartsOption{
  if(!compacto||!rotulos.length||(solucao!=="ura"&&rotulos.length>1))return opcao;
  const x=opcao.xAxis;
  if(!x||Array.isArray(x)||typeof x!=="object"||x.type!=="value")return opcao;
  return {...opcao,xAxis:{...x,axisLabel:{...x.axisLabel,
    formatter:(indice:number)=>Number.isInteger(indice)?rotulos[indice]??"":""}}};
}

/** Cópia do motor de sequência YDUQS v1.0.0: linha inteira ANTES dos marcadores. */
export const ID_MARCADORES_VOLUME="solucao-marcadores-pos-linha";
export function linhaAntesDosMarcadores(opcao:EChartsOption):EChartsOption{
  const series=Array.isArray(opcao.series)?opcao.series:opcao.series?[opcao.series]:[];
  if(series.length!==1||series[0]?.type!=="line")return opcao;
  const base=series[0] as LineSeriesOption;
  if(base.id!=="solucao-linha")return opcao;
  const marcadores:LineSeriesOption={
    id:ID_MARCADORES_VOLUME,type:"line",name:"Marcadores visuais de recebidas",
    data:base.data,connectNulls:false,smooth:0,showSymbol:true,
    symbol:"circle",symbolSize:base.symbolSize??7,
    lineStyle:{width:0,opacity:0},itemStyle:base.itemStyle,silent:true,
    tooltip:{show:false},emphasis:{disabled:true},animation:false,z:4,
  };
  return {...opcao,animation:false,series:[
    {...base,showSymbol:false,animation:false,animationDuration:0,animationDurationUpdate:0},
    marcadores,
  ]};
}
export function prepararEntradaMarcadores(opcao:EChartsOption):{
  inicial:EChartsOption;pontos:NonNullable<LineSeriesOption["data"]>;
}|null{
  const series=Array.isArray(opcao.series)?opcao.series:opcao.series?[opcao.series]:[];
  const marcador=series.find(item=>item?.type==="line"&&item.id===ID_MARCADORES_VOLUME) as LineSeriesOption|undefined;
  if(!marcador||!Array.isArray(marcador.data))return null;
  const pontos=[...marcador.data];
  const semPontos:LineSeriesOption={...marcador,data:pontos.map(()=>null)};
  return {inicial:{...opcao,animation:false,series:series.map(item=>item===marcador?semPontos:item)},pontos};
}
export function iniciarEntradaMarcadores<T>(pontos:readonly T[],aplicar:(visiveis:(T|null)[])=>void,
  agendar:(fn:()=>void,ms:number)=>number,cancelar:(handle:number)=>void):()=>void{
  if(pontos.length===0)return()=>{};
  const passo=Math.max(1,Math.ceil(pontos.length/48));
  const rodadas=Math.ceil(pontos.length/passo);
  const intervalo=Math.max(16,Math.round(850/rodadas));
  const quadro:(T|null)[]=pontos.map(()=>null);
  let posicao=0,cancelado=false,handle:number|null=null;
  const proximo=()=>{
    if(cancelado)return;
    const limite=Math.min(pontos.length,posicao+passo);
    while(posicao<limite){quadro[posicao]=pontos[posicao]!;posicao+=1;}
    aplicar([...quadro]);
    if(posicao<pontos.length)handle=agendar(proximo,intervalo);
  };
  handle=agendar(proximo,60);
  return()=>{cancelado=true;if(handle!==null)cancelar(handle);};
}

/** EChart origin: ResizeObserver and entry sequence opt-in. The component is Volume-only. */
function EChartVolume({option,className}:{option:EChartsOption;className:string}){
  const ref=useRef<HTMLDivElement|null>(null);
  const chartRef=useRef<EChartsType|null>(null);
  useEffect(()=>{
    const element=ref.current;if(!element)return;
    const chart=init(element);chartRef.current=chart;
    let resizeFrame=0,settleTimer=0;
    const resize=()=>{window.cancelAnimationFrame(resizeFrame);
      resizeFrame=window.requestAnimationFrame(()=>{if(!chart.isDisposed())chart.resize({animation:{duration:0}});});};
    const resizeAndSettle=()=>{resize();window.clearTimeout(settleTimer);settleTimer=window.setTimeout(resize,360);};
    const observer=new ResizeObserver(resizeAndSettle);
    observer.observe(element);if(element.parentElement)observer.observe(element.parentElement);
    const area=element.closest(".ds-volume-area");
    const onTransitionEnd=(event:Event)=>{if(event.target===area)resize();};
    area?.addEventListener("transitionend",onTransitionEnd);
    window.addEventListener("resize",resizeAndSettle);resizeAndSettle();
    return()=>{
      window.cancelAnimationFrame(resizeFrame);window.clearTimeout(settleTimer);
      observer.disconnect();area?.removeEventListener("transitionend",onTransitionEnd);
      window.removeEventListener("resize",resizeAndSettle);
      chart.dispose();chartRef.current=null;
    };
  },[]);
  useEffect(()=>{
    const chart=chartRef.current;if(!chart||chart.isDisposed())return;
    const reduzida=typeof window.matchMedia==="function"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const entrada=!reduzida?prepararEntradaMarcadores(option):null;
    if(!entrada){
      chart.setOption(option,true);
      window.requestAnimationFrame(()=>{if(!chart.isDisposed())chart.resize({animation:{duration:0}});});
      return;
    }
    chart.setOption(entrada.inicial,true);
    const parar=iniciarEntradaMarcadores(entrada.pontos,quadro=>{
      if(!chart.isDisposed())chart.setOption({series:[{id:ID_MARCADORES_VOLUME,type:"line",data:quadro}]},
        {notMerge:false,lazyUpdate:false,silent:true});
    },(fn,ms)=>window.setTimeout(fn,ms),handle=>window.clearTimeout(handle));
    window.requestAnimationFrame(()=>{if(!chart.isDisposed())chart.resize({animation:{duration:0}});});
    return parar;
  },[option]);
  return <div ref={ref} className={className}/>;
}
function IconeFoco(){return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/></svg>;}

/** Card e foco do piloto 01, mesmas dimensões originais. CSS isolado, mock externo. */
export function GraficoLinhaVolume({series,periodo,tema,origemInicial="ura",titulo="Evolução do Volume",
  carregando=false,erro=null}:PropsGraficoLinhaVolume){
  const [origem,setOrigem]=useState<FonteVolume>(origemInicial);
  const [foco,setFoco]=useState(false);
  const escuro=tema==="dark";
  const selecionados=series[origem];
  const visual=useMemo(()=>prepararVolumeVisual(selecionados,periodo),[selecionados,periodo.from,periodo.to]);
  const temDados=visual.pontos.some(p=>p.recebidas!==null&&Number.isFinite(p.recebidas)&&p.recebidas>0);
  const criarOpcoes=(modoFoco:boolean)=>{
    const base=opcoesEvolucaoVolume(visual.pontos,visual.periodo,origem,escuro,modoFoco);
    const rotulos=rotulosReaisVolume(base,visual.rotulos,visual.compacto,origem);
    return comGuiaVerticalPontilhada(linhaAntesDosMarcadores(rotulos),escuro);
  };
  const option=useMemo(()=>criarOpcoes(false),[origem,visual,escuro]);
  const optionFoco=useMemo(()=>criarOpcoes(true),[origem,visual,escuro]);
  const closeRef=useRef<HTMLButtonElement|null>(null);
  useEffect(()=>{
    if(!foco)return;
    const anterior=document.activeElement instanceof HTMLElement?document.activeElement:null;
    const overflow=document.body.style.overflow;
    document.body.style.overflow="hidden";closeRef.current?.focus();
    const aoTeclar=(e:KeyboardEvent)=>{if(e.key==="Escape")setFoco(false);};
    document.addEventListener("keydown",aoTeclar);
    return()=>{document.removeEventListener("keydown",aoTeclar);
      document.body.style.overflow=overflow;anterior?.focus();};
  },[foco]);
  const seletor=()=><div className="ds-vl-seletor" role="group" aria-label={`Solução de ${titulo}`}>
    {(["ura","iam"] as const).map(chave=><button key={chave} type="button"
      className={`ds-vl-opcao ${chave===origem?"is-active":""}`} aria-pressed={chave===origem}
      onClick={()=>setOrigem(chave)}>{chave.toUpperCase()}</button>)}
  </div>;
  const corpo=(modoFoco:boolean)=>erro?<div className="ds-vl-vazio" role="alert">Não foi possível carregar volume: {erro}</div>
    :carregando?<div className="ds-vl-vazio" role="status">Carregando volume…</div>
    :!temDados?<div className="ds-vl-vazio" role="status">Sem dados do indicador para o período selecionado.</div>
    :<EChartVolume option={modoFoco?optionFoco:option} className="ds-vl-echart"/>;
  return <div className="ds-vl-root ds-volume-area" data-theme={tema}>
    <article className="ds-vl-card" aria-label={titulo}>
      <header className="ds-vl-cabecalho"><div className="ds-vl-titulo"><span className="ds-vl-kicker">VOLUME</span><h2>{titulo}</h2></div>
        <div className="ds-vl-acoes">{seletor()}<button type="button" className="ds-vl-botao-foco"
          title="Modo foco" aria-label="Abrir volume em modo foco" onClick={()=>setFoco(true)}><IconeFoco/></button></div>
      </header><div className="ds-vl-corpo">{corpo(false)}</div>
    </article>
    {foco&&<div className="ds-vl-backdrop" role="presentation" onMouseDown={()=>setFoco(false)}>
      <section className="ds-vl-modal" role="dialog" aria-modal="true" aria-labelledby="ds-vl-foco-titulo"
        onMouseDown={e=>e.stopPropagation()}>
        <header className="ds-vl-modal-head"><div><span className="ds-vl-kicker">MODO FOCO</span>
          <h2 id="ds-vl-foco-titulo">{titulo}</h2><p>Visualização ampliada do indicador</p></div>
          <div className="ds-vl-modal-acoes">{seletor()}
            <button ref={closeRef} type="button" className="ds-vl-fechar" aria-label="Fechar modo foco"
              onClick={()=>setFoco(false)}>×</button></div>
        </header><div className="ds-vl-modal-corpo">{corpo(true)}</div>
      </section>
    </div>}
  </div>;
}
