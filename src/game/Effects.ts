import * as T from 'three';
import { C } from '../config/gameplay';
export class Effects {
  private particles:{mesh:T.Mesh;velocity:T.Vector3;life:number}[]=[];
  private geometry=new T.IcosahedronGeometry(.055,0);private material=new T.MeshBasicMaterial({color:0x252824});
  flash:T.Mesh;private flashTimer=0;
  private tracer:T.Line;private tracerTimer=0;
  constructor(private scene:T.Scene) {
    this.flash=new T.Mesh(new T.OctahedronGeometry(.14),new T.MeshBasicMaterial({color:0xffd46a}));this.flash.visible=false;scene.add(this.flash);
    this.tracer=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),new T.LineBasicMaterial({color:0xc6aa60,transparent:true,opacity:.65}));this.tracer.visible=false;this.tracer.frustumCulled=false;scene.add(this.tracer);
  }
  shot(origin:T.Vector3,target:T.Vector3) {this.flash.position.copy(origin);this.flash.visible=true;this.flashTimer=C.effects.flashLife;const p=this.tracer.geometry.getAttribute('position') as T.BufferAttribute;p.setXYZ(0,origin.x,origin.y,origin.z);p.setXYZ(1,target.x,target.y,target.z);p.needsUpdate=true;this.tracer.visible=true;this.tracerTimer=C.effects.tracerLife;}
  impact(p:T.Vector3) {for(let i=0;i<7&&this.particles.length<C.effects.maxParticles;i++){const mesh=new T.Mesh(this.geometry,this.material);mesh.position.copy(p);this.scene.add(mesh);this.particles.push({mesh,velocity:new T.Vector3((Math.random()-.5)*3,Math.random()*3,(Math.random()-.5)*3),life:C.effects.impactLife});}}
  slam(p:T.Vector3,radius:number) {for(let i=0;i<22&&this.particles.length<C.effects.maxParticles;i++){const angle=i/22*Math.PI*2,mesh=new T.Mesh(this.geometry,this.material);mesh.scale.setScalar(1.8);mesh.position.copy(p).add(new T.Vector3(Math.sin(angle)*radius*.3,.08,Math.cos(angle)*radius*.3));this.scene.add(mesh);this.particles.push({mesh,velocity:new T.Vector3(Math.sin(angle)*(3+Math.random()*3),1.5+Math.random()*2.5,Math.cos(angle)*(3+Math.random()*3)),life:C.effects.impactLife*1.8});}}
  update(dt:number) {this.flashTimer-=dt;this.flash.visible=this.flashTimer>0;this.tracerTimer-=dt;this.tracer.visible=this.tracerTimer>0;for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.life-=dt;if(p.life<=0){this.scene.remove(p.mesh);this.particles.splice(i,1);continue;}p.velocity.y-=dt*8;p.mesh.position.addScaledVector(p.velocity,dt);p.mesh.scale.setScalar(p.life/C.effects.impactLife);}}
  clear(){for(const p of this.particles)this.scene.remove(p.mesh);this.particles=[];this.flashTimer=this.tracerTimer=0;this.flash.visible=this.tracer.visible=false;}
}
