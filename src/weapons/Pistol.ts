import { C } from '../config/gameplay';
export class Pistol {
  ammo: number = C.weapon.magazine; reserve: number = C.weapon.reserve; cooldown = 0; reloadTime = 0;
  update(dt: number) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.reloadTime > 0) { this.reloadTime = Math.max(0, this.reloadTime - dt); if (this.reloadTime === 0) { const n = Math.min(C.weapon.magazine - this.ammo, this.reserve); this.ammo += n; this.reserve -= n; } }
  }
  fire() { if (this.cooldown > 0 || this.reloadTime > 0 || this.ammo <= 0) return false; this.ammo--; this.cooldown = C.weapon.interval; if(this.ammo===0&&this.reserve>0)this.reload(); return true; }
  reload() { if (this.reloadTime > 0 || this.ammo === C.weapon.magazine || this.reserve === 0) return false; this.reloadTime = C.weapon.reload; return true; }
  resupply() { this.reserve = Math.min(C.weapon.maxReserve, this.reserve + C.day.dawnAmmo); }
}
