export interface RosterPlayer {id:string;name:string;health:number;connected:boolean}
export interface RosterEntry extends RosterPlayer {local:boolean;healthPercent:number;down:boolean}

export function teamRoster(players:RosterPlayer[],localId:string):RosterEntry[]{
  return players.map(player=>({
    ...player,
    local:player.id===localId,
    healthPercent:Number.isFinite(player.health)?Math.max(0,Math.min(100,player.health)):0,
    down:player.health<=0,
  }));
}
