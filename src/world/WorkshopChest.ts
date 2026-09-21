import * as T from 'three';
import {box,dark,shape,shadow} from './ink';

const brown=new T.MeshToonMaterial({color:0x6b4c2f});
brown.userData.outlineParameters={visible:false};
const metal=new T.MeshToonMaterial({color:0x777b78});
metal.userData.outlineParameters={visible:false};

export class WorkshopChest{
  readonly root=new T.Group();readonly position=this.root.position;
  private readonly lid=new T.Group();private available=true;
  constructor(){
    this.root.name='workshop-chest';this.root.position.set(0,0,4);
    // Pequeno baú low-poly inspirado no modelo de referência: madeira marrom,
    // tampa arqueada e ferragens cinzas legíveis contra o mundo de papel.
    box(this.root,[0,.38,0],[1.4,.72,.88],brown);
    box(this.root,[0,.72,.455],[1.46,.09,.07],metal);box(this.root,[0,.72,-.455],[1.46,.09,.07],metal);
    this.lid.position.set(0,.72,-.42);this.root.add(this.lid);
    const dome=shape(this.lid,new T.CylinderGeometry(.44,.44,1.4,10,1,false,0,Math.PI),brown,[0,.02,.42],[1,1,1]);dome.rotation.z=Math.PI/2;
    for(const x of [-.47,.47]){
      const band=shape(this.lid,new T.TorusGeometry(.455,.035,5,12,Math.PI),metal,[x,.02,.42],[1,1,1]);band.rotation.y=Math.PI/2;
      box(this.root,[x,.38,.455],[.075,.68,.07],metal);box(this.root,[x,.38,-.455],[.075,.68,.07],metal);
    }
    box(this.root,[0,.48,.475],[.24,.35,.08],metal);box(this.root,[0,.5,.525],[.1,.16,.045],dark);
    for(const x of [-.57,.57])for(const z of [-.32,.32])box(this.root,[x,.055,z],[.16,.11,.16],metal);
    shadow(this.root,.9);
  }
  setAvailable(available:boolean){this.available=available;this.root.userData.available=available;this.lid.rotation.x=available?-.16:0;}
  get isAvailable(){return this.available;}
}
