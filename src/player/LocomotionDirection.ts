import type { MoveDirection } from './RiggedAvatar';

export function movementDirection(yaw:number,velocity:{x:number;z:number},speed=Math.hypot(velocity.x,velocity.z)):MoveDirection {
  if(speed<=.2)return 'forward';
  const forward=velocity.x*Math.sin(yaw)+velocity.z*Math.cos(yaw),right=-velocity.x*Math.cos(yaw)+velocity.z*Math.sin(yaw);
  return Math.abs(forward)>=Math.abs(right)?forward>=0?'forward':'backward':right>=0?'right':'left';
}
