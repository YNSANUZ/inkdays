/** Detects authoritative health loss without inventing hits on first snapshot or reconnect. */
export class HealthEvents {
  private value:number|null=null;
  reset(){this.value=null;}
  observe(value:number){
    if(!Number.isFinite(value))return 0;
    if(this.value===null){this.value=value;return 0;}
    const damage=Math.max(0,this.value-value);this.value=value;return damage;
  }
}
