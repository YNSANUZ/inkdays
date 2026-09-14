export function reconnectDelay(attempt:number){
  if(!Number.isFinite(attempt))return 8000;
  return Math.min(8000,1000*Math.pow(1.5,Math.max(0,Math.floor(attempt)-1)));
}

export function shouldReconnect(online:boolean,pageLeaving:boolean,roomFull:boolean,sessionTransferred:boolean){
  return online&&!pageLeaving&&!roomFull&&!sessionTransferred;
}
