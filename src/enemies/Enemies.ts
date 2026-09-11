import * as T from 'three';
import { C, difficulty } from '../config/gameplay';
import { Avatar } from '../player/Avatar';
import type { Player } from '../player/Player';
import type { World } from '../world/World';
export type EnemyState='IDLE'|'CHASE'|'ATTACK'|'DEAD';
export interface Enemy { id:number; avatar:Avatar; health:number; speed:number; cooldown:number; state:EnemyState; age:number }
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
      this.active.push({id:++this.serial,avatar,health:stats.health,speed:stats.speed,cooldown:C.enemy.attackCooldown,state:'IDLE',age:0});return true;
    } return false;
  }
  update(dt:number,player:Player,onAttack:()=>void) {
    for(const e of this.active) {
      if(e.state==='DEAD')continue;
      e.age+=dt;e.cooldown=Math.max(0,e.cooldown-dt);
      const p=e.avatar.root.position, direction=player.position.clone().sub(p);direction.y=0;const distance=direction.length();
      e.state=distance>C.enemy.detection?'IDLE':distance<C.enemy.attackRange?'ATTACK':'CHASE';
      if(e.state==='CHASE') {
        direction.normalize();
        // Choose a short obstacle-free direction. Local steering stays independent of rendering.
        let best:T.Vector3|null=null,bestScore=-Infinity;
        for(const angle of [0,.55,-.55,1.1,-1.1,1.57,-1.57,2.1,-2.1]) {
          const candidate=direction.clone().applyAxisAngle(new T.Vector3(0,1,0),angle);
          if(this.world.blocked(p.x+candidate.x*1.1,p.z+candidate.z*1.1,C.enemy.radius))continue;
          const score=candidate.dot(direction);if(score>bestScore){best=candidate;bestScore=score;}
        }
        if(best) {
          const separation=new T.Vector3();for(const other of this.active) {if(other===e)continue;const d=p.clone().sub(other.avatar.root.position);d.y=0;const len=d.length();if(len>0&&len<1)separation.addScaledVector(d,(1-len)/len);}
          best.addScaledVector(separation,.8).normalize();this.world.move(p,best.x*e.speed*dt,best.z*e.speed*dt,C.enemy.radius);
        }
      } else if(e.state==='ATTACK'&&e.cooldown===0) {
        e.cooldown=C.enemy.attackCooldown;
        const origin=p.clone().add(new T.Vector3(0,1,0));
        const target=player.position.clone().add(new T.Vector3(0,1,0));
        const attackRay=new T.Raycaster(origin,target.clone().sub(origin).normalize(),0,origin.distanceTo(target));
        if(player.position.y<1&&!attackRay.intersectObjects(this.world.solids,false).length&&player.health.damage(C.enemy.damage))onAttack();
      }
      e.avatar.root.rotation.y=Math.atan2(direction.x,direction.z);
      e.avatar.animate(e.age,e.state==='CHASE'?e.speed:0);
      e.avatar.arm.rotation.x=e.state==='ATTACK'?-Math.sin(e.cooldown/C.enemy.attackCooldown*Math.PI)*1.3:0;
    }
  }
  damage(e:Enemy,amount:number) { if(e.state==='DEAD')return false;e.health-=amount;if(e.health>0)return false;e.state='DEAD';this.scene.remove(e.avatar.root);this.active=this.active.filter(o=>o!==e);return true; }
  clear() {for(const e of this.active)this.scene.remove(e.avatar.root);this.active=[];}
}
