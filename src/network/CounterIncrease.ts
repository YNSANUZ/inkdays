/** Reports authoritative positive deltas while using first state as a silent baseline. */
export class CounterIncrease {
  private value:number|null=null;
  reset(){this.value=null;}
  observe(value:number){if(!Number.isFinite(value))return 0;if(this.value===null){this.value=value;return 0;}const increase=Math.max(0,value-this.value);this.value=value;return increase;}
}
