import WebSocket from 'ws';
import {SnapshotReceiver} from '../src/network/SnapshotReceiver';
import type {CombatSnapshot} from '../src/network/CombatAuthority';

const endpoint=process.env.INKDAYS_SERVER??'wss://inkdays-multiplayer.onrender.com';
const room=`R${Date.now().toString(36).slice(-5).toUpperCase()}`;
const delay=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const until=async<T>(predicate:()=>T,label:string,timeout=90000)=>{const end=Date.now()+timeout;while(Date.now()<end){const value=predicate();if(value)return value;await delay(50);}throw new Error(`timeout: ${label}`);};
type Welcome={id:string;token:string;room:string;resumed:boolean};
const clients:WebSocket[]=[];
function connect(resume=''){
  const url=new URL(endpoint);url.searchParams.set('lobby','1');url.searchParams.set('room',room);if(resume)url.searchParams.set('resume',resume);
  const socket=new WebSocket(url),receiver=new SnapshotReceiver(),state:{welcome:Welcome|null;snapshots:CombatSnapshot[];last:CombatSnapshot|null}={welcome:null,snapshots:[],last:null};clients.push(socket);
  socket.on('message',raw=>{const packet=JSON.parse(raw.toString());if(packet.type==='welcome'){receiver.reset();state.welcome=packet;}const snapshot=receiver.receive(packet);if(snapshot){state.last=snapshot;state.snapshots.push(snapshot);if(state.snapshots.length>400)state.snapshots.shift();}});
  return {socket,state};
}
const send=(client:ReturnType<typeof connect>,value:unknown)=>client.socket.send(JSON.stringify(value));
try{
  const a=connect(),b=connect();await until(()=>a.state.welcome&&b.state.welcome,'welcomes');send(a,{type:'name',name:'Bruno'});send(b,{type:'name',name:'Mari'});send(a,{type:'ready'});send(b,{type:'ready'});
  await until(()=>a.state.last?.players?.length===2&&a.state.last.players.every(p=>p.ready&&p.connected),'both ready');const original=a.state.welcome!;const before=a.state.last!.players.find(p=>p.id===original.id);a.socket.close();
  await until(()=>b.state.last?.players?.find(p=>p.id===original.id)?.connected===false,'peer observes disconnect',15000);const resumed=connect(original.token);await until(()=>resumed.state.welcome,'resumed welcome');await until(()=>b.state.last?.players?.find(p=>p.id===original.id)?.connected===true,'peer observes resume',15000);
  const common=await until(()=>{for(const left of b.state.snapshots){const right=resumed.state.snapshots.find(item=>item.tick===left.tick);if(right&&left.players.length===2&&right.players.length===2)return {left,right};}},'common authoritative snapshot',15000);const after=common.right.players.find(p=>p.id===original.id);
  const result={room,originalId:original.id,resumedId:resumed.state.welcome!.id,resumed:resumed.state.welcome!.resumed,reportedRoom:resumed.state.welcome!.room,players:common.right.players.length,uniquePlayers:new Set(common.right.players.map(p=>p.id)).size,sameSnapshot:JSON.stringify(common.left)===JSON.stringify(common.right),statePreserved:{name:after?.name===before?.name,ready:after?.ready===before?.ready,health:after?.health===before?.health,ammo:after?.ammo===before?.ammo,money:after?.money===before?.money},tick:common.right.tick};console.log(JSON.stringify(result,null,2));if(result.resumedId!==result.originalId||!result.resumed||result.reportedRoom!==room||result.players!==2||result.uniquePlayers!==2||!result.sameSnapshot||Object.values(result.statePreserved).some(value=>!value))process.exitCode=1;
}finally{for(const socket of clients)socket.terminate();}
