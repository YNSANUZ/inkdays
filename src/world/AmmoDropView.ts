import * as T from 'three';
import type {AmmoDropSnapshot} from '../economy/AmmoDrops';
import {box,dark,stroke} from './ink';

const brass=new T.MeshToonMaterial({color:0x9a7b43});
brass.userData.outlineParameters={visible:false};

export class AmmoDropView{
  readonly root=new T.Group();private elapsed=0;private readonly meshes=new Map<number,T.Group>();
  constructor(){this.root.name='ammo-drops';}
  sync(drops:readonly AmmoDropSnapshot[]){
    const ids=new Set(drops.map(drop=>drop.id));for(const [id,mesh] of this.meshes)if(!ids.has(id)){mesh.removeFromParent();this.meshes.delete(id);}
    for(const drop of drops){let mesh=this.meshes.get(drop.id);if(!mesh){mesh=new T.Group();mesh.name=`ammo-drop-${drop.id}`;box(mesh,[0,0,0],[.55,.28,.32]);box(mesh,[0,.01,.18],[.42,.08,.035],dark);for(let i=0;i<3;i++)stroke(mesh,[-.18+i*.18,.04,.22],[-.12+i*.18,.04,.22],.035,brass);this.root.add(mesh);this.meshes.set(drop.id,mesh);}mesh.position.set(drop.x,.72,drop.z);mesh.userData.remaining=drop.remaining;}
  }
  update(dt:number){this.elapsed+=dt;for(const mesh of this.meshes.values()){mesh.position.y=.72+Math.sin(this.elapsed*2.4+Number(mesh.name.split('-').at(-1)))*.1;mesh.rotation.y+=dt*.7;}}
}
