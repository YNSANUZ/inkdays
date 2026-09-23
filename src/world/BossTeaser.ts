import * as T from 'three';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {loadHumanDeerAsset} from '../player/HumanDeerAvatar';

const shadow=new T.MeshBasicMaterial({color:0x151a17,transparent:true,opacity:.42,depthWrite:false,fog:true});
shadow.userData.outlineParameters={visible:false};
const sphere=new T.SphereGeometry(1,10,8),cylinder=new T.CylinderGeometry(1,1,1,7);
const part=(parent:T.Object3D,geometry:T.BufferGeometry,position:[number,number,number],scale:[number,number,number])=>{const mesh=new T.Mesh(geometry,shadow);mesh.position.set(...position);mesh.scale.set(...scale);mesh.renderOrder=-1;parent.add(mesh);return mesh;};
const limb=(parent:T.Object3D,a:T.Vector3,b:T.Vector3,width:number)=>{const delta=b.clone().sub(a),mid=a.clone().add(b).multiplyScalar(.5),mesh=part(parent,cylinder,[mid.x,mid.y,mid.z],[width,delta.length(),width]);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());};

export class BossTeaser{
  readonly root=new T.Group();private fallback=new T.Group();private mixer?:T.AnimationMixer;private last=0;
  constructor(){
    this.root.name='boss-teaser-silhouette';this.root.userData.silhouetteOnly=true;this.root.position.set(-3.2,0,-18);this.root.rotation.y=-.18;
    this.root.add(this.fallback);part(this.fallback,sphere,[0,2.25,0],[.72,1.12,.55]);part(this.fallback,sphere,[0,3.55,0],[.48,.72,.52]);part(this.fallback,sphere,[0,4.15,.02],[.38,.5,.42]);
    for(const side of [-1,1]){limb(this.fallback,new T.Vector3(side*.42,3.8,0),new T.Vector3(side*.78,4.75,0),.055);limb(this.fallback,new T.Vector3(side*.69,4.48,0),new T.Vector3(side*1.04,4.8,0),.045);limb(this.fallback,new T.Vector3(side*.75,4.58,0),new T.Vector3(side*.72,5.08,0),.045);limb(this.fallback,new T.Vector3(side*.55,2.85,0),new T.Vector3(side*.8,1.55,.05),.15);limb(this.fallback,new T.Vector3(side*.34,1.45,0),new T.Vector3(side*.42,.08,.04),.18);}
    if(typeof window!=='undefined')void this.install().catch(()=>{/* mantém a silhueta procedural como fallback */});
  }
  private async install(){
    const asset=await loadHumanDeerAsset(),model=clone(asset.scene),content=new T.Group();content.name='human-deer-shadow';content.add(model);this.root.add(content);
    let bounds=new T.Box3().setFromObject(content),size=bounds.getSize(new T.Vector3());
    if(size.z>size.y*1.3){content.rotation.x=-Math.PI/2;content.updateMatrixWorld(true);bounds=new T.Box3().setFromObject(content);size=bounds.getSize(new T.Vector3());}
    content.scale.setScalar(5/Math.max(.001,size.y));content.updateMatrixWorld(true);bounds.setFromObject(content);const center=bounds.getCenter(new T.Vector3());content.position.set(-center.x,-bounds.min.y,-center.z);
    model.traverse(node=>{if(!(node instanceof T.Mesh))return;node.material=shadow;node.castShadow=false;node.receiveShadow=false;node.renderOrder=-1;});
    if(asset.clip){this.mixer=new T.AnimationMixer(model);this.mixer.clipAction(asset.clip).setEffectiveTimeScale(.16).play();}
    this.fallback.visible=false;this.root.userData.usesHumanDeer=true;
  }
  set visible(value:boolean){this.root.visible=value;}get visible(){return this.root.visible;}
  update(time:number){const dt=this.last?Math.min(.1,time-this.last):0;this.last=time;this.mixer?.update(dt);this.root.scale.set(1,1+Math.sin(time*.55)*.012,1);this.root.rotation.y=-.18+Math.sin(time*.18)*.018;}
}
