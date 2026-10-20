/**
 * Etapa 5 — ATH acumulado por hora no Monitoramento YDUQS v1.0.0.
 * Origem: monitoramento/{opcoesGraficos,series}.ts, components/{MonitoramentoChart,
 * EChart,MonitoramentoCard,MonitoramentoFocusModal}.tsx e graficos/{tooltip-pan,
 * guia-vertical-pontilhada}.ts. Apenas visual: API, DAX e alarmística são externos.
 */
import {useEffect,useMemo,useRef,useState} from "react";
import {LineChart} from "echarts/charts";
import {GridComponent,TooltipComponent} from "echarts/components";
import {init,use,type EChartsType} from "echarts/core";
import {CanvasRenderer} from "echarts/renderers";
import type {EChartsOption} from "echarts";
import "./ath-monitoramento.css";

use([LineChart,GridComponent,TooltipComponent,CanvasRenderer]);

export type TemaAth="light"|"dark";
export type EstadoAth="normal"|"alerta"|"indisponivel";
/** A fonte entrega percentuais como FRAÇÃO (0,455 = 45,50%), nunca como 45,5.
 * Volumes acumulados, estado e limite também já vêm calculados do integrador. */
export type HoraAth={
  hourCode:number;
  percentualAcumulado:number|null;
  recebidasAcumuladas:number|null;
  transferidasAcumuladas:number|null;
  estado:EstadoAth;
};
export type PropsAthMonitoramento={
  pontos:HoraAth[];
  limiteDiario:number;
  tema:TemaAth;
  titulo?:string;
  carregando?:boolean;
  erro?:string|null;
};
export type PontoVisualAth={
  hourCode:number;value:number|null;madrugada:boolean;
  horasRegistradas:number;ultimaHoraOriginal:number;
};
export type TrechoAth={inicio:[number,number];fim:[number,number];faixa:"principal"|"alerta"};
export type PontoFaixaAth={hourCode:number;base:number;excesso:number};
const principal="#01ABBD";
const alerta="#DF4149";
const inteiro=new Intl.NumberFormat("pt-BR",{maximumFractionDigits:0});
const decimal=new Intl.NumberFormat("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
const estados:Record<EstadoAth,string>={normal:"Dentro do limite",alerta:"Em alerta",indisponivel:"Indisponível"};

/** Replica compactarMadrugada(...,"acumulado") da release: último percentual,
 * somente se TODOS os pontos retornados de 00–06h forem válidos. Nunca preenche horas. */
export function compactarMadrugadaAth(pontos:HoraAth[]):PontoVisualAth[]{
  const ordenados=[...pontos].sort((a,b)=>a.hourCode-b.hourCode);
  const madrugada=ordenados.filter(p=>p.hourCode>=0&&p.hourCode<=6);
  const seguintes=ordenados.filter(p=>p.hourCode>=7&&p.hourCode<=23);
  const visuais:PontoVisualAth[]=[];
  if(madrugada.length){
    const ultimo=madrugada.at(-1)!;
    const todosValidos=madrugada.every(p=>p.percentualAcumulado!==null&&Number.isFinite(p.percentualAcumulado));
    visuais.push({hourCode:6,value:todosValidos?ultimo.percentualAcumulado!*100:null,
      madrugada:true,horasRegistradas:madrugada.length,ultimaHoraOriginal:ultimo.hourCode});
  }
  return [...visuais,...seguintes.map(p=>({hourCode:p.hourCode,
    value:p.percentualAcumulado===null?null:p.percentualAcumulado*100,
    madrugada:false,horasRegistradas:1,ultimaHoraOriginal:p.hourCode}))];
}
/** Pontos não contíguos ou BLANK separam a curva e o preenchimento. */
export function agruparConsecutivosAth(pontos:PontoVisualAth[]):Array<Array<[number,number]>>{
  const grupos:Array<Array<[number,number]>>=[];
  let corrente:Array<[number,number]>=[];
  for(const p of [...pontos].sort((a,b)=>a.hourCode-b.hourCode)){
    if(p.value===null||!Number.isFinite(p.value)){
      if(corrente.length>=2)grupos.push(corrente);
      corrente=[];continue;
    }
    const anterior=corrente.at(-1);
    if(anterior&&p.hourCode!==anterior[0]+1){
      if(corrente.length>=2)grupos.push(corrente);
      corrente=[];
    }
    corrente.push([p.hourCode,p.value]);
  }
  if(corrente.length>=2)grupos.push(corrente);
  return grupos;
}
/** Geometria somente visual: recorta o traço exatamente no cruzamento do limite;
 * jamais pinta a porção abaixo do limite como alerta. */
export function dividirLinhaAth(pontos:PontoVisualAth[],limite:number):TrechoAth[]{
  const resultado:TrechoAth[]=[];
  const ordenados=[...pontos].sort((a,b)=>a.hourCode-b.hourCode);
  for(let i=1;i<ordenados.length;i++){
    const antes=ordenados[i-1]!,agora=ordenados[i]!;
    if(agora.hourCode!==antes.hourCode+1||antes.value===null||agora.value===null||
      !Number.isFinite(antes.value)||!Number.isFinite(agora.value))continue;
    const x1=antes.hourCode,x2=agora.hourCode,y1=antes.value,y2=agora.value;
    const acima1=y1>limite,acima2=y2>limite;
    if(acima1===acima2||y1===y2){
      resultado.push({inicio:[x1,y1],fim:[x2,y2],faixa:acima1?"alerta":"principal"});
      continue;
    }
    const cruzamento=x1+(limite-y1)/(y2-y1)*(x2-x1);
    resultado.push({inicio:[x1,y1],fim:[cruzamento,limite],faixa:acima1?"alerta":"principal"});
    resultado.push({inicio:[cruzamento,limite],fim:[x2,y2],faixa:acima2?"alerta":"principal"});
  }
  return resultado;
}
/** Áreas empilhadas sobre o eixo X: base até o limite e excesso acima dele.
 * Um cruzamento adiciona um ponto apenas à geometria, não à fonte operacional. */
export function faixasDeAreaAth(pontos:PontoVisualAth[],limite:number):PontoFaixaAth[][]{
  return agruparConsecutivosAth(pontos).map(grupo=>{
    const comCruzamentos:Array<[number,number]>=[grupo[0]!];
    for(let i=1;i<grupo.length;i++){
      const [x1,y1]=grupo[i-1]!,[x2,y2]=grupo[i]!;
      if((y1-limite)*(y2-limite)<0){
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
function gradiente(forte:string,fraca:string){return{
  type:"linear" as const,x:0,y:0,x2:0,y2:1,
  colorStops:[{offset:0,color:forte},{offset:1,color:fraca}],
};}
function estiloTooltipPan(escuro:boolean){return{
  trigger:"item" as const,confine:true,
  backgroundColor:escuro?"#0d1b2d":"#ffffff",
  borderColor:escuro?"rgba(130,171,222,.22)":"#e5e8eb",
  borderWidth:1,borderRadius:20,padding:[11,14],
  extraCssText:`box-shadow: 0 10px 28px ${escuro?"rgba(0,0,0,.34)":"rgba(22,43,62,.16)"}; border-radius:20px;`,
  textStyle:{color:escuro?"#f7f9fc":"#0d1317"},
};}
/** O tooltip NÃO recalcula taxas/volumes/estado. Na madrugada lê a última
 * hora original, e explicita que não é uma leitura de intervalo único. */
export function tooltipAth(p:PontoVisualAth,original:HoraAth|undefined,limiteDiario:number):string{
  const rotulo=p.madrugada?"Madrugada (00h–06h)":`${String(p.hourCode).padStart(2,"0")}:00`;
  const taxa=original?.percentualAcumulado===null||original?.percentualAcumulado===undefined?
    "—":`${decimal.format(original.percentualAcumulado*100)}%`;
  const recebidas=original?.recebidasAcumuladas===null||original?.recebidasAcumuladas===undefined?
    "—":inteiro.format(original.recebidasAcumuladas);
  const transferidas=original?.transferidasAcumuladas===null||original?.transferidasAcumuladas===undefined?
    "—":inteiro.format(original.transferidasAcumuladas);
  const situacao=original?estados[original.estado]:"Indisponível";
  const detalhe=p.madrugada?
    `<div style="font-size:11px;margin-top:4px">${p.horasRegistradas} horário(s) retornado(s); último: ${String(p.ultimaHoraOriginal).padStart(2,"0")}h · Não equivale a um intervalo único.</div>`:"";
  return `<strong>${rotulo} — Transferência ao Humano</strong>`+
    `<div style="margin-top:6px">ATH acumulado: <strong>${taxa}</strong></div>`+
    `<div style="margin-top:4px">Recebidas acumuladas: <strong>${recebidas}</strong></div>`+
    `<div style="margin-top:3px">Transferidas acumuladas: <strong>${transferidas}</strong></div>`+
    `<div style="margin-top:3px">Limite diário: <strong>${decimal.format(limiteDiario*100)}%</strong></div>`+
    `<div style="margin-top:4px">Situação: <strong>${situacao}</strong></div>`+detalhe;
}
/** Geometria original de opcoesMonitoramento(...,"ath") da release YDUQS. */
export function opcoesAthMonitoramento(pontosOriginais:HoraAth[],limiteDiario:number,escuro:boolean):EChartsOption{
  const pontos=compactarMadrugadaAth(pontosOriginais);
  const texto=escuro?"#AEBBD0":"#728193";
  const grade=escuro?"rgba(174,187,208,.12)":"#E6EBEF";
  const limite=limiteDiario*100;
  const validos=pontos.filter((p):p is PontoVisualAth&{value:number}=>p.value!==null&&Number.isFinite(p.value));
  const maior=Math.max(0,...validos.map(p=>p.value),limite);
  const tetoY=Math.min(100,Math.max(60,Math.ceil((maior+5)/10)*10));
  const horas=pontos.map(p=>p.hourCode);
  const inicio=horas.length?Math.min(...horas):7;
  const fim=horas.length?Math.max(...horas):7;
  const temMadrugada=pontos.some(p=>p.madrugada);
  const xMin=temMadrugada?6:Math.max(7,inicio-1);
  const xMax=Math.min(23,Math.max(xMin+1,fim+1));
  const originais=new Map(pontosOriginais.map(p=>[p.hourCode,p]));
  const visuais=new Map(pontos.map(p=>[p.hourCode,p]));
  const trechos=dividirLinhaAth(pontos,limite);
  const areas=faixasDeAreaAth(pontos,limite).flatMap((grupo,i)=>[{
    id:`ath-base-${i}`,type:"line" as const,stack:`ath-area-${i}`,silent:true,
    showSymbol:false,smooth:0,animationDuration:360,
    lineStyle:{width:0,opacity:0},
    areaStyle:{color:gradiente(escuro?"rgba(1,171,189,.40)":"rgba(1,171,189,.28)","rgba(1,171,189,.025)")},
    data:grupo.map(p=>[p.hourCode,p.base]),z:1,
  },{
    id:`ath-excesso-${i}`,type:"line" as const,stack:`ath-area-${i}`,silent:true,
    showSymbol:false,smooth:0,animationDuration:360,
    lineStyle:{width:0,opacity:0},
    areaStyle:{color:gradiente(escuro?"rgba(223,65,73,.52)":"rgba(223,65,73,.38)","rgba(223,65,73,.11)")},
    data:grupo.map(p=>[p.hourCode,p.excesso]),z:2,
  }]);
  const linhas=trechos.map((p,i)=>({
    id:`ath-linha-${i}`,type:"line" as const,silent:true,smooth:0,showSymbol:false,
    animationDuration:360,lineStyle:{width:3.5,color:p.faixa==="alerta"?alerta:principal,cap:"round" as const},
    data:[p.inicio,p.fim],z:3,
  }));
  return {animationDuration:400,
    grid:{left:52,right:18,top:22,bottom:45,containLabel:false},
    xAxis:{type:"value",min:xMin,max:xMax,interval:xMax-xMin>12?2:1,
      axisLabel:{color:texto,fontSize:11,hideOverlap:true,showMinLabel:true,
        formatter:(n:number)=>temMadrugada&&n===6?"Madrugada":`${String(n).padStart(2,"0")}h`},
      axisLine:{lineStyle:{color:grade}},axisTick:{show:false},splitLine:{show:false}},
    yAxis:{type:"value",min:0,max:tetoY,splitNumber:5,
      axisLabel:{color:texto,fontSize:11,formatter:(n:number)=>`${n}%`},
      axisLine:{show:false},axisTick:{show:false},splitLine:{lineStyle:{color:grade,type:"dashed" as const}}},
    tooltip:{...estiloTooltipPan(escuro),formatter:(entrada:unknown)=>{
      const params=Array.isArray(entrada)?entrada:[entrada];
      const correto=params.find((x):x is {seriesId:string;data:{value:[number,number|null]}}=>
        !!x&&typeof x==="object"&&"seriesId" in x&&x.seriesId==="pontos-reais"&&
        "data" in x&&!!x.data&&typeof x.data==="object"&&"value" in x.data&&
        Array.isArray(x.data.value)&&x.data.value[1]!==null&&x.data.value[1]!==undefined);
      const hora=correto?.data.value[0];
      if(typeof hora!=="number")return "";
      const ponto=visuais.get(hora);
      return ponto?tooltipAth(ponto,originais.get(ponto.ultimaHoraOriginal),limiteDiario):"";
    }},
    series:[...areas,...linhas,{
      id:"limite-ath",type:"line" as const,silent:true,showSymbol:false,
      data:[[xMin,limite],[xMax,limite]],
      lineStyle:{type:"dashed" as const,width:1.5,color:escuro?"#F0A1A6":"#DCA0A3"},z:2,
    },{
      id:"pontos-reais",name:"ATH acumulado",type:"line" as const,showSymbol:true,
      symbol:"circle",symbolSize:8,smooth:0,lineStyle:{opacity:0,width:0},
      itemStyle:{borderColor:escuro?"#0D1B2D":"#FFF",borderWidth:1.5},
      data:pontos.map(p=>({value:[p.hourCode,p.value],madrugada:p.madrugada,
        horasRegistradas:p.horasRegistradas,ultimaHoraOriginal:p.ultimaHoraOriginal,
        symbolSize:p.madrugada?12:8,
        itemStyle:{color:p.value!==null&&p.value>limite?alerta:principal,
          borderColor:p.madrugada?(escuro?"#EAFBFC":"#086B75"):(escuro?"#0D1B2D":"#FFF"),
          borderWidth:p.madrugada?2.2:1.5},
      })),z:5,
    }],
  };
}
/** Guia vertical pontilhada PAN: axisPointer no eixo numérico; tooltip somente
 * da série 'pontos-reais', não das áreas silenciosas nem dos trechos de cor. */
export function comGuiaAth(opcao:EChartsOption,escuro:boolean):EChartsOption{
  const x=opcao.xAxis,t=opcao.tooltip;
  if(!x||Array.isArray(x)||typeof x!=="object"||!t||Array.isArray(t)||typeof t!=="object")return opcao;
  const pointer={show:true,type:"line" as const,snap:true,
    lineStyle:{color:escuro?"#748BA2":"#9BAFBD",type:"dashed" as const,width:1.2,opacity:.95}};
  return {...opcao,xAxis:{...x,axisPointer:pointer},tooltip:{...t,
    trigger:"axis" as const,triggerOn:"mousemove",axisPointer:pointer}};
}
function EChartAth({option}:{option:EChartsOption}){
  const ref=useRef<HTMLDivElement|null>(null);
  const chartRef=useRef<EChartsType|null>(null);
  useEffect(()=>{
    const el=ref.current;if(!el)return;
    const chart=init(el);chartRef.current=chart;
    let frame=0,settle=0;
    const resize=()=>{window.cancelAnimationFrame(frame);frame=window.requestAnimationFrame(()=>{
      if(!chart.isDisposed())chart.resize({animation:{duration:0}});
    });};
    const agendar=()=>{resize();window.clearTimeout(settle);settle=window.setTimeout(resize,360);};
    const observer=new ResizeObserver(agendar);
    observer.observe(el);if(el.parentElement)observer.observe(el.parentElement);
    window.addEventListener("resize",agendar);agendar();
    return()=>{window.cancelAnimationFrame(frame);window.clearTimeout(settle);
      observer.disconnect();window.removeEventListener("resize",agendar);chart.dispose();chartRef.current=null;};
  },[]);
  useEffect(()=>{const chart=chartRef.current;if(chart&&!chart.isDisposed()){
    chart.setOption(option,true);
    window.requestAnimationFrame(()=>{if(!chart.isDisposed())chart.resize({animation:{duration:0}});});
  }},[option]);
  return <div ref={ref} className="ds-ma-echart"/>;
}
function IconeFoco(){return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/></svg>;}
/** Mesma opção ECharts no card e foco. Nenhum mock, polling, DAX ou cálculo de alerta. */
export function AthMonitoramento({pontos,limiteDiario,tema,
  titulo="Evolução do % ATH Acumulado por Hora",carregando=false,erro=null}:PropsAthMonitoramento){
  const [foco,setFoco]=useState(false);
  const fecharRef=useRef<HTMLButtonElement|null>(null);
  const escuro=tema==="dark";
  const opcao=useMemo(()=>comGuiaAth(opcoesAthMonitoramento(pontos,limiteDiario,escuro),escuro),
    [pontos,limiteDiario,escuro]);
  const madrugada=pontos.some(p=>p.hourCode>=0&&p.hourCode<=6);
  const ultimo=pontos.length?Math.max(...pontos.map(p=>p.hourCode)):null;
  const limitePct=Number.isInteger(limiteDiario*100)?`${limiteDiario*100}%`:`${decimal.format(limiteDiario*100)}%`;
  useEffect(()=>{if(!foco)return;
    const anterior=document.activeElement instanceof HTMLElement?document.activeElement:null;
    const overflow=document.body.style.overflow;document.body.style.overflow="hidden";
    fecharRef.current?.focus();
    const aoTeclar=(e:KeyboardEvent)=>{if(e.key==="Escape")setFoco(false);};
    document.addEventListener("keydown",aoTeclar);
    return()=>{document.removeEventListener("keydown",aoTeclar);document.body.style.overflow=overflow;anterior?.focus();};
  },[foco]);
  const corpo=()=>erro?<div className="ds-ma-vazio" role="alert">Não foi possível carregar ATH: {erro}</div>:
    carregando?<div className="ds-ma-vazio" role="status">Carregando evolução horária…</div>:
    !pontos.length?<div className="ds-ma-vazio" role="status">Não há horários disponíveis para este dia.</div>:
    <EChartAth option={opcao}/>;
  const nota=()=>!erro&&!carregando&&pontos.length>0&&<div className="ds-ma-nota">
    <span>{ultimo!==null?`Último intervalo: ${String(ultimo).padStart(2,"0")}:00`:"Nenhuma hora disponível"}</span>
    {madrugada&&<span>Madrugada (00h–06h): ATH acumulado</span>}
    <span><i className="ds-ma-legenda"/>Até {limitePct}<i className="ds-ma-legenda is-danger"/>Acima de {limitePct}</span>
  </div>;
  return <div className="ds-ma-root" data-theme={tema}>
    <article className="ds-ma-card" aria-label={titulo}>
      <header className="ds-ma-header"><div><span className="ds-ma-kicker">TRANSFERÊNCIA ATH · MONITORAMENTO</span>
        <h2>{titulo}</h2></div>
        <button type="button" className="ds-ma-botao-foco" title="Modo foco"
          aria-label="Abrir ATH do monitoramento em modo foco" onClick={()=>setFoco(true)}><IconeFoco/></button>
      </header>
      <div className="ds-ma-chart-head"><span>Transferência acumulada por hora</span><span className="ds-ma-limite">Limite: {limitePct}</span></div>
      <div className="ds-ma-corpo">{corpo()}</div>{nota()}
    </article>
    {foco&&<div className="ds-ma-backdrop" role="presentation" onMouseDown={()=>setFoco(false)}>
      <section className="ds-ma-modal" role="dialog" aria-modal="true" aria-labelledby="ds-ma-titulo-foco"
        onMouseDown={e=>e.stopPropagation()}>
        <header className="ds-ma-modal-head"><div><span className="ds-ma-kicker">MODO FOCO</span>
          <h2 id="ds-ma-titulo-foco">{titulo}</h2><p>Visualização ampliada do indicador</p></div>
          <button ref={fecharRef} type="button" className="ds-ma-fechar" aria-label="Fechar modo foco"
            onClick={()=>setFoco(false)}>×</button>
        </header>
        <div className="ds-ma-modal-corpo"><div className="ds-ma-modal-grafico">
          <div className="ds-ma-chart-head"><span>Transferência acumulada por hora</span><span className="ds-ma-limite">Limite: {limitePct}</span></div>
          {corpo()}{nota()}
        </div></div>
      </section>
    </div>}
  </div>;
}
