import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'node:crypto';
import { MAX_PLAYERS, MovementAuthority } from './MovementAuthority';
import type { CollisionWorld } from '../simulation/Movement';
import { NetworkConditioner } from './NetworkConditioner';
import type { NetworkConditions } from './NetworkConditioner';
import { normalizeRoomCode, PUBLIC_ROOM_CODE } from './RoomCode';
import { SnapshotStream } from './SnapshotStream';
import type { CombatSnapshot } from './CombatAuthority';
interface ServerRuntime {pulseMs?:number;stepsPerPulse?:number;roomFactory?:()=>ServerAuthority;protocolVersion?:1|2}
type ServerAuthority=Pick<MovementAuthority,'join'|'suspend'|'resume'|'leave'|'receive'|'step'|'snapshot'|'tick'>&{restart?:(id:string)=>boolean;revive?:(id:string)=>boolean;reviveAlly?:(id:string,targetId:string)=>boolean;setReady?:(id:string,ready?:boolean)=>boolean;rename?:(id:string,name:unknown)=>boolean;chat?:(id:string,messageId:unknown,text:unknown)=>boolean};
export const DEFAULT_RECONNECT_GRACE_MS=15000;
export function createMovementServer(world:CollisionWorld,port=8787,authority:ServerAuthority=new MovementAuthority(world),reconnectGraceMs=DEFAULT_RECONNECT_GRACE_MS,conditions?:NetworkConditions,host='127.0.0.1',inactivityMs=7000,runtime?:ServerRuntime){
  const server=new WebSocketServer({host,port,maxPayload:2048});
  const link=new NetworkConditioner(conditions),send=(socket:WebSocket,packet:string)=>link.schedule('outbound',()=>{if(socket.readyState===WebSocket.OPEN)socket.send(packet);});
  const rooms=new Map<string,ServerAuthority>([[PUBLIC_ROOM_CODE,authority]]),socketAuthorities=new Map<WebSocket,ServerAuthority>(),streams=new Map<WebSocket,SnapshotStream>();
  const sessions=new Map<string,{id:string;room:string;authority:ServerAuthority;connected:boolean;socket:WebSocket;timer?:ReturnType<typeof setTimeout>}>();
  server.on('connection',(socket,request)=>{
    const requestUrl=new URL(request.url??'/',`ws://${request.headers.host??'localhost'}`),resume=requestUrl.searchParams.get('resume'),requestedRoom=normalizeRoomCode(requestUrl.searchParams.get('room'));
    const token=resume&&sessions.has(resume)?resume:randomUUID();
    let session=sessions.get(token);
    if(session){if(session.timer)clearTimeout(session.timer);const previous=session.socket;session.socket=socket;session.connected=true;session.authority.resume(session.id);if(previous.readyState===WebSocket.OPEN)previous.close(4001,'Sessão retomada em outra conexão');}
    else{const room=requestedRoom,roomAuthority=rooms.get(room)??runtime?.roomFactory?.();if(!roomAuthority){socket.send(JSON.stringify({type:'room-unavailable',room}),()=>socket.close(1008,'Sala indisponível'));return;}rooms.set(room,roomAuthority);const id=randomUUID();if(!roomAuthority.join(id)){socket.send(JSON.stringify({type:'room-full',capacity:MAX_PLAYERS}),()=>socket.close(1008,'Sala cheia'));return;}if(requestUrl.searchParams.get('lobby')==='1')roomAuthority.setReady?.(id,false);session={id,room,authority:roomAuthority,connected:true,socket};sessions.set(token,session);}
    const id=session.id,roomAuthority=session.authority;socketAuthorities.set(socket,roomAuthority);if(runtime?.protocolVersion===2)streams.set(socket,new SnapshotStream());socket.send(JSON.stringify({type:'welcome',id,token,room:session.room,version:runtime?.protocolVersion??1,resumed:!!resume&&token===resume}));
    let count=0,lastPong=Date.now();const reset=setInterval(()=>{count=0;},1000),watchdog=setInterval(()=>{if(Date.now()-lastPong>inactivityMs){socket.terminate();return;}socket.ping();},Math.min(2000,Math.max(20,inactivityMs/2)));
    socket.on('pong',()=>{lastPong=Date.now();});
    socket.on('message',data=>{
      if(++count>120){socket.close(1008,'Limite de comandos');return;}
      link.schedule('inbound',()=>{if(!session!.connected||session!.socket!==socket||socket.readyState!==WebSocket.OPEN)return;try{const packet=JSON.parse(data.toString());if(packet?.type==='ping'&&typeof packet.nonce==='number'&&Number.isFinite(packet.nonce)){send(socket,JSON.stringify({type:'pong',nonce:packet.nonce,serverTick:roomAuthority.tick}));return;}if(packet?.type==='ready'&&Object.keys(packet).length===1){if(!roomAuthority.setReady?.(id,true))send(socket,JSON.stringify({type:'rejected'}));return;}if(packet?.type==='restart'&&Object.keys(packet).length===1){if(!roomAuthority.restart?.(id))send(socket,JSON.stringify({type:'rejected'}));return;}if(packet?.type==='revive'&&Object.keys(packet).length===1){if(!roomAuthority.revive?.(id))send(socket,JSON.stringify({type:'rejected'}));return;}if(packet?.type==='revive-ally'&&Object.keys(packet).length===2&&typeof packet.target==='string'){if(!roomAuthority.reviveAlly?.(id,packet.target))send(socket,JSON.stringify({type:'rejected'}));return;}if(packet?.type==='name'&&Object.keys(packet).length===2){if(!roomAuthority.rename?.(id,packet.name))send(socket,JSON.stringify({type:'rejected'}));return;}if(packet?.type==='chat'&&Object.keys(packet).length===3){if(!roomAuthority.chat?.(id,packet.messageId,packet.text))send(socket,JSON.stringify({type:'rejected'}));return;}roomAuthority.setReady?.(id,true);if(!roomAuthority.receive(id,packet))send(socket,JSON.stringify({type:'rejected'}));}
      catch{socket.close(1008,'Comando inválido');}});
    });
    socket.on('error',()=>{});
    socket.on('close',()=>{clearInterval(reset);clearInterval(watchdog);socketAuthorities.delete(socket);streams.delete(socket);if(session!.socket!==socket)return;roomAuthority.suspend(id);session!.connected=false;session!.timer=setTimeout(()=>{roomAuthority.leave(id);sessions.delete(token);if(session!.room!==PUBLIC_ROOM_CODE&&![...sessions.values()].some(item=>item.room===session!.room))rooms.delete(session!.room);},reconnectGraceMs);});
  });
  const stepsPerPulse=Math.max(1,Math.floor(runtime?.stepsPerPulse??1)),pulseMs=Math.max(1,runtime?.pulseMs??1000/60),timer=setInterval(()=>{
    for(const roomAuthority of rooms.values())for(let step=0;step<stepsPerPulse;step++)roomAuthority.step();const packets=new Map<ServerAuthority,string>();
    for(const socket of server.clients)if(socket.readyState===WebSocket.OPEN){
      const roomAuthority=socketAuthorities.get(socket);if(!roomAuthority)continue;if(socket.bufferedAmount>65536){socket.close(1013,'Conexão lenta');continue;}
      const stream=streams.get(socket);if(stream){const compact=stream.next(roomAuthority.snapshot() as CombatSnapshot);if(compact)send(socket,JSON.stringify(compact));continue;}
      if(roomAuthority.tick%3)continue;let packet=packets.get(roomAuthority);if(!packet){packet=JSON.stringify({type:'snapshot',...roomAuthority.snapshot()});packets.set(roomAuthority,packet);}send(socket,packet);
    }
  },pulseMs);
  return {server,authority,close:async()=>{clearInterval(timer);link.close();for(const session of sessions.values())if(session.timer)clearTimeout(session.timer);for(const socket of server.clients)socket.terminate();await new Promise<void>(resolve=>server.close(()=>resolve()));}};
}
