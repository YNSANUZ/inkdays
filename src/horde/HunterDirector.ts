export const hunterQuota=(day:number)=>Math.min(8,1+Math.floor((Math.max(1,Math.floor(day))-1)/3));

export class HunterDirector{
  private timer=C.hunter.interval;private spawned=0;private quota=0;
  begin(day:number){this.timer=C.hunter.interval;this.spawned=0;this.quota=hunterQuota(day);}
  update(dt:number,spawn:()=>boolean){if(this.spawned>=this.quota)return;this.timer-=dt;if(this.timer<=0&&spawn()){this.spawned++;this.timer=C.hunter.interval;}}
  remaining(active:number){return Math.max(0,this.quota-this.spawned)+active;}
  get complete(){return this.spawned>=this.quota;}
}
import {C} from '../config/gameplay';
