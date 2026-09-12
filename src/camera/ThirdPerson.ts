import * as T from 'three';
import { C } from '../config/gameplay';
import type { World } from '../world/World';
export class ThirdPerson {
  camera=new T.PerspectiveCamera(C.camera.fov,16/9,.08,190); yaw=0; pitch=.19; shake=0;
  private ray=new T.Raycaster(); private initialized=false;
  look(dx:number,dy:number,sensitivity:number) {this.yaw-=dx*C.camera.sensitivity*sensitivity;this.pitch=T.MathUtils.clamp(this.pitch+dy*C.camera.sensitivity*sensitivity,C.camera.minPitch,C.camera.maxPitch);}
  forward() {return new T.Vector3(-Math.sin(this.yaw)*Math.cos(this.pitch),-Math.sin(this.pitch),-Math.cos(this.yaw)*Math.cos(this.pitch));}
  update(dt:number,pos:T.Vector3,world:World,immediate=false) {
    const f=this.forward(), right=new T.Vector3(Math.cos(this.yaw),0,-Math.sin(this.yaw));
    const target=pos.clone().add(new T.Vector3(0,C.camera.height,0));
    const desired=target.clone().addScaledVector(f,-C.camera.distance).addScaledVector(right,C.camera.shoulder);
    const delta=desired.clone().sub(target),dist=delta.length();this.ray.set(target,delta.normalize());this.ray.far=dist+C.camera.radius;
    const hits=this.ray.intersectObjects(world.solids,false);if(hits[0])desired.copy(target).addScaledVector(delta,Math.max(.35,hits[0].distance-C.camera.radius));
    desired.y=Math.max(.3,desired.y);
    if(immediate||!this.initialized||hits.length) {this.camera.position.copy(desired);this.initialized=true;} else this.camera.position.lerp(desired,1-Math.exp(-C.camera.smoothing*dt));
    this.camera.lookAt(this.camera.position.clone().addScaledVector(f,30));
    if(this.shake>0) {this.camera.rotateZ(Math.sin(this.shake*120)*this.shake*.015);this.shake=Math.max(0,this.shake-dt);}
    this.camera.updateMatrixWorld();
  }
}
