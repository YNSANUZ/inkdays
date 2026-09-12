import {describe,it,expect} from 'vitest';
import {parseInput} from '../src/network/Protocol';
import {MovementAuthority} from '../src/network/MovementAuthority';
import type {Point} from '../src/simulation/Movement';
const input=(sequence:number)=>({version:1,sequence,yaw:0,command:{x:0,z:1,run:false,crouch:false,jump:false,fire:false,reload:false}});
const world={move(p:Point,dx:number,dz:number){p.x+=dx;p.z+=dz;}};
describe('base autoritativa de movimentação',()=>{
  it('reutiliza a vaga livre sem sobrepor o outro jogador após reconexão',()=>{
    const a=new MovementAuthority(world);a.join('a');a.join('b');a.leave('a');a.join('c');
    const s=a.snapshot();expect(s.players[0].position.x).not.toBe(s.players[1].position.x);
  });
  it('rejeita posições forjadas, eixos inválidos, NaN e versões incompatíveis',()=>{
    expect(parseInput({...input(0),position:{x:999}})).toBeNull();
    expect(parseInput({...input(0),yaw:NaN})).toBeNull();
    expect(parseInput({...input(0),version:2})).toBeNull();
    expect(parseInput({...input(0),viewTick:-1})).toBeNull();
    expect(parseInput({...input(0),viewTick:1.5})).toBeNull();
    expect(parseInput({...input(0),command:{...input(0).command,x:2}})).toBeNull();
  });
  it('limita a dois jogadores e rejeita comandos de conexão desconhecida ou repetidos',()=>{
    const a=new MovementAuthority(world);expect(a.join('a')).toBe(true);expect(a.join('b')).toBe(true);expect(a.join('c')).toBe(false);
    expect(a.receive('c',input(0))).toBe(false);expect(a.receive('a',input(2))).toBe(true);expect(a.receive('a',input(1))).toBe(false);expect(a.receive('a',input(2))).toBe(false);
    a.leave('b');expect(a.join('c')).toBe(true);
  });
  it('confirma o comando somente depois de simular o tick',()=>{
    const a=new MovementAuthority(world);a.join('a');a.receive('a',input(8));
    expect(a.snapshot().players[0].acknowledged).toBe(-1);a.step();expect(a.snapshot().players[0].acknowledged).toBe(8);
  });
  it('volume de pacotes não acelera a simulação e snapshots não expõem estado mutável',()=>{
    const a=new MovementAuthority(world);a.join('a');a.join('b');
    for(let n=0;n<60;n++){for(let j=0;j<10;j++)a.receive('a',input(n*10+j));a.receive('b',input(n));a.step();}
    const s=a.snapshot();expect(s.players[0].position.z).toBeCloseTo(s.players[1].position.z,10);
    expect(s.players[0].position.z).toBeGreaterThan(5);s.players[0].position.z=999;expect(a.snapshot().players[0].position.z).toBeLessThan(10);
  });
  it('interrompe movimento após perda de comandos e converge após replay idêntico',()=>{
    const a=new MovementAuthority(world),b=new MovementAuthority(world);a.join('a');b.join('a');
    for(let n=0;n<60;n++){a.receive('a',input(n));b.receive('a',input(n));a.step();b.step();}
    expect(a.snapshot()).toEqual(b.snapshot());for(let n=0;n<180;n++)a.step();expect(Math.abs(a.snapshot().players[0].velocity.z)).toBeLessThan(.0001);
  });
  it('não simula jogador suspenso até a retomada',()=>{
    const a=new MovementAuthority(world);a.join('a');a.receive('a',input(0));a.step();a.suspend('a');const stopped=a.snapshot().players[0].position.z;
    expect(a.receive('a',input(1))).toBe(false);for(let n=0;n<30;n++)a.step();expect(a.snapshot().players[0]).toMatchObject({connected:false,position:{z:stopped}});a.resume('a');expect(a.receive('a',input(1))).toBe(true);a.step();expect(a.snapshot().players[0].position.z).toBeLessThan(stopped);
  });
});
