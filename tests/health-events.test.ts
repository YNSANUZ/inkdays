import {describe,expect,it} from 'vitest';
import {HealthEvents} from '../src/network/HealthEvents';

describe('feedback de vida autoritativa',()=>{
  it('não cria dano no primeiro estado e detecta somente quedas',()=>{const health=new HealthEvents();expect(health.observe(72)).toBe(0);expect(health.observe(58)).toBe(14);expect(health.observe(58)).toBe(0);expect(health.observe(73)).toBe(0);});
  it('reinicia a referência sem piscar após reconexão',()=>{const health=new HealthEvents();health.observe(100);expect(health.observe(86)).toBe(14);health.reset();expect(health.observe(44)).toBe(0);expect(health.observe(30)).toBe(14);});
  it('ignora valores inválidos',()=>{const health=new HealthEvents();expect(health.observe(Number.NaN)).toBe(0);expect(health.observe(100)).toBe(0);});
});
