/** Demonstrativo 100% sintético. Estado, média e variação já prontos fora do gráfico. */
import type {HoraVolumetria} from "../componentes/volumetria-monitoramento/VolumetriaMonitoramento";

const amostra:[number,number|null][]=[
  [0,105],[1,90],[2,82],[3,111],[4,100],[5,135],[6,170],
  [7,420],[8,510],[9,640],[10,600],[11,690],[12,580],
  [13,575],[14,700],[15,760],[16,790],[17,715],
];
function sintetico(hora:number,recebidas:number|null,i:number):HoraVolumetria{
  const horasReferencia=i>=3?[amostra[i-3]![0],amostra[i-2]![0],amostra[i-1]![0]]:[];
  return {hourCode:hora,recebidas,horasReferencia,
    // Valores de tooltip são mock EXTERNO: não foram calculados pelo componente visual.
    mediaTresHorasAnteriores:i>=3?550:null,
    variacao:i>=3&&recebidas!==null?(recebidas>550?.07:-.12):null,
    estado:i<3?"sem-referencia":recebidas===null?"indisponivel":recebidas<400?"alerta":"normal",
  };
}
export const volumeMonitoramentoMock:HoraVolumetria[]=amostra.map(([h,n],i)=>sintetico(h,n,i));
// Segunda amostra exercita ausência operacional real e BLANK, sem preencher buracos.
export const volumeMonitoramentoLacunasMock:HoraVolumetria[]=volumeMonitoramentoMock
  .filter(x=>x.hourCode!==9&&x.hourCode!==13)
  .map(x=>x.hourCode===11?{...x,recebidas:null,estado:"indisponivel" as const}:x);
