import {describe,it,expect} from 'vitest';
import {Vector3} from 'three';
import {CombatAuthority} from '../src/network/CombatAuthority';
import {parseInput} from '../src/network/Protocol';
const packet=(sequence:number,fire=false,reload=false)=>({version:1,sequence,yaw:0,pitch:0,command:{x:0,z:0,run:false,crouch:false,jump:false,fire,reload}});
describe('combate controlado pelo servidor',()=>{
  it('rejeita mira inválida e controla munição, cadência e recarga por jogador',()=>{
    expect(parseInput({...packet(0),pitch:Infinity})).toBeNull();
    const a=new CombatAuthority();a.join('a');a.join('b');
    a.receive('a',packet(0,true));a.step();expect(a.snapshot().players.map(p=>p.ammo)).toEqual([7,8]);
    for(let n=1;n<10;n++){a.receive('a',packet(n,true));a.step();}expect(a.snapshot().players[0].ammo).toBe(7);
    a.receive('a',packet(10,false,true));for(let n=0;n<80;n++)a.step();
    expect(a.snapshot().players[0]).toMatchObject({ammo:8,reserve:47});
  });
  it('dois tiros matam um alvo e concedem a recompensa uma única vez',()=>{
    const a=new CombatAuthority();a.join('a');a.enemies.spawn(1,new Vector3(0,0,10));
    const enemy=a.enemies.active[0];enemy.avatar.root.position.set(.85,0,0);enemy.speed=0;
    a.receive('a',packet(0,true));a.step();expect(enemy.health).toBe(22);
    a.receive('a',packet(1,false));for(let n=0;n<16;n++)a.step();
    a.receive('a',packet(2,true));a.step();expect(a.enemies.active).toHaveLength(0);expect(a.snapshot().players[0]).toMatchObject({kills:1,money:20});
    for(let n=0;n<60;n++)a.step();expect(a.snapshot().players[0].money).toBe(20);
  });
  it('cobertura bloqueia disparo e não concede recompensa',()=>{
    const a=new CombatAuthority();a.join('a');a.enemies.spawn(1,new Vector3(0,0,10));
    const enemy=a.enemies.active[0];enemy.avatar.root.position.set(.85,0,0);enemy.speed=0;
    // Move an existing collision volume onto the firing line.
    a.world.solids[0].position.set(.85,1,5);a.world.solids[0].updateMatrixWorld(true);
    a.receive('a',packet(0,true));a.step();expect(enemy.health).toBe(48);expect(a.snapshot().players[0].money).toBe(0);
  });
  it('compensa a posição histórica vista sem deixar o inimigo no passado',()=>{
    const a=new CombatAuthority();a.join('a');a.enemies.spawn(1,new Vector3(0,0,10));const enemy=a.enemies.active[0];enemy.avatar.root.position.set(.85,0,0);enemy.speed=0;
    a.step();const viewedTick=a.tick;enemy.avatar.root.position.set(10,0,0);a.receive('a',{...packet(0,true),viewTick:viewedTick});a.step();
    expect(enemy.health).toBe(22);expect(enemy.avatar.root.position.x).toBe(10);
  });
  it('pacotes duplicados não duplicam dano nem recompensa',()=>{
    const a=new CombatAuthority();a.join('a');a.enemies.spawn(1,new Vector3(0,0,10));const enemy=a.enemies.active[0];enemy.avatar.root.position.set(.85,0,0);enemy.speed=0;
    expect(a.receive('a',packet(0,true))).toBe(true);expect(a.receive('a',packet(0,true))).toBe(false);a.step();expect(enemy.health).toBe(22);
    for(let n=1;n<16;n++){a.receive('a',packet(n));a.step();}expect(a.receive('a',packet(16,true))).toBe(true);expect(a.receive('a',packet(16,true))).toBe(false);a.step();
    expect(a.snapshot().players[0]).toMatchObject({kills:1,money:20});expect(a.enemies.active).toHaveLength(0);
  });
  it('mantém dois jogadores e o ciclo único durante vários dias simulados',()=>{
    const a=new CombatAuthority();a.join('a');a.join('b');for(let n=0;n<10800;n++){a.enemies.clear();a.step();}
    const state=a.snapshot();expect(state).toMatchObject({day:4,phase:'day'});expect(new Set(state.players.map(p=>p.id)).size).toBe(2);expect(new Set(state.enemies.map(e=>e.id)).size).toBe(state.enemies.length);
  });
  it('protege jogador desconectado e congela o ciclo quando todos estão suspensos',()=>{
    const a=new CombatAuthority();a.join('a');a.join('b');a.suspend('a');const disconnected=a.snapshot().players.find(p=>p.id==='a')!;expect(disconnected.connected).toBe(false);
    a.enemies.spawn(1,new Vector3(0,0,10));a.enemies.active[0].avatar.root.position.copy(disconnected.position).add(new Vector3(0,0,-1));a.enemies.active[0].cooldown=0;for(let n=0;n<180;n++)a.step();expect(a.snapshot().players.find(p=>p.id==='a')!.health).toBe(100);
    a.suspend('b');const remaining=a.cycle.remaining;for(let n=0;n<180;n++)a.step();expect(a.cycle.remaining).toBe(remaining);a.resume('a');a.step();expect(a.cycle.remaining).toBeLessThan(remaining);expect(a.snapshot().players.find(p=>p.id==='a')!.connected).toBe(true);
  });
  it('avança preparação e horda; sala vazia reinicia e morte encerra a partida',()=>{
    const a=new CombatAuthority();a.join('a');a.join('b');
    for(let n=0;n<2400;n++)a.step();expect(a.snapshot().phase).toBe('horde');expect(a.snapshot().enemies.length).toBeGreaterThan(0);
    for(let n=0;n<1200;n++){a.enemies.clear();a.step();}expect(a.snapshot()).toMatchObject({day:2,phase:'day'});
    a.leave('a');a.leave('b');a.join('a');expect(a.snapshot()).toMatchObject({day:1,phase:'day'});
    a.enemies.spawn(1,new Vector3(0,0,10));a.enemies.active[0].avatar.root.position.set(0,0,9);a.enemies.active[0].cooldown=0;
    for(let n=0;n<700;n++)a.step();expect(a.snapshot().gameOver).toBe(true);
    const time=a.cycle.remaining;for(let n=0;n<60;n++)a.step();expect(a.cycle.remaining).toBe(time);
  });
});
