/** DADOS INTEIRAMENTE SINTÉTICOS — nenhum contrato, empresa ou endpoint real. */
import type {PontoVolume,FonteVolume} from "../componentes/grafico-linha-volume/GraficoLinhaVolume";

export const periodoVolumeMock={from:"2026-10-19",to:"2026-10-19"};
export const periodoVolumeMensalMock={from:"2026-10-11",to:"2026-10-18"};
const diasDaAmostra=["2026-10-11","2026-10-12","2026-10-13","2026-10-14","2026-10-15","2026-10-16","2026-10-17","2026-10-18"];
function pontoHora(hour:number,recebidas:number|null,multiplicador=1):PontoVolume{
  return {ordem:`2026-10-19-${String(hour).padStart(2,"0")}`,
    rotulo:`${String(hour).padStart(2,"0")}h`,
    recebidas:recebidas===null?null:Math.round(recebidas*multiplicador),
    transferidas:recebidas===null?null:Math.round(recebidas*multiplicador*.23)};
}
function periodoDia(multiplicador:number):PontoVolume[]{return [
  {ordem:"2026-10-19-06",rotulo:"Madrugada",recebidas:280*multiplicador,
    transferidas:62*multiplicador,madrugada:true,horasRegistradas:6,ultimaHoraOriginal:6},
  ...[7,8,9,10,11,12,13,14,15,16,17].map((h,i)=>pontoHora(h,
    [1180,1410,1700,1590,1800,1720,1620,1710,1770,1660,1480][i]!,multiplicador)),
];}
function periodoMensal(multiplicador:number):PontoVolume[]{return diasDaAmostra.map((dia,i)=>{
  const exemplos:(number|null)[]=[12700,0,15800,null,16800,14900,13600,17000];
  const bruto=exemplos[i]??null;
  return {ordem:dia,rotulo:`${dia.slice(8)}/${dia.slice(5,7)}`,
    recebidas:bruto===null?null:Math.round(bruto*multiplicador),
    transferidas:bruto===null?null:Math.round(bruto*.22*multiplicador)};
});}
export const seriesVolumeDiaMock:Record<FonteVolume,PontoVolume[]>={ura:periodoDia(1),iam:periodoDia(.74)};
export const seriesVolumeMesMock:Record<FonteVolume,PontoVolume[]>={ura:periodoMensal(1),iam:periodoMensal(.74)};
