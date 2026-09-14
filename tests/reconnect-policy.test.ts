import {describe,expect,it} from 'vitest';
import {reconnectDelay,shouldReconnect} from '../src/network/ReconnectPolicy';

describe('retomada da conexão',()=>{
  it('aumenta a espera sem ultrapassar oito segundos',()=>{expect([1,2,3,9].map(reconnectDelay)).toEqual([1000,1500,2250,8000]);});
  it('não insiste offline, ao sair, em sala cheia ou após transferência',()=>{expect(shouldReconnect(true,false,false,false)).toBe(true);expect(shouldReconnect(false,false,false,false)).toBe(false);expect(shouldReconnect(true,true,false,false)).toBe(false);expect(shouldReconnect(true,false,true,false)).toBe(false);expect(shouldReconnect(true,false,false,true)).toBe(false);});
});
