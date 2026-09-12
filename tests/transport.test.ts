import {it,expect} from 'vitest';
import {WebSocket} from 'ws';
import {createMovementServer} from '../src/network/Server';
import type {MovementAuthority} from '../src/network/MovementAuthority';
type Snapshot=ReturnType<MovementAuthority['snapshot']>;
it('sincroniza dois clientes reais, limita a sala e remove quem desconecta',async()=>{
  const instance=createMovementServer({move(p,x,z){p.x+=x;p.z+=z;}},0);
  const sockets:WebSocket[]=[];
  const until=async(predicate:()=>boolean)=>{const end=Date.now()+3000;while(!predicate()){if(Date.now()>end)throw Error('Tempo esgotado');await new Promise(r=>setTimeout(r,10));}};
  try{
    await new Promise<void>(resolve=>instance.server.once('listening',resolve));
    const address=instance.server.address();if(typeof address==='string'||!address)throw Error('Endereço inválido');
    const connect=()=>{const socket=new WebSocket(`ws://127.0.0.1:${address.port}`);sockets.push(socket);const state:{id:string;snapshot:Snapshot|null}={id:'',snapshot:null};socket.on('message',raw=>{const p=JSON.parse(raw.toString());if(p.type==='welcome')state.id=p.id;if(p.type==='snapshot')state.snapshot=p;});return {socket,state};};
    const a=connect(),b=connect();await until(()=>!!a.state.id&&!!b.state.id&&a.state.snapshot?.players.length===2&&b.state.snapshot?.players.length===2);
    expect(a.state.id).not.toBe(b.state.id);
    a.socket.send(JSON.stringify({version:1,sequence:1,yaw:0,command:{x:0,z:1,run:false,crouch:false,jump:false,fire:false,reload:false}}));
    await until(()=>!!b.state.snapshot?.players.some(p=>p.id===a.state.id&&p.position.z<9.9));
    expect(b.state.snapshot!.players.find(p=>p.id===b.state.id)!.position.z).toBe(10);
    const third=connect();const code=await new Promise<number>(resolve=>third.socket.once('close',resolve));expect(code).toBe(1008);
    a.socket.close();await until(()=>b.state.snapshot?.players.length===1);expect(b.state.snapshot!.players[0].id).toBe(b.state.id);
  }finally{for(const socket of sockets)socket.terminate();await instance.close();}
},10000);
