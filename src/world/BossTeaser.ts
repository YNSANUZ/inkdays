import * as T from 'three';

const shadow=new T.MeshBasicMaterial({color:0x1b201d,transparent:true,opacity:.24,depthWrite:false,fog:true});
shadow.userData.outlineParameters={visible:false};
const sphere=new T.SphereGeometry(1,10,8),cylinder=new T.CylinderGeometry(1,1,1,7);
const part=(parent:T.Object3D,geometry:T.BufferGeometry,position:[number,number,number],scale:[number,number,number])=>{const mesh=new T.Mesh(geometry,shadow);mesh.position.set(...position);mesh.scale.set(...scale);mesh.renderOrder=-1;parent.add(mesh);return mesh;};
const limb=(parent:T.Object3D,a:T.Vector3,b:T.Vector3,width:number)=>{const delta=b.clone().sub(a),mid=a.clone().add(b).multiplyScalar(.5),mesh=part(parent,cylinder,[mid.x,mid.y,mid.z],[width,delta.length(),width]);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());};

export class BossTeaser{
  readonly root=new T.Group();
  constructor(){
    this.root.name='boss-teaser-silhouette';this.root.userData.silhouetteOnly=true;this.root.position.set(-3.2,0,-18);this.root.rotation.y=-.18;
    part(this.root,sphere,[0,2.25,0],[.72,1.12,.55]);part(this.root,sphere,[0,3.55,0],[.48,.72,.52]);part(this.root,sphere,[0,4.15,.02],[.38,.5,.42]);
    for(const side of [-1,1]){limb(this.root,new T.Vector3(side*.42,3.8,0),new T.Vector3(side*.78,4.75,0),.055);limb(this.root,new T.Vector3(side*.69,4.48,0),new T.Vector3(side*1.04,4.8,0),.045);limb(this.root,new T.Vector3(side*.75,4.58,0),new T.Vector3(side*.72,5.08,0),.045);limb(this.root,new T.Vector3(side*.55,2.85,0),new T.Vector3(side*.8,1.55,.05),.15);limb(this.root,new T.Vector3(side*.34,1.45,0),new T.Vector3(side*.42,.08,.04),.18);}
  }
  set visible(value:boolean){this.root.visible=value;}get visible(){return this.root.visible;}
  update(time:number){this.root.scale.set(1,1+Math.sin(time*.55)*.018,1);this.root.rotation.y=-.18+Math.sin(time*.18)*.025;}
}
