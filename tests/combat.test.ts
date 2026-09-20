import {describe,it,expect} from 'vitest';
import {Vector3} from 'three';
import {CombatAuthority} from '../src/network/CombatAuthority';
import {parseInput} from '../src/network/Protocol';
import {C} from '../src/config/gameplay';
const packet=(sequence:number,fire=false,reload=false)=>({version:1,sequence,yaw:0,pitch:0,command:{x:0,z:0,run:false,crouch:false,jump:false,fire,reload}});
describe('combate controlado pelo servidor',()=>{
  it('compra munição proporcional perto do baú e deduplica a solicitação',()=>{
    const a=new CombatAuthority();a.join('a');
    const participant=(a as unknown as {players:Map<string,{money:number;weapon:{reserve:number};player:{position:Vector3}}>}).players.get('a')!;
    participant.money=100;participant.weapon.reserve=C.weapon.maxReserve-3;participant.player.position.set(0,0,4);
    expect(a.purchaseAmmo('a','buy-1')).toEqual({ok:true,reason:'ok',rounds:3,cost:8});
    expect(a.purchaseAmmo('a','buy-1')).toEqual({ok:true,reason:'ok',rounds:3,cost:8});
    expect(a.snapshot().players[0]).toMatchObject({money:92,reserve:C.weapon.maxReserve});
  });
  it('rejeita compra distante sem alterar dinheiro ou munição',()=>{
    const a=new CombatAuthority();a.join('a');const participant=(a as unknown as {players:Map<string,{money:number;weapon:{reserve:number}}>}).players.get('a')!;participant.money=100;participant.weapon.reserve=0;
    expect(a.purchaseAmmo('a','far')).toMatchObject({ok:false,reason:'distant'});expect(a.snapshot().players[0]).toMatchObject({money:100,reserve:0});
  });
  it('permite somente uma coleta autoritativa do mesmo drop',()=>{
    const a=new CombatAuthority();a.join('a');a.join('b');for(let n=0;n<600;n++)a.step();const drop=a.snapshot().ammoDrops[0];expect(drop).toBeTruthy();
    const participants=(a as unknown as {players:Map<string,{weapon:{reserve:number};player:{position:Vector3}}>}).players;for(const p of participants.values()){p.weapon.reserve=0;p.player.position.set(drop.x,0,drop.z);}
    const first=a.pickupAmmo('a',drop.id),second=a.pickupAmmo('b',drop.id);expect([first.ok,second.ok]).toEqual([true,false]);expect(a.snapshot().players.reduce((sum,p)=>sum+p.reserve,0)).toBe(C.ammoDrops.rounds);
  });
  it('mantém participante do lobby fora da simulação até ficar pronto',()=>{const a=new CombatAuthority();a.join('a');expect(a.setReady('a',false)).toBe(true);const remaining=a.cycle.remaining;for(let n=0;n<120;n++)a.step();expect(a.cycle.remaining).toBe(remaining);expect(a.snapshot().players[0].ready).toBe(false);expect(a.setReady('a')).toBe(true);a.step();expect(a.cycle.remaining).toBeLessThan(remaining);expect(a.snapshot().players[0].ready).toBe(true);});
  it('protege entrada tardia contra ataques até o prazo autoritativo terminar',()=>{const a=new CombatAuthority();a.join('a');a.setReady('a',false);a.setReady('a',true);a.enemies.spawn(1,new Vector3(0,0,10));const enemy=a.enemies.active[0];enemy.avatar.root.position.set(0,0,9);enemy.speed=0;for(let n=0;n<120;n++)a.step();expect(a.snapshot().players[0].health).toBe(100);expect(a.snapshot().players[0].protection).toBeGreaterThan(0);for(let n=0;n<180;n++)a.step();expect(a.snapshot().players[0].protection).toBe(0);expect(a.snapshot().players[0].health).toBeLessThan(100);});
  it('aceita oito participantes com spawns e nomes distintos e recusa o nono',()=>{const a=new CombatAuthority();for(let n=0;n<8;n++)expect(a.join(`p${n}`)).toBe(true);expect(a.join('p8')).toBe(false);const players=a.snapshot().players;expect(new Set(players.map(player=>`${player.position.x}:${player.position.z}`)).size).toBe(8);expect(new Set(players.map(player=>player.name)).size).toBe(8);});
  it('rejeita mira inválida e controla munição, cadência e recarga por jogador',()=>{
    expect(parseInput({...packet(0),pitch:Infinity})).toBeNull();
    const a=new CombatAuthority();a.join('a');a.join('b');
    a.receive('a',packet(0,true));a.step();expect(a.snapshot().players.map(p=>p.ammo)).toEqual([7,8]);
    for(let n=1;n<10;n++){a.receive('a',packet(n,true));a.step();}expect(a.snapshot().players[0].ammo).toBe(7);
    a.receive('a',packet(10,false,true));for(let n=0;n<80;n++)a.step();
    expect(a.snapshot().players[0]).toMatchObject({ammo:8,reserve:71});
  });
  it('não mantém o gatilho preso quando novos comandos deixam de chegar',()=>{const a=new CombatAuthority();a.join('a');a.receive('a',packet(0,true));for(let n=0;n<120;n++)a.step();expect(a.snapshot().players[0].ammo).toBe(7);});
  it('deduplica o identificador confiável de um clique rápido',()=>{const a=new CombatAuthority();a.join('a');const shot=(sequence:number,shotId:number)=>({...packet(sequence),shotId});a.receive('a',shot(0,7));a.step();expect(a.snapshot().players[0].ammo).toBe(7);for(let n=0;n<20;n++)a.step();a.receive('a',shot(1,7));a.step();expect(a.snapshot().players[0].ammo).toBe(7);a.receive('a',shot(2,8));a.step();expect(a.snapshot().players[0].ammo).toBe(6);});
  it('dois tiros matam um alvo e concedem a recompensa uma única vez',()=>{
    const a=new CombatAuthority();a.join('a');a.enemies.spawn(1,new Vector3(0,0,10));
    const enemy=a.enemies.active[0];enemy.avatar.root.position.set(.85,0,0);enemy.speed=0;
    a.receive('a',packet(0,true));a.step();expect(enemy.health).toBe(22);
    a.receive('a',packet(1,false));for(let n=0;n<16;n++)a.step();
    a.receive('a',packet(2,true));a.step();expect(a.enemies.active).toHaveLength(0);expect(a.snapshot().players[0]).toMatchObject({kills:1,money:20});
    for(let n=0;n<60;n++)a.step();expect(a.snapshot().players[0].money).toBe(20);
  });
  it('cria um chefão autoritativo no Dia 10 e paga sua recompensa ao autor da eliminação',()=>{
    const a=new CombatAuthority();a.join('a');a.join('b');a.cycle.day=10;a.cycle.remaining=0;a.step();
    const state=a.snapshot(),boss=a.enemies.active.find(enemy=>enemy.kind==='boss')!;
    expect(state.boss).toMatchObject({id:boss.id,name:'O COLOSSO',health:boss.health,maxHealth:boss.maxHealth});
    expect(boss.maxHealth).toBeGreaterThan(1200);expect(boss.avatar.root.scale.x).toBeGreaterThan(2);expect(boss.avatar.root.name).toBe('inkdays-boss');expect(boss.avatar.procedural.getObjectByName('colossus-mask')).toBeTruthy();
    boss.health=C.weapon.damage;boss.avatar.root.position.set(.85,0,0);boss.speed=0;
    a.receive('a',packet(0,true));a.step();
    expect(a.snapshot().boss).toBeNull();expect(a.snapshot().players[0]).toMatchObject({kills:1,money:C.boss.reward});expect(a.snapshot().players[1].money).toBe(0);
  });
  it('publica o mesmo resumo autoritativo somente após eliminar toda a horda',()=>{const a=new CombatAuthority();a.join('a');a.join('b');const player=(a as unknown as {players:Map<string,{player:{health:{damage:(amount:number)=>boolean}}}>}).players.get('b')!;player.player.health.damage(100);a.cycle.remaining=0;a.step();for(let n=0;n<1200&&a.cycle.day===1;n++){a.enemies.clear();a.step();}expect(a.snapshot()).toMatchObject({day:2,phase:'day',dayResult:{serial:1,day:1,kills:0,money:0,survivors:1,players:2,nextBoss:10}});});
  it('coloca o chefão em fúria abaixo de metade da vida',()=>{const a=new CombatAuthority();a.join('a');expect(a.enemies.spawnBoss(10,new Vector3(0,0,10))).toBe(true);const boss=a.enemies.active[0],speed=boss.speed,cooldown=boss.attackCooldown,damage=boss.damage;a.enemies.damage(boss,boss.maxHealth/2);expect(boss).toMatchObject({enraged:true});expect(boss.speed).toBeGreaterThan(speed);expect(boss.attackCooldown).toBeLessThan(cooldown);expect(boss.damage).toBeGreaterThan(damage);expect(a.snapshot().boss?.enraged).toBe(true);});
  it('avisa o impacto do Colosso e aplica dano e impulso somente pelo servidor',()=>{const a=new CombatAuthority();a.join('a');a.join('b');a.enemies.spawnBoss(10,new Vector3(0,0,10));const boss=a.enemies.active[0];boss.avatar.root.position.set(1,0,10);boss.speed=0;boss.specialCooldown=0;a.step();const warning=a.snapshot().boss?.slam;expect(warning).toMatchObject({serial:1,radius:C.boss.slamRadius});expect(warning!.remaining).toBeGreaterThan(1);expect(a.snapshot().impacts).toHaveLength(0);for(let n=0;n<75;n++)a.step();const state=a.snapshot(),players=state.players;expect(players[0].health).toBe(100-C.boss.slamDamage);expect(players[1].health).toBe(100-C.boss.slamDamage);expect(players[0].velocity.x).toBeLessThan(0);expect(players[1].velocity.x).toBeGreaterThan(0);expect(players.every(player=>player.vertical===C.boss.slamLift)).toBe(true);expect(state.boss?.slam).toBeNull();expect(state.impacts).toHaveLength(1);expect(state.impacts[0]).toMatchObject({serial:1,bossId:boss.id,position:{x:1,y:0,z:10},radius:C.boss.slamRadius});expect(state.impacts[0].tick).toBeGreaterThan(1);});
  it('faz a colisão do mundo conter o impulso do chefão nos limites do mapa',()=>{const a=new CombatAuthority();a.join('a');a.enemies.spawnBoss(10,new Vector3(0,0,10));const boss=a.enemies.active[0];boss.speed=0;a.step();const player=boss.target!;player.position.set(0,0,C.world.radius-C.player.radius);boss.avatar.root.position.set(0,0,player.position.z-1);boss.specialCooldown=0;a.step();for(let n=0;n<150;n++)a.step();expect(Math.hypot(player.position.x,player.position.z)).toBeLessThanOrEqual(C.world.radius-C.player.radius+.001);});
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
  it('não permite acertar inimigo que ainda não existia no tick visto',()=>{const a=new CombatAuthority();a.join('a');a.step();const viewedTick=a.tick;a.enemies.spawn(1,new Vector3(0,0,10));const enemy=a.enemies.active[0];enemy.avatar.root.position.set(.85,0,0);enemy.speed=0;a.receive('a',{...packet(0,true),viewTick:viewedTick});a.step();expect(enemy.health).toBe(48);expect(a.snapshot().shots.at(-1)).toMatchObject({hit:false,rewindTicks:1});});
  it('rejeita visão futura e não permite regredir o tick já apresentado',()=>{const a=new CombatAuthority();a.join('a');a.enemies.spawn(1,new Vector3(0,0,10));const enemy=a.enemies.active[0];enemy.speed=0;enemy.avatar.root.position.set(.85,0,0);a.step();const favorable=a.tick;enemy.avatar.root.position.set(10,0,0);a.step();const newer=a.tick;expect(a.receive('a',{...packet(0),viewTick:a.tick+100})).toBe(false);expect(a.receive('a',{...packet(0,true),viewTick:newer})).toBe(true);a.step();expect(a.snapshot().shots.at(-1)?.hit).toBe(false);for(let n=0;n<20;n++)a.step();expect(a.receive('a',{...packet(1,true),viewTick:favorable})).toBe(true);a.step();expect(a.snapshot().shots.at(-1)?.hit).toBe(false);expect(enemy.health).toBe(48);});
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
  it('reinicia toda a partida sem trocar identidades ou regredir o tick',()=>{
    const a=new CombatAuthority();a.join('a');a.join('b');a.enemies.spawn(1,new Vector3(0,0,10));const enemy=a.enemies.active[0];enemy.avatar.root.position.set(.85,0,0);enemy.speed=0;
    a.receive('a',packet(0,true));a.step();for(let n=1;n<16;n++){a.receive('a',packet(n));a.step();}a.receive('a',packet(16,true));a.step();
    a.enemies.spawn(1,new Vector3(1,0,10));a.enemies.active[0].avatar.root.position.set(1,0,10);a.enemies.active[0].speed=0;a.enemies.active[0].cooldown=0;
    for(let n=0;n<1500&&!a.snapshot().gameOver;n++)a.step();expect(a.snapshot().gameOver).toBe(true);
    const tick=a.tick,round=a.snapshot().round;expect(a.restart('a')).toBe(true);expect(a.restart('b')).toBe(false);expect(a.tick).toBe(tick);
    expect(a.snapshot()).toMatchObject({round:round+1,day:1,phase:'day',gameOver:false,enemies:[],shots:[],players:[{id:'a',health:100,ammo:8,reserve:72,kills:0,money:0},{id:'b',health:100,ammo:8,reserve:72,kills:0,money:0}]});
  });
  it('atribui inimigos diferentes aos dois jogadores vivos mais próximos',()=>{
    const a=new CombatAuthority();a.join('a');a.join('b');a.enemies.spawn(1,new Vector3(0,0,10));a.enemies.spawn(1,new Vector3(2,0,10));
    a.enemies.active[0].avatar.root.position.set(0,0,7);a.enemies.active[1].avatar.root.position.set(2,0,7);for(const enemy of a.enemies.active)enemy.speed=0;a.step();
    expect(a.snapshot().enemies.map(enemy=>enemy.targetId)).toEqual(['a','b']);expect(a.snapshot().enemies.every(enemy=>enemy.state==='CHASE')).toBe(true);
  });
  it('troca o alvo ao suspender e retomar o jogador mais próximo',()=>{
    const a=new CombatAuthority();a.join('a');a.join('b');a.enemies.spawn(1,new Vector3(0,0,10));const enemy=a.enemies.active[0];enemy.avatar.root.position.set(0,0,7);enemy.speed=0;a.step();expect(a.snapshot().enemies[0].targetId).toBe('a');
    a.suspend('a');a.step();expect(a.snapshot().enemies[0].targetId).toBe('b');a.resume('a');for(let n=0;n<20;n++)a.step();expect(a.snapshot().enemies[0].targetId).toBe('a');
  });
  it('remove jogador morto da seleção de alvo no passo seguinte',()=>{
    const a=new CombatAuthority();a.join('a');a.join('b');a.enemies.spawn(1,new Vector3(0,0,10));const enemy=a.enemies.active[0];enemy.avatar.root.position.set(0,0,9);enemy.speed=0;enemy.cooldown=0;
    for(let n=0;n<900&&a.snapshot().players[0].health>0;n++)a.step();expect(a.snapshot().players[0].health).toBe(0);a.step();expect(a.snapshot().enemies[0].targetId).toBe('b');expect(a.snapshot().gameOver).toBe(false);
  });
  it('publica WANDER sem alvo quando o Borrão está fora da percepção',()=>{const a=new CombatAuthority();a.join('a');a.enemies.spawn(1,new Vector3(0,0,10));const enemy=a.enemies.active[0];enemy.avatar.root.position.set(0,0,10+C.enemy.detection+2);a.step();expect(a.snapshot().enemies[0]).toMatchObject({state:'WANDER',targetId:null});});
  it('permite reviver imediatamente em modo de teste sem reiniciar a partida',()=>{
    const a=new CombatAuthority();a.join('a');a.join('b');const player=a.snapshot().players[0];a.enemies.spawn(1,new Vector3(0,0,10));const enemy=a.enemies.active[0];enemy.avatar.root.position.copy(player.position).add(new Vector3(0,0,-1));enemy.speed=0;enemy.cooldown=0;
    for(let n=0;n<900&&a.snapshot().players[0].health>0;n++)a.step();const round=a.snapshot().round;expect(a.snapshot().players[0].health).toBe(0);expect(a.revive('a')).toBe(true);expect(a.revive('a')).toBe(false);expect(a.snapshot()).toMatchObject({round,gameOver:false});expect(a.snapshot().players.find(player=>player.id==='a')).toMatchObject({health:100,position:{x:0,y:0,z:10}});
  });
  it('permite que um aliado vivo reviva o companheiro somente de perto',()=>{
    const a=new CombatAuthority();a.join('a');a.join('b');const players=(a as unknown as {players:Map<string,{player:{position:Vector3;health:{damage:(amount:number)=>boolean}}}>}).players,target=players.get('b')!;target.player.health.damage(100);target.player.position.set(8,0,10);
    expect(a.reviveAlly('a','b')).toBe(false);target.player.position.set(2.5,0,10);expect(a.reviveAlly('a','b')).toBe(true);expect(a.snapshot().players.find(player=>player.id==='b')).toMatchObject({health:100,position:{x:2.5,y:0,z:10}});expect(a.reviveAlly('a','b')).toBe(false);
  });
});
