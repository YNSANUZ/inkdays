import {describe,expect,it} from 'vitest';
import {simplifyStroke,validatePistolDrawing,WEAPON_COLORS} from '../src/weapons/WeaponWorkshopRules';

const valid=()=>({color:'#43b95f',strokes:[{width:.03,points:[{x:.3,y:.7},{x:.35,y:.55},{x:.5,y:.45},{x:.7,y:.4},{x:.9,y:.4}]}]});
describe('weapon workshop rules',()=>{
  it('accepts a finite pistol drawing touching grip, body and barrel',()=>{const result=validatePistolDrawing(valid());expect(result.ok).toBe(true);if(result.ok)expect(result.drawing.validated).toBe(true);});
  it('rejects an empty drawing',()=>expect(validatePistolDrawing({...valid(),strokes:[]})).toMatchObject({ok:false}));
  it.each([Number.NaN,Infinity])('rejects non-finite coordinate %s',number=>{const drawing=valid();drawing.strokes[0].points[0].x=number;expect(validatePistolDrawing(drawing)).toMatchObject({ok:false,reason:'point'});});
  it('rejects coordinates outside normalized bounds',()=>{const drawing=valid();drawing.strokes[0].points[0].x=1.1;expect(validatePistolDrawing(drawing)).toMatchObject({ok:false,reason:'point'});});
  it('rejects excessive width, strokes and points',()=>{expect(validatePistolDrawing({...valid(),strokes:[{...valid().strokes[0],width:.2}]})).toMatchObject({ok:false});expect(validatePistolDrawing({...valid(),strokes:Array.from({length:25},()=>valid().strokes[0])})).toMatchObject({ok:false});expect(validatePistolDrawing({...valid(),strokes:[{width:.03,points:Array.from({length:65},(_,i)=>({x:i/64,y:.5}))}]})).toMatchObject({ok:false});});
  it('rejects drawings missing a required silhouette zone',()=>expect(validatePistolDrawing({color:'#43b95f',strokes:[{width:.03,points:[{x:.1,y:.1},{x:.2,y:.2}]}]})).toMatchObject({ok:false,reason:'zones'}));
  it('simplifies a noisy straight stroke while preserving endpoints',()=>{const points=Array.from({length:40},(_,i)=>({x:i/39,y:.5+(i%2?.0001:-.0001)})),result=simplifyStroke(points);expect(result.length).toBe(2);expect(result[0]).toEqual(points[0]);expect(result.at(-1)).toEqual(points.at(-1));});
  it('keeps pure red reserved from the weapon palette',()=>expect(WEAPON_COLORS).not.toContain('#ff0000'));
});
