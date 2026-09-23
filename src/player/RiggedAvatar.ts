import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { createDrawnWeapon } from '../weapons/DrawnWeapon';
import { draftPistol } from '../weapons/CustomWeapon';

type Role = 'player' | 'enemy' | 'hunter' | 'boss';
type Motion = 'idle' | 'move' | 'crouch' | 'jump' | 'attack';
export type MoveDirection='forward'|'backward'|'left'|'right';
type PlayerMotion='idle'|'moveForward'|'moveBackward'|'moveLeft'|'moveRight'|'crouch'|'jump';
type ActionMotion=PlayerMotion|'attack';
type RigLibrary = { model:T.Object3D; player:Record<PlayerMotion,T.AnimationClip>; enemy:Record<'idle'|'moveForward'|'attack',T.AnimationClip> };

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
  const [model,idle,run,runBackward,runLeft,runRight,crouch,jump,enemyIdle,enemyWalk,enemyAttack]=await Promise.all([
    loader.loadAsync(base('xbot')),loader.loadAsync(base('player-idle')),loader.loadAsync(base('player-run')),loader.loadAsync(base('player-run-back')),
    loader.loadAsync(base('player-run-left')),loader.loadAsync(base('player-run-right')),
    loader.loadAsync(base('player-crouch')),loader.loadAsync(base('player-jump')),loader.loadAsync(base('enemy-idle')),
    loader.loadAsync(base('enemy-walk')),loader.loadAsync(base('enemy-attack')),
  ]);
  const clip=(asset:typeof idle)=>removeRootMotion(asset.animations[0].clone());
  return {model:model.scene,player:{idle:clip(idle),moveForward:clip(run),moveBackward:clip(runBackward),moveLeft:clip(runLeft),moveRight:clip(runRight),crouch:clip(crouch),jump:clip(jump)},enemy:{idle:clip(enemyIdle),moveForward:clip(enemyWalk),attack:clip(enemyAttack)}};
}

function getLibrary(){return library??=loadLibrary();}

export class RiggedAvatar {
  readonly root=new T.Group();
  private mixer?:T.AnimationMixer;
  private actions?:Record<ActionMotion,T.AnimationAction>;
  private active?:ActionMotion;
  private lastTime?:number;
  private showcase=false;
  private showcaseBones?:{leftArm?:T.Object3D;rightArm?:T.Object3D;leftForeArm?:T.Object3D;rightForeArm?:T.Object3D};
  constructor(private role:Role,private ready:()=>void) {void this.install().catch(()=>{/* o avatar procedural permanece visível */});}
  private async install(){
    const assets=await getLibrary();
    const model=clone(assets.model);
    model.visible=false;
    const white=new T.MeshToonMaterial({color:0xe5e2d8});
    const black=new T.MeshToonMaterial({color:0x171b19});
    const skins:T.SkinnedMesh[]=[];
    model.traverse(node=>{if(node instanceof T.SkinnedMesh){node.material=white;node.castShadow=true;node.receiveShadow=true;skins.push(node);}});
    const bone=(pattern:RegExp)=>{let found:T.Object3D|undefined;model.traverse(node=>{if(!found&&pattern.test(node.name))found=node;});return found;};
    this.showcaseBones={leftArm:bone(/LeftArm$/i),rightArm:bone(/RightArm$/i),leftForeArm:bone(/LeftForeArm$/i),rightForeArm:bone(/RightForeArm$/i)};
    // Silhueta baixa e compacta: encurta as duas partes das pernas no próprio rig,
    // mantendo as animações Mixamo, o collider e a lógica de rede inalterados.
    for(const side of ['Left','Right']){
      const thigh=bone(new RegExp(`${side}UpLeg$`,'i'));
      const shin=bone(new RegExp(`${side}Leg$`,'i'));
      if(thigh)thigh.scale.set(1.08,.72,1.08);
      if(shin)shin.scale.set(1.1,.72,1.1);
    }
    model.position.y=-.25;
    // Volumes autorais sobre o rig: a animação continua Mixamo, a silhueta passa a ser INKDAYS.
    const head=bone(/Head$/i);if(head){const face=new T.Mesh(new T.SphereGeometry(.3,16,12),white);face.scale.set(1,.94,.9);face.position.set(0,.105,.015);face.castShadow=true;head.add(face);}
    const spine=bone(/Spine1$/i)??bone(/Spine$/i);if(spine){const torso=new T.Mesh(new T.SphereGeometry(.29,14,10),white);torso.scale.set(1.05,1.28,.8);torso.position.set(0,.035,0);torso.castShadow=true;spine.add(torso);}
    const hips=bone(/Hips$/i);if(hips){const pelvis=new T.Mesh(new T.SphereGeometry(.24,12,9),white);pelvis.scale.set(1,.76,.78);pelvis.position.set(0,.08,0);pelvis.castShadow=true;hips.add(pelvis);}
    if(this.role==='player'){
      const hand=bone(/RightHand$/i);
      if(hand){const gun=createDrawnWeapon(draftPistol).root;gun.rotation.x=Math.PI/2;gun.position.set(0,.05,.02);hand.add(gun);}
      if(spine){const pack=new T.Mesh(new T.BoxGeometry(.32,.42,.14),new T.MeshToonMaterial({color:0xb9bbb3}));pack.position.set(0,.06,-.16);spine.add(pack);}
      if(head){for(const x of [-.06,.06]){const eye=new T.Mesh(new T.SphereGeometry(.018,8,6),black);eye.position.set(x,.115,.284);head.add(eye);}}
    } else {
      const enemyWhite=new T.MeshToonMaterial({color:this.role==='hunter'?0x414541:0xceccc3});model.traverse(node=>{if(node instanceof T.Mesh&&node.material===white)node.material=enemyWhite;});
      if(head){
        const mask=new T.Mesh(new T.SphereGeometry(.235,14,10),black);mask.scale.set(.82,.72,.18);mask.position.set(0,.1,.275);head.add(mask);
        const eyeRed=new T.MeshBasicMaterial({color:0xb20d14});
        for(const x of [-.065,.065]){const eye=new T.Mesh(new T.SphereGeometry(.03,8,6),eyeRed);eye.position.set(x,.12,.321);head.add(eye);}
      }
      if(this.role==='boss'){
        model.scale.set(1.18,.96,1.14);
        if(spine){
          const armor=new T.Mesh(new T.SphereGeometry(.37,14,10),white);armor.name='colossus-armor';armor.scale.set(1.35,1.05,.78);armor.position.set(0,.04,-.01);armor.castShadow=true;spine.add(armor);
          const shoulderMaterial=new T.MeshToonMaterial({color:0xa9aaa3});
          for(const x of [-.43,.43]){const shoulder=new T.Mesh(new T.SphereGeometry(.16,10,8),shoulderMaterial);shoulder.position.set(x,.17,0);shoulder.scale.set(1.2,.9,1);shoulder.castShadow=true;spine.add(shoulder);}
        }
        if(head){
          const crownMaterial=new T.MeshToonMaterial({color:0x171b19});
          for(const [x,y] of [[-.2,.34],[0,.42],[.2,.34]] as const){const drop=new T.Mesh(new T.ConeGeometry(.075,.28,7),crownMaterial);drop.position.set(x,y,0);drop.rotation.z=x*.7;head.add(drop);}
        }
      }
    }
    this.root.add(model);
    this.mixer=new T.AnimationMixer(model);
    const source=this.role!=='player'?{...assets.player,...assets.enemy}:{...assets.enemy,...assets.player};
    this.actions={idle:this.mixer.clipAction(source.idle),moveForward:this.mixer.clipAction(source.moveForward),moveBackward:this.mixer.clipAction(assets.player.moveBackward),moveLeft:this.mixer.clipAction(assets.player.moveLeft),moveRight:this.mixer.clipAction(assets.player.moveRight),crouch:this.mixer.clipAction(assets.player.crouch),jump:this.mixer.clipAction(assets.player.jump),attack:this.mixer.clipAction(assets.enemy.attack)};
    this.setMotion('idle');this.mixer.update(0);this.applyShowcasePose();model.visible=true;this.ready();
  }
  setShowcasePose(enabled:boolean){this.showcase=enabled;this.applyShowcasePose();}
  private applyShowcasePose(){if(!this.showcase||!this.showcaseBones)return;this.mixer?.stopAllAction();const {leftArm,rightArm,leftForeArm,rightForeArm}=this.showcaseBones;if(leftArm)leftArm.rotation.z=1.18;if(rightArm)rightArm.rotation.z=-1.18;if(leftForeArm){leftForeArm.rotation.x=-.28;leftForeArm.rotation.z=.12;}if(rightForeArm){rightForeArm.rotation.x=-.28;rightForeArm.rotation.z=-.12;}}
  update(time:number,motion:Motion,speed:number,direction:MoveDirection='forward'){
    const dt=this.lastTime===undefined?0:Math.min(.1,Math.max(0,time-this.lastTime));this.lastTime=time;
    const selected:ActionMotion=motion==='move'?`move${direction[0].toUpperCase()}${direction.slice(1)}` as ActionMotion:motion;
    this.setMotion(selected);
    if(this.actions)this.actions[selected].timeScale=motion==='move'?T.MathUtils.clamp(speed/4,.65,1.45):1;
    this.mixer?.update(dt);
  }
  private setMotion(motion:ActionMotion){if(!this.actions||this.active===motion)return;const next=this.actions[motion];next.reset().fadeIn(.16).play();if(this.active)this.actions[this.active].fadeOut(.16);this.active=motion;}
}
