interface InstallEvent extends Event { prompt():Promise<void>; userChoice:Promise<{outcome:string}> }
let pending:InstallEvent|null=null;
let installed=matchMedia('(display-mode: standalone)').matches||(navigator as Navigator & {standalone?:boolean}).standalone===true;
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();pending=event as InstallEvent;});
window.addEventListener('appinstalled',()=>{installed=true;pending=null;});
if(import.meta.env.PROD&&'serviceWorker' in navigator){
  window.addEventListener('load',()=>{void navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(error=>console.warn('Não foi possível preparar o modo offline.',error));});
}
export async function installGame(){
  if(pending&&!installed){const prompt=pending;pending=null;try{await prompt.prompt();await prompt.userChoice;return;}catch{/* Show browser instructions below. */}}
  const dialog=document.createElement('dialog');dialog.className='install-dialog';
  const apple=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const message=installed?'O INKDAYS já está aberto como aplicativo.':apple?'No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início. Ative Abrir como App, se essa opção aparecer.':'Abra o menu do navegador e procure Instalar INKDAYS, Instalar aplicativo ou Adicionar à tela inicial. No computador, você também pode usar o ícone de instalação na barra de endereço. Se a opção não aparecer, abra este link no Chrome ou Edge e aguarde o carregamento completo.';
  dialog.innerHTML='<h2>INKDAYS no seu aparelho</h2><p></p><p>Depois do primeiro carregamento completo, o jogo fica disponível offline. Para receber uma atualização, conecte-se à internet e feche todas as janelas do jogo antes de abri-lo novamente.</p><form method="dialog"><button class="primary">ENTENDI</button></form>';
  dialog.querySelector('p')!.textContent=message;document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
}
