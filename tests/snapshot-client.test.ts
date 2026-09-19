import {describe,expect,it} from 'vitest';
import {CombatAuthority} from '../src/network/CombatAuthority';
import {SnapshotEncoder} from '../src/network/SnapshotCodec';
import {SnapshotReceiver} from '../src/network/SnapshotReceiver';

describe('snapshot receiver',()=>{
  it('rebuilds v2 keyframes and ordered deltas for the game client',()=>{
    const authority=new CombatAuthority(),encoder=new SnapshotEncoder(),receiver=new SnapshotReceiver();
    authority.join('p');
    const first=receiver.receive(encoder.keyframe(authority.snapshot()));
    authority.step();
    const second=receiver.receive(encoder.delta(authority.snapshot()));
    expect(first?.players[0].id).toBe('p');
    expect(second?.tick).toBe(authority.tick);
    expect(receiver.needsKeyframe).toBe(false);
  });

  it('resets between websocket sessions and still accepts legacy snapshots',()=>{
    const authority=new CombatAuthority(),encoder=new SnapshotEncoder(),receiver=new SnapshotReceiver();
    authority.join('p');receiver.receive(encoder.keyframe(authority.snapshot()));receiver.reset();
    expect(receiver.needsKeyframe).toBe(true);
    expect(receiver.receive({type:'snapshot',...authority.snapshot()})?.players[0].id).toBe('p');
  });
});
