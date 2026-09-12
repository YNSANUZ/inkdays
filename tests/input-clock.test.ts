import {expect,it} from 'vitest';
import {InputClock} from '../src/network/InputClock';
it('descarta tempo offline e limita recuperação após travamento',()=>{
  const clock=new InputClock();for(let i=0;i<600;i++)expect(clock.advance(.1,false)).toBe(0);
  expect(clock.advance(1/60,true)).toBe(1);expect(clock.advance(10,true)).toBe(6);
  expect(clock.advance(1/60,true)).toBe(1);
});
it('preserva cadência em telas com taxas diferentes',()=>{
  for(const fps of [30,60,144]){const clock=new InputClock();let commands=0;for(let i=0;i<fps;i++)commands+=clock.advance(1/fps,true);expect(commands).toBe(60);}
});
