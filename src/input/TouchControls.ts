import type { Input } from './Input';
import { joystick } from './TouchState';
export const touchDevice=()=>matchMedia('(pointer: coarse)').matches||new URLSearchParams(location.search).get('touch')==='1';
export class TouchControls {
  enabled=touchDevice();readonly root=document.createElement('section');
  private active=false;private stickId:number|null=null;private lookId:number|null=null;private fireId:number|null=null;
  private origin={x:0,y:0};private last=new Map<number,{x:number;y:number}>();
  constructor(private input:Input,onPause:()=>void,onMouse:()=>void=()=>{}) {
    document.body.classList.toggle('touch-mode',this.enabled);this.root.className='touch-controls hidden';this.root.setAttribute('aria-label','Controles touch');
    window.addEventListener('pointerdown',e=>{
      const enabled=e.pointerType==='touch'?true:e.pointerType==='mouse'?false:this.enabled;
      if(enabled===this.enabled)return;
      this.reset();this.active=false;this.enabled=enabled;
      document.body.classList.toggle('touch-mode',enabled);
      this.root.classList.add('hidden');
      if(!enabled)onMouse();
    },true);
    this.root.innerHTML=`<div class="touch-look" aria-label="Arraste para mirar"><span>ARRASTE PARA MIRAR</span></div>
      <div class="touch-stick" role="group" aria-label="Analógico de movimento"><div class="stick-ring"></div><div class="stick-knob"></div><small>MOVER</small></div>
      <button class="touch-button touch-run" aria-label="Alternar corrida" aria-pressed="false">⇈<small>CORRER</small></button>
      <button class="touch-button touch-fire" aria-label="Atirar e arrastar para mirar">◎<small>ATIRAR</small></button>
      <button class="touch-button touch-reload" aria-label="Recarregar">↻<small>RECARGA</small></button>
      <button class="touch-button touch-jump" aria-label="Pular">↥<small>PULAR</small></button>
      <button class="touch-button touch-crouch" aria-label="Alternar agachamento" aria-pressed="false">⌄<small>AGACHAR</small></button>
      <button class="touch-button touch-pause" aria-label="Pausar partida">Ⅱ</button>`;
    document.body.append(this.root);
    const stick=this.el('.touch-stick'),look=this.el('.touch-look'),fire=this.el('.touch-fire');
    const capture=(el:HTMLElement,e:PointerEvent)=>{e.preventDefault();el.setPointerCapture(e.pointerId);};
    stick.addEventListener('pointerdown',e=>{if(!this.active||this.stickId!==null)return;capture(stick,e);this.stickId=e.pointerId;const r=stick.getBoundingClientRect();this.origin={x:r.left+r.width/2,y:r.top+r.height/2};this.moveStick(e);});
    stick.addEventListener('pointermove',e=>{if(this.active&&e.pointerId===this.stickId)this.moveStick(e);});
    const stickUp=(e:PointerEvent)=>{if(e.pointerId!==this.stickId)return;this.stickId=null;this.input.touch.x=this.input.touch.z=0;this.el('.stick-knob').style.transform='translate(-50%,-50%)';};
    for(const event of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(event,e=>stickUp(e as PointerEvent));
    const beginLook=(el:HTMLElement,e:PointerEvent,isFire:boolean)=>{if(!this.active||(isFire?this.fireId!==null:this.lookId!==null))return;capture(el,e);if(isFire){this.fireId=e.pointerId;this.input.touch.fire=true;this.input.touch.trigger('fire');fire.classList.add('held');}else this.lookId=e.pointerId;this.last.set(e.pointerId,{x:e.clientX,y:e.clientY});};
    look.addEventListener('pointerdown',e=>beginLook(look,e,false));fire.addEventListener('pointerdown',e=>beginLook(fire,e,true));
    for(const el of [look,fire]) {
      el.addEventListener('pointermove',e=>{const last=this.last.get(e.pointerId);if(!this.active||!last)return;const scale=720/Math.max(360,window.innerHeight);this.input.lookX+=(e.clientX-last.x)*scale;this.input.lookY+=(e.clientY-last.y)*scale;this.last.set(e.pointerId,{x:e.clientX,y:e.clientY});});
      const end=(e:PointerEvent)=>{this.last.delete(e.pointerId);if(e.pointerId===this.lookId)this.lookId=null;if(e.pointerId===this.fireId){this.fireId=null;this.input.touch.fire=false;fire.classList.remove('held');}};
      for(const event of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(event,e=>end(e as PointerEvent));
    }
    for(const action of ['jump','reload'] as const)this.el(`.touch-${action}`).addEventListener('pointerdown',e=>{if(!this.active)return;e.preventDefault();this.input.touch.trigger(action);});
    for(const action of ['run','crouch'] as const)this.el(`.touch-${action}`).addEventListener('click',()=>{if(!this.active)return;this.input.touch[action]=!this.input.touch[action];if(this.input.touch[action])this.input.touch[action==='run'?'crouch':'run']=false;this.updateToggles();});
    this.el('.touch-pause').addEventListener('click',onPause);this.root.addEventListener('contextmenu',e=>e.preventDefault());input.onClear=()=>this.reset();
  }
  private el(q:string){return this.root.querySelector<HTMLElement>(q)!;}
  private moveStick(e:PointerEvent){const dx=e.clientX-this.origin.x,dy=e.clientY-this.origin.y,radius=this.el('.touch-stick').clientWidth*.36;const c=joystick(dx,dy,radius);this.input.touch.x=c.x;this.input.touch.z=c.z;const factor=Math.min(1,radius/Math.max(1,Math.hypot(dx,dy)));this.el('.stick-knob').style.transform=`translate(calc(-50% + ${dx*factor}px),calc(-50% + ${dy*factor}px))`;}
  private updateToggles(){for(const action of ['run','crouch'] as const)this.el(`.touch-${action}`).setAttribute('aria-pressed',String(this.input.touch[action]));}
  private reset(){this.stickId=this.lookId=this.fireId=null;this.last.clear();this.input.touch.clear();if(!this.enabled)return;this.el('.stick-knob').style.transform='translate(-50%,-50%)';this.el('.touch-fire').classList.remove('held');this.updateToggles();}
  setActive(active:boolean){if(!this.enabled||active===this.active)return;this.active=active;this.root.classList.toggle('hidden',!active);if(!active)this.reset();}
}
