import * as T from 'three';
import { box, dark, gray, ink, paper, red, shadow, sphere, stroke } from '../world/ink';
import type { RiggedAvatar } from './RiggedAvatar';
export class Avatar {
  root=new T.Group(); body=new T.Group(); procedural=new T.Group(); leftLeg=new T.Group(); rightLeg=new T.Group(); arm=new T.Group(); muzzle=new T.Object3D(); private rig?:RiggedAvatar; private enemy:boolean;
  constructor(enemy=false) {
    this.enemy=enemy;this.root.add(this.body);this.body.add(this.procedural); const mat=enemy?dark:paper;
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
    } else {
      box(host,[0,1.07,-.34],[.55,.65,.3],gray);box(host,[0,.98,-.52],[.4,.27,.12]);
      for(const x of [-.24,.24]) {stroke(host,[x,.83,-.46],[x,1.43,-.31],.035,ink);stroke(host,[x,1.4,-.16],[x,1.15,.22],.036,gray);}
      sphere(this.arm,[0,-.05,.19],[.14,.17,.29]);sphere(host,[.28,1.12,.17],[.14,.23,.15]);
      box(this.arm,[0,.04,.52],[.13,.15,.4],ink);box(this.arm,[0,-.1,.4],[.12,.23,.13],gray);this.muzzle.position.set(0,.04,.76);this.arm.add(this.muzzle);
      // One small scarf fold; no colored cosmetic noise.
      box(host,[0,1.42,.03],[.48,.11,.35],gray);
    }
    shadow(this.root,.48);
    if(typeof window!=='undefined')void import('./RiggedAvatar').then(({RiggedAvatar})=>{this.rig=new RiggedAvatar(enemy?'enemy':'player',()=>{this.procedural.visible=false;});this.body.add(this.rig.root);}).catch(()=>{/* mantém o avatar procedural como fallback */});
  }
  animate(t:number,speed:number,crouch=false,action=false) { const stride=Math.min(1,speed/5);this.leftLeg.rotation.x=Math.sin(t*11)*.65*stride;this.rightLeg.rotation.x=-this.leftLeg.rotation.x;this.body.position.y=(crouch?-.35:0)+Math.abs(Math.sin(t*11))*.035*stride;this.body.rotation.x=crouch?.14:0;const motion=action?'attack':this.root.position.y>.08?'jump':crouch?'crouch':speed>.2?'move':'idle';this.rig?.update(t,motion,speed); }
}
