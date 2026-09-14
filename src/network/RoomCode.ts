export const PUBLIC_ROOM_CODE='PAPEL';

export function publicRoomInvite(current:string){
  const url=new URL(current);url.searchParams.set('coop','1');url.searchParams.set('room',PUBLIC_ROOM_CODE);url.searchParams.delete('server');return url.href;
}
