import * as T from 'three';
import { World } from '../world/World';
import { Avatar } from '../player/Avatar';
import { ThirdPerson } from '../camera/ThirdPerson';
import { Input } from '../input/Input';
import { TouchControls } from '../input/TouchControls';
import type { MovementAuthority } from './MovementAuthority';
type Snapshot=ReturnType<MovementAuthority['snapshot']>;
export function mountCoopPreview(app:HTMLElement){
  const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));app.append(renderer.domElement);
  const scene=new T.Scene();scene.background=new T.Color(0xf3f1e9);scene.fog=new T.Fog(0xf3f1e9,43,130);scene.add(new T.HemisphereLight(0xffffff,0xb4b7af,2.1));
  const light=new T.DirectionalLight(0xffffff,2.3);light.position.set(-20,35,10);scene.add(light);
  const world=new World(scene),camera=new ThirdPerson();
  const panel=document.createElement('div');Object.assign(panel.style,{position:'fixed',top:'12px',left:'12px',zIndex:'20',background:'#f3f1e9',padding:'12px',maxWidth:'360px'});
  panel.innerHTML='<strong>COOP · TESTE DE MOVIMENTO</strong><p role="status">Conectando…</p><button>CONTINUAR</button><p>WASD · mouse · espaço · C<br>Sem combate nesta bancada. Esc libera o mouse.</p>';app.append(panel);
  const status=panel.querySelector('p')!,button=panel.querySelector('button')!;
  let id='',snapshot:Snapshot|null=null,sequence=0,last=0,elapsed=0,connected=false;
  const avatars=new Map<string,Avatar>();
  const pause=()=>{input.active=false;input.clear();touch.setActive(false);button.hidden=false;if(document.pointerLockElement)document.exitPointerLock();};
  const input=new Input(renderer.domElement,pause,()=>{}),touch=new TouchControls(input,pause,()=>{if(input.active)void renderer.domElement.requestPointerLock()?.catch(()=>{});});
  button.onclick=()=>{if(!connected)return;input.active=true;button.hidden=true;if(!touch.enabled)void renderer.domElement.requestPointerLock()?.catch(()=>{status.textContent='Segure o botão direito para mirar.';});};
  const socket=new WebSocket('ws://127.0.0.1:8787');
  socket.onmessage=e=>{
    const packet=JSON.parse(e.data);
    if(packet.type==='welcome'){id=packet.id;connected=true;status.textContent='Conectado. Abra outra aba em /?coop=1.';}
    if(packet.type==='snapshot'){
      snapshot=packet;status.textContent=`${packet.players.length}/2 conectados · servidor tick ${packet.tick}`;
      const ids=new Set((packet as Snapshot).players.map(p=>p.id));
      for(const [key,avatar] of avatars)if(!ids.has(key)){scene.remove(avatar.root);avatars.delete(key);}
      for(const player of (packet as Snapshot).players)if(!avatars.has(player.id)){const avatar=new Avatar();avatar.root.position.copy(player.position);avatars.set(player.id,avatar);scene.add(avatar.root);}
    }
  };
  socket.onclose=e=>{connected=false;pause();status.textContent=e.reason||'Servidor desconectado. Recarregue para tentar novamente.';};
  socket.onerror=()=>{status.textContent='Servidor local indisponível. Execute npm run coop:server.';};
  window.addEventListener('pagehide',()=>socket.close());
  window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
  const resize=()=>{renderer.setSize(innerWidth,innerHeight);camera.camera.aspect=innerWidth/innerHeight;camera.camera.updateProjectionMatrix();};window.addEventListener('resize',resize);resize();
  function frame(now:number){
    requestAnimationFrame(frame);const dt=Math.min(.1,(now-(last||now))/1000);last=now;elapsed+=dt;
    camera.look(input.lookX,input.lookY,1);input.lookX=input.lookY=0;touch.setActive(input.active&&innerWidth>innerHeight);
    if(connected&&socket.readyState===WebSocket.OPEN&&elapsed>=1/30){
      elapsed=0;const command=input.consume();socket.send(JSON.stringify({version:1,sequence:sequence++,yaw:Math.atan2(Math.sin(camera.yaw),Math.cos(camera.yaw)),command}));
    }
    if(snapshot)for(const player of snapshot.players){
      const avatar=avatars.get(player.id)!;avatar.root.position.lerp(new T.Vector3(player.position.x,player.position.y,player.position.z),1-Math.exp(-20*dt));avatar.root.rotation.y=player.yaw+Math.PI;avatar.animate(now/1000,Math.hypot(player.velocity.x,player.velocity.z),false);
    }
    camera.update(dt,avatars.get(id)?.root.position??new T.Vector3(0,0,10),world);renderer.render(scene,camera.camera);
  }
  requestAnimationFrame(frame);
}
