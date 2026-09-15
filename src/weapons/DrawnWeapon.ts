import * as T from 'three';
import { stroke } from '../world/ink';
import { normalizeWeaponDrawing, type CustomWeapon, type DrawingPoint, type WeaponAnchor } from './CustomWeapon';

const position=(point:DrawingPoint,grip:WeaponAnchor,scale:number):[number,number,number]=>[0,(grip.y-point.y)*scale,(point.x-grip.x)*scale];
export function createDrawnWeapon(weapon:CustomWeapon){
  const normalized=normalizeWeaponDrawing(weapon);
  const root=new T.Group();root.name=`drawn-weapon-${normalized.category}`;
  const material=new T.MeshToonMaterial({color:normalized.color});
  for(const drawingStroke of normalized.drawing)for(let index=1;index<drawingStroke.points.length;index++)stroke(root,position(drawingStroke.points[index-1],normalized.gripAnchor,normalized.scale),position(drawingStroke.points[index],normalized.gripAnchor,normalized.scale),drawingStroke.width*normalized.scale,material);
  const grip=new T.Object3D();grip.name='grip-anchor';root.add(grip);
  const muzzle=new T.Object3D();muzzle.name='muzzle-anchor';const anchor=normalized.muzzleAnchor??normalized.gripAnchor;muzzle.position.set(...position(anchor,normalized.gripAnchor,normalized.scale));root.add(muzzle);
  return {root,grip,muzzle};
}
