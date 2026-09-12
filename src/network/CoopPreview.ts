import * as T from 'three';
import { World } from '../world/World';
import { Avatar } from '../player/Avatar';
import { ThirdPerson } from '../camera/ThirdPerson';
import { Input } from '../input/Input';
import { TouchControls } from '../input/TouchControls';
import type { CombatAuthority } from './CombatAuthority';
import { Effects } from '../game/Effects';
import { GameAudio } from '../audio/Audio';
type Snapshot=ReturnType<CombatAuthority['snapshot']>;
export function mountCoopPreview(app:HTMLElement){
  const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));app.append(renderer.domElement);
  const scene=new T.Scene();scene.background=new T.Color(0xf3f1e9);scene.fog=new T.Fog(0xf3f1e9,43,130);scene.add(new T.HemisphereLight(0xffffff,0xb4b7af,2.1));
  const light=new T.DirectionalLight(0xffffff,2.3);light.position.set(-20,35,10);scene.add(light);
  const world=new World(scene),camera=new ThirdPerson(),effects=new Effects(scene),audio=new GameAudio();
  const enemies=new Map<number,Avatar>(),labels=new Map<string,HTMLElement>();let lastShot=0;
  const crosshair=document.createElement('div');crosshair.textContent='+';Object.assign(crosshair.style,{position:'fixed',left:'50%',top:'50%',transform:'translate(-50%,-50%)',pointerEvents:'none',fontSize:'22px'});app.append(crosshair);
  const panel=document.createElement('div');Object.assign(panel.style,{position:'fixed',top:'12px',left:'12px',zIndex:'20',background:'#f3f1e9',padding:'12px',maxWidth:'360px'});
  panel.innerHTML='<strong>COOP · TESTE DE COMBATE</strong><p role="status">Conectando…</p><button>CONTINUAR</button><p>WASD · mouse · R recarrega<br>Esc libera o mouse; a partida continua.<br>Para reiniciar, feche as duas abas e abra novamente.</p>';app.append(panel);
  const status=panel.querySelector('p')!,button=panel.querySelector('button')!;
  let id='',snapshot:Snapshot|null=null,sequence=0,last=0,elapsed=0,connected=false;
  const avatars=new Map<string,Avatar>();
  const pause=()=>{input.active=false;input.clear();touch.setActive(false);button.hidden=false;if(document.pointerLockElement)document.exitPointerLock();};
  const input=new Input(renderer.domElement,pause,()=>{}),touch=new TouchControls(input,pause,()=>{if(input.active)void renderer.domElement.requestPointerLock()?.catch(()=>{});});
  button.onclick=()=>{if(!connected)return;input.active=true;audio.start();button.hidden=true;if(!touch.enabled)void renderer.domElement.requestPointerLock()?.catch(()=>{status.textContent='Segure o botão direito para mirar.';});};
  const socket=new WebSocket('ws://127.0.0.1:8787');let firstSnapshot=true;
  socket.onmessage=e=>{
    const packet=JSON.parse(e.data);
    if(packet.type==='welcome'){id=packet.id;connected=true;status.textContent='Conectado. Abra outra aba em /?coop=1.';}
    if(packet.type==='snapshot'){
      snapshot=packet;const state=packet as Snapshot,me=state.players.find(p=>p.id===id);
      status.textContent=`DIA ${state.day} · ${state.phase==='horde'?'HORDA':'PREPARAÇÃO'} ${Math.ceil(state.remaining)}s · ${state.players.length}/2 | Vida ${me?.health??0} · ${me?.ammo??0}/${me?.reserve??0} ${me?.reloading?'RECARREGANDO':''} · $${me?.money??0}${state.gameOver?' · FIM DE PARTIDA':me?.health===0?' · VOCÊ MORREU':''}`;
      const ids=new Set((packet as Snapshot).players.map(p=>p.id));
      for(const [key,avatar] of avatars)if(!ids.has(key)){scene.remove(avatar.root);avatars.delete(key);labels.get(key)?.remove();labels.delete(key);}
      for(const player of (packet as Snapshot).players)if(!avatars.has(player.id)){const avatar=new Avatar();avatar.root.position.copy(player.position);avatars.set(player.id,avatar);scene.add(avatar.root);}
      for(const player of state.players)if(player.id!==id&&!labels.has(player.id)){const label=document.createElement('span');label.textContent=player.name;Object.assign(label.style,{position:'fixed',background:'#171918cc',color:'white',padding:'3px 7px',fontSize:'11px',pointerEvents:'none'});app.append(label);labels.set(player.id,label);}
      const enemyIds=new Set(state.enemies.map(e=>e.id));for(const [key,avatar] of enemies)if(!enemyIds.has(key)){scene.remove(avatar.root);enemies.delete(key);}
      for(const enemy of state.enemies)if(!enemies.has(enemy.id)){const avatar=new Avatar(true);avatar.root.position.copy(enemy.position);enemies.set(enemy.id,avatar);scene.add(avatar.root);}
      if(firstSnapshot){lastShot=state.shots.at(-1)?.serial??0;firstSnapshot=false;}
      for(const shot of state.shots)if(shot.serial>lastShot){effects.shot(new T.Vector3().copy(shot.from),new T.Vector3().copy(shot.to));if(shot.hit)effects.impact(new T.Vector3().copy(shot.to));audio.cue('shot');lastShot=shot.serial;}
      if(me?.health===0&&input.active)pause();
    }
  };
  socket.onclose=e=>{connected=false;pause();audio.pause();status.textContent=e.reason||'Servidor desconectado. Recarregue para tentar novamente.';};
  socket.onerror=()=>{status.textContent='Servidor local indisponível. Execute npm run coop:server.';};
  window.addEventListener('pagehide',()=>socket.close());
  window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
  const resize=()=>{renderer.setSize(innerWidth,innerHeight);camera.camera.aspect=innerWidth/innerHeight;camera.camera.updateProjectionMatrix();};window.addEventListener('resize',resize);resize();
  function frame(now:number){
    requestAnimationFrame(frame);const dt=Math.min(.1,(now-(last||now))/1000);last=now;elapsed+=dt;
    camera.look(input.lookX,input.lookY,1);input.lookX=input.lookY=0;touch.setActive(input.active&&innerWidth>innerHeight);
    if(connected&&socket.readyState===WebSocket.OPEN&&elapsed>=1/30){
      elapsed=0;const command=input.consume();socket.send(JSON.stringify({version:1,sequence:sequence++,yaw:Math.atan2(Math.sin(camera.yaw),Math.cos(camera.yaw)),pitch:camera.pitch,command}));
    }
    if(snapshot)for(const player of snapshot.players){
      const avatar=avatars.get(player.id)!;avatar.root.position.lerp(new T.Vector3(player.position.x,player.position.y,player.position.z),1-Math.exp(-20*dt));avatar.root.rotation.y=player.yaw+Math.PI;avatar.animate(now/1000,Math.hypot(player.velocity.x,player.velocity.z),player.crouch);avatar.body.rotation.z=player.health===0?1.5:0;
    }
    if(snapshot)for(const enemy of snapshot.enemies){const avatar=enemies.get(enemy.id)!;avatar.root.position.lerp(new T.Vector3().copy(enemy.position),1-Math.exp(-20*dt));avatar.root.rotation.y=enemy.yaw;avatar.animate(now/1000,enemy.state==='CHASE'?enemy.speed:0);}
    camera.update(dt,avatars.get(id)?.root.position??new T.Vector3(0,0,10),world);
    for(const [key,label] of labels){const point=avatars.get(key)!.root.position.clone().add(new T.Vector3(0,2.5,0)).project(camera.camera);label.hidden=point.z>1||point.z< -1;label.style.left=`${(point.x+1)*innerWidth/2}px`;label.style.top=`${(1-point.y)*innerHeight/2}px`;}
    effects.update(dt);if(connected&&snapshot){audio.update(dt,snapshot.phase==='horde');(scene.background as T.Color).lerp(new T.Color(snapshot.phase==='horde'?0xa9b1ad:0xf3f1e9),dt*1.8);(scene.fog as T.Fog).color.copy(scene.background as T.Color);}renderer.render(scene,camera.camera);
  }
  requestAnimationFrame(frame);
}
