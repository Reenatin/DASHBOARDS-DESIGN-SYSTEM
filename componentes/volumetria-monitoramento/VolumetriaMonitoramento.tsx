/**
 * Etapa 4 — Volumetria por hora no Monitoramento YDUQS v1.0.0.
 * Origem: monitoramento/opcoesGraficos.ts, monitoramento/series.ts,
 * componentes/MonitoramentoChart.tsx, EChart.tsx, MonitoramentoCard.tsx,
 * FocusModal.tsx e graficos/{tooltip-pan,guia-vertical-pontilhada}.ts.
 * Regras H-3, alertas, APIs e DAX são externos a este modelo visual.
 */
import {useEffect,useMemo,useRef,useState} from "react";
import {LineChart} from "echarts/charts";
import {GridComponent,TooltipComponent} from "echarts/components";
import {init,use,type EChartsType} from "echarts/core";
import {CanvasRenderer} from "echarts/renderers";
import type {EChartsOption} from "echarts";
import "./volumetria-monitoramento.css";

use([LineChart,GridComponent,TooltipComponent,CanvasRenderer]);
export type TemaVolumetria="light"|"dark";
export type EstadoVolumetria="normal"|"alerta"|"sem-referencia"|"indisponivel";
/** Campos de contexto oficiais chegam do integrador. `variacao` é fração, não porcentagem. */
export type HoraVolumetria={
  hourCode:number;
  recebidas:number|null;
  horasReferencia:number[];
  mediaTresHorasAnteriores:number|null;
  variacao:number|null;
  estado:EstadoVolumetria;
};
export type PropsVolumetriaMonitoramento={
  pontos:HoraVolumetria[];
  tema:TemaVolumetria;
  titulo?:string;
  carregando?:boolean;
  erro?:string|null;
};
export type PontoVisualVolumetria={
  hourCode:number;value:number|null;madrugada:boolean;
  horasRegistradas:number;ultimaHoraOriginal:number;
};
const corMarca="#01ABBD";
const inteiros=new Intl.NumberFormat("pt-BR",{maximumFractionDigits:0});
const decimais=new Intl.NumberFormat("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
export function escaparTextoVolumetria(valor:string):string{
  return valor.replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
}

/** Agrupamento é APENAS visual, replica `compactarMadrugada(...,'somar')`.
 * Uma ausência no bloco 00–06h torna seu total BLANK, sem inventar volume. */
export function compactarMadrugadaVolumetria(pontos:HoraVolumetria[]):PontoVisualVolumetria[]{
  const ordenados=[...pontos].sort((a,b)=>a.hourCode-b.hourCode);
  const madrugada=ordenados.filter(p=>p.hourCode>=0&&p.hourCode<=6);
  const seguintes=ordenados.filter(p=>p.hourCode>=7&&p.hourCode<=23);
  const resultado:PontoVisualVolumetria[]=[];
  if(madrugada.length){
    const ultimo=madrugada.at(-1)!;
    const validos=madrugada.every(p=>p.recebidas!==null&&Number.isFinite(p.recebidas));
    const total=validos?madrugada.reduce<number>((a,p)=>a+p.recebidas!,0):null;
    resultado.push({hourCode:6,value:total,madrugada:true,
      horasRegistradas:madrugada.length,ultimaHoraOriginal:ultimo.hourCode});
  }
  resultado.push(...seguintes.map(p=>({hourCode:p.hourCode,value:p.recebidas,
    madrugada:false,horasRegistradas:1,ultimaHoraOriginal:p.hourCode})));
  return resultado;
}
/** A curva não atravessa horas faltantes nem valores BLANK (fonte `series.ts`). */
export function agruparConsecutivosVolumetria(pontos:PontoVisualVolumetria[]):Array<Array<[number,number]>>{
  const grupos:Array<Array<[number,number]>>=[];
  let atual:Array<[number,number]>=[];
  for(const ponto of [...pontos].sort((a,b)=>a.hourCode-b.hourCode)){
    if(ponto.value===null||!Number.isFinite(ponto.value)){
      if(atual.length>=2)grupos.push(atual);
      atual=[];continue;
    }
    const anterior=atual.at(-1);
    if(anterior&&ponto.hourCode!==anterior[0]+1){
      if(atual.length>=2)grupos.push(atual);
      atual=[];
    }
    atual.push([ponto.hourCode,ponto.value]);
  }
  if(atual.length>=2)grupos.push(atual);
  return grupos;
}
function gradiente(forte:string,fraco:string){return{
  type:"linear" as const,x:0,y:0,x2:0,y2:1,
  colorStops:[{offset:0,color:forte},{offset:1,color:fraco}],
};}
function estiloTooltipPan(escuro:boolean){return{
  trigger:"item" as const,confine:true,
  backgroundColor:escuro?"#0d1b2d":"#ffffff",
  borderColor:escuro?"rgba(130,171,222,.22)":"#e5e8eb",
  borderWidth:1,borderRadius:20,padding:[11,14],
  extraCssText:`box-shadow: 0 10px 28px ${escuro?"rgba(0,0,0,.34)":"rgba(22,43,62,.16)"}; border-radius:20px;`,
  textStyle:{color:escuro?"#f7f9fc":"#0d1317"},
};}
/** Formata APENAS valores já calculados pela fonte; não decide o alerta. */
export function tooltipVolumetria(p:PontoVisualVolumetria,original:HoraVolumetria|undefined):string{
  const rotulo=p.madrugada?"Madrugada (00h–06h)":`${String(p.hourCode).padStart(2,"0")}:00`;
  const volume=p.value===null?"Indisponível (BLANK)":`${inteiros.format(p.value)} chamadas`;
  if(p.madrugada){
    const detalhe=`${p.horasRegistradas} horário(s) retornado(s); último: ${String(p.ultimaHoraOriginal).padStart(2,"0")}h`;
    return `<strong>${rotulo} — Chamadas recebidas</strong>`+
      `<div style="margin-top:6px">Volume SOMADO de 00h a 06h: <strong>${volume}</strong></div>`+
      `<div style="font-size:11px;margin-top:4px">${detalhe} · Não equivale a um intervalo único.</div>`;
  }
  if(!original)return `<strong>${rotulo}</strong><div>Leitura indisponível</div>`;
  const horas=original.horasReferencia.length===3
    ?original.horasReferencia.map(h=>`${String(h).padStart(2,"0")}h`).join(", ")
    :"Não existem três horas anteriores neste dia";
  const media=original.mediaTresHorasAnteriores===null?"—":`${decimais.format(original.mediaTresHorasAnteriores)} chamadas`;
  const variacao=original.variacao===null?"—":`${original.variacao>0?"+":""}${decimais.format(original.variacao*100)}%`;
  const estados:Record<EstadoVolumetria,string>={
    normal:"Dentro do limite",alerta:"Em alerta",
    "sem-referencia":"Sem referência",indisponivel:"Indisponível",
  };
  const motivo=original.estado==="sem-referencia"?" (faltam horas de referência)":
    original.estado==="indisponivel"?" (valor ausente ou média igual a zero)":"";
  return `<strong>${rotulo} — Chamadas recebidas</strong>`+
    `<div style="margin-top:6px">Volume: <strong>${volume}</strong></div>`+
    `<div style="margin-top:4px">3 horas anteriores: ${horas}</div>`+
    `<div style="margin-top:3px">Média: <strong>${media}</strong></div>`+
    `<div style="margin-top:3px">Variação: <strong>${variacao}</strong></div>`+
    `<div style="margin-top:4px">Situação: <strong>${estados[original.estado]}</strong>${motivo}</div>`;
}

/** Geometria e séries de `opcoesMonitoramento(...,'volume')` da tag YDUQS v1.0.0. */
export function opcoesVolumetriaMonitoramento(pontosOriginais:HoraVolumetria[],escuro:boolean):EChartsOption{
  const pontos=compactarMadrugadaVolumetria(pontosOriginais);
  const texto=escuro?"#AEBBD0":"#728193";
  const grade=escuro?"rgba(174,187,208,.12)":"#E6EBEF";
  const validos=pontos.filter((p):p is PontoVisualVolumetria&{value:number}=>
    p.value!==null&&Number.isFinite(p.value));
  const maior=Math.max(0,...validos.map(p=>p.value));
  const tetoY=Math.max(10,Math.ceil(maior*1.15/100)*100);
  const horas=pontos.map(p=>p.hourCode);
  const inicio=horas.length?Math.min(...horas):7;
  const fim=horas.length?Math.max(...horas):7;
  const temMadrugada=pontos.some(p=>p.madrugada);
  const xMin=temMadrugada?6:Math.max(7,inicio-1);
  const xMax=Math.min(23,Math.max(xMin+1,fim+1));
  const originais=new Map(pontosOriginais.map(p=>[p.hourCode,p]));
  const mapaVisual=new Map(pontos.map(p=>[p.hourCode,p]));
  const areas=agruparConsecutivosVolumetria(pontos).map((grupo,i)=>({
    id:`volume-area-${i}`,type:"line" as const,silent:true,smooth:.23,
    smoothMonotone:"x" as const,showSymbol:false,animationDuration:360,
    lineStyle:{width:3.5,color:corMarca,cap:"round" as const},
    areaStyle:{color:gradiente(escuro?"rgba(1,171,189,.42)":"rgba(1,171,189,.29)","rgba(1,171,189,.015)")},
    data:grupo,z:2,
  }));
  return {animationDuration:400,
    grid:{left:52,right:18,top:22,bottom:45,containLabel:false},
    xAxis:{type:"value",min:xMin,max:xMax,interval:xMax-xMin>12?2:1,
      axisLabel:{color:texto,fontSize:11,hideOverlap:true,showMinLabel:true,
        formatter:(n:number)=>temMadrugada&&n===6?"Madrugada":`${String(n).padStart(2,"0")}h`},
      axisLine:{lineStyle:{color:grade}},axisTick:{show:false},splitLine:{show:false}},
    yAxis:{type:"value",min:0,max:tetoY,splitNumber:5,
      axisLabel:{color:texto,fontSize:11,formatter:(n:number)=>new Intl.NumberFormat("pt-BR",{
        notation:n>=10000?"compact":"standard",maximumFractionDigits:0}).format(n)},
      axisLine:{show:false},axisTick:{show:false},splitLine:{lineStyle:{color:grade,type:"dashed"}}},
    tooltip:{...estiloTooltipPan(escuro),
      formatter:(value:unknown)=>{
        const params=Array.isArray(value)?value:[value];
        const correto=params.find((p):p is {seriesId:string;data:{value:[number,number|null]}}=>
          !!p&&typeof p==="object"&&"seriesId" in p&&p.seriesId==="pontos-reais"&&
          "data" in p&&!!p.data&&typeof p.data==="object"&&"value" in p.data&&
          Array.isArray(p.data.value)&&p.data.value[1]!==null&&p.data.value[1]!==undefined);
        const hora=correto?.data.value[0];
        if(typeof hora!=="number")return "";
        const ponto=mapaVisual.get(hora);
        return ponto?tooltipVolumetria(ponto,originais.get(ponto.ultimaHoraOriginal)):"";
      },
    },
    series:[...areas,{
      id:"pontos-reais",name:"Chamadas recebidas",type:"line" as const,
      showSymbol:true,symbol:"circle",symbolSize:8,smooth:0,
      lineStyle:{opacity:0,width:0},
      itemStyle:{borderColor:escuro?"#0D1B2D":"#FFF",borderWidth:1.5},
      data:pontos.map(p=>({value:[p.hourCode,p.value],madrugada:p.madrugada,
        horasRegistradas:p.horasRegistradas,ultimaHoraOriginal:p.ultimaHoraOriginal,
        symbolSize:p.madrugada?12:8,
        itemStyle:{color:corMarca,borderColor:p.madrugada?(escuro?"#EAFBFC":"#086B75"):
          (escuro?"#0D1B2D":"#FFF"),borderWidth:p.madrugada?2.2:1.5},
      })),z:5,
    }],
  };
}
/** guia-vertical-pontilhada.ts aplicado somente à série com dados reais. */
export function comGuiaVolumetria(opcao:EChartsOption,escuro:boolean):EChartsOption{
  const x=opcao.xAxis,t=opcao.tooltip;
  if(!x||Array.isArray(x)||typeof x!=="object"||!t||Array.isArray(t)||typeof t!=="object")return opcao;
  const pointer={show:true,type:"line" as const,snap:true,
    lineStyle:{color:escuro?"#748BA2":"#9BAFBD",type:"dashed" as const,width:1.2,opacity:.95}};
  return {...opcao,xAxis:{...x,axisPointer:pointer},tooltip:{...t,trigger:"axis" as const,
    triggerOn:"mousemove",axisPointer:pointer}};
}
function GraficoEChartMonitoramento({option}:{option:EChartsOption}){
  const elRef=useRef<HTMLDivElement|null>(null);
  const chartRef=useRef<EChartsType|null>(null);
  useEffect(()=>{
    const el=elRef.current;if(!el)return;
    const chart=init(el);chartRef.current=chart;
    let frame=0,settle=0;
    const resize=()=>{window.cancelAnimationFrame(frame);frame=window.requestAnimationFrame(()=>{
      if(!chart.isDisposed())chart.resize({animation:{duration:0}});
    });};
    const resizeAndSettle=()=>{resize();window.clearTimeout(settle);settle=window.setTimeout(resize,360);};
    const observer=new ResizeObserver(resizeAndSettle);
    observer.observe(el);if(el.parentElement)observer.observe(el.parentElement);
    window.addEventListener("resize",resizeAndSettle);resizeAndSettle();
    return()=>{window.cancelAnimationFrame(frame);window.clearTimeout(settle);observer.disconnect();
      window.removeEventListener("resize",resizeAndSettle);chart.dispose();chartRef.current=null;};
  },[]);
  useEffect(()=>{const chart=chartRef.current;
    if(chart&&!chart.isDisposed()){
      chart.setOption(option,true);
      window.requestAnimationFrame(()=>{if(!chart.isDisposed())chart.resize({animation:{duration:0}});});
    }
  },[option]);
  return <div ref={elRef} className="ds-mv-echart"/>;
}
function IconeFoco(){return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/></svg>;}
/** Apenas o gráfico visual isolado; KPI, alerta e referência H-3 seguem externos. */
export function VolumetriaMonitoramento({pontos,tema,titulo="Evolução de Chamadas por Hora",
  carregando=false,erro=null}:PropsVolumetriaMonitoramento){
  const [foco,setFoco]=useState(false);
  const closeRef=useRef<HTMLButtonElement|null>(null);
  const temHorarios=pontos.length>0;
  const escuro=tema==="dark";
  const opcao=useMemo(()=>comGuiaVolumetria(opcoesVolumetriaMonitoramento(pontos,escuro),escuro),[pontos,escuro]);
  const madrugada=pontos.some(p=>p.hourCode>=0&&p.hourCode<=6);
  const ultimo=pontos.length?Math.max(...pontos.map(p=>p.hourCode)):null;
  useEffect(()=>{if(!foco)return;
    const anterior=document.activeElement instanceof HTMLElement?document.activeElement:null;
    const overflow=document.body.style.overflow;document.body.style.overflow="hidden";
    closeRef.current?.focus();
    const aoTeclar=(e:KeyboardEvent)=>{if(e.key==="Escape")setFoco(false);};
    document.addEventListener("keydown",aoTeclar);
    return()=>{document.removeEventListener("keydown",aoTeclar);document.body.style.overflow=overflow;anterior?.focus();};
  },[foco]);
  const corpo=()=>erro?<div className="ds-mv-vazio" role="alert">Não foi possível carregar a evolução: {erro}</div>:
    carregando?<div className="ds-mv-vazio" role="status">Carregando evolução horária…</div>:
    !temHorarios?<div className="ds-mv-vazio" role="status">Não há horários disponíveis para este dia.</div>:
    <GraficoEChartMonitoramento option={opcao}/>;
  const nota=()=>!erro&&!carregando&&temHorarios&&<div className="ds-mv-nota">
    <span>{ultimo!==null?`Último intervalo: ${String(ultimo).padStart(2,"0")}:00`:"Nenhuma hora disponível"}</span>
    {madrugada&&<span>Madrugada (00h–06h): volume somado</span>}
    <span className="ds-mv-referencia">Referência: 3 horas anteriores</span>
  </div>;
  return <div className="ds-mv-root" data-theme={tema}>
    <article className="ds-mv-card" aria-label={titulo}>
      <header className="ds-mv-header"><div><span className="ds-mv-kicker">VOLUMETRIA · MONITORAMENTO</span><h2>{titulo}</h2></div>
        <button type="button" className="ds-mv-botao-foco" title="Modo foco" aria-label="Abrir volumetria em modo foco" onClick={()=>setFoco(true)}><IconeFoco/></button>
      </header>
      <div className="ds-mv-corpo">{corpo()}</div>{nota()}
    </article>
    {foco&&<div className="ds-mv-backdrop" role="presentation" onMouseDown={()=>setFoco(false)}>
      <section className="ds-mv-modal" role="dialog" aria-modal="true" aria-labelledby="ds-mv-titulo-foco" onMouseDown={e=>e.stopPropagation()}>
        <header className="ds-mv-modal-head"><div><span className="ds-mv-kicker">MODO FOCO</span>
          <h2 id="ds-mv-titulo-foco">{titulo}</h2><p>Visualização ampliada do indicador</p></div>
          <button ref={closeRef} type="button" className="ds-mv-fechar" aria-label="Fechar modo foco" onClick={()=>setFoco(false)}>×</button>
        </header><div className="ds-mv-modal-corpo"><div className="ds-mv-modal-grafico">{corpo()}{nota()}</div></div>
      </section>
    </div>}
  </div>;
}
