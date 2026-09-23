import * as T from 'three';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
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
import { FirstPersonWeapon } from '../weapons/FirstPersonWeapon';
import { BossTeaser } from '../world/BossTeaser';
import {HunterDirector} from '../horde/HunterDirector';
import {AmmoDropDirector} from '../economy/AmmoDrops';
import {AmmoDropView} from '../world/AmmoDropView';
type Mode='menu'|'playing'|'paused'|'dead'|'settings';
export class Game {
  touch:TouchControls;outline:OutlineEffect;
  renderer:T.WebGLRenderer;scene=new T.Scene();world:World;player=new Player();camera=new ThirdPerson();input:Input;pistol=new Pistol();enemies:Enemies;horde=new Horde();cycle=new DayCycle();audio=new GameAudio();effects:Effects;ui:UI;
  mode:Mode='menu';kills=0;money=0;settings=loadSettings();private accumulator=0;private last=0;private ray=new T.Raycaster();private debug=false;private fps=60;private light:T.DirectionalLight;private lastCommand={crouch:false,run:false};private contextLost=false;private hordeAssist=false;private viewWeapon:FirstPersonWeapon;private bossTeaser:BossTeaser;private hunters=new HunterDirector();private ammoDrops=new AmmoDropDirector();private ammoDropView=new AmmoDropView();
  constructor(app:HTMLElement) {
    this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});this.renderer.setClearColor(0xf3f1e9);this.renderer.outputColorSpace=T.SRGBColorSpace;this.outline=new OutlineEffect(this.renderer,{defaultThickness:.006,defaultColor:[.06,.07,.06],defaultAlpha:1,defaultKeepAlive:true});app.append(this.renderer.domElement);this.renderer.domElement.setAttribute('aria-label','Mundo 3D do INKDAYS');
    this.scene.background=new T.Color(0xf3f1e9);this.scene.fog=new T.Fog(0xf3f1e9,43,130);
    this.scene.add(new T.HemisphereLight(0xffffff,0xb4b7af,2.1));this.light=new T.DirectionalLight(0xffffff,2.3);this.light.position.set(-20,35,10);this.scene.add(this.light);
    this.world=new World(this.scene);this.bossTeaser=new BossTeaser();this.scene.add(this.bossTeaser.root,this.player.avatar.root,this.camera.camera,this.ammoDropView.root);this.viewWeapon=new FirstPersonWeapon(this.camera.camera);this.enemies=new Enemies(this.scene,this.world);this.effects=new Effects(this.scene);this.ui=new UI(app);this.ui.bindAdminDay(day=>this.start(day));
    this.input=new Input(this.renderer.domElement,()=>this.pause(),()=>{this.debug=!this.debug;this.ui.el('#debug').classList.toggle('hidden',!this.debug);});
    this.touch=new TouchControls(this.input,()=>this.pause(),()=>{if(this.mode==='playing')this.lock();});
    this.renderer.domElement.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&this.mode==='playing'&&!document.pointerLockElement)this.lock();});
    window.addEventListener('resize',()=>{this.resize();if(this.touch.enabled&&innerHeight>innerWidth)this.pause();});this.applySettings();
    this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();this.contextLost=true;this.pause();this.ui.toast('Renderização interrompida. Aguarde a recuperação da placa gráfica.');});
    this.renderer.domElement.addEventListener('webglcontextrestored',()=>{this.contextLost=false;this.ui.toast('Renderização recuperada. Continue pelo menu.');});
    this.menu();requestAnimationFrame(this.frame);
  }
  private applySettings(){this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.settings.quality==='high'?1.5:.85));this.audio.setVolume(this.settings.volume);this.camera.mode=this.settings.cameraMode;if(this.viewWeapon)this.viewWeapon.visible=this.camera.mode==='first';this.player.avatar.root.visible=this.camera.mode!=='first'||this.mode!=='playing';this.resize();}
  private resize(){const w=window.innerWidth,h=window.innerHeight;this.outline.setSize(w,h);this.camera.camera.aspect=w/h;this.camera.camera.updateProjectionMatrix();if(this.ui){const scale=Math.min(1.5,Math.max(1,Math.min(w/1280,h/720)));Object.assign(this.ui.hud.style,{position:'absolute',width:`${w/scale}px`,height:`${h/scale}px`,transform:`scale(${scale})`,transformOrigin:'top left'});}}
  start(day=1) {
    this.bossTeaser.visible=false;this.enemies.clear();this.effects.clear();this.ammoDrops.reset();this.ammoDropView.sync([]);this.scene.remove(this.player.avatar.root,this.camera.camera);this.player=new Player();this.camera=new ThirdPerson();this.camera.mode=this.settings.cameraMode;this.scene.add(this.player.avatar.root,this.camera.camera);this.viewWeapon=new FirstPersonWeapon(this.camera.camera);this.viewWeapon.visible=this.camera.mode==='first';this.player.avatar.root.visible=this.camera.mode!=='first';this.pistol=new Pistol();this.cycle=new DayCycle();this.cycle.jumpTo(day);this.horde=new Horde();this.hunters=new HunterDirector();this.hordeAssist=false;this.resize();this.kills=this.money=0;this.ui.toastTimer=this.ui.hitTimer=this.ui.damageTimer=0;this.ui.el('.damage-flash').style.opacity='0';this.ui.el('#reward').textContent='';this.resume();this.ui.toast(`DIA ${this.cycle.day} · Explore. A noite chega em 40 segundos.`);
  }
  private lock() {if(this.touch.enabled)return;try{const p=this.renderer.domElement.requestPointerLock?.();if(p)p.catch(()=>this.ui.el('#lock-note').classList.remove('hidden'));}catch{this.ui.el('#lock-note').classList.remove('hidden');}}
  resume() {if(this.contextLost)return;this.bossTeaser.visible=false;this.mode='playing';this.input.clear();this.input.active=true;this.accumulator=0;this.audio.start();this.ui.playing();this.ui.el('#lock-note').classList.add('hidden');this.lock();}
  pause() {if(this.mode!=='playing')return;this.mode='paused';this.input.active=false;this.input.clear();this.audio.pause();if(document.pointerLockElement)document.exitPointerLock();this.ui.pause(()=>this.resume(),()=>this.showSettings('paused'),()=>this.menu());}
  menu() {this.mode='menu';this.bossTeaser.visible=true;this.input.active=false;this.input.clear();if(document.pointerLockElement)document.exitPointerLock();this.audio.pause();this.enemies.clear();this.effects.clear();this.ui.el('.damage-flash').style.opacity='0';this.player.avatar.root.visible=true;this.player.avatar.setShowcasePose(true);this.player.avatar.body.rotation.z=0;this.player.position.set(2.35,0,7.35);this.player.avatar.root.rotation.y=.5;this.ui.menu(()=>this.start(),()=>this.showSettings('menu'));}
  private showSettings(from:'menu'|'paused') {this.mode='settings';this.ui.settings(this.settings,s=>{this.settings=s;saveSettings(s);this.applySettings();},()=>{if(from==='menu')this.menu();else{this.mode='playing';this.pause();}});}
  private die() {this.mode='dead';this.input.active=false;this.input.clear();this.audio.pause();if(document.pointerLockElement)document.exitPointerLock();this.player.avatar.body.rotation.z=1.5;this.ui.gameOver(this.cycle.day,this.kills,this.money,this.cycle.elapsed,()=>this.start(),()=>this.menu());}
  private fire() {
    if(!this.pistol.fire())return;
    this.audio.cue('shot');this.viewWeapon.fire();if(this.pistol.reloadTime>0)this.audio.cue('reload');this.player.avatar.arm.rotation.x=-.12;this.scene.updateMatrixWorld(true);
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
    if(victim){this.ui.hit();this.audio.cue('impact');this.effects.impact(point);if(this.enemies.damage(victim,C.weapon.damage)){this.kills++;this.money+=victim.reward;this.ui.reward();}}
    else if(distance<C.weapon.range||cover)this.effects.impact(point);
  }
  private step(dt:number) {
    const command=this.input.consume();this.lastCommand=command;
    this.player.update(dt,command,this.camera.yaw,this.world);this.pistol.update(dt);
    if(command.reload&&this.pistol.reload())this.audio.cue('reload');
    if(command.fire||command.shot)this.fire();
    this.player.avatar.arm.rotation.x=T.MathUtils.damp(this.player.avatar.arm.rotation.x,0,12,dt);
    const event=this.cycle.update(dt);
    if(event==='horde'){this.horde.begin(this.cycle.day);this.hunters.begin(this.cycle.day);if(this.cycle.day%C.day.bossInterval===0)this.enemies.spawnBoss(this.cycle.day,this.player.position);this.audio.cue('enemy');this.ui.toast(this.cycle.day%C.day.bossInterval===0?`CHEFÃO · ${C.boss.name} CHEGOU`:'A HORDA CHEGOU · Elimine todos os Borrões.');}
    if(this.cycle.phase==='horde'){const commonEnemies=this.enemies.active.filter(enemy=>enemy.kind==='horde'),hunters=this.enemies.active.filter(enemy=>enemy.kind==='hunter'),commons=commonEnemies.length,boss=this.enemies.active.find(enemy=>enemy.kind==='boss');this.horde.update(dt,commons,()=>this.enemies.spawn(this.cycle.day,this.player.position),boss?boss.health/boss.maxHealth:null,commonEnemies.every(enemy=>enemy.state==='WANDER'));this.hunters.update(dt,()=>this.enemies.spawnHunter(this.cycle.day,this.player.position));this.hordeAssist=this.hunters.remaining(hunters.length)===0&&this.horde.state(commons).assist;if(this.hunters.complete&&hunters.length===0&&this.horde.canComplete(dt,commons,!!boss)&&this.cycle.completeHorde()){this.hordeAssist=false;this.pistol.resupply();this.player.health.heal(C.day.dawnHeal);this.ui.toast(`HORDA ELIMINADA · Você sobreviveu ao Dia ${this.cycle.day-1}.`);}}
    this.enemies.update(dt,this.player,()=>{this.ui.hurt();this.audio.cue('damage');this.camera.shake=.25;});
    const collector={id:'solo',x:this.player.position.x,z:this.player.position.z,alive:!this.player.health.dead,ready:true,ammo:this.pistol.ammo,reserve:this.pistol.reserve};this.ammoDrops.update(dt,[collector]);for(const drop of this.ammoDrops.snapshot()){const result=this.ammoDrops.collect(drop.id,collector);if(result.ok){this.pistol.addReserve(result.rounds);this.audio.cue('ui');this.ui.toast(`MUNIÇÃO 9 MM · +${result.rounds} BALAS`);}}this.ammoDropView.sync(this.ammoDrops.snapshot());
    this.effects.update(dt);this.audio.update(dt,this.cycle.phase==='horde',Math.hypot(this.player.velocity.x,this.player.velocity.z),command.crouch,this.enemies.active.some(enemy=>enemy.kind==='boss'));
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
      this.camera.update(dt,this.player.position,this.world);this.viewWeapon.update(dt,Math.hypot(this.player.velocity.x,this.player.velocity.z));this.ammoDropView.update(dt);this.world.sails.rotation.z+=dt*.18;
      const night=this.cycle.phase==='horde';const color=new T.Color(night?0xa9b1ad:0xf3f1e9);(this.scene.background as T.Color).lerp(color,dt*1.8);(this.scene.fog as T.Fog).color.copy(this.scene.background as T.Color);this.light.intensity=T.MathUtils.damp(this.light.intensity,night?1.2:2.3,2,dt);
      const commons=this.enemies.active.filter(enemy=>enemy.kind==='horde').length,hunters=this.enemies.active.filter(enemy=>enemy.kind==='hunter').length,hordeState=this.horde.state(commons),boss=this.enemies.active.find(enemy=>enemy.kind==='boss');this.ui.update(dt,this.cycle,this.pistol,this.player.health.value,this.kills,this.money,this.lastCommand.crouch,this.lastCommand.run,{...hordeState,remaining:hordeState.remaining+this.hunters.remaining(hunters),assist:this.hordeAssist},boss?{name:boss.bossVariant==='human-deer'?C.humanDeer.name:C.boss.name,health:boss.health,maxHealth:boss.maxHealth,enraged:boss.enraged}:undefined);
    } else if(this.mode==='menu'||this.mode==='settings'&&this.ui.hud.classList.contains('hidden')) {
      this.viewWeapon.visible=false;this.player.avatar.root.visible=true;this.bossTeaser.visible=true;this.bossTeaser.update(ms/1000);this.camera.camera.position.set(9,4.6,19);this.camera.camera.lookAt(-4,3,-14);this.world.sails.rotation.z+=dt*.12;
      (this.scene.background as T.Color).set(0xf3f1e9);(this.scene.fog as T.Fog).color.set(0xf3f1e9);this.light.intensity=2.3;
    }
    if(this.cycle.phase==='horde')for(const enemy of this.enemies.active)enemy.avatar.root.scale.setScalar(enemy.kind==='boss'?(enemy.bossVariant==='human-deer'?C.humanDeer.scale:C.boss.scale):this.hordeAssist?1.04+Math.sin(ms*.012)*.04:1);this.outline.render(this.scene,this.camera.camera);
    if(this.debug)this.ui.el('#debug').textContent=`${Math.round(this.fps)} FPS · ${this.enemies.active.length} inimigos · ${this.renderer.info.render.calls} draw calls · ${this.renderer.info.render.triangles.toLocaleString('pt-BR')} triângulos`;
  };
}
