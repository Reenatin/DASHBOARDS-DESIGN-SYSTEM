import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const source=fs.readFileSync(path.join(import.meta.dirname,"../componentes/grafico-linha-transferencias/GraficoLinhaTransferencias.tsx"),"utf8");
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,
  module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
const exports={};
const module={exports};
const sandbox={module,exports,Intl,Date,Number,Math,Map,Array,Set,window:{},console,
  require(name){
    if(name.endsWith(".css"))return {};
    if(name==="echarts/core")return {use(){},init(){throw Error("DOM não esperado no teste de opções")}};
    if(name.startsWith("echarts/"))return new Proxy({}, {get:()=>function(){}});
    if(name==="react"||name==="react/jsx-runtime")return new Proxy({}, {get:()=>()=>{}});
    throw Error(`Dependência de teste não simulada: ${name}`);
  }};
vm.runInNewContext(js,sandbox,{filename:"GraficoLinhaTransferencias.tsx"});
const {dividirLinhaEmTrechos,faixasDeAreaAth,prepararSerieVisual,opcoesTransferenciaIam,
  opcoesTransferenciaUra,escaparTooltip}=module.exports;
const mk=(h,percentual)=>({ordem:`2026-10-19-${String(h).padStart(2,"0")}`,rotulo:`${h}h`,
  percentual,recebidas:100,transferidas:percentual===null?null:Math.round(percentual*100)});
const pontos=[mk(7,.40),mk(8,.49),mk(9,.47),mk(10,.39)];
const optionsIam=()=>opcoesTransferenciaIam(pontos,false);
const optionsUra=()=>opcoesTransferenciaUra(pontos,{from:"2026-10-19",to:"2026-10-19"},false,false);

test("IAM preserva limite de 45% e marcadores 7/9px",()=>{
  const series=optionsIam().series;
  assert.ok(series.some(x=>x.id==="limite-ath"));
  assert.equal(series.find(x=>x.id==="limite-ath").lineStyle.type,"dashed");
  assert.equal(series.find(x=>x.id==="pontos-reais").symbolSize,7);
  assert.equal(opcoesTransferenciaIam(pontos,true,true).series.find(x=>x.id==="pontos-reais").symbolSize,9);
});

test("URA não utiliza referência 45% e não muda os dados",()=>{
  assert.ok(optionsUra().series.every(x=>x.id!=="limite-ath"));
  assert.equal(optionsUra().series[0].lineStyle.width,3.3);
  assert.equal(pontos[0].percentual,.40);
});

test("cruzamento da taxa pinta somente o trecho acima do limiar",()=>{
  const segs=dividirLinhaEmTrechos([{hourCode:7,value:40},{hourCode:8,value:50}],45);
  assert.equal(segs.length,2);
  assert.equal(segs[0].faixa,"principal");
  assert.equal(segs[1].faixa,"alerta");
  assert.equal(segs[0].fim[1],45);
  assert.equal(segs[1].inicio[0],7.5);
});

test("horários vazios, BLANK e zeros visuais não são interpolados",()=>{
  assert.equal(dividirLinhaEmTrechos([{hourCode:7,value:41},{hourCode:9,value:52}],45).length,0);
  assert.equal(dividirLinhaEmTrechos([{hourCode:7,value:41},{hourCode:8,value:null}],45).length,0);
  assert.equal(faixasDeAreaAth([{hourCode:7,value:41},{hourCode:9,value:52}],45).length,0);
  const raw=[mk(7,0),mk(8,null),mk(9,.25)];
  const prep=prepararSerieVisual(raw,{from:"2026-10-19",to:"2026-10-19"});
  assert.equal(prep.pontos[0].percentual,null);
  assert.equal(raw[0].percentual,0);
});

test("período multi-dia compacta apenas pontos positivos sem inventar datas reais",()=>{
  const raw=[{...mk(8,.1),ordem:"2026-10-11",rotulo:"11/10"},
    {...mk(8,0),ordem:"2026-10-12",rotulo:"12/10"},
    {...mk(8,.2),ordem:"2026-10-14",rotulo:"14/10"}];
  const r=prepararSerieVisual(raw,{from:"2026-10-11",to:"2026-10-14"});
  assert.equal(r.pontos.length,2);
  assert.equal(r.pontos[1].ordem,"2026-10-12");
  assert.equal(r.rotulos[1],"14/10");
  assert.equal(raw[2].ordem,"2026-10-14");
});

test("tooltip escapa HTML e mantém recebidas/transferidas",()=>{
  assert.equal(escaparTooltip('<script>"&'),"&lt;script&gt;&quot;&amp;");
  const opts=optionsIam();
  const param=[{seriesId:"pontos-reais",data:{value:[7,40]}}];
  const html=opts.tooltip.formatter(param);
  assert.match(html,/40,00%/);
  assert.match(html,/Recebidas: <strong>100/);
  assert.match(html,/Transferidas: <strong>40/);
  assert.equal(opts.tooltip.trigger,"axis");
});

test("estilos mantêm tema, foco, responsividade e movimento reduzido",()=>{
  const css=fs.readFileSync(path.join(import.meta.dirname,"../componentes/grafico-linha-transferencias/grafico-linha-transferencias.css"),"utf8");
  for(const token of ['[data-theme="dark"]','@media(max-width:620px)',
    'prefers-reduced-motion','ds-tf-echart','ds-tf-backdrop'])assert.ok(css.includes(token),token);
});
