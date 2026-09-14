import { C } from '../config/gameplay';
export type Phase = 'day' | 'horde';
export class DayCycle {
  day = 1; phase: Phase = 'day'; remaining: number = C.day.duration; elapsed = 0;
  update(dt: number): 'horde' | 'dawn' | null {
    this.elapsed += dt;if(this.phase==='horde'){this.remaining=0;return null;}this.remaining -= dt;
    if (this.remaining > 1e-8) return null;
    if (this.phase === 'day') { this.phase = 'horde'; this.remaining = C.day.hordeDuration; return 'horde'; }
    return null;
  }
  completeHorde(){if(this.phase!=='horde')return null;this.day++;this.phase='day';this.remaining=C.day.duration;return 'dawn' as const;}
}
