import type { Command } from '../input/Input';
import { C } from '../config/gameplay';
import type { CameraMode } from '../camera/ThirdPerson';
export const PROTOCOL_VERSION=1;
export interface InputPacket { version:1; sequence:number; yaw:number; pitch?:number;cameraMode?:CameraMode; viewTick?:number; shotId?:number; command:Command }
const actions=['run','crouch','jump','fire','reload'] as const;
/** Reject forged state, nonfinite numbers, invalid actions and unsupported versions. */
export function parseInput(value:unknown):InputPacket|null{
  if(!value||typeof value!=='object')return null;
  const p=value as Record<string,unknown>;
  if(Object.keys(p).some(k=>!['version','sequence','yaw','pitch','cameraMode','viewTick','shotId','command'].includes(k)))return null;
  if(p.cameraMode!==undefined&&p.cameraMode!=='first'&&p.cameraMode!=='third')return null;
  if(p.pitch!==undefined&&(typeof p.pitch!=='number'||!Number.isFinite(p.pitch)||p.pitch<C.camera.minPitch||p.pitch>C.camera.maxPitch))return null;
  if(p.viewTick!==undefined&&(!Number.isSafeInteger(p.viewTick)||(p.viewTick as number)<0))return null;
  if(p.shotId!==undefined&&(!Number.isSafeInteger(p.shotId)||(p.shotId as number)<0))return null;
  if(p.version!==PROTOCOL_VERSION||!Number.isSafeInteger(p.sequence)||(p.sequence as number)<0)return null;
  if(typeof p.yaw!=='number'||!Number.isFinite(p.yaw)||Math.abs(p.yaw)>Math.PI*2)return null;
  if(!p.command||typeof p.command!=='object')return null;
  const c=p.command as Record<string,unknown>;
  if(Object.keys(c).some(k=>!['x','z',...actions].includes(k)))return null;
  for(const key of ['x','z'])if(typeof c[key]!=='number'||!Number.isFinite(c[key])||Math.abs(c[key] as number)>1)return null;
  if(actions.some(k=>typeof c[k]!=='boolean'))return null;
  return {version:1,sequence:p.sequence as number,yaw:p.yaw,pitch:p.pitch as number|undefined,cameraMode:p.cameraMode as CameraMode|undefined,viewTick:p.viewTick as number|undefined,shotId:p.shotId as number|undefined,command:{x:c.x as number,z:c.z as number,run:c.run as boolean,crouch:c.crouch as boolean,jump:c.jump as boolean,fire:c.fire as boolean,reload:c.reload as boolean}};
}
