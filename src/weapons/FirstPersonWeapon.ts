import * as T from 'three';
import { createDrawnWeapon } from './DrawnWeapon';
import { draftPistol } from './CustomWeapon';
import { paper, sphere, stroke } from '../world/ink';
import type { WeaponCategoryId } from './Categories';

export const firstPersonWeaponProfile=(category:WeaponCategoryId)=>category==='pistol'
  ?{scale:.58,position:[.32,-.26,-1.05] as const,twoHanded:true}
  :{scale:.94,position:[.42,-.31,-1.28] as const,twoHanded:true};

/** Arma e mãos vistas apenas pelo dono. O avatar compartilhado continua independente. */
export class FirstPersonWeapon{
  readonly root=new T.Group();private recoil=0;private time=0;
  constructor(camera:T.Camera,category:WeaponCategoryId='pistol'){
    this.root.name='first-person-drawn-weapon';const profile=firstPersonWeaponProfile(category),weapon=createDrawnWeapon(draftPistol);
    weapon.root.scale.setScalar(profile.scale);weapon.root.rotation.set(0,Math.PI/2,-.08);this.root.add(weapon.root);
    // A pistola pequena recebe as duas mãos próximas, como na referência.
    sphere(this.root,[-.1,-.035,.06],[.085,.1,.09],paper);sphere(this.root,[.015,-.065,.13],[.085,.1,.09],paper);
    stroke(this.root,[-.1,-.07,.1],[-.21,-.2,.3],.048,paper);stroke(this.root,[.015,-.1,.16],[.14,-.22,.34],.048,paper);
    this.root.position.set(profile.position[0],profile.position[1],profile.position[2]);this.root.rotation.set(-.04,-.08,0);camera.add(this.root);
  }
  fire(){this.recoil=Math.min(1,this.recoil+.72);}
  update(dt:number,moving:number){this.time+=dt;this.recoil=T.MathUtils.damp(this.recoil,0,15,dt);const bob=Math.sin(this.time*9)*Math.min(.012,moving*.002);this.root.position.y=-.26+bob+this.recoil*.025;this.root.position.z=-1.05+this.recoil*.055;this.root.rotation.x=-.04-this.recoil*.1;}
  set visible(value:boolean){this.root.visible=value;}
}
