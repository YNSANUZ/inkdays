import {quoteAmmoPurchase} from '../economy/AmmoEconomy';
import {C} from '../config/gameplay';

interface PlayerShopState{position:{x:number;z:number};health:number;money:number;ammo:number;reserve:number}
export const workshopNearby=(player:Pick<PlayerShopState,'position'|'health'>|undefined,phase:'day'|'horde')=>!!player&&player.health>0&&phase==='day'&&Math.hypot(player.position.x,player.position.z-4)<=3.25;
export class WorkshopPanel{
  readonly root=document.createElement('section');private status:HTMLElement;private buy:HTMLButtonElement;private request=0;
  constructor(parent:HTMLElement,private purchase:(requestId:string)=>void){
    this.root.className='workshop-panel';this.root.hidden=true;
    this.root.innerHTML='<header><small>BAÚ DO VALE</small><b>ARSENAL E SUPRIMENTOS</b></header><div class="workshop-tabs"><span>ARMAS</span><span>MUNIÇÃO</span><span>OFICINA</span></div><div class="workshop-item equipped"><i>01</i><span><b>PISTOLA DE RASCUNHO</b><small>EQUIPADA</small></span></div><div class="workshop-item locked"><i>02</i><span><b>RIFLE DESENHADO</b><small>EM DESENVOLVIMENTO</small></span></div><button class="workshop-buy" type="button"><span>CAIXA DE MUNIÇÃO</span><b></b></button><output></output><small class="workshop-hint">AFASTE-SE DO BAÚ PARA FECHAR</small>';
    parent.append(this.root);this.status=this.root.querySelector('output')!;this.buy=this.root.querySelector('.workshop-buy')!;
    this.buy.onclick=()=>{this.buy.disabled=true;this.status.textContent='CONFIRMANDO COM O SERVIDOR…';this.purchase(`ammo-${Date.now()}-${++this.request}`);};
  }
  update(player:PlayerShopState|undefined,phase:'day'|'horde'){
    const nearby=workshopNearby(player,phase);this.root.hidden=!nearby;if(!nearby||!player)return false;
    const quote=quoteAmmoPurchase(player.reserve,C.weapon.maxReserve),affordable=player.money>=quote.cost;this.buy.querySelector('b')!.textContent=quote.rounds?`+${quote.rounds} BALAS · $${quote.cost}`:'MUNIÇÃO COMPLETA';this.buy.disabled=!quote.rounds||!affordable;this.status.textContent=!quote.rounds?'RESERVA COMPLETA':affordable?`SALDO $${player.money} · PENTE ${player.ammo}/${C.weapon.magazine} · RESERVA ${player.reserve}/${C.weapon.maxReserve}`:`DINHEIRO INSUFICIENTE · SALDO $${player.money}`;return true;
  }
  result(result:{ok:boolean;reason:string;rounds:number;cost:number}){this.status.textContent=result.ok?`COMPRA CONCLUÍDA · +${result.rounds} BALAS · -$${result.cost}`:result.reason==='funds'?'DINHEIRO INSUFICIENTE':result.reason==='full'?'RESERVA COMPLETA':'COMPRA INDISPONÍVEL';this.buy.disabled=false;}
}
