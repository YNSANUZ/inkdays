import {describe,expect,it} from 'vitest';
import {normalizeRoomCode,PUBLIC_ROOM_CODE,publicRoomInvite,roomCodeFromValues,shareRoomInvite} from '../src/network/RoomCode';

describe('convite da sala pública',()=>{
  it('normaliza códigos compartilháveis e rejeita códigos curtos',()=>{expect(normalizeRoomCode(' tinta-42 ')).toBe('TINTA42');expect(normalizeRoomCode('x')).toBe(PUBLIC_ROOM_CODE);expect(normalizeRoomCode(null)).toBe(PUBLIC_ROOM_CODE);});
  it('inclui o código estável e remove servidor técnico',()=>{const invite=new URL(publicRoomInvite('https://ynsanuz.github.io/inkdays/?coop=1&server=wss%3A%2F%2Flocal'));expect(invite.searchParams.get('coop')).toBe('1');expect(invite.searchParams.get('room')).toBe(PUBLIC_ROOM_CODE);expect(invite.searchParams.has('server')).toBe(false);});
  it('preserva uma sala privada válida no convite',()=>{expect(new URL(publicRoomInvite('https://ynsanuz.github.io/inkdays/','noite7')).searchParams.get('room')).toBe('NOITE7');});
  it('gera código legível com seis caracteres',()=>{expect(roomCodeFromValues([0,1,2,3,4,5])).toBe('ABCDEF');expect(roomCodeFromValues([31,32,33])).toBe('9ABAAA');});
  it('abre o compartilhamento nativo quando disponível',async()=>{let payload:{title:string;text:string;url:string}|undefined;const result=await shareRoomInvite('https://example.com/?room=TINTA7',{share:async value=>{payload=value;}});expect(result).toBe('shared');expect(payload).toEqual({title:'INKDAYS',text:'Entre na minha sala de INKDAYS.',url:'https://example.com/?room=TINTA7'});});
  it('copia o convite quando o compartilhamento nativo falha',async()=>{let copied='';const result=await shareRoomInvite('https://example.com/?room=TINTA7',{share:async()=>{throw Error('indisponível');},clipboard:{writeText:async value=>{copied=value;}}});expect(result).toBe('copied');expect(copied).toContain('room=TINTA7');});
  it('respeita o cancelamento da folha de compartilhamento',async()=>{let copied=false;const result=await shareRoomInvite('https://example.com/',{share:async()=>{throw new DOMException('cancelado','AbortError');},clipboard:{writeText:async()=>{copied=true;}}});expect(result).toBe('cancelled');expect(copied).toBe(false);});
});
