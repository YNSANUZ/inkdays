import * as T from 'three';
import {box,dark,shape} from './ink';

const brown=new T.MeshToonMaterial({color:0x6b4c2f});
brown.userData.outlineParameters={visible:false};

export class WorkshopChest{
  readonly root=new T.Group();readonly position=this.root.position;
  private readonly lid=new T.Group();private available=true;
  constructor(){
    this.root.name='workshop-chest';this.root.position.set(0,0,4);
    box(this.root,[0,.55,0],[2.1,1.05,1.25],brown);
    this.lid.position.y=1.05;this.root.add(this.lid);
    shape(this.lid,new T.CylinderGeometry(.63,.63,2.1,12,1,false,0,Math.PI),brown,[0,0,0],[1,1,1]);
    box(this.root,[0,.58,.65],[.22,.55,.08],dark);box(this.root,[0,.82,.69],[.12,.18,.08],dark);
    for(const x of [-.86,.86])box(this.root,[x,.55,.64],[.1,1,.08],dark);
  }
  setAvailable(available:boolean){this.available=available;this.root.userData.available=available;this.lid.rotation.x=available?-.08:0;}
  get isAvailable(){return this.available;}
}
