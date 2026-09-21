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
const hand=(parent:T.Object3D,name:string,position:T.Vector3,mirror:number)=>{
  const group=new T.Group();group.name=name;group.position.copy(position);group.rotation.set(.08,0,mirror*.2);parent.add(group);
  const palm=new T.Mesh(handGeometry,armMaterial);palm.name=`${name}-palm`;palm.scale.set(.082,.11,.055);palm.rotation.z=mirror*.08;group.add(palm);
  // Quatro dedos curtos contornam a empunhadura; o polegar cruza a frente.
  for(let index=0;index<4;index++){const finger=new T.Mesh(handGeometry,armMaterial);finger.name=`${name}-finger-${index+1}`;finger.scale.set(.016,.036,.018);finger.position.set(mirror*(-.018+index*.013),.052-index*.007,-.028);finger.rotation.z=mirror*(1.02+index*.055);group.add(finger);}
  const thumb=new T.Mesh(handGeometry,armMaterial);thumb.name=`${name}-thumb`;thumb.scale.set(.025,.058,.026);thumb.position.set(mirror*.06,-.002,-.045);thumb.rotation.z=mirror*.9;group.add(thumb);return group;
};

/** Arma e mãos vistas apenas pelo dono. O avatar compartilhado continua independente. */
export class FirstPersonWeapon{
  readonly root=new T.Group();private recoil=0;private time=0;
  constructor(camera:T.Camera,drawing:CustomWeapon=draftPistol){
    this.root.name='first-person-drawn-weapon';const profile=firstPersonWeaponProfile(drawing.category),weapon=createDrawnWeapon(drawing);
    weapon.root.name='first-person-weapon';weapon.root.scale.setScalar(profile.scale);weapon.root.rotation.set(-.035,-1.48,-.025);weapon.root.position.set(.015,.105,-.045);
    weapon.root.traverse(object=>{if(object instanceof T.Mesh){const source=object.material as T.MeshToonMaterial,material=new T.MeshBasicMaterial({color:source.color,transparent:false,opacity:1,depthWrite:true});material.userData.outlineParameters={visible:false};object.material=material;}});this.root.add(weapon.root);
    // Viewmodel branco baseado nas proporções do manequim: ombro, antebraço e mão
    // formam uma única silhueta articulada em vez de esferas soltas.
    const rightShoulder=new T.Vector3(.39,-.46,.34),rightElbow=new T.Vector3(.22,-.25,.18),rightGrip=new T.Vector3(.055,-.035,.025);
    const leftShoulder=new T.Vector3(-.39,-.46,.34),leftElbow=new T.Vector3(-.22,-.25,.18),leftGrip=new T.Vector3(-.055,-.035,.025);
    segment(this.root,'right-upper-arm',rightShoulder,rightElbow,.082);segment(this.root,'right-forearm',rightElbow,rightGrip,.073);hand(this.root,'right-hand',rightGrip,-1);
    segment(this.root,'left-upper-arm',leftShoulder,leftElbow,.082);segment(this.root,'left-forearm',leftElbow,leftGrip,.073);hand(this.root,'left-hand',leftGrip,1);
    this.root.position.set(profile.position[0],profile.position[1],profile.position[2]);this.root.rotation.set(-.04,-.08,0);camera.add(this.root);
  }
  fire(){this.recoil=Math.min(1,this.recoil+.72);}
  update(dt:number,moving:number){this.time+=dt;this.recoil=T.MathUtils.damp(this.recoil,0,15,dt);const bob=Math.sin(this.time*9)*Math.min(.012,moving*.002);this.root.position.y=-.31+bob+this.recoil*.025;this.root.position.z=-.9+this.recoil*.055;this.root.rotation.x=-.04-this.recoil*.1;}
  set visible(value:boolean){this.root.visible=value;}
}
