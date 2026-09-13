import * as T from 'three';
import { C, difficulty } from '../config/gameplay';
import { Avatar } from '../player/Avatar';
import type { Player } from '../player/Player';
import type { World } from '../world/World';
export type EnemyState='IDLE'|'CHASE'|'ATTACK'|'DEAD';
export type EnemyKind='horde'|'boss';
export interface Enemy { id:number; kind:EnemyKind; enraged:boolean; avatar:Avatar; health:number; maxHealth:number; speed:number; damage:number; attackRange:number; attackCooldown:number; radius:number; reward:number; cooldown:number; state:EnemyState; age:number; target?:Player }
export class Enemies {
  active:Enemy[]=[]; private serial=0;
  constructor(private scene:T.Scene, private world:World) {}
  spawn(day:number,player:T.Vector3) {
    const stats=difficulty(day);
    for(let attempt=0;attempt<40;attempt++) {
      const a=Math.random()*Math.PI*2, r=C.enemy.spawnMin+Math.random()*(C.enemy.spawnMax-C.enemy.spawnMin);
      const x=player.x+Math.sin(a)*r,z=player.z+Math.cos(a)*r;
      if(Math.hypot(x,z)>C.world.radius-1||this.world.blocked(x,z,C.enemy.radius+1))continue;
      const avatar=new Avatar(true);avatar.root.position.set(x,0,z);this.scene.add(avatar.root);
      this.active.push({id:++this.serial,kind:'horde',enraged:false,avatar,health:stats.health,maxHealth:stats.health,speed:stats.speed,damage:C.enemy.damage,attackRange:C.enemy.attackRange,attackCooldown:C.enemy.attackCooldown,radius:C.enemy.radius,reward:C.enemy.reward,cooldown:C.enemy.attackCooldown,state:'IDLE',age:0});return true;
    } return false;
  }
  spawnBoss(day:number,player:T.Vector3,players=1) {
    const tier=Math.max(0,Math.floor(day/C.day.bossInterval)-1),party=Math.max(1,Math.min(8,Math.floor(players)));
    const health=Math.round((C.boss.health+tier*C.boss.healthGrowth)*(1+C.boss.partyGrowth*(party-1)));
    for(let attempt=0;attempt<40;attempt++){
      const a=Math.random()*Math.PI*2,r=C.enemy.spawnMax,x=player.x+Math.sin(a)*r,z=player.z+Math.cos(a)*r;
      if(Math.hypot(x,z)>C.world.radius-2||this.world.blocked(x,z,C.boss.radius+1))continue;
      const avatar=new Avatar(true);avatar.root.position.set(x,0,z);avatar.root.scale.setScalar(C.boss.scale);this.scene.add(avatar.root);
      this.active.push({id:++this.serial,kind:'boss',enraged:false,avatar,health,maxHealth:health,speed:C.boss.speed,damage:C.boss.damage,attackRange:C.boss.attackRange,attackCooldown:C.boss.attackCooldown,radius:C.boss.radius,reward:C.boss.reward,cooldown:C.boss.attackCooldown,state:'IDLE',age:0});return true;
    }
    return false;
  }
  update(dt:number,players:Player|Player[],onAttack:()=>void) {
    const targets=(Array.isArray(players)?players:[players]).filter(p=>!p.health.dead);
    for(const e of this.active) {
      if(e.state==='DEAD')continue;
      const player=targets.reduce<Player|null>((best,p)=>!best||p.position.distanceToSquared(e.avatar.root.position)<best.position.distanceToSquared(e.avatar.root.position)?p:best,null);e.target=player??undefined;
      if(!player){e.state='IDLE';continue;}
      e.age+=dt;e.cooldown=Math.max(0,e.cooldown-dt);
      const p=e.avatar.root.position, direction=player.position.clone().sub(p);direction.y=0;const distance=direction.length();
      const separation=new T.Vector3();for(const other of this.active){if(other===e)continue;const d=p.clone().sub(other.avatar.root.position);d.y=0;const len=d.length();if(len<1e-4)d.set(e.id<other.id?-1:1,0,0);else d.multiplyScalar(1/len);if(len<1.05)separation.addScaledVector(d,1.05-len);}
      e.state=distance>C.enemy.detection?'IDLE':distance<e.attackRange?'ATTACK':'CHASE';
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
