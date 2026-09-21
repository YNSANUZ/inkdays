import { weaponCategories, type WeaponCategoryId } from './Categories';
export interface DrawingPoint {x:number;y:number}
export interface DrawingStroke {points:DrawingPoint[];width:number}
export interface WeaponAnchor {x:number;y:number}
export interface CustomWeapon {
  id:string;category:WeaponCategoryId;color:string;drawing:DrawingStroke[];gripAnchor:WeaponAnchor;muzzleAnchor?:WeaponAnchor;flameOrigin?:WeaponAnchor;scale:number;
}
export const draftPistol:CustomWeapon={
  id:'draft-pistol-default',category:'pistol',color:weaponCategories.pistol.color,scale:.44,gripAnchor:{x:.38,y:.68},muzzleAnchor:{x:.96,y:.3},drawing:[
    {width:.024,points:[{x:.07,y:.24},{x:.9,y:.23},{x:.97,y:.31},{x:.91,y:.38},{x:.51,y:.4},{x:.45,y:.5},{x:.43,y:.86},{x:.25,y:.88},{x:.28,y:.48},{x:.08,y:.43},{x:.07,y:.24}]},
    {width:.015,points:[{x:.12,y:.29},{x:.86,y:.28},{x:.92,y:.32}]},
    {width:.014,points:[{x:.3,y:.49},{x:.47,y:.5},{x:.39,y:.6},{x:.29,y:.58}]},
    {width:.012,points:[{x:.23,y:.35},{x:.72,y:.34}]},
  ],
};
export function normalizeWeaponDrawing(weapon:CustomWeapon):CustomWeapon{
  const points=weapon.drawing.flatMap(stroke=>stroke.points);if(!points.length)return {...weapon,scale:1};
  const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y)),size=Math.max(maxX-minX,maxY-minY,1e-6);
  const point=(p:DrawingPoint)=>({x:(p.x-minX)/size,y:(p.y-minY)/size});
  return {...weapon,scale:Math.min(1,Math.max(.1,weapon.scale)),drawing:weapon.drawing.map(stroke=>({...stroke,points:stroke.points.map(point)})),gripAnchor:point(weapon.gripAnchor),muzzleAnchor:weapon.muzzleAnchor?point(weapon.muzzleAnchor):undefined,flameOrigin:weapon.flameOrigin?point(weapon.flameOrigin):undefined};
}
