export interface RosterPlayer {id:string;name:string;health:number;connected:boolean;ready?:boolean}
export interface RosterEntry extends RosterPlayer {local:boolean;healthPercent:number;down:boolean;waiting:boolean}

/** Missing readiness means a pre-lobby server where every connected player was active. */
export const isPlayingPlayer=(player:{ready?:boolean})=>player.ready!==false;

export function teamRoster(players:RosterPlayer[],localId:string):RosterEntry[]{
  return players.map(player=>({
    ...player,
    local:player.id===localId,
    healthPercent:Number.isFinite(player.health)?Math.max(0,Math.min(100,player.health)):0,
    down:player.health<=0,
    waiting:!isPlayingPlayer(player),
  }));
}
