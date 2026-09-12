import { normalizePlayerName } from './PlayerName';

/** Repeats a requested nickname until authoritative state confirms it. */
export class ReliablePlayerName {
  private desired:string|null=null;private confirmed:string|null=null;private lastSent=-Infinity;
  constructor(private intervalMs=400){}
  set(value:unknown){this.desired=normalizePlayerName(value);this.lastSent=-Infinity;return this.desired;}
  observe(value:unknown){this.confirmed=normalizePlayerName(value);}
  packet(now:number){if(!this.desired||this.confirmed===this.desired||now-this.lastSent<this.intervalMs)return null;this.lastSent=now;return {type:'name' as const,name:this.desired};}
  get pending(){return !!this.desired&&this.confirmed!==this.desired;}
}
