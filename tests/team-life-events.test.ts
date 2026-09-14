import {describe,expect,it} from 'vitest';
import {TeamLifeEvents} from '../src/network/TeamLifeEvents';

describe('eventos de vida da equipe',()=>{
  it('avisa queda e retorno remotos uma única vez',()=>{const events=new TeamLifeEvents(),players=[{id:'a',name:'Ana',health:100},{id:'b',name:'Bia',health:100}];expect(events.observe(players,'a')).toEqual([]);players[1].health=0;expect(events.observe(players,'a')).toEqual([{kind:'down',id:'b',name:'Bia'}]);expect(events.observe(players,'a')).toEqual([]);players[1].health=100;expect(events.observe(players,'a')).toEqual([{kind:'revived',id:'b',name:'Bia'}]);});
  it('não anuncia o primeiro snapshot, o jogador local ou estado após reset',()=>{const events=new TeamLifeEvents(),players=[{id:'a',name:'Ana',health:0},{id:'b',name:'Bia',health:0}];expect(events.observe(players,'a')).toEqual([]);events.reset();players[1].health=100;expect(events.observe(players,'a')).toEqual([]);});
});
