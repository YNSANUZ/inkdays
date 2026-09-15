import { pistolGameplay } from '../weapons/Categories';
export const C = {
  fixedStep: 1 / 60, maxSteps: 6,
  player: { health: 100, speed: 5, runSpeed: 8, crouchSpeed: 2.5, jump: 7, gravity: 21, radius: .42, acceleration: 16, hurtInvulnerability: .65, reviveRange: 2.6, spawnProtection: 3 },
  camera: { sensitivity: .002, distance: 5.2, shoulder: .85, height: 1.7, minPitch: -.3, maxPitch: .85, smoothing: 18, radius: .28, fov: 62 },
  day: { duration: 40, hordeDuration: 20, warning: 10, baseEnemies: 5, enemyGrowth: 2, maxEnemies: 55, bossInterval: 10, dawnHeal: 15, dawnAmmo: 120, spawnInterval: .65 },
  horde: { clearWaveDelay: 4.5, completionDelay: 1.5, lastEnemyAssist: 35, partyGrowth: .45 },
  bossWaves: { thresholds: [1,.75,.5,.25], sizes: [6,6,8,10], maxActive: 18, maxInterval: 28 },
  enemy: { health: 48, healthGrowth: 2, maxHealth: 90, speed: 2.7, speedGrowth: .055, maxSpeed: 4.3, damage: 14, attackRange: 1.35, attackCooldown: 1.1, detection: 12, disengage: 18, perceptionInterval: .25, wanderSpeed: .34, wanderMin: 1.6, wanderMax: 4.2, pauseMin: .45, pauseMax: 1.4, radius: .48, reward: 20, spawnMin: 13, spawnMax: 20 },
  boss: { name: 'O COLOSSO', health: 1200, healthGrowth: 300, partyGrowth: .45, speed: 2.15, damage: 30, attackRange: 2.25, attackCooldown: 1.45, radius: .9, reward: 500, scale: 2.15, slamRadius: 4.2, slamDamage: 42, slamWindup: 1.25, slamCooldown: 6.5, slamTriggerRange: 7, slamKnockback: 11, slamLift: 5.2 },
  weapon: pistolGameplay,
  world: { radius: 43 },
  effects: { impactLife: .32, tracerLife: .06, flashLife: .055, damageLife: .28, maxParticles: 60 },
} as const;
export function difficulty(day: number) {
  const n = Math.max(0, Math.floor(day) - 1);
  return { count: Math.min(C.day.maxEnemies, C.day.baseEnemies + n * C.day.enemyGrowth), health: Math.min(C.enemy.maxHealth, C.enemy.health + n * C.enemy.healthGrowth), speed: Math.min(C.enemy.maxSpeed, C.enemy.speed + n * C.enemy.speedGrowth) };
}
export function hordeCount(day:number,players=1){
  const party=Number.isFinite(players)?Math.max(1,Math.min(8,Math.floor(players))):1;
  return Math.min(C.day.maxEnemies,Math.round(difficulty(day).count*(1+.45*(party-1))));
}
export const nextBoss = (day: number) => Math.ceil(Math.max(1, day) / C.day.bossInterval) * C.day.bossInterval;

export interface HordePlan {total:number;waves:number[];maxInterval:number;maxActive:number;boss:boolean}
const HORDE_PLANS:Record<number,Omit<HordePlan,'boss'>>={
  1:{total:8,waves:[4,4],maxInterval:28,maxActive:7},2:{total:12,waves:[4,4,4],maxInterval:27,maxActive:8},3:{total:15,waves:[5,5,5],maxInterval:26,maxActive:10},
  4:{total:18,waves:[6,6,6],maxInterval:25,maxActive:12},5:{total:21,waves:[7,7,7],maxInterval:24,maxActive:13},6:{total:24,waves:[6,6,6,6],maxInterval:23,maxActive:14},
  7:{total:28,waves:[7,7,7,7],maxInterval:22,maxActive:16},8:{total:32,waves:[8,8,8,8],maxInterval:21,maxActive:18},9:{total:36,waves:[9,9,9,9],maxInterval:20,maxActive:20},
};
export function hordePlan(day:number,players=1):HordePlan{
  const boss=day%C.day.bossInterval===0,base=boss?{total:30,waves:[...C.bossWaves.sizes],maxInterval:C.bossWaves.maxInterval,maxActive:C.bossWaves.maxActive}:HORDE_PLANS[Math.max(1,Math.min(9,Math.floor(day)))];
  const party=Math.max(1,Math.min(8,Math.floor(Number.isFinite(players)?players:1))),scale=1+C.horde.partyGrowth*(party-1),waves=base.waves.map(size=>Math.max(1,Math.round(size*scale))),total=waves.reduce((sum,size)=>sum+size,0);
  return {total,waves,maxInterval:base.maxInterval,maxActive:Math.min(C.day.maxEnemies,Math.round(base.maxActive*scale)),boss};
}
