import { C } from '../config/gameplay';
export class Health {
  value: number = C.player.health; immunity = 0;
  get dead() { return this.value <= 0; }
  update(dt: number) { this.immunity = Math.max(0, this.immunity - dt); }
  damage(amount: number) { if (this.dead || this.immunity > 0) return false; this.value = Math.max(0, this.value - amount); this.immunity = C.player.hurtInvulnerability; return true; }
  heal(amount: number) { if (!this.dead) this.value = Math.min(C.player.health, this.value + amount); }
}
