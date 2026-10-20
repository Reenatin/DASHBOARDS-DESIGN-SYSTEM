import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const arquivo=path.join(import.meta.dirname,"../componentes/grafico-linha-volume/GraficoLinhaVolume.tsx");
const source=fs.readFileSync(arquivo,"utf8");
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,
  module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
const exports={};
const module={exports};
const sandbox={module,exports,Intl,Date,Number,Math,Map,Array,Set,window:{},console,
  require(name){
    if(name.endsWith(".css"))return {};
    if(name==="echarts/core")return {use(){},init(){throw Error("DOM fora do teste")}};
    if(name.startsWith("echarts/"))return new Proxy({}, {get:()=>function(){}});
    if(name==="react"||name==="react/jsx-runtime")return new Proxy({}, {get:()=>()=>{}});
    throw Error(`Dependência inesperada: ${name}`);
  }};
vm.runInNewContext(js,sandbox,{filename:"GraficoLinhaVolume.tsx"});
const {prepararVolumeVisual,coordenadasVolume,lacunasVolume,opcoesEvolucaoVolume,
  linhaAntesDosMarcadores,prepararEntradaMarcadores,iniciarEntradaMarcadores,
  ID_MARCADORES_VOLUME,escaparTooltipVolume}=module.exports;
const p=(h,recebidas)=>({ordem:`2026-10-19-${String(h).padStart(2,"0")}`,rotulo:`${h}h`,
  recebidas,transferidas:recebidas===null?null:Math.round(recebidas*.2)});
const periodo={from:"2026-10-19",to:"2026-10-19"};
const pts=[p(7,100),p(8,120),p(9,130)];
const opts=()=>opcoesEvolucaoVolume(pts,periodo,"ura",false);

test("linha oficial preserva espessura, gradiente, ponto 7/9 e nulos sem conexão",()=>{
  const ser=opts().series[0];
  assert.equal(ser.id,"solucao-linha");
  assert.equal(ser.lineStyle.width,3.3);
  assert.equal(ser.areaStyle.color.type,"linear");
  assert.equal(ser.symbolSize,7);
  assert.equal(ser.connectNulls,false);
  assert.equal(opcoesEvolucaoVolume(pts,periodo,"iam",true,true).series[0].symbolSize,9);
});

test("opções Volume não contêm limiar ATH 45% e eixo Y usa contagens",()=>{
  assert.equal(opts().series.length,1);
  assert.equal(opts().yAxis.axisLabel.formatter(120),"120");
  assert.ok(!source.includes('id:"limite-ath"'));
});

test("um dia preserva horas reais e null nas lacunas",()=>{
  const h=[p(7,100),p(9,200),p(10,null)];
  const l=lacunasVolume(h,periodo);
  assert.deepEqual(JSON.parse(JSON.stringify(l)),[[7,100],[8,null],[9,200],[10,null]]);
  assert.equal(coordenadasVolume(h,periodo).porHora,true);
  assert.equal(h[0].recebidas,100);
});

test("zero é omitido apenas na representação visual, sem alterar entrada",()=>{
  const dados=[p(7,0),p(8,100),p(9,null)];
  const vis=prepararVolumeVisual(dados,periodo);
  assert.equal(vis.pontos[0].recebidas,null);
  assert.equal(dados[0].recebidas,0);
  assert.equal(vis.pontos[2].recebidas,null);
});

test("dias positivos usam slots consecutivos mantendo labels reais, sem editar originais",()=>{
  const multi={from:"2026-10-11",to:"2026-10-15"};
  const data=[{...p(7,100),ordem:"2026-10-11",rotulo:"11/10"},
    {...p(7,0),ordem:"2026-10-12",rotulo:"12/10"},
    {...p(7,null),ordem:"2026-10-13",rotulo:"13/10"},
    {...p(7,200),ordem:"2026-10-15",rotulo:"15/10"}];
  const vis=prepararVolumeVisual(data,multi);
  assert.equal(vis.pontos.length,2);
  assert.deepEqual(Array.from(vis.rotulos),["11/10","15/10"]);
  assert.equal(vis.pontos[1].ordem,"2026-10-12");
  assert.equal(data[3].ordem,"2026-10-15");
});

test("período longo com único dia positivo continua em eixo diário, não horário",()=>{
  const dados=[{...p(7,100),ordem:"2026-10-11",rotulo:"11/10"},
    {...p(7,0),ordem:"2026-10-12",rotulo:"12/10"}];
  const vis=prepararVolumeVisual(dados,{from:"2026-10-11",to:"2026-10-12"});
  assert.notEqual(vis.periodo.from,vis.periodo.to);
  assert.equal(coordenadasVolume(vis.pontos,vis.periodo).porHora,false);
});

test("madrugada fornece detalhe e rótulo 00h–06h e não calcula indicadores",()=>{
  const madrugada={...p(6,250),ordem:"2026-10-19-06",rotulo:"Madrugada",
    madrugada:true,horasRegistradas:5,ultimaHoraOriginal:6};
  const opt=opcoesEvolucaoVolume([madrugada,p(7,120)],periodo,"ura",false);
  assert.equal(opt.xAxis.axisLabel.formatter(6),"Madrugada");
  const html=opt.tooltip.formatter([{seriesId:"solucao-linha",data:[6,250]}]);
  assert.match(html,/Bloco 00h–06h/);
  assert.match(html,/5 horário/);
});

test("tooltip possui Recebidas uma única vez, Transferidas e escape HTML",()=>{
  const o=opts();
  const html=o.tooltip.formatter([{seriesId:"solucao-linha",data:[7,100]}]);
  assert.equal((html.match(/Recebidas:/g)||[]).length,1);
  assert.match(html,/Transferidas:/);
  assert.equal(escaparTooltipVolume('<b>"&'),"&lt;b&gt;&quot;&amp;");
});

test("entrada: linha sem símbolos antes dos marcadores, série auxiliar silenciosa",()=>{
  const q=linhaAntesDosMarcadores(opts());
  assert.equal(q.series.length,2);
  assert.equal(q.series[0].showSymbol,false);
  assert.equal(q.series[0].animation,false);
  assert.equal(q.series[1].id,ID_MARCADORES_VOLUME);
  assert.equal(q.series[1].silent,true);
  assert.equal(q.series[1].tooltip.show,false);
  const entrada=prepararEntradaMarcadores(q);
  assert.equal(entrada.pontos.length,pts.length);
  assert.ok(entrada.inicial.series[1].data.every(x=>x===null));
});

test("marcadores surgem depois de 60ms, em ordem, com cancelamento e sem callbacks tardios",()=>{
  let proximo=1;const tasks=new Map(),capturas=[];
  const schedule=(fn,ms)=>{const id=proximo++;tasks.set(id,{fn,ms});return id;};
  const cancel=id=>tasks.delete(id);
  const stop=iniciarEntradaMarcadores(["A","B","C"],a=>capturas.push(a),schedule,cancel);
  assert.deepEqual(capturas,[]);
  assert.equal([...tasks.values()][0].ms,60);
  const primeira=[...tasks.entries()][0];tasks.delete(primeira[0]);primeira[1].fn();
  assert.deepEqual(Array.from(capturas[0]),["A",null,null]);
  stop();assert.equal(tasks.size,0);
  assert.equal(capturas.length,1);
});

test("troca URA/IAM cria opção nova, entrada anterior pode ser cancelada",()=>{
  const ura=linhaAntesDosMarcadores(opcoesEvolucaoVolume(pts,periodo,"ura",false));
  const iam=linhaAntesDosMarcadores(opcoesEvolucaoVolume(pts.map(x=>({...x,recebidas:210})),periodo,"iam",false));
  assert.notEqual(ura.series[0].data[0][1],iam.series[0].data[0][1]);
  const fila=new Map();let id=0,updates=0;
  const timer=(fn,ms)=>{fila.set(++id,fn);return id;};
  const cancelar=x=>fila.delete(x);
  const parar=iniciarEntradaMarcadores(prepararEntradaMarcadores(ura).pontos,()=>updates++,timer,cancelar);
  parar();iniciarEntradaMarcadores(prepararEntradaMarcadores(iam).pontos,()=>updates++,timer,cancelar);
  assert.equal(fila.size,1);
  for(const f of [...fila.values()])f();
  assert.equal(updates,1);
});

test("CSS contém escopos exclusivos, foco, mobile, dark e reduced motion",()=>{
  const css=fs.readFileSync(path.join(import.meta.dirname,"../componentes/grafico-linha-volume/grafico-linha-volume.css"),"utf8");
  for(const key of [".ds-vl-root","ds-vl-echart","ds-vl-modal",'data-theme="dark"',
    "@media(max-width:620px)","prefers-reduced-motion"])
    assert.ok(css.includes(key),key);
  assert.ok(!css.includes(".ds-tf-"));
});
