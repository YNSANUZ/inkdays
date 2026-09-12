import { C } from '../config/gameplay';
import type { Command } from '../input/Input';
import { movePlayer } from '../simulation/Movement';
import type { CollisionWorld, Motion, Point } from '../simulation/Movement';
export interface PredictionInput {sequence:number;yaw:number;command:Command}
export interface AuthoritativeMotion {acknowledged:number;position:Point;velocity:Point;vertical:number}
const cloneMotion=(state:AuthoritativeMotion):Motion=>({position:{...state.position},velocity:{...state.velocity},vertical:state.vertical});
/** Local responsiveness with authoritative rewind/replay and visual correction decay. */
export class ClientPrediction {
  motion:Motion;renderPosition:Point;private pending:PredictionInput[]=[];private correction={x:0,y:0,z:0};private reliable:{jump:number|null;reload:number|null}={jump:null,reload:null};
  constructor(private world:CollisionWorld,initial:AuthoritativeMotion){this.motion=cloneMotion(initial);this.renderPosition={...initial.position};}
  prepare(sequence:number,command:Command){
    if(command.jump)this.reliable.jump=sequence;if(command.reload)this.reliable.reload=sequence;const within=(start:number|null)=>start!==null&&sequence-start<=30;
    return {...command,jump:within(this.reliable.jump),reload:within(this.reliable.reload)};
  }
  submit(input:PredictionInput){this.pending.push(input);movePlayer(this.motion,input.command,input.yaw,this.world);this.updateRender(0);}
  reconcile(state:AuthoritativeMotion){
    const before={...this.renderPosition};for(const action of ['jump','reload'] as const)if(this.reliable[action]!==null&&this.reliable[action]!<=state.acknowledged)this.reliable[action]=null;this.pending=this.pending.filter(i=>i.sequence>state.acknowledged);this.motion=cloneMotion(state);
    for(const input of this.pending)movePlayer(this.motion,input.command,input.yaw,this.world);
    const error=Math.hypot(before.x-this.motion.position.x,before.y-this.motion.position.y,before.z-this.motion.position.z);
    this.correction=error>3?{x:0,y:0,z:0}:{x:before.x-this.motion.position.x,y:before.y-this.motion.position.y,z:before.z-this.motion.position.z};
    this.updateRender(0);return error;
  }
  updateRender(dt:number){const decay=Math.exp(-12*dt);this.correction.x*=decay;this.correction.y*=decay;this.correction.z*=decay;this.renderPosition={x:this.motion.position.x+this.correction.x,y:this.motion.position.y+this.correction.y,z:this.motion.position.z+this.correction.z};}
  get pendingCount(){return this.pending.length;}
  get reliableActions(){return {...this.reliable};}
  static fixedStep=C.fixedStep;
}
