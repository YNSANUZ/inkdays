import {describe,expect,it} from 'vitest';
import {normalizeRoomCode,PUBLIC_ROOM_CODE,publicRoomInvite} from '../src/network/RoomCode';

describe('convite da sala pública',()=>{
  it('normaliza códigos compartilháveis e rejeita códigos curtos',()=>{expect(normalizeRoomCode(' tinta-42 ')).toBe('TINTA42');expect(normalizeRoomCode('x')).toBe(PUBLIC_ROOM_CODE);expect(normalizeRoomCode(null)).toBe(PUBLIC_ROOM_CODE);});
  it('inclui o código estável e remove servidor técnico',()=>{const invite=new URL(publicRoomInvite('https://ynsanuz.github.io/inkdays/?coop=1&server=wss%3A%2F%2Flocal'));expect(invite.searchParams.get('coop')).toBe('1');expect(invite.searchParams.get('room')).toBe(PUBLIC_ROOM_CODE);expect(invite.searchParams.has('server')).toBe(false);});
  it('preserva uma sala privada válida no convite',()=>{expect(new URL(publicRoomInvite('https://ynsanuz.github.io/inkdays/','noite7')).searchParams.get('room')).toBe('NOITE7');});
});
