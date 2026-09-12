import type { Command } from './Input';
export function joystick(dx:number,dy:number,radius:number) {
  const distance=Math.hypot(dx,dy), amount=Math.min(1,distance/radius);
  if(amount<.12)return {x:0,z:0};
  const strength=(amount-.12)/.88;
  return {x:dx/distance*strength,z:-dy/distance*strength};
}
/** Hardware-independent touch commands and one-frame action latches. */
export class TouchState {
  x=0;z=0;run=false;crouch=false;fire=false;
  private shot=false;private jump=false;private reload=false;
  trigger(action:'fire'|'jump'|'reload') {if(action==='fire')this.shot=true;else this[action]=true;}
  consume():Command {
    const c={x:this.x,z:this.z,run:this.run,crouch:this.crouch,fire:this.fire,jump:this.jump,reload:this.reload,shot:this.shot};
    this.shot=this.jump=this.reload=false;return c;
  }
  clear(){this.x=this.z=0;this.run=this.crouch=this.fire=this.shot=this.jump=this.reload=false;}
}
