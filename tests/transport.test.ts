import {it,expect} from 'vitest';
import {WebSocket} from 'ws';
import {Vector3} from 'three';
import {createMovementServer} from '../src/network/Server';
import type {MovementAuthority} from '../src/network/MovementAuthority';
import {CombatAuthority} from '../src/network/CombatAuthority';
type Snapshot=ReturnType<MovementAuthority['snapshot']>;
it('sincroniza dois clientes reais, limita a sala e remove quem desconecta',async()=>{
  const instance=createMovementServer({move(p,x,z){p.x+=x;p.z+=z;}},0,undefined,50);
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
it('preserva identidade e estado durante reconexão breve',async()=>{
  const instance=createMovementServer({move(p,x,z){p.x+=x;p.z+=z;}},0,undefined,500);
  const sockets:WebSocket[]=[];
  try{
    await new Promise<void>(resolve=>instance.server.once('listening',resolve));const address=instance.server.address();if(!address||typeof address==='string')throw Error('Endereço inválido');
    const open=(resume='')=>new Promise<{socket:WebSocket;welcome:{id:string;token:string;resumed:boolean}}>((resolve,reject)=>{const socket=new WebSocket(`ws://127.0.0.1:${address.port}${resume?`?resume=${resume}`:''}`);sockets.push(socket);socket.once('error',reject);socket.on('message',raw=>{const p=JSON.parse(raw.toString());if(p.type==='welcome')resolve({socket,welcome:p});});});
    const first=await open();first.socket.send(JSON.stringify({version:1,sequence:1,yaw:0,command:{x:0,z:1,run:false,crouch:false,jump:false,fire:false,reload:false}}));await new Promise(r=>setTimeout(r,50));
    await new Promise<void>(resolve=>{first.socket.once('close',()=>resolve());first.socket.close();});await new Promise(r=>setTimeout(r,20));const before=instance.authority.snapshot().players[0].position.z;expect(before).toBeLessThan(10);
    const resumed=await open(first.welcome.token);expect(resumed.welcome).toMatchObject({id:first.welcome.id,resumed:true});const players=instance.authority.snapshot().players;expect(players).toHaveLength(1);expect(players[0].position.z).toBeCloseTo(before);
  }finally{for(const socket of sockets)socket.terminate();await instance.close();}
},10000);
it('transmite a mesma munição e fase autoritativas para dois clientes',async()=>{
  const authority=new CombatAuthority(),instance=createMovementServer(authority.world,0,authority);
  const sockets:WebSocket[]=[];
  try{
    await new Promise<void>(resolve=>instance.server.once('listening',resolve));
    const address=instance.server.address();if(!address||typeof address==='string')throw Error('Endereço inválido');
    const connect=()=>{const socket=new WebSocket(`ws://127.0.0.1:${address.port}`);sockets.push(socket);return socket;};
    const a=connect(),b=connect();
    const received=(socket:WebSocket)=>new Promise<ReturnType<CombatAuthority['snapshot']>>((resolve,reject)=>{
      const timer=setTimeout(()=>reject(Error('Sem snapshot de combate')),3000);
      socket.on('message',raw=>{const p=JSON.parse(raw.toString());if(p.type==='welcome'&&socket===a)socket.send(JSON.stringify({version:1,sequence:0,yaw:0,pitch:0,command:{x:0,z:0,run:false,crouch:false,jump:false,fire:true,reload:false}}));
        if(p.type==='snapshot'&&p.players.length===2&&p.players.some((player:{ammo:number})=>player.ammo===7)){clearTimeout(timer);resolve(p);}
      });
    });
    const [first,second]=await Promise.all([received(a),received(b)]);
    expect(first.players.map(p=>p.ammo)).toEqual(second.players.map(p=>p.ammo));expect(first.day).toBe(second.day);expect(first.phase).toBe('day');
  }finally{for(const socket of sockets)socket.terminate();await instance.close();}
},10000);
it('mede ida e volta sem alterar a simulação',async()=>{
  const instance=createMovementServer({move(p,x,z){p.x+=x;p.z+=z;}},0);let socket:WebSocket|undefined;
  try{await new Promise<void>(resolve=>instance.server.once('listening',resolve));const address=instance.server.address();if(!address||typeof address==='string')throw Error('Endereço inválido');socket=new WebSocket(`ws://127.0.0.1:${address.port}`);const pong=await new Promise<{type:string;nonce:number;serverTick:number}>((resolve,reject)=>{socket!.once('error',reject);socket!.on('message',raw=>{const p=JSON.parse(raw.toString());if(p.type==='welcome')socket!.send(JSON.stringify({type:'ping',nonce:123.5}));if(p.type==='pong')resolve(p);});});expect(pong).toMatchObject({type:'pong',nonce:123.5});expect(instance.authority.snapshot().players[0].acknowledged).toBe(-1);}
  finally{socket?.terminate();await instance.close();}
},10000);
it('mantém snapshots autoritativos iguais no WebSocket com rede degradada',async()=>{
  const instance=createMovementServer({move(p,x,z){p.x+=x;p.z+=z;}},0,undefined,5000,{latencyMs:25,jitterMs:15,dropEvery:9,duplicateEvery:5,reorderEvery:4});const sockets:WebSocket[]=[];
  try{await new Promise<void>(resolve=>instance.server.once('listening',resolve));const address=instance.server.address();if(!address||typeof address==='string')throw Error('Endereço inválido');
    const connect=()=>{const socket=new WebSocket(`ws://127.0.0.1:${address.port}`);sockets.push(socket);const state={id:'',frames:new Map<number,Snapshot>()};socket.on('message',raw=>{const p=JSON.parse(raw.toString());if(p.type==='welcome')state.id=p.id;if(p.type==='snapshot')state.frames.set(p.tick,p);});return {socket,state};};const a=connect(),b=connect();
    const until=async(predicate:()=>boolean)=>{const end=Date.now()+5000;while(!predicate()){if(Date.now()>end)throw Error('Tempo esgotado na rede degradada');await new Promise(r=>setTimeout(r,10));}};await until(()=>!!a.state.id&&!!b.state.id);
    for(let sequence=0;sequence<24;sequence++)a.socket.send(JSON.stringify({version:1,sequence,yaw:0,command:{x:0,z:1,run:false,crouch:false,jump:false,fire:false,reload:false}}));
    let common:Snapshot|undefined;await until(()=>{for(const [tick,frame] of a.state.frames){const other=b.state.frames.get(tick);if(other&&frame.players.length===2&&frame.players.some(p=>p.id===a.state.id&&p.position.z<9.9)){expect(frame).toEqual(other);common=frame;return true;}}return false;});
    expect(common!.players.map(p=>p.id).sort()).toEqual([a.state.id,b.state.id].sort());
  }finally{for(const socket of sockets)socket.terminate();await instance.close();}
},10000);
it('reconecta na rede degradada sem aplicar mensagens antigas nem duplicar jogador',async()=>{
  const instance=createMovementServer({move(p,x,z){p.x+=x;p.z+=z;}},0,undefined,1000,{latencyMs:40,jitterMs:20,dropEvery:13,duplicateEvery:5,reorderEvery:4});const sockets:WebSocket[]=[];
  try{await new Promise<void>(resolve=>instance.server.once('listening',resolve));const address=instance.server.address();if(!address||typeof address==='string')throw Error('Endereço inválido');
    const open=(resume='')=>new Promise<{socket:WebSocket;welcome:{id:string;token:string;resumed:boolean}}>((resolve,reject)=>{const socket=new WebSocket(`ws://127.0.0.1:${address.port}${resume?`?resume=${resume}`:''}`);sockets.push(socket);socket.once('error',reject);socket.on('message',raw=>{const p=JSON.parse(raw.toString());if(p.type==='welcome')resolve({socket,welcome:p});});});
    const first=await open();for(let sequence=0;sequence<12;sequence++)first.socket.send(JSON.stringify({version:1,sequence,yaw:0,command:{x:0,z:1,run:false,crouch:false,jump:false,fire:false,reload:false}}));await new Promise(r=>setTimeout(r,180));await new Promise<void>(resolve=>{first.socket.once('close',()=>resolve());first.socket.close();});await new Promise(r=>setTimeout(r,20));
    const stopped=instance.authority.snapshot().players[0].position.z,resumed=await open(first.welcome.token);expect(resumed.welcome).toMatchObject({id:first.welcome.id,resumed:true});await new Promise(r=>setTimeout(r,180));const players=instance.authority.snapshot().players;expect(players).toHaveLength(1);expect(players[0].id).toBe(first.welcome.id);expect(players[0].position.z).toBeCloseTo(stopped);
  }finally{for(const socket of sockets)socket.terminate();await instance.close();}
},10000);
it('encerra conexão sem pong mesmo quando ainda recebe comandos e libera a vaga',async()=>{
  const instance=createMovementServer({move(p,x,z){p.x+=x;p.z+=z;}},0,undefined,50,undefined,'127.0.0.1',80);let socket:WebSocket|undefined,commands:ReturnType<typeof setInterval>|undefined;
  try{await new Promise<void>(resolve=>instance.server.once('listening',resolve));const address=instance.server.address();if(!address||typeof address==='string')throw Error('Endereço inválido');socket=new WebSocket(`ws://127.0.0.1:${address.port}`,{autoPong:false});let sequence=0;socket.once('open',()=>{commands=setInterval(()=>socket?.send(JSON.stringify({version:1,sequence:sequence++,yaw:0,command:{x:0,z:0,run:false,crouch:false,jump:false,fire:false,reload:false}})),20);});const code=await new Promise<number>((resolve,reject)=>{socket!.once('error',reject);socket!.once('close',resolve);});expect(code).toBe(1006);await new Promise(r=>setTimeout(r,80));expect(instance.authority.snapshot().players).toHaveLength(0);}
  finally{if(commands)clearInterval(commands);socket?.terminate();await instance.close();}
},10000);
it('mantém dois clientes no mesmo ciclo por três dias sob transporte degradado',async()=>{
  const authority=new CombatAuthority();authority.enemies.spawn=()=>false;const instance=createMovementServer(authority.world,0,authority,5000,{latencyMs:3,jitterMs:2,dropEvery:11,duplicateEvery:7,reorderEvery:5},'127.0.0.1',7000,{pulseMs:2,stepsPerPulse:30});const sockets:WebSocket[]=[];
  try{await new Promise<void>(resolve=>instance.server.once('listening',resolve));const address=instance.server.address();if(!address||typeof address==='string')throw Error('Endereço inválido');
    const connect=()=>{const socket=new WebSocket(`ws://127.0.0.1:${address.port}`);sockets.push(socket);const frames=new Map<number,ReturnType<CombatAuthority['snapshot']>>();socket.on('message',raw=>{const packet=JSON.parse(raw.toString());if(packet.type==='snapshot'){frames.set(packet.tick,packet);if(frames.size>500)frames.delete(frames.keys().next().value!);}});return frames;};const a=connect(),b=connect(),end=Date.now()+10000;let common:ReturnType<CombatAuthority['snapshot']>|undefined;
    while(Date.now()<end&&!common){for(const [tick,left] of a){const right=b.get(tick);if(right&&left.day>=4){expect(left).toEqual(right);common=left;break;}}if(!common)await new Promise(r=>setTimeout(r,10));}
    expect(common).toMatchObject({day:4,phase:'day'});expect(common!.players).toHaveLength(2);expect(new Set(common!.players.map(p=>p.id)).size).toBe(2);
  }finally{for(const socket of sockets)socket.terminate();await instance.close();}
},15000);
it('mantém hordas reais sincronizadas até o terceiro dia sob transporte degradado',async()=>{
  const authority=new CombatAuthority(),update=authority.enemies.update.bind(authority.enemies);authority.enemies.update=(dt,players,onAttack)=>{for(const player of Array.isArray(players)?players:[players])player.health.immunity=Infinity;update(dt,players,onAttack);};
  const instance=createMovementServer(authority.world,0,authority,5000,{latencyMs:3,jitterMs:2,dropEvery:13,duplicateEvery:9,reorderEvery:7},'127.0.0.1',7000,{pulseMs:2,stepsPerPulse:30});const sockets:WebSocket[]=[];
  try{await new Promise<void>(resolve=>instance.server.once('listening',resolve));const address=instance.server.address();if(!address||typeof address==='string')throw Error('Endereço inválido');
    const connect=()=>{const socket=new WebSocket(`ws://127.0.0.1:${address.port}`);sockets.push(socket);const state={frames:new Map<number,ReturnType<CombatAuthority['snapshot']>>(),maxEnemies:0};socket.on('message',raw=>{const packet=JSON.parse(raw.toString());if(packet.type==='snapshot'){state.frames.set(packet.tick,packet);state.maxEnemies=Math.max(state.maxEnemies,packet.enemies.length);if(state.frames.size>500)state.frames.delete(state.frames.keys().next().value!);}});return state;};const a=connect(),b=connect(),end=Date.now()+20000;let common:ReturnType<CombatAuthority['snapshot']>|undefined;
    while(Date.now()<end&&!common){for(const [tick,left] of a.frames){const right=b.frames.get(tick);if(right&&left.day>=3){expect(left).toEqual(right);common=left;break;}}if(!common)await new Promise(r=>setTimeout(r,10));}
    expect(a.maxEnemies).toBeGreaterThanOrEqual(5);expect(b.maxEnemies).toBeGreaterThanOrEqual(5);expect(common).toMatchObject({day:3,phase:'day',enemies:[]});expect(common!.players.every(player=>player.health===100)).toBe(true);
  }finally{for(const socket of sockets)socket.terminate();await instance.close();}
},30000);
it('não duplica dano ou recompensa de eliminação no transporte degradado',async()=>{
  const authority=new CombatAuthority(),instance=createMovementServer(authority.world,0,authority,5000,{latencyMs:15,jitterMs:8,duplicateEvery:2,reorderEvery:3});const sockets:WebSocket[]=[];
  try{await new Promise<void>(resolve=>instance.server.once('listening',resolve));const address=instance.server.address();if(!address||typeof address==='string')throw Error('Endereço inválido');
    const connect=()=>{const socket=new WebSocket(`ws://127.0.0.1:${address.port}`);sockets.push(socket);const state={id:'',frames:new Map<number,ReturnType<CombatAuthority['snapshot']>>()};socket.on('message',raw=>{const packet=JSON.parse(raw.toString());if(packet.type==='welcome')state.id=packet.id;if(packet.type==='snapshot'){state.frames.set(packet.tick,packet);if(state.frames.size>100)state.frames.delete(state.frames.keys().next().value!);}});return {socket,state};},a=connect(),b=connect(),until=async(predicate:()=>boolean)=>{const end=Date.now()+5000;while(!predicate()){if(Date.now()>end)throw Error('Tempo esgotado no combate degradado');await new Promise(r=>setTimeout(r,10));}};
    await until(()=>!!a.state.id&&!!b.state.id&&authority.snapshot().players.length===2);authority.enemies.spawn(1,new Vector3(0,0,10));const enemy=authority.enemies.active[0];enemy.avatar.root.position.set(.85,0,0);enemy.speed=0;
    const fire=(sequence:number)=>a.socket.send(JSON.stringify({version:1,sequence,yaw:0,pitch:0,command:{x:0,z:0,run:false,crouch:false,jump:false,fire:true,reload:false}}));fire(0);await until(()=>authority.snapshot().players.find(player=>player.id===a.state.id)?.ammo===7);expect(enemy.health).toBe(22);const firstShotTick=authority.tick;await until(()=>authority.tick>=firstShotTick+16);fire(1);await until(()=>authority.snapshot().players.find(player=>player.id===a.state.id)?.ammo===6);expect(authority.snapshot().players.find(player=>player.id===a.state.id)?.money).toBe(20);
    let common:ReturnType<CombatAuthority['snapshot']>|undefined;await until(()=>{for(const [tick,left] of a.state.frames){const right=b.state.frames.get(tick);if(right&&left.players.some(player=>player.id===a.state.id&&player.money===20)){expect(left).toEqual(right);common=left;return true;}}return false;});
    expect(common!.enemies).toHaveLength(0);expect(common!.players.find(player=>player.id===a.state.id)).toMatchObject({ammo:6,kills:1,money:20});expect(common!.players.find(player=>player.id===b.state.id)).toMatchObject({ammo:8,kills:0,money:0});expect(common!.shots.filter(shot=>shot.hit)).toHaveLength(2);
  }finally{for(const socket of sockets)socket.terminate();await instance.close();}
},10000);
it('sincroniza dano e morte de um jogador sem encerrar a partida do sobrevivente',async()=>{
  const authority=new CombatAuthority(),instance=createMovementServer(authority.world,0,authority,5000,{latencyMs:8,jitterMs:5,dropEvery:13,duplicateEvery:7,reorderEvery:5},'127.0.0.1',7000,{pulseMs:3,stepsPerPulse:5});const sockets:WebSocket[]=[];
  try{await new Promise<void>(resolve=>instance.server.once('listening',resolve));const address=instance.server.address();if(!address||typeof address==='string')throw Error('Endereço inválido');
    const connect=()=>{const socket=new WebSocket(`ws://127.0.0.1:${address.port}`);sockets.push(socket);const state={id:'',frames:new Map<number,ReturnType<CombatAuthority['snapshot']>>()};socket.on('message',raw=>{const packet=JSON.parse(raw.toString());if(packet.type==='welcome')state.id=packet.id;if(packet.type==='snapshot'){state.frames.set(packet.tick,packet);if(state.frames.size>200)state.frames.delete(state.frames.keys().next().value!);}});return state;},a=connect(),b=connect(),end=Date.now()+10000;
    while(Date.now()<end&&(!a.id||!b.id||authority.snapshot().players.length<2))await new Promise(r=>setTimeout(r,10));expect(a.id).not.toBe('');expect(b.id).not.toBe('');const target=authority.snapshot().players.find(player=>player.id===a.id)!;authority.enemies.spawn(1,new Vector3().copy(target.position));const enemy=authority.enemies.active[0];enemy.avatar.root.position.copy(target.position).add(new Vector3(0,0,-1));enemy.speed=0;enemy.cooldown=0;
    let common:ReturnType<CombatAuthority['snapshot']>|undefined;while(Date.now()<end&&!common){for(const [tick,left] of a.frames){const right=b.frames.get(tick),fallen=left.players.find(player=>player.id===a.id);if(right&&fallen?.health===0&&left.enemies[0]?.targetId===b.id){expect(left).toEqual(right);common=left;break;}}if(!common)await new Promise(r=>setTimeout(r,10));}
    expect(common?.gameOver).toBe(false);expect(common!.players.find(player=>player.id===a.id)?.health).toBe(0);expect(common!.players.find(player=>player.id===b.id)!.health).toBeGreaterThan(0);expect(common!.enemies).toHaveLength(1);expect(common!.enemies[0].targetId).toBe(b.id);
  }finally{for(const socket of sockets)socket.terminate();await instance.close();}
},15000);
it('sincroniza derrota coletiva e congela o estado da partida',async()=>{
  const authority=new CombatAuthority(),instance=createMovementServer(authority.world,0,authority,5000,{latencyMs:8,jitterMs:5,dropEvery:13,duplicateEvery:7,reorderEvery:5},'127.0.0.1',7000,{pulseMs:3,stepsPerPulse:5});const sockets:WebSocket[]=[];
  try{await new Promise<void>(resolve=>instance.server.once('listening',resolve));const address=instance.server.address();if(!address||typeof address==='string')throw Error('Endereço inválido');
    const connect=()=>{const socket=new WebSocket(`ws://127.0.0.1:${address.port}`);sockets.push(socket);const frames=new Map<number,ReturnType<CombatAuthority['snapshot']>>();socket.on('message',raw=>{const packet=JSON.parse(raw.toString());if(packet.type==='snapshot'){frames.set(packet.tick,packet);if(frames.size>300)frames.delete(frames.keys().next().value!);}});return frames;},a=connect(),b=connect(),end=Date.now()+15000;
    while(Date.now()<end&&authority.snapshot().players.length<2)await new Promise(r=>setTimeout(r,10));expect(authority.snapshot().players).toHaveLength(2);authority.enemies.spawn(1,new Vector3(1,0,10));const enemy=authority.enemies.active[0];enemy.avatar.root.position.set(1,0,10);enemy.speed=0;enemy.cooldown=0;
    let ended:ReturnType<CombatAuthority['snapshot']>|undefined;while(Date.now()<end&&!ended){for(const [tick,left] of a){const right=b.get(tick);if(right&&left.gameOver){expect(left).toEqual(right);ended=left;break;}}if(!ended)await new Promise(r=>setTimeout(r,10));}expect(ended!.players.every(player=>player.health===0)).toBe(true);const frozenRemaining=ended!.remaining,frozenEnemies=ended!.enemies,afterTick=ended!.tick+60;
    let later:ReturnType<CombatAuthority['snapshot']>|undefined;while(Date.now()<end&&!later){for(const [tick,left] of a){const right=b.get(tick);if(right&&tick>=afterTick){expect(left).toEqual(right);later=left;break;}}if(!later)await new Promise(r=>setTimeout(r,10));}expect(later).toMatchObject({gameOver:true,remaining:frozenRemaining,enemies:frozenEnemies});
    const identities=ended!.players.map(player=>player.id),round=ended!.round;let restarted:ReturnType<CombatAuthority['snapshot']>|undefined;while(Date.now()<end&&!restarted){sockets[0].send(JSON.stringify({type:'restart'}));await new Promise(r=>setTimeout(r,20));for(const [tick,left] of a){const right=b.get(tick);if(right&&!left.gameOver&&tick>later!.tick){expect(left).toEqual(right);restarted=left;break;}}}expect(restarted).toMatchObject({round:round+1,day:1,phase:'day',gameOver:false,enemies:[],shots:[],players:[{health:100,ammo:8,reserve:48,kills:0,money:0},{health:100,ammo:8,reserve:48,kills:0,money:0}]});expect(restarted!.players.map(player=>player.id)).toEqual(identities);
  }finally{for(const socket of sockets)socket.terminate();await instance.close();}
},20000);
it('sincroniza inimigos perseguindo jogadores diferentes',async()=>{
  const authority=new CombatAuthority(),instance=createMovementServer(authority.world,0,authority,5000,{latencyMs:8,jitterMs:5,dropEvery:13,duplicateEvery:7,reorderEvery:5},'127.0.0.1',7000,{pulseMs:3,stepsPerPulse:2});const sockets:WebSocket[]=[];
  try{await new Promise<void>(resolve=>instance.server.once('listening',resolve));const address=instance.server.address();if(!address||typeof address==='string')throw Error('Endereço inválido');
    const connect=()=>{const socket=new WebSocket(`ws://127.0.0.1:${address.port}`);sockets.push(socket);const frames=new Map<number,ReturnType<CombatAuthority['snapshot']>>();socket.on('message',raw=>{const packet=JSON.parse(raw.toString());if(packet.type==='snapshot')frames.set(packet.tick,packet);});return frames;},a=connect(),b=connect(),end=Date.now()+10000;
    while(Date.now()<end&&authority.snapshot().players.length<2)await new Promise(r=>setTimeout(r,10));expect(authority.snapshot().players).toHaveLength(2);authority.enemies.spawn(1,new Vector3(0,0,10));authority.enemies.spawn(1,new Vector3(2,0,10));authority.enemies.active[0].avatar.root.position.set(0,0,7);authority.enemies.active[1].avatar.root.position.set(2,0,7);for(const enemy of authority.enemies.active)enemy.speed=0;
    let common:ReturnType<CombatAuthority['snapshot']>|undefined;while(Date.now()<end&&!common){for(const [tick,left] of a){const right=b.get(tick),targets=new Set(left.enemies.map(enemy=>enemy.targetId));if(right&&left.enemies.length===2&&targets.size===2&&!targets.has(null)){expect(left).toEqual(right);common=left;break;}}if(!common)await new Promise(r=>setTimeout(r,10));}
    expect(new Set(common!.enemies.map(enemy=>enemy.targetId))).toEqual(new Set(common!.players.map(player=>player.id)));expect(common!.enemies.every(enemy=>enemy.state==='CHASE')).toBe(true);
  }finally{for(const socket of sockets)socket.terminate();await instance.close();}
},15000);
it('sincroniza troca de alvo durante desconexão e reconexão',async()=>{
  const authority=new CombatAuthority(),instance=createMovementServer(authority.world,0,authority,1000,{latencyMs:8,jitterMs:5,dropEvery:13,duplicateEvery:7,reorderEvery:5},'127.0.0.1',7000,{pulseMs:3,stepsPerPulse:2});const sockets:WebSocket[]=[];
  try{await new Promise<void>(resolve=>instance.server.once('listening',resolve));const address=instance.server.address();if(!address||typeof address==='string')throw Error('Endereço inválido');const end=Date.now()+12000,until=async(predicate:()=>boolean)=>{while(!predicate()){if(Date.now()>end)throw Error('Tempo esgotado na troca de alvo');await new Promise(r=>setTimeout(r,10));}};
    const connect=(resume='')=>{const socket=new WebSocket(`ws://127.0.0.1:${address.port}${resume?`?resume=${resume}`:''}`);sockets.push(socket);const state={id:'',token:'',frames:new Map<number,ReturnType<CombatAuthority['snapshot']>>()};socket.on('message',raw=>{const packet=JSON.parse(raw.toString());if(packet.type==='welcome'){state.id=packet.id;state.token=packet.token;}if(packet.type==='snapshot')state.frames.set(packet.tick,packet);});return {socket,state};},a=connect(),b=connect();await until(()=>!!a.state.id&&!!b.state.id&&authority.snapshot().players.length===2);
    authority.enemies.spawn(1,new Vector3(0,0,10));const enemy=authority.enemies.active[0];enemy.avatar.root.position.set(0,0,7);enemy.speed=0;await until(()=>authority.snapshot().enemies[0]?.targetId===a.state.id);a.socket.close();await until(()=>authority.snapshot().players.find(player=>player.id===a.state.id)?.connected===false&&authority.snapshot().enemies[0]?.targetId===b.state.id);
    const suspendedTick=authority.tick,suspended=await (async()=>{let state:ReturnType<CombatAuthority['snapshot']>|undefined;await until(()=>{for(const [tick,frame] of b.state.frames)if(tick>=suspendedTick&&frame.enemies[0]?.targetId===b.state.id){state=frame;return true;}return false;});return state!;})();expect(suspended.players.find(player=>player.id===a.state.id)?.connected).toBe(false);
    const resumed=connect(a.state.token);await until(()=>resumed.state.id===a.state.id&&authority.snapshot().enemies[0]?.targetId===a.state.id);let common:ReturnType<CombatAuthority['snapshot']>|undefined;await until(()=>{for(const [tick,left] of b.state.frames){const right=resumed.state.frames.get(tick);if(right&&left.enemies[0]?.targetId===a.state.id&&left.players.find(player=>player.id===a.state.id)?.connected){expect(left).toEqual(right);common=left;return true;}}return false;});expect(common!.players).toHaveLength(2);
  }finally{for(const socket of sockets)socket.terminate();await instance.close();}
},15000);
it('entrega o mesmo disparo remoto aos dois clientes',async()=>{
  const authority=new CombatAuthority(),instance=createMovementServer(authority.world,0,authority,5000,{latencyMs:8,jitterMs:5,dropEvery:13,duplicateEvery:7,reorderEvery:5},'127.0.0.1',7000,{pulseMs:3,stepsPerPulse:2});const sockets:WebSocket[]=[];
  try{await new Promise<void>(resolve=>instance.server.once('listening',resolve));const address=instance.server.address();if(!address||typeof address==='string')throw Error('Endereço inválido');const end=Date.now()+10000;
    const connect=()=>{const socket=new WebSocket(`ws://127.0.0.1:${address.port}`);sockets.push(socket);const state={id:'',frames:new Map<number,ReturnType<CombatAuthority['snapshot']>>()};socket.on('message',raw=>{const packet=JSON.parse(raw.toString());if(packet.type==='welcome')state.id=packet.id;if(packet.type==='snapshot')state.frames.set(packet.tick,packet);});return {socket,state};},a=connect(),b=connect();while(Date.now()<end&&(!a.state.id||!b.state.id||authority.snapshot().players.length<2))await new Promise(r=>setTimeout(r,10));
    a.socket.send(JSON.stringify({version:1,sequence:0,yaw:0,pitch:0,command:{x:0,z:0,run:false,crouch:false,jump:false,fire:true,reload:false}}));let common:ReturnType<CombatAuthority['snapshot']>|undefined;while(Date.now()<end&&!common){for(const [tick,left] of a.state.frames){const right=b.state.frames.get(tick),shot=left.shots.at(-1);if(right&&shot?.player===a.state.id){expect(left).toEqual(right);common=left;break;}}if(!common)await new Promise(r=>setTimeout(r,10));}
    const shot=common!.shots.at(-1)!;expect(shot).toMatchObject({serial:1,player:a.state.id,hit:false,rewindTicks:0});expect(Number.isFinite(shot.from.x)&&Number.isFinite(shot.to.z)).toBe(true);expect(common!.players.find(player=>player.id===a.state.id)?.ammo).toBe(7);expect(common!.players.find(player=>player.id===b.state.id)?.ammo).toBe(8);
  }finally{for(const socket of sockets)socket.terminate();await instance.close();}
},15000);
it('sincroniza corrida e salto do outro jogador',async()=>{
  const authority=new CombatAuthority(),instance=createMovementServer(authority.world,0,authority,5000,{latencyMs:8,jitterMs:5,dropEvery:13,duplicateEvery:7,reorderEvery:5},'127.0.0.1',7000,{pulseMs:3,stepsPerPulse:1});const sockets:WebSocket[]=[];let resend:ReturnType<typeof setInterval>|undefined;
  try{await new Promise<void>(resolve=>instance.server.once('listening',resolve));const address=instance.server.address();if(!address||typeof address==='string')throw Error('Endereço inválido');const end=Date.now()+10000;
    const connect=()=>{const socket=new WebSocket(`ws://127.0.0.1:${address.port}`);sockets.push(socket);const state={id:'',frames:new Map<number,ReturnType<CombatAuthority['snapshot']>>()};socket.on('message',raw=>{const packet=JSON.parse(raw.toString());if(packet.type==='welcome')state.id=packet.id;if(packet.type==='snapshot')state.frames.set(packet.tick,packet);});return {socket,state};},a=connect(),b=connect();while(Date.now()<end&&(!a.state.id||!b.state.id||authority.snapshot().players.length<2))await new Promise(r=>setTimeout(r,10));
    let sequence=0;const send=()=>a.socket.send(JSON.stringify({version:1,sequence:sequence++,yaw:0,pitch:0,command:{x:0,z:1,run:true,crouch:false,jump:true,fire:false,reload:false}}));send();resend=setInterval(send,40);let common:ReturnType<CombatAuthority['snapshot']>|undefined;while(Date.now()<end&&!common){for(const [tick,left] of a.state.frames){const right=b.state.frames.get(tick),runner=left.players.find(player=>player.id===a.state.id);if(right&&runner&&runner.position.y>0&&Math.hypot(runner.velocity.x,runner.velocity.z)>5){expect(left).toEqual(right);common=left;break;}}if(!common)await new Promise(r=>setTimeout(r,10));}clearInterval(resend);resend=undefined;
    const runner=common!.players.find(player=>player.id===a.state.id)!,observer=common!.players.find(player=>player.id===b.state.id)!;expect(runner.position.y).toBeGreaterThan(0);expect(runner.vertical).toBeGreaterThan(0);expect(Math.hypot(runner.velocity.x,runner.velocity.z)).toBeGreaterThan(5);expect(observer.position).toMatchObject({x:2,y:0,z:10});expect(observer.vertical).toBe(0);
  }finally{if(resend)clearInterval(resend);for(const socket of sockets)socket.terminate();await instance.close();}
},15000);
