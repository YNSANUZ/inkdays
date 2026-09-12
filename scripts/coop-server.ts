import { CombatAuthority } from '../src/network/CombatAuthority';
import { createMovementServer } from '../src/network/Server';
// Reuse the deterministic map for identical collisions in this local prototype.
const authority=new CombatAuthority();
const instance=createMovementServer(authority.world,8787,authority);
instance.server.on('listening',()=>console.log('INKDAYS coop local: ws://127.0.0.1:8787 (2 jogadores, combate autoritativo)'));
instance.server.on('error',error=>{console.error(error);void instance.close();});
process.once('SIGINT',()=>{void instance.close();});
