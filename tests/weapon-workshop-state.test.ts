import {describe,expect,it} from 'vitest';
import {WeaponWorkshopState} from '../src/weapons/WeaponWorkshopState';

const drawing={strokes:[{width:.03,points:[{x:.3,y:.7},{x:.35,y:.55},{x:.5,y:.45},{x:.7,y:.4},{x:.9,y:.4}]}]};
const request=(id='r1')=>({requestId:id,category:'pistol',color:'#43b95f',drawing});
const context=()=>({phase:'day' as const,alive:true,distance:1,money:200});
describe('weapon workshop state',()=>{
  it('charges $120 and increments revision only on valid confirmation',()=>{const state=new WeaponWorkshopState(),result=state.confirmRedraw(request(),context());expect(result).toMatchObject({ok:true,cost:120,money:80,reference:{category:'pistol',revision:1}});expect(state.definition(result.reference.weaponId,1)).toBeTruthy();});
  it('replays a duplicate request without a second revision',()=>{const state=new WeaponWorkshopState(),first=state.confirmRedraw(request(),context()),second=state.confirmRedraw(request(),{...context(),money:80});expect(second).toEqual(first);expect(state.reference.revision).toBe(1);});
  it.each([
    ['phase',{phase:'horde' as const}],['dead',{alive:false}],['distant',{distance:10}],['funds',{money:119}],
  ])('rejects %s without changing the weapon',(_reason,change)=>{const state=new WeaponWorkshopState(),before=state.reference,result=state.confirmRedraw(request(),{...context(),...change});expect(result.ok).toBe(false);expect(result.money).toBe({...context(),...change}.money);expect(state.reference).toEqual(before);});
  it('rejects future categories and invalid drawings',()=>{const state=new WeaponWorkshopState();expect(state.confirmRedraw({...request(),category:'smg'},context())).toMatchObject({ok:false,reason:'category'});expect(state.confirmRedraw({...request('r2'),drawing:{strokes:[]}},context())).toMatchObject({ok:false});});
  it('provides the default and revised definitions for reconnect',()=>{const state=new WeaponWorkshopState();state.confirmRedraw(request(),context());expect(state.definitionsForJoin().map(item=>item.revision)).toEqual([0,1]);});
});
