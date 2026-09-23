import * as T from 'three';
import type {AmmoDropSnapshot} from '../economy/AmmoDrops';

const brass=new T.MeshToonMaterial({color:0xe2b62f}),tip=new T.MeshToonMaterial({color:0xf0ca49});
const casingGeometry=new T.CylinderGeometry(.065,.072,.32,10),tipGeometry=new T.ConeGeometry(.067,.15,10);
const cartridge=(index:number)=>{const group=new T.Group();group.name=`cartridge-${index}`;const casing=new T.Mesh(casingGeometry,brass),point=new T.Mesh(tipGeometry,tip);casing.position.y=.16;point.position.y=.395;casing.castShadow=point.castShadow=true;group.add(casing,point);return group;};

export class AmmoDropView{
  readonly root=new T.Group();private elapsed=0;private readonly meshes=new Map<number,T.Group>();
  constructor(){this.root.name='ammo-drops';}
  sync(drops:readonly AmmoDropSnapshot[]){
    const ids=new Set(drops.map(drop=>drop.id));for(const [id,mesh] of this.meshes)if(!ids.has(id)){mesh.removeFromParent();this.meshes.delete(id);}
    for(const drop of drops){let mesh=this.meshes.get(drop.id);if(!mesh){mesh=new T.Group();mesh.name=`ammo-drop-${drop.id}`;mesh.userData.caliber=drop.caliber;for(let i=0;i<3;i++){const round=cartridge(i);round.position.x=(i-1)*.17;round.rotation.z=(i-1)*-.06;mesh.add(round);}const halo=new T.Mesh(new T.RingGeometry(.28,.34,24),new T.MeshBasicMaterial({color:0xe8bd38,transparent:true,opacity:.35,side:T.DoubleSide}));halo.name='ammo-halo';halo.rotation.x=-Math.PI/2;halo.position.y=-.08;mesh.add(halo);mesh.scale.setScalar(drop.caliber==='762'?1.32:1);this.root.add(mesh);this.meshes.set(drop.id,mesh);}mesh.position.set(drop.x,.92,drop.z);mesh.userData.remaining=drop.remaining;}
  }
  update(dt:number){this.elapsed+=dt;for(const mesh of this.meshes.values()){mesh.position.y=.92+Math.sin(this.elapsed*2.4+Number(mesh.name.split('-').at(-1)))*.13;mesh.rotation.y+=dt*.7;const halo=mesh.getObjectByName('ammo-halo') as T.Mesh|undefined;if(halo)(halo.material as T.MeshBasicMaterial).opacity=.22+.16*(.5+.5*Math.sin(this.elapsed*4));}}
}
