import {describe,expect,it} from 'vitest';
import {AmmoDropDirector} from '../src/economy/AmmoDrops';
import {C} from '../src/config/gameplay';

const points=[{x:0,z:0},{x:10,z:0},{x:20,z:0},{x:30,z:0}];
const player=(overrides:Partial<{id:string;x:number;z:number;alive:boolean;ready:boolean;ammo:number;reserve:number}>={})=>({
  id:'p1',x:50,z:50,alive:true,ready:true,ammo:8,reserve:40,...overrides,
});

describe('ammo drop director',()=>{
  it('spawns the first 9mm reward at thirty seconds and expires ten seconds later',()=>{
    const director=new AmmoDropDirector({points,rng:()=>0});
    director.update(29.99,[player()]);
    expect(director.snapshot()).toHaveLength(0);
    director.update(.01,[player()]);
    expect(director.snapshot()).toEqual([{id:1,x:0,z:0,remaining:10,caliber:'9mm'}]);
    director.update(9.99,[player()]);
    expect(director.snapshot()).toHaveLength(1);
    const expiredId=director.snapshot()[0].id;
    director.update(.01,[player()]);
    expect(director.snapshot()).toHaveLength(0);
    director.update(19.99,[player()]);
    expect(director.snapshot()).toHaveLength(0);
    director.update(.01,[player()]);
    expect(director.snapshot()[0].id).not.toBe(expiredId);
  });

  it('never exceeds three simultaneous drops',()=>{
    const director=new AmmoDropDirector({points,rng:()=>0});
    for(let index=0;index<6;index++)director.update(30,[player()]);
    expect(director.snapshot().length).toBeLessThanOrEqual(3);
  });

  it('avoids occupied and recently used points',()=>{
    const director=new AmmoDropDirector({points,rng:()=>0});
    director.update(30,[player({x:0,z:0})]);
    expect(director.snapshot()[0]).toMatchObject({x:10,z:0});
    director.update(30,[player({x:0,z:0})]);
    expect(director.snapshot()[0]).toMatchObject({x:20,z:0});
  });

  it('accelerates one nearby drop when every live player is empty',()=>{
    const director=new AmmoDropDirector({points,rng:()=>.99});
    director.update(1.99,[player({x:8,z:0,ammo:0,reserve:0})]);
    expect(director.snapshot()).toHaveLength(0);
    director.update(.01,[player({x:8,z:0,ammo:0,reserve:0})]);
    expect(director.snapshot()[0]).toMatchObject({x:0,z:0});
    director.update(2,[player({x:8,z:0,ammo:0,reserve:0})]);
    expect(director.snapshot()).toHaveLength(1);
  });

  it('ignores dead players when deciding emergency and collection',()=>{
    const director=new AmmoDropDirector({points,rng:()=>0});
    director.update(2,[player({alive:false,ammo:0,reserve:0})]);
    expect(director.snapshot()).toHaveLength(0);
    director.update(30,[player()]);
    const drop=director.snapshot()[0];
    expect(director.collect(drop.id,player({x:drop.x,z:drop.z,alive:false}))).toEqual({ok:false,rounds:0});
    expect(director.snapshot()).toHaveLength(1);
  });

  it('allows exactly one winner for simultaneous pickup',()=>{
    const director=new AmmoDropDirector({points,rng:()=>0});
    director.update(30,[player()]);
    const drop=director.snapshot()[0];
    const first=director.collect(drop.id,player({x:drop.x,z:drop.z}));
    const second=director.collect(drop.id,player({id:'p2',x:drop.x,z:drop.z}));
    expect([first.ok,second.ok]).toEqual([true,false]);
    expect(first.rounds).toBe(C.ammoDrops.rounds);
  });

  it('rejects missing, distant, dead, unready, and full-reserve collectors',()=>{
    const scenarios=[
      player({x:50,z:50}),
      player({x:0,z:0,alive:false}),
      player({x:0,z:0,ready:false}),
      player({x:0,z:0,reserve:C.weapon.maxReserve}),
    ];
    for(const candidate of scenarios){
      const director=new AmmoDropDirector({points,rng:()=>0});
      director.update(30,[player()]);
      const drop=director.snapshot()[0];
      const positioned={...candidate,x:candidate.x===0?drop.x:candidate.x,z:candidate.z===0?drop.z:candidate.z};
      expect(director.collect(drop.id,positioned).ok).toBe(false);
      expect(director.snapshot()).toHaveLength(1);
      expect(director.collect(999,player({x:drop.x,z:drop.z})).ok).toBe(false);
    }
  });

  it('reset clears drops, timers, and identifiers',()=>{
    const director=new AmmoDropDirector({points,rng:()=>0});
    director.update(30,[player()]);
    director.reset();
    expect(director.snapshot()).toEqual([]);
    director.update(30,[player()]);
    expect(director.snapshot()[0].id).toBe(1);
  });
});
