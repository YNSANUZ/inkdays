import * as T from 'three';

const shadow=new T.MeshBasicMaterial({color:0x242824,fog:true,side:T.DoubleSide});
shadow.userData.outlineParameters={visible:false};
const sphere=new T.SphereGeometry(1,12,9),cylinder=new T.CylinderGeometry(1,1,1,8),box=new T.BoxGeometry(1,1,1);
const part=(parent:T.Object3D,geometry:T.BufferGeometry,position:[number,number,number],scale:[number,number,number])=>{const mesh=new T.Mesh(geometry,shadow);mesh.position.set(...position);mesh.scale.set(...scale);mesh.renderOrder=-1;parent.add(mesh);return mesh;};
const limb=(parent:T.Object3D,a:T.Vector3,b:T.Vector3,width:number)=>{const delta=b.clone().sub(a),mid=a.clone().add(b).multiplyScalar(.5),mesh=part(parent,cylinder,[mid.x,mid.y,mid.z],[width,delta.length(),width]);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());};

export class BossTeaser{
  readonly root=new T.Group();
  constructor(){
    this.root.name='boss-teaser-silhouette';this.root.userData.silhouetteOnly=true;this.root.userData.represents='lizard';this.root.position.set(5,-.08,-25);this.root.rotation.y=-.08;
    // Leitura distante do lagarto: corpo agachado, focinho largo, espinhos e o canhão sobre o ombro.
    part(this.root,sphere,[0,1.05,0],[.62,.7,.3]);part(this.root,sphere,[0,1.86,.04],[.42,.36,.28]);part(this.root,sphere,[0,2.05,.15],[.36,.2,.38]);
    const cannon=part(this.root,box,[.15,2.55,-.04],[.24,.25,1.05]);cannon.rotation.x=-.48;part(this.root,cylinder,[.15,3.03,-.29],[.29,.58,.29]).rotation.x=-.48;
    for(const side of [-1,1]){
      limb(this.root,new T.Vector3(side*.42,1.48,0),new T.Vector3(side*.72,.67,.03),.15);limb(this.root,new T.Vector3(side*.72,.68,.03),new T.Vector3(side*.63,.05,.16),.13);
      limb(this.root,new T.Vector3(side*.27,.84,0),new T.Vector3(side*.47,.1,.12),.18);
      part(this.root,sphere,[side*.22,2.27,0],[.07,.22,.07]).rotation.z=-side*.35;
    }
  }
  set visible(value:boolean){this.root.visible=value;}get visible(){return this.root.visible;}
  update(time:number){this.root.scale.set(1,1+Math.sin(time*.55)*.01,1);this.root.rotation.y=-.08+Math.sin(time*.18)*.01;}
}
