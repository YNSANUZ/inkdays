import {describe,expect,it} from 'vitest';
import {controlsReady} from '../src/network/ControlGate';

describe('bloqueio de controles online',()=>{
  it('libera somente com conexão, referência autoritativa e chat fechado',()=>{
    expect(controlsReady(true,true,false)).toBe(true);
    expect(controlsReady(false,true,false)).toBe(false);
    expect(controlsReady(true,false,false)).toBe(false);
    expect(controlsReady(true,true,true)).toBe(false);
  });
});
