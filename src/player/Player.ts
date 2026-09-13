import * as T from 'three';
import type { Command } from '../input/Input';
import { Avatar } from './Avatar';
import type { World } from '../world/World';
import { Health } from '../health/Health';
import { movePlayer } from '../simulation/Movement';
export class Player {
  avatar=new Avatar(); health=new Health(); velocity=new T.Vector3(); vertical=0; time=0;
  get position() {return this.avatar.root.position;}
  constructor() {this.position.set(0,0,10);}
  update(dt:number,c:Command,yaw:number,world:World) {
    this.time+=dt;this.health.update(dt);
    movePlayer(this,c,yaw,world,dt);
    this.avatar.root.rotation.y=yaw+Math.PI;
    this.avatar.animate(this.time,this.velocity.length(),c.crouch,false,this.velocity);
  }
}
