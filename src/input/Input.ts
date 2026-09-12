import { TouchState } from './TouchState';
export interface Command { x: number; z: number; run: boolean; crouch: boolean; jump: boolean; fire: boolean; reload: boolean; shot?:boolean }
export class Input {
  touch=new TouchState();onClear:()=>void=()=>{};
  keys = new Set<string>(); pressed = new Set<string>(); firing = false; firePending = false; lookX = 0; lookY = 0; active = false; dragging = false;
  constructor(canvas: HTMLCanvasElement, onPause: () => void, onDebug: () => void) {
    window.addEventListener('keydown', e => {
      if (e.code === 'F3') { e.preventDefault(); if (!e.repeat) onDebug(); return; }
      if (!this.active) return;
      if (['Space','Tab','KeyW','KeyA','KeyS','KeyD'].includes(e.code)) e.preventDefault();
      if (e.code === 'Escape') { onPause(); return; }
      if (!e.repeat) this.pressed.add(e.code); this.keys.add(e.code);
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
    canvas.addEventListener('pointerdown', e => { if (!this.active||e.pointerType==='touch') return; if (e.button === 0) {this.firing = true;this.firePending=true;} if (e.button === 2) this.dragging = true; });
    window.addEventListener('pointerup', e => { if(e.pointerType==='touch')return; if (e.button === 0) this.firing = false; if (e.button === 2) this.dragging = false; });
    window.addEventListener('pointercancel',e=>{if(e.pointerType!=='touch'){this.firing=false;this.dragging=false;}});
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    window.addEventListener('mousemove', e => { if (this.active && (document.pointerLockElement === canvas || this.dragging)) { this.lookX += e.movementX; this.lookY += e.movementY; } });
    window.addEventListener('blur', () => { this.clear(); if (this.active) onPause(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.active) onPause(); });
    document.addEventListener('pointerlockchange', () => { this.clear(); if (!document.pointerLockElement && this.active) onPause(); });
  }
  clear() { this.keys.clear(); this.pressed.clear(); this.firing = false;this.firePending=false; this.dragging = false; this.lookX = this.lookY = 0;this.touch.clear();this.onClear(); }
  consume(): Command {
    const c = { x: Number(this.keys.has('KeyD')) - Number(this.keys.has('KeyA')), z: Number(this.keys.has('KeyW')) - Number(this.keys.has('KeyS')), run: this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'), crouch: this.keys.has('KeyC'), jump: this.pressed.has('Space'), fire: this.firing, reload: this.pressed.has('KeyR'),shot:this.firePending };
    const touch=this.touch.consume();c.x=Math.max(-1,Math.min(1,c.x+touch.x));c.z=Math.max(-1,Math.min(1,c.z+touch.z));c.run||=touch.run;c.crouch||=touch.crouch;c.jump||=touch.jump;c.fire||=touch.fire;c.reload||=touch.reload;c.shot||=Boolean(touch.shot);
    this.pressed.clear();this.firePending=false; return c;
  }
}
