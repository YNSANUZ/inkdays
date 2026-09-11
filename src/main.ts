import './style.css';
import './touch.css';
import { Game } from './game/Game';
const app=document.querySelector<HTMLElement>('#app')!;
try {const game=new Game(app);if(import.meta.env.DEV&&new URLSearchParams(location.search).has('qa'))void import('./game/qa').then(({mountQA})=>mountQA(game));} catch(error) {console.error('INKDAYS initialization failed',error);app.innerHTML='<div class="fatal"><h1>INKDAYS</h1><p>Não foi possível iniciar o mundo 3D.</p><p>Use um navegador com WebGL2 e aceleração gráfica ativada.</p><button onclick="location.reload()">TENTAR NOVAMENTE</button></div>';}
