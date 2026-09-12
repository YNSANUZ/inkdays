import { CombatAuthority } from '../src/network/CombatAuthority';
import { createMovementServer } from '../src/network/Server';
// Reuse the deterministic map for identical collisions in this local prototype.
const authority=new CombatAuthority();
const badNet=process.argv.includes('--bad-net'),conditions=badNet?{latencyMs:60,jitterMs:25,dropEvery:23,duplicateEvery:31,reorderEvery:17}:undefined;
const instance=createMovementServer(authority.world,8787,authority,5000,conditions);
instance.server.on('listening',()=>console.log(`INKDAYS coop local: ws://127.0.0.1:8787 (2 jogadores, combate autoritativo${badNet?', rede degradada':''})`));
instance.server.on('error',error=>{console.error(error);void instance.close();});
process.once('SIGINT',()=>{void instance.close();});
