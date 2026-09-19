import type {CombatSnapshot} from './CombatAuthority';
import {SnapshotEncoder} from './SnapshotCodec';
import type {PackedDelta,PackedKeyframe} from './SnapshotCodec';

export interface SnapshotStreamStats{bytes:number;keyframes:number;deltas:number;packets:number}

export class SnapshotStream{
  readonly stats:SnapshotStreamStats={bytes:0,keyframes:0,deltas:0,packets:0};
  private encoder=new SnapshotEncoder();private started=false;private lastKeyframe=-Infinity;
  private enemies=new Map<number,CombatSnapshot['enemies'][number]>();
  next(snapshot:CombatSnapshot):PackedKeyframe|PackedDelta|null{
    if(!this.started||snapshot.tick-this.lastKeyframe>=120){this.started=true;this.lastKeyframe=snapshot.tick;this.enemies=new Map(snapshot.enemies.map(enemy=>[enemy.id,structuredClone(enemy)]));return this.record(this.encoder.keyframe(snapshot,snapshot.tick));}
    if(snapshot.tick%3!==0)return null;
    const liveIds=new Set(snapshot.enemies.map(enemy=>enemy.id));for(const id of this.enemies.keys())if(!liveIds.has(id))this.enemies.delete(id);
    for(const enemy of snapshot.enemies){const known=this.enemies.has(enemy.id),interval=enemy.kind==='boss'||enemy.state!=='WANDER'?6:15;if(!known||snapshot.tick%interval===0)this.enemies.set(enemy.id,structuredClone(enemy));}
    const filtered={...snapshot,enemies:[...this.enemies.values()]};
    const packet=this.encoder.delta(filtered,snapshot.tick);
    const meaningful=Object.keys(packet).some(key=>!['t','v','k','q','tick'].includes(key));return meaningful?this.record(packet):null;
  }
  private record<T extends PackedKeyframe|PackedDelta>(packet:T):T{const bytes=new TextEncoder().encode(JSON.stringify(packet)).byteLength;this.stats.bytes+=bytes;this.stats.packets++;if(packet.t==='k')this.stats.keyframes++;else this.stats.deltas++;return packet;}
}
