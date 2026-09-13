import { C, hordeCount } from '../config/gameplay';
export class Horde {
  spawned=0; goal=0; timer=0;
  begin(day:number,players=1) {this.spawned=0;this.goal=hordeCount(day,players);this.timer=0;}
  update(dt:number,spawn:()=>boolean) {this.timer-=dt;if(this.timer<=0&&this.spawned<this.goal) {if(spawn())this.spawned++;this.timer=Math.min(C.day.spawnInterval,(C.day.hordeDuration-2)/this.goal);}}
}
