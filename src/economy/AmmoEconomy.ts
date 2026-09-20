export const AMMO_PACKAGE=24;
export const AMMO_PRICE_PER_ROUND=2.5;

export function quoteAmmoPurchase(currentReserve:number,maxReserve:number){
  if(!Number.isFinite(currentReserve)||!Number.isFinite(maxReserve))return {rounds:0,cost:0};
  const rounds=Math.max(0,Math.min(AMMO_PACKAGE,Math.floor(maxReserve-currentReserve)));
  return {rounds,cost:Math.ceil(rounds*AMMO_PRICE_PER_ROUND)};
}
