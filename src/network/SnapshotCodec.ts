import type {CombatSnapshot} from './CombatAuthority';

type Vec={x:number;y:number;z:number};
// Player: id,name,flags,protection,ack,chatAck,yaw,pos xyz,vel xyz,vertical,health,ammo,reserve,kills,money
type PackedPlayer=[string,string,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number];
// Enemy: id,kind/flags,maxHealth,targetId,pos xyz,yaw,health,state,speed
type PackedEnemy=[number,string,number,number,string|null,number,number,number,number,number,string,number];
type PackedGlobal=[number,number,number,string,number,number];
type PackedDrop=[number,number,number,number];
type PackedSnapshot={g:PackedGlobal;h:unknown;p:PackedPlayer[];e:PackedEnemy[];a:PackedDrop[];b:unknown;sh:unknown[];im:unknown[];m:unknown[];dr:unknown};
export interface PackedKeyframe{t:'k';v:2;k:number;s:PackedSnapshot}
export interface PackedDelta{t:'d';v:2;k:number;q:number;tick:number;g?:PackedGlobal;h?:unknown;p?:PackedPlayer[];pr?:string[];e?:PackedEnemy[];er?:number[];a?:PackedDrop[];b?:unknown;sh?:unknown[];im?:unknown[];m?:unknown[];dr?:unknown}

const q=(value:number,scale=100)=>Math.round(value*scale),u=(value:number,scale=100)=>value/scale;
const qa=(value:number)=>q(value,1800/Math.PI),ua=(value:number)=>u(value,1800/Math.PI);
const pv=(value:Vec)=>[q(value.x),q(value.y),q(value.z)] as const;
const uv=(value:readonly[number,number,number])=>({x:u(value[0]),y:u(value[1]),z:u(value[2])});
const clone=<T>(value:T):T=>value==null?value:JSON.parse(JSON.stringify(value));

const packPlayer=(p:CombatSnapshot['players'][number]):PackedPlayer=>[p.id,p.name,(p.connected?1:0)|(p.ready?2:0)|(p.reloading?4:0)|(p.crouch?8:0),q(p.protection),p.acknowledged,p.chatAcknowledged,qa(p.yaw),...pv(p.position),...pv(p.velocity),q(p.vertical),q(p.health),p.ammo,p.reserve,p.kills,p.money];
const unpackPlayer=(p:PackedPlayer)=>({id:p[0],name:p[1],connected:!!(p[2]&1),ready:!!(p[2]&2),reloading:!!(p[2]&4),crouch:!!(p[2]&8),protection:u(p[3]),acknowledged:p[4],chatAcknowledged:p[5],yaw:ua(p[6]),position:uv([p[7],p[8],p[9]]),velocity:uv([p[10],p[11],p[12]]),vertical:u(p[13]),health:u(p[14]),ammo:p[15],reserve:p[16],kills:p[17],money:p[18]}) as CombatSnapshot['players'][number];
const packEnemy=(e:CombatSnapshot['enemies'][number]):PackedEnemy=>[e.id,e.kind,(e.enraged?1:0),q(e.maxHealth),e.targetId,...pv(e.position),qa(e.yaw),q(e.health),e.state,q(e.speed)];
const unpackEnemy=(e:PackedEnemy)=>({id:e[0],kind:e[1] as CombatSnapshot['enemies'][number]['kind'],enraged:!!e[2],maxHealth:u(e[3]),targetId:e[4],position:uv([e[5],e[6],e[7]]),yaw:ua(e[8]),health:u(e[9]),state:e[10] as CombatSnapshot['enemies'][number]['state'],speed:u(e[11])}) as CombatSnapshot['enemies'][number];

const packSnapshot=(s:CombatSnapshot):PackedSnapshot=>({g:[s.tick,s.round,s.day,s.phase,q(s.remaining),s.gameOver?1:0],h:clone(s.horde),p:s.players.map(packPlayer),e:s.enemies.map(packEnemy),a:s.ammoDrops.map(drop=>[drop.id,q(drop.x),q(drop.z),q(drop.remaining)]),b:clone(s.boss),sh:clone(s.shots),im:clone(s.impacts),m:clone(s.messages),dr:clone(s.dayResult)});
const unpackSnapshot=(s:PackedSnapshot):CombatSnapshot=>({version:1,tick:s.g[0],round:s.g[1],day:s.g[2],phase:s.g[3] as CombatSnapshot['phase'],remaining:u(s.g[4]),gameOver:!!s.g[5],horde:clone(s.h) as CombatSnapshot['horde'],players:s.p.map(unpackPlayer),enemies:s.e.map(unpackEnemy),ammoDrops:s.a.map(drop=>({id:drop[0],x:u(drop[1]),z:u(drop[2]),remaining:u(drop[3])})),boss:clone(s.b) as CombatSnapshot['boss'],shots:clone(s.sh) as CombatSnapshot['shots'],impacts:clone(s.im) as CombatSnapshot['impacts'],messages:clone(s.m) as CombatSnapshot['messages'],dayResult:clone(s.dr) as CombatSnapshot['dayResult']});

export const packKeyframe=(snapshot:CombatSnapshot,keyframeId:number):PackedKeyframe=>({t:'k',v:2,k:keyframeId,s:packSnapshot(snapshot)});
export const unpackKeyframe=(packet:PackedKeyframe):CombatSnapshot=>unpackSnapshot(packet.s);

const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const changed=<T extends readonly unknown[]>(before:T[],after:T[],id:(item:T)=>string|number)=>{const old=new Map(before.map(item=>[id(item),item]));return after.filter(item=>!same(old.get(id(item)),item));};
const removed=<T extends readonly unknown[]>(before:T[],after:T[],id:(item:T)=>string|number)=>{const next=new Set(after.map(id));return before.map(id).filter(key=>!next.has(key));};
const afterSerial=(items:unknown[],last:number)=>items.filter(item=>Number((item as {serial?:number}).serial)>last);
const maxSerial=(items:unknown[],last:number)=>items.reduce<number>((max,item)=>Math.max(max,Number((item as {serial?:number}).serial)||0),last);

export class SnapshotEncoder{
  private base:PackedSnapshot|null=null;private keyframeId=0;private sequence=0;private serials={sh:0,im:0,m:0};
  keyframe(snapshot:CombatSnapshot,keyframeId=snapshot.tick){const packet=packKeyframe(snapshot,keyframeId);this.base=clone(packet.s);this.keyframeId=keyframeId;this.sequence=0;this.serials={sh:maxSerial(packet.s.sh,0),im:maxSerial(packet.s.im,0),m:maxSerial(packet.s.m,0)};return packet;}
  delta(snapshot:CombatSnapshot,tick=snapshot.tick):PackedDelta{
    if(!this.base)throw new Error('SnapshotEncoder requires a keyframe');
    const next=packSnapshot(snapshot),packet:PackedDelta={t:'d',v:2,k:this.keyframeId,q:++this.sequence,tick};
    if(!same(this.base.g,next.g))packet.g=next.g;if(!same(this.base.h,next.h))packet.h=next.h;
    const players=changed(this.base.p,next.p,item=>item[0]),playerRemovals=removed(this.base.p,next.p,item=>item[0]);if(players.length)packet.p=players;if(playerRemovals.length)packet.pr=playerRemovals as string[];
    const enemies=changed(this.base.e,next.e,item=>item[0]),enemyRemovals=removed(this.base.e,next.e,item=>item[0]);if(enemies.length)packet.e=enemies;if(enemyRemovals.length)packet.er=enemyRemovals as number[];
    if(!same(this.base.a,next.a))packet.a=next.a;if(!same(this.base.b,next.b))packet.b=next.b;if(!same(this.base.dr,next.dr))packet.dr=next.dr;
    for(const key of ['sh','im','m'] as const){const events=afterSerial(next[key],this.serials[key]);if(events.length)packet[key]=events;this.serials[key]=maxSerial(next[key],this.serials[key]);}
    this.base=clone(next);return packet;
  }
}

export class SnapshotDecoder{
  private base:PackedSnapshot|null=null;private keyframeId=-1;private sequence=0;needsKeyframe=true;
  reset(){this.base=null;this.keyframeId=-1;this.sequence=0;this.needsKeyframe=true;}
  accept(packet:PackedKeyframe|PackedDelta):CombatSnapshot|null{
    if(packet?.v!==2)return null;
    if(packet.t==='k'){this.base=clone(packet.s);this.keyframeId=packet.k;this.sequence=0;this.needsKeyframe=false;return unpackSnapshot(this.base);}
    if(packet.t!=='d'||this.needsKeyframe||!this.base||packet.k!==this.keyframeId||packet.q!==this.sequence+1){this.needsKeyframe=true;return null;}
    const base=this.base;this.sequence=packet.q;
    if(packet.g)base.g=clone(packet.g);else base.g[0]=packet.tick;if('h'in packet)base.h=clone(packet.h);
    if(packet.pr?.length){const ids=new Set(packet.pr);base.p=base.p.filter(item=>!ids.has(item[0]));}if(packet.p)for(const item of packet.p){const index=base.p.findIndex(old=>old[0]===item[0]);if(index<0)base.p.push(clone(item));else base.p[index]=clone(item);}
    if(packet.er?.length){const ids=new Set(packet.er);base.e=base.e.filter(item=>!ids.has(item[0]));}if(packet.e)for(const item of packet.e){const index=base.e.findIndex(old=>old[0]===item[0]);if(index<0)base.e.push(clone(item));else base.e[index]=clone(item);}
    if(packet.a)base.a=clone(packet.a);if('b'in packet)base.b=clone(packet.b);if('dr'in packet)base.dr=clone(packet.dr);
    base.sh=packet.sh?clone(packet.sh):[];base.im=packet.im?clone(packet.im):[];base.m=packet.m?clone(packet.m):[];
    return unpackSnapshot(base);
  }
}
