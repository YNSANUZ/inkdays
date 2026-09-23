import * as T from 'three';

const shadow=new T.MeshBasicMaterial({color:0x242824,fog:true,side:T.DoubleSide});
shadow.userData.outlineParameters={visible:false};
const sphere=new T.SphereGeometry(1,12,9),cylinder=new T.CylinderGeometry(1,1,1,8);
const part=(parent:T.Object3D,geometry:T.BufferGeometry,position:[number,number,number],scale:[number,number,number])=>{const mesh=new T.Mesh(geometry,shadow);mesh.position.set(...position);mesh.scale.set(...scale);mesh.renderOrder=-1;parent.add(mesh);return mesh;};
const limb=(parent:T.Object3D,a:T.Vector3,b:T.Vector3,width:number)=>{const delta=b.clone().sub(a),mid=a.clone().add(b).multiplyScalar(.5),mesh=part(parent,cylinder,[mid.x,mid.y,mid.z],[width,delta.length(),width]);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());};

export class BossTeaser{
  readonly root=new T.Group();
  constructor(){
    this.root.name='boss-teaser-silhouette';this.root.userData.silhouetteOnly=true;this.root.userData.represents='human-deer';this.root.position.set(5,-.08,-25);this.root.rotation.y=-.08;
    // Leitura frontal simples: peito pesado, cabeça de cervo e braços abaixados.
    part(this.root,sphere,[0,1.18,0],[.48,.66,.24]);part(this.root,sphere,[0,2.03,0],[.31,.48,.22]);part(this.root,sphere,[0,2.43,.01],[.2,.34,.18]);
    for(const side of [-1,1]){
      limb(this.root,new T.Vector3(side*.38,1.58,0),new T.Vector3(side*.62,.7,0),.12);limb(this.root,new T.Vector3(side*.62,.72,0),new T.Vector3(side*.55,.04,0),.1);
      limb(this.root,new T.Vector3(side*.15,2.66,0),new T.Vector3(side*.38,3.08,0),.035);limb(this.root,new T.Vector3(side*.37,3.02,0),new T.Vector3(side*.58,3.25,0),.03);limb(this.root,new T.Vector3(side*.38,2.98,0),new T.Vector3(side*.34,3.34,0),.028);
    }
  }
  set visible(value:boolean){this.root.visible=value;}get visible(){return this.root.visible;}
  update(time:number){this.root.scale.set(1,1+Math.sin(time*.55)*.01,1);this.root.rotation.y=-.08+Math.sin(time*.18)*.01;}
}
