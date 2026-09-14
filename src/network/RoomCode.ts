export const PUBLIC_ROOM_CODE='PAPEL';

export function normalizeRoomCode(value:unknown){
  if(typeof value!=='string')return PUBLIC_ROOM_CODE;
  const code=value.trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);
  return code.length>=4?code:PUBLIC_ROOM_CODE;
}

export function publicRoomInvite(current:string,room=PUBLIC_ROOM_CODE){
  const url=new URL(current);url.searchParams.set('coop','1');url.searchParams.set('room',normalizeRoomCode(room));url.searchParams.delete('server');return url.href;
}
