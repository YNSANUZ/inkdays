import {describe,expect,it} from 'vitest';
import {quoteAmmoPurchase} from '../src/economy/AmmoEconomy';
import {Pistol} from '../src/weapons/Pistol';
import {C} from '../src/config/gameplay';

describe('ammo economy',()=>{
  it('quotes a full ammo package',()=>expect(quoteAmmoPurchase(0,120)).toEqual({rounds:24,cost:60}));
  it('quotes a partial ammo package',()=>expect(quoteAmmoPurchase(117,120)).toEqual({rounds:3,cost:8}));
  it('quotes nothing at full capacity',()=>expect(quoteAmmoPurchase(120,120)).toEqual({rounds:0,cost:0}));
  it('never lets reserve exceed capacity',()=>{
    const pistol=new Pistol();
    pistol.reserve=C.weapon.maxReserve-1;
    expect(pistol.addReserve(16)).toBe(1);
    expect(pistol.reserve).toBe(C.weapon.maxReserve);
  });
  it('ignores invalid reserve additions',()=>{
    const pistol=new Pistol();
    const before=pistol.reserve;
    expect(pistol.addReserve(Number.NaN)).toBe(0);
    expect(pistol.addReserve(-5)).toBe(0);
    expect(pistol.reserve).toBe(before);
  });
});
