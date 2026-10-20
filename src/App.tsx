import {useState} from "react";
import {GraficoLinhaTransferencias,type TemaTransferencias} from "../componentes/grafico-linha-transferencias/GraficoLinhaTransferencias";
import {GraficoLinhaVolume} from "../componentes/grafico-linha-volume/GraficoLinhaVolume";
import {TransferenciasPorCanal} from "../componentes/transferencias-por-canal/TransferenciasPorCanal";
import {VolumetriaMonitoramento} from "../componentes/volumetria-monitoramento/VolumetriaMonitoramento";
import {periodoMock,seriesMock} from "../mock/transferencias";
import {periodoVolumeMock,periodoVolumeMensalMock,seriesVolumeDiaMock,seriesVolumeMesMock} from "../mock/volume";
import {seriesCanaisMock} from "../mock/canais";
import {volumeMonitoramentoMock,volumeMonitoramentoLacunasMock} from "../mock/monitoramento-volume";
import "./app.css";

type Modelo="transferencias"|"volume"|"canais"|"monitoramento-volume";
export default function App(){
  const [tema,setTema]=useState<TemaTransferencias>("light");
  const [modelo,setModelo]=useState<Modelo>("monitoramento-volume");
  const [mensal,setMensal]=useState(false);
  const [lacunas,setLacunas]=useState(false);
  return <main className="preview" data-theme={tema}>
    <div className="preview-header"><div>
      <small>DESIGN SYSTEM · CÓDIGO REAL · DEMONSTRAÇÃO COM MOCK</small>
      <h1>{modelo==="monitoramento-volume"?"Gráfico de Linha — Volumetria do Monitoramento":
        modelo==="volume"?"Gráfico de Linha — Evolução do Volume":
        modelo==="canais"?"Gráfico de Barras — Transferências por Canal":"Gráfico de Linha — Transferências"}</h1>
      <p>Prévia em React/TSX com dados sintéticos externos. Os componentes não contêm mocks.</p>
    </div><button type="button" onClick={()=>setTema(t=>t==="light"?"dark":"light")}>
      {tema==="light"?"Ativar tema escuro":"Ativar tema claro"}
    </button></div>
    <nav className="preview-modelos" aria-label="Modelos visuais">
      <button type="button" className={modelo==="monitoramento-volume"?"ativo":""} aria-pressed={modelo==="monitoramento-volume"}
        onClick={()=>setModelo("monitoramento-volume")}>Volumetria · Monitoramento · Etapa 4</button>
      <button type="button" className={modelo==="canais"?"ativo":""} aria-pressed={modelo==="canais"}
        onClick={()=>setModelo("canais")}>Transferências por Canal · Etapa 3</button>
      <button type="button" className={modelo==="volume"?"ativo":""} aria-pressed={modelo==="volume"}
        onClick={()=>setModelo("volume")}>Evolução do Volume · Etapa 2</button>
      <button type="button" className={modelo==="transferencias"?"ativo":""} aria-pressed={modelo==="transferencias"}
        onClick={()=>setModelo("transferencias")}>Transferências · Etapa 1</button>
      {modelo==="monitoramento-volume"&&<div className="preview-periodos" role="group" aria-label="Amostra do monitoramento">
        <button type="button" className={!lacunas?"ativo":""} aria-pressed={!lacunas} onClick={()=>setLacunas(false)}>Dia completo</button>
        <button type="button" className={lacunas?"ativo":""} aria-pressed={lacunas} onClick={()=>setLacunas(true)}>Com lacunas</button>
      </div>}
      {modelo==="volume"&&<div className="preview-periodos" role="group" aria-label="Período do mock">
        <button type="button" className={!mensal?"ativo":""} aria-pressed={!mensal} onClick={()=>setMensal(false)}>Dia</button>
        <button type="button" className={mensal?"ativo":""} aria-pressed={mensal} onClick={()=>setMensal(true)}>Vários dias</button>
      </div>}
    </nav>
    <div className={`preview-area ${modelo==="canais"?"preview-area--canais":modelo==="monitoramento-volume"?"preview-area--monitoramento":""}`}>{modelo==="monitoramento-volume"?
      <VolumetriaMonitoramento pontos={lacunas?volumeMonitoramentoLacunasMock:volumeMonitoramentoMock} tema={tema}/>:modelo==="canais"?
      <TransferenciasPorCanal series={seriesCanaisMock} tema={tema} origemInicial="ura"/>:
      modelo==="volume"?
      <GraficoLinhaVolume series={mensal?seriesVolumeMesMock:seriesVolumeDiaMock}
        periodo={mensal?periodoVolumeMensalMock:periodoVolumeMock} tema={tema} origemInicial="ura"/>:
      <GraficoLinhaTransferencias series={seriesMock} periodo={periodoMock} tema={tema} origemInicial="ura"/>}
    </div>
    <footer>{modelo==="monitoramento-volume"?
      "Volumetria horária do Monitoramento: madrugada agrupada somente na visualização, sem preencher BLANK nem horários ausentes. Teste o hover e o foco.":modelo==="canais"?
      "Card: barras horizontais e rolagem vertical. Foco: colunas e rolagem horizontal. Alternar URA/IAM e tema.":
      "Alterne URA/IAM, passe o mouse nos marcadores e abra o modo foco."}</footer>
  </main>;
}
