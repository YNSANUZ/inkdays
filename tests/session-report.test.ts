import {describe,it,expect,vi} from 'vitest';
import {SessionReport} from '../src/network/SessionReport';
describe('relatório de sessão multiplayer',()=>{
  it('agrega métricas sem armazenar identidade',()=>{vi.useFakeTimers();vi.setSystemTime(new Date('2026-09-12T00:00:00Z'));const report=new SessionReport();report.sample({day:1,tick:3,rtt:100,jitter:10,loss:0,correction:.1,snaps:0});report.sample({day:2,tick:3603,rtt:200,jitter:30,loss:5,correction:.4,snaps:1,rewindTicks:9});report.disconnected();report.resumed();const result=report.summary(Date.now()+10000);expect(result).toMatchObject({durationSeconds:10,samples:2,lastDay:2,lastTick:3603,averagePingMs:150,maximumPingMs:200,averageJitterMs:20,maximumLossPercent:5,maximumCorrectionCm:40,maximumShotRewindMs:150,hardCorrections:1,disconnects:1,resumes:1,newIdentities:0});expect(JSON.stringify(result)).not.toContain('player');vi.useRealTimers();});
});
