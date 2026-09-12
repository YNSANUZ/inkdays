import {describe,expect,it} from 'vitest';
import {ChatOutbox,normalizeChatText} from '../src/network/Chat';
import {CombatAuthority} from '../src/network/CombatAuthority';

describe('chat multiplayer',()=>{
  it('normaliza, limita e rejeita mensagens vazias',()=>{expect(normalizeChatText('  cuidado!\n vem  ')).toBe('cuidado! vem');expect([...normalizeChatText('a'.repeat(120))!]).toHaveLength(100);expect(normalizeChatText('\n\t')).toBeNull();});
  it('repete a mensagem até o acknowledgement',()=>{const outbox=new ChatOutbox(400);expect(outbox.submit(' tô indo ')).toEqual({messageId:0,text:'tô indo'});expect(outbox.packet(0)).toMatchObject({type:'chat',messageId:0});expect(outbox.packet(399)).toBeNull();expect(outbox.packet(400)).toMatchObject({messageId:0});outbox.observe(0);expect(outbox.pending).toBe(0);expect(outbox.packet(800)).toBeNull();});
  it('deduplica e limita a frequência no servidor',()=>{const authority=new CombatAuthority();authority.join('a');authority.rename('a','Lucas');expect(authority.chat('a',0,' cuidado! ')).toBe(true);expect(authority.chat('a',0,'duplicada')).toBe(true);expect(authority.chat('a',1,'cedo')).toBe(false);expect(authority.snapshot().messages).toEqual([{serial:1,messageId:0,player:'a',name:'Lucas',text:'cuidado!',tick:0}]);for(let tick=0;tick<30;tick++)authority.step();expect(authority.chat('a',1,'vem pro moinho')).toBe(true);expect(authority.snapshot().players[0].chatAcknowledged).toBe(1);});
  it('remove a mensagem da apresentação depois de doze segundos autoritativos',()=>{const authority=new CombatAuthority();authority.join('a');authority.chat('a',0,'agora');for(let tick=0;tick<720;tick++)authority.step();expect(authority.snapshot().messages).toHaveLength(1);authority.step();expect(authority.snapshot().messages).toHaveLength(0);expect(authority.snapshot().players[0].chatAcknowledged).toBe(0);});
});
