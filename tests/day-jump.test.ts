import {describe,expect,it} from 'vitest';
import {DayCycle} from '../src/daycycle/DayCycle';
import {C} from '../src/config/gameplay';
describe('salto secreto de dia',()=>{it('reinicia a preparação no dia escolhido e limita entradas inválidas',()=>{const cycle=new DayCycle();cycle.update(12);cycle.jumpTo(20);expect(cycle).toMatchObject({day:20,phase:'day',remaining:C.day.duration,elapsed:0});cycle.jumpTo(-5);expect(cycle.day).toBe(1);cycle.jumpTo(5000);expect(cycle.day).toBe(999);});});
