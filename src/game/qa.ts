import * as T from 'three';
import type { Game } from './Game';
// Visible, opt-in development harness. This module is removed from production.
// It drives the same update/input/combat paths; it does not claim manual playtest coverage.
export function mountQA(game:Game) {
  const panel=document.createElement('aside');panel.className='qa-panel';panel.setAttribute('aria-label','Ferramentas de validação');
  panel.innerHTML='<strong>QA · SOMENTE DESENVOLVIMENTO</strong><button id="qa-target">Criar alvo parado na mira</button><button id="qa-event">Próxima transição em 1 segundo</button><button id="qa-walk">Andar 1 segundo</button><button id="qa-run">Correr 1 segundo</button><button id="qa-jump">Pular</button><button id="qa-crouch">Agachar 1 segundo</button><button id="qa-look">Girar câmera 30 graus</button><output id="qa-state"></output>';
  document.body.append(panel);let release:number|undefined;
  const action=(id:string,f:()=>void)=>panel.querySelector(id)!.addEventListener('click',f);
  const command=(keys:string[])=>{if(game.mode!=='playing')return;window.clearTimeout(release);game.input.clear();keys.forEach(k=>{game.input.keys.add(k);game.input.pressed.add(k);});release=window.setTimeout(()=>game.input.clear(),1000);};
  action('#qa-target',()=>{if(game.mode!=='playing')return;game.enemies.clear();game.camera.pitch=0;game.camera.update(1,game.player.position,game.world);if(!game.enemies.spawn(game.cycle.day,game.player.position))return;const e=game.enemies.active[0];const point=game.camera.camera.position.clone().addScaledVector(game.camera.forward(),13);e.avatar.root.position.set(point.x,0,point.z);e.speed=0;game.scene.updateMatrixWorld(true);game.ui.toast('QA: alvo parado. Clique duas vezes no cenário para testar a pistola.');});
  action('#qa-event',()=>{if(game.mode==='playing')game.cycle.remaining=1;});
  action('#qa-walk',()=>command(['KeyW']));action('#qa-run',()=>command(['KeyW','ShiftLeft']));action('#qa-jump',()=>command(['Space']));action('#qa-crouch',()=>command(['KeyC']));
  action('#qa-look',()=>{if(game.mode==='playing')game.camera.look(-Math.PI/6/.002,0,1);});
  const v=new T.Vector3();const out=panel.querySelector<HTMLOutputElement>('#qa-state')!;
  window.setInterval(()=>{v.copy(game.player.position);out.textContent=`${game.mode} · posição ${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)} · velocidade ${game.player.velocity.length().toFixed(2)} · câmera ${game.camera.yaw.toFixed(2)} · inimigos ${game.enemies.active.length} · áudio ${game.audio.status()}`;},100);
}
