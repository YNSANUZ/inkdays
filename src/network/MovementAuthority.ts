import { movePlayer } from '../simulation/Movement';
import type { Motion, CollisionWorld } from '../simulation/Movement';
import { parseInput, PROTOCOL_VERSION } from './Protocol';
import type { InputPacket } from './Protocol';
const neutral=()=>({x:0,z:0,run:false,crouch:false,jump:false,fire:false,reload:false});
/** Movement-only authority prototype. Connections must supply their own server-assigned ID. */
export class MovementAuthority {
  private players=new Map<string,{slot:number;connected:boolean;motion:Motion;input:InputPacket;age:number;received:number;applied:number}>();
  tick=0;
  constructor(private world:CollisionWorld){}
  join(id:string){
    if(this.players.has(id)||this.players.size>=2)return false;
    const slot=Array.from(this.players.values()).some(p=>p.slot===0)?1:0;
    this.players.set(id,{slot,connected:true,motion:{position:{x:slot*2,y:0,z:10},velocity:{x:0,y:0,z:0},vertical:0},input:{version:1,sequence:0,yaw:0,command:neutral()},age:Infinity,received:-1,applied:-1});return true;
  }
  suspend(id:string){const player=this.players.get(id);if(player){player.connected=false;player.input.command=neutral();player.motion.velocity.x=player.motion.velocity.z=0;}}
  resume(id:string){const player=this.players.get(id);if(player)player.connected=true;}
  leave(id:string){this.players.delete(id);}
  receive(id:string,value:unknown){
    const player=this.players.get(id),packet=parseInput(value);
    if(!player?.connected||!packet||packet.sequence<=player.received)return false;
    // Coalesce held input, but keep one-shot actions until the next server tick.
    packet.command.jump||=player.input.command.jump;
    packet.command.reload||=player.input.command.reload;
    player.input=packet;player.received=packet.sequence;player.age=0;return true;
  }
  step(){
    this.tick++;
    for(const player of this.players.values()){
      if(!player.connected)continue;
      if(++player.age>15)player.input.command=neutral();
      movePlayer(player.motion,player.input.command,player.input.yaw,this.world);
      player.applied=player.received;
      player.input.command.jump=player.input.command.reload=false;
    }
  }
  snapshot(){return {version:PROTOCOL_VERSION,tick:this.tick,players:Array.from(this.players,([id,p])=>({id,connected:p.connected,acknowledged:p.applied,yaw:p.input.yaw,position:{...p.motion.position},velocity:{...p.motion.velocity},vertical:p.motion.vertical}))};}
}
