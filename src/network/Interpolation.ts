import type { Point } from '../simulation/Movement';
interface Frame {tick:number;position:Point}
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
    const target=this.latestTick+(now-this.arrival)/1000*60-this.delayTicks;
    let a=this.frames[0],b=this.frames.at(-1)!;
    for(let i=1;i<this.frames.length;i++)if(this.frames[i].tick>=target){a=this.frames[i-1];b=this.frames[i];break;}
    if(target<=a.tick)return {...a.position};if(target>=b.tick)return {...b.position};
    const t=(target-a.tick)/(b.tick-a.tick);return {x:a.position.x+(b.position.x-a.position.x)*t,y:a.position.y+(b.position.y-a.position.y)*t,z:a.position.z+(b.position.z-a.position.z)*t};
  }
}
