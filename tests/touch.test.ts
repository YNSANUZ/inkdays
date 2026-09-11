import { describe,it,expect } from 'vitest';
import { joystick,TouchState } from '../src/input/TouchState';
describe('comandos touch',()=>{
  it('mantém zona morta e intensidade analógica sem ultrapassar 1',()=>{expect(joystick(0,0,40)).toEqual({x:0,z:0});expect(joystick(2,0,40)).toEqual({x:0,z:0});const half=joystick(20,0,40);expect(half.x).toBeGreaterThan(.3);expect(half.x).toBeLessThan(.5);expect(joystick(0,-100,40)).toEqual({x:0,z:1});const d=joystick(100,100,40);expect(Math.hypot(d.x,d.z)).toBeCloseTo(1);});
  it('permite andar, correr e disparar simultaneamente',()=>{const t=new TouchState();t.x=.7;t.z=.3;t.run=true;t.fire=true;t.trigger('reload');const c=t.consume();expect(c).toMatchObject({x:.7,z:.3,run:true,fire:true,reload:true});expect(t.consume()).toMatchObject({x:.7,fire:true,reload:false});});
  it('preserva toques rápidos entre dois frames e não repete salto',()=>{const t=new TouchState();t.trigger('fire');t.trigger('jump');expect(t.consume()).toMatchObject({fire:true,jump:true});expect(t.consume()).toMatchObject({fire:false,jump:false});});
  it('zera todos os comandos ao pausar ou cancelar',()=>{const t=new TouchState();t.x=1;t.fire=true;t.run=true;t.crouch=true;t.trigger('jump');t.trigger('reload');t.clear();expect(t.consume()).toEqual({x:0,z:0,run:false,crouch:false,fire:false,jump:false,reload:false});});
});
