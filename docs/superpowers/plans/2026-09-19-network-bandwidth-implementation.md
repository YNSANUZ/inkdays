# Bandwidth-Efficient Multiplayer Protocol Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce INKDAYS multiplayer server egress by at least 85% while preserving authoritative gameplay, smooth rendering, and safe reconnection.

**Architecture:** A shared version-2 transport codec converts authoritative snapshots into compact keyframes and ordered deltas. Each connection owns a stream encoder, while the browser owns a decoder that reconstructs the existing snapshot shape so gameplay presentation remains isolated from transport details.

**Tech Stack:** TypeScript 5.9, Node.js 22, `ws`, Vitest, Vite, Three.js, Docker/Back4app Containers

**Spec:** `docs/superpowers/specs/2026-09-19-network-bandwidth-design.md`

## Global Constraints

- Reduce measured server egress by at least 85% against full JSON snapshots at 20 Hz in the same eight-player, 17-enemy scenario.
- The server remains authoritative for movement validation, damage, ammunition, death, rewards, enemies, hordes, day cycle, and boss state.
- Players remain eligible for up to 20 updates/second; nearby or aggressive enemies for up to 10; distant `WANDER` enemies for up to 4.
- Every new or resumed connection receives a complete keyframe before deltas.
- A periodic keyframe is sent every two seconds.
- Invalid sequence or base identity causes deltas to be rejected until a valid keyframe arrives.
- Server and public client are deployed together because protocol version 2 is incompatible with the current public transport.
- Existing unfinished arsenal changes must not be discarded or accidentally bundled into unrelated commits.

## Review Focus

- A delta arriving before a keyframe must be rejected without mutating client state; Task 2 pins this in `tests/snapshot-codec.test.ts`.
- Sequence gaps and stale keyframe identifiers must invalidate the base until a new keyframe; Task 2 tests both paths.
- Quantization around negative values and world boundaries must stay within one centimeter and one tenth of a degree; Task 1 tests boundary values.
- Entity removal followed by identifier reuse must reconstruct the new entity rather than retain stale fields; Task 2 tests remove/re-add behavior.
- Reconnection while shots, impacts, or chat events are active must baseline those events without replaying them; Tasks 3 and 4 test event cursor reset.

---

### Task 1: Compact Keyframe Codec

**Files:**
- Create: `src/network/SnapshotCodec.ts`
- Modify: `src/network/CombatAuthority.ts:106-111`
- Create: `tests/snapshot-codec.test.ts`

**Interfaces:**
- Consumes: `CombatAuthority.snapshot()`.
- Produces: `CombatSnapshot`, `PackedKeyframe`, `packKeyframe(snapshot, keyframeId)`, and `unpackKeyframe(packet)`.

- [ ] **Step 1: Write the failing keyframe round-trip and quantization tests**

```ts
import {describe,expect,it} from 'vitest';
import {CombatAuthority} from '../src/network/CombatAuthority';
import {packKeyframe,unpackKeyframe} from '../src/network/SnapshotCodec';

describe('compact snapshot keyframe',()=>{
  it('reconstructs an authoritative snapshot within transport precision',()=>{
    const authority=new CombatAuthority();
    authority.join('player-a');
    for(let tick=0;tick<30;tick++)authority.step();
    const source=authority.snapshot();
    const packet=packKeyframe(source,7);
    const decoded=unpackKeyframe(packet);
    expect(packet).toMatchObject({t:'k',v:2,k:7});
    expect(decoded.tick).toBe(source.tick);
    expect(decoded.players[0].id).toBe('player-a');
    expect(decoded.players[0].position.x).toBeCloseTo(source.players[0].position.x,2);
    expect(decoded.players[0].yaw).toBeCloseTo(source.players[0].yaw,3);
  });

  it('quantizes negative coordinates and boundary angles predictably',()=>{
    const authority=new CombatAuthority();
    authority.join('edge');
    const source=authority.snapshot();
    source.players[0].position.x=-42.129;
    source.players[0].position.z=42.129;
    source.players[0].yaw=-Math.PI;
    const decoded=unpackKeyframe(packKeyframe(source,1));
    expect(decoded.players[0].position).toMatchObject({x:-42.13,z:42.13});
    expect(decoded.players[0].yaw).toBeCloseTo(-Math.PI,3);
  });
});
```

- [ ] **Step 2: Run the focused test and verify the missing-module failure**

Run: `npx vitest run tests/snapshot-codec.test.ts`

Expected: FAIL because `src/network/SnapshotCodec.ts` does not exist.

- [ ] **Step 3: Export the authoritative snapshot type and implement positional packing**

Add after `CombatAuthority` in `src/network/CombatAuthority.ts`:

```ts
export type CombatSnapshot=ReturnType<CombatAuthority['snapshot']>;
```

Create `src/network/SnapshotCodec.ts` with explicit tuple types. Use `q100(value)=Math.round(value*100)` for positions, velocity, vertical, health, protection, remaining and boss timers; use `qAngle(value)=Math.round(value*1800/Math.PI)` for angles. Store global fields under short keys and high-frequency entities as tuples. `unpackKeyframe` must return the full `CombatSnapshot` shape, dividing quantized values by their respective scale.

The packet header must be:

```ts
export interface PackedKeyframe {
  t:'k'; v:2; k:number; s:PackedSnapshot;
}

export const packKeyframe=(snapshot:CombatSnapshot,keyframeId:number):PackedKeyframe=>({
  t:'k',v:2,k:keyframeId,s:packSnapshot(snapshot)
});
```

Document every tuple index beside its type declaration. Keep player names, room-safe IDs, chat text and boss name as strings; do not quantize integer counters or serials.

- [ ] **Step 4: Run codec tests and the existing combat tests**

Run: `npx vitest run tests/snapshot-codec.test.ts tests/combat.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the keyframe codec**

```bash
git add src/network/SnapshotCodec.ts src/network/CombatAuthority.ts tests/snapshot-codec.test.ts
git commit -m "Add compact multiplayer keyframe codec"
```

### Task 2: Ordered Delta Codec

**Files:**
- Modify: `src/network/SnapshotCodec.ts`
- Modify: `tests/snapshot-codec.test.ts`

**Interfaces:**
- Consumes: `CombatSnapshot`, `PackedKeyframe`, and the quantizers from Task 1.
- Produces: `PackedDelta`, `SnapshotEncoder.push(snapshot, rates)`, `SnapshotDecoder.accept(packet)`, and `SnapshotDecoder.reset()`.

- [ ] **Step 1: Add failing tests for changed fields, removal/re-add, invalid base and sequence gaps**

```ts
it('applies changed entities and removals without retaining stale fields',()=>{
  const encoder=new SnapshotEncoder(),decoder=new SnapshotDecoder();
  const first=fixtureSnapshot();
  expect(decoder.accept(encoder.keyframe(first,0))).not.toBeNull();
  const second=structuredClone(first);
  second.tick=3;
  second.players[0].health=67;
  second.enemies=[];
  expect(decoder.accept(encoder.delta(second,3))).toMatchObject({tick:3,players:[{health:67}],enemies:[]});
  const third=structuredClone(second);
  third.tick=6;
  third.enemies=[fixtureEnemy(first.enemies[0].id,{health:12})];
  expect(decoder.accept(encoder.delta(third,6))?.enemies[0]).toMatchObject({health:12});
});

it('rejects deltas before a keyframe, with a stale base, or after a sequence gap',()=>{
  const encoder=new SnapshotEncoder(),decoder=new SnapshotDecoder(),state=fixtureSnapshot();
  const keyframe=encoder.keyframe(state,0);
  const delta1=encoder.delta({...state,tick:3},3);
  const delta2=encoder.delta({...state,tick:6},6);
  expect(new SnapshotDecoder().accept(delta1)).toBeNull();
  expect(decoder.accept(keyframe)).not.toBeNull();
  expect(decoder.accept({...delta1,k:999})).toBeNull();
  decoder.accept(keyframe);
  expect(decoder.accept(delta2)).toBeNull();
});
```

- [ ] **Step 2: Run the focused tests and verify missing exports fail**

Run: `npx vitest run tests/snapshot-codec.test.ts`

Expected: FAIL because `SnapshotEncoder` and `SnapshotDecoder` are not exported.

- [ ] **Step 3: Implement entity maps, global patches and sequence validation**

Use this packet envelope:

```ts
export interface PackedDelta {
  t:'d'; v:2; k:number; q:number; tick:number;
  g?:PackedGlobalPatch;
  p?:PackedPlayer[]; pr?:string[];
  e?:PackedEnemy[]; er?:number[];
  b?:PackedBoss|null;
  sh?:PackedShot[]; im?:PackedImpact[]; m?:PackedMessage[];
  dr?:PackedDayResult|null;
}
```

`SnapshotEncoder` stores the last packed entity by ID, keyframe ID, sequence, and last event serial. It compares packed values rather than raw floats. `SnapshotDecoder` keeps cloned maps and global state, requires `q===previousSequence+1`, and marks itself invalid after any base or sequence error until `accept()` receives a keyframe. Removals happen before additions so an ID can be safely re-added in the same packet.

Events use serial cursors: `sh`, `im`, and `m` contain only serials greater than the last serial emitted. A keyframe updates cursors but the decoder exposes its events as baseline data; existing UI event cursors will suppress playback on the first reconstructed snapshot.

- [ ] **Step 4: Run all codec tests**

Run: `npx vitest run tests/snapshot-codec.test.ts`

Expected: PASS, including invalid-order tests.

- [ ] **Step 5: Commit the delta codec**

```bash
git add src/network/SnapshotCodec.ts tests/snapshot-codec.test.ts
git commit -m "Add ordered multiplayer snapshot deltas"
```

### Task 3: Adaptive Server Stream and Traffic Metrics

**Files:**
- Create: `src/network/SnapshotStream.ts`
- Modify: `src/network/Server.ts:1-39`
- Modify: `tests/transport.test.ts`
- Create: `tests/bandwidth.test.ts`

**Interfaces:**
- Consumes: `SnapshotEncoder`, `CombatSnapshot`, WebSocket connection lifecycle.
- Produces: `SnapshotStream.next(snapshot): PackedKeyframe|PackedDelta|null`, `SnapshotStream.stats`, and protocol-v2 WebSocket output.

- [ ] **Step 1: Write failing stream cadence, reconnect baseline, event-once and bandwidth tests**

```ts
it('starts every stream with a keyframe and refreshes it after two seconds',()=>{
  const stream=new SnapshotStream();
  expect(stream.next(fixtureSnapshot(0))?.t).toBe('k');
  for(let tick=1;tick<120;tick++)stream.next(fixtureSnapshot(tick));
  expect(stream.next(fixtureSnapshot(120))?.t).toBe('k');
});

it('sends event serials once per connection',()=>{
  const stream=new SnapshotStream();
  stream.next(fixtureSnapshot(0));
  const withShot=fixtureSnapshot(3,{shots:[fixtureShot(1)]});
  expect(stream.next(withShot)).toMatchObject({t:'d',sh:[expect.any(Array)]});
  expect(stream.next(fixtureSnapshot(6,{shots:[fixtureShot(1)]}))).not.toHaveProperty('sh');
});

it('uses at most fifteen percent of the legacy 20 Hz snapshot budget',()=>{
  const result=measureEightPlayerHordeTraffic();
  expect(result.compactBytes/result.legacyBytes).toBeLessThanOrEqual(.15);
});
```

- [ ] **Step 2: Run the focused tests and confirm they fail on missing stream support**

Run: `npx vitest run tests/bandwidth.test.ts tests/transport.test.ts`

Expected: FAIL because `SnapshotStream` and protocol-v2 packets are absent.

- [ ] **Step 3: Implement cadence and per-connection stream state**

`SnapshotStream` receives authoritative 60 Hz snapshots but emits:

```ts
const PLAYER_INTERVAL=3;       // 20 Hz
const ACTIVE_ENEMY_INTERVAL=6; // 10 Hz
const WANDER_INTERVAL=15;      // 4 Hz
const KEYFRAME_INTERVAL=120;   // 2 s
```

At player cadence it always evaluates players and global state. It includes active enemies only when `tick%6===0`, distant `WANDER` motion only when `tick%15===0`, and all entity births/deaths immediately. Bosses always use active cadence. A delta with no changes returns `null`.

In `Server.ts`, replace the room-shared full packet cache with `Map<WebSocket,SnapshotStream>`. Create a stream on connection, delete it on close, call `next(roomAuthority.snapshot())`, stringify only non-null packets, preserve `bufferedAmount` protection, and count UTF-8 bytes after serialization in `stream.stats`.

- [ ] **Step 4: Extend transport tests for two clients and resumed connection keyframes**

Add assertions that both clients receive protocol `v:2`, reconstruct matching states for common ticks, and that a resumed socket receives `t:'k'` before any `t:'d'`. Assert the first reconstructed event list establishes a baseline and subsequent event serials occur once.

- [ ] **Step 5: Run transport and bandwidth tests**

Run: `npx vitest run tests/snapshot-codec.test.ts tests/transport.test.ts tests/bandwidth.test.ts`

Expected: PASS and compact/legacy ratio `<= 0.15`.

- [ ] **Step 6: Commit the adaptive server stream**

```bash
git add src/network/SnapshotStream.ts src/network/Server.ts tests/transport.test.ts tests/bandwidth.test.ts
git commit -m "Stream adaptive multiplayer snapshot deltas"
```

### Task 4: Browser Decoder Integration

**Files:**
- Modify: `src/network/CoopPreview.ts:37,85-115`
- Modify: `src/network/SnapshotCodec.ts`
- Create: `tests/snapshot-client.test.ts`
- Modify: `scripts/validate-public-reconnect.mjs`

**Interfaces:**
- Consumes: `SnapshotDecoder.accept(packet)` from Task 2.
- Produces: unchanged `CombatSnapshot` objects for UI, interpolation, prediction, HUD, audio and event cursors.

- [ ] **Step 1: Write failing client-flow tests**

```ts
it('does not expose deltas until a keyframe establishes a base',()=>{
  const receiver=new SnapshotReceiver();
  expect(receiver.receive(fixtureDeltaWithoutBase())).toBeNull();
  expect(receiver.receive(fixtureKeyframe())).toMatchObject({tick:0});
});

it('resets interpolation-facing state after round change or invalid delta',()=>{
  const receiver=new SnapshotReceiver();
  receiver.receive(fixtureKeyframe({round:1}));
  expect(receiver.receive(fixtureSequenceGap())).toBeNull();
  expect(receiver.needsKeyframe).toBe(true);
  expect(receiver.receive(fixtureKeyframe({round:2}))).toMatchObject({round:2});
});
```

- [ ] **Step 2: Run the client tests and verify missing receiver failure**

Run: `npx vitest run tests/snapshot-client.test.ts`

Expected: FAIL because the client receiver is not implemented.

- [ ] **Step 3: Add a small receiver facade and integrate it into `CoopPreview`**

Export `SnapshotReceiver` from `SnapshotCodec.ts` as a thin wrapper around `SnapshotDecoder`, exposing `receive(unknown):CombatSnapshot|null`, `reset()`, and `needsKeyframe`.

In `CoopPreview.ts`, instantiate one receiver per WebSocket connection. On `welcome`, reset it. Replace direct `packet.type==='snapshot'` consumption with:

```ts
const decoded=receiver.receive(packet);
if(!decoded)return;
const state=decoded;
```

Keep the remainder of the snapshot handler on the reconstructed state. If the decoder becomes invalid, keep the socket alive until the periodic keyframe arrives; freshness logic remains the outer recovery mechanism.

- [ ] **Step 4: Update the public reconnect validator to decode v2 packets**

Import the compiled/shared decoder through a small buildable script entry or implement the validator in TypeScript under `scripts/validate-public-reconnect.ts` and run it with `tsx`. Change the npm script to invoke the TypeScript validator. Validate that both clients reconstruct the same state and a resumed connection starts from a keyframe.

- [ ] **Step 5: Run client, reconnect, presentation and prediction tests**

Run: `npx vitest run tests/snapshot-client.test.ts tests/prediction.test.ts tests/interpolation.test.ts tests/shot-events.test.ts tests/snapshot-freshness.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit browser protocol integration**

```bash
git add src/network/SnapshotCodec.ts src/network/CoopPreview.ts tests/snapshot-client.test.ts scripts/validate-public-reconnect.ts package.json
git rm scripts/validate-public-reconnect.mjs
git commit -m "Decode compact multiplayer snapshots in browser"
```

### Task 5: Full Regression and Progress Evidence

**Files:**
- Modify: `INKDAYS_PROGRESS.md`
- Modify only if failures demand it: files covered by the failing test

**Interfaces:**
- Consumes: completed protocol-v2 server and client.
- Produces: reproducible verification evidence and rollback notes.

- [ ] **Step 1: Run the complete automated suite**

Run: `npm test`

Expected: all tests PASS. If a regression appears, add the smallest failing reproduction before changing production code.

- [ ] **Step 2: Run static validation and production build**

Run: `npm run lint && npx tsc --noEmit && npm run build`

Expected: all commands exit 0 with no TypeScript or ESLint errors.

- [ ] **Step 3: Run a local two-client reconnect validation**

Start: `$env:PORT='8099'; npm start`

Validate in another shell: `$env:VITE_COOP_SERVER='ws://127.0.0.1:8099'; npm run validate:public:reconnect`

Expected: two unique players, identical reconstructed snapshot at a common tick, identity preserved after resume, and first resumed state sourced from a keyframe.

- [ ] **Step 4: Record measured results and rollback in progress documentation**

Append the baseline and final measurements to `INKDAYS_PROGRESS.md`: bytes, bytes/player/minute, keyframe/delta counts, compact/legacy ratio, tests run, and public validation still pending. State rollback as reverting the protocol commits together and restoring the previous frontend endpoint.

- [ ] **Step 5: Commit verification evidence**

```bash
git add INKDAYS_PROGRESS.md
git commit -m "Document multiplayer bandwidth verification"
```

### Task 6: Back4app Deployment and Public Cutover

**Files:**
- Modify: `.env.production`
- Modify: `INKDAYS_PROGRESS.md`
- Existing deployment files: `Dockerfile`, `.dockerignore`

**Interfaces:**
- Consumes: green protocol-v2 build on `main`, GitHub repository integration, Back4app free container.
- Produces: public `wss://` backend and GitHub Pages client using it.

- [ ] **Step 1: Push the verified protocol commits**

Run: `git status --short && git log -6 --oneline && git push origin main`

Expected: protocol commits reach `origin/main`; unrelated pre-existing working-tree changes remain uncommitted unless they are required and independently verified.

- [ ] **Step 2: Create the Back4app container from `YNSANUZ/inkdays`**

Select repository `YNSANUZ/inkdays`, branch `main`, root directory `/`, free container, and Dockerfile deployment. Set environment variable `PORT=8080`. Keep automatic deploy enabled so verified future pushes rebuild the server.

- [ ] **Step 3: Validate the backend URL directly**

Run: `$env:COOP_URL=Read-Host 'Cole a URL wss exibida pelo Back4app'; npm run validate:public:reconnect`

Expected: connection succeeds, two players share state, reconnection preserves identity, and the resumed stream begins with a keyframe. Use the hostname shown by the created container; do not derive or guess it.

- [ ] **Step 4: Point the production client to the verified backend**

Write the already validated value to `.env.production`:

```powershell
Set-Content .env.production "VITE_COOP_SERVER=$env:COOP_URL"
```

Run: `npm run build`, then commit and push only the endpoint and generated deployment changes required by the repository's existing GitHub Pages workflow.

- [ ] **Step 5: Validate the public game**

Open `https://ynsanuz.github.io/inkdays/?coop=1` in two independent browser contexts. Join the same room, move, shoot, observe the same enemies, disconnect one client, reconnect it, and complete at least one horde transition. Confirm the browser console has no protocol errors.

- [ ] **Step 6: Record public evidence and rollback**

Update `INKDAYS_PROGRESS.md` with the Back4app URL, deployed commit, public test result, observed traffic metrics and remaining real-device limitations. Rollback is restoring the previous `.env.production` endpoint and reverting the protocol-v2 commits together.

- [ ] **Step 7: Commit and push the final deployment record**

```bash
git add .env.production INKDAYS_PROGRESS.md
git commit -m "Publish bandwidth-efficient multiplayer backend"
git push origin main
```
