import type {DrawingPoint,DrawingStroke} from './CustomWeapon';

export type DrawPoint=DrawingPoint;
export type DrawStroke=DrawingStroke;
export interface WeaponDrawing{strokes:DrawStroke[];color:string}
export interface ValidatedWeaponDrawing extends WeaponDrawing{readonly validated:true}
export const WEAPON_COLORS=['#43b95f','#3182ce','#8e55c7','#efb940','#df7f47','#f7f5ed'] as const;
const LIMITS={strokes:24,perStroke:64,total:1024,minWidth:.012,maxWidth:.065};
const zones=[{x:[.26,.46],y:[.50,.92]},{x:[.20,.70],y:[.30,.65]},{x:[.62,.94],y:[.28,.55]}] as const;

const distanceToLine=(point:DrawPoint,a:DrawPoint,b:DrawPoint)=>{const dx=b.x-a.x,dy=b.y-a.y;if(dx===0&&dy===0)return Math.hypot(point.x-a.x,point.y-a.y);const t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(point.x-(a.x+t*dx),point.y-(a.y+t*dy));};
export function simplifyStroke(points:readonly DrawPoint[],tolerance=.006):DrawPoint[]{
  if(points.length<=2)return points.map(point=>({...point}));let max=0,index=0;for(let i=1;i<points.length-1;i++){const distance=distanceToLine(points[i],points[0],points.at(-1)!);if(distance>max){max=distance;index=i;}}
  if(max<=tolerance)return [{...points[0]},{...points.at(-1)!}];const left=simplifyStroke(points.slice(0,index+1),tolerance),right=simplifyStroke(points.slice(index),tolerance);return [...left.slice(0,-1),...right];
}
export type DrawingValidation={ok:true;drawing:ValidatedWeaponDrawing}|{ok:false;reason:string};
export function validatePistolDrawing(value:unknown):DrawingValidation{
  if(!value||typeof value!=='object')return {ok:false,reason:'structure'};const raw=value as {strokes?:unknown;color?:unknown};if(!Array.isArray(raw.strokes)||raw.strokes.length<1||raw.strokes.length>LIMITS.strokes)return {ok:false,reason:'strokes'};
  if(typeof raw.color!=='string'||!WEAPON_COLORS.includes(raw.color as typeof WEAPON_COLORS[number]))return {ok:false,reason:'color'};
  let total=0;const strokes:DrawStroke[]=[];for(const candidate of raw.strokes){if(!candidate||typeof candidate!=='object')return {ok:false,reason:'stroke'};const stroke=candidate as {width?:unknown;points?:unknown};if(typeof stroke.width!=='number'||!Number.isFinite(stroke.width)||stroke.width<LIMITS.minWidth||stroke.width>LIMITS.maxWidth||!Array.isArray(stroke.points)||stroke.points.length<2||stroke.points.length>LIMITS.perStroke)return {ok:false,reason:'stroke'};const points:DrawPoint[]=[];for(const candidatePoint of stroke.points){if(!candidatePoint||typeof candidatePoint!=='object')return {ok:false,reason:'point'};const point=candidatePoint as {x?:unknown;y?:unknown};if(typeof point.x!=='number'||typeof point.y!=='number'||!Number.isFinite(point.x)||!Number.isFinite(point.y)||point.x<0||point.x>1||point.y<0||point.y>1)return {ok:false,reason:'point'};points.push({x:point.x,y:point.y});}const simplified=simplifyStroke(points);total+=simplified.length;if(total>LIMITS.total)return {ok:false,reason:'points'};strokes.push({width:stroke.width,points:simplified});}
  const points=strokes.flatMap(stroke=>stroke.points);if(!zones.every(zone=>points.some(point=>point.x>=zone.x[0]&&point.x<=zone.x[1]&&point.y>=zone.y[0]&&point.y<=zone.y[1])))return {ok:false,reason:'zones'};
  return {ok:true,drawing:{strokes,color:raw.color,validated:true}};
}
