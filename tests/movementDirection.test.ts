import { describe,expect,it } from 'vitest';
import { movementDirection } from '../src/player/LocomotionDirection';

describe('direção visual da locomoção',()=>{
  it('classifica frente, costas e laterais no rumo atual',()=>{
    const yaw=Math.PI;
    expect(movementDirection(yaw,{x:0,z:-5})).toBe('forward');
    expect(movementDirection(yaw,{x:0,z:5})).toBe('backward');
    expect(movementDirection(yaw,{x:5,z:0})).toBe('right');
    expect(movementDirection(yaw,{x:-5,z:0})).toBe('left');
  });
  it('acompanha a rotação do jogador e estabiliza em baixa velocidade',()=>{
    expect(movementDirection(Math.PI/2,{x:4,z:0})).toBe('forward');
    expect(movementDirection(Math.PI/2,{x:-4,z:0})).toBe('backward');
    expect(movementDirection(1.2,{x:.05,z:.02})).toBe('forward');
  });
});
