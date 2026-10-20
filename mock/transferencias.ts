/** Dados totalmente sintéticos, usados apenas pela prévia StackBlitz. */
import type { PontoTransferencia } from "../componentes/grafico-linha-transferencias/GraficoLinhaTransferencias";

const dia="2026-10-19";
const baseUra: Array<[number,number|null,number|null,number|null]> = [
  [6,.242,1240,300],[7,.266,1678,446],[8,.297,1895,563],[9,.274,2148,588],
  [10,.321,2299,738],[11,.309,2520,779],[12,.286,2341,670],[13,.303,2418,733],
  [14,.277,2640,731],[15,.316,2380,752],[16,.305,2201,671],[17,.298,2032,606],
];
const baseIam: Array<[number,number|null,number|null,number|null]> = [
  [6,.382,830,317],[7,.427,1080,461],[8,.462,1450,670],[9,.489,1632,798],
  [10,.474,1780,844],[11,.448,1850,829],[12,.413,1721,711],[13,.431,1965,847],
  [14,.468,2060,964],[15,.512,1980,1014],[16,.488,1760,859],[17,.454,1540,699],
];
function montar(registros:typeof baseUra):PontoTransferencia[]{
  return registros.map(([hora,percentual,recebidas,transferidas])=>({
    ordem:`${dia}-${String(hora).padStart(2,"0")}`,
    rotulo:hora===6?"Madrugada":`${String(hora).padStart(2,"0")}h`,
    percentual,recebidas,transferidas,
    ...(hora===6?{madrugada:true,horasRegistradas:7,ultimaHoraOriginal:6}:{}),
  }));
}
export const periodoMock={from:dia,to:dia};
export const seriesMock={ura:montar(baseUra),iam:montar(baseIam)};
