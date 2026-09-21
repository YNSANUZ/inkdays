import {describe,expect,it} from 'vitest';
import {workshopNearby} from '../src/ui/WorkshopPanel';

describe('workshop proximity',()=>{
  it('abre apenas para jogador vivo perto do baú durante a calmaria',()=>{
    expect(workshopNearby({position:{x:0,z:4},health:100},'day')).toBe(true);
    expect(workshopNearby({position:{x:0,z:4},health:100},'horde')).toBe(false);
    expect(workshopNearby({position:{x:0,z:4},health:0},'day')).toBe(false);
    expect(workshopNearby({position:{x:4,z:4},health:100},'day')).toBe(false);
  });
});
