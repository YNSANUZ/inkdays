# INKDAYS

Sobreviva mais um dia. Vertical slice solo offline em terceira pessoa, TypeScript + Three.js.

## Executar
Requer Node.js 22.12+ (desenvolvimento feito em Node 24).

```sh
npm ci
npm run dev
```

Abra http://127.0.0.1:5173 no navegador. Não abra index.html diretamente pelo sistema de arquivos: módulos e WebGL precisam do servidor local.

```sh
npm run build
npm run preview
npm run lint
npm test
```

`dist/` contém os arquivos estáticos de distribuição. Não requer API, conta, serviços remotos, CDN nem IA durante a partida. PWA disponível: use INSTALE AQUI no menu. O primeiro carregamento completo prepara o cache offline; atualizações são ativadas depois de fechar as janelas antigas do jogo.

## Controles
WASD mover; Shift correr; espaço pular; C agachar; mouse mirar; clique esquerdo disparar (segurar mantém cadência); R recarregar; Esc pausar; F3 métricas. Se Pointer Lock estiver indisponível, segure o botão direito para mover a câmera.

## Regras do slice
40 segundos de preparação, 20 de horda. Inimigos surgem gradualmente: 5, 7, 9… com limites configurados. Ao amanhecer os Borrões restantes se desfazem, o jogador recebe 15 de vida (até 100) e 24 balas de reserva (até 96). Matar um Borrão concede $20. Dinheiro é pontuação sem loja. O calendário mostra o próximo múltiplo de dez; ainda não há combate de chefe.

Som sintetizado original pelo Web Audio, iniciado após clicar em Jogar. Volume, sensibilidade e qualidade ficam em LocalStorage; nenhuma progressão ou dado pessoal é salvo.

## Estrutura
`src/config` balanceamento; `input` comandos; `player` avatar e locomoção; `camera` câmera; `world` mapa/coberturas; `enemies` IA; `weapons` pistola; `health` vida; `horde` spawn; `daycycle` calendário; `audio` síntese; `ui` telas/HUD; `game` integração e efeitos. O loop usa passo fixo de 60 Hz e limite de recuperação para evitar espiral de atraso.

Arte construída com geometria própria e materiais compartilhados. Não há assets copiados das referências.

## Escopo e rollback
Projeto isolado em `apps/inkdays`; não altera nenhum portal existente. Para reverter a instalação local, pare o servidor e remova apenas esta pasta após guardar o que desejar. Nada foi publicado. Veja INKDAYS_PROGRESS.md para evidências e pendências; INKDAYS_BACKLOG.md descreve trabalho futuro.

## Celular horizontal
Controles automáticos em aparelhos touch: analógico esquerdo para mover; arrastar à direita para mirar; segurar ATIRAR dispara e permite arrastar a mira. Botões de recarga, pulo, corrida e agachamento; pausa no canto superior direito. Girar para vertical pausa a partida. Interface validada em viewport mobile; desempenho e multitoque em aparelho físico ainda precisam de teste. Multiplayer continua fora deste slice.


## Jogar online
GitHub Pages: https://ynsanuz.github.io/inkdays/
Cada envio para main executa lint, testes e build antes de atualizar o jogo automaticamente.



## Bancada cooperativa local (Fase 2)
Execute npm run coop:server e npm run dev -- --port 5180. Abra http://127.0.0.1:5180/?coop=1 em duas abas e clique CONTINUAR em cada uma. O servidor em 127.0.0.1:8787 aceita dois jogadores; uma terceira conexao recebe Sala cheia. WASD move, mouse mira, espaco pula. Esc libera o mouse. A bancada sincroniza movimento, combate, inimigos, vida, municao, recompensas e ciclo de hordas, com nomes sem fundo sobre os participantes.

O chat de equipe mostra as três mensagens mais recentes discretamente no canto inferior esquerdo. No PC, Enter abre o campo e Enter envia; Escape fecha sem enviar. O servidor normaliza o texto, limita cada mensagem a 100 caracteres, aceita no máximo uma a cada 500 ms e distribui um histórico curto comum aos dois jogadores. Mensagens pendentes são repetidas até o snapshot confirmar seu identificador.

Cada mensagem permanece apresentável por 12 segundos medidos no tick autoritativo. Assim, as duas telas removem a mesma linha a partir do mesmo estado da partida, inclusive depois de uma reconexão breve.

No modo touch horizontal, o botão CHAT abre o mesmo campo com indicação de envio para o teclado do sistema. Enquanto o campo está aberto, as entradas de movimento, câmera e disparo são limpas e os controles touch ficam ocultos; enviar ou tocar em fechar devolve os controles à partida.

Para um playtest local com transporte degradado, use npm run coop:server:badnet. Esse perfil aplica deterministicamente cerca de 120 ms de RTT base, jitter, perda, duplicacao e reordenacao ao trafego WebSocket de entrada e saida. Ele serve para diagnostico e nao representa toda a variedade da internet real.

Os testes automatizados incluem também um soak acelerado de 10.800 passos: dois clientes atravessam três ciclos pelo WebSocket degradado e precisam receber um estado idêntico no Dia 4. Esse teste isola transporte e calendário com spawns desativados; ele não substitui uma partida prolongada com combate.

Um segundo soak mantém hordas reais durante 7.200 passos e exige que os dois clientes observem os inimigos e cheguem ao Dia 3 com o mesmo snapshot e limpeza correta no amanhecer. Apenas o dano dos jogadores é neutralizado dentro desse teste para preservar a duração da sessão.

O transporte degradado também possui um cenário de eliminação controlada: duplicação e reordenação não podem repetir dano, morte, munição ou recompensa, e ambos os clientes precisam receber exatamente o mesmo resultado autoritativo.

Outro cenário deixa um inimigo atacar um participante até a morte e exige que os dois clientes recebam o mesmo tick final, mantendo o companheiro vivo e `gameOver` falso.

Um cenário complementar mata os dois participantes, exige `gameOver` idêntico nos dois clientes e verifica, por mais 60 ticks, que calendário e inimigos permanecem congelados após a derrota coletiva.

Depois da derrota, qualquer participante conectado pode usar JOGAR NOVAMENTE. A solicitação é repetida até a confirmação para tolerar perda condicionada; o servidor reinicia vida, munição, recompensas, inimigos e calendário para os dois clientes, preservando identidades e a monotonicidade do tick.

Cada inimigo escolhe autoritativamente o jogador vivo mais próximo. O `targetId` acompanha o inimigo no snapshot, permitindo que os dois clientes representem a mesma divisão da horda quando inimigos diferentes perseguem participantes diferentes.

Antes de entrar no controle, cada participante pode informar um nick curto. O servidor normaliza e limita o nome, publica o mesmo valor nos snapshots e o preserva durante uma reconexão breve. O nick remoto continua aparecendo diretamente sobre o avatar, sem caixa ou balão.

O cliente conserva a alteração solicitada e a reenvia em intervalos limitados até que o próprio snapshot confirme o valor autoritativo. Uma perda isolada no transporte não deixa o participante silenciosamente com o nome genérico.

Quando a vida autoritativa do jogador diminui, a bancada apresenta uma vinheta vermelha curta nas bordas. O primeiro snapshot, cura, reinício e reconexão apenas redefinem a referência e não fabricam um impacto visual.

Se o alvo desconecta, morre ou deixa de estar elegível, a autoridade seleciona outro jogador vivo. Uma retomada dentro da tolerância preserva a identidade e permite que a IA volte a escolhê-lo pela distância; a troca é transmitida igualmente aos dois clientes.

A morte individual também possui verificação dedicada: no passo seguinte, o participante caído deixa a seleção da IA, o inimigo restante recebe o ID do sobrevivente como alvo e `gameOver` continua falso.

Os disparos são eventos autoritativos numerados. Ambos os clientes recebem o mesmo atirador, origem, destino, acerto e compensação histórica, enquanto somente a munição do autor é consumida. O cliente usa o serial para não reproduzir o mesmo efeito duas vezes em snapshots repetidos.

Corrida e salto também atravessam o transporte como estado autoritativo. Posição, velocidade horizontal e velocidade vertical são comparadas no mesmo tick recebido pelos dois clientes; a apresentação remota usa esses valores no buffer de interpolação e na animação.

Cada partida reiniciada possui uma geração `round` crescente, independente do tick contínuo do servidor. Ao detectar a nova geração, o cliente descarta predição e buffers antigos antes de posicionar os avatares no ponto inicial, impedindo uma interpolação longa desde o local da morte.

Inimigos aplicam separação local tanto na perseguição quanto enquanto atacam. A pressão lateral suave reduz sobreposição ao redor do jogador sem retirar do servidor a escolha de alvo, movimento, alcance ou aplicação de dano.

A compensação histórica também é exercitada através do WebSocket condicionado: o servidor consulta a posição que o alvo ocupava no tick apresentado ao atirador, aplica o resultado no estado atual e restaura imediatamente a posição presente antes de publicar o snapshot comum.

O tick de visão é limitado pela linha temporal do servidor e avança monotonicamente por jogador. Pedidos futuros são rejeitados antes do disparo, e um cliente não pode voltar para um quadro antigo mais favorável depois de declarar que já apresentava um estado novo.

Cliques rápidos de tiro carregam um `shotId` repetido até o acknowledgement do servidor. O servidor aceita cada identificador uma única vez, recuperando o clique se o primeiro comando for descartado sem transformar confirmações atrasadas em tiros ou consumo de munição adicionais. Fogo mantido continua seguindo a cadência normal da arma.

Para testar em dois aparelhos da mesma rede Wi-Fi, execute npm run coop:server:lan e npm run dev:lan. O terminal mostra o endereço http://IP-LOCAL:5180/?coop=1 que deve ser aberto em cada aparelho. O cliente escolhe automaticamente o WebSocket do mesmo computador. Esse modo de desenvolvimento deve ser usado apenas em uma rede local confiável e não publica a sala na internet.

Ao final do playtest, use BAIXAR RELATÓRIO em cada aparelho. O JSON contém duração, último dia/tick, médias e máximos de ping, jitter e perda, maior correção, ajustes bruscos, desconexões, retomadas e trocas de identidade. Ele não contém nick, identificador de jogador, comandos ou conteúdo pessoal.

O relatório também inclui o maior tempo de compensação histórica aplicado aos tiros. No rewind, o servidor considera somente inimigos que já existiam no tick apresentado ao jogador; alvos surgidos depois desse momento não podem receber o acerto retroativo.

Snapshots atrasados ou duplicados podem completar a telemetria de perda, mas nunca substituem o estado mais novo já aplicado. O `viewTick` do tiro acompanha o ponto exato da linha temporal usado pela interpolação no instante do comando, limitado ao snapshot mais recente para impedir extrapolação.

O jogador local usa predicao e reconciliacao com replay das entradas ainda nao confirmadas. Jogadores remotos e inimigos usam um buffer de interpolacao de 100 ms, que ordena snapshots atrasados e nao extrapola alem do ultimo estado conhecido. Uma queda breve tenta reconectar automaticamente por cinco segundos e preserva identidade e estado no mesmo processo do servidor. A bancada mede ping e jitter separadamente. O servidor conserva 500 ms de historico dos inimigos e valida o tiro contra o tick apresentado ao atirador, mantendo dano, morte e recompensa autoritativos.

A interpolacao remota inclui posição e rotação, escolhendo o menor arco ao atravessar o limite entre -180° e 180°. A bancada também expõe a maior correção de posição local e o total de ajustes acima de três unidades, para diferenciar suavidade visual de divergência real da predição.

A telemetria usa os ticks dos snapshots para mostrar jitter e perda estimada em uma janela móvel. Duplicatas não são contadas duas vezes e snapshots reordenados têm uma tolerância antes de serem considerados perdidos. Ping, jitter e perda reiniciam ao estabelecer uma nova conexão, sem classificar o tempo offline como perda da conexão retomada.

Durante a janela de reconexao, o personagem fica marcado discretamente como reconectando, para de agir e deixa de ser alvo. Se os dois jogadores estiverem temporariamente desconectados, o ciclo e os inimigos ficam congelados. A retomada reativa o mesmo participante; depois de cinco segundos sem retorno, ele e removido da sala.

Se a própria página for recarregada dentro dessa janela, o primeiro snapshot informa a última sequência aceita. O cliente novo continua imediatamente no número seguinte, sem precisar repetir centenas de comandos antigos antes de voltar a andar ou atirar.

O servidor usa heartbeat nativo do WebSocket para detectar conexões interrompidas mesmo quando o sistema não entrega imediatamente o evento de fechamento. Esse heartbeat não depende dos timers do jogo na aba e evita tratar uma aba minimizada como desconectada. Se a reserva já tiver expirado, o cliente recebe uma nova identidade e reinicia a predição e suas métricas locais.

Somente a resposta `pong` confirma a saúde do enlace. Continuar recebendo comandos não mascara uma falha no sentido servidor → jogador. Quando o prazo expira, o socket é terminado imediatamente para iniciar suspensão e reconexão sem aguardar o fechamento normal de uma rede que já não responde.

Comandos pontuais de pulo e recarga são repetidos por uma janela limitada até o snapshot confirmar sua sequência, reduzindo perdas durante instabilidade. O servidor limpa o estado de disparo após cada tick: segurar continua enviando intenção de tiro, enquanto um clique isolado não permanece ativo se os pacotes seguintes atrasarem.

Ao conectar ou retomar uma sessão, o primeiro snapshot estabelece a referência dos eventos de disparo. Tiros ainda retidos no histórico autoritativo não são reproduzidos como uma rajada atrasada; somente eventos posteriores geram novos traçantes e sons no cliente.

Ainda sem salas publicas, revive ou progressao. Esc libera o mouse, mas nao pausa o servidor. Para reiniciar, feche as duas abas e abra novamente. Usa o mesmo mapa para colisoes. O servidor escuta somente loopback e nao e hospedado pelo GitHub Pages. A bancada e excluida do build de producao.


