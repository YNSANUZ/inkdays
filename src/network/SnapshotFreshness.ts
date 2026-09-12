/** Detects a silent server-to-client stall before local prediction can drift for seconds. */
export class SnapshotFreshness {
  private reference:number|null=null;
  constructor(private timeoutMs=2500){}
  reset(now=performance.now()){this.reference=now;}
  observe(now=performance.now()){this.reference=now;}
  stale(now=performance.now()){return this.reference!==null&&now-this.reference>this.timeoutMs;}
}
