import {describe,expect,it} from 'vitest';
import {controlsReady} from '../src/network/ControlGate';

describe('bloqueio de controles online',()=>{
  it('libera somente após entrada explícita, com conexão, referência e chat fechado',()=>{
    expect(controlsReady(true,true,true,false)).toBe(true);
    expect(controlsReady(false,true,true,false)).toBe(false);
    expect(controlsReady(true,false,true,false)).toBe(false);
    expect(controlsReady(true,true,false,false)).toBe(false);
    expect(controlsReady(true,true,true,true)).toBe(false);
  });
});
