import * as T from 'three';
import { World } from '../world/World';
import { Avatar } from '../player/Avatar';
import { ThirdPerson } from '../camera/ThirdPerson';
import { Input } from '../input/Input';
import { TouchControls } from '../input/TouchControls';
import type { CombatAuthority } from './CombatAuthority';
import { Effects } from '../game/Effects';
import { GameAudio } from '../audio/Audio';
import { ClientPrediction } from './ClientPrediction';
import { AngleInterpolationBuffer, InterpolationBuffer, interpolationTick } from './Interpolation';
import { SnapshotTelemetry } from './SnapshotTelemetry';
import { SessionReport } from './SessionReport';
import { InputClock } from './InputClock';
import { ShotEventCursor } from './ShotEventCursor';
import { ReliablePlayerName } from './ReliablePlayerName';
import { resumeInputSequence } from './InputSequence';
import { ChatOutbox } from './Chat';
import { HealthEvents } from './HealthEvents';
import { controlsReady } from './ControlGate';
import { PredictedShotFeedback } from './PredictedShotFeedback';
import { CounterIncrease } from './CounterIncrease';
type Snapshot=ReturnType<CombatAuthority['snapshot']>;
export function mountCoopPreview(app:HTMLElement){
  const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));app.append(renderer.domElement);
  const scene=new T.Scene();scene.background=new T.Color(0xf3f1e9);scene.fog=new T.Fog(0xf3f1e9,43,130);scene.add(new T.HemisphereLight(0xffffff,0xb4b7af,2.1));
  const light=new T.DirectionalLight(0xffffff,2.3);light.position.set(-20,35,10);scene.add(light);
  const world=new World(scene),camera=new ThirdPerson(),effects=new Effects(scene),audio=new GameAudio();
  const enemies=new Map<number,Avatar>(),labels=new Map<string,HTMLElement>(),playerBuffers=new Map<string,InterpolationBuffer>(),enemyBuffers=new Map<number,InterpolationBuffer>(),playerAngles=new Map<string,AngleInterpolationBuffer>(),enemyAngles=new Map<number,AngleInterpolationBuffer>(),shotEvents=new ShotEventCursor();
  const crosshair=document.createElement('div');crosshair.className='coop-crosshair';crosshair.textContent='+';app.append(crosshair);
  const damageFlash=document.createElement('div');damageFlash.className='coop-damage-flash';app.append(damageFlash);
  const reward=document.createElement('div');reward.className='coop-reward';app.append(reward);
  const panel=document.createElement('div');Object.assign(panel.style,{position:'fixed',top:'12px',left:'12px',zIndex:'20',background:'#f3f1e9',padding:'12px',maxWidth:'360px'});
  panel.innerHTML='<strong>COOP · TESTE DE COMBATE</strong><p role="status">Conectando…</p><label class="nickname">SEU NOME <input maxlength="16" autocomplete="nickname"></label><button>CONTINUAR</button> <button class="report">BAIXAR RELATÓRIO</button><p class="help">WASD · mouse · R recarrega<br>Esc libera o mouse; a partida continua.<br>Após a derrota, qualquer jogador pode reiniciar a sala.</p>';app.append(panel);
  const status=panel.querySelector('p')!,button=panel.querySelector<HTMLButtonElement>('button:not(.report)')!,reportButton=panel.querySelector<HTMLButtonElement>('.report')!,help=panel.querySelector<HTMLElement>('.help')!,nickname=panel.querySelector<HTMLInputElement>('input')!,report=new SessionReport();nickname.value=localStorage.getItem('inkdays-nickname')??'';
  const chat=document.createElement('div');chat.className='coop-chat';chat.innerHTML='<div class="coop-chat-messages"></div><form hidden><input maxlength="100" aria-label="Mensagem para a equipe" autocomplete="off" enterkeyhint="send" placeholder="Digite uma mensagem…"><button type="button" aria-label="Fechar chat">×</button></form><small>ENTER · CHAT</small><button type="button" class="coop-chat-open" aria-label="Abrir chat">CHAT</button>';app.append(chat);const chatMessages=chat.querySelector<HTMLElement>('.coop-chat-messages')!,chatForm=chat.querySelector<HTMLFormElement>('form')!,chatInput=chat.querySelector<HTMLInputElement>('input')!,chatOpenButton=chat.querySelector<HTMLButtonElement>('.coop-chat-open')!,chatCloseButton=chat.querySelector<HTMLButtonElement>('form button')!,chatOutbox=new ChatOutbox();
  let id='',snapshot:Snapshot|null=null,snapshotReceivedAt=0,sequence=0,last=0,connected=false,prediction:ClientPrediction|null=null,telemetry=new SnapshotTelemetry(),rtt=0,maxCorrection=0,snaps=0,round=0;
  const avatars=new Map<string,Avatar>(),inputClock=new InputClock(),reliableName=new ReliablePlayerName(),healthEvents=new HealthEvents(),predictedShots=new PredictedShotFeedback(),moneyEvents=new CounterIncrease();
  const pause=()=>{input.active=false;input.clear();touch.setActive(false);button.hidden=false;if(document.pointerLockElement)document.exitPointerLock();};
  const input=new Input(renderer.domElement,pause,()=>{}),touch=new TouchControls(input,pause,()=>{if(input.active)void renderer.domElement.requestPointerLock()?.catch(()=>{});});
  let socket:WebSocket,reconnectTimer=0,restartTimer=0,pageLeaving=false;
  const requestRestart=()=>{if(socket.readyState===WebSocket.OPEN)socket.send(JSON.stringify({type:'restart'}));};
  button.onclick=()=>{if(!connected)return;if(snapshot?.gameOver){requestRestart();clearInterval(restartTimer);restartTimer=window.setInterval(requestRestart,250);button.disabled=true;button.textContent='REINICIANDO…';return;}const name=reliableName.set(nickname.value);if(name)localStorage.setItem('inkdays-nickname',name);input.active=true;audio.start();button.hidden=true;nickname.parentElement!.hidden=true;help.hidden=true;if(!touch.enabled)void renderer.domElement.requestPointerLock()?.catch(()=>{status.textContent='Segure o botão direito para mirar.';});};
  reportButton.onclick=()=>{const blob=new Blob([JSON.stringify(report.summary(),null,2)],{type:'application/json'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`inkdays-rede-${new Date().toISOString().replaceAll(':','-')}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);};
  let chatOpen=false;const openChat=()=>{if(!input.active||chatOpen)return;chatOpen=true;input.clear();touch.setActive(false);chatForm.hidden=false;chatInput.focus();};
  const closeChat=()=>{chatOpen=false;chatForm.hidden=true;chatInput.blur();};chatOpenButton.onclick=openChat;chatCloseButton.onclick=closeChat;
  chatForm.onsubmit=e=>{e.preventDefault();if(chatOutbox.submit(chatInput.value)){chatInput.value='';closeChat();}};
  window.addEventListener('keydown',e=>{if(e.code==='Enter'&&input.active&&!touch.enabled){if(!chatOpen){e.preventDefault();openChat();}else if(document.activeElement===chatInput){e.preventDefault();chatForm.requestSubmit();}}else if(e.code==='Escape'&&chatOpen){e.preventDefault();closeChat();}});
  const connect=()=>{
    const token=sessionStorage.getItem('inkdays-coop-token'),override=new URLSearchParams(location.search).get('server'),url=new URL(override??`${location.protocol==='https:'?'wss':'ws'}://${location.hostname}:8787`);if(token)url.searchParams.set('resume',token);socket=new WebSocket(url);
    socket.onmessage=e=>{
    const packet=JSON.parse(e.data);
    if(packet.type==='pong'){const sample=performance.now()-packet.nonce;rtt=rtt?rtt*.8+sample*.2:sample;return;}
    if(packet.type==='welcome'){prediction=null;input.clear();inputClock.advance(0,false);playerBuffers.clear();playerAngles.clear();enemyBuffers.clear();enemyAngles.clear();shotEvents.reset();healthEvents.reset();predictedShots.reset();moneyEvents.reset();telemetry=new SnapshotTelemetry();rtt=0;if(packet.resumed)report.resumed();if(id&&id!==packet.id){report.newIdentity();prediction=null;sequence=0;maxCorrection=snaps=0;}id=packet.id;sessionStorage.setItem('inkdays-coop-token',packet.token);connected=true;status.textContent=packet.resumed?'Conexão recuperada. Aguardando estado…':'Conectado. Aguardando estado…';}
    if(packet.type==='snapshot'){
      const state=packet as Snapshot,receivedAt=performance.now(),unique=telemetry.observe(state.tick,receivedAt);if(!unique||state.tick<telemetry.latestTick)return;if(round&&state.round!==round){prediction=null;playerBuffers.clear();playerAngles.clear();enemyBuffers.clear();enemyAngles.clear();maxCorrection=snaps=0;}round=state.round;snapshot=state;snapshotReceivedAt=receivedAt;const me=state.players.find(p=>p.id===id);
      if(me){sequence=resumeInputSequence(sequence,me.acknowledged);reliableName.observe(me.name);chatOutbox.observe(me.chatAcknowledged);if(healthEvents.observe(me.health)>0){damageFlash.classList.remove('visible');void damageFlash.offsetWidth;damageFlash.classList.add('visible');}const gained=moneyEvents.observe(me.money);if(gained>0){reward.textContent=`+$${gained}`;reward.classList.remove('visible');void reward.offsetWidth;reward.classList.add('visible');}const authoritative={acknowledged:me.acknowledged,position:me.position,velocity:me.velocity,vertical:me.vertical};if(!prediction)prediction=new ClientPrediction(world,authoritative);else{const error=prediction.reconcile(authoritative);maxCorrection=Math.max(maxCorrection,error);if(error>3)snaps++;}}
      status.textContent=`DIA ${state.day} · ${state.phase==='horde'?'HORDA':'PREPARAÇÃO'} ${Math.ceil(state.remaining)}s · ${state.players.filter(p=>p.connected).length}/2 | Vida ${me?.health??0} · ${me?.ammo??0}/${me?.reserve??0} ${me?.reloading?'RECARREGANDO':''} · $${me?.money??0} · ping ${rtt.toFixed(0)}ms · jitter ${telemetry.jitter.toFixed(0)}ms · perda ${telemetry.lossPercent.toFixed(0)}% · correção máx. ${(maxCorrection*100).toFixed(0)}cm · saltos ${snaps}${state.gameOver?' · FIM DE PARTIDA':me?.health===0?' · VOCÊ MORREU':''}`;
      if(!state.gameOver&&restartTimer){clearInterval(restartTimer);restartTimer=0;}button.disabled=state.gameOver&&!!restartTimer;button.textContent=restartTimer?'REINICIANDO…':state.gameOver?'JOGAR NOVAMENTE':'CONTINUAR';
      report.sample({day:state.day,tick:state.tick,rtt,jitter:telemetry.jitter,loss:telemetry.lossPercent,correction:maxCorrection,snaps,rewindTicks:Math.max(0,...state.shots.map(shot=>shot.rewindTicks))});
      const ids=new Set((packet as Snapshot).players.map(p=>p.id));
      for(const [key,avatar] of avatars)if(!ids.has(key)){scene.remove(avatar.root);avatars.delete(key);playerBuffers.delete(key);playerAngles.delete(key);labels.get(key)?.remove();labels.delete(key);}
      for(const player of (packet as Snapshot).players)if(!avatars.has(player.id)){const avatar=new Avatar();avatar.root.position.copy(player.position);avatars.set(player.id,avatar);scene.add(avatar.root);}
      for(const player of state.players)if(player.id!==id){let buffer=playerBuffers.get(player.id),angle=playerAngles.get(player.id);if(!buffer){buffer=new InterpolationBuffer();playerBuffers.set(player.id,buffer);}if(!angle){angle=new AngleInterpolationBuffer();playerAngles.set(player.id,angle);}buffer.push(state.tick,player.position,receivedAt);angle.push(state.tick,player.yaw+Math.PI,receivedAt);}
      for(const player of state.players)if(player.id!==id&&!labels.has(player.id)){const label=document.createElement('span');label.textContent=player.name;Object.assign(label.style,{position:'fixed',color:'#171918',fontWeight:'800',fontSize:'11px',textShadow:'0 1px #f3f1e9,1px 0 #f3f1e9,0 -1px #f3f1e9,-1px 0 #f3f1e9',pointerEvents:'none',transform:'translate(-50%,-100%)'});app.append(label);labels.set(player.id,label);}
      for(const player of state.players)if(player.id!==id){const label=labels.get(player.id);if(label){label.textContent=player.connected?player.name:`${player.name} · reconectando`;label.style.opacity=player.connected?'1':'.5';}}
      const enemyIds=new Set(state.enemies.map(e=>e.id));for(const [key,avatar] of enemies)if(!enemyIds.has(key)){scene.remove(avatar.root);enemies.delete(key);enemyBuffers.delete(key);enemyAngles.delete(key);}
      for(const enemy of state.enemies)if(!enemies.has(enemy.id)){const avatar=new Avatar(true);avatar.root.position.copy(enemy.position);enemies.set(enemy.id,avatar);scene.add(avatar.root);}
      for(const enemy of state.enemies){let buffer=enemyBuffers.get(enemy.id),angle=enemyAngles.get(enemy.id);if(!buffer){buffer=new InterpolationBuffer();enemyBuffers.set(enemy.id,buffer);}if(!angle){angle=new AngleInterpolationBuffer();enemyAngles.set(enemy.id,angle);}buffer.push(state.tick,enemy.position,receivedAt);angle.push(state.tick,enemy.yaw,receivedAt);}
      for(const shot of shotEvents.consume(state.shots)){effects.shot(new T.Vector3().copy(shot.from),new T.Vector3().copy(shot.to));if(shot.hit){effects.impact(new T.Vector3().copy(shot.to));if(shot.player===id){crosshair.classList.remove('hit');void crosshair.offsetWidth;crosshair.classList.add('hit');}}if(shot.player!==id||!predictedShots.confirm(shot.shotId,receivedAt))audio.cue('shot');}
      chatMessages.replaceChildren(...(state.messages??[]).slice(-3).map(message=>{const line=document.createElement('div'),name=document.createElement('b');name.textContent=`${message.name}: `;line.append(name,document.createTextNode(message.text));return line;}));
      if(me?.health===0&&input.active)pause();
    }
    };
    socket.onclose=e=>{connected=false;input.clear();if(!pageLeaving)report.disconnected();status.textContent=e.reason||'Reconectando…';if(!pageLeaving)reconnectTimer=window.setTimeout(connect,1000);};
    socket.onerror=()=>{status.textContent='Conexão interrompida. Tentando recuperar…';};
  };
  connect();
  const pingTimer=window.setInterval(()=>{if(socket.readyState===WebSocket.OPEN)socket.send(JSON.stringify({type:'ping',nonce:performance.now()}));},2000);
  window.addEventListener('pagehide',()=>{pageLeaving=true;clearTimeout(reconnectTimer);clearInterval(restartTimer);clearInterval(pingTimer);socket.close();});
  window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
  const resize=()=>{renderer.setSize(innerWidth,innerHeight);camera.camera.aspect=innerWidth/innerHeight;camera.camera.updateProjectionMatrix();};window.addEventListener('resize',resize);resize();
  function frame(now:number){
    requestAnimationFrame(frame);const dt=Math.min(.1,(now-(last||now))/1000);last=now;
    const namePacket=connected&&socket.readyState===WebSocket.OPEN?reliableName.packet(now):null;if(namePacket)socket.send(JSON.stringify(namePacket));const chatPacket=connected&&socket.readyState===WebSocket.OPEN?chatOutbox.packet(now):null;if(chatPacket)socket.send(JSON.stringify(chatPacket));
    const ready=controlsReady(connected&&socket.readyState===WebSocket.OPEN,prediction!==null,chatOpen);if(ready)camera.look(input.lookX,input.lookY,1);input.lookX=input.lookY=0;touch.setActive(input.active&&ready&&innerWidth>innerHeight);
    const steps=inputClock.advance(dt,ready);
    for(let step=0;step<steps&&prediction;step++){
      const sent=sequence++,raw=input.consume(),command=prediction.prepare(sent,raw);if(raw.shot&&prediction.shotId!==undefined){audio.cue('shot');predictedShots.predict(prediction.shotId,now);}const yaw=Math.atan2(Math.sin(camera.yaw),Math.cos(camera.yaw)),viewTick=Math.max(0,Math.floor(interpolationTick(snapshot?.tick??6,snapshotReceivedAt||now,now)));prediction.submit({sequence:sent,yaw,command});socket.send(JSON.stringify({version:1,sequence:sent,yaw,pitch:camera.pitch,viewTick,shotId:prediction.shotId,command}));
    }
    if(snapshot)for(const player of snapshot.players){
      const avatar=avatars.get(player.id)!;if(player.id===id&&prediction){prediction.updateRender(dt);avatar.root.position.copy(prediction.renderPosition);avatar.root.rotation.y=player.yaw+Math.PI;}else{const sampled=playerBuffers.get(player.id)?.sample(now),angle=playerAngles.get(player.id)?.sample(now);if(sampled)avatar.root.position.copy(sampled);if(angle!==null&&angle!==undefined)avatar.root.rotation.y=angle;}avatar.animate(now/1000,Math.hypot(player.velocity.x,player.velocity.z),player.crouch);avatar.body.rotation.z=player.health===0?1.5:0;
    }
    if(snapshot)for(const enemy of snapshot.enemies){const avatar=enemies.get(enemy.id)!,sampled=enemyBuffers.get(enemy.id)?.sample(now),angle=enemyAngles.get(enemy.id)?.sample(now);if(sampled)avatar.root.position.copy(sampled);if(angle!==null&&angle!==undefined)avatar.root.rotation.y=angle;avatar.animate(now/1000,enemy.state==='CHASE'?enemy.speed:0);}
    camera.update(dt,avatars.get(id)?.root.position??new T.Vector3(0,0,10),world,true);
    for(const [key,label] of labels){const point=avatars.get(key)!.root.position.clone().add(new T.Vector3(0,2.5,0)).project(camera.camera);label.hidden=point.z>1||point.z< -1;label.style.left=`${(point.x+1)*innerWidth/2}px`;label.style.top=`${(1-point.y)*innerHeight/2}px`;}
    effects.update(dt);if(connected&&snapshot){audio.update(dt,snapshot.phase==='horde');(scene.background as T.Color).lerp(new T.Color(snapshot.phase==='horde'?0xa9b1ad:0xf3f1e9),dt*1.8);(scene.fog as T.Fog).color.copy(scene.background as T.Color);}renderer.render(scene,camera.camera);
  }
  requestAnimationFrame(frame);
}
