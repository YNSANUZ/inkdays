import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
const gradient = new T.DataTexture(new Uint8Array([175, 220, 255]), 3, 1, T.RedFormat); gradient.needsUpdate = true; gradient.minFilter = gradient.magFilter = T.NearestFilter;
export const paper = new T.MeshToonMaterial({ color: 0xf7f5ed, gradientMap: gradient });
export const gray = new T.MeshToonMaterial({ color: 0xb8b9b1, gradientMap: gradient });
export const dark = new T.MeshToonMaterial({ color: 0x303331, gradientMap: gradient });
export const ink = new T.MeshBasicMaterial({ color: 0x171b19 });
export const red = new T.MeshBasicMaterial({ color: 0xe94b40 });
const outline = new T.MeshBasicMaterial({ color: 0x181b19, side: T.BackSide });
// O cenário já recebe seu traço pelo casco invertido criado em `shape`.
// Impede que o OutlineEffect desenhe uma segunda linha sobre o mapa.
for (const material of [paper, gray, dark, ink, red, outline]) {
  material.userData.outlineParameters = { visible: false };
}
const boxGeo = new T.BoxGeometry(1, 1, 1);
const sphereGeo = new T.SphereGeometry(1, 16, 12);
const cylinderGeo = new T.CylinderGeometry(1, 1, 1, 10);
export function shape(parent: T.Object3D, geo: T.BufferGeometry, mat: T.Material, pos: number[], scale: number[], edged = true) {
  const mesh = new T.Mesh(geo, mat); mesh.position.set(pos[0], pos[1], pos[2]); mesh.scale.set(scale[0], scale[1], scale[2]); parent.add(mesh);
  if (edged) { const edge = new T.Mesh(geo, outline); edge.scale.set(1 + .045 / scale[0], 1 + .045 / scale[1], 1 + .045 / scale[2]); mesh.add(edge); }
  return mesh;
}
export const box = (p: T.Object3D, pos: number[], scale: number[], mat: T.Material = paper) => shape(p, boxGeo, mat, pos, scale);
export const sphere = (p: T.Object3D, pos: number[], scale: number[], mat: T.Material = paper) => shape(p, sphereGeo, mat, pos, scale);
export const cylinder = (p: T.Object3D, pos: number[], scale: number[], mat: T.Material = paper) => shape(p, cylinderGeo, mat, pos, scale);
export function stroke(p: T.Object3D, a: number[], b: number[], width = .025, mat: T.Material = ink) {
  const av = new T.Vector3(...a), bv = new T.Vector3(...b), d = bv.clone().sub(av);
  const m = shape(p, cylinderGeo, mat, av.add(bv).multiplyScalar(.5).toArray(), [width, d.length(), width], false); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); return m;
}
export function bake(group: T.Group) {
  group.updateMatrixWorld(true);
  const byMaterial = new Map<T.Material, T.BufferGeometry[]>();
  group.traverse(o => { if (o instanceof T.Mesh && o.material instanceof T.Material) { const list = byMaterial.get(o.material) ?? []; list.push(o.geometry.clone().applyMatrix4(o.matrixWorld)); byMaterial.set(o.material, list); } });
  const result = new T.Group();
  for (const [mat, geometries] of byMaterial) { const normalized = geometries.map(g => g.index ? g.toNonIndexed() : g); const g = mergeGeometries(normalized); if (g) result.add(new T.Mesh(g, mat)); new Set([...geometries,...normalized]).forEach(g => g.dispose()); }
  return result;
}
const shadowGeometry=new T.CircleGeometry(1,24);
const shadowMaterial=new T.MeshBasicMaterial({color:0x343934,transparent:true,opacity:.12,depthWrite:false});
shadowMaterial.userData.outlineParameters={visible:false};
export function shadow(parent: T.Object3D, size: number) {
  const m = new T.Mesh(shadowGeometry, shadowMaterial);m.scale.setScalar(size); m.rotation.x = -Math.PI / 2; m.position.y = .018; parent.add(m); return m;
}
