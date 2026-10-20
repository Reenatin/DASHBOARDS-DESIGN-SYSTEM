import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const raiz=path.resolve(import.meta.dirname,"..");
const arq=path.join(raiz,"componentes/ath-monitoramento/AthMonitoramento.tsx");
const source=fs.readFileSync(arq,"utf8");
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,
  module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true},reportDiagnostics:true});
assert.equal(compiled.diagnostics?.filter(x=>x.category===ts.DiagnosticCategory.Error).length,0);
const exports={};const module={exports};
const sandbox={module,exports,Intl,Date,Number,Math,Map,Array,Set,window:{},console,
  require(name){
    if(name.endsWith(".css"))return {};
    if(name==="echarts/core")return {use(){},init(){throw Error("DOM fora dos testes")} };
    if(name.startsWith("echarts/"))return new Proxy({}, {get:()=>function(){}});
    if(name==="react"||name==="react/jsx-runtime")return new Proxy({}, {get:()=>()=>{}});
    throw Error(`Dependência inesperada: ${name}`);
  }};
vm.runInNewContext(compiled.outputText,sandbox,{filename:"AthMonitoramento.tsx"});
const {compactarMadrugadaAth,agruparConsecutivosAth,dividirLinhaAth,
  faixasDeAreaAth,opcoesAthMonitoramento,comGuiaAth,tooltipAth}=module.exports;
const ponto=(h,p,extras={})=>({hourCode:h,percentualAcumulado:p,
  recebidasAcumuladas:1000,transferidasAcumuladas:450,estado:"normal",...extras});
const pontos=[ponto(7,.32),ponto(8,.38),ponto(9,.52),ponto(10,.57),ponto(11,.39)];
const op=(dark=false,serie=pontos)=>opcoesAthMonitoramento(serie,.45,dark);
const lista=o=>Array.from(o.series);
const json=v=>JSON.parse(JSON.stringify(v));
const seriePorId=(o,id)=>lista(o).find(x=>x.id===id);

test("ATH usa fonte fracionária, eixo Y percentual e limite externo de 45%",()=>{
  const o=op();const marc=seriePorId(o,"pontos-reais");
  assert.equal(o.yAxis.max>=60,true);
  assert.equal(o.yAxis.axisLabel.formatter(40),"40%");
  assert.equal(marc.data[2].value[1],52);
  assert.equal(seriePorId(o,"limite-ath").data[0][1],45);
  assert.equal(pontos[2].percentualAcumulado,.52);
});
test("linha do limite horizontal tracejada, independentemente do tema",()=>{
  for(const escuro of [false,true]){
    const s=seriePorId(op(escuro),"limite-ath");
    assert.equal(s.silent,true);
    assert.equal(s.lineStyle.type,"dashed");
    assert.equal(s.lineStyle.width,1.5);
    assert.equal(s.data[0][1],45);
    assert.equal(s.data[1][1],45);
  }
});
test("trecho ascendente cruza 45% no ponto exato, não pinta abaixo como alerta",()=>{
  const v=compactarMadrugadaAth([ponto(7,.40),ponto(8,.50)]);
  const seg=json(dividirLinhaAth(v,45));
  assert.deepEqual(seg,[
    {inicio:[7,40],fim:[7.5,45],faixa:"principal"},
    {inicio:[7.5,45],fim:[8,50],faixa:"alerta"},
  ]);
});
test("trecho descendente retorna ao verde no cruzamento 45%",()=>{
  const v=compactarMadrugadaAth([ponto(7,.50),ponto(8,.40)]);
  assert.deepEqual(json(dividirLinhaAth(v,45)),[
    {inicio:[7,50],fim:[7.5,45],faixa:"alerta"},
    {inicio:[7.5,45],fim:[8,40],faixa:"principal"},
  ]);
});
test("área empilhada divide base e excesso com interseção no limiar",()=>{
  const v=compactarMadrugadaAth([ponto(7,.40),ponto(8,.50)]);
  const area=json(faixasDeAreaAth(v,45));
  assert.deepEqual(area,[[
    {hourCode:7,base:40,excesso:0},{hourCode:7.5,base:45,excesso:0},
    {hourCode:8,base:45,excesso:5},
  ]]);
  const o=op();
  const base=seriePorId(o,"ath-base-0"),excesso=seriePorId(o,"ath-excesso-0");
  assert.equal(base.stack,excesso.stack);
  assert.equal(base.lineStyle.width,0);
  assert.equal(excesso.areaStyle.color.y2,1);
  assert.equal(excesso.silent,true);
});
test("ATH preserva linha vermelha exclusivamente acima do limite",()=>{
  const trechos=lista(op()).filter(x=>String(x.id).startsWith("ath-linha-"));
  assert.ok(trechos.some(x=>x.lineStyle.color==="#DF4149"));
  assert.ok(trechos.some(x=>x.lineStyle.color==="#01ABBD"));
  for(const s of trechos){
    assert.equal(s.lineStyle.width,3.5);
    const pontosDaLinha=s.data;
    if(s.lineStyle.color==="#DF4149")assert.ok(pontosDaLinha.every(v=>v[1]>=45));
  }
});
test("marcadores 8px, madrugada 12px e vermelho apenas acima do limite",()=>{
  const o=op(true,[ponto(0,.42),ponto(6,.46),ponto(7,.45),ponto(8,.51)]);
  const marca=seriePorId(o,"pontos-reais");
  assert.equal(marca.symbolSize,8);
  assert.equal(marca.data[0].symbolSize,12);
  assert.equal(marca.data[0].itemStyle.borderWidth,2.2);
  assert.equal(marca.data[0].itemStyle.color,"#DF4149");
  assert.equal(marca.data[1].itemStyle.color,"#01ABBD");
  assert.equal(marca.data[2].itemStyle.color,"#DF4149");
  assert.equal(o.tooltip.backgroundColor,"#0d1b2d");
});
test("madrugada ATH é ÚLTIMO acumulado, não soma nem média",()=>{
  const entrada=[ponto(4,.37),ponto(0,.21),ponto(6,.44),ponto(7,.45)];
  const saida=compactarMadrugadaAth(entrada);
  assert.deepEqual(json(saida.map(p=>p.hourCode)),[6,7]);
  assert.equal(saida[0].value,44);
  assert.equal(saida[0].horasRegistradas,3);
  assert.equal(saida[0].ultimaHoraOriginal,6);
  assert.equal(entrada[0].percentualAcumulado,.37);
});
test("BLANK em madrugada impede usar último valor parcial",()=>{
  const v=compactarMadrugadaAth([ponto(0,.25),ponto(3,null),ponto(6,.49)]);
  assert.equal(v[0].value,null);
  assert.equal(v[0].horasRegistradas,3);
});
test("faltas e BLANK dividem grupos de linha sem interpolação",()=>{
  const dados=[ponto(7,.31),ponto(8,.36),ponto(10,.48),ponto(11,.51),ponto(12,null),
    ponto(13,.49),ponto(14,.43)];
  assert.deepEqual(json(agruparConsecutivosAth(compactarMadrugadaAth(dados))),[
    [[7,31],[8,36]],[[10,48],[11,51]],[[13,49],[14,43]],
  ]);
  const o=op(false,dados);
  assert.deepEqual(json(seriePorId(o,"pontos-reais").data.map(x=>x.value)),
    [[7,31],[8,36],[10,48],[11,51],[12,null],[13,49],[14,43]]);
});
test("zero é conhecido e continua marcador real, BLANK permanece nulo",()=>{
  const a=[ponto(7,0),ponto(8,.10),ponto(9,null)];
  const s=seriePorId(op(false,a),"pontos-reais");
  assert.equal(s.data[0].value[1],0);
  assert.equal(s.data[1].value[1],10);
  assert.equal(s.data[2].value[1],null);
});
test("tooltip da madrugada usa acumulados e estado da última hora original",()=>{
  const entrada=[ponto(0,.33),ponto(6,.47,{recebidasAcumuladas:1910,
    transferidasAcumuladas:898,estado:"alerta"})];
  const v=compactarMadrugadaAth(entrada)[0];
  const html=tooltipAth(v,entrada[1],.45);
  assert.match(html,/Madrugada \(00h–06h\)/);
  assert.match(html,/ATH acumulado: <strong>47,00%/);
  assert.match(html,/Recebidas acumuladas: <strong>1\.910/);
  assert.match(html,/Transferidas acumuladas: <strong>898/);
  assert.match(html,/Limite diário: <strong>45,00%/);
  assert.match(html,/Situação: <strong>Em alerta/);
  assert.match(html,/2 horário\(s\) retornado\(s\); último: 06h/);
  assert.match(html,/Não equivale a um intervalo único/);
});
test("tooltip hora comum usa dados externos sem recalcular alarme",()=>{
  const p=ponto(9,.40,{recebidasAcumuladas:2500,transferidasAcumuladas:999,estado:"alerta"});
  const html=tooltipAth(compactarMadrugadaAth([p])[0],p,.45);
  assert.match(html,/09:00 — Transferência ao Humano/);
  assert.match(html,/40,00%/);
  assert.match(html,/2\.500/);
  assert.match(html,/999/);
  assert.match(html,/Situação: <strong>Em alerta/);
  assert.ok(!source.includes("fetch("));
  assert.ok(!source.includes("participacaoPorSolucao"));
});
test("tooltip formata BLANK como traço, sem inventar zero",()=>{
  const p=ponto(10,null,{recebidasAcumuladas:null,transferidasAcumuladas:null,estado:"indisponivel"});
  const html=tooltipAth(compactarMadrugadaAth([p])[0],p,.45);
  assert.match(html,/ATH acumulado: <strong>—/);
  assert.match(html,/Recebidas acumuladas: <strong>—/);
  assert.match(html,/Situação: <strong>Indisponível/);
  const opt=op(false,[p]);
  assert.equal(opt.tooltip.formatter([{seriesId:"pontos-reais",data:{value:[10,null]}}]),"");
});
test("guia de hover tracejada preserva formatter apenas dos pontos-reais",()=>{
  const o=comGuiaAth(op(),true);
  assert.equal(o.xAxis.axisPointer.type,"line");
  assert.equal(o.xAxis.axisPointer.lineStyle.type,"dashed");
  assert.equal(o.xAxis.axisPointer.lineStyle.width,1.2);
  assert.equal(o.tooltip.trigger,"axis");
  const params=[{seriesId:"ath-base-0",data:[8,38]},
    {seriesId:"pontos-reais",data:{value:[8,38]}}];
  assert.match(o.tooltip.formatter(params),/08:00/);
  assert.equal(o.tooltip.formatter([{seriesId:"ath-base-0",data:[8,38]}]),"");
});
test("CSS isolado contém foco, temas e estados responsivos",()=>{
  const css=fs.readFileSync(path.join(raiz,"componentes/ath-monitoramento/ath-monitoramento.css"),"utf8");
  for(const token of [".ds-ma-root",'data-theme="dark"',".ds-ma-modal", ".ds-ma-legenda.is-danger",
    ".ds-ma-limite", "@media(max-width:620px)", "prefers-reduced-motion", ".ds-ma-corpo"])
    assert.ok(css.includes(token),token);
  for(const token of [".ds-mv-",".ds-tc-",".ds-vl-",".ds-tf-"])
    assert.ok(!css.includes(token),token);
  assert.match(source,/role="alert"/);
  assert.match(source,/role="status"/);
  assert.match(source,/onMouseDown=\{\(\)=>setFoco\(false\)\}/);
  assert.match(source,/e\.key==="Escape"/);
});
test("mocks separados com limite 45%, horário ausente e BLANK, sem importar no TSX",()=>{
  const mock=fs.readFileSync(path.join(raiz,"mock/monitoramento-ath.ts"),"utf8");
  assert.match(mock,/limiteAthMock=0\.45/);
  assert.match(mock,/athMonitoramentoMock/);
  assert.match(mock,/athMonitoramentoLacunasMock/);
  assert.match(mock,/p\.hourCode!==9/);
  assert.match(mock,/percentualAcumulado:null/);
  assert.ok(!source.includes("../mock/"));
  const app=fs.readFileSync(path.join(raiz,"src/App.tsx"),"utf8");
  for(const token of ["AthMonitoramento","VolumetriaMonitoramento","TransferenciasPorCanal",
    "GraficoLinhaVolume","GraficoLinhaTransferencias","modelo===\"monitoramento-ath\""])
    assert.ok(app.includes(token),token);
});
test("doc Etapa 4 atualizado junto com Etapa 5, código anterior preservado",()=>{
  const readme=fs.readFileSync(path.join(raiz,"README.md"),"utf8");
  const doc4=fs.readFileSync(path.join(raiz,"docs/feat/04-grafico-volumetria-monitoramento/README.md"),"utf8");
  const val4=fs.readFileSync(path.join(raiz,"docs/feat/04-grafico-volumetria-monitoramento/validacao.md"),"utf8");
  assert.match(readme,/Modelo 04 — Etapa 4 \(publicado e homologado/);
  assert.match(readme,/Modelo 05 — Etapa 5/);
  assert.match(doc4,/cd08e6183f480384531725946126e7bbe1a5ae9c/);
  assert.match(val4,/49\/49/);
  for(const nome of ["grafico-linha-volume","grafico-linha-transferencias","transferencias-por-canal","volumetria-monitoramento"]){
    const pasta=path.join(raiz,"componentes",nome);
    assert.ok(fs.existsSync(pasta));
  }
});
