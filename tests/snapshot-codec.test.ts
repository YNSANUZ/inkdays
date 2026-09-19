import {describe,expect,it} from 'vitest';
import {CombatAuthority} from '../src/network/CombatAuthority';
import {packKeyframe,unpackKeyframe} from '../src/network/SnapshotCodec';

describe('compact snapshot keyframe',()=>{
  it('reconstructs an authoritative snapshot within transport precision',()=>{
    const authority=new CombatAuthority();authority.join('player-a');
    for(let tick=0;tick<30;tick++)authority.step();
    const source=authority.snapshot(),packet=packKeyframe(source,7),decoded=unpackKeyframe(packet);
    expect(packet).toMatchObject({t:'k',v:2,k:7});
    expect(decoded.tick).toBe(source.tick);
    expect(decoded.players[0].id).toBe('player-a');
    expect(decoded.players[0].position.x).toBeCloseTo(source.players[0].position.x,2);
    expect(decoded.players[0].yaw).toBeCloseTo(source.players[0].yaw,3);
  });

  it('quantizes negative coordinates and boundary angles predictably',()=>{
    const authority=new CombatAuthority();authority.join('edge');
    const source=authority.snapshot();source.players[0].position.x=-42.129;source.players[0].position.z=42.129;source.players[0].yaw=-Math.PI;
    const decoded=unpackKeyframe(packKeyframe(source,1));
    expect(decoded.players[0].position).toMatchObject({x:-42.13,z:42.13});
    expect(decoded.players[0].yaw).toBeCloseTo(-Math.PI,3);
  });
});
