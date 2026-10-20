/**
 * Etapa 3 — modelo visual de Transferências por Canal, consolidado da tag YDUQS v1.0.0.
 * Origem: transferencias-por-canal/opcoesGraficos.ts,
 * components/TransferenciasPorCanalPage.tsx, components/EChart.tsx,
 * components/FocusModal.tsx e styles.css.
 * API/DAX, ranking de negócio e mocks são responsabilidades do integrador.
 */
import {useEffect,useMemo,useRef,useState} from "react";
import {BarChart} from "echarts/charts";
import {GridComponent,TooltipComponent} from "echarts/components";
import {init,use,type EChartsType} from "echarts/core";
import {CanvasRenderer} from "echarts/renderers";
import type {EChartsOption} from "echarts";
import "./transferencias-por-canal.css";

use([BarChart,GridComponent,TooltipComponent,CanvasRenderer]);
export type OrigemCanal="ura"|"iam";
export type TemaCanal="light"|"dark";
/** Participação é fração entre 0 e 1 calculada EXTERNAMENTE sobre o total
 * transferido da solução. Nunca recalcular sobre 'recebidas' ou o total de canais. */
export type LinhaTransferenciaCanal={
  canal:string;
  recebidas:number|null;
  transferidas:number|null;
  participacao:number|null;
};
export type SerieTransferenciasCanal={ranking:LinhaTransferenciaCanal[];totalTransferidas:number|null};
export type PropsTransferenciasPorCanal={
  series:Record<OrigemCanal,SerieTransferenciasCanal>;
  tema:TemaCanal;
  origemInicial?:OrigemCanal;
  titulo?:string;
  carregando?:boolean;
  erro?:string|null;
};
const cor="#01ABBD";
const inteiro=new Intl.NumberFormat("pt-BR",{maximumFractionDigits:0});
const percentual=new Intl.NumberFormat("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});

export function escaparCanal(valor:string):string{
  return valor.replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
}

/** Tooltip fiel à release YDUQS v1.0.0; dados fornecidos pelo dashboard. */
export function tooltipCanal(linha:LinhaTransferenciaCanal,denominador:number|null):string{
  const p=linha.participacao===null?"—":`${percentual.format(linha.participacao*100)}%`;
  const qtd=linha.transferidas===null?"Indisponível":inteiro.format(linha.transferidas);
  const rec=linha.recebidas===null?"—":inteiro.format(linha.recebidas);
  const den=denominador===null?"—":inteiro.format(denominador);
  return `<strong>${escaparCanal(linha.canal)}</strong>`+
    `<div style="margin-top:6px"><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${cor};margin-right:7px"></span>Transferidas: <strong>${qtd}</strong></div>`+
    `<div style="margin-top:3px">Recebidas: <strong>${rec}</strong></div>`+
    `<div>Representatividade: <strong>${p}</strong></div>`+
    `<div style="opacity:.76">Total transferidas da solução: <strong>${den}</strong></div>`;
}

/** Tooltip PAN: geometria, sombra e bordas homologadas, sem fonte licenciada. */
function estiloTooltipPan(escuro:boolean){return{
  trigger:"item" as const,
  confine:true,
  backgroundColor:escuro?"#0d1b2d":"#ffffff",
  borderColor:escuro?"rgba(130,171,222,.22)":"#e5e8eb",
  borderWidth:1,borderRadius:20,padding:[11,14],
  extraCssText:`box-shadow: 0 10px 28px ${escuro?"rgba(0,0,0,.34)":"rgba(22,43,62,.16)"}; border-radius:20px;`,
  textStyle:{color:escuro?"#f7f9fc":"#0d1317"},
};}

/** Original: barras de 18px à direita no card; colunas no foco.
 * Tooltip em body evita clipping dos scrolls. Não calcula percentuais. */
export function opcoesTransferenciasPorCanal(
  ranking:LinhaTransferenciaCanal[],denominador:number|null,escuro:boolean,foco=false,
):EChartsOption{
  const soft=escuro?"#AEBBD0":"#728193";
  const eixo=escuro?"rgba(174,187,208,.24)":"#DFE5EB";
  const gradiente=foco
    ?{type:"linear" as const,x:0,y:0,x2:0,y2:1,
      colorStops:[{offset:0,color:cor},{offset:1,color:escuro?"#399AA7":"#BDEEF2"}]}
    :{type:"linear" as const,x:0,y:0,x2:1,y2:0,
      colorStops:[{offset:0,color:escuro?"#399AA7":"#BDEEF2"},{offset:1,color:cor}]};
  const texto=(index:number)=>{
    const linha=ranking[index];return linha?tooltipCanal(linha,denominador):"";
  };
  const baseTooltip=estiloTooltipPan(escuro);
  const tip={...baseTooltip,renderMode:"html" as const,
    appendTo:"body" as const,confine:false,
    extraCssText:`${baseTooltip.extraCssText}z-index:200;`,
    formatter:(params:unknown)=>{
      if(!params||typeof params!=="object"||!("dataIndex" in params))return "";
      return texto(Number(params.dataIndex));
    },
  };
  if(foco){
    const curto=(label:string)=>label.length>22?`${label.slice(0,21)}…`:label;
    return {animationDuration:450,tooltip:tip,
      grid:{left:62,right:24,top:42,bottom:95,containLabel:false},
      xAxis:{type:"category",data:ranking.map(x=>x.canal),
        axisLabel:{color:soft,fontSize:11,rotate:26,interval:0,hideOverlap:false,formatter:curto},
        axisLine:{lineStyle:{color:eixo}},axisTick:{show:false},splitLine:{show:false}},
      yAxis:{type:"value",min:0,splitNumber:4,axisLabel:{color:soft,fontSize:11},
        axisTick:{show:false},axisLine:{show:false},splitLine:{show:false}},
      series:[{type:"bar",name:"Transferidas",data:ranking.map(x=>x.transferidas),barMaxWidth:72,
        itemStyle:{color:gradiente,borderRadius:[9,9,0,0]},
        emphasis:{focus:"self",itemStyle:{color:gradiente,borderWidth:2,borderColor:cor}},
        label:{show:true,position:"top",distance:8,color:soft,fontSize:11,
          formatter:(p:{value?:unknown})=>p.value===null||p.value===undefined?"":inteiro.format(Number(p.value))}}],
    };
  }
  return {animationDuration:450,tooltip:tip,
    grid:{left:112,right:60,top:10,bottom:10,containLabel:false},
    xAxis:{type:"value",show:false,min:0},
    yAxis:{type:"category",inverse:true,data:ranking.map(x=>x.canal),
      axisLine:{show:false},axisTick:{show:false},
      axisLabel:{color:soft,fontSize:11,width:98,margin:8,overflow:"truncate",align:"right"}},
    series:[{type:"bar",name:"Transferidas",barWidth:18,clip:false,
      data:ranking.map(x=>x.transferidas),
      itemStyle:{color:gradiente,borderRadius:[0,999,999,0]},
      emphasis:{focus:"self",itemStyle:{color:gradiente,borderColor:cor,borderWidth:2,
        shadowBlur:0,shadowOffsetX:0,shadowOffsetY:0}},
      label:{show:true,position:"right",distance:8,color:soft,fontSize:11,fontWeight:700,
        formatter:(p:{value?:unknown})=>p.value===null||p.value===undefined?"":inteiro.format(Number(p.value))}}],
  };
}

/** Ciclo de vida EChart original: resize no contêiner e descarte sem timers.
 * Importa o TSX real, nunca faz renderização aproximada de imagem ou SVG mock. */
function EChartCanal({option,className}:{option:EChartsOption;className:string}){
  const ref=useRef<HTMLDivElement|null>(null);
  const chartRef=useRef<EChartsType|null>(null);
  useEffect(()=>{
    const element=ref.current;if(!element)return;
    const chart=init(element);chartRef.current=chart;
    let resizeFrame=0,settleTimer=0;
    const resize=()=>{window.cancelAnimationFrame(resizeFrame);
      resizeFrame=window.requestAnimationFrame(()=>{
        if(!chart.isDisposed())chart.resize({animation:{duration:0}});
      });};
    const resizeAndSettle=()=>{
      resize();window.clearTimeout(settleTimer);settleTimer=window.setTimeout(resize,360);
    };
    const observer=new ResizeObserver(resizeAndSettle);
    observer.observe(element);
    if(element.parentElement)observer.observe(element.parentElement);
    window.addEventListener("resize",resizeAndSettle);
    resizeAndSettle();
    return()=>{
      window.cancelAnimationFrame(resizeFrame);window.clearTimeout(settleTimer);
      observer.disconnect();window.removeEventListener("resize",resizeAndSettle);
      chart.dispose();chartRef.current=null;
    };
  },[]);
  useEffect(()=>{
    const chart=chartRef.current;
    if(!chart||chart.isDisposed())return;
    chart.setOption(option,true);
    window.requestAnimationFrame(()=>{
      if(!chart.isDisposed())chart.resize({animation:{duration:0}});
    });
  },[option]);
  return <div ref={ref} className={className}/>;
}
function IconeFoco(){return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/></svg>;}

/** Um único modelo com seletor URA/IAM e o MESMO TSX no card e no foco. */
export function TransferenciasPorCanal({
  series,tema,origemInicial="ura",titulo="Transferências por Canal",carregando=false,erro=null,
}:PropsTransferenciasPorCanal){
  const [origem,setOrigem]=useState<OrigemCanal>(origemInicial);
  const [foco,setFoco]=useState(false);
  const fecharRef=useRef<HTMLButtonElement|null>(null);
  const escuro=tema==="dark";
  const {ranking,totalTransferidas}=series[origem];
  const opcoesCard=useMemo(()=>opcoesTransferenciasPorCanal(ranking,totalTransferidas,escuro),
    [ranking,totalTransferidas,escuro]);
  const opcoesFoco=useMemo(()=>opcoesTransferenciasPorCanal(ranking,totalTransferidas,escuro,true),
    [ranking,totalTransferidas,escuro]);
  useEffect(()=>{
    if(!foco)return;
    const anterior=document.activeElement instanceof HTMLElement?document.activeElement:null;
    const overflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    fecharRef.current?.focus();
    const aoTeclar=(e:KeyboardEvent)=>{if(e.key==="Escape")setFoco(false);};
    document.addEventListener("keydown",aoTeclar);
    return()=>{document.removeEventListener("keydown",aoTeclar);
      document.body.style.overflow=overflow;anterior?.focus();};
  },[foco]);
  const seletor=()=><div className="ds-tc-seletor" role="group" aria-label="Solução das transferências por canal">
    {(["ura","iam"] as const).map(chave=><button key={chave} type="button"
      className={`ds-tc-opcao ${chave===origem?"is-active":""}`} aria-pressed={chave===origem}
      onClick={()=>setOrigem(chave)}>{chave.toUpperCase()}</button>)}
  </div>;
  const conteudo=(modoFoco:boolean)=>{
    if(erro)return <div className="ds-tc-vazio" role="alert">Não foi possível carregar os canais: {erro}</div>;
    if(carregando)return <div className="ds-tc-vazio" role="status">Carregando canais…</div>;
    if(!ranking.length)return <div className="ds-tc-vazio" role="status">Sem canais retornados para o período.</div>;
    if(ranking.every(x=>x.transferidas===null))return <div className="ds-tc-vazio" role="status">Sem dados de transferências para esta solução.</div>;
    if(modoFoco){
      return <div className="ds-tc-foco-scroll" role="region" aria-label="Rolagem horizontal dos canais" tabIndex={0}>
        <div className="ds-tc-foco-plot" style={{minWidth:`${Math.max(640,ranking.length*82)}px`}}>
          <EChartCanal option={opcoesFoco} className="ds-tc-echart"/>
        </div>
      </div>;
    }
    return <div className="ds-tc-card-scroll" role="region" aria-label="Rolagem vertical dos canais" tabIndex={0}>
      <div className="ds-tc-card-plot" style={{height:`${Math.max(170,ranking.length*37+8)}px`}}>
        <EChartCanal option={opcoesCard} className="ds-tc-echart"/>
      </div>
    </div>;
  };
  return <div className="ds-tc-root" data-theme={tema}>
    <article className="ds-tc-card" aria-label={titulo}>
      <header className="ds-tc-cabecalho">
        <div className="ds-tc-titulo"><span className="ds-tc-kicker">CANAIS / TRANSFERÊNCIAS</span><h2>{titulo}</h2></div>
        <div className="ds-tc-acoes">{seletor()}<button type="button" className="ds-tc-botao-foco"
          title="Modo foco" aria-label="Abrir transferências por canal em modo foco"
          onClick={()=>setFoco(true)}><IconeFoco/></button></div>
      </header>
      <div className="ds-tc-corpo">{conteudo(false)}</div>
    </article>
    {foco&&<div className="ds-tc-backdrop" role="presentation" onMouseDown={()=>setFoco(false)}>
      <section className="ds-tc-modal" role="dialog" aria-modal="true" aria-labelledby="ds-tc-focus-title"
        onMouseDown={event=>event.stopPropagation()}>
        <header className="ds-tc-modal-head"><div><span className="ds-tc-kicker">MODO FOCO</span>
          <h2 id="ds-tc-focus-title">{titulo}</h2><p>Visualização ampliada do indicador</p></div>
          <div className="ds-tc-modal-acoes">{seletor()}
            <button ref={fecharRef} type="button" className="ds-tc-fechar"
              aria-label="Fechar modo foco" onClick={()=>setFoco(false)}>×</button>
          </div>
        </header>
        <div className="ds-tc-modal-corpo">{conteudo(true)}</div>
      </section>
    </div>}
  </div>;
}
