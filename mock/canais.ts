/** Dados 100% sintéticos — apenas demonstração no StackBlitz.
 * Os percentuais já estão PREPARADOS fora do componente, tal como uma API/adaptador. */
import type {OrigemCanal,SerieTransferenciasCanal,LinhaTransferenciaCanal} from "../componentes/transferencias-por-canal/TransferenciasPorCanal";

const nomes=[
  "Aplicativo", "Portal do Cliente", "Atendimento Digital", "WhatsApp",
  "Chat", "Telefone", "Portal de Autosserviço", "Transferência Interna",
  "Canal com um nome extremamente extenso de demonstração", "SMS", "E-mail",
  "Canal Parceiro", "Aplicativo Legado", "Atendimento Externo", "Outros",
];
const recebidasUra=[1900,1750,1700,1500,1410,1330,1210,1050,950,810,680,550,450,300,0];
const transferidasUra=[660,510,450,420,370,320,270,190,140,110,88,65,39,18,0];
const recebidasIam=[1450,1300,1120,1080,970,820,710,600,500,390,330,220,100,40,null];
const transferidasIam=[540,430,400,310,280,245,220,160,120,95,66,45,18,0,null];
function criarLinhas(recebidas:(number|null)[],transferidas:(number|null)[],total:number):LinhaTransferenciaCanal[]{
  return nomes.map((canal,i)=>{
    const r=recebidas[i]??null;
    const t=transferidas[i]??null;
    return {canal,recebidas:r,transferidas:t,participacao:t===null?null:t/total};
  }).sort((a,b)=>{
    if(a.transferidas===null)return b.transferidas===null?a.canal.localeCompare(b.canal,"pt-BR"):1;
    if(b.transferidas===null)return -1;
    return b.transferidas-a.transferidas||a.canal.localeCompare(b.canal,"pt-BR");
  });
}
export const seriesCanaisMock:Record<OrigemCanal,SerieTransferenciasCanal>={
  ura:{ranking:criarLinhas(recebidasUra,transferidasUra,3750),totalTransferidas:3750},
  iam:{ranking:criarLinhas(recebidasIam,transferidasIam,3000),totalTransferidas:3000},
};
