/** Measures snapshot arrival jitter and finalized loss without counting duplicates twice. */
export class SnapshotTelemetry {
  private received=new Set<number>();private first=-1;private latest=-1;private latestArrival=0;private jitterValue=0;
  constructor(private intervalTicks=3,private reorderWindowTicks=12,private windowTicks=120){}
  observe(tick:number,arrival=performance.now()){
    if(!Number.isSafeInteger(tick)||tick<0||this.received.has(tick))return false;this.received.add(tick);
    if(this.first<0)this.first=tick;
    if(tick>this.latest){if(this.latest>=0){const actual=arrival-this.latestArrival,expected=(tick-this.latest)/60*1000;this.jitterValue=this.jitterValue*.9+Math.abs(actual-expected)*.1;}this.latest=tick;this.latestArrival=arrival;}
    this.prune();return true;
  }
  get jitter(){return this.jitterValue;}
  get latestTick(){return this.latest;}
  get lossPercent(){
    if(this.first<0)return 0;const finalized=this.latest-this.reorderWindowTicks;if(finalized<this.first)return 0;
    const end=this.first+Math.floor((finalized-this.first)/this.intervalTicks)*this.intervalTicks,start=Math.max(this.first,end-this.windowTicks+this.intervalTicks);let expected=0,received=0;
    for(let tick=start;tick<=end;tick+=this.intervalTicks){expected++;if(this.received.has(tick))received++;}return expected?(expected-received)/expected*100:0;
  }
  private prune(){if(this.first<0)return;const keepAfter=this.latest-this.windowTicks-this.reorderWindowTicks;for(const tick of this.received)if(tick<keepAfter)this.received.delete(tick);}
}
