import { CombatAuthority } from '../src/network/CombatAuthority';
import { createMovementServer } from '../src/network/Server';
import { networkInterfaces } from 'node:os';
// Reuse the deterministic map for identical collisions in this local prototype.
const authority=new CombatAuthority();
const badNet=process.argv.includes('--bad-net'),lan=process.argv.includes('--lan'),conditions=badNet?{latencyMs:60,jitterMs:25,dropEvery:23,duplicateEvery:31,reorderEvery:17}:undefined;
const instance=createMovementServer(authority.world,8787,authority,5000,conditions,lan?'0.0.0.0':'127.0.0.1');
instance.server.on('listening',()=>{console.log(`INKDAYS coop local: ws://${lan?'0.0.0.0':'127.0.0.1'}:8787 (2 jogadores, combate autoritativo${badNet?', rede degradada':''})`);if(lan)for(const entries of Object.values(networkInterfaces()))for(const entry of entries??[])if(entry.family==='IPv4'&&!entry.internal)console.log(`Abra nos aparelhos: http://${entry.address}:5180/?coop=1`);});
instance.server.on('error',error=>{console.error(error);void instance.close();});
process.once('SIGINT',()=>{void instance.close();});
