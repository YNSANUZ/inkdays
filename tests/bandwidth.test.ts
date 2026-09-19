import {describe,expect,it} from 'vitest';
import {CombatAuthority} from '../src/network/CombatAuthority';
import {SnapshotStream} from '../src/network/SnapshotStream';

describe('adaptive snapshot stream',()=>{
  it('starts with a keyframe and refreshes it after two seconds',()=>{
    const authority=new CombatAuthority(),stream=new SnapshotStream();authority.join('p');
    expect(stream.next(authority.snapshot())?.t).toBe('k');
    let packet;for(let tick=1;tick<=120;tick++){authority.step();packet=stream.next(authority.snapshot())??packet;}
    expect(packet).toMatchObject({t:'k'});
  });

  it('uses at most fifteen percent of the legacy full-snapshot budget',()=>{
    const authority=new CombatAuthority(),streams=Array.from({length:8},()=>new SnapshotStream());for(let index=0;index<8;index++)authority.join(`p${index}`);
    let legacyBytes=0,compactBytes=0;
    for(let tick=0;tick<3600;tick++){
      authority.step();const state=authority.snapshot();
      if(state.tick%3===0){const legacy=Buffer.byteLength(JSON.stringify({type:'snapshot',...state}));legacyBytes+=legacy*streams.length;}
      for(const stream of streams){const packet=stream.next(state);if(packet)compactBytes+=Buffer.byteLength(JSON.stringify(packet));}
    }
    expect(authority.snapshot().enemies.length).toBeGreaterThanOrEqual(10);
    expect(compactBytes/legacyBytes).toBeLessThanOrEqual(.15);
  });
});
