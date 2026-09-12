export interface NetworkConditions {latencyMs:number;jitterMs?:number;dropEvery?:number;duplicateEvery?:number;reorderEvery?:number}
/** Deterministic development/test link impairment. Disabled unless conditions are supplied. */
export class NetworkConditioner {
  private counts={inbound:0,outbound:0};private timers=new Set<ReturnType<typeof setTimeout>>();
  constructor(private conditions?:NetworkConditions){}
  schedule(direction:'inbound'|'outbound',action:()=>void){
    if(!this.conditions){action();return;}
    const n=++this.counts[direction],c=this.conditions;if(c.dropEvery&&n%c.dropEvery===0)return;
    const jitter=c.jitterMs?((n%5)-2)/2*c.jitterMs:0,reorder=c.reorderEvery&&n%c.reorderEvery===0?c.latencyMs:0;
    this.later(Math.max(0,c.latencyMs+jitter+reorder),action);if(c.duplicateEvery&&n%c.duplicateEvery===0)this.later(Math.max(0,c.latencyMs+jitter+reorder+2),action);
  }
  private later(delay:number,action:()=>void){const timer=setTimeout(()=>{this.timers.delete(timer);action();},delay);this.timers.add(timer);}
  close(){for(const timer of this.timers)clearTimeout(timer);this.timers.clear();}
}
