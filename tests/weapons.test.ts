import { describe,expect,it } from 'vitest';
import * as T from 'three';
import { C } from '../src/config/gameplay';
import { weaponCategories } from '../src/weapons/Categories';
import { draftPistol,normalizeWeaponDrawing,type CustomWeapon } from '../src/weapons/CustomWeapon';
import { createDrawnWeapon } from '../src/weapons/DrawnWeapon';

describe('fundação do arsenal desenhado',()=>{
  it('mantém a Pistola de Rascunho como categoria inicial e fonte do gameplay',()=>{expect(weaponCategories.pistol).toMatchObject({color:'#43b95f',price:0,unlockDay:1,implemented:true});expect(C.weapon).toBe(weaponCategories.pistol.gameplay);expect(C.weapon).toMatchObject({damage:26,magazine:8,reserve:72});});
  it('centraliza categorias futuras sem habilitar seu combate',()=>{expect(weaponCategories.smg).toMatchObject({color:'#8e55c7',mechanic:'ranged',implemented:false});expect(weaponCategories.flamethrower).toMatchObject({color:'#ef7b32',mechanic:'flame',implemented:false});expect(Object.values(weaponCategories).filter(category=>category.implemented).map(category=>category.id)).toEqual(['pistol']);});
  it('descreve o rabisco padrão com âncoras independentes da categoria',()=>{expect(draftPistol).toMatchObject({id:'draft-pistol-default',category:'pistol',color:'#43b95f',gripAnchor:{x:.38,y:.68},muzzleAnchor:{x:.96,y:.3}});expect(draftPistol.drawing.length).toBeGreaterThan(2);expect(draftPistol.drawing.flatMap(stroke=>stroke.points).length).toBeGreaterThan(10);});
  it('normaliza desenhos grandes preservando traços e proporção',()=>{const custom:CustomWeapon={id:'banana',category:'smg',color:'#8e55c7',scale:4,gripAnchor:{x:20,y:20},muzzleAnchor:{x:40,y:10},drawing:[{width:.03,points:[{x:10,y:10},{x:50,y:30}]}]};const normalized=normalizeWeaponDrawing(custom);expect(normalized.scale).toBe(1);expect(normalized.drawing[0].points).toEqual([{x:0,y:0},{x:1,y:.5}]);expect(normalized.gripAnchor).toEqual({x:.25,y:.25});expect(normalized.muzzleAnchor).toEqual({x:.75,y:0});});
  it('renderiza traços verdes e posiciona muzzle a partir do dado',()=>{const visual=createDrawnWeapon(draftPistol);let meshes=0,green=0;visual.root.traverse(object=>{if(object instanceof T.Mesh){meshes++;if(object.material instanceof T.MeshToonMaterial&&`#${object.material.color.getHexString()}`===draftPistol.color)green++;}});expect(visual.root.name).toBe('drawn-weapon-pistol');expect(meshes).toBeGreaterThan(10);expect(green).toBe(meshes);expect(visual.muzzle.position.z).toBeGreaterThan(0);expect(visual.muzzle.parent).toBe(visual.root);});
  it('normaliza automaticamente desenhos importados antes de renderizar',()=>{const huge:CustomWeapon={...draftPistol,id:'huge',scale:999,drawing:[{width:.04,points:[{x:1000,y:1000},{x:9000,y:1000}]}],gripAnchor:{x:1000,y:1000},muzzleAnchor:{x:9000,y:1000}};const visual=createDrawnWeapon(huge);expect(visual.muzzle.position.z).toBeCloseTo(1);});
});
