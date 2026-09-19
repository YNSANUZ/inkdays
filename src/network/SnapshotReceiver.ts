import type {CombatSnapshot} from './CombatAuthority';
import {SnapshotDecoder} from './SnapshotCodec';
import type {PackedDelta,PackedKeyframe} from './SnapshotCodec';

export class SnapshotReceiver{
  private decoder=new SnapshotDecoder();
  get needsKeyframe(){return this.decoder.needsKeyframe;}
  reset(){this.decoder.reset();}
  receive(packet:unknown):CombatSnapshot|null{
    if(!packet||typeof packet!=='object')return null;
    const candidate=packet as {type?:string;t?:string;v?:number};
    if(candidate.type==='snapshot')return packet as CombatSnapshot;
    if(candidate.v===2&&(candidate.t==='k'||candidate.t==='d'))return this.decoder.accept(packet as PackedKeyframe|PackedDelta);
    return null;
  }
}
