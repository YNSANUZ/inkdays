import {describe,expect,it} from 'vitest';
import {CounterIncrease} from '../src/network/CounterIncrease';

describe('aumento de contador autoritativo',()=>{
  it('ignora a referência inicial e informa apenas aumentos',()=>{const counter=new CounterIncrease();expect(counter.observe(40)).toBe(0);expect(counter.observe(60)).toBe(20);expect(counter.observe(60)).toBe(0);expect(counter.observe(0)).toBe(0);expect(counter.observe(20)).toBe(20);});
  it('não repete valor antigo após reconexão',()=>{const counter=new CounterIncrease();counter.observe(20);counter.reset();expect(counter.observe(80)).toBe(0);expect(counter.observe(Number.NaN)).toBe(0);});
});
