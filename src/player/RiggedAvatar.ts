import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

type Role = 'player' | 'enemy';
type Motion = 'idle' | 'move' | 'crouch' | 'jump' | 'attack';
type RigLibrary = { model:T.Object3D; player:Record<Exclude<Motion,'attack'>,T.AnimationClip>; enemy:Record<'idle'|'move'|'attack',T.AnimationClip> };

const base=(name:string)=>`${import.meta.env.BASE_URL}assets/characters/${name}.glb`;
let library:Promise<RigLibrary>|undefined;

function removeRootMotion(clip:T.AnimationClip) {
  for(const track of clip.tracks) {
    if(!/hips\.position$/i.test(track.name))continue;
    const values=track.values;
    for(let i=3;i<values.length;i+=3){values[i]=values[0];values[i+2]=values[2];}
  }
  clip.resetDuration();
  return clip;
}

async function loadLibrary():Promise<RigLibrary> {
  const loader=new GLTFLoader();
  const [model,idle,run,crouch,jump,enemyIdle,enemyWalk,enemyAttack]=await Promise.all([
    loader.loadAsync(base('xbot')),loader.loadAsync(base('player-idle')),loader.loadAsync(base('player-run')),
    loader.loadAsync(base('player-crouch')),loader.loadAsync(base('player-jump')),loader.loadAsync(base('enemy-idle')),
    loader.loadAsync(base('enemy-walk')),loader.loadAsync(base('enemy-attack')),
  ]);
  const clip=(asset:typeof idle)=>removeRootMotion(asset.animations[0].clone());
  return {model:model.scene,player:{idle:clip(idle),move:clip(run),crouch:clip(crouch),jump:clip(jump)},enemy:{idle:clip(enemyIdle),move:clip(enemyWalk),attack:clip(enemyAttack)}};
}

function getLibrary(){return library??=loadLibrary();}

export class RiggedAvatar {
  readonly root=new T.Group();
  private mixer?:T.AnimationMixer;
  private actions?:Record<Motion,T.AnimationAction>;
  private active?:Motion;
  private lastTime?:number;
  constructor(private role:Role,private ready:()=>void) {void this.install().catch(()=>{/* o avatar procedural permanece visível */});}
  private async install(){
    const assets=await getLibrary();
    const model=clone(assets.model);
    const white=new T.MeshToonMaterial({color:0xf5f3e9});
    const black=new T.MeshToonMaterial({color:0x171b19});
    const skins:T.SkinnedMesh[]=[];
    model.traverse(node=>{if(node instanceof T.SkinnedMesh){node.material=white;node.castShadow=true;node.receiveShadow=true;skins.push(node);}});
    for(const skin of skins){const outline=skin.clone();outline.material=new T.MeshBasicMaterial({color:0x161a18,side:T.BackSide});outline.scale.multiplyScalar(1.018);outline.castShadow=false;skin.parent?.add(outline);}
    const bone=(pattern:RegExp)=>{let found:T.Object3D|undefined;model.traverse(node=>{if(!found&&pattern.test(node.name))found=node;});return found;};
    if(this.role==='player'){
      const hand=bone(/RightHand$/i),spine=bone(/Spine1$/i)??bone(/Spine$/i);
      if(hand){const gun=new T.Mesh(new T.BoxGeometry(.075,.08,.42),black);gun.position.set(0,.05,.2);gun.rotation.x=Math.PI/2;hand.add(gun);}
      if(spine){const pack=new T.Mesh(new T.BoxGeometry(.32,.42,.14),new T.MeshToonMaterial({color:0xb9bbb3}));pack.position.set(0,.06,-.16);spine.add(pack);}
    } else {
      model.traverse(node=>{if(node instanceof T.SkinnedMesh)node.material=new T.MeshToonMaterial({color:0xe6e3d8});});
      const head=bone(/Head$/i);if(head){for(const x of [-.065,.065]){const eye=new T.Mesh(new T.SphereGeometry(.025,8,6),new T.MeshBasicMaterial({color:0xb20d14}));eye.position.set(x,.08,.13);head.add(eye);}}
    }
    this.root.add(model);
    this.mixer=new T.AnimationMixer(model);
    const source=this.role==='enemy'?{...assets.player,...assets.enemy}:{...assets.enemy,...assets.player};
    this.actions={idle:this.mixer.clipAction(source.idle),move:this.mixer.clipAction(source.move),crouch:this.mixer.clipAction(assets.player.crouch),jump:this.mixer.clipAction(assets.player.jump),attack:this.mixer.clipAction(assets.enemy.attack)};
    this.setMotion('idle');this.ready();
  }
  update(time:number,motion:Motion,speed:number){
    const dt=this.lastTime===undefined?0:Math.min(.1,Math.max(0,time-this.lastTime));this.lastTime=time;
    this.setMotion(motion);
    if(this.actions)this.actions[motion].timeScale=motion==='move'?T.MathUtils.clamp(speed/4,.65,1.45):1;
    this.mixer?.update(dt);
  }
  private setMotion(motion:Motion){if(!this.actions||this.active===motion)return;const next=this.actions[motion];next.reset().fadeIn(.16).play();if(this.active)this.actions[this.active].fadeOut(.16);this.active=motion;}
}
