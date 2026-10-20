import {useState} from "react";
import {GraficoLinhaTransferencias,type TemaTransferencias} from "../componentes/grafico-linha-transferencias/GraficoLinhaTransferencias";
import {periodoMock,seriesMock} from "../mock/transferencias";
import "./app.css";

export default function App(){
  const [tema,setTema]=useState<TemaTransferencias>("light");
  return <main className="preview" data-theme={tema}>
    <div className="preview-header"><div>
      <small>DESIGN SYSTEM · MODELO HOMOLOGADO</small>
      <h1>Gráfico de Linha — Transferências</h1>
      <p>Prévia em React/TSX com dados sintéticos externos. O gráfico não contém mocks.</p>
    </div><button type="button" onClick={()=>setTema(t=>t==="light"?"dark":"light")}>
      {tema==="light"?"Ativar tema escuro":"Ativar tema claro"}
    </button></div>
    <div className="preview-area"><GraficoLinhaTransferencias
      series={seriesMock} periodo={periodoMock} tema={tema} origemInicial="ura"/>
    </div>
    <footer>Alterne URA/IAM, passe o mouse nos marcadores e abra o modo foco.</footer>
  </main>;
}
