import * as T from 'three';
import { createDrawnWeapon } from './DrawnWeapon';
import { draftPistol } from './CustomWeapon';
import type { WeaponCategoryId } from './Categories';

export const firstPersonWeaponProfile=(category:WeaponCategoryId)=>category==='pistol'
  ?{scale:.72,position:[.23,-.22,-.92] as const,twoHanded:true}
  :{scale:.94,position:[.42,-.31,-1.28] as const,twoHanded:true};

const armGeometry=new T.SphereGeometry(1,14,10);
const armMaterial=new T.MeshToonMaterial({color:0xe5e2d8});
const segment=(parent:T.Object3D,name:string,from:T.Vector3,to:T.Vector3,radius:number)=>{
  const direction=to.clone().sub(from),mesh=new T.Mesh(armGeometry,armMaterial);mesh.name=name;
  mesh.position.copy(from).add(to).multiplyScalar(.5);mesh.scale.set(radius,direction.length()*.52,radius);
  mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());parent.add(mesh);return mesh;
};
const hand=(parent:T.Object3D,name:string,position:T.Vector3,rotation:T.Euler)=>{
  const mesh=new T.Mesh(armGeometry,armMaterial);mesh.name=name;mesh.position.copy(position);mesh.scale.set(.055,.085,.06);mesh.rotation.copy(rotation);parent.add(mesh);return mesh;
};

/** Arma e mãos vistas apenas pelo dono. O avatar compartilhado continua independente. */
export class FirstPersonWeapon{
  readonly root=new T.Group();private recoil=0;private time=0;
  constructor(camera:T.Camera,category:WeaponCategoryId='pistol'){
    this.root.name='first-person-drawn-weapon';const profile=firstPersonWeaponProfile(category),weapon=createDrawnWeapon(draftPistol);
    weapon.root.name='first-person-weapon';weapon.root.scale.setScalar(profile.scale);weapon.root.rotation.set(-.08,-2.18,-.04);weapon.root.position.set(.015,.035,-.02);
    weapon.root.traverse(object=>{if(object instanceof T.Mesh){const source=object.material as T.Material,material=source.clone();material.transparent=true;material.opacity=.82;material.depthWrite=false;object.material=material;}});this.root.add(weapon.root);
    // Viewmodel branco baseado nas proporções do manequim: ombro, antebraço e mão
    // formam uma única silhueta articulada em vez de esferas soltas.
    const rightShoulder=new T.Vector3(.31,-.42,.34),rightElbow=new T.Vector3(.19,-.24,.22),rightGrip=new T.Vector3(.015,-.055,.075);
    const leftShoulder=new T.Vector3(-.37,-.39,.31),leftElbow=new T.Vector3(-.24,-.21,.16),leftGrip=new T.Vector3(-.075,-.025,-.015);
    segment(this.root,'right-upper-arm',rightShoulder,rightElbow,.068);segment(this.root,'right-forearm',rightElbow,rightGrip,.06);hand(this.root,'right-hand',rightGrip,new T.Euler(.2,0,-.36));
    segment(this.root,'left-upper-arm',leftShoulder,leftElbow,.068);segment(this.root,'left-forearm',leftElbow,leftGrip,.06);hand(this.root,'left-hand',leftGrip,new T.Euler(.12,0,.42));
    this.root.position.set(profile.position[0],profile.position[1],profile.position[2]);this.root.rotation.set(-.04,-.08,0);camera.add(this.root);
  }
  fire(){this.recoil=Math.min(1,this.recoil+.72);}
  update(dt:number,moving:number){this.time+=dt;this.recoil=T.MathUtils.damp(this.recoil,0,15,dt);const bob=Math.sin(this.time*9)*Math.min(.012,moving*.002);this.root.position.y=-.22+bob+this.recoil*.025;this.root.position.z=-.92+this.recoil*.055;this.root.rotation.x=-.04-this.recoil*.1;}
  set visible(value:boolean){this.root.visible=value;}
}
