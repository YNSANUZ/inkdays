import { C } from '../config/gameplay';
/** Disconnected time is discarded; frame stalls cannot create an input flood. */
export class InputClock {
  private elapsed=0;
  advance(dt:number,ready:boolean){
    if(!ready){this.elapsed=0;return 0;}
    this.elapsed=Math.min(C.fixedStep*6,this.elapsed+Math.max(0,dt));
    const steps=Math.floor((this.elapsed+1e-9)/C.fixedStep);
    this.elapsed=Math.max(0,this.elapsed-steps*C.fixedStep);return steps;
  }
}
