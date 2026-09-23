import * as T from 'three';
import { C, difficulty } from '../config/gameplay';
import { Avatar } from '../player/Avatar';
import type { Player } from '../player/Player';
import type { World } from '../world/World';
export type EnemyState='WANDER'|'CHASE'|'ATTACK'|'DEAD';
export type EnemyKind='horde'|'hunter'|'boss';
export type BossVariant='lizard'|'human-deer';
export interface Enemy { id:number; kind:EnemyKind; bossVariant?:BossVariant; enraged:boolean; avatar:Avatar; health:number; maxHealth:number; speed:number; damage:number; attackRange:number; attackCooldown:number; radius:number; reward:number; cooldown:number; specialCooldown:number; specialWindup:number; specialSerial:number; specialCenter:T.Vector3; state:EnemyState; age:number; target?:Player; perceptionTimer:number; wanderTimer:number; pauseTimer:number; wanderDirection:T.Vector3 }
export class Enemies {
  active:Enemy[]=[]; private serial=0;
  constructor(private scene:T.Scene, private world:World) {}
  spawn(day:number,player:T.Vector3) {
    const stats=difficulty(day);
    for(let attempt=0;attempt<40;attempt++) {
      const a=((this.serial+attempt+1)*2.399963229728653+Math.random()*.45)%(Math.PI*2), r=C.enemy.spawnMin+Math.random()*(C.enemy.spawnMax-C.enemy.spawnMin);
      const x=player.x+Math.sin(a)*r,z=player.z+Math.cos(a)*r;
      if(Math.hypot(x,z)>C.world.radius-1||this.world.blocked(x,z,C.enemy.radius+1))continue;
      const avatar=new Avatar(true);avatar.root.position.set(x,0,z);this.scene.add(avatar.root);
      const id=++this.serial,heading=(id*2.399963229728653+Math.random()*.7)%(Math.PI*2);
      this.active.push({id,kind:'horde',enraged:false,avatar,health:stats.health,maxHealth:stats.health,speed:stats.speed,damage:C.enemy.damage,attackRange:C.enemy.attackRange,attackCooldown:C.enemy.attackCooldown,radius:C.enemy.radius,reward:C.enemy.reward,cooldown:C.enemy.attackCooldown,specialCooldown:Infinity,specialWindup:0,specialSerial:0,specialCenter:new T.Vector3(),state:'WANDER',age:0,perceptionTimer:0,wanderTimer:C.enemy.wanderMin+Math.random()*(C.enemy.wanderMax-C.enemy.wanderMin),pauseTimer:0,wanderDirection:new T.Vector3(Math.sin(heading),0,Math.cos(heading))});return true;
    } return false;
  }
  spawnHunter(day:number,player:T.Vector3) {
    const stats=difficulty(day);
    for(let attempt=0;attempt<40;attempt++){
      const a=((this.serial+attempt+1)*2.399963229728653+Math.random()*.45)%(Math.PI*2),r=C.enemy.spawnMax,x=player.x+Math.sin(a)*r,z=player.z+Math.cos(a)*r;
      if(Math.hypot(x,z)>C.world.radius-1||this.world.blocked(x,z,C.enemy.radius+1))continue;
      const avatar=new Avatar(true,false,'lizard',true);avatar.root.position.set(x,0,z);avatar.root.scale.setScalar(C.hunter.scale);this.scene.add(avatar.root);
      const health=Math.round(stats.health*C.hunter.healthMultiplier),id=++this.serial;
      this.active.push({id,kind:'hunter',enraged:false,avatar,health,maxHealth:health,speed:stats.speed*C.hunter.speedMultiplier,damage:C.hunter.damage,attackRange:C.enemy.attackRange,attackCooldown:C.hunter.attackCooldown,radius:C.enemy.radius,reward:C.hunter.reward,cooldown:C.hunter.attackCooldown,specialCooldown:Infinity,specialWindup:0,specialSerial:0,specialCenter:new T.Vector3(),state:'CHASE',age:0,perceptionTimer:0,wanderTimer:0,pauseTimer:0,wanderDirection:new T.Vector3(0,0,1)});return true;
    }return false;
  }
  spawnBoss(day:number,player:T.Vector3,players=1) {
    const tier=Math.max(0,Math.floor(day/C.day.bossInterval)-1),party=Math.max(1,Math.min(8,Math.floor(players)));
    const health=Math.round((C.boss.health+tier*C.boss.healthGrowth)*(1+C.boss.partyGrowth*(party-1))),bossVariant:BossVariant='lizard',profile=C.boss;
    for(let attempt=0;attempt<40;attempt++){
      const a=Math.random()*Math.PI*2,r=C.enemy.spawnMax,x=player.x+Math.sin(a)*r,z=player.z+Math.cos(a)*r;
      if(Math.hypot(x,z)>C.world.radius-2||this.world.blocked(x,z,profile.radius+1))continue;
      const avatar=new Avatar(true,true,bossVariant);avatar.root.position.set(x,0,z);avatar.root.scale.setScalar(profile.scale);this.scene.add(avatar.root);
      this.active.push({id:++this.serial,kind:'boss',bossVariant,enraged:false,avatar,health,maxHealth:health,speed:profile.speed,damage:profile.damage,attackRange:profile.attackRange,attackCooldown:profile.attackCooldown,radius:profile.radius,reward:C.boss.reward,cooldown:profile.attackCooldown,specialCooldown:C.boss.slamCooldown,specialWindup:0,specialSerial:0,specialCenter:new T.Vector3(),state:'WANDER',age:0,perceptionTimer:0,wanderTimer:0,pauseTimer:0,wanderDirection:new T.Vector3(0,0,1)});return true;
    }
    return false;
  }
  update(dt:number,players:Player|Player[],onAttack:()=>void,onBossSlam?:(enemy:Enemy,center:T.Vector3)=>void) {
    const targets=(Array.isArray(players)?players:[players]).filter(p=>!p.health.dead);
    for(const e of this.active) {
      if(e.state==='DEAD')continue;
      e.age+=dt;e.cooldown=Math.max(0,e.cooldown-dt);e.specialCooldown=Math.max(0,e.specialCooldown-dt);
      const p=e.avatar.root.position;e.perceptionTimer-=dt;if(e.target&&!targets.includes(e.target)){e.target=undefined;e.perceptionTimer=0;}
      if(e.perceptionTimer<=0){
        e.perceptionTimer=C.enemy.perceptionInterval+(e.id%5)*.012;
        if(e.kind==='horde'&&e.target&&e.target.position.distanceToSquared(p)>C.enemy.disengage*C.enemy.disengage)e.target=undefined;
        const radius=e.kind==='horde'?C.enemy.detection*C.enemy.detection:Infinity;
        const nearest=targets.reduce<Player|undefined>((best,candidate)=>{const distance=candidate.position.distanceToSquared(p);return distance<=radius&&(!best||distance<best.position.distanceToSquared(p))?candidate:best;},undefined);if(nearest)e.target=nearest;
      }
      const player=e.target;
      if(!player){
        e.state='WANDER';e.pauseTimer=Math.max(0,e.pauseTimer-dt);e.wanderTimer-=dt;
        if(e.wanderTimer<=0){const heading=(e.id*1.61803398875+e.age*.73+Math.random()*.9)%(Math.PI*2);e.wanderDirection.set(Math.sin(heading),0,Math.cos(heading));e.wanderTimer=C.enemy.wanderMin+Math.random()*(C.enemy.wanderMax-C.enemy.wanderMin);e.pauseTimer=C.enemy.pauseMin+Math.random()*(C.enemy.pauseMax-C.enemy.pauseMin);}
        if(e.pauseTimer<=0){const before=p.clone();this.world.move(p,e.wanderDirection.x*e.speed*C.enemy.wanderSpeed*dt,e.wanderDirection.z*e.speed*C.enemy.wanderSpeed*dt,e.radius);if(before.distanceToSquared(p)<1e-8){e.wanderTimer=0;e.pauseTimer=0;}}
        e.avatar.root.rotation.y=Math.atan2(e.wanderDirection.x,e.wanderDirection.z);e.avatar.animate(e.age,e.pauseTimer>0?0:e.speed*C.enemy.wanderSpeed,false,false);continue;
      }
      const direction=player.position.clone().sub(p);direction.y=0;const distance=direction.length();
      if(e.kind==='boss'&&e.specialWindup>0){e.specialWindup=Math.max(0,e.specialWindup-dt);e.state='ATTACK';if(e.specialWindup===0){onBossSlam?.(e,e.specialCenter.clone());e.specialCooldown=(e.bossVariant==='human-deer'?C.humanDeer.roarCooldown:C.boss.slamCooldown)*(e.enraged ? .72 : 1);}e.avatar.animate(e.age,0,false,true);e.avatar.arm.rotation.x=-1.1;continue;}
      if(e.kind==='boss'&&e.specialCooldown===0&&distance<=(e.bossVariant==='human-deer'?C.humanDeer.roarTriggerRange:C.boss.slamTriggerRange)){e.specialCenter.copy(p);e.specialWindup=e.bossVariant==='human-deer'?C.humanDeer.roarWindup:C.boss.slamWindup;e.specialSerial++;e.state='ATTACK';continue;}
      const separation=new T.Vector3();for(const other of this.active){if(other===e)continue;const d=p.clone().sub(other.avatar.root.position);d.y=0;const len=d.length();if(len<1e-4)d.set(e.id<other.id?-1:1,0,0);else d.multiplyScalar(1/len);if(len<1.05)separation.addScaledVector(d,1.05-len);}
      e.state=distance<e.attackRange?'ATTACK':'CHASE';
      if(e.state==='CHASE') {
        direction.normalize();
        // Choose a short obstacle-free direction. Local steering stays independent of rendering.
        let best:T.Vector3|null=null,bestScore=-Infinity;
        for(const angle of [0,.55,-.55,1.1,-1.1,1.57,-1.57,2.1,-2.1]) {
          const candidate=direction.clone().applyAxisAngle(new T.Vector3(0,1,0),angle);
          if(this.world.blocked(p.x+candidate.x*1.1,p.z+candidate.z*1.1,e.radius))continue;
          const score=candidate.dot(direction);if(score>bestScore){best=candidate;bestScore=score;}
        }
        if(best) {
          best.addScaledVector(separation,.8).normalize();this.world.move(p,best.x*e.speed*dt,best.z*e.speed*dt,e.radius);
        }
      } else if(e.state==='ATTACK'&&e.cooldown===0) {
        e.cooldown=e.attackCooldown;
        const origin=p.clone().add(new T.Vector3(0,1,0));
        const target=player.position.clone().add(new T.Vector3(0,1,0));
        const attackRay=new T.Raycaster(origin,target.clone().sub(origin).normalize(),0,origin.distanceTo(target));
        if(player.position.y<1&&!attackRay.intersectObjects(this.world.solids,false).length&&player.health.damage(e.damage))onAttack();
      }
      if(e.state==='ATTACK'&&separation.lengthSq()>.0001){separation.normalize();this.world.move(p,separation.x*e.speed*.35*dt,separation.z*e.speed*.35*dt,e.radius);}
      e.avatar.root.rotation.y=Math.atan2(direction.x,direction.z);
      e.avatar.animate(e.age,e.state==='CHASE'?e.speed:0,false,e.state==='ATTACK');
      e.avatar.arm.rotation.x=e.state==='ATTACK'?-Math.sin(e.cooldown/e.attackCooldown*Math.PI)*1.3:0;
    }
  }
  damage(e:Enemy,amount:number) { if(e.state==='DEAD')return false;e.health-=amount;if(e.kind==='boss'&&!e.enraged&&e.health>0&&e.health<=e.maxHealth/2){e.enraged=true;e.speed*=1.35;e.attackCooldown*=.62;e.cooldown=Math.min(e.cooldown,e.attackCooldown);e.damage=Math.round(e.damage*1.2);}if(e.health>0)return false;e.state='DEAD';this.scene.remove(e.avatar.root);this.active=this.active.filter(o=>o!==e);return true; }
  clear() {for(const e of this.active)this.scene.remove(e.avatar.root);this.active=[];}
}
