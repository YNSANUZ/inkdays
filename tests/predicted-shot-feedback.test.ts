import {describe,expect,it} from 'vitest';
import {PredictedShotFeedback} from '../src/network/PredictedShotFeedback';

describe('resposta prevista do gatilho',()=>{
  it('suprime somente a confirmação do identificador previsto',()=>{const feedback=new PredictedShotFeedback();feedback.predict(7,100);expect(feedback.confirm(8,200)).toBe(false);expect(feedback.count).toBe(1);expect(feedback.confirm(7,220)).toBe(true);expect(feedback.confirm(7,230)).toBe(false);});
  it('expira previsões sem confirmação e limpa na reconexão',()=>{const feedback=new PredictedShotFeedback(600);feedback.predict(1,0);expect(feedback.confirm(1,601)).toBe(false);feedback.predict(2,700);feedback.reset();expect(feedback.confirm(2,701)).toBe(false);});
});
