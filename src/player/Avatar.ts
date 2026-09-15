import * as T from 'three';
import { box, dark, gray, ink, paper, red, shadow, sphere, stroke } from '../world/ink';
import type { RiggedAvatar } from './RiggedAvatar';
import { movementDirection } from './LocomotionDirection';
import { createDrawnWeapon } from '../weapons/DrawnWeapon';
import { draftPistol } from '../weapons/CustomWeapon';
export class Avatar {
  root=new T.Group(); body=new T.Group(); procedural=new T.Group(); leftLeg=new T.Group(); rightLeg=new T.Group(); arm=new T.Group(); muzzle=new T.Object3D(); private rig?:RiggedAvatar; private enemy:boolean;
  constructor(enemy=false,boss=false) {
    this.enemy=enemy;this.root.name=boss?'inkdays-boss':enemy?'inkdays-enemy':'inkdays-player';this.root.add(this.body);this.body.add(this.procedural); const mat=enemy?dark:paper;
    const host=this.procedural;
    sphere(host,[0,1.77,0],[.43,.45,.4],mat);
    sphere(host,[0,1.05,0],[.33,.48,.25],mat);
    this.leftLeg.position.set(-.18,.72,0);this.rightLeg.position.set(.18,.72,0);host.add(this.leftLeg,this.rightLeg);
    for(const leg of [this.leftLeg,this.rightLeg]) {sphere(leg,[0,-.25,0],[.145,.3,.15],mat);sphere(leg,[0,-.56,.08],[.18,.14,.25],enemy?dark:gray);}
    this.arm.position.set(enemy?.34:-.42,1.24,.06);host.add(this.arm);
    if(enemy) {
      sphere(this.arm,[.07,-.18,.12],[.13,.35,.14],dark);sphere(host,[-.4,1.02,.15],[.13,.35,.14],dark);
      for(const x of [-.15,.15]) sphere(host,[x,1.8,.365],[.055,.065,.028],red);
      stroke(host,[-.12,1.59,.36],[.12,1.59,.36],.027,ink);
      // Crown-like ink drops give Borrões their own silhouette.
      sphere(host,[-.29,2.11,0],[.08,.21,.08],dark);sphere(host,[.2,2.15,0],[.08,.16,.08],dark);
      if(boss){
        // O Colosso mantém a linguagem arredondada, mas ganha massa e uma coroa de tinta própria.
        sphere(host,[0,1.08,-.02],[.54,.5,.36],paper);sphere(host,[0,1.82,.01],[.53,.5,.45],paper);
        sphere(host,[-.48,1.23,.02],[.23,.3,.24],gray);sphere(host,[.48,1.23,.02],[.23,.3,.24],gray);
        for(const [x,y] of [[-.34,2.2],[-.13,2.31],[.13,2.31],[.34,2.2]] as const)sphere(host,[x,y,0],[.095,.24,.095],dark);
        const mark=box(host,[0,1.78,.39],[.38,.19,.035],dark);mark.name='colossus-mask';
        for(const x of [-.13,.13])sphere(host,[x,1.8,.43],[.06,.07,.03],red);
      }
    } else {
      box(host,[0,1.07,-.34],[.55,.65,.3],gray);box(host,[0,.98,-.52],[.4,.27,.12]);
      for(const x of [-.24,.24]) {stroke(host,[x,.83,-.46],[x,1.43,-.31],.035,ink);stroke(host,[x,1.4,-.16],[x,1.15,.22],.036,gray);}
      sphere(this.arm,[0,-.05,.19],[.14,.17,.29]);sphere(host,[.28,1.12,.17],[.14,.23,.15]);
      const pistol=createDrawnWeapon(draftPistol);pistol.root.position.set(0,.04,.34);this.arm.add(pistol.root);this.muzzle=pistol.muzzle;
      // One small scarf fold; no colored cosmetic noise.
      box(host,[0,1.42,.03],[.48,.11,.35],gray);
    }
    shadow(this.root,.48);
    if(typeof window!=='undefined')void import('./RiggedAvatar').then(({RiggedAvatar})=>{this.rig=new RiggedAvatar(boss?'boss':enemy?'enemy':'player',()=>{this.procedural.visible=false;});this.body.add(this.rig.root);}).catch(()=>{/* mantém o avatar procedural como fallback */});
  }
  animate(t:number,speed:number,crouch=false,action=false,velocity?:{x:number;z:number}) { const stride=Math.min(1,speed/5);this.leftLeg.rotation.x=Math.sin(t*11)*.65*stride;this.rightLeg.rotation.x=-this.leftLeg.rotation.x;this.body.position.y=(crouch?-.35:0)+Math.abs(Math.sin(t*11))*.035*stride;this.body.rotation.x=crouch?.14:0;const motion=action?'attack':this.root.position.y>.08?'jump':crouch?'crouch':speed>.2?'move':'idle';this.rig?.update(t,motion,speed,velocity?movementDirection(this.root.rotation.y,velocity,speed):'forward'); }
}
