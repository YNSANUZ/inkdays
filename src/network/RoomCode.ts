export const PUBLIC_ROOM_CODE='PAPEL';
const ROOM_ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function normalizeRoomCode(value:unknown){
  if(typeof value!=='string')return PUBLIC_ROOM_CODE;
  const code=value.trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);
  return code.length>=4?code:PUBLIC_ROOM_CODE;
}

export function publicRoomInvite(current:string,room=PUBLIC_ROOM_CODE){
  const url=new URL(current);url.searchParams.set('coop','1');url.searchParams.set('room',normalizeRoomCode(room));url.searchParams.delete('server');return url.href;
}

type InviteNavigator={share?:(data:{title:string;text:string;url:string})=>Promise<void>;clipboard?:{writeText:(text:string)=>Promise<void>}};
export async function shareRoomInvite(invite:string,navigator:InviteNavigator){
  if(navigator.share)try{await navigator.share({title:'INKDAYS',text:'Entre na minha sala de INKDAYS.',url:invite});return 'shared' as const;}catch(error){if(error instanceof DOMException&&error.name==='AbortError')return 'cancelled' as const;}
  if(navigator.clipboard)try{await navigator.clipboard.writeText(invite);return 'copied' as const;}catch{/* A interface informa que o navegador bloqueou a cópia. */}
  return 'failed' as const;
}

export function roomCodeFromValues(values:Iterable<number>){
  return Array.from(values,value=>ROOM_ALPHABET[Math.abs(Math.trunc(value))%ROOM_ALPHABET.length]).slice(0,6).join('').padEnd(6,'A');
}

export function createRoomCode(){
  const values=new Uint32Array(6);crypto.getRandomValues(values);return roomCodeFromValues(values);
}
