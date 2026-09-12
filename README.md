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

Para um playtest local com transporte degradado, use npm run coop:server:badnet. Esse perfil aplica deterministicamente cerca de 120 ms de RTT base, jitter, perda, duplicacao e reordenacao ao trafego WebSocket de entrada e saida. Ele serve para diagnostico e nao representa toda a variedade da internet real.

Para testar em dois aparelhos da mesma rede Wi-Fi, execute npm run coop:server:lan e npm run dev:lan. O terminal mostra o endereço http://IP-LOCAL:5180/?coop=1 que deve ser aberto em cada aparelho. O cliente escolhe automaticamente o WebSocket do mesmo computador. Esse modo de desenvolvimento deve ser usado apenas em uma rede local confiável e não publica a sala na internet.

O jogador local usa predicao e reconciliacao com replay das entradas ainda nao confirmadas. Jogadores remotos e inimigos usam um buffer de interpolacao de 100 ms, que ordena snapshots atrasados e nao extrapola alem do ultimo estado conhecido. Uma queda breve tenta reconectar automaticamente por cinco segundos e preserva identidade e estado no mesmo processo do servidor. A bancada mede ping e jitter separadamente. O servidor conserva 500 ms de historico dos inimigos e valida o tiro contra o tick apresentado ao atirador, mantendo dano, morte e recompensa autoritativos.

Durante a janela de reconexao, o personagem fica marcado discretamente como reconectando, para de agir e deixa de ser alvo. Se os dois jogadores estiverem temporariamente desconectados, o ciclo e os inimigos ficam congelados. A retomada reativa o mesmo participante; depois de cinco segundos sem retorno, ele e removido da sala.

Ainda sem salas publicas, revive ou progressao. Esc libera o mouse, mas nao pausa o servidor. Para reiniciar, feche as duas abas e abra novamente. Usa o mesmo mapa para colisoes. O servidor escuta somente loopback e nao e hospedado pelo GitHub Pages. A bancada e excluida do build de producao.


