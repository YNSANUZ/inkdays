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
const neutral=()=>({x:0,z:0,run:false,crouch:false,jump:false,fire:false,reload:false});
const spawn=(slot:number)=>({x:(slot%4)*2,z:10+Math.floor(slot/4)*2});
interface Participant {slot:number;name:string;connected:boolean;player:Player;weapon:Pistol;camera:ThirdPerson;input:InputPacket;age:number;received:number;applied:number;viewed:number;kills:number;money:number;lastShot:number;shotPending:number|null;lastChat:number;lastChatTick:number}
export class CombatAuthority {
  readonly scene=new T.Scene();readonly world=new World(this.scene);readonly enemies=new Enemies(this.scene,this.world);
  cycle=new DayCycle();private horde=new Horde();private players=new Map<string,Participant>();tick=0;private round=1;
  private shots:{serial:number;player:string;shotId?:number;from:T.Vector3;to:T.Vector3;hit:boolean;rewindTicks:number}[]=[];private serial=0;
  private messages:{serial:number;messageId:number;player:string;name:string;text:string;tick:number}[]=[];private chatSerial=0;private readonly chatLifetimeTicks=720;
  private enemyHistory=new Map<number,Map<number,T.Vector3>>();private readonly historyTicks=30;
  join(id:string){
    if(this.players.has(id)||this.players.size>=MAX_PLAYERS)return false;
    if(!this.players.size){this.cycle=new DayCycle();this.horde=new Horde();this.enemies.clear();this.shots=[];this.messages=[];this.enemyHistory.clear();}
    const used=new Set([...this.players.values()].map(p=>p.slot)),slot=Array.from({length:MAX_PLAYERS},(_,index)=>index).find(index=>!used.has(index))!,player=new Player(),point=spawn(slot);player.position.set(point.x,0,point.z);this.scene.add(player.avatar.root);
    this.players.set(id,{slot,name:`Errante ${slot+1}`,connected:true,player,weapon:new Pistol(),camera:new ThirdPerson(),input:{version:1,sequence:0,yaw:0,command:neutral()},age:Infinity,received:-1,applied:-1,viewed:-1,kills:0,money:0,lastShot:-1,shotPending:null,lastChat:-1,lastChatTick:-Infinity});return true;
  }
  rename(id:string,value:unknown){const p=this.players.get(id),name=normalizePlayerName(value);if(!p?.connected||!name)return false;p.name=name;return true;}
  chat(id:string,messageId:unknown,value:unknown){const p=this.players.get(id),text=normalizeChatText(value);if(!p?.connected||!Number.isSafeInteger(messageId)||(messageId as number)<0||!text)return false;if((messageId as number)<=p.lastChat)return true;if(this.tick-p.lastChatTick<30)return false;p.lastChat=messageId as number;p.lastChatTick=this.tick;this.messages.push({serial:++this.chatSerial,messageId:p.lastChat,player:id,name:p.name,text,tick:this.tick});this.messages=this.messages.slice(-8);return true;}
  suspend(id:string){const p=this.players.get(id);if(p){p.connected=false;p.input.command=neutral();p.player.velocity.x=p.player.velocity.z=0;}}
  resume(id:string){const p=this.players.get(id);if(p)p.connected=true;}
  leave(id:string){const p=this.players.get(id);if(p)this.scene.remove(p.player.avatar.root);this.players.delete(id);if(!this.players.size)this.enemies.clear();}
  restart(id:string){
    const requester=this.players.get(id);if(!requester?.connected||!this.gameOver)return false;
    this.round++;this.cycle=new DayCycle();this.horde=new Horde();this.enemies.clear();this.shots=[];this.enemyHistory.clear();
    for(const p of this.players.values()){
      this.scene.remove(p.player.avatar.root);p.player=new Player();const point=spawn(p.slot);p.player.position.set(point.x,0,point.z);this.scene.add(p.player.avatar.root);
      p.weapon=new Pistol();p.input.command=neutral();p.age=Infinity;p.kills=0;p.money=0;p.shotPending=null;
    }
    return true;
  }
  revive(id:string){
    const p=this.players.get(id);if(!p?.connected||!p.player.health.dead)return false;
    const point=spawn(p.slot);p.player.position.set(point.x,0,point.z);p.player.velocity.set(0,0,0);p.player.vertical=0;p.player.health.revive();p.input.command=neutral();p.age=Infinity;return true;
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
    if(victim&&this.enemies.damage(victim,C.weapon.damage)){p.kills++;p.money+=victim.reward;}
    this.shots.push({serial:++this.serial,player:id,shotId,from,to,hit:!!victim,rewindTicks:this.tick-rewindTick});this.shots=this.shots.slice(-16);
  }
  step(){
    this.tick++;if(!this.players.size)return;
    const live=[...this.players.values()].filter(p=>p.connected&&!p.player.health.dead);if(!live.length)return;
    for(const [id,p] of this.players){
      if(!p.connected)continue;
      if(++p.age>15)p.input.command=neutral();
      if(p.player.health.dead)continue;
      p.player.update(C.fixedStep,p.input.command,p.input.yaw,this.world);p.weapon.update(C.fixedStep);
      p.camera.yaw=p.input.yaw;p.camera.pitch=p.input.pitch??.19;p.camera.update(C.fixedStep,p.player.position,this.world,true);
      if(p.input.command.reload)p.weapon.reload();if(p.input.command.fire||p.shotPending!==null)this.fire(id,p,p.shotPending??undefined);p.shotPending=null;
      p.applied=p.received;p.input.command.jump=p.input.command.reload=p.input.command.fire=false;
    }
    const event=this.cycle.update(C.fixedStep);
    if(event==='horde'){this.horde.begin(this.cycle.day,live.length);if(this.cycle.day%C.day.bossInterval===0)this.enemies.spawnBoss(this.cycle.day,live[0].player.position,live.length);}
    if(event==='dawn'){this.enemies.clear();for(const p of live){p.weapon.resupply();p.player.health.heal(C.day.dawnHeal);}}
    if(this.cycle.phase==='horde')this.horde.update(C.fixedStep,()=>this.enemies.spawn(this.cycle.day,live[this.horde.spawned%live.length].player.position));
    this.enemies.update(C.fixedStep,live.map(p=>p.player),()=>{},(_boss,center)=>{for(const p of live){const offset=p.player.position.clone().sub(center);offset.y=0;if(offset.length()<=C.boss.slamRadius)p.player.health.damage(C.boss.slamDamage);}});
    this.enemyHistory.set(this.tick,new Map(this.enemies.active.map(e=>[e.id,e.avatar.root.position.clone()])));while(this.enemyHistory.size>this.historyTicks)this.enemyHistory.delete(this.enemyHistory.keys().next().value!);
  }
  private get gameOver(){return this.players.size>0&&[...this.players.values()].every(p=>p.player.health.dead);}
  snapshot(){const ids=new Map([...this.players].map(([id,p])=>[p.player,id]));return {version:1,tick:this.tick,round:this.round,day:this.cycle.day,phase:this.cycle.phase,remaining:this.cycle.remaining,gameOver:this.gameOver,
    players:[...this.players].map(([id,p])=>({id,name:p.name,connected:p.connected,acknowledged:p.applied,chatAcknowledged:p.lastChat,yaw:p.input.yaw,position:{...p.player.position},velocity:{...p.player.velocity},vertical:p.player.vertical,health:p.player.health.value,ammo:p.weapon.ammo,reserve:p.weapon.reserve,reloading:p.weapon.reloadTime>0,crouch:p.input.command.crouch,kills:p.kills,money:p.money})),
    enemies:this.enemies.active.map(e=>({id:e.id,kind:e.kind,enraged:e.enraged,maxHealth:e.maxHealth,targetId:e.target?ids.get(e.target)??null:null,position:{...e.avatar.root.position},yaw:e.avatar.root.rotation.y,health:e.health,state:e.state,speed:e.speed})),
    boss:(()=>{const boss=this.enemies.active.find(e=>e.kind==='boss');return boss?{id:boss.id,name:C.boss.name,health:boss.health,maxHealth:boss.maxHealth,enraged:boss.enraged,slam:boss.specialWindup>0?{serial:boss.specialSerial,position:{...boss.specialCenter},radius:C.boss.slamRadius,remaining:boss.specialWindup}:null}:null;})(),
    shots:this.shots.map(s=>({...s,from:{...s.from},to:{...s.to}})),messages:this.messages.filter(message=>this.tick-message.tick<=this.chatLifetimeTicks).map(message=>({...message}))};}
}
