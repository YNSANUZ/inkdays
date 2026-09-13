import { describe,it,expect } from 'vitest';
import { C,difficulty,hordeCount,nextBoss } from '../src/config/gameplay';
import { DayCycle } from '../src/daycycle/DayCycle';
import { Health } from '../src/health/Health';
import { Pistol } from '../src/weapons/Pistol';
import { Horde } from '../src/horde/Horde';
describe('ciclo de sobrevivência',()=>{
  it('avisa e passa de preparação a horda, depois ao dia 2',()=>{const d=new DayCycle();for(let i=0;i<1800;i++)d.update(1/60);expect(d.remaining).toBeCloseTo(10);for(let i=0;i<600;i++)d.update(1/60);expect(d.phase).toBe('horde');expect(d.day).toBe(1);for(let i=0;i<1200;i++)d.update(1/60);expect(d.phase).toBe('day');expect(d.day).toBe(2);expect(d.elapsed).toBeCloseTo(60);});
  it('escala 5, 7, 9 sem crescimento ilimitado de vida ou velocidade',()=>{expect([1,2,3].map(d=>difficulty(d).count)).toEqual([5,7,9]);expect(difficulty(2).speed).toBeGreaterThan(difficulty(1).speed);expect(difficulty(1000).health).toBe(C.enemy.maxHealth);expect(difficulty(1000).count).toBe(C.day.maxEnemies);});
  it('dimensiona a horda pela equipe sem ultrapassar o limite',()=>{expect([1,2,4,8].map(players=>hordeCount(1,players))).toEqual([5,7,12,21]);expect(hordeCount(1000,8)).toBe(C.day.maxEnemies);expect(hordeCount(1,99)).toBe(21);expect(hordeCount(1,Number.NaN)).toBe(5);});
  it('agenda chefões em múltiplos de dez',()=>{expect([1,9,10,11,20,21].map(nextBoss)).toEqual([10,10,10,20,20,30]);});
  it('distribui a horda e tenta de novo se não há spawn seguro',()=>{const h=new Horde();h.begin(1);h.update(.01,()=>false);expect(h.spawned).toBe(0);h.update(2,()=>true);expect(h.spawned).toBe(1);for(let i=0;i<1200;i++)h.update(1/60,()=>true);expect(h.spawned).toBe(5);});
});
describe('pistola',()=>{
  it('aplica cadência e bloqueia pente vazio',()=>{const p=new Pistol();expect(p.fire()).toBe(true);expect(p.fire()).toBe(false);for(let i=0;i<7;i++){p.update(C.weapon.interval);expect(p.fire()).toBe(true);}p.update(1);expect(p.fire()).toBe(false);expect(p.ammo).toBe(0);});
  it('recarga transfere só munição disponível e impede tiros durante recarga',()=>{const p=new Pistol();p.ammo=1;p.reserve=3;expect(p.reload()).toBe(true);expect(p.fire()).toBe(false);p.update(C.weapon.reload);expect(p.ammo).toBe(4);expect(p.reserve).toBe(0);expect(p.reload()).toBe(false);});
  it('respeita limite da reserva no amanhecer',()=>{const p=new Pistol();for(let i=0;i<10;i++)p.resupply();expect(p.reserve).toBe(C.weapon.maxReserve);});
});
describe('vida',()=>{
  it('limita dano por imunidade e não revive mortos',()=>{const h=new Health();expect(h.damage(14)).toBe(true);expect(h.damage(14)).toBe(false);h.update(1);h.damage(100);expect(h.value).toBe(0);h.heal(50);expect(h.dead).toBe(true);});
  it('nova partida começa sem estado anterior',()=>{const h=new Health();h.damage(100);const fresh=new Health();expect(fresh.value).toBe(100);expect(new Pistol().ammo).toBe(8);expect(new DayCycle().day).toBe(1);});
});
