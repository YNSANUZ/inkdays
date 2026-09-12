import {describe,it,expect} from 'vitest';
import {SnapshotFreshness} from '../src/network/SnapshotFreshness';

describe('vigia do estado autoritativo',()=>{
  it('tolera o intervalo normal e expira uma conexão silenciosa',()=>{
    const freshness=new SnapshotFreshness(2500);freshness.reset(100);
    expect(freshness.stale(2600)).toBe(false);
    expect(freshness.stale(2601)).toBe(true);
  });
  it('renova somente quando um snapshot válido é observado',()=>{
    const freshness=new SnapshotFreshness(2500);freshness.reset(100);freshness.observe(2000);
    expect(freshness.stale(4500)).toBe(false);
    expect(freshness.stale(4501)).toBe(true);
  });
});
