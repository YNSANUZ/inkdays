/** Matches short-lived local trigger feedback with its later authoritative event. */
export class PredictedShotFeedback {
  private pending=new Map<number,number>();
  constructor(private lifetimeMs=600){}
  predict(shotId:number,now:number){this.prune(now);this.pending.set(shotId,now);}
  confirm(shotId:number|undefined,now:number){this.prune(now);if(shotId===undefined||!this.pending.has(shotId))return false;this.pending.delete(shotId);return true;}
  reset(){this.pending.clear();}
  private prune(now:number){for(const [id,time] of this.pending)if(now-time>this.lifetimeMs)this.pending.delete(id);}
  get count(){return this.pending.size;}
}
