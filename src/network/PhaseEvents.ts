export type MatchPhase='day'|'horde';
export interface PhaseState {round:number;day:number;phase:MatchPhase}
export interface PhaseAnnouncement {kind:'horde'|'dawn';day:number}

/** Converts authoritative phase changes into one presentation event per transition. */
export class PhaseEvents {
  private state:PhaseState|null=null;
  reset(){this.state=null;}
  observe(next:PhaseState):PhaseAnnouncement|null{
    if(!this.state||next.round!==this.state.round){this.state={...next};return null;}
    const previous=this.state;this.state={...next};
    if(next.phase===previous.phase&&next.day===previous.day)return null;
    if(next.phase==='horde')return {kind:'horde',day:next.day};
    if(next.day>previous.day)return {kind:'dawn',day:next.day};
    return null;
  }
}
