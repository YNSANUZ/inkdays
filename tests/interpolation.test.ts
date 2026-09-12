import {describe,it,expect} from 'vitest';
import {InterpolationBuffer} from '../src/network/Interpolation';
describe('interpolação remota',()=>{
  it('absorve jitter e reordenação usando ticks do servidor',()=>{
    const b=new InterpolationBuffer(6);for(const [tick,arrival] of [[3,65],[0,0],[9,170],[6,120],[12,205]])b.push(tick,{x:tick,y:0,z:0},arrival);
    expect(b.sample(205)?.x).toBe(6);expect(b.sample(230)?.x).toBeGreaterThan(6);expect(b.sample(230)?.x).toBeLessThan(9);
  });
  it('não duplica snapshots e não extrapola além do último estado',()=>{const b=new InterpolationBuffer(0);expect(b.push(3,{x:3,y:0,z:0},0)).toBe(true);expect(b.push(3,{x:9,y:0,z:0},0)).toBe(false);expect(b.sample(1000)?.x).toBe(3);});
});
