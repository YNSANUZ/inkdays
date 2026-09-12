import * as T from 'three';
import { C } from '../config/gameplay';
import type { Point } from '../simulation/Movement';
import { bake, box, cylinder, gray, ink, paper, shape, sphere, stroke } from './ink';
export interface Obstacle { x: number; z: number; w: number; d: number; height: number }
export class World {
  obstacles: Obstacle[] = []; solids: T.Mesh[] = []; sails = new T.Group(); group = new T.Group();
  constructor(scene: T.Scene) {
    const raw = new T.Group();
    const floor = new T.Mesh(new T.PlaneGeometry(260, 260), paper); floor.rotation.x = -Math.PI / 2; raw.add(floor);
    // Deterministic hand-drawn marks. Ground marks are geometry, not a wireframe.
    let seed = 7342; const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < 580; i++) {
      const x = (rnd() - .5) * 110, z = (rnd() - .5) * 110;
      if (Math.abs(x - Math.sin(z * .055) * 3) < 3) { stroke(raw, [x,.024,z], [x+.08,.024,z+.4+rnd()], .013, gray); continue; }
      const h = .12 + rnd() * .18;
      stroke(raw,[x,.025,z],[x-.1,h,z],.016); stroke(raw,[x,.025,z],[x+.08,h*.8,z+.04],.013);
    }
    // A softly outlined winding road.
    for (let i = -50; i < 70; i++) for (const side of [-1, 1]) {
      if (i % 4 === 0) continue;
      stroke(raw,[Math.sin(i*.055)*3+side*3,.02,i],[Math.sin((i+1)*.055)*3+side*3,.02,i+.7],.02,gray);
    }
    this.house(raw,-12,-13,7,5,4.4,true); this.house(raw,13,-22,5,5,3.5,false); this.house(raw,-23,9,5,4,3.4,false);
    this.windmill(raw,-25,-23);
    this.tower(raw,22,-69);
    for (const [x,z,s] of [[-17,6,1],[12,5,1.2],[25,-8,1],[-29,-19,1.3],[6,-36,1],[-8,-43,1.2],[29,25,1.3],[-24,29,1.1],[21,-42,.85]]) this.tree(raw,x,z,s);
    for (let i = 0; i < 22; i++) {
      const a = rnd()*Math.PI*2, r = 17+rnd()*24, x=Math.sin(a)*r, z=Math.cos(a)*r;
      if (this.blocked(x,z,2)) continue;
      const s=.45+rnd()*.7; const rock = shape(raw,new T.IcosahedronGeometry(1,0),gray,[x,s*.48,z],[s,s*.8,s*1.1]); rock.rotation.y=rnd()*6;
      this.obstacles.push({x,z,w:s,d:s,height:s});
    }
    this.fence(raw,-17,-5,8); this.fence(raw,9,-13,5); this.fence(raw,-30,19,6); this.fence(raw,14,19,6);
    for (const [x,z] of [[7,-6],[-6,-21],[10,14]]) { box(raw,[x,.6,z],[1.2,1.2,1.2]); stroke(raw,[x-.54,.1,z+.62],[x+.54,1.1,z+.62]); stroke(raw,[x+.54,.1,z+.62],[x-.54,1.1,z+.62]); this.obstacles.push({x,z,w:.65,d:.65,height:1.25}); }
    // Low hills outside the playable clearing retain an open horizon.
    for (let i=0;i<12;i++) { const a=i*Math.PI/6; sphere(raw,[Math.sin(a)*80,-8,Math.cos(a)*80],[25,13+(i%3)*2,19]); }
    // Boundary is drawn as a broken ink ring; no invisible unmarked wall.
    for (let i=0;i<180;i++) { const a=i/180*Math.PI*2,b=(i+.65)/180*Math.PI*2; stroke(raw,[Math.sin(a)*C.world.radius,.025,Math.cos(a)*C.world.radius],[Math.sin(b)*C.world.radius,.025,Math.cos(b)*C.world.radius],.035,gray); }
    this.group.add(bake(raw)); this.group.add(this.sails); scene.add(this.group);
    for (const o of this.obstacles) { const m=new T.Mesh(new T.BoxGeometry(o.w*2,o.height,o.d*2),new T.MeshBasicMaterial({visible:false})); m.position.set(o.x,o.height/2,o.z); this.group.add(m); this.solids.push(m); }
    this.group.updateMatrixWorld(true);
  }
  blocked(x:number,z:number,r:number) { return this.obstacles.some(o=>Math.abs(x-o.x)<o.w+r&&Math.abs(z-o.z)<o.d+r); }
  move(pos:Point,dx:number,dz:number,r:number) {
    // Axis-separated movement slides along walls and stops at the clearing boundary.
    const nx=pos.x+dx; if (!this.blocked(nx,pos.z,r)) pos.x=nx;
    const nz=pos.z+dz; if (!this.blocked(pos.x,nz,r)) pos.z=nz;
    const distance=Math.hypot(pos.x,pos.z); if(distance>C.world.radius-r) {pos.x*= (C.world.radius-r)/distance;pos.z*=(C.world.radius-r)/distance;}
  }
  private house(p:T.Group,x:number,z:number,w:number,d:number,h:number,barn:boolean) {
    box(p,[x,h/2,z],[w,h,d]);
    const roof = new T.CylinderGeometry(1,1,1,3); roof.rotateY(Math.PI/2); roof.rotateZ(Math.PI/2);
    shape(p,roof,paper,[x,h+.65,z],[w+.8,1.7,d*.7]);
    // Roof panels and plank seams, doors, and cross bracing.
    for(let i=0;i<9;i++) { const px=x-w/2+i*w/8; stroke(p,[px,.2,z+d/2+.038],[px,h-.15,z+d/2+.038],.018,ink); }
    for(const side of [-1,1]) {stroke(p,[x+side*w/2,.02,z-d/2],[x+side*w/2,h,z-d/2],.035);stroke(p,[x+side*w/2,.02,z+d/2],[x+side*w/2,h,z+d/2],.035);stroke(p,[x+side*w/2,h,z-d/2],[x+side*w/2,h,z+d/2],.035);}
    box(p,[x,1.2,z+d/2+.04],[barn?2.3:1.2,2.4,.06],gray);
    if(barn) {stroke(p,[x-1.05,.12,z+d/2+.09],[x+1.05,2.3,z+d/2+.09]);stroke(p,[x+1.05,.12,z+d/2+.09],[x-1.05,2.3,z+d/2+.09]);}
    box(p,[x+w*.32,h*.67,z+d/2+.035],[.8,.9,.07],ink);
    stroke(p,[x+w*.32-.35,h*.67,z+d/2+.08],[x+w*.32+.35,h*.67,z+d/2+.08],.025,paper);
    if(!barn) box(p,[x-w*.28,h+1,z],[.55,2,.7]);
    this.obstacles.push({x,z,w:w/2+.08,d:d/2+.08,height:h+1.7});
  }
  private windmill(p:T.Group,x:number,z:number) {
    shape(p,new T.CylinderGeometry(1.8,2.7,9,12),paper,[x,4.5,z],[1,1,1]);
    shape(p,new T.ConeGeometry(2.6,2,12),gray,[x,10,z],[1,1,1]);
    for(let i=0;i<3;i++) box(p,[x,2+i*2.2,z+2.25],[.6,.9,.15],ink);
    this.sails.position.set(x,7.8,z+2.7);
    for(let i=0;i<4;i++) {const arm=new T.Group();arm.rotation.z=i*Math.PI/2+.3;stroke(arm,[0,0,0],[0,5.8,0],.085);box(arm,[.45,3.7,0],[.9,3.2,.12]);for(let j=0;j<6;j++)stroke(arm,[0,2.2+j*.55,.1],[.9,2.2+j*.55,.1],.022);this.sails.add(arm);}
    sphere(this.sails,[0,0,.13],[.3,.3,.2],gray);this.obstacles.push({x,z,w:2.7,d:2.7,height:11});
  }
  private tower(p:T.Group,x:number,z:number) {box(p,[x,9,z],[3,18,3]);shape(p,new T.ConeGeometry(2.8,4,4),gray,[x,20,z],[1,1,1]);for(let i=0;i<5;i++)box(p,[x,3+i*3,z+1.52],[.55,1.3,.03],ink);stroke(p,[x,22,z],[x,24,z],.05);}
  private tree(p:T.Group,x:number,z:number,s:number) {
    cylinder(p,[x,1.8*s,z],[.23*s,3.6*s,.23*s],paper);
    stroke(p,[x,2*s,z],[x-1.2*s,3.8*s,z],.12*s,paper);stroke(p,[x,2.8*s,z],[x+1.4*s,4.3*s,z],.12*s,paper);
    for(const [dx,dy,dz,r] of [[0,4.7,0,1.7],[-1.3,4.1,0,1.2],[1.4,4.3,.1,1.3],[0,4,.8,1.4]]) sphere(p,[x+dx*s,dy*s,z+dz*s],[r*s,r*s*.85,r*s],paper);
    for(let i=0;i<8;i++)stroke(p,[x+(i%4-1.5)*.5*s,(4.2+Math.floor(i/4)*.6)*s,z+1.4*s],[x+(i%4-1.4)*.5*s,(4.1+Math.floor(i/4)*.6)*s,z+1.44*s],.025);
    this.obstacles.push({x,z,w:.3*s,d:.3*s,height:3.2*s});
  }
  private fence(p:T.Group,x:number,z:number,n:number) { for(let i=0;i<=n;i++)box(p,[x+i*1.7,.65,z],[.13,1.3,.15],gray); for(let i=0;i<n;i++) {box(p,[x+i*1.7+.85,.45,z],[1.7,.09,.1]);box(p,[x+i*1.7+.85,.95,z],[1.7,.09,.1]);} this.obstacles.push({x:x+n*.85,z,w:n*.85+.12,d:.13,height:1.3}); }
}
