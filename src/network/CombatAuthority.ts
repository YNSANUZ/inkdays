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
const neutral=()=>({x:0,z:0,run:false,crouch:false,jump:false,fire:false,reload:false});
interface Participant {slot:number;player:Player;weapon:Pistol;camera:ThirdPerson;input:InputPacket;age:number;received:number;applied:number;kills:number;money:number}
export class CombatAuthority {
  readonly scene=new T.Scene();readonly world=new World(this.scene);readonly enemies=new Enemies(this.scene,this.world);
  cycle=new DayCycle();private horde=new Horde();private players=new Map<string,Participant>();tick=0;
  private shots:{serial:number;player:string;from:T.Vector3;to:T.Vector3;hit:boolean}[]=[];private serial=0;
  join(id:string){
    if(this.players.has(id)||this.players.size>=2)return false;
    if(!this.players.size){this.cycle=new DayCycle();this.horde=new Horde();this.enemies.clear();this.shots=[];}
    const slot=[...this.players.values()].some(p=>p.slot===0)?1:0,player=new Player();player.position.x=slot*2;this.scene.add(player.avatar.root);
    this.players.set(id,{slot,player,weapon:new Pistol(),camera:new ThirdPerson(),input:{version:1,sequence:0,yaw:0,command:neutral()},age:Infinity,received:-1,applied:-1,kills:0,money:0});return true;
  }
  suspend(id:string){const p=this.players.get(id);if(p){p.input.command=neutral();p.player.velocity.x=p.player.velocity.z=0;}}
  leave(id:string){const p=this.players.get(id);if(p)this.scene.remove(p.player.avatar.root);this.players.delete(id);if(!this.players.size)this.enemies.clear();}
  receive(id:string,value:unknown){const p=this.players.get(id),packet=parseInput(value);if(!p||!packet||packet.sequence<=p.received)return false;
    packet.command.jump||=p.input.command.jump;packet.command.reload||=p.input.command.reload;packet.command.fire||=p.input.command.fire&&p.age===0;
    p.input=packet;p.received=packet.sequence;p.age=0;return true;
  }
  private fire(id:string,p:Participant){
    if(!p.weapon.fire())return;
    this.scene.updateMatrixWorld(true);
    const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(),p.camera.camera);ray.far=C.weapon.range;
    let distance:number=C.weapon.range,to=ray.ray.at(distance,new T.Vector3());
    const wall=ray.intersectObjects(this.world.solids,false)[0];if(wall){distance=wall.distance;to=wall.point;}
    let victim:typeof this.enemies.active[number]|undefined;
    for(const enemy of this.enemies.active){const hit=ray.intersectObject(enemy.avatar.body,true).find(h=>h.object instanceof T.Mesh&&(h.object.material as T.Material).side!==T.BackSide);if(hit&&hit.distance<distance){distance=hit.distance;to=hit.point;victim=enemy;}}
    const from=p.player.avatar.muzzle.getWorldPosition(new T.Vector3());
    const cover=new T.Raycaster(from,to.clone().sub(from).normalize(),0,from.distanceTo(to)).intersectObjects(this.world.solids,false)[0];
    if(cover){to=cover.point;victim=undefined;}
    if(victim&&this.enemies.damage(victim,C.weapon.damage)){p.kills++;p.money+=C.enemy.reward;}
    this.shots.push({serial:++this.serial,player:id,from,to,hit:!!victim});this.shots=this.shots.slice(-16);
  }
  step(){
    this.tick++;if(!this.players.size)return;
    const live=[...this.players.values()].filter(p=>!p.player.health.dead);if(!live.length)return;
    for(const [id,p] of this.players){
      if(++p.age>15)p.input.command=neutral();
      if(p.player.health.dead)continue;
      p.player.update(C.fixedStep,p.input.command,p.input.yaw,this.world);p.weapon.update(C.fixedStep);
      p.camera.yaw=p.input.yaw;p.camera.pitch=p.input.pitch??.19;p.camera.update(C.fixedStep,p.player.position,this.world,true);
      if(p.input.command.reload)p.weapon.reload();if(p.input.command.fire)this.fire(id,p);
      p.applied=p.received;p.input.command.jump=p.input.command.reload=false;
    }
    const event=this.cycle.update(C.fixedStep);
    if(event==='horde')this.horde.begin(this.cycle.day);
    if(event==='dawn'){this.enemies.clear();for(const p of live){p.weapon.resupply();p.player.health.heal(C.day.dawnHeal);}}
    if(this.cycle.phase==='horde')this.horde.update(C.fixedStep,()=>this.enemies.spawn(this.cycle.day,live[this.horde.spawned%live.length].player.position));
    this.enemies.update(C.fixedStep,live.map(p=>p.player),()=>{});
  }
  snapshot(){return {version:1,tick:this.tick,day:this.cycle.day,phase:this.cycle.phase,remaining:this.cycle.remaining,gameOver:this.players.size>0&&[...this.players.values()].every(p=>p.player.health.dead),
    players:[...this.players].map(([id,p])=>({id,name:`Errante ${p.slot+1}`,acknowledged:p.applied,yaw:p.input.yaw,position:{...p.player.position},velocity:{...p.player.velocity},vertical:p.player.vertical,health:p.player.health.value,ammo:p.weapon.ammo,reserve:p.weapon.reserve,reloading:p.weapon.reloadTime>0,crouch:p.input.command.crouch,kills:p.kills,money:p.money})),
    enemies:this.enemies.active.map(e=>({id:e.id,position:{...e.avatar.root.position},yaw:e.avatar.root.rotation.y,health:e.health,state:e.state,speed:e.speed})),
    shots:this.shots.map(s=>({...s,from:{...s.from},to:{...s.to}}))};}
}
