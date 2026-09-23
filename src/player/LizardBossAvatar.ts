import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';

let cached:Promise<T.Object3D>|undefined;

async function load(){
  const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
  return (await loader.loadAsync(`${import.meta.env.BASE_URL}assets/characters/lizard-boss.glb`)).scene;
}

export const loadLizardBossAsset=()=>cached??=load();

/** Visual do Colosso do Dia 10. O GLB não possui rig, então a presença e o ataque
 * são comunicados por movimentos curtos do corpo inteiro, mantendo a malha intacta. */
export class LizardBossAvatar{
  readonly root=new T.Group();private content?:T.Group;
  constructor(ready:()=>void){void this.install(ready).catch(()=>{/* mantém o Colosso procedural como fallback */});}
  private async install(ready:()=>void){
    const model=clone(await loadLizardBossAsset()),content=new T.Group();content.add(model);this.root.add(content);
    let bounds=new T.Box3().setFromObject(content),size=bounds.getSize(new T.Vector3());
    if(size.z>size.y*1.35){content.rotation.x=-Math.PI/2;content.updateMatrixWorld(true);bounds=new T.Box3().setFromObject(content);size=bounds.getSize(new T.Vector3());}
    const scale=2.9/Math.max(.001,size.y);content.scale.setScalar(scale);content.updateMatrixWorld(true);bounds.setFromObject(content);
    const center=bounds.getCenter(new T.Vector3());content.position.set(-center.x,-bounds.min.y,-center.z);
    model.traverse(node=>{if(!(node instanceof T.Mesh))return;node.castShadow=true;node.receiveShadow=true;const source=Array.isArray(node.material)?node.material:[node.material];const materials=source.map(item=>{const material=item.clone();if('roughness'in material)(material as T.MeshStandardMaterial).roughness=.82;if('metalness'in material)(material as T.MeshStandardMaterial).metalness=Math.min(.35,(material as T.MeshStandardMaterial).metalness);return material;});node.material=Array.isArray(node.material)?materials:materials[0];});
    this.content=content;ready();
  }
  update(time:number,speed:number,attacking:boolean){
    if(!this.content)return;
    const moving=Math.min(1,speed/3),breath=Math.sin(time*2.2);
    this.content.position.y=breath*.025+(moving*Math.abs(Math.sin(time*6.2))*.045);
    this.content.rotation.z=breath*.012;
    this.content.rotation.x=T.MathUtils.damp(this.content.rotation.x,attacking?-.14:0,8,1/60);
  }
}
