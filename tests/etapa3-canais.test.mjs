import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const raiz=path.resolve(import.meta.dirname,"..");
const arquivo=path.join(raiz,"componentes/transferencias-por-canal/TransferenciasPorCanal.tsx");
const source=fs.readFileSync(arquivo,"utf8");
const compilado=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,
  module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true},
  reportDiagnostics:true});
const erros=compilado.diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error)||[];
assert.equal(erros.length,0,"TSX deve transpilar sem erro sintático");
const exports={};const module={exports};
const sandbox={module,exports,Intl,Date,Number,Math,Map,Array,Set,window:{},console,
  require(name){
    if(name.endsWith(".css"))return {};
    if(name==="echarts/core")return {use(){},init(){throw Error("DOM fora do teste")}};
    if(name.startsWith("echarts/"))return new Proxy({}, {get:()=>function(){}});
    if(name==="react"||name==="react/jsx-runtime")return new Proxy({}, {get:()=>()=>{}});
    throw Error(`Dependência inesperada: ${name}`);
  }};
vm.runInNewContext(compilado.outputText,sandbox,{filename:"TransferenciasPorCanal.tsx"});
const {opcoesTransferenciasPorCanal,tooltipCanal,escaparCanal}=module.exports;
const ranking=[
  {canal:"Canal A",recebidas:120,transferidas:30,participacao:.15},
  {canal:"Canal longo do atendimento digital",recebidas:40,transferidas:0,participacao:0},
  {canal:"Sem dado",recebidas:null,transferidas:null,participacao:null},
];
const opCard=()=>opcoesTransferenciasPorCanal(ranking,200,false,false);
const opFoco=()=>opcoesTransferenciasPorCanal(ranking,200,false,true);

test("card usa barra horizontal de 18px com eixo category invertido",()=>{
  const op=opCard();assert.equal(op.series[0].type,"bar");
  assert.equal(op.series[0].barWidth,18);
  assert.equal(op.xAxis.type,"value");assert.equal(op.yAxis.type,"category");
  assert.equal(op.yAxis.inverse,true);assert.equal(op.grid.left,112);
  assert.equal(op.series[0].label.position,"right");
});
test("card preserva gradiente forte à direita e extremidade arredondada",()=>{
  const gradient=opCard().series[0].itemStyle.color;
  assert.equal(gradient.x2,1);assert.equal(gradient.y2,0);
  assert.equal(gradient.colorStops[1].color,"#01ABBD");
  assert.deepEqual(Array.from(opCard().series[0].itemStyle.borderRadius),[0,999,999,0]);
});
test("modo foco usa colunas independentes com rótulos e rolagem horizontal",()=>{
  const op=opFoco();assert.equal(op.series[0].type,"bar");
  assert.equal(op.series[0].barMaxWidth,72);
  assert.equal(op.xAxis.type,"category");assert.equal(op.yAxis.type,"value");
  assert.equal(op.xAxis.axisLabel.rotate,26);assert.equal(op.series[0].label.position,"top");
  assert.equal(op.grid.bottom,95);
  assert.deepEqual(Array.from(op.series[0].itemStyle.borderRadius),[9,9,0,0]);
});
test("foco mantém gradiente forte no topo",()=>{
  const gradient=opFoco().series[0].itemStyle.color;
  assert.equal(gradient.x2,0);assert.equal(gradient.y2,1);
  assert.equal(gradient.colorStops[0].color,"#01ABBD");
});
test("ambos tooltips são HTML em body, sem confinar a área de scroll",()=>{
  for(const op of [opCard(),opFoco()]){
    assert.equal(op.tooltip.renderMode,"html");
    assert.equal(op.tooltip.appendTo,"body");
    assert.equal(op.tooltip.confine,false);
    assert.match(op.tooltip.extraCssText,/z-index:200/);
    assert.equal(op.tooltip.trigger,"item");
  }
});
test("tooltip preserva dados externos: recebidas, transferidas, fração e total da solução",()=>{
  const html=opCard().tooltip.formatter({dataIndex:0});
  assert.match(html,/Canal A/);assert.match(html,/Transferidas: <strong>30/);
  assert.match(html,/Recebidas: <strong>120/);assert.match(html,/Representatividade: <strong>15,00%/);
  assert.match(html,/Total transferidas da solução: <strong>200/);
});
test("zero explícito é preservado; BLANK tem placeholder e label vazia",()=>{
  const serie=opCard().series[0];
  assert.deepEqual(Array.from(serie.data),[30,0,null]);
  assert.equal(serie.label.formatter({value:0}),"0");
  assert.equal(serie.label.formatter({value:null}),"");
  assert.equal(serie.label.formatter({value:undefined}),"");
  assert.match(tooltipCanal(ranking[2],null),/Indisponível/);
  assert.match(tooltipCanal(ranking[2],null),/Representatividade: <strong>—/);
});
test("percentual já recebido não é recalculado nem dividido pelo volume total de canais",()=>{
  const html=tooltipCanal({...ranking[0],participacao:.375},999);
  assert.match(html,/37,50%/);
  assert.match(html,/999/);
  assert.equal(ranking[0].participacao,.15);
  assert.ok(!source.includes("participacaoPorSolucao"));
});
test("escape HTML protege nome do canal no tooltip",()=>{
  assert.equal(escaparCanal('<Canal "VIP" & teste>'),"&lt;Canal &quot;VIP&quot; &amp; teste&gt;");
  assert.doesNotMatch(tooltipCanal({...ranking[0],canal:"<script>"},200),/<script>/);
});
test("tema dark altera gradiente e contraste, sem alterar as contagens",()=>{
  const light=opCard(),dark=opcoesTransferenciasPorCanal(ranking,200,true);
  assert.notEqual(light.series[0].itemStyle.color.colorStops[0].color,
    dark.series[0].itemStyle.color.colorStops[0].color);
  assert.deepEqual(Array.from(dark.series[0].data),[30,0,null]);
  assert.equal(dark.tooltip.backgroundColor,"#0d1b2d");
});
test("tooltip trata índice ausente sem exceção e não presume ranking completo",()=>{
  assert.equal(opCard().tooltip.formatter({dataIndex:99}),"");
  assert.equal(opCard().tooltip.formatter(null),"");
  assert.equal(opCard().tooltip.formatter({}),"");
});
test("CSS preserva foco, scroll vertical/horizontal, mobile e reduced motion",()=>{
  const css=fs.readFileSync(path.join(raiz,"componentes/transferencias-por-canal/transferencias-por-canal.css"),"utf8");
  for(const token of [".ds-tc-root","ds-tc-card-scroll","overflow-y:auto","ds-tc-foco-scroll",
    "overflow-x:auto","ds-tc-modal",'data-theme="dark"',"@media(max-width:620px)","prefers-reduced-motion"])
    assert.ok(css.includes(token),token);
  assert.ok(!css.includes(".ds-vl-"));assert.ok(!css.includes(".ds-tf-"));
});
test("mock permanece externo e mantém dois rankings independentes",()=>{
  assert.ok(!source.includes("../mock/"));
  const mock=fs.readFileSync(path.join(raiz,"mock/canais.ts"),"utf8");
  assert.match(mock,/seriesCanaisMock/);assert.match(mock,/ura:/);assert.match(mock,/iam:/);
  assert.match(mock,/totalTransferidas/);
});
test("catálogo oferece terceiro gráfico sem substituir TSX dos modelos anteriores",()=>{
  const app=fs.readFileSync(path.join(raiz,"src/App.tsx"),"utf8");
  for(const token of ["TransferenciasPorCanal","GraficoLinhaTransferencias","GraficoLinhaVolume",
    "seriesCanaisMock","modelo===\"canais\""])
    assert.ok(app.includes(token),token);
});
