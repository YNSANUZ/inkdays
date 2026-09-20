import * as T from 'three';
import { createDrawnWeapon } from './DrawnWeapon';
import { draftPistol } from './CustomWeapon';
import type { WeaponCategoryId } from './Categories';
import type {CustomWeapon} from './CustomWeapon';

export const firstPersonWeaponProfile=(category:WeaponCategoryId)=>category==='pistol'
  ?{scale:.54,position:[0,-.31,-.9] as const,twoHanded:true}
  :{scale:.94,position:[.42,-.31,-1.28] as const,twoHanded:true};

const armGeometry=new T.SphereGeometry(1,14,10);
const handGeometry=new T.CapsuleGeometry(.58,.8,6,12);
const armMaterial=new T.MeshToonMaterial({color:0xe5e2d8});
const segment=(parent:T.Object3D,name:string,from:T.Vector3,to:T.Vector3,radius:number)=>{
  const direction=to.clone().sub(from),mesh=new T.Mesh(armGeometry,armMaterial);mesh.name=name;
  mesh.position.copy(from).add(to).multiplyScalar(.5);mesh.scale.set(radius,direction.length()*.52,radius);
  mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());parent.add(mesh);return mesh;
};
const hand=(parent:T.Object3D,name:string,position:T.Vector3,rotation:T.Euler)=>{
  const mesh=new T.Mesh(handGeometry,armMaterial);mesh.name=name;mesh.position.copy(position);mesh.scale.set(.075,.115,.075);mesh.rotation.copy(rotation);parent.add(mesh);return mesh;
};

/** Arma e mãos vistas apenas pelo dono. O avatar compartilhado continua independente. */
export class FirstPersonWeapon{
  readonly root=new T.Group();private recoil=0;private time=0;
  constructor(camera:T.Camera,drawing:CustomWeapon=draftPistol){
    this.root.name='first-person-drawn-weapon';const profile=firstPersonWeaponProfile(drawing.category),weapon=createDrawnWeapon(drawing);
    weapon.root.name='first-person-weapon';weapon.root.scale.setScalar(profile.scale);weapon.root.rotation.set(-.04,-1.48,0);weapon.root.position.set(.01,.075,-.025);
    weapon.root.traverse(object=>{if(object instanceof T.Mesh){const source=object.material as T.MeshToonMaterial,material=new T.MeshBasicMaterial({color:source.color,transparent:false,opacity:1,depthWrite:true});material.userData.outlineParameters={visible:false};object.material=material;}});this.root.add(weapon.root);
    // Viewmodel branco baseado nas proporções do manequim: ombro, antebraço e mão
    // formam uma única silhueta articulada em vez de esferas soltas.
    const rightShoulder=new T.Vector3(.39,-.46,.34),rightElbow=new T.Vector3(.22,-.25,.18),rightGrip=new T.Vector3(.055,-.035,.025);
    const leftShoulder=new T.Vector3(-.39,-.46,.34),leftElbow=new T.Vector3(-.22,-.25,.18),leftGrip=new T.Vector3(-.055,-.035,.025);
    segment(this.root,'right-upper-arm',rightShoulder,rightElbow,.082);segment(this.root,'right-forearm',rightElbow,rightGrip,.073);hand(this.root,'right-hand',rightGrip,new T.Euler(.12,0,-.26));
    segment(this.root,'left-upper-arm',leftShoulder,leftElbow,.082);segment(this.root,'left-forearm',leftElbow,leftGrip,.073);hand(this.root,'left-hand',leftGrip,new T.Euler(.12,0,.26));
    this.root.position.set(profile.position[0],profile.position[1],profile.position[2]);this.root.rotation.set(-.04,-.08,0);camera.add(this.root);
  }
  fire(){this.recoil=Math.min(1,this.recoil+.72);}
  update(dt:number,moving:number){this.time+=dt;this.recoil=T.MathUtils.damp(this.recoil,0,15,dt);const bob=Math.sin(this.time*9)*Math.min(.012,moving*.002);this.root.position.y=-.31+bob+this.recoil*.025;this.root.position.z=-.9+this.recoil*.055;this.root.rotation.x=-.04-this.recoil*.1;}
  set visible(value:boolean){this.root.visible=value;}
}
