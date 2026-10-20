/** Amostras 100% sintéticas preparadas FORA do gráfico: o TSX não calcula
 * taxa, acumulados, estado ou limite. As frações já estão no contrato oficial. */
import type {HoraAth} from "../componentes/ath-monitoramento/AthMonitoramento";
export const limiteAthMock=0.45;
const amostra:Array<[number,number|null,number|null,number|null,HoraAth["estado"]]>=[
  [0,.31,170,53,"normal"],[1,.33,305,101,"normal"],
  [2,.36,480,173,"normal"],[3,.39,710,277,"normal"],
  [4,.42,900,378,"normal"],[5,.44,1110,488,"normal"],
  [6,.46,1290,593,"alerta"],[7,.48,1460,701,"alerta"],
  [8,.51,1740,887,"alerta"],[9,.47,2020,949,"alerta"],
  [10,.43,2300,989,"normal"],[11,.41,2590,1062,"normal"],
  [12,.44,2820,1241,"normal"],[13,.49,3010,1475,"alerta"],
  [14,.52,3350,1742,"alerta"],[15,.46,3640,1674,"alerta"],
  [16,.42,4200,1764,"normal"],[17,.38,4700,1786,"normal"],
];
export const athMonitoramentoMock:HoraAth[]=amostra.map(([hourCode,percentualAcumulado,
  recebidasAcumuladas,transferidasAcumuladas,estado])=>({
  hourCode,percentualAcumulado,recebidasAcumuladas,transferidasAcumuladas,estado,
}));
/** Horário 09h não retornou, 11h é BLANK e a 3h da madrugada está BLANK.
 * Não fazer interpolação, média de taxas ou completar horas faltantes. */
export const athMonitoramentoLacunasMock:HoraAth[]=athMonitoramentoMock
  .filter(p=>p.hourCode!==9&&p.hourCode!==12)
  .map(p=>p.hourCode===3||p.hourCode===11?
    {...p,percentualAcumulado:null,recebidasAcumuladas:null,
      transferidasAcumuladas:null,estado:"indisponivel" as const}:p);
