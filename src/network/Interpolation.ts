import type { Point } from '../simulation/Movement';
interface Frame {tick:number;position:Point}
interface AngleFrame {tick:number;angle:number}
export const interpolationTick=(latest:number,arrival:number,now:number,delay=6)=>Math.min(latest,latest+(now-arrival)/1000*60-delay);
/** Renders remote entities 100 ms behind, absorbing jitter and reordered snapshots. */
export class InterpolationBuffer {
  private frames:Frame[]=[];private latestTick=0;private arrival=0;
  constructor(private delayTicks=6){}
  push(tick:number,position:Point,arrival=performance.now()){
    if(this.frames.some(frame=>frame.tick===tick))return false;
    this.frames.push({tick,position:{...position}});this.frames.sort((a,b)=>a.tick-b.tick);this.frames=this.frames.slice(-30);
    if(tick>this.latestTick){this.latestTick=tick;this.arrival=arrival;}return true;
  }
  sample(now=performance.now()):Point|null{
    if(!this.frames.length)return null;
    const target=interpolationTick(this.latestTick,this.arrival,now,this.delayTicks);
    let a=this.frames[0],b=this.frames.at(-1)!;
    for(let i=1;i<this.frames.length;i++)if(this.frames[i].tick>=target){a=this.frames[i-1];b=this.frames[i];break;}
    if(target<=a.tick)return {...a.position};if(target>=b.tick)return {...b.position};
    const t=(target-a.tick)/(b.tick-a.tick);return {x:a.position.x+(b.position.x-a.position.x)*t,y:a.position.y+(b.position.y-a.position.y)*t,z:a.position.z+(b.position.z-a.position.z)*t};
  }
}
/** Interpolates rotations through the shortest arc, including the -PI/PI seam. */
export class AngleInterpolationBuffer {
  private frames:AngleFrame[]=[];private latestTick=0;private arrival=0;
  constructor(private delayTicks=6){}
  push(tick:number,angle:number,arrival=performance.now()){
    if(this.frames.some(frame=>frame.tick===tick))return false;this.frames.push({tick,angle});this.frames.sort((a,b)=>a.tick-b.tick);this.frames=this.frames.slice(-30);
    if(tick>this.latestTick){this.latestTick=tick;this.arrival=arrival;}return true;
  }
  sample(now=performance.now()):number|null{
    if(!this.frames.length)return null;const target=interpolationTick(this.latestTick,this.arrival,now,this.delayTicks);let a=this.frames[0],b=this.frames.at(-1)!;
    for(let i=1;i<this.frames.length;i++)if(this.frames[i].tick>=target){a=this.frames[i-1];b=this.frames[i];break;}
    if(target<=a.tick)return a.angle;if(target>=b.tick)return b.angle;const t=(target-a.tick)/(b.tick-a.tick),delta=Math.atan2(Math.sin(b.angle-a.angle),Math.cos(b.angle-a.angle));return a.angle+delta*t;
  }
}
