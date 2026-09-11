import { C } from '../config/gameplay';
export type Phase = 'day' | 'horde';
export class DayCycle {
  day = 1; phase: Phase = 'day'; remaining: number = C.day.duration; elapsed = 0;
  update(dt: number): 'horde' | 'dawn' | null {
    this.elapsed += dt; this.remaining -= dt;
    if (this.remaining > 1e-8) return null;
    if (this.phase === 'day') { this.phase = 'horde'; this.remaining = C.day.hordeDuration; return 'horde'; }
    this.day++; this.phase = 'day'; this.remaining = C.day.duration; return 'dawn';
  }
}
