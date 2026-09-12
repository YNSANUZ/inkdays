export interface ShotEvent {serial:number}

/** Delivers each live shot once while treating the first snapshot as a baseline. */
export class ShotEventCursor {
  private serial:number|null=null;

  reset(){this.serial=null;}

  consume<T extends ShotEvent>(shots:T[]){
    const latest=shots.at(-1)?.serial;
    if(this.serial===null){this.serial=latest??0;return [] as T[];}
    const fresh=shots.filter(shot=>shot.serial>this.serial!);
    if(latest!==undefined)this.serial=Math.max(this.serial,latest);
    return fresh;
  }
}
