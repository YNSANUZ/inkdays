import {C} from '../config/gameplay';

export interface AmmoDropPlayer {
  id:string;x:number;z:number;alive:boolean;ready:boolean;ammo:number;reserve:number;
}
export interface AmmoDropSnapshot {id:number;x:number;z:number;remaining:number}
interface AmmoDrop extends AmmoDropSnapshot {}
interface Point {x:number;z:number}
interface AmmoDropOptions {points?:readonly Point[];rng?:()=>number}

export const AMMO_DROP_POINTS:readonly Point[]=[
  {x:-14,z:-6},{x:14,z:-5},{x:-11,z:13},{x:12,z:14},{x:0,z:-17},{x:19,z:5},{x:-19,z:4},
];

const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.z-b.z);

export class AmmoDropDirector {
  private readonly points:readonly Point[];
  private readonly rng:()=>number;
  private drops:AmmoDrop[]=[];
  private recent:Point[]=[];
  private spawnClock=0;
  private emergencyClock=0;
  private emergencyUsed=false;
  private nextId=1;

  constructor(options:AmmoDropOptions={}){
    this.points=options.points??AMMO_DROP_POINTS;
    this.rng=options.rng??Math.random;
  }

  update(dt:number,players:readonly AmmoDropPlayer[]){
    if(!Number.isFinite(dt)||dt<=0)return;
    this.drops=this.drops.map(drop=>({...drop,remaining:Math.max(0,drop.remaining-dt)})).filter(drop=>drop.remaining>0);
    const live=players.filter(player=>player.ready&&player.alive);
    if(!live.length){this.spawnClock=0;this.emergencyClock=0;this.emergencyUsed=false;return;}
    this.spawnClock+=dt;
    const allEmpty=live.every(player=>player.ammo<=0&&player.reserve<=0);
    if(allEmpty&&!this.emergencyUsed){
      this.emergencyClock+=dt;
      if(this.emergencyClock>=C.ammoDrops.emergencyDelay){
        this.spawn(live,true);
        this.emergencyUsed=true;
        this.emergencyClock=0;
      }
    }else if(!allEmpty){this.emergencyClock=0;this.emergencyUsed=false;}
    while(this.spawnClock>=C.ammoDrops.interval){
      this.spawnClock-=C.ammoDrops.interval;
      this.spawn(live,false);
    }
  }

  collect(dropId:number,player:AmmoDropPlayer){
    const index=this.drops.findIndex(drop=>drop.id===dropId);
    if(index<0||!player.alive||!player.ready||player.reserve>=C.weapon.maxReserve)return {ok:false,rounds:0};
    const drop=this.drops[index];
    if(distance(drop,player)>C.ammoDrops.collectionRadius)return {ok:false,rounds:0};
    const rounds=Math.min(C.ammoDrops.rounds,C.weapon.maxReserve-player.reserve);
    if(rounds<=0)return {ok:false,rounds:0};
    this.drops.splice(index,1);
    return {ok:true,rounds};
  }

  snapshot():AmmoDropSnapshot[]{return this.drops.map(drop=>({...drop}));}

  reset(){
    this.drops=[];this.recent=[];this.spawnClock=0;this.emergencyClock=0;this.emergencyUsed=false;this.nextId=1;
  }

  private spawn(players:readonly AmmoDropPlayer[],emergency:boolean){
    if(this.drops.length>=C.ammoDrops.maxActive)return false;
    const eligible=this.points.filter(point=>
      !this.recent.some(previous=>previous.x===point.x&&previous.z===point.z)&&
      players.every(player=>distance(point,player)>C.ammoDrops.playerExclusion)&&
      this.drops.every(drop=>drop.x!==point.x||drop.z!==point.z)
    );
    if(!eligible.length)return false;
    const point=emergency
      ? eligible.reduce((best,candidate)=>Math.min(...players.map(player=>distance(candidate,player)))<Math.min(...players.map(player=>distance(best,player)))?candidate:best)
      : eligible[Math.min(eligible.length-1,Math.floor(Math.max(0,this.rng())*eligible.length))];
    this.drops.push({id:this.nextId++,x:point.x,z:point.z,remaining:C.ammoDrops.lifetime});
    this.recent.push(point);if(this.recent.length>2)this.recent.shift();
    return true;
  }
}
