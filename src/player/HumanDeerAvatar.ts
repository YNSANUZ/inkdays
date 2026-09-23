import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';

export type DeerAsset={scene:T.Object3D;clip?:T.AnimationClip};
let cached:Promise<DeerAsset>|undefined;

async function load(){
  const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf=await loader.loadAsync(`${import.meta.env.BASE_URL}assets/characters/human-deer-boss.glb`);
  return {scene:gltf.scene,clip:gltf.animations[0]};
}

export const loadHumanDeerAsset=()=>cached??=load();

export class HumanDeerAvatar{
  readonly root=new T.Group();private mixer?:T.AnimationMixer;private action?:T.AnimationAction;private last=0;
  constructor(ready:()=>void){void this.install(ready).catch(()=>{/* mantém o chefão procedural como fallback */});}
  private async install(ready:()=>void){
    const asset=await loadHumanDeerAsset(),model=clone(asset.scene),content=new T.Group();content.add(model);this.root.add(content);
    let bounds=new T.Box3().setFromObject(content),size=bounds.getSize(new T.Vector3());
    if(size.z>size.y*1.3){content.rotation.x=-Math.PI/2;content.updateMatrixWorld(true);bounds=new T.Box3().setFromObject(content);size=bounds.getSize(new T.Vector3());}
    const scale=2.75/Math.max(.001,size.y);content.scale.setScalar(scale);content.updateMatrixWorld(true);bounds.setFromObject(content);
    const center=bounds.getCenter(new T.Vector3());content.position.x-=center.x;content.position.z-=center.z;content.position.y-=bounds.min.y;
    model.traverse(node=>{if(!(node instanceof T.Mesh))return;node.castShadow=true;node.receiveShadow=true;const source=Array.isArray(node.material)?node.material:[node.material];const materials=source.map(item=>{const material=item.clone();if('color'in material)(material as T.MeshStandardMaterial).color.multiplyScalar(.9);return material;});node.material=Array.isArray(node.material)?materials:materials[0];});
    if(asset.clip){this.mixer=new T.AnimationMixer(model);this.action=this.mixer.clipAction(asset.clip);this.action.play();}
    ready();
  }
  update(time:number,speed:number,attacking:boolean){const dt=this.last?Math.min(.1,time-this.last):0;this.last=time;this.action?.setEffectiveTimeScale(attacking?.55:speed>.2?1.05:.42);this.mixer?.update(dt);}
}
