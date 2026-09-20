import {draftPistol} from './CustomWeapon';
import {validatePistolDrawing,type ValidatedWeaponDrawing} from './WeaponWorkshopRules';

export interface WeaponReference{weaponId:string;category:'pistol';color:string;revision:number}
export interface WeaponDefinition extends WeaponReference{drawing:ValidatedWeaponDrawing}
export interface RedrawRequest{requestId:string;category:string;color:string;drawing:unknown}
export interface WorkshopContext{phase:'day'|'horde';alive:boolean;distance:number;money:number}
export interface RedrawResult{ok:boolean;reason:string;cost:number;money:number;reference:WeaponReference}
const REDRAW_COST=120;

export class WeaponWorkshopState{
  private revision=0;private current:WeaponDefinition;private readonly requests=new Map<string,RedrawResult>();private readonly definitions=new Map<string,WeaponDefinition>();
  constructor(){const result=validatePistolDrawing({color:draftPistol.color,strokes:draftPistol.drawing});if(!result.ok)throw new Error('Invalid built-in draft pistol');this.current={weaponId:draftPistol.id,category:'pistol',color:draftPistol.color,revision:0,drawing:result.drawing};this.definitions.set(this.key(this.current),this.current);}
  get reference():WeaponReference{const {weaponId,category,color,revision}=this.current;return {weaponId,category,color,revision};}
  confirmRedraw(request:RedrawRequest,context:WorkshopContext):RedrawResult{
    const cached=this.requests.get(request.requestId);if(cached)return structuredClone(cached);let reason='invalid';const validated=validatePistolDrawing({color:request.color,strokes:(request.drawing as {strokes?:unknown})?.strokes??request.drawing});
    if(context.phase!=='day')reason='phase';else if(!context.alive)reason='dead';else if(context.distance>3.25)reason='distant';else if(request.category!=='pistol')reason='category';else if(!validated.ok)reason=validated.reason;else if(context.money<REDRAW_COST)reason='funds';else{const revision=++this.revision,weaponId=`pistol-${revision}`;this.current={weaponId,category:'pistol',color:request.color,revision,drawing:validated.drawing};this.definitions.set(this.key(this.current),this.current);const success={ok:true,reason:'ok',cost:REDRAW_COST,money:context.money-REDRAW_COST,reference:this.reference};this.remember(request.requestId,success);return structuredClone(success);}
    const failure={ok:false,reason,cost:0,money:context.money,reference:this.reference};this.remember(request.requestId,failure);return structuredClone(failure);
  }
  definition(weaponId:string,revision:number){const value=this.definitions.get(`${weaponId}:${revision}`);return value?structuredClone(value):undefined;}
  definitionsForJoin(){return [...this.definitions.values()].map(value=>structuredClone(value));}
  private key(reference:WeaponReference){return `${reference.weaponId}:${reference.revision}`;}
  private remember(id:string,result:RedrawResult){this.requests.set(id,result);while(this.requests.size>64)this.requests.delete(this.requests.keys().next().value!);}
}
