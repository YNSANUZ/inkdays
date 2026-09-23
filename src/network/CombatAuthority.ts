import * as T from 'three';
import { C } from '../config/gameplay';
import { World } from '../world/World';
import { Player } from '../player/Player';
import { Enemies } from '../enemies/Enemies';
import { Pistol } from '../weapons/Pistol';
import { DayCycle } from '../daycycle/DayCycle';
import { Horde } from '../horde/Horde';
import { ThirdPerson } from '../camera/ThirdPerson';
import { parseInput } from './Protocol';
import type { InputPacket } from './Protocol';
import { normalizePlayerName } from './PlayerName';
import { normalizeChatText } from './Chat';
import { MAX_PLAYERS } from './MovementAuthority';
import {quoteAmmoPurchase} from '../economy/AmmoEconomy';
import {AmmoDropDirector} from '../economy/AmmoDrops';
import {HunterDirector} from '../horde/HunterDirector';
const neutral=()=>({x:0,z:0,run:false,crouch:false,jump:false,fire:false,reload:false});
const spawn=(slot:number)=>({x:(slot%4)*2,z:10+Math.floor(slot/4)*2});
export interface AmmoPurchaseResult {ok:boolean;reason:string;rounds:number;cost:number}
export interface AmmoPickupResult {ok:boolean;rounds:number}
interface Participant {slot:number;name:string;connected:boolean;ready:boolean;protection:number;player:Player;weapon:Pistol;camera:ThirdPerson;input:InputPacket;age:number;received:number;applied:number;viewed:number;kills:number;money:number;lastShot:number;shotPending:number|null;lastChat:number;lastChatTick:number;ammoRequests:Map<string,AmmoPurchaseResult>}
export class CombatAuthority {
  readonly scene=new T.Scene();readonly world=new World(this.scene);readonly enemies=new Enemies(this.scene,this.world);
  cycle=new DayCycle();private horde=new Horde();private hunters=new HunterDirector();private players=new Map<string,Participant>();private ammoDrops=new AmmoDropDirector();tick=0;private round=1;
  private shots:{serial:number;player:string;shotId?:number;from:T.Vector3;to:T.Vector3;hit:boolean;rewindTicks:number}[]=[];private serial=0;
  private impacts:{serial:number;bossId:number;kind:'impact'|'roar';position:T.Vector3;radius:number;tick:number}[]=[];private impactSerial=0;
  private messages:{serial:number;messageId:number;player:string;name:string;text:string;tick:number}[]=[];private chatSerial=0;private readonly chatLifetimeTicks=720;
  private dayKills=0;private dayMoney=0;private lastDayResult:{serial:number;day:number;kills:number;money:number;survivors:number;players:number;nextBoss:number;tick:number}|null=null;private dayResultSerial=0;
  private enemyHistory=new Map<number,Map<number,T.Vector3>>();private readonly historyTicks=30;
  join(id:string){
    if(this.players.has(id)||this.players.size>=MAX_PLAYERS)return false;
    if(!this.players.size){this.cycle=new DayCycle();this.horde=new Horde();this.hunters=new HunterDirector();this.enemies.clear();this.ammoDrops.reset();this.shots=[];this.impacts=[];this.messages=[];this.enemyHistory.clear();this.dayKills=this.dayMoney=0;this.lastDayResult=null;}
    const used=new Set([...this.players.values()].map(p=>p.slot)),slot=Array.from({length:MAX_PLAYERS},(_,index)=>index).find(index=>!used.has(index))!,player=new Player(),point=spawn(slot);player.position.set(point.x,0,point.z);this.scene.add(player.avatar.root);
    this.players.set(id,{slot,name:`Errante ${slot+1}`,connected:true,ready:true,protection:0,player,weapon:new Pistol(),camera:new ThirdPerson(),input:{version:1,sequence:0,yaw:0,command:neutral()},age:Infinity,received:-1,applied:-1,viewed:-1,kills:0,money:0,lastShot:-1,shotPending:null,lastChat:-1,lastChatTick:-Infinity,ammoRequests:new Map()});return true;
  }
  setReady(id:string,ready=true){const p=this.players.get(id);if(!p?.connected)return false;const entering=ready&&!p.ready;p.ready=ready;if(entering)p.protection=C.player.spawnProtection;if(!ready){p.protection=0;p.input.command=neutral();p.player.velocity.x=p.player.velocity.z=0;}return true;}
  rename(id:string,value:unknown){const p=this.players.get(id),name=normalizePlayerName(value);if(!p?.connected||!name)return false;p.name=name;return true;}
  chat(id:string,messageId:unknown,value:unknown){const p=this.players.get(id),text=normalizeChatText(value);if(!p?.connected||!Number.isSafeInteger(messageId)||(messageId as number)<0||!text)return false;if((messageId as number)<=p.lastChat)return true;if(this.tick-p.lastChatTick<30)return false;p.lastChat=messageId as number;p.lastChatTick=this.tick;this.messages.push({serial:++this.chatSerial,messageId:p.lastChat,player:id,name:p.name,text,tick:this.tick});this.messages=this.messages.slice(-8);return true;}
  suspend(id:string){const p=this.players.get(id);if(p){p.connected=false;p.input.command=neutral();p.player.velocity.x=p.player.velocity.z=0;}}
  resume(id:string){const p=this.players.get(id);if(p){p.connected=true;if(p.ready&&!p.player.health.dead)p.protection=C.player.spawnProtection;}}
  leave(id:string){const p=this.players.get(id);if(p)this.scene.remove(p.player.avatar.root);this.players.delete(id);if(!this.players.size)this.enemies.clear();}
  restart(id:string){
    const requester=this.players.get(id);if(!requester?.connected||!this.gameOver)return false;
    this.round++;this.cycle=new DayCycle();this.horde=new Horde();this.hunters=new HunterDirector();this.enemies.clear();this.ammoDrops.reset();this.shots=[];this.impacts=[];this.enemyHistory.clear();this.dayKills=this.dayMoney=0;this.lastDayResult=null;
    for(const p of this.players.values()){
      this.scene.remove(p.player.avatar.root);p.player=new Player();const point=spawn(p.slot);p.player.position.set(point.x,0,point.z);this.scene.add(p.player.avatar.root);
      p.weapon=new Pistol();p.input.command=neutral();p.age=Infinity;p.protection=C.player.spawnProtection;p.kills=0;p.money=0;p.shotPending=null;p.ammoRequests.clear();
    }
    return true;
  }
  revive(id:string){
    const p=this.players.get(id);if(!p?.connected||!p.player.health.dead)return false;
    const point=spawn(p.slot);p.player.position.set(point.x,0,point.z);p.player.velocity.set(0,0,0);p.player.vertical=0;p.player.health.revive();p.input.command=neutral();p.age=Infinity;return true;
  }
  reviveAlly(id:string,targetId:string){
    const rescuer=this.players.get(id),target=this.players.get(targetId);if(!rescuer?.connected||rescuer.player.health.dead||!target?.connected||!target.player.health.dead||id===targetId)return false;
    const dx=rescuer.player.position.x-target.player.position.x,dz=rescuer.player.position.z-target.player.position.z;if(Math.hypot(dx,dz)>C.player.reviveRange)return false;
    target.player.velocity.set(0,0,0);target.player.vertical=0;target.player.health.revive();target.input.command=neutral();target.age=Infinity;return true;
  }
  purchaseAmmo(id:string,requestId:string):AmmoPurchaseResult{
    const p=this.players.get(id),cached=p?.ammoRequests.get(requestId);if(cached)return {...cached};
    let result:AmmoPurchaseResult={ok:false,reason:'invalid',rounds:0,cost:0};
    if(p?.connected&&p.ready&&!p.player.health.dead&&this.cycle.phase==='day'){
      const distance=Math.hypot(p.player.position.x,p.player.position.z-4),quote=quoteAmmoPurchase(p.weapon.reserve,C.weapon.maxReserve);
      if(distance>3.25)result.reason='distant';else if(!quote.rounds)result.reason='full';else if(p.money<quote.cost)result.reason='funds';else{p.money-=quote.cost;result={ok:true,reason:'ok',rounds:p.weapon.addReserve(quote.rounds),cost:quote.cost};}
    }else if(p?.player.health.dead)result.reason='dead';else if(this.cycle.phase!=='day')result.reason='phase';
    if(p){p.ammoRequests.set(requestId,result);while(p.ammoRequests.size>64)p.ammoRequests.delete(p.ammoRequests.keys().next().value!);}return {...result};
  }
  pickupAmmo(id:string,dropId:number):AmmoPickupResult{
    const p=this.players.get(id);if(!p?.connected)return {ok:false,rounds:0};
    const result=this.ammoDrops.collect(dropId,{id,x:p.player.position.x,z:p.player.position.z,alive:!p.player.health.dead,ready:p.ready,ammo:p.weapon.ammo,reserve:p.weapon.reserve});
    if(result.ok)result.rounds=p.weapon.addReserve(result.rounds);return result;
  }
  receive(id:string,value:unknown){const p=this.players.get(id),packet=parseInput(value);if(!p?.connected||!packet||packet.sequence<=p.received||packet.viewTick!==undefined&&packet.viewTick>this.tick)return false;
    if(packet.viewTick!==undefined){packet.viewTick=Math.max(packet.viewTick,p.viewed);p.viewed=packet.viewTick;}
    packet.command.jump||=p.input.command.jump;packet.command.reload||=p.input.command.reload;packet.command.fire||=p.input.command.fire&&p.age===0;
    if(packet.shotId!==undefined&&packet.shotId>p.lastShot){p.lastShot=packet.shotId;p.shotPending=packet.shotId;}p.input=packet;p.received=packet.sequence;p.age=0;return true;
  }
  private fire(id:string,p:Participant,shotId?:number){
    if(!p.weapon.fire())return;
    const requested=p.input.viewTick,rewindTick=requested===undefined?this.tick:Math.max(this.tick-this.historyTicks,Math.min(this.tick-1,requested)),history=requested===undefined?undefined:this.enemyHistory.get(rewindTick);
    const restored=new Map<number,T.Vector3>();if(history)for(const enemy of this.enemies.active){const old=enemy.avatar.root.position.clone(),past=history.get(enemy.id);if(past){restored.set(enemy.id,old);enemy.avatar.root.position.copy(past);}}
    this.scene.updateMatrixWorld(true);
    const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(),p.camera.camera);ray.far=C.weapon.range;
    let distance:number=C.weapon.range,to=ray.ray.at(distance,new T.Vector3());
    const wall=ray.intersectObjects(this.world.solids,false)[0];if(wall){distance=wall.distance;to=wall.point;}
    let victim:typeof this.enemies.active[number]|undefined;
    const candidates=history?this.enemies.active.filter(enemy=>history.has(enemy.id)):requested===undefined?this.enemies.active:[];
    for(const enemy of candidates){const hit=ray.intersectObject(enemy.avatar.body,true).find(h=>h.object instanceof T.Mesh&&(h.object.material as T.Material).side!==T.BackSide);if(hit&&hit.distance<distance){distance=hit.distance;to=hit.point;victim=enemy;}}
    const from=p.player.avatar.muzzle.getWorldPosition(new T.Vector3());
    const cover=new T.Raycaster(from,to.clone().sub(from).normalize(),0,from.distanceTo(to)).intersectObjects(this.world.solids,false)[0];
    if(cover){to=cover.point;victim=undefined;}
    for(const enemy of this.enemies.active){const current=restored.get(enemy.id);if(current)enemy.avatar.root.position.copy(current);}this.scene.updateMatrixWorld(true);
    if(victim&&this.enemies.damage(victim,C.weapon.damage)){p.kills++;p.money+=victim.reward;this.dayKills++;this.dayMoney+=victim.reward;}
    this.shots.push({serial:++this.serial,player:id,shotId,from,to,hit:!!victim,rewindTicks:this.tick-rewindTick});this.shots=this.shots.slice(-16);
  }
  private finishHorde(live:Participant[]){
    const connected=[...this.players.values()].filter(p=>p.connected&&p.ready);this.lastDayResult={serial:++this.dayResultSerial,day:this.cycle.day-1,kills:this.dayKills,money:this.dayMoney,survivors:connected.filter(p=>!p.player.health.dead).length,players:connected.length,nextBoss:Math.ceil(this.cycle.day/C.day.bossInterval)*C.day.bossInterval,tick:this.tick};
    for(const p of live){p.weapon.resupply();p.player.health.heal(C.day.dawnHeal);}
  }
  step(){
    this.tick++;if(!this.players.size)return;
    const live=[...this.players.values()].filter(p=>p.connected&&p.ready&&!p.player.health.dead);if(!live.length)return;
    this.ammoDrops.update(C.fixedStep,live.map((p,index)=>({id:String(index),x:p.player.position.x,z:p.player.position.z,alive:true,ready:true,ammo:p.weapon.ammo,reserve:p.weapon.reserve})));
    for(const [id,p] of this.players){
      if(!p.connected)continue;
      if(p.ready&&p.protection>0){p.protection=Math.max(0,p.protection-C.fixedStep);p.player.health.immunity=Math.max(p.player.health.immunity,p.protection);}
      if(++p.age>15)p.input.command=neutral();
      if(p.player.health.dead)continue;
      p.player.update(C.fixedStep,p.input.command,p.input.yaw,this.world);p.weapon.update(C.fixedStep);
      p.camera.yaw=p.input.yaw;p.camera.pitch=p.input.pitch??.19;p.camera.mode=p.input.cameraMode??'third';p.camera.update(C.fixedStep,p.player.position,this.world,true);
      if(p.input.command.reload)p.weapon.reload();if(p.input.command.fire||p.shotPending!==null)this.fire(id,p,p.shotPending??undefined);p.shotPending=null;
      p.applied=p.received;p.input.command.jump=p.input.command.reload=p.input.command.fire=false;
    }
    const event=this.cycle.update(C.fixedStep);
    if(event==='horde'){this.dayKills=this.dayMoney=0;this.lastDayResult=null;this.horde.begin(this.cycle.day,live.length);this.hunters.begin(this.cycle.day);if(this.cycle.day%C.day.bossInterval===0)this.enemies.spawnBoss(this.cycle.day,live[0].player.position,live.length);}
    if(this.cycle.phase==='horde'){const commonEnemies=this.enemies.active.filter(enemy=>enemy.kind==='horde'),commons=commonEnemies.length,boss=this.enemies.active.find(enemy=>enemy.kind==='boss');this.horde.update(C.fixedStep,commons,()=>this.enemies.spawn(this.cycle.day,live[this.horde.spawned%live.length].player.position),boss?boss.health/boss.maxHealth:null,commonEnemies.every(enemy=>enemy.state==='WANDER'));this.hunters.update(C.fixedStep,()=>this.enemies.spawnHunter(this.cycle.day,live[this.tick%live.length].player.position));}
    this.enemies.update(C.fixedStep,live.map(p=>p.player),()=>{},(boss,center)=>{const deer=boss.bossVariant==='human-deer',radius=deer?C.humanDeer.roarRadius:C.boss.slamRadius,damage=deer?C.humanDeer.roarDamage:C.boss.slamDamage;this.impacts.push({serial:++this.impactSerial,bossId:boss.id,kind:deer?'roar':'impact',position:center.clone(),radius,tick:this.tick});this.impacts=this.impacts.slice(-8);for(const p of live){const offset=p.player.position.clone().sub(center);offset.y=0;const distance=offset.length();if(distance>radius)continue;if(distance<.001)offset.set(p.slot%2?-1:1,0,0);else offset.multiplyScalar(1/distance);p.player.health.damage(damage);p.player.velocity.addScaledVector(offset,C.boss.slamKnockback);p.player.vertical=Math.max(p.player.vertical,deer?2.5:C.boss.slamLift);}});
    if(this.cycle.phase==='horde'){const commons=this.enemies.active.filter(enemy=>enemy.kind==='horde').length,hunters=this.enemies.active.filter(enemy=>enemy.kind==='hunter').length,bossAlive=this.enemies.active.some(enemy=>enemy.kind==='boss');if(this.hunters.complete&&hunters===0&&this.horde.canComplete(C.fixedStep,commons,bossAlive)&&this.cycle.completeHorde())this.finishHorde(live);}
    this.enemyHistory.set(this.tick,new Map(this.enemies.active.map(e=>[e.id,e.avatar.root.position.clone()])));while(this.enemyHistory.size>this.historyTicks)this.enemyHistory.delete(this.enemyHistory.keys().next().value!);
  }
  private get gameOver(){const active=[...this.players.values()].filter(p=>p.ready);return active.length>0&&active.every(p=>p.player.health.dead);}
  snapshot(){const ids=new Map([...this.players].map(([id,p])=>[p.player,id])),commons=this.enemies.active.filter(enemy=>enemy.kind==='horde').length,hunters=this.enemies.active.filter(enemy=>enemy.kind==='hunter').length,hordeState=this.horde.state(commons);return {version:1,tick:this.tick,round:this.round,day:this.cycle.day,phase:this.cycle.phase,remaining:this.cycle.remaining,gameOver:this.gameOver,horde:this.cycle.phase==='horde'?{...hordeState,remaining:hordeState.remaining+this.hunters.remaining(hunters),assist:hordeState.assist&&this.hunters.remaining(hunters)===0}:null,
    players:[...this.players].map(([id,p])=>({id,name:p.name,connected:p.connected,ready:p.ready,protection:p.protection,acknowledged:p.applied,chatAcknowledged:p.lastChat,yaw:p.input.yaw,position:{...p.player.position},velocity:{...p.player.velocity},vertical:p.player.vertical,health:p.player.health.value,ammo:p.weapon.ammo,reserve:p.weapon.reserve,reloading:p.weapon.reloadTime>0,crouch:p.input.command.crouch,kills:p.kills,money:p.money})),
    enemies:this.enemies.active.map(e=>({id:e.id,kind:e.kind,enraged:e.enraged,maxHealth:e.maxHealth,targetId:e.target?ids.get(e.target)??null:null,position:{...e.avatar.root.position},yaw:e.avatar.root.rotation.y,health:e.health,state:e.state,speed:e.speed})),
    boss:(()=>{const boss=this.enemies.active.find(e=>e.kind==='boss');if(!boss)return null;const deer=boss.bossVariant==='human-deer';return {id:boss.id,name:deer?C.humanDeer.name:C.boss.name,variant:boss.bossVariant??'lizard',health:boss.health,maxHealth:boss.maxHealth,enraged:boss.enraged,slam:boss.specialWindup>0?{serial:boss.specialSerial,attack:deer?'roar' as const:'impact' as const,position:{...boss.specialCenter},radius:deer?C.humanDeer.roarRadius:C.boss.slamRadius,remaining:boss.specialWindup}:null};})(),
    ammoDrops:this.ammoDrops.snapshot(),shots:this.shots.map(s=>({...s,from:{...s.from},to:{...s.to}})),impacts:this.impacts.map(impact=>({...impact,position:{...impact.position}})),messages:this.messages.filter(message=>this.tick-message.tick<=this.chatLifetimeTicks).map(message=>({...message})),dayResult:this.lastDayResult?{...this.lastDayResult}:null};}
}
export type CombatSnapshot=ReturnType<CombatAuthority['snapshot']>;
