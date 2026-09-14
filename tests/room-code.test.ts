import {describe,expect,it} from 'vitest';
import {PUBLIC_ROOM_CODE,publicRoomInvite} from '../src/network/RoomCode';

describe('convite da sala pública',()=>{
  it('inclui o código estável e remove servidor técnico',()=>{const invite=new URL(publicRoomInvite('https://ynsanuz.github.io/inkdays/?coop=1&server=wss%3A%2F%2Flocal'));expect(invite.searchParams.get('coop')).toBe('1');expect(invite.searchParams.get('room')).toBe(PUBLIC_ROOM_CODE);expect(invite.searchParams.has('server')).toBe(false);});
});
