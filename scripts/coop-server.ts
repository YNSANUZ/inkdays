import { Scene } from 'three';
import { World } from '../src/world/World';
import { createMovementServer } from '../src/network/Server';
// Reuse the deterministic map for identical collisions in this local prototype.
const instance=createMovementServer(new World(new Scene()));
instance.server.on('listening',()=>console.log('INKDAYS coop local: ws://127.0.0.1:8787 (2 jogadores, movimento somente)'));
instance.server.on('error',error=>{console.error(error);void instance.close();});
process.once('SIGINT',()=>{void instance.close();});
