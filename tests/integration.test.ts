import { describe,it,expect } from 'vitest';
import * as T from 'three';
import { Player } from '../src/player/Player';
import { World } from '../src/world/World';
import { Enemies } from '../src/enemies/Enemies';
import { ThirdPerson } from '../src/camera/ThirdPerson';
import { C } from '../src/config/gameplay';
import type { Command } from '../src/input/Input';
const scene=new T.Scene(),world=new World(scene);
const command:Command={x:0,z:1,run:false,crouch:false,jump:false,fire:false,reload:false};
describe('integração da simulação sem renderizador',()=>{
  it('anda, corre, agacha e normaliza diagonais',()=>{const move=(c:Command)=>{const p=new Player();p.position.set(0,0,0);for(let i=0;i<60;i++)p.update(1/60,c,0,world);return p.position.length();};const walk=move(command),run=move({...command,run:true}),crouch=move({...command,crouch:true});expect(walk).toBeGreaterThan(4.5);expect(run).toBeGreaterThan(7);expect(crouch).toBeLessThan(2.6);expect(move({...command,x:1})).toBeCloseTo(walk,3);});
  it('pula e pousa; sem salto duplo',()=>{const p=new Player();p.update(1/60,{...command,z:0,jump:true},0,world);expect(p.position.y).toBeGreaterThan(0);for(let i=0;i<20;i++)p.update(1/60,{...command,z:0},0,world);const velocity=p.vertical;p.update(1/60,{...command,z:0,jump:true},0,world);expect(p.vertical).toBeLessThan(velocity);for(let i=0;i<90;i++)p.update(1/60,{...command,z:0},0,world);expect(p.position.y).toBe(0);});
  it('não atravessa parede nem sai da área',()=>{const pos=new T.Vector3(-12,0,-8);for(let i=0;i<200;i++)world.move(pos,0,-.08,C.player.radius);expect(pos.z).toBeGreaterThan(-10.1);const edge=new T.Vector3(0,0,42);world.move(edge,0,3,C.player.radius);expect(edge.length()).toBeLessThanOrEqual(C.world.radius-C.player.radius+.001);});
  it('câmera respeita limite vertical e aproxima antes da cobertura',()=>{const cam=new ThirdPerson();cam.look(0,1e5,1);expect(cam.pitch).toBe(C.camera.maxPitch);cam.look(0,-1e5,1);expect(cam.pitch).toBe(C.camera.minPitch);cam.pitch=0;cam.update(1,new T.Vector3(-12,0,-19),world);expect(cam.camera.position.z).toBeLessThan(-15.5);expect(cam.camera.position.y).toBeGreaterThan(.3);});
  it('inimigo persegue, ataca, morre e é removido',()=>{const p=new Player(),enemies=new Enemies(scene,world);p.position.set(0,0,0);expect(enemies.spawn(1,p.position)).toBe(true);const e=enemies.active[0];e.avatar.root.position.set(0,0,-4);enemies.update(1/60,p,()=>{});expect(e.state).toBe('CHASE');expect(e.avatar.root.position.z).toBeGreaterThan(-4);e.avatar.root.position.set(0,0,-1);e.cooldown=0;enemies.update(1/60,p,()=>{});expect(e.state).toBe('ATTACK');expect(p.health.value).toBe(86);expect(enemies.damage(e,C.weapon.damage)).toBe(false);expect(enemies.damage(e,C.weapon.damage)).toBe(true);expect(e.state).toBe('DEAD');expect(enemies.active).toHaveLength(0);expect(e.avatar.root.parent).toBeNull();enemies.clear();});
  it('inimigo não causa dano através de uma cerca',()=>{const p=new Player(),enemies=new Enemies(scene,world);p.position.set(11,0,-12.5);enemies.spawn(1,p.position);const e=enemies.active[0];e.avatar.root.position.set(11,0,-13.5);e.cooldown=0;enemies.update(1/60,p,()=>{});expect(p.health.value).toBe(100);enemies.clear();});
});
