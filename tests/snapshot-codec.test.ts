import {describe,expect,it} from 'vitest';
import {CombatAuthority} from '../src/network/CombatAuthority';
import {packKeyframe,SnapshotDecoder,SnapshotEncoder,unpackKeyframe} from '../src/network/SnapshotCodec';

describe('compact snapshot keyframe',()=>{
  it('accepts an older server keyframe without ammo drops',()=>{const authority=new CombatAuthority();authority.join('a');const packet=packKeyframe(authority.snapshot(),1);delete (packet.s as unknown as {a?:unknown}).a;expect(unpackKeyframe(packet).ammoDrops).toEqual([]);});
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

describe('ordered snapshot deltas',()=>{
  const state=()=>{const a=new CombatAuthority();a.join('p');a.enemies.spawn(1,a.snapshot().players[0].position as never);return a.snapshot();};
  it('applies changed entities, removal and safe identifier reuse',()=>{
    const encoder=new SnapshotEncoder(),decoder=new SnapshotDecoder(),first=state();
    expect(decoder.accept(encoder.keyframe(first,0))).not.toBeNull();
    const second=structuredClone(first);second.tick=3;second.players[0].health=67;second.enemies=[];
    expect(decoder.accept(encoder.delta(second,3))).toMatchObject({tick:3,players:[{health:67}],enemies:[]});
    const third=structuredClone(second);third.tick=6;third.enemies=[{...first.enemies[0],health:12}];
    expect(decoder.accept(encoder.delta(third,6))?.enemies[0]).toMatchObject({health:12});
  });

  it('rejects deltas before a keyframe, with stale base, or after a sequence gap',()=>{
    const encoder=new SnapshotEncoder(),decoder=new SnapshotDecoder(),first=state(),keyframe=encoder.keyframe(first,0),delta1=encoder.delta({...first,tick:3},3),delta2=encoder.delta({...first,tick:6},6);
    expect(new SnapshotDecoder().accept(delta1)).toBeNull();
    expect(decoder.accept(keyframe)).not.toBeNull();
    expect(decoder.accept({...delta1,k:999})).toBeNull();
    expect(decoder.accept(keyframe)).not.toBeNull();
    expect(decoder.accept(delta2)).toBeNull();
    expect(decoder.needsKeyframe).toBe(true);
  });
});
