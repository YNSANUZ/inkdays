import {describe,it,expect} from 'vitest';
import {SnapshotTelemetry} from '../src/network/SnapshotTelemetry';
describe('telemetria de snapshots',()=>{
  it('ignora duplicatas e aceita reordenação dentro da janela sem regredir o tick novo',()=>{const t=new SnapshotTelemetry();for(const [tick,arrival] of [[3,50],[6,100],[12,200],[9,210],[12,220],[15,250],[18,300]])t.observe(tick,arrival);expect(t.lossPercent).toBe(0);expect(t.jitter).toBeLessThan(1);expect(t.latestTick).toBe(18);});
  it('mede somente perdas já finalizadas',()=>{const t=new SnapshotTelemetry(3,6,30);for(const tick of [0,3,9,12,15,18,21,24,27,30])t.observe(tick,tick/3*50);expect(t.lossPercent).toBeCloseTo(100/9);});
  it('mede variação de chegada separada do intervalo esperado',()=>{const t=new SnapshotTelemetry();t.observe(0,0);t.observe(3,80);t.observe(6,100);expect(t.jitter).toBeGreaterThan(5);expect(t.lossPercent).toBe(0);});
});
