import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'node:crypto';
import { MovementAuthority } from './MovementAuthority';
import type { CollisionWorld } from '../simulation/Movement';
export function createMovementServer(world:CollisionWorld,port=8787,authority:Pick<MovementAuthority,'join'|'leave'|'receive'|'step'|'snapshot'|'tick'>=new MovementAuthority(world)){
  const server=new WebSocketServer({host:'127.0.0.1',port,maxPayload:2048});
  server.on('connection',socket=>{
    const id=randomUUID();
    if(!authority.join(id)){socket.close(1008,'Sala cheia');return;}
    socket.send(JSON.stringify({type:'welcome',id,version:1}));
    let count=0;const reset=setInterval(()=>{count=0;},1000);
    socket.on('message',data=>{
      if(++count>120){socket.close(1008,'Limite de comandos');return;}
      try{if(!authority.receive(id,JSON.parse(data.toString())))socket.send(JSON.stringify({type:'rejected'}));}
      catch{socket.close(1008,'Comando inválido');}
    });
    socket.on('error',()=>{});
    socket.on('close',()=>{clearInterval(reset);authority.leave(id);});
  });
  const timer=setInterval(()=>{
    authority.step();if(authority.tick%3)return;
    const packet=JSON.stringify({type:'snapshot',...authority.snapshot()});
    for(const socket of server.clients)if(socket.readyState===WebSocket.OPEN){
      if(socket.bufferedAmount>65536){socket.close(1013,'Conexão lenta');continue;}socket.send(packet);
    }
  },1000/60);
  return {server,authority,close:async()=>{clearInterval(timer);for(const socket of server.clients)socket.terminate();await new Promise<void>(resolve=>server.close(()=>resolve()));}};
}
