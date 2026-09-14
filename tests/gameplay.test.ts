import { describe,it,expect } from 'vitest';
import { C,difficulty,hordeCount,hordePlan,nextBoss } from '../src/config/gameplay';
import { DayCycle } from '../src/daycycle/DayCycle';
import { Health } from '../src/health/Health';
import { Pistol } from '../src/weapons/Pistol';
import { Horde } from '../src/horde/Horde';
describe('ciclo de sobrevivência',()=>{
  it('entra na horda pelo tempo, mas só amanhece por conclusão explícita',()=>{const d=new DayCycle();for(let i=0;i<1800;i++)d.update(1/60);expect(d.remaining).toBeCloseTo(10);for(let i=0;i<600;i++)d.update(1/60);expect(d.phase).toBe('horde');for(let i=0;i<6000;i++)d.update(1/60);expect(d).toMatchObject({phase:'horde',day:1,remaining:0});expect(d.completeHorde()).toBe('dawn');expect(d).toMatchObject({phase:'day',day:2,remaining:C.day.duration});});
  it('escala 5, 7, 9 sem crescimento ilimitado de vida ou velocidade',()=>{expect([1,2,3].map(d=>difficulty(d).count)).toEqual([5,7,9]);expect(difficulty(2).speed).toBeGreaterThan(difficulty(1).speed);expect(difficulty(1000).health).toBe(C.enemy.maxHealth);expect(difficulty(1000).count).toBe(C.day.maxEnemies);});
  it('dimensiona a horda pela equipe sem ultrapassar o limite',()=>{expect([1,2,4,8].map(players=>hordeCount(1,players))).toEqual([5,7,12,21]);expect(hordeCount(1000,8)).toBe(C.day.maxEnemies);expect(hordeCount(1,99)).toBe(21);expect(hordeCount(1,Number.NaN)).toBe(5);});
  it('agenda chefões em múltiplos de dez',()=>{expect([1,9,10,11,20,21].map(nextBoss)).toEqual([10,10,10,20,20,30]);});
  it('concentra o balanceamento dos dias 1 a 10',()=>{expect([1,2,3,4,5,6,7,8,9].map(day=>hordePlan(day))).toEqual([
    {total:8,waves:[4,4],maxInterval:28,maxActive:7,boss:false},{total:12,waves:[4,4,4],maxInterval:27,maxActive:8,boss:false},{total:15,waves:[5,5,5],maxInterval:26,maxActive:10,boss:false},
    {total:18,waves:[6,6,6],maxInterval:25,maxActive:12,boss:false},{total:21,waves:[7,7,7],maxInterval:24,maxActive:13,boss:false},{total:24,waves:[6,6,6,6],maxInterval:23,maxActive:14,boss:false},
    {total:28,waves:[7,7,7,7],maxInterval:22,maxActive:16,boss:false},{total:32,waves:[8,8,8,8],maxInterval:21,maxActive:18,boss:false},{total:36,waves:[9,9,9,9],maxInterval:20,maxActive:20,boss:false},
  ]);expect(hordePlan(10)).toEqual({total:30,waves:[6,6,8,10],maxInterval:28,maxActive:18,boss:true});});
  it('antecipa a próxima leva após eliminar rapidamente a atual',()=>{const h=new Horde();let active=0;h.begin(1);for(let i=0;i<240;i++)h.update(1/60,active,()=>{active++;return true;});expect(h.spawned).toBe(4);active=0;for(let i=0;i<260;i++)h.update(1/60,active,()=>{active++;return true;});expect(h.spawned).toBe(4);for(let i=0;i<20;i++)h.update(1/60,active,()=>{active++;return true;});expect(h.spawned).toBeGreaterThan(4);});
  it('acumula a próxima leva no prazo e respeita o máximo simultâneo',()=>{const h=new Horde();let active=0;h.begin(5);for(let i=0;i<3600;i++)h.update(1/60,active,()=>{active++;return true;});expect(h.spawned).toBe(13);expect(active).toBe(13);expect(h.state(active)).toMatchObject({total:21,remaining:21,active:13});});
  it('conta ativos e fila no total restante e exige a última morte',()=>{const h=new Horde();let active=0;h.begin(1);for(let i=0;i<180;i++)h.update(1/60,active,()=>{active++;return true;});expect(h.state(active)).toMatchObject({spawned:4,active:4,remaining:8});active=0;for(let i=0;i<600;i++)h.update(1/60,active,()=>{active++;return true;});expect(h.spawned).toBe(8);active=1;expect(h.state(active).remaining).toBe(1);expect(h.canComplete(99,active)).toBe(false);active=0;expect(h.canComplete(1,active)).toBe(false);expect(h.canComplete(.6,active)).toBe(true);});
  it('libera reforços do chefão nas quatro fases configuradas',()=>{const h=new Horde();let active=0;h.begin(10);const run=(ratio:number|null,seconds=3)=>{for(let i=0;i<seconds*60;i++)h.update(1/60,active,()=>{active++;return true;},ratio);};run(1);expect(h.spawned).toBe(5);run(.74);expect(h.state(active).wave).toBe(2);active=0;run(.49);expect(h.state(active).wave).toBe(3);active=0;run(.24,11);expect(h.state(active)).toMatchObject({wave:4,total:30,spawned:30});});
  it('ativa auxílio apenas para os últimos inimigos demorados',()=>{const h=new Horde();let active=0;h.begin(1);for(let i=0;i<240;i++)h.update(1/60,active,()=>{active++;return true;});active=0;for(let i=0;i<600;i++)h.update(1/60,active,()=>{active++;return true;});expect(h.spawned).toBe(8);active=3;for(let i=0;i<2101;i++)h.update(1/60,active,()=>false);expect(h.state(active)).toMatchObject({remaining:3,assist:true});});
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
