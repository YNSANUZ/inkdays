# Drawn Weapon Workshop and Ammo Economy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the central preparation-phase workshop, server-authoritative ammo purchases and world drops, and a validated pistol drawing editor shared by solo and multiplayer.

**Architecture:** Pure economy and drawing-rule modules define all prices, capacities, validation, simplification, and idempotent transactions. `CombatAuthority` owns multiplayer money, weapon definitions, and ammo drops; solo uses the same modules locally. Frequent snapshots carry only compact drop state and weapon references, while reliable messages carry complete weapon definitions only when needed.

**Tech Stack:** TypeScript 5.9, Three.js 0.180, WebSocket `ws`, Vitest 4, Vite/PWA, CSS pointer events.

**Spec:** `docs/superpowers/specs/2026-09-19-drawn-weapon-workshop-design.md`

## Global Constraints

- The chest is usable only during `PREPARAÇÃO`; drops remain active during preparation and horde.
- Ammo costs $2.50 per received round, sells at most 24 rounds per request, rounds cost an integer dollar amount rounded upward, and reserve never exceeds `C.weapon.maxReserve`.
- Drops attempt to spawn every 10 seconds, expire after 10 seconds, grant 16 reserve rounds, and cap at three active drops.
- The server is authoritative for money, ammo, distance, life state, phase, drop creation, collection, expiry, and weapon revisions.
- Pistol drawings allow at most 24 strokes, 64 points per stroke, 1,024 total points, normalized coordinates in `[0,1]`, and width in `[0.012,0.065]`.
- Empty, non-finite, oversized, out-of-bounds, or structurally unreadable drawings are rejected without spending money.
- Frequent snapshots must never contain stroke point arrays; full definitions travel only on join/reconnect, revision change, or explicit request.
- Only the currently implemented pistol may be redrawn; future categories remain visible and disabled.
- Red remains reserved for health, damage, and enemies.
- Desktop mouse, pen, and mobile touch use one pointer-event drawing path, and resizing preserves normalized strokes.

## Review Focus

- A nearly full reserve must receive only the available rounds and pay the rounded proportional price; Task 1 pins this with `quotes a partial ammo package`.
- A duplicated request after packet retry or reconnect must return the original result without charging twice; Tasks 3 and 6 pin ammo and weapon idempotency.
- Two players racing for one drop must produce one winner and exactly one ammo increment; Task 3 pins atomic collection.
- Malicious `NaN`, infinite, oversized, or out-of-range drawing data must never enter state or snapshots; Task 5 pins every invalid class.
- Snapshot traffic must remain bounded when a detailed drawing exists; Task 7 asserts that point arrays are absent and measures encoded packet size.

---

### Task 1: Shared Ammo Pricing and Reserve Mutation

**Files:**
- Create: `src/economy/AmmoEconomy.ts`
- Modify: `src/weapons/Pistol.ts`
- Test: `tests/ammo-economy.test.ts`

**Interfaces:**
- Produces: `quoteAmmoPurchase(currentReserve: number, maxReserve: number): { rounds: number; cost: number }`.
- Produces: `Pistol.addReserve(rounds: number): number`, returning the rounds actually added.

- [ ] **Step 1: Write the failing pricing and capacity tests**

```ts
import {describe, expect, it} from 'vitest';
import {quoteAmmoPurchase} from '../src/economy/AmmoEconomy';
import {Pistol} from '../src/weapons/Pistol';

describe('ammo economy',()=>{
  it('quotes a full ammo package',()=>expect(quoteAmmoPurchase(0,120)).toEqual({rounds:24,cost:60}));
  it('quotes a partial ammo package',()=>expect(quoteAmmoPurchase(117,120)).toEqual({rounds:3,cost:8}));
  it('quotes nothing at full capacity',()=>expect(quoteAmmoPurchase(120,120)).toEqual({rounds:0,cost:0}));
  it('never lets reserve exceed capacity',()=>{const pistol=new Pistol();pistol.reserve=119;expect(pistol.addReserve(16)).toBe(1);expect(pistol.reserve).toBe(120);});
});
```

- [ ] **Step 2: Run the focused test and confirm the missing-module failure**

Run: `npm test -- tests/ammo-economy.test.ts`

Expected: FAIL because `AmmoEconomy` and `addReserve` do not exist.

- [ ] **Step 3: Implement the exact pricing rule and bounded reserve addition**

```ts
export const AMMO_PACKAGE=24;
export const AMMO_PRICE_PER_ROUND=2.5;
export function quoteAmmoPurchase(currentReserve:number,maxReserve:number){
  const rounds=Math.max(0,Math.min(AMMO_PACKAGE,Math.floor(maxReserve-currentReserve)));
  return {rounds,cost:Math.ceil(rounds*AMMO_PRICE_PER_ROUND)};
}
```

Add `addReserve(rounds:number)` to `Pistol`, accepting only finite positive values, flooring them, clamping to `C.weapon.maxReserve`, and returning the delta.

- [ ] **Step 4: Run the focused test**

Run: `npm test -- tests/ammo-economy.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/economy/AmmoEconomy.ts src/weapons/Pistol.ts tests/ammo-economy.test.ts
git commit -m "Add shared ammo economy rules"
```

### Task 2: Deterministic Authoritative Ammo Drop Director

**Files:**
- Create: `src/economy/AmmoDrops.ts`
- Modify: `src/config/gameplay.ts`
- Test: `tests/ammo-drops.test.ts`

**Interfaces:**
- Consumes: `Pistol.addReserve(rounds: number): number`.
- Produces: `AmmoDropSnapshot { id: number; x: number; z: number; remaining: number }`.
- Produces: `AmmoDropDirector.update(dt, players)`, `collect(dropId, player)`, `snapshot()`, and `reset()`.
- Player input shape: `{id:string; x:number; z:number; alive:boolean; ready:boolean; ammo:number; reserve:number}`.

- [ ] **Step 1: Write failing lifecycle tests**

```ts
it('spawns at ten seconds, expires ten seconds later, and never exceeds three',()=>{/* fixed RNG; advance exact durations; assert 1, 0, and <=3 */});
it('avoids occupied and recently used points',()=>{/* player on point zero; assert another point and cooldown */});
it('accelerates one nearby drop when every live player is empty',()=>{/* ammo=reserve=0; assert spawn before normal interval */});
it('ignores dead players when deciding emergency and collection',()=>{/* dead collector returns rejected */});
```

Use fixed points `[{x:-14,z:-6},{x:14,z:-5},{x:-11,z:13},{x:12,z:14},{x:0,z:-17},{x:19,z:5},{x:-19,z:4}]`, injected RNG, a 2.2 m player exclusion radius, a 1.8 m collection radius, and a two-point recent-history queue.

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- tests/ammo-drops.test.ts`

Expected: FAIL because `AmmoDropDirector` does not exist.

- [ ] **Step 3: Implement the state machine**

Create drops only when a live ready player exists; use stable numeric IDs; subtract `dt` from remaining life; remove expired drops; enforce three active items; choose eligible predefined points; and let `collect` remove a drop only after all validations succeed. Emergency spawn delay is 2 seconds and may run once per all-empty episode.

- [ ] **Step 4: Add exact atomic collection tests**

```ts
it('allows exactly one winner for simultaneous pickup',()=>{
  const first=director.collect(id,nearAlivePlayer);
  const second=director.collect(id,otherNearAlivePlayer);
  expect([first.ok,second.ok]).toEqual([true,false]);
});
it('rejects expired, missing, distant, dead, and full-reserve collectors',()=>{/* assert no removal and no ammo delta for every case */});
```

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- tests/ammo-drops.test.ts`

Expected: PASS.

```bash
git add src/economy/AmmoDrops.ts src/config/gameplay.ts tests/ammo-drops.test.ts
git commit -m "Add authoritative ammo drop lifecycle"
```

### Task 3: Multiplayer Ammo Authority and Reliable Commands

**Files:**
- Modify: `src/network/CombatAuthority.ts`
- Modify: `src/network/Server.ts`
- Modify: `tests/combat.test.ts`
- Modify: `tests/transport.test.ts`

**Interfaces:**
- Consumes: `quoteAmmoPurchase`, `AmmoDropDirector`, `Pistol.addReserve`.
- Produces: `CombatAuthority.purchaseAmmo(id, requestId)` and `CombatAuthority.pickupAmmo(id, dropId)`.
- Adds commands `{type:'ammo-purchase',requestId:string}` and `{type:'ammo-pickup',dropId:number}`.
- Workshop chest world position is `{x:0,z:4}` and interaction radius is `3.25` m.

- [ ] **Step 1: Add failing authority tests for valid and rejected purchases**

```ts
it('charges once and adds the quoted ammo only in preparation near the chest',()=>{/* place player at 0,4; set reserve; assert money/reserve */});
it.each(['horde','dead','distant','poor','full'])('rejects %s ammo purchase without mutation',condition=>{/* assert unchanged */});
it('returns the cached result for a duplicate request id without a second charge',()=>{/* call twice; assert one delta */});
```

- [ ] **Step 2: Add failing two-player pickup and snapshot tests**

```ts
it('awards one of two players racing for the same drop',()=>{/* both in range; two calls; total reserve delta is 16 */});
it('publishes the same authoritative drops to every player snapshot',()=>{/* assert stable id, position, remaining */});
```

- [ ] **Step 3: Run focused failures**

Run: `npm test -- tests/combat.test.ts tests/transport.test.ts`

Expected: FAIL because authority methods and routes are absent.

- [ ] **Step 4: Integrate drops and idempotent purchase results into `CombatAuthority`**

Maintain a bounded per-participant map of the latest 64 request results. Validate connection, readiness, life, preparation phase, chest distance, reserve space, and money before an atomic money/reserve mutation. Run `AmmoDropDirector.update` from `step`; expose compact drops in `snapshot`; reset it on empty-room reset and restart.

- [ ] **Step 5: Route strict command shapes in `Server.ts`**

Extend `ServerAuthority` with the two optional methods. Accept only exact keys, a request ID of 1–64 printable characters, and safe nonnegative integer drop IDs. Return `{type:'transaction',requestId,ok,reason,rounds,cost}` for purchases and `{type:'pickup-result',dropId,ok,rounds}` for collection.

- [ ] **Step 6: Test malformed transport packets and commit**

Run: `npm test -- tests/combat.test.ts tests/transport.test.ts`

Expected: PASS, including malformed/duplicate commands and the two-player race.

```bash
git add src/network/CombatAuthority.ts src/network/Server.ts tests/combat.test.ts tests/transport.test.ts
git commit -m "Make ammo economy server authoritative"
```

### Task 4: Workshop Chest and Ammo Drop World Presentation

**Files:**
- Create: `src/world/WorkshopChest.ts`
- Create: `src/world/AmmoDropView.ts`
- Modify: `src/world/World.ts`
- Test: `tests/gameplay.test.ts`

**Interfaces:**
- Produces: `WorkshopChest.root`, `WorkshopChest.position`, `WorkshopChest.setAvailable(boolean)`.
- Produces: `AmmoDropView.sync(drops)` and `AmmoDropView.update(dt)`.

- [ ] **Step 1: Write failing semantic scene tests**

```ts
it('builds a brown outlined chest at the authoritative center',()=>{/* assert root name, x=0,z=4, brown body, dark hardware */});
it('creates one floating pickup per drop and removes stale meshes',()=>{/* sync two then one; assert child counts and ids */});
```

- [ ] **Step 2: Run focused failures**

Run: `npm test -- tests/gameplay.test.ts`

Expected: FAIL because both view classes are missing.

- [ ] **Step 3: Build lightweight outlined meshes**

Use low-poly boxes/cylinders, `createInkMaterial`, existing outline helpers, shared geometries/materials, and no per-frame allocation. The chest uses muted brown `#6b4c2f`; ammo uses off-white, black, and brass `#9a7b43`. `setAvailable(false)` keeps the chest visible and closes its prompt state.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- tests/gameplay.test.ts`

Expected: PASS.

```bash
git add src/world/WorkshopChest.ts src/world/AmmoDropView.ts src/world/World.ts tests/gameplay.test.ts
git commit -m "Add workshop chest and ammo drop visuals"
```

### Task 5: Drawing Validation and Simplification Rules

**Files:**
- Create: `src/weapons/WeaponWorkshopRules.ts`
- Test: `tests/weapon-workshop.test.ts`

**Interfaces:**
- Produces: `DrawPoint`, `DrawStroke`, `WeaponDrawing`, `ValidatedWeaponDrawing`.
- Produces: `simplifyStroke(points, tolerance)`, `validatePistolDrawing(value)`, and palette constant `WEAPON_COLORS`.

- [ ] **Step 1: Write failing limit, zone, and hostile-input tests**

```ts
it('accepts a finite pistol drawing touching grip, body, and barrel zones',()=>{/* assert normalized validated output */});
it.each(['empty','nan','infinite','out-of-range','too-wide','too-many-strokes','too-many-points','missing-zone'])('rejects %s drawings',kind=>{/* construct each payload; expect failure */});
it('simplifies a noisy straight stroke while preserving endpoints',()=>{/* expect fewer points and exact endpoints */});
it('does not offer pure red in the palette',()=>expect(WEAPON_COLORS).not.toContain('#ff0000'));
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- tests/weapon-workshop.test.ts`

Expected: FAIL because the rules module is absent.

- [ ] **Step 3: Implement strict structural validation**

Use explicit pistol zones: grip `{x:[.26,.46],y:[.50,.92]}`, body `{x:[.20,.70],y:[.30,.65]}`, barrel `{x:[.62,.94],y:[.28,.55]}`. Validate every number with `Number.isFinite`, simplify with perpendicular-distance tolerance `0.006`, then enforce all post-simplification limits. Return a discriminated result `{ok:true,drawing}` or `{ok:false,reason}`.

- [ ] **Step 4: Run and commit**

Run: `npm test -- tests/weapon-workshop.test.ts`

Expected: PASS.

```bash
git add src/weapons/WeaponWorkshopRules.ts tests/weapon-workshop.test.ts
git commit -m "Validate and simplify drawn pistol definitions"
```

### Task 6: Atomic Weapon Workshop State

**Files:**
- Create: `src/weapons/WeaponWorkshopState.ts`
- Modify: `src/network/CombatAuthority.ts`
- Modify: `src/network/Server.ts`
- Test: `tests/weapon-workshop-state.test.ts`
- Modify: `tests/transport.test.ts`

**Interfaces:**
- Consumes: `validatePistolDrawing` and validated drawing types.
- Produces: `WeaponReference {weaponId:string;category:'pistol';color:string;revision:number}`.
- Produces: `WeaponDefinition extends WeaponReference {drawing:ValidatedWeaponDrawing}`.
- Produces: `confirmRedraw(request, context)`, `definition(key)`, and `definitionsForJoin()`.

- [ ] **Step 1: Write failing atomicity and idempotency tests**

```ts
it('deducts $120 and increments revision only after valid confirmation',()=>{/* preview has no mutation; confirmation mutates once */});
it('replays a duplicate request id without charging or revising twice',()=>{/* same result and one debit */});
it.each(['horde','dead','distant','poor','future-category','invalid-drawing'])('rejects %s without mutation',reason=>{/* exact unchanged state */});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- tests/weapon-workshop-state.test.ts`

Expected: FAIL because workshop state is absent.

- [ ] **Step 3: Implement state and server command routes**

Accept `{type:'weapon-purchase',requestId,category:'pistol',color,drawing}` and `{type:'weapon-definition-request',weaponId,revision}`. Validate phase, position, life, category, drawing, palette, and money before one atomic mutation. Send reliable `weapon-definition` on join/reconnect, revision change, and explicit cache miss; never trust browser money or definitions.

- [ ] **Step 4: Add reconnect transport test**

```ts
it('restores the same money, weapon revision, and definition after reconnect',async()=>{/* confirm, reconnect with token, assert reference and definition */});
```

- [ ] **Step 5: Run and commit**

Run: `npm test -- tests/weapon-workshop-state.test.ts tests/transport.test.ts`

Expected: PASS.

```bash
git add src/weapons/WeaponWorkshopState.ts src/network/CombatAuthority.ts src/network/Server.ts tests/weapon-workshop-state.test.ts tests/transport.test.ts
git commit -m "Add authoritative drawn weapon transactions"
```

### Task 7: Compact Snapshot Codec and Client Definition Cache

**Files:**
- Modify: `src/network/SnapshotCodec.ts`
- Modify: `src/network/CoopPreview.ts`
- Create: `src/weapons/WeaponDefinitionCache.ts`
- Modify: `tests/snapshot-codec.test.ts`
- Modify: `tests/snapshot-client.test.ts`
- Modify: `tests/bandwidth.test.ts`

**Interfaces:**
- Consumes: compact `WeaponReference`, `WeaponDefinition`, and `AmmoDropSnapshot`.
- Produces: `WeaponDefinitionCache.put`, `get`, `missing`, and `fallback`.
- Packed snapshot adds `a` for drops and four scalar weapon-reference fields per player; it contains no drawing points.

- [ ] **Step 1: Add failing round-trip and traffic tests**

```ts
it('round-trips ammo drops and weapon references through keyframes and deltas',()=>{/* encode/decode exact values */});
it('never serializes drawing strokes in frequent snapshots',()=>expect(JSON.stringify(packet)).not.toContain('points'));
it('keeps a populated combat packet below the recorded pre-feature budget plus 180 bytes',()=>{/* eight players, three drops */});
it('uses the draft pistol and requests an unknown revision once',()=>{/* cache miss deduplicates request */});
```

- [ ] **Step 2: Run focused tests and record baseline bytes**

Run: `npm test -- tests/snapshot-codec.test.ts tests/snapshot-client.test.ts tests/bandwidth.test.ts`

Expected: FAIL for absent fields/cache; record existing fixture size in the test assertion before adding fields.

- [ ] **Step 3: Extend codec and cache without embedding definitions**

Represent each drop as `[id,qx,qz,remainingTicks]`; reuse existing position quantization. Encode player reference as `[weaponId,category,color,revision]`. `CoopPreview` applies reliable definitions to the cache, renders the fallback until available, and sends one definition request per missing key.

- [ ] **Step 4: Run and commit**

Run: `npm test -- tests/snapshot-codec.test.ts tests/snapshot-client.test.ts tests/bandwidth.test.ts`

Expected: PASS within the explicit byte budget.

```bash
git add src/network/SnapshotCodec.ts src/network/CoopPreview.ts src/weapons/WeaponDefinitionCache.ts tests/snapshot-codec.test.ts tests/snapshot-client.test.ts tests/bandwidth.test.ts
git commit -m "Synchronize workshop state with compact snapshots"
```

### Task 8: Responsive Workshop UI and Shared Solo Adapter

**Files:**
- Create: `src/ui/WeaponWorkshop.ts`
- Create: `src/weapons/WeaponWorkshopController.ts`
- Modify: `src/game/Game.ts`
- Modify: `src/network/CoopPreview.ts`
- Modify: `src/input/TouchControls.ts`
- Modify: `src/style.css`
- Modify: `src/touch.css`
- Modify: `tests/touch.test.ts`
- Modify: `tests/weapon-workshop.test.ts`

**Interfaces:**
- Consumes: chest distance/phase, drawing rules, ammo quote, multiplayer commands, and solo local authority.
- Produces: `WeaponWorkshop.open(model)`, `close()`, `redraw()`, and pointer-normalization helpers.

- [ ] **Step 1: Add failing pure interaction tests**

```ts
it('normalizes mouse, pen, and touch pointer coordinates identically',()=>{/* same client coordinates and rect => same 0..1 point */});
it('retains normalized strokes across canvas resize',()=>{/* redraw at two sizes; model unchanged */});
it('cancel preserves money and equipped definition',()=>{/* edit then cancel */});
it('solo and multiplayer quote the same partial ammo purchase',()=>{/* compare adapters */});
```

- [ ] **Step 2: Run focused failures**

Run: `npm test -- tests/weapon-workshop.test.ts tests/touch.test.ts`

Expected: FAIL because UI/controller helpers are missing.

- [ ] **Step 3: Build the paper workshop overlay**

Create one responsive canvas using pointer capture for `pointerdown/move/up/cancel`; offer color, undo, clear, preview, confirm, cancel, ammo purchase, current balance, and disabled future-category cards with price/day labels. Opening disables local movement/camera/fire through the existing control gate; closing restores it. Add `E` near-chest interaction on desktop and a contextual touch button on mobile. Hordes leave the chest visible but refuse opening.

- [ ] **Step 4: Connect solo and multiplayer adapters**

Solo calls the same pricing/validation/state modules, persists only valid pistol definition plus match money with a versioned local-storage envelope, and falls back to the draft pistol on parse/validation failure. Multiplayer only sends requests and waits for authoritative transaction/snapshot results.

- [ ] **Step 5: Render the same drawing in both camera modes**

Feed the validated definition to `DrawnWeapon` and `FirstPersonWeapon`; preserve combat dimensions/raycast and change only visible geometry/color. Remote players rebuild from `WeaponDefinitionCache`.

- [ ] **Step 6: Test and commit**

Run: `npm test -- tests/weapon-workshop.test.ts tests/touch.test.ts tests/network.test.ts tests/gameplay.test.ts`

Expected: PASS.

```bash
git add src/ui/WeaponWorkshop.ts src/weapons/WeaponWorkshopController.ts src/game/Game.ts src/network/CoopPreview.ts src/input/TouchControls.ts src/style.css src/touch.css tests/weapon-workshop.test.ts tests/touch.test.ts tests/network.test.ts tests/gameplay.test.ts
git commit -m "Add responsive drawn weapon workshop"
```

### Task 9: End-to-End Verification, Documentation, and Publication

**Files:**
- Modify: `INKDAYS_PROGRESS.md`
- Modify: `README.md`
- Modify: `docs/THIRD_PARTY_ASSETS.md` only if this delivery adds external media; otherwise leave it unchanged.

**Interfaces:**
- Consumes: all completed tasks.
- Produces: verified public PWA and multiplayer backend using the same protocol version.

- [ ] **Step 1: Run the complete automated gate**

Run: `npm test && npm run lint && npm run build`

Expected: all tests pass, ESLint exits 0, TypeScript emits no errors, and PWA build completes.

- [ ] **Step 2: Run multiplayer fault-path validation**

Start the server locally, then exercise two browser clients under the existing bad-network preset. Verify duplicate ammo purchase, simultaneous pickup, weapon confirmation, disconnect/reconnect, and definition cache recovery. Download both network reports and confirm no divergent money, ammo, drop, or revision state.

- [ ] **Step 3: Perform visual/device checks**

Check desktop mouse and Android-width landscape touch: chest prompt, open/close controls, drawing, rotation/resize retention, ammo purchase, floating/expiring drop, third-person weapon, first-person weapon, and disabled future categories. Confirm the workshop does not cover required touch controls after closing.

- [ ] **Step 4: Measure production traffic**

Record bytes per snapshot and bytes/minute for two idle players and two active players before/after. Accept only if drawing points never appear in recurring packets and feature overhead stays within the Task 7 budget.

- [ ] **Step 5: Update progress documentation honestly**

Mark automated checks separately from human hardware/network checks. Document prices, drop cadence/lifetime, chest restriction, current pistol-only scope, cache behavior, and exact rollback commit.

- [ ] **Step 6: Commit, push, deploy, and verify public versions**

```bash
git add INKDAYS_PROGRESS.md README.md
# Add docs/THIRD_PARTY_ASSETS.md only when this delivery actually changed it.
git commit -m "Document weapon workshop and ammo economy"
git push origin HEAD:main
```

Wait for GitHub Pages to complete, update the multiplayer backend when its server commit changes, then verify the public home, solo mode, and a two-device multiplayer room. Compare the deployed client version and backend health response with the pushed commit.

- [ ] **Step 7: Record rollback**

Rollback is `git revert` of the Task 1–9 commits followed by redeployment; do not rewrite public history. Include the precise first and last feature commit hashes in `INKDAYS_PROGRESS.md`.
