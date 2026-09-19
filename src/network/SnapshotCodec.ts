import type {CombatSnapshot} from './CombatAuthority';

type Vec={x:number;y:number;z:number};
// Player: id,name,flags,protection,ack,chatAck,yaw,pos xyz,vel xyz,vertical,health,ammo,reserve,kills,money
type PackedPlayer=[string,string,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number];
// Enemy: id,kind/flags,maxHealth,targetId,pos xyz,yaw,health,state,speed
type PackedEnemy=[number,string,number,number,string|null,number,number,number,number,number,string,number];
type PackedSnapshot={g:[number,number,number,string,number,number];h:unknown;p:PackedPlayer[];e:PackedEnemy[];b:unknown;sh:unknown[];im:unknown[];m:unknown[];dr:unknown};
export interface PackedKeyframe{t:'k';v:2;k:number;s:PackedSnapshot}

const q=(value:number,scale=100)=>Math.round(value*scale),u=(value:number,scale=100)=>value/scale;
const qa=(value:number)=>q(value,1800/Math.PI),ua=(value:number)=>u(value,1800/Math.PI);
const pv=(value:Vec)=>[q(value.x),q(value.y),q(value.z)] as const;
const uv=(value:readonly[number,number,number])=>({x:u(value[0]),y:u(value[1]),z:u(value[2])});
const clone=<T>(value:T):T=>value==null?value:JSON.parse(JSON.stringify(value));

const packPlayer=(p:CombatSnapshot['players'][number]):PackedPlayer=>[p.id,p.name,(p.connected?1:0)|(p.ready?2:0)|(p.reloading?4:0)|(p.crouch?8:0),q(p.protection),p.acknowledged,p.chatAcknowledged,qa(p.yaw),...pv(p.position),...pv(p.velocity),q(p.vertical),q(p.health),p.ammo,p.reserve,p.kills,p.money];
const unpackPlayer=(p:PackedPlayer):CombatSnapshot['players'][number]=>({id:p[0],name:p[1],connected:!!(p[2]&1),ready:!!(p[2]&2),reloading:!!(p[2]&4),crouch:!!(p[2]&8),protection:u(p[3]),acknowledged:p[4],chatAcknowledged:p[5],yaw:ua(p[6]),position:uv([p[7],p[8],p[9]]),velocity:uv([p[10],p[11],p[12]]),vertical:u(p[13]),health:u(p[14]),ammo:p[15],reserve:p[16],kills:p[17],money:p[18]});
const packEnemy=(e:CombatSnapshot['enemies'][number]):PackedEnemy=>[e.id,e.kind,(e.enraged?1:0),q(e.maxHealth),e.targetId,...pv(e.position),qa(e.yaw),q(e.health),e.state,q(e.speed)];
const unpackEnemy=(e:PackedEnemy):CombatSnapshot['enemies'][number]=>({id:e[0],kind:e[1] as CombatSnapshot['enemies'][number]['kind'],enraged:!!e[2],maxHealth:u(e[3]),targetId:e[4],position:uv([e[5],e[6],e[7]]),yaw:ua(e[8]),health:u(e[9]),state:e[10] as CombatSnapshot['enemies'][number]['state'],speed:u(e[11])});

const packSnapshot=(s:CombatSnapshot):PackedSnapshot=>({g:[s.tick,s.round,s.day,s.phase,q(s.remaining),s.gameOver?1:0],h:clone(s.horde),p:s.players.map(packPlayer),e:s.enemies.map(packEnemy),b:clone(s.boss),sh:clone(s.shots),im:clone(s.impacts),m:clone(s.messages),dr:clone(s.dayResult)});
const unpackSnapshot=(s:PackedSnapshot):CombatSnapshot=>({version:1,tick:s.g[0],round:s.g[1],day:s.g[2],phase:s.g[3] as CombatSnapshot['phase'],remaining:u(s.g[4]),gameOver:!!s.g[5],horde:clone(s.h) as CombatSnapshot['horde'],players:s.p.map(unpackPlayer),enemies:s.e.map(unpackEnemy),boss:clone(s.b) as CombatSnapshot['boss'],shots:clone(s.sh) as CombatSnapshot['shots'],impacts:clone(s.im) as CombatSnapshot['impacts'],messages:clone(s.m) as CombatSnapshot['messages'],dayResult:clone(s.dr) as CombatSnapshot['dayResult']});

export const packKeyframe=(snapshot:CombatSnapshot,keyframeId:number):PackedKeyframe=>({t:'k',v:2,k:keyframeId,s:packSnapshot(snapshot)});
export const unpackKeyframe=(packet:PackedKeyframe):CombatSnapshot=>unpackSnapshot(packet.s);
