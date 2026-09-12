import { installGame } from './Install';
import type { DayCycle } from '../daycycle/DayCycle';
import type { Pistol } from '../weapons/Pistol';
import { C, nextBoss } from '../config/gameplay';
import type { Settings } from './Settings';
export const formatTime=(n:number)=>`${Math.floor(n/60).toString().padStart(2,'0')}:${Math.floor(n%60).toString().padStart(2,'0')}`;
export class UI {
  root:HTMLElement; hud:HTMLElement; overlay:HTMLElement; toastTimer=0; hitTimer=0; damageTimer=0;
  constructor(app:HTMLElement) {
    this.root=document.createElement('div');this.root.className='interface';app.append(this.root);
    this.root.innerHTML=`<div class="paper-grain"></div><div class="screen-edge"></div>
      <section class="hud hidden" aria-label="Informações da partida">
        <div class="brand-small">INKDAYS<span>SOBREVIVA MAIS UM DIA</span></div>
        <div class="day-panel"><div class="phase-label">PREPARAÇÃO</div><div class="day-line"><span class="sun">☼</span><strong id="day">DIA 1</strong></div><div class="timer-line"><i></i><b id="timer">00:40</b><i></i></div><p id="warning"></p></div>
        <div class="top-right"><div class="counters"><span class="money"><em>$</em> <b id="money">0</b></span><span class="kills">✕ <b id="kills">0</b></span></div><div id="reward"></div><div class="location">⌖ &nbsp; VALE DO PAPEL</div><div class="boss-calendar">NO HORIZONTE <b id="boss">CHEFÃO · DIA 10</b><small>Combate de chefão em uma próxima fase</small></div></div>
        <div class="crosshair"><i></i><i></i><i></i><i></i><b>×</b></div>
        <div class="bottom-left"><div class="health-label">VOCÊ <span>ERRANTE 01</span></div><div class="hearts"><span>♥</span><span>♥</span><span>♥</span></div><div class="health-track"><div id="health-fill"></div></div><div class="health-caption"><span id="health">100 / 100</span><span id="movement">EM PÉ</span></div></div>
        <div class="bottom-right"><div class="weapon-title"><span>01</span> PISTOLA <svg viewBox="0 0 90 45" aria-hidden="true"><path d="M7 8h72v14H43l-9 20H20l6-20H7z" fill="currentColor"/><path d="M47 22v9H35" fill="none" stroke="currentColor" stroke-width="4"/></svg></div><div class="ammo"><strong id="ammo">8</strong><span>/ <b id="reserve">48</b></span></div><div class="reload-track"><div id="reload-fill"></div></div><div id="reload-caption"><kbd>R</kbd> RECARREGAR</div></div>
        <div class="controls"><span><kbd>W A S D</kbd> mover</span><span><kbd>SHIFT</kbd> correr</span><span><kbd>ESPAÇO</kbd> pular</span><span><kbd>C</kbd> agachar</span><span><kbd>ESC</kbd> pausa</span></div>
        <div id="toast" role="status"></div><div id="debug" class="hidden"></div><div id="lock-note" class="hidden">Câmera alternativa: segure o botão direito e mova o mouse.</div>
      </section><div class="damage-flash"></div><section class="overlay"></section><div class="portrait-note">INKDAYS<br><small>O jogo foi criado para tela horizontal.<br>Gire a tela ou amplie a janela para jogar.</small></div><footer><span>UM MUNDO EM BRANCO. MAIS UM DIA PARA CONTAR.</span><span>OFFLINE · ALPHA 0.1</span></footer>`;
    this.hud=this.el('.hud');this.overlay=this.el('.overlay');
    document.addEventListener('fullscreenchange',()=>{const note=this.root.querySelector('#settings-note');if(note)note.textContent=document.fullscreenElement?'Tela cheia ativada.':'Tela cheia desativada.';});
  }
  el<T extends HTMLElement=HTMLElement>(q:string) {return this.root.querySelector<T>(q)!;}
  on(id:string,callback:()=>void) {this.el<HTMLButtonElement>(id).addEventListener('click',callback);}
  menu(start:()=>void,settings:()=>void) {
    this.hud.classList.add('hidden');this.overlay.className='overlay home';
    this.overlay.innerHTML=`<div class="home-content"><div class="edition"><span></span> UM JOGO DE SOBREVIVÊNCIA EM TINTA</div><h1>INKDAYS<span class="logo-dot">.</span></h1><h2>SOBREVIVA MAIS UM DIA.</h2><p>O mundo é uma folha em branco.<br>A noite tem outros planos.</p><button class="primary" id="play">JOGAR <span>↗</span></button><button class="secondary" id="settings">CONFIGURAÇÕES <span>⚙</span></button><button class="install-button" id="install">↓ INSTALE AQUI</button><div class="home-note"><i></i> Uma pessoa. Uma pistola. Quantos dias?</div><div class="home-controls">WASD para explorar &nbsp;·&nbsp; Mouse para mirar e atirar</div></div><div class="map-caption"><span>01 / VALE DO PAPEL</span><p>Antes da noite,<br>aprenda os caminhos.</p><i>↓</i></div>`;
    this.on('#install',()=>{void installGame();});this.on('#play',start);this.on('#settings',settings);
  }
  playing() {this.overlay.className='overlay hidden';this.hud.classList.remove('hidden');}
  pause(resume:()=>void,settings:()=>void,menu:()=>void) {this.overlay.className='overlay modal';this.overlay.innerHTML=`<div class="card"><span class="eyebrow">RESPIRE UM POUCO</span><h2>O papel<br>pode esperar.</h2><p>Partida pausada. A horda também espera.</p><button class="primary" id="resume">CONTINUAR <span>↗</span></button><button class="secondary" id="settings">CONFIGURAÇÕES</button><button class="text-button" id="menu">VOLTAR AO MENU</button></div>`;this.on('#resume',resume);this.on('#settings',settings);this.on('#menu',menu);}
  settings(s:Settings,change:(s:Settings)=>void,back:()=>void) {
    this.overlay.className='overlay modal';this.overlay.innerHTML=`<div class="card settings-card"><span class="eyebrow">DO SEU JEITO</span><h2>Configurações</h2><label>VOLUME <output id="volume-value">${Math.round(s.volume*100)}%</output><input id="volume" type="range" min="0" max="1" step=".05" value="${s.volume}"></label><label>SENSIBILIDADE <output id="sensitivity-value">${s.sensitivity.toFixed(1)}</output><input id="sensitivity" type="range" min=".2" max="2" step=".1" value="${s.sensitivity}"></label><label>QUALIDADE GRÁFICA<select id="quality"><option value="high" ${s.quality==='high'?'selected':''}>Alta · contornos mais suaves</option><option value="low" ${s.quality==='low'?'selected':''}>Baixa · priorizar desempenho</option></select></label><button class="secondary" id="fullscreen">ALTERNAR TELA CHEIA ↗</button><p id="settings-note">Configurações salvas neste navegador.</p><button class="primary" id="back">VOLTAR <span>←</span></button></div>`;
    for(const id of ['volume','sensitivity','quality'])this.el(`#${id}`).addEventListener('input',()=>{s.volume=Number(this.el<HTMLInputElement>('#volume').value);s.sensitivity=Number(this.el<HTMLInputElement>('#sensitivity').value);s.quality=this.el<HTMLSelectElement>('#quality').value as Settings['quality'];this.el('#volume-value').textContent=`${Math.round(s.volume*100)}%`;this.el('#sensitivity-value').textContent=s.sensitivity.toFixed(1);change(s);});
    this.on('#fullscreen',()=>{const entering=!document.fullscreenElement;const request=entering?document.documentElement.requestFullscreen?.():document.exitFullscreen();const note=this.root.querySelector('#settings-note');const unavailable=()=>{if(note?.isConnected)note.textContent='Tela cheia indisponível neste navegador. Use F11 ou abra em Chrome/Edge.';};if(!request){unavailable();return;}const timeout=window.setTimeout(()=>{if(entering&&!document.fullscreenElement)unavailable();},1200);request.then(()=>{window.clearTimeout(timeout);if(entering&&!document.fullscreenElement)unavailable();}).catch(()=>{window.clearTimeout(timeout);unavailable();});});this.on('#back',back);
  }
  gameOver(day:number,kills:number,money:number,time:number,retry:()=>void,menu:()=>void) {this.hud.classList.add('hidden');this.overlay.className='overlay modal';this.overlay.innerHTML=`<div class="card death"><span class="eyebrow">VOCÊ MORREU · A TINTA SE ESGOTOU</span><p>VOCÊ SOBREVIVEU ATÉ O</p><h2>DIA ${day}<span>.</span></h2><dl><div><dt>Inimigos eliminados</dt><dd>${kills}</dd></div><div><dt>Dinheiro coletado</dt><dd>$ ${money}</dd></div><div><dt>Tempo de sobrevivência</dt><dd>${formatTime(time)}</dd></div></dl><button class="primary" id="retry">JOGAR NOVAMENTE <span>↻</span></button><button class="text-button" id="menu">MENU</button></div>`;this.on('#retry',retry);this.on('#menu',menu);}
  update(dt:number,cycle:DayCycle,weapon:Pistol,health:number,kills:number,money:number,crouch:boolean,run:boolean) {
    this.el('#day').textContent=`DIA ${cycle.day}`;this.el('#timer').textContent=formatTime(Math.ceil(cycle.remaining));this.el('.phase-label').textContent=cycle.phase==='day'?'PREPARAÇÃO':'HORDA EM ANDAMENTO';this.el('.sun').textContent=cycle.phase==='day'?'☼':'☾';this.hud.classList.toggle('is-horde',cycle.phase==='horde');
    this.el('#warning').textContent=cycle.phase==='day'&&cycle.remaining<=C.day.warning?'Prepare-se! A horda vem logo!':cycle.phase==='horde'?'Aguente até o amanhecer.':'';
    this.el('#boss').textContent=`CHEFÃO · DIA ${nextBoss(cycle.day)}`;this.el('#money').textContent=String(money);this.el('#kills').textContent=String(kills);
    this.el('#health').textContent=`${Math.ceil(health)} / ${C.player.health}`;this.el('#health-fill').style.width=`${health}%`;this.el('#movement').textContent=crouch?'AGACHADO':run?'CORRENDO':'EM PÉ';
    this.root.querySelectorAll<HTMLElement>('.hearts span').forEach((h,i)=>{h.style.color=health>i*C.player.health/3?'var(--red)':'#b8bab4';});
    this.el('#ammo').textContent=String(weapon.ammo);this.el('#reserve').textContent=String(weapon.reserve);this.el('#reload-fill').style.width=weapon.reloadTime>0?`${(1-weapon.reloadTime/C.weapon.reload)*100}%`:'0%';this.el('#reload-caption').innerHTML=weapon.reloadTime>0?'RECARREGANDO…':weapon.ammo===0?'<kbd>R</kbd> SEM MUNIÇÃO NO PENTE':'<kbd>R</kbd> RECARREGAR';
    this.toastTimer-=dt;if(this.toastTimer<=0)this.el('#toast').classList.remove('visible');this.hitTimer-=dt;this.el('.crosshair').classList.toggle('hit',this.hitTimer>0);this.damageTimer-=dt;this.el('.damage-flash').style.opacity=String(Math.max(0,this.damageTimer/C.effects.damageLife));
  }
  toast(text:string) {this.el('#toast').textContent=text;this.el('#toast').classList.add('visible');this.toastTimer=3;}
  hit() {this.hitTimer=.16;}
  hurt() {this.damageTimer=C.effects.damageLife;}
  reward() {const el=this.el('#reward');el.textContent=`+$${C.enemy.reward}`;el.classList.remove('reward-pop');void el.offsetWidth;el.classList.add('reward-pop');}
}

