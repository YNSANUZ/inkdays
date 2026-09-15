import { C, hordePlan, type HordePlan } from '../config/gameplay';
export interface HordeState {total:number;spawned:number;killed:number;remaining:number;active:number;queued:number;wave:number;waves:number;complete:boolean;assist:boolean;boss:boolean}
export class Horde {
  spawned=0;goal=0;timer=0;private killed=0;private queued=0;private waveIndex=-1;private waveElapsed=0;private emptyElapsed=0;private completionElapsed=0;private lastEnemyElapsed=0;private plan:HordePlan=hordePlan(1);private bossStage=0;
  begin(day:number,players=1){this.plan=hordePlan(day,players);this.spawned=this.killed=this.queued=this.timer=this.waveElapsed=this.emptyElapsed=this.completionElapsed=this.lastEnemyElapsed=this.bossStage=0;this.waveIndex=-1;this.goal=this.plan.total;if(!this.plan.boss)this.releaseWave();}
  private releaseWave(){if(this.waveIndex+1>=this.plan.waves.length)return;this.waveIndex++;this.queued+=this.plan.waves[this.waveIndex];this.waveElapsed=this.emptyElapsed=0;}
  update(dt:number,active:number,spawn:()=>boolean,bossHealthRatio:number|null=null,lastEnemiesUncontacted=true){
    this.killed=Math.max(this.killed,this.spawned-active);this.waveElapsed+=dt;this.emptyElapsed=active===0&&this.queued===0?this.emptyElapsed+dt:0;
    if(this.plan.boss&&bossHealthRatio!==null)while(this.bossStage<this.plan.waves.length&&bossHealthRatio<=C.bossWaves.thresholds[this.bossStage]){this.releaseWave();this.bossStage++;}
    else if(this.plan.boss&&this.bossStage>0)while(this.bossStage<this.plan.waves.length){this.releaseWave();this.bossStage++;}
    else if(!this.plan.boss&&this.waveIndex+1<this.plan.waves.length&&(this.waveElapsed>=this.plan.maxInterval||this.emptyElapsed>=C.horde.clearWaveDelay))this.releaseWave();
    this.timer-=dt;if(this.timer<=0&&this.queued>0&&active<this.plan.maxActive&&this.spawned<this.goal&&spawn()){this.spawned++;this.queued--;active++;this.timer=C.day.spawnInterval;}
    const remaining=this.remaining(active);this.lastEnemyElapsed=remaining>0&&remaining<=3&&this.spawned===this.goal&&lastEnemiesUncontacted?this.lastEnemyElapsed+dt:0;return remaining===0;
  }
  remaining(active:number){this.killed=Math.max(this.killed,this.spawned-active);return Math.max(0,this.goal-this.killed);}
  canComplete(dt:number,active:number,bossAlive=false){if(this.remaining(active)>0||bossAlive){this.completionElapsed=0;return false;}this.completionElapsed+=dt;return this.completionElapsed>=C.horde.completionDelay;}
  state(active:number):HordeState{const remaining=this.remaining(active),assistElapsed=this.lastEnemyElapsed-C.horde.lastEnemyAssist;return {total:this.goal,spawned:this.spawned,killed:this.killed,remaining,active,queued:this.queued,wave:Math.max(0,this.waveIndex+1),waves:this.plan.waves.length,complete:remaining===0,assist:remaining>0&&remaining<=3&&assistElapsed>=0&&assistElapsed%12<4,boss:this.plan.boss};}
}
