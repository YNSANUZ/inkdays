import * as T from 'three';
import { C } from '../config/gameplay';
import type { Command } from '../input/Input';
import { Avatar } from './Avatar';
import type { World } from '../world/World';
import { Health } from '../health/Health';
export class Player {
  avatar=new Avatar(); health=new Health(); velocity=new T.Vector3(); vertical=0; time=0;
  get position() {return this.avatar.root.position;}
  constructor() {this.position.set(0,0,10);}
  update(dt:number,c:Command,yaw:number,world:World) {
    this.time+=dt;this.health.update(dt);
    const desired=new T.Vector3(c.x,0,-c.z);if(desired.lengthSq()>1)desired.normalize();desired.applyAxisAngle(new T.Vector3(0,1,0),yaw);
    const speed=c.crouch?C.player.crouchSpeed:c.run?C.player.runSpeed:C.player.speed;desired.multiplyScalar(speed);this.velocity.lerp(desired,1-Math.exp(-C.player.acceleration*dt));
    world.move(this.position,this.velocity.x*dt,this.velocity.z*dt,C.player.radius);
    if(c.jump&&this.position.y<=.001&&!c.crouch)this.vertical=C.player.jump;
    this.vertical-=C.player.gravity*dt;this.position.y=Math.max(0,this.position.y+this.vertical*dt);if(this.position.y===0)this.vertical=0;
    this.avatar.root.rotation.y=yaw+Math.PI;
    this.avatar.animate(this.time,this.velocity.length(),c.crouch);
  }
}
