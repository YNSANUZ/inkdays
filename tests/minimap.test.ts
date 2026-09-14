import {describe,expect,it} from 'vitest';
import {minimapPoint} from '../src/network/Minimap';

describe('projeção do minimapa',()=>{
  it('centraliza a origem, preserva eixos e contém pontos fora da arena',()=>{
    expect(minimapPoint({x:0,z:0},43,100)).toEqual({x:50,y:50});
    expect(minimapPoint({x:43,z:-43},43,100)).toEqual({x:93,y:7});
    expect(minimapPoint({x:999,z:-999},43,100)).toEqual({x:93,y:7});
    expect(minimapPoint({x:Number.NaN,z:0},0,0)).toEqual({x:.5,y:.5});
  });
});
