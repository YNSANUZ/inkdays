import {describe,it,expect} from 'vitest';
import {parseInput} from '../src/network/Protocol';
import {MovementAuthority} from '../src/network/MovementAuthority';
import type {Point} from '../src/simulation/Movement';
import {playerColor} from '../src/network/PlayerColor';
import {firstPersonWeaponProfile} from '../src/weapons/FirstPersonWeapon';
import {FirstPersonWeapon} from '../src/weapons/FirstPersonWeapon';
import * as T from 'three';
import {draftPistol} from '../src/weapons/CustomWeapon';
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
  it('aceita câmera autoritativa compatível e rejeita modo forjado',()=>{
    expect(parseInput({...input(1),cameraMode:'first'})?.cameraMode).toBe('first');
    expect(parseInput({...input(2),cameraMode:'sideways'})).toBeNull();
    expect(parseInput(input(3))?.cameraMode).toBeUndefined();
  });
  it('mantém cor de jogador estável e arma longa maior que pistola',()=>{
    expect(playerColor('bruno')).toBe(playerColor('bruno'));
    expect(firstPersonWeaponProfile('smg').scale).toBeGreaterThan(firstPersonWeaponProfile('pistol').scale);
    expect(firstPersonWeaponProfile('pistol').twoHanded).toBe(true);
  });
  it('monta dois braços articulados em vez de mãos esféricas soltas na primeira pessoa',()=>{
    const view=new FirstPersonWeapon(new T.PerspectiveCamera());
    for(const side of ['left','right']){
      expect(view.root.getObjectByName(`${side}-upper-arm`)).toBeInstanceOf(T.Mesh);
      expect(view.root.getObjectByName(`${side}-forearm`)).toBeInstanceOf(T.Mesh);
      expect(view.root.getObjectByName(`${side}-hand`)).toBeInstanceOf(T.Mesh);
    }
    expect(view.root.getObjectByName('first-person-weapon')).toBeInstanceOf(T.Group);
  });
  it('mantém a arma como traços puros e opacos na cor escolhida, sem corpo cinza',()=>{
    const view=new FirstPersonWeapon(new T.PerspectiveCamera()),weapon=view.root.getObjectByName('first-person-weapon')!;
    const materials:T.Material[]=[];weapon.traverse(object=>{if(object instanceof T.Mesh)materials.push(object.material as T.Material);});
    expect(materials.length).toBeGreaterThan(4);
    expect(materials.every(material=>material instanceof T.MeshBasicMaterial&&!material.transparent&&material.opacity===1)).toBe(true);
    expect(materials.every(material=>material.userData.outlineParameters?.visible===false)).toBe(true);
    expect(new Set(materials.map(material=>(material as T.MeshBasicMaterial).color.getHexString()))).toEqual(new Set(['43b95f']));
    expect(Math.abs(weapon.rotation.y)).toBeGreaterThan(1.2);
    expect(Math.abs(weapon.rotation.y)).toBeLessThan(1.8);
  });
  it('usa mãos alongadas e braços contínuos do manequim em vez de bolinhas',()=>{const view=new FirstPersonWeapon(new T.PerspectiveCamera());for(const side of ['left','right']){const hand=view.root.getObjectByName(`${side}-hand`) as T.Mesh;expect(hand.geometry).toBeInstanceOf(T.CapsuleGeometry);expect(hand.scale.y).toBeGreaterThan(hand.scale.x);}});
  it('renderiza diretamente os traços e a cor escolhidos pelo jogador',()=>{const custom={...draftPistol,id:'player-drawing',color:'#3182ce',drawing:[{width:.02,points:[{x:.3,y:.7},{x:.5,y:.45},{x:.9,y:.4}]}]},view=new FirstPersonWeapon(new T.PerspectiveCamera(),custom),weapon=view.root.getObjectByName('first-person-weapon')!;expect(weapon.name).toBe('first-person-weapon');const colors:T.Color[]=[];weapon.traverse(object=>{if(object instanceof T.Mesh&&object.material instanceof T.MeshBasicMaterial)colors.push(object.material.color);});expect(colors.length).toBe(2);expect(colors.every(color=>color.getHexString()==='3182ce')).toBe(true);});
  it('limita a oito jogadores, reaproveita vaga e rejeita comandos desconhecidos ou repetidos',()=>{
    const a=new MovementAuthority(world);for(let n=0;n<8;n++)expect(a.join(`p${n}`)).toBe(true);expect(a.join('extra')).toBe(false);
    const positions=a.snapshot().players.map(player=>`${player.position.x}:${player.position.z}`);expect(new Set(positions).size).toBe(8);
    expect(a.receive('extra',input(0))).toBe(false);expect(a.receive('p0',input(2))).toBe(true);expect(a.receive('p0',input(1))).toBe(false);expect(a.receive('p0',input(2))).toBe(false);
    a.leave('p3');expect(a.join('extra')).toBe(true);expect(a.snapshot().players).toHaveLength(8);
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
