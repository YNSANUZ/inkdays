import * as T from 'three';
import { C } from '../config/gameplay';
import { World } from '../world/World';
import { Player } from '../player/Player';
import { ThirdPerson } from '../camera/ThirdPerson';
import { Input } from '../input/Input';
import { TouchControls } from '../input/TouchControls';
import { Pistol } from '../weapons/Pistol';
import { Enemies } from '../enemies/Enemies';
import { Horde } from '../horde/Horde';
import { DayCycle } from '../daycycle/DayCycle';
import { GameAudio } from '../audio/Audio';
import { Effects } from './Effects';
import { UI } from '../ui/UI';
import { loadSettings, saveSettings } from '../ui/Settings';
type Mode='menu'|'playing'|'paused'|'dead'|'settings';
export class Game {
  touch:TouchControls;
  renderer:T.WebGLRenderer;scene=new T.Scene();world:World;player=new Player();camera=new ThirdPerson();input:Input;pistol=new Pistol();enemies:Enemies;horde=new Horde();cycle=new DayCycle();audio=new GameAudio();effects:Effects;ui:UI;
  mode:Mode='menu';kills=0;money=0;settings=loadSettings();private accumulator=0;private last=0;private ray=new T.Raycaster();private debug=false;private fps=60;private light:T.DirectionalLight;private lastCommand={crouch:false,run:false};private contextLost=false;
  constructor(app:HTMLElement) {
    this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});this.renderer.setClearColor(0xf3f1e9);this.renderer.outputColorSpace=T.SRGBColorSpace;app.append(this.renderer.domElement);this.renderer.domElement.setAttribute('aria-label','Mundo 3D do INKDAYS');
    this.scene.background=new T.Color(0xf3f1e9);this.scene.fog=new T.Fog(0xf3f1e9,43,130);
    this.scene.add(new T.HemisphereLight(0xffffff,0xb4b7af,2.1));this.light=new T.DirectionalLight(0xffffff,2.3);this.light.position.set(-20,35,10);this.scene.add(this.light);
    this.world=new World(this.scene);this.scene.add(this.player.avatar.root);this.enemies=new Enemies(this.scene,this.world);this.effects=new Effects(this.scene);this.ui=new UI(app);
    this.input=new Input(this.renderer.domElement,()=>this.pause(),()=>{this.debug=!this.debug;this.ui.el('#debug').classList.toggle('hidden',!this.debug);});
    this.touch=new TouchControls(this.input,()=>this.pause(),()=>{if(this.mode==='playing')this.lock();});
    this.renderer.domElement.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&this.mode==='playing'&&!document.pointerLockElement)this.lock();});
    window.addEventListener('resize',()=>{this.resize();if(this.touch.enabled&&innerHeight>innerWidth)this.pause();});this.applySettings();
    this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();this.contextLost=true;this.pause();this.ui.toast('Renderização interrompida. Aguarde a recuperação da placa gráfica.');});
    this.renderer.domElement.addEventListener('webglcontextrestored',()=>{this.contextLost=false;this.ui.toast('Renderização recuperada. Continue pelo menu.');});
    this.menu();requestAnimationFrame(this.frame);
  }
  private applySettings(){this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.settings.quality==='high'?1.5:.85));this.audio.setVolume(this.settings.volume);this.resize();}
  private resize(){const w=window.innerWidth,h=window.innerHeight;this.renderer.setSize(w,h);this.camera.camera.aspect=w/h;this.camera.camera.updateProjectionMatrix();if(this.ui){const scale=Math.min(1.5,Math.max(1,Math.min(w/1280,h/720)));Object.assign(this.ui.hud.style,{position:'absolute',width:`${w/scale}px`,height:`${h/scale}px`,transform:`scale(${scale})`,transformOrigin:'top left'});}}
  start() {
    this.enemies.clear();this.effects.clear();this.scene.remove(this.player.avatar.root);this.player=new Player();this.scene.add(this.player.avatar.root);this.pistol=new Pistol();this.cycle=new DayCycle();this.horde=new Horde();this.camera=new ThirdPerson();this.resize();this.kills=this.money=0;this.ui.toastTimer=this.ui.hitTimer=this.ui.damageTimer=0;this.ui.el('.damage-flash').style.opacity='0';this.ui.el('#reward').textContent='';this.resume();this.ui.toast('DIA 1 · Explore. A noite chega em 40 segundos.');
  }
  private lock() {if(this.touch.enabled)return;try{const p=this.renderer.domElement.requestPointerLock?.();if(p)p.catch(()=>this.ui.el('#lock-note').classList.remove('hidden'));}catch{this.ui.el('#lock-note').classList.remove('hidden');}}
  resume() {if(this.contextLost)return;this.mode='playing';this.input.clear();this.input.active=true;this.accumulator=0;this.audio.start();this.ui.playing();this.ui.el('#lock-note').classList.add('hidden');this.lock();}
  pause() {if(this.mode!=='playing')return;this.mode='paused';this.input.active=false;this.input.clear();this.audio.pause();if(document.pointerLockElement)document.exitPointerLock();this.ui.pause(()=>this.resume(),()=>this.showSettings('paused'),()=>this.menu());}
  menu() {this.mode='menu';this.input.active=false;this.input.clear();if(document.pointerLockElement)document.exitPointerLock();this.audio.pause();this.enemies.clear();this.effects.clear();this.ui.el('.damage-flash').style.opacity='0';this.player.avatar.root.visible=true;this.player.avatar.body.rotation.z=0;this.player.position.set(0,0,10);this.player.avatar.root.rotation.y=-.5;this.ui.menu(()=>this.start(),()=>this.showSettings('menu'));}
  private showSettings(from:'menu'|'paused') {this.mode='settings';this.ui.settings(this.settings,s=>{this.settings=s;saveSettings(s);this.applySettings();},()=>{if(from==='menu')this.menu();else{this.mode='playing';this.pause();}});}
  private die() {this.mode='dead';this.input.active=false;this.input.clear();this.audio.pause();if(document.pointerLockElement)document.exitPointerLock();this.player.avatar.body.rotation.z=1.5;this.ui.gameOver(this.cycle.day,this.kills,this.money,this.cycle.elapsed,()=>this.start(),()=>this.menu());}
  private fire() {
    if(!this.pistol.fire())return;
    this.audio.cue('shot');this.player.avatar.arm.rotation.x=-.12;this.scene.updateMatrixWorld(true);
    this.ray.setFromCamera(new T.Vector2(0,0),this.camera.camera);this.ray.far=C.weapon.range;
    let distance:number=C.weapon.range,point=this.ray.ray.at(distance,new T.Vector3());
    const wall=this.ray.intersectObjects(this.world.solids,false)[0];if(wall){distance=wall.distance;point=wall.point;}
    let victim:typeof this.enemies.active[number]|null=null;
    for(const e of this.enemies.active) {const hit=this.ray.intersectObject(e.avatar.body,true).find(h=>h.object instanceof T.Mesh&&(h.object.material as T.Material).side!==T.BackSide);if(hit&&hit.distance<distance){distance=hit.distance;point=hit.point;victim=e;}}
    const muzzle=this.player.avatar.muzzle.getWorldPosition(new T.Vector3());
    // Validate muzzle-to-target segment too: an offset camera must not shoot through cover.
    const muzzleRay=new T.Raycaster(muzzle,point.clone().sub(muzzle).normalize(),0,muzzle.distanceTo(point));const cover=muzzleRay.intersectObjects(this.world.solids,false)[0];
    if(cover){point=cover.point;victim=null;}
    this.effects.shot(muzzle,point);
    if(victim){this.ui.hit();this.audio.cue('impact');this.effects.impact(point);if(this.enemies.damage(victim,C.weapon.damage)){this.kills++;this.money+=C.enemy.reward;this.ui.reward();}}
    else if(distance<C.weapon.range||cover)this.effects.impact(point);
  }
  private step(dt:number) {
    const command=this.input.consume();this.lastCommand=command;
    this.player.update(dt,command,this.camera.yaw,this.world);this.pistol.update(dt);
    if(command.reload&&this.pistol.reload())this.audio.cue('reload');
    if(command.fire||command.shot)this.fire();
    this.player.avatar.arm.rotation.x=T.MathUtils.damp(this.player.avatar.arm.rotation.x,0,12,dt);
    const event=this.cycle.update(dt);
    if(event==='horde'){this.horde.begin(this.cycle.day);this.audio.cue('enemy');this.ui.toast('A HORDA CHEGOU · Aguente até o amanhecer.');}
    if(event==='dawn'){this.enemies.clear();this.pistol.resupply();this.player.health.heal(C.day.dawnHeal);this.ui.toast(`DIA ${this.cycle.day} · Você resistiu. +${C.day.dawnHeal} vida · +${C.day.dawnAmmo} munição`);}
    if(this.cycle.phase==='horde')this.horde.update(dt,()=>this.enemies.spawn(this.cycle.day,this.player.position));
    this.enemies.update(dt,this.player,()=>{this.ui.hurt();this.audio.cue('damage');this.camera.shake=.25;});
    this.effects.update(dt);this.audio.update(dt,this.cycle.phase==='horde',Math.hypot(this.player.velocity.x,this.player.velocity.z),command.crouch);
    if(this.player.health.dead)this.die();
  }
  private frame=(ms:number)=>{
    requestAnimationFrame(this.frame);const dt=Math.min(.1,(ms-(this.last||ms))/1000);this.last=ms;this.fps=T.MathUtils.lerp(this.fps,dt>0?1/dt:60,.05);
    this.touch.setActive(this.mode==='playing'&&innerWidth>innerHeight);
    if(this.contextLost)return;
    if(this.mode==='playing') {
      this.camera.look(this.input.lookX,this.input.lookY,this.settings.sensitivity);this.input.lookX=this.input.lookY=0;
      this.accumulator+=dt;let steps=0;while(this.accumulator>=C.fixedStep&&steps<C.maxSteps&&this.mode==='playing'){this.camera.update(C.fixedStep,this.player.position,this.world);this.step(C.fixedStep);this.accumulator-=C.fixedStep;steps++;}
      if(steps===C.maxSteps)this.accumulator=0;
      this.camera.update(dt,this.player.position,this.world);this.world.sails.rotation.z+=dt*.18;
      const night=this.cycle.phase==='horde';const color=new T.Color(night?0xa9b1ad:0xf3f1e9);(this.scene.background as T.Color).lerp(color,dt*1.8);(this.scene.fog as T.Fog).color.copy(this.scene.background as T.Color);this.light.intensity=T.MathUtils.damp(this.light.intensity,night?1.2:2.3,2,dt);
      this.ui.update(dt,this.cycle,this.pistol,this.player.health.value,this.kills,this.money,this.lastCommand.crouch,this.lastCommand.run);
    } else if(this.mode==='menu'||this.mode==='settings'&&this.ui.hud.classList.contains('hidden')) {
      this.camera.camera.position.set(9,4.6,19);this.camera.camera.lookAt(-4,3,-14);this.world.sails.rotation.z+=dt*.12;
      (this.scene.background as T.Color).set(0xf3f1e9);(this.scene.fog as T.Fog).color.set(0xf3f1e9);this.light.intensity=2.3;
    }
    this.renderer.render(this.scene,this.camera.camera);
    if(this.debug)this.ui.el('#debug').textContent=`${Math.round(this.fps)} FPS · ${this.enemies.active.length} inimigos · ${this.renderer.info.render.calls} draw calls · ${this.renderer.info.render.triangles.toLocaleString('pt-BR')} triângulos`;
  };
}
