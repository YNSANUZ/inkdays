export const C = {
  fixedStep: 1 / 60, maxSteps: 6,
  player: { health: 100, speed: 5, runSpeed: 8, crouchSpeed: 2.5, jump: 7, gravity: 21, radius: .42, acceleration: 16, hurtInvulnerability: .65 },
  camera: { sensitivity: .002, distance: 5.2, shoulder: .85, height: 1.7, minPitch: -.3, maxPitch: .85, smoothing: 18, radius: .28, fov: 62 },
  day: { duration: 40, hordeDuration: 20, warning: 10, baseEnemies: 5, enemyGrowth: 2, maxEnemies: 55, bossInterval: 10, dawnHeal: 15, dawnAmmo: 24, spawnInterval: 1.8 },
  enemy: { health: 48, healthGrowth: 2, maxHealth: 90, speed: 2.7, speedGrowth: .055, maxSpeed: 4.3, damage: 14, attackRange: 1.35, attackCooldown: 1.1, detection: 70, radius: .48, reward: 20, spawnMin: 13, spawnMax: 20 },
  boss: { name: 'O COLOSSO', health: 1200, healthGrowth: 300, partyGrowth: .45, speed: 2.15, damage: 30, attackRange: 2.25, attackCooldown: 1.45, radius: .9, reward: 500, scale: 2.15, slamRadius: 4.2, slamDamage: 42, slamWindup: 1.25, slamCooldown: 6.5, slamTriggerRange: 7, slamKnockback: 11, slamLift: 5.2 },
  weapon: { damage: 26, interval: .24, magazine: 8, reserve: 48, maxReserve: 96, reload: 1.25, range: 80 },
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
