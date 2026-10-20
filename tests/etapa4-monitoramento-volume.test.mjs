import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const raiz=path.resolve(import.meta.dirname,"..");
const arquivo=path.join(raiz,"componentes/volumetria-monitoramento/VolumetriaMonitoramento.tsx");
const source=fs.readFileSync(arquivo,"utf8");
const saida=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,
  module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true},reportDiagnostics:true});
assert.equal(saida.diagnostics?.filter(x=>x.category===ts.DiagnosticCategory.Error).length,0);
const exports={};const module={exports};
const sandbox={module,exports,Intl,Date,Number,Math,Map,Array,Set,window:{},console,
  require(nome){
    if(nome.endsWith(".css"))return {};
    if(nome==="echarts/core")return {use(){},init(){throw Error("DOM fora do teste")}};
    if(nome.startsWith("echarts/"))return new Proxy({}, {get:()=>function(){}});
    if(nome==="react"||nome==="react/jsx-runtime")return new Proxy({}, {get:()=>()=>{}});
    throw Error(`Dependência inesperada: ${nome}`);
  }};
vm.runInNewContext(saida.outputText,sandbox,{filename:"VolumetriaMonitoramento.tsx"});
const {compactarMadrugadaVolumetria,agruparConsecutivosVolumetria,
  opcoesVolumetriaMonitoramento,comGuiaVolumetria,tooltipVolumetria,
  escaparTextoVolumetria}=module.exports;
const ponto=(h,n,ext={})=>({hourCode:h,recebidas:n,horasReferencia:[7,8,9],
  mediaTresHorasAnteriores:300,variacao:.17,estado:"normal",...ext});
const dados=[ponto(7,300),ponto(8,400),ponto(9,450),ponto(10,500)];
const opt=()=>opcoesVolumetriaMonitoramento(dados,false);
const series=(o)=>Array.from(o.series);

test("volume mantém linha PAN suave .23, espessura 3.5 e área vertical",()=>{
  const areas=series(opt()).filter(x=>String(x.id).startsWith("volume-area-"));
  assert.equal(areas.length,1);
  assert.equal(areas[0].smooth,.23);
  assert.equal(areas[0].smoothMonotone,"x");
  assert.equal(areas[0].lineStyle.width,3.5);
  assert.equal(areas[0].areaStyle.color.type,"linear");
  assert.equal(areas[0].areaStyle.color.y2,1);
});
test("marcadores reais 8px, madrugada 12px, com cores do tema",()=>{
  const a=[ponto(0,20),ponto(1,30),ponto(6,70),ponto(7,300)];
  const o=opcoesVolumetriaMonitoramento(a,true);
  const s=series(o).find(x=>x.id==="pontos-reais");
  assert.equal(s.symbolSize,8);
  assert.equal(s.data[0].symbolSize,12);
  assert.equal(s.data[1].symbolSize,8);
  assert.equal(s.data[0].value[1],120);
  assert.equal(s.data[0].itemStyle.borderWidth,2.2);
  assert.equal(o.tooltip.backgroundColor,"#0d1b2d");
});
test("madrugada 00–06 soma somente dados válidos e preserva a entrada",()=>{
  const a=[ponto(6,70),ponto(0,10),ponto(2,20),ponto(7,50)];
  const saida=compactarMadrugadaVolumetria(a);
  assert.deepEqual(Array.from(saida.map(x=>x.hourCode)),[6,7]);
  assert.equal(saida[0].value,100);
  assert.equal(saida[0].horasRegistradas,3);
  assert.equal(saida[0].ultimaHoraOriginal,6);
  assert.equal(a[0].recebidas,70);
});
test("BLANK na madrugada impede somatória parcial",()=>{
  const s=compactarMadrugadaVolumetria([ponto(0,10),ponto(2,null),ponto(6,70)]);
  assert.equal(s[0].value,null);
  assert.equal(s[0].horasRegistradas,3);
});
test("horas faltantes e BLANK dividem curva em grupos, sem inserir zeros",()=>{
  const a=[ponto(7,10),ponto(8,20),ponto(10,60),ponto(11,70),ponto(12,null),ponto(13,90),ponto(14,100)];
  const grupos=agruparConsecutivosVolumetria(compactarMadrugadaVolumetria(a));
  assert.deepEqual(JSON.parse(JSON.stringify(grupos)),[
    [[7,10],[8,20]],[[10,60],[11,70]],[[13,90],[14,100]]
  ]);
  assert.equal(a[4].recebidas,null);
});
test("zero explícito é ponto válido, ausências não ganham hora operacional",()=>{
  const a=[ponto(7,0),ponto(8,25),ponto(10,null)];
  const o=opcoesVolumetriaMonitoramento(a,false);
  assert.deepEqual(JSON.parse(JSON.stringify(series(o).find(x=>x.id==="pontos-reais").data.map(x=>x.value))),
    [[7,0],[8,25],[10,null]]);
  assert.equal(series(o).filter(x=>String(x.id).startsWith("volume-area")).length,1);
});
test("eixo horária original, madrugada agrupa rótulo 06h e Y mostra contagens",()=>{
  const p=[ponto(0,10),ponto(1,20),ponto(7,50),ponto(9,100)];
  const o=opcoesVolumetriaMonitoramento(p,false);
  assert.equal(o.xAxis.min,6);
  assert.equal(o.xAxis.axisLabel.formatter(6),"Madrugada");
  assert.equal(o.xAxis.axisLabel.formatter(9),"09h");
  assert.equal(o.yAxis.axisLabel.formatter(120),"120");
  assert.equal(o.grid.left,52);
});
test("tooltip por hora usa contexto H-3 pronto sem recalcular a regra",()=>{
  const a=ponto(10,480,{horasReferencia:[7,8,9],mediaTresHorasAnteriores:410,variacao:-.17,estado:"alerta"});
  const v=compactarMadrugadaVolumetria([a])[0];
  const html=tooltipVolumetria(v,a);
  assert.match(html,/Volume: <strong>480 chamadas/);
  assert.match(html,/3 horas anteriores: 07h, 08h, 09h/);
  assert.match(html,/Média: <strong>410,00 chamadas/);
  assert.match(html,/Variação: <strong>-17,00%/);
  assert.match(html,/Situação: <strong>Em alerta/);
  assert.equal(a.variacao,-.17);
});
test("sem referência é texto e nenhum alerta é calculado pelo gráfico",()=>{
  const p=ponto(7,240,{horasReferencia:[],mediaTresHorasAnteriores:null,variacao:null,estado:"sem-referencia"});
  const html=tooltipVolumetria(compactarMadrugadaVolumetria([p])[0],p);
  assert.match(html,/Não existem três horas anteriores/);
  assert.match(html,/Situação: <strong>Sem referência/);
  assert.equal(series(opcoesVolumetriaMonitoramento([p],false)).filter(x=>x.id==="limite-ath").length,0);
  assert.doesNotMatch(source,/\.limiteQueda|calcularVariacao|consultarPowerBi/);
});
test("tooltip da madrugada informa horas registradas e a natureza da soma",()=>{
  const v=compactarMadrugadaVolumetria([ponto(0,10),ponto(2,15),ponto(6,20)])[0];
  const html=tooltipVolumetria(v,undefined);
  assert.match(html,/Madrugada \(00h–06h\)/);
  assert.match(html,/Volume SOMADO/);
  assert.match(html,/3 horário\(s\) retornado\(s\)/);
  assert.match(html,/Não equivale a um intervalo único/);
});
test("guia pontilhada funciona no eixo e tooltip axis somente pontos-reais",()=>{
  const o=comGuiaVolumetria(opt(),true);
  assert.equal(o.tooltip.trigger,"axis");
  assert.equal(o.tooltip.axisPointer.type,"line");
  assert.equal(o.xAxis.axisPointer.lineStyle.type,"dashed");
  const msg=o.tooltip.formatter([{seriesId:"volume-area-0",data:[8,400]},
    {seriesId:"pontos-reais",data:{value:[8,400]}}]);
  assert.match(msg,/08:00 — Chamadas recebidas/);
  const blank=o.tooltip.formatter([{seriesId:"pontos-reais",data:{value:[8,null]}}]);
  assert.equal(blank,"");
});
test("HTML externo escapável, tooltip só exibe números e estados previstos",()=>{
  assert.equal(escaparTextoVolumetria('<b>"&'),"&lt;b&gt;&quot;&amp;");
  assert.equal(opt().tooltip.formatter({seriesId:"outra-serie",data:{value:[8,400]}}),"");
});
test("CSS inclui card, foco, tema claro/escuro, mobile e reduced motion",()=>{
  const css=fs.readFileSync(path.join(raiz,"componentes/volumetria-monitoramento/volumetria-monitoramento.css"),"utf8");
  for(const token of [".ds-mv-root",'data-theme="dark"',"ds-mv-modal", "ds-mv-echart",
    "@media(max-width:620px)","prefers-reduced-motion","--ds-mv-surface"])
    assert.ok(css.includes(token),token);
  assert.ok(!css.includes(".ds-tf-"));assert.ok(!css.includes(".ds-vl-"));assert.ok(!css.includes(".ds-tc-"));
});
test("mock externo não é importado no componente e demo preserva três modelos",()=>{
  const app=fs.readFileSync(path.join(raiz,"src/App.tsx"),"utf8");
  const mock=fs.readFileSync(path.join(raiz,"mock/monitoramento-volume.ts"),"utf8");
  for(const token of ["VolumetriaMonitoramento","TransferenciasPorCanal","GraficoLinhaVolume","GraficoLinhaTransferencias",
    "volumeMonitoramentoMock","volumeMonitoramentoLacunasMock"])
    assert.ok(app.includes(token),token);
  assert.match(mock,/volumeMonitoramentoLacunasMock/);
  assert.ok(!source.includes("../mock/"));
});
