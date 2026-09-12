import {describe,expect,it} from 'vitest';
import {resumeInputSequence} from '../src/network/InputSequence';

describe('sequência após retomada',()=>{
  it('começa acima do último comando aceito em uma página recarregada',()=>{
    expect(resumeInputSequence(0,840)).toBe(841);
    expect(resumeInputSequence(0,-1)).toBe(0);
  });

  it('não faz uma conexão ativa regredir',()=>{
    expect(resumeInputSequence(912,840)).toBe(912);
  });
});
