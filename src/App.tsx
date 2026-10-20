import {useState} from "react";
import {GraficoLinhaTransferencias,type TemaTransferencias} from "../componentes/grafico-linha-transferencias/GraficoLinhaTransferencias";
import {GraficoLinhaVolume} from "../componentes/grafico-linha-volume/GraficoLinhaVolume";
import {periodoMock,seriesMock} from "../mock/transferencias";
import {periodoVolumeMock,periodoVolumeMensalMock,seriesVolumeDiaMock,seriesVolumeMesMock} from "../mock/volume";
import "./app.css";

type Modelo="transferencias"|"volume";
export default function App(){
  const [tema,setTema]=useState<TemaTransferencias>("light");
  const [modelo,setModelo]=useState<Modelo>("volume");
  const [mensal,setMensal]=useState(false);
  return <main className="preview" data-theme={tema}>
    <div className="preview-header"><div>
      <small>DESIGN SYSTEM · CÓDIGO REAL · DEMONSTRAÇÃO COM MOCK</small>
      <h1>{modelo==="volume"?"Gráfico de Linha — Evolução do Volume":"Gráfico de Linha — Transferências"}</h1>
      <p>Prévia em React/TSX com dados sintéticos externos. Os gráficos não contêm mocks.</p>
    </div><button type="button" onClick={()=>setTema(t=>t==="light"?"dark":"light")}>
      {tema==="light"?"Ativar tema escuro":"Ativar tema claro"}
    </button></div>
    <nav className="preview-modelos" aria-label="Modelos visuais">
      <button type="button" className={modelo==="volume"?"ativo":""} aria-pressed={modelo==="volume"}
        onClick={()=>setModelo("volume")}>Evolução do Volume · Etapa 2</button>
      <button type="button" className={modelo==="transferencias"?"ativo":""} aria-pressed={modelo==="transferencias"}
        onClick={()=>setModelo("transferencias")}>Transferências · Etapa 1</button>
      {modelo==="volume"&&<div className="preview-periodos" role="group" aria-label="Período do mock">
        <button type="button" className={!mensal?"ativo":""} aria-pressed={!mensal} onClick={()=>setMensal(false)}>Dia</button>
        <button type="button" className={mensal?"ativo":""} aria-pressed={mensal} onClick={()=>setMensal(true)}>Vários dias</button>
      </div>}
    </nav>
    <div className="preview-area">{modelo==="volume"?
      <GraficoLinhaVolume series={mensal?seriesVolumeMesMock:seriesVolumeDiaMock}
        periodo={mensal?periodoVolumeMensalMock:periodoVolumeMock} tema={tema} origemInicial="ura"/>:
      <GraficoLinhaTransferencias series={seriesMock} periodo={periodoMock} tema={tema} origemInicial="ura"/>}
    </div>
    <footer>Alterne URA/IAM, passe o mouse nos marcadores e abra o modo foco. A Etapa 2 requer homologação visual.</footer>
  </main>;
}
