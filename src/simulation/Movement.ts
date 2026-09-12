import { C } from '../config/gameplay';
import type { Command } from '../input/Input';
export interface Point { x:number; y:number; z:number }
export interface Motion { position:Point; velocity:Point; vertical:number }
export interface CollisionWorld { move(position:Point,dx:number,dz:number,radius:number):void }
/** Shared fixed-step movement: no renderer, DOM or client-controlled delta time. */
export function movePlayer(state:Motion,c:Command,yaw:number,world:CollisionWorld,dt=C.fixedStep){
  let x=c.x,z=-c.z;
  const length=Math.hypot(x,z);if(length>1){x/=length;z/=length;}
  const speed=c.crouch?C.player.crouchSpeed:c.run?C.player.runSpeed:C.player.speed;
  const targetX=(x*Math.cos(yaw)+z*Math.sin(yaw))*speed;
  const targetZ=(-x*Math.sin(yaw)+z*Math.cos(yaw))*speed;
  const blend=1-Math.exp(-C.player.acceleration*dt);
  state.velocity.x+=(targetX-state.velocity.x)*blend;
  state.velocity.z+=(targetZ-state.velocity.z)*blend;
  world.move(state.position,state.velocity.x*dt,state.velocity.z*dt,C.player.radius);
  if(c.jump&&state.position.y<=.001&&!c.crouch)state.vertical=C.player.jump;
  state.vertical-=C.player.gravity*dt;
  state.position.y=Math.max(0,state.position.y+state.vertical*dt);
  if(state.position.y===0)state.vertical=0;
}
