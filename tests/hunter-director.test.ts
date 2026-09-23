import {describe,expect,it} from 'vitest';
import {HunterDirector,hunterQuota} from '../src/horde/HunterDirector';

describe('Caçadores da horda',()=>{
  it('aumenta a cota gradualmente e mantém um limite',()=>{expect(hunterQuota(1)).toBe(1);expect(hunterQuota(4)).toBe(2);expect(hunterQuota(10)).toBe(4);expect(hunterQuota(999)).toBe(8);});
  it('libera um Caçador a cada dez segundos e só conclui após toda a cota',()=>{const director=new HunterDirector();let spawned=0;director.begin(4);director.update(9.9,()=>{spawned++;return true;});expect(spawned).toBe(0);director.update(.1,()=>{spawned++;return true;});expect(spawned).toBe(1);expect(director.remaining(1)).toBe(2);director.update(10,()=>{spawned++;return true;});expect(spawned).toBe(2);expect(director.complete).toBe(true);});
});
