import {describe,expect,it} from 'vitest';
import {PhaseEvents} from '../src/network/PhaseEvents';

describe('anúncios do ciclo autoritativo',()=>{
  it('anuncia horda e amanhecer uma vez',()=>{const events=new PhaseEvents();expect(events.observe({round:1,day:1,phase:'day'})).toBeNull();expect(events.observe({round:1,day:1,phase:'horde'})).toEqual({kind:'horde',day:1});expect(events.observe({round:1,day:1,phase:'horde'})).toBeNull();expect(events.observe({round:1,day:2,phase:'day'})).toEqual({kind:'dawn',day:2});});
  it('não anuncia conexão, reconexão ou reinício como transição',()=>{const events=new PhaseEvents();events.observe({round:1,day:3,phase:'horde'});events.reset();expect(events.observe({round:1,day:3,phase:'horde'})).toBeNull();expect(events.observe({round:2,day:1,phase:'day'})).toBeNull();});
});
