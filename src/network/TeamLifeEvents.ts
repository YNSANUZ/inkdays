export interface TeamLifeState {id:string;name:string;health:number}
export interface TeamLifeEvent {kind:'down'|'revived';id:string;name:string}

/** Emits presentation events only after an authoritative health transition. */
export class TeamLifeEvents {
  private health=new Map<string,number>();
  reset(){this.health.clear();}
  observe(players:TeamLifeState[],localId:string){
    const events:TeamLifeEvent[]=[];
    for(const player of players){
      const previous=this.health.get(player.id);this.health.set(player.id,player.health);
      if(player.id===localId||previous===undefined)continue;
      if(previous>0&&player.health===0)events.push({kind:'down',id:player.id,name:player.name});
      else if(previous===0&&player.health>0)events.push({kind:'revived',id:player.id,name:player.name});
    }
    const present=new Set(players.map(player=>player.id));for(const id of this.health.keys())if(!present.has(id))this.health.delete(id);
    return events;
  }
}
