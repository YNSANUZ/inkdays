import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'node:crypto';
import { MovementAuthority } from './MovementAuthority';
import type { CollisionWorld } from '../simulation/Movement';
export function createMovementServer(world:CollisionWorld,port=8787,authority:Pick<MovementAuthority,'join'|'suspend'|'leave'|'receive'|'step'|'snapshot'|'tick'>=new MovementAuthority(world),reconnectGraceMs=5000){
  const server=new WebSocketServer({host:'127.0.0.1',port,maxPayload:2048});
  const sessions=new Map<string,{id:string;connected:boolean;timer?:ReturnType<typeof setTimeout>}>();
  server.on('connection',(socket,request)=>{
    const resume=new URL(request.url??'/',`ws://${request.headers.host??'localhost'}`).searchParams.get('resume');
    const token=resume&&sessions.get(resume)&&!sessions.get(resume)!.connected?resume:randomUUID();
    let session=sessions.get(token);
    if(session){if(session.timer)clearTimeout(session.timer);session.connected=true;}
    else{const id=randomUUID();if(!authority.join(id)){socket.close(1008,'Sala cheia');return;}session={id,connected:true};sessions.set(token,session);}
    const id=session.id;socket.send(JSON.stringify({type:'welcome',id,token,version:1,resumed:!!resume&&token===resume}));
    let count=0;const reset=setInterval(()=>{count=0;},1000);
    socket.on('message',data=>{
      if(++count>120){socket.close(1008,'Limite de comandos');return;}
      try{if(!authority.receive(id,JSON.parse(data.toString())))socket.send(JSON.stringify({type:'rejected'}));}
      catch{socket.close(1008,'Comando inválido');}
    });
    socket.on('error',()=>{});
    socket.on('close',()=>{clearInterval(reset);authority.suspend(id);session!.connected=false;session!.timer=setTimeout(()=>{authority.leave(id);sessions.delete(token);},reconnectGraceMs);});
  });
  const timer=setInterval(()=>{
    authority.step();if(authority.tick%3)return;
    const packet=JSON.stringify({type:'snapshot',...authority.snapshot()});
    for(const socket of server.clients)if(socket.readyState===WebSocket.OPEN){
      if(socket.bufferedAmount>65536){socket.close(1013,'Conexão lenta');continue;}socket.send(packet);
    }
  },1000/60);
  return {server,authority,close:async()=>{clearInterval(timer);for(const session of sessions.values())if(session.timer)clearTimeout(session.timer);for(const socket of server.clients)socket.terminate();await new Promise<void>(resolve=>server.close(()=>resolve()));}};
}
