# INKDAYS — progresso

## Visão do projeto
Sobreviva mais um dia. Jogo cooperativo futuro, terceira pessoa, tinta preta sobre papel. Fase 1: vertical slice solo offline, sem serviços externos.

## Ambiente e tecnologia escolhida
Projeto novo isolado em apps/inkdays. Node 24.18 e npm 11 disponíveis. Não altera o portal Saiu no DF. TypeScript estrito, Vite e Three.js/WebGL2: renderizador web leve, materiais toon, controle direto do desenho e ecossistema tipado. Babylon também seria viável, mas os sistemas deste slice não precisam de sua camada adicional. Dependências empacotadas localmente; sem CDN em runtime.

## Arquitetura escolhida
Simulação com passo fixo e comandos de entrada separados da apresentação. Módulos para configuração, ciclo, arma, vida, mundo, personagens, IA, câmera, áudio e UI. Estado offline explícito; sem promessas de multiplayer sem trabalho adicional. Geometrias e materiais compartilhados e cenário estático agrupado; expansão futura por instancing/pooling/LOD.

## Etapa atual
**FASE 1 — CONCLUÍDA** em 10/09/2026, como vertical slice solo offline. Pacote de distribuição compilado e verificado no navegador. Limitações e tipo de validação estão explicitados abaixo; não equivale à aprovação de lançamento comercial ou à validação em todos os hardwares.

## Decisões importantes
Arte procedural original, sem copiar os desenhos anexados. Mapa Vale do Papel. Inimigos chamados Borrões. Horda com duração fixa: ao amanhecer os sobreviventes se dissolvem; reserva e pequena recuperação são concedidas no amanhecer para sustentar várias rodadas. Calendário de chefão preparado, combate não implementado.

## O que foi implementado
- Menu, pausa, configurações, tela de morte e reinício.
- Mapa rural original com terreno, caminhos, casas, celeiro, moinho animado, árvores, pedras, cercas, coberturas, colinas distantes e torre.
- Personagem visível com mochila/pistola, câmera de ombro, movimento suavizado, corrida, salto e agachamento.
- Pistola hitscan com validação de cobertura desde a câmera e o cano, munição, cadência, recarga, impacto, traçador e flash.
- Borrões com estados IDLE/CHASE/ATTACK/DEAD, desvio local e bloqueio de ataque através de cobertura.
- Vida, imunidade breve, feedback, morte, recompensa de $20 e estatísticas.
- Preparação de 40 s, horda de 20 s, spawn gradual, amanhecer com reposição e escala de dificuldade limitada.
- HUD discreta, calendário de chefão, modo F3 com FPS/draw calls/triângulos.
- Sons e padrões musicais sintetizados originais, diferenciados entre preparação e horda.
- Configurações locais; não há login, progressão permanente ou serviços externos.
- Bancada visível de QA em `/?qa=1`, apenas no servidor de desenvolvimento. Removida da compilação de produção.

## O que foi testado
- Build TypeScript/Vite: passou; artefatos separados em jogo ~40 KB e Three.js ~484 KB, total JavaScript ~136 KB gzip. Sem warning de chunks após separação.
- Lint ESLint: passou.
- 15 testes automatizados: ciclo de 60 s, dificuldade, calendário, spawn gradual, munição, recarga, saúde, reinício de estado, corrida/diagonal/agachamento, salto e pouso, parede/limite, câmera, perseguição/ataque/morte e dano bloqueado por cerca.
- Navegador integrado em 1280×720: menu e mapa, personagem e HUD; clique real consumiu uma bala; tecla R iniciou recarga e transferiu reserva; horda natural iniciou após preparação, chegou a cinco inimigos, causou dano e levou à morte no Dia 1.
- Bancada de QA no navegador: alvo parado eliminado por dois cliques reais, contador 1 e $20; caminhada 5 unidades em 1 s, corrida 8; salto observado a y=0,79; agachamento e giro da câmera observados.
- Reinício pela tela de morte voltou a 100 HP. Transições aceleradas por cronômetro de QA passaram por HORDA → DIA 2 com remoção de inimigos e reserva 48 → 72. A duração original é coberta pelo teste automatizado e início natural observado.
- Configurações: volume 35 → 40%, sensibilidade 1 → 1,1, qualidade baixa; valores persistiram na UI após recarregar. Pausa suspendeu áudio e simulação.
- Medição observada: ~60 FPS, 73 draw calls / 110.730 triângulos sem inimigos; ~60 FPS, 203 draw calls / 153.290 triângulos com cinco inimigos. Não equivale a benchmark de todos os computadores.
- Revisão visual em 1920×1080, 1600×900, 1366×768 e 1280×720: cenário/personagem visíveis, mira central, HUD íntegra sem corte. HUD agora escala proporcionalmente entre 720p e 1080p. Capturas em `qa/gameplay-*.png`.
- Build final de distribuição em http://127.0.0.1:4173: menu → jogar → disparo → recarga (8/47) → pausa → configurações → menu, sem erros ou warnings de console. A bancada de QA não está incluída no build.
- Tela cheia: entrada e saída confirmadas pelo evento `fullscreenchange` e pelas mensagens da própria UI (“Tela cheia ativada.” / “Tela cheia desativada.”). O diagnóstico inicial de falha era uma limitação da leitura pela ferramenta; o recurso foi validado. Incluído aviso para navegadores que neguem ou não concluam a solicitação.
- `npm audit`: zero vulnerabilidades reportadas na verificação final. Vitest instalado 4.1.11. Build final: jogo ~41 KB + Three.js ~484 KB; aproximadamente 136 KB gzip de JavaScript.

## Critérios de aceitação
- [x] Menu funcional, mapa e personagem visível em terceira pessoa.
- [x] WASD, corrida, salto, agachamento e câmera com limites/colisão.
- [x] Pistola, disparo, munição, cadência, recarga e feedback.
- [x] Inimigos, perseguição, ataque, dano e morte/remoção.
- [x] Dinheiro e contador de eliminações.
- [x] Vida do jogador, morte e reinício.
- [x] Dia 1, contador, aviso, horda e avanço para Dia 2.
- [x] Dificuldade progressiva e calendário de chefão preparado.
- [x] HUD e direção visual de tinta sobre branco.
- [x] Áudio placeholder original e padrões distintos de dia/horda.
- [x] Desempenho aceitável na sessão testada e ausência de erros críticos observados.

## Problemas conhecidos
Pointer Lock não foi concedido na sessão automatizada do navegador integrado: alternativa com botão direito está disponível; captura do mouse deve também ser testada manualmente no navegador final. Áudio Web Audio apresentou estado running/suspended, sem avaliação humana de mixagem. O cenário procedural cumpre a direção, mas não tem o nível de detalhe ilustrado das referências. Desvio local pode hesitar em cantos; mapas maiores deverão usar navegação mais elaborada. Meta universal de 60 FPS exige testes em GPUs integradas; desktop horizontal é o alvo desta fase. PWA/cache instalável e Android não estão implementados. O jogo não salva progressão nem possui multiplayer ou chefão real.

## Arquivos e dados
Todos os arquivos do trabalho estão isolados em `apps/inkdays`: `src/`, `tests/`, configurações de npm/TypeScript/Vite/ESLint, README, progresso, backlog, `qa/` e `dist/`. Nenhum arquivo do portal, banco, credencial, serviço externo ou dado de produção foi alterado. LocalStorage contém somente configurações de volume, sensibilidade e qualidade.

## Entrega e rollback
Executar `npm ci`, `npm run dev` para desenvolvimento; `npm run build` e `npm run preview` para distribuição local. O servidor de preview foi deixado em 127.0.0.1:4173. Artefatos de distribuição e snapshot do código em `releases/`; hashes em `qa/build-hashes.json`. Nenhuma publicação externa foi feita. Para desfazer o projeto novo, pare seus servidores e remova exclusivamente `apps/inkdays` após guardar o snapshot desejado. Para restaurar esta versão em futuras alterações, extraia o snapshot numa pasta nova e execute `npm ci`.

## Próxima fase
Primeira tarefa: playtest curto com jogadores para avaliar câmera/tiro, equilíbrio e hardware alvo. Depois definir comandos/snapshots e provar cooperação autoritativa de dois jogadores. Demais itens em INKDAYS_BACKLOG.md. A Fase 2 não foi iniciada; a automação de continuidade da Fase 1 deve ficar pausada após esta entrega.

## Publicacao e touch — 2026-09-11
Publicado em https://inkdays-ynsanuz-20260911.netlify.app (Netlify). Sites retornou project_not_found; manifest original preservado para recuperacao. Controles horizontais implementados, 19 testes passaram, lint e build aprovados; HUD revisada em 844x390 e 568x320. Validacao em aparelho fisico pendente. Rollback local: releases/inkdays-0.1.0-source.zip. Deploy atual: 6aa3f43c3fedc70b0b4d32b2.


## Correcao mouse e touch
Deteccao inicial usa apontador principal, sem forcar modo celular apenas por maxTouchPoints. Pointerdown de mouse retorna ao modo desktop e solicita captura; toque retorna aos controles mobile. Clique no cenario tenta recuperar captura do mouse. Validacao: 21 testes, lint e build passaram. Validacao manual em hardware hibrido ainda pendente.


## Instalacao PWA
Botao INSTALE AQUI no menu, prompt nativo quando disponivel e instrucoes para demais navegadores. Manifest com escopo relativo compativel com GitHub Pages e Netlify, icones PNG 192/512, orientacao horizontal. Service worker gerado com hash dos arquivos e precache atomico. Atualizacao aguarda fechamento das janelas; sem reload durante partida. 21 testes, lint e build passaram; simulacao de eventos do worker validou cache offline em raiz/subpasta e preservacao de caches de outros apps. Instalacao no sistema operacional e teste offline em aparelho fisico ainda pendentes.


## Fase 2 — iniciada: contrato e movimentacao compartilhada
Primeira entrega tecnica: movimentacao extraida do avatar para modulo independente do renderizador, usado pelo solo. Protocolo versionado valida comandos e rejeita valores invalidos e campos de estado forjados. Prototipo de autoridade de movimentacao para dois participantes: passo fixo, sequencias, snapshots copiados e interrupcao de entrada obsoleta. Testes cobrem repeticao/ordem, pacotes em excesso, replay, desconexao logica e confirmacao apos simulacao.
Esta entrega NAO implementa transporte de rede, combate cooperativo, lobby ou servidor publico. A Fase 2 permanece EM ANDAMENTO. Proxima entrega: transporte WebSocket e duas janelas sincronizadas, depois autoridade de combate/ciclo e interpolacao. GitHub Pages hospeda o cliente estatico; o servidor persistente necessita hospedagem separada. Playtest humano solicitado; sem resultado inventado.


## Fase 2 — transporte local e bancada de dois clientes
Servidor WebSocket local com identidade atribuida por conexao, payload limitado, limite de comandos e snapshots a 20 Hz. Cliente de desenvolvimento /?coop=1 renderiza dois avatares, suaviza posicoes, envia comandos e informa desconexao. Servidor reutiliza as colisoes do mapa; ainda instancia geometria sem renderizador, devendo extrair dados de mapa antes de escalar.
Validacao: 28 testes, lint e build passaram. Teste de transporte abriu dois clientes WebSocket reais, verificou movimento recebido pelo outro cliente, terceiro recusado e remocao apos desconexao. Correcao testada para reentrada sem repetir a vaga do jogador restante. Servidor iniciou em 8787 e pagina/modulo da bancada responderam HTTP 200 em 5180. NAO houve revisao visual automatizada nesta entrega; nem teste entre aparelhos/redes. Proxima entrega: revisao visual e autoridade de combate/ciclo, com predicao/reconciliacao e tratamento de redes instaveis. Fase 2 continua em andamento; multiplayer publico nao liberado.


## Fase 2 — combate cooperativo local
CombatAuthority reutiliza Player, Pistol, Enemies, DayCycle e Horde no servidor. Mira envia yaw/pitch validados; cliente nao informa acerto, dano ou recompensa. Servidor calcula raycast da camera e cobertura do cano. Inimigos escolhem o vivo mais proximo; mortos deixam de agir; fim de partida congela ciclo quando todos morrem. Sala vazia reinicia no proximo ingresso. Snapshot inclui vida, municao, recarga, recompensas, inimigos e efeitos recentes. Bancada mostra nomes, contagem, efeitos, audio e transicao de noite.
Validacao: 33 testes, lint e build passaram. Testes novos cobrem cadencia/recarga individual, dois tiros e recompensa unica, tiro bloqueado por cobertura, horda/amanhecer, morte coletiva e snapshots de combate recebidos por dois WebSockets reais. Servidor local reiniciado. Validacao visual, redes instaveis, predicao/reconciliacao e hosting publico ainda pendentes. A camera suavizada local pode divergir do raycast do servidor durante movimento/latencia; nao considerar mira online finalizada. Reutilizacao de geometria no servidor e uma solucao de prototipo que precisa de perfil e extracao antes de escalar.


## Fase 2 — predicao, interpolacao e reconexao breve
O jogador local agora responde imediatamente e reconcilia o estado autoritativo refazendo apenas entradas ainda nao confirmadas. Correcoes pequenas desaparecem progressivamente; divergencias acima de 3 unidades sao corrigidas de imediato. Jogadores remotos e inimigos sao apresentados por um buffer de 100 ms que absorve jitter, ordena snapshots fora de ordem, ignora duplicatas e evita inventar movimento alem do ultimo estado recebido. Camera do cliente e calculo autoritativo do tiro usam a pose instantanea para retirar uma divergencia causada por suavizacoes diferentes.

O transporte entrega token temporario por conexao. Se a rede cair, o cliente tenta voltar automaticamente e o servidor preserva a identidade e o estado por cinco segundos. Depois desse prazo a vaga e removida normalmente. O teste WebSocket verifica que a posicao anterior, e nao apenas o identificador, sobrevive a uma reconexao breve.

Validacao: 38 testes passaram, incluindo simulacao deterministica com 100–200 ms de atraso, perda de 1 em 11 pacotes e reordenacao; lint e build passaram. Duas abas reais voltaram a conectar, exibiram o mesmo Dia 1, cronometro e 2/2; o apelido apareceu sem caixa sobre o outro jogador, com jitter observado de 0–1 ms em loopback e sem erros de console. Esta simulacao nao substitui teste humano entre dois aparelhos ou redes reais. Ainda faltam compensacao historica para tiros, teste de perda no transporte real, medicao prolongada de teleportes e sincronismo por varios dias; portanto o nucleo multiplayer permanece EM ANDAMENTO. A proxima entrega deve instrumentar RTT/perda e implementar historico autoritativo limitado para avaliar tiro sob ping realista antes do chat.


## Fase 2 — compensacao historica e matriz de rede simulada
Entradas de tiro podem informar o tick de mundo que estava sendo apresentado. O servidor conserva ate 500 ms de posicoes anteriores dos inimigos, limita pedidos ao intervalo permitido e executa somente a consulta do raycast nessa posicao; em seguida restaura imediatamente a posicao atual. Inimigo ja morto nunca e recriado pelo rewind. Dano, morte e recompensa continuam ocorrendo uma unica vez no estado atual. A bancada passou a medir RTT por ping/pong, separado do jitter de chegada dos snapshots.

Validacao automatizada: 44 testes cobrem ping simulado de 50, 120 e 250 ms com jitter, perda, duplicacao e reordenacao; convergencia da predicao; acerto na posicao historica; restauracao da posicao atual; rejeicao de tick invalido; duplicatas sem dano ou recompensa dupla; ping/pong sem interferir na simulacao; reconexao com estado; e tres dias completos de dois jogadores sem IDs duplicados ou divergencia de ciclo. Esta matriz e uma simulacao deterministica em processo local. Em duas abas do navegador, ambas mostraram Dia 1, 2/2 e o mesmo cronometro; RTT observado foi 0–1 ms e jitter 6–7 ms em loopback, sem erros de console. Teste entre aparelhos, rede real, perda no transporte WebSocket e avaliacao humana da coerencia visual do tiro continuam pendentes. O multiplayer permanece EM ANDAMENTO e o chat de texto ainda nao deve comecar.


## Fase 2 — condicionamento do transporte WebSocket
Foi adicionado um condicionador deterministico opcional no transporte real do servidor. Ele pode atrasar, perder, duplicar e reordenar mensagens de entrada e snapshots de saida sem alterar a autoridade da simulacao. O perfil manual `npm run coop:server:badnet` aplica aproximadamente 120 ms de RTT base, jitter de ate 25 ms, perda periodica, duplicacao e reordenacao para playtest local reproduzivel.

Validacao automatizada: 45 testes passaram. O novo teste usa dois clientes WebSocket reais sob todas as degradacoes ao mesmo tempo, encontra um mesmo tick recebido pelos dois e confirma snapshots autoritativos identicos, dois IDs unicos e movimento processado. Na bancada do navegador, duas abas sob o perfil degradado mostraram juntas a Horda do Dia 1 com 9 s restantes e depois o Dia 2 com 35 s; uma instância morreu e a outra sobreviveu, mantendo 2/2 e o mesmo ciclo. Durante essa execução, o RTT observado variou de 95 a 144 ms e o jitter de 18 a 22 ms, sem erros de console. Trata-se de transporte real condicionado dentro da maquina local, ainda nao de rede externa nem playtest humano. Rede real, aparelhos fisicos e partida humana prolongada continuam pendentes.


## Fase 2 — bancada para dois aparelhos na rede local
O cliente cooperativo deixou de fixar localhost e agora usa automaticamente o mesmo host da pagina. Os comandos `npm run dev:lan` e `npm run coop:server:lan` expõem somente a bancada de desenvolvimento na rede local e mostram o endereço a abrir nos dois aparelhos. O modo normal continua limitado a loopback. Mensagens de uma conexão antiga que chegam depois de uma retomada são descartadas pela identidade do socket, evitando que comandos atrasados voltem a mover o personagem reconectado.

Validacao automatizada: 46 testes passaram duas vezes consecutivas. O novo caso encerra e retoma uma conexão sob atraso, jitter, perda, duplicacao e reordenacao, confirmando um unico jogador, a mesma identidade, a mesma posicao e ausencia de comandos antigos aplicados depois da retomada. Validacao local: HTTP respondeu 200 pelo endereco privado `192.168.1.15:5180`, e os servidores HTTP e WebSocket foram confirmados ouvindo em `0.0.0.0` nas portas 5180 e 8787. Duas abas abertas por esse endereco mostraram Dia 1, 2/2, o mesmo cronometro, ping de 1 ms e jitter de 3 ms, sem erros de console. Isso comprova a configuracao da maquina atual; firewall, Wi-Fi, toque, desempenho e jogabilidade em um segundo aparelho ainda dependem de teste fisico. O multiplayer permanece EM ANDAMENTO.


## Fase 2 — estado autoritativo durante desconexao
Participantes agora possuem estado conectado explicito no servidor e nos snapshots. Ao perder a conexão, o comando e a velocidade horizontal são zerados, novos comandos daquele socket são rejeitados, o personagem deixa de ser alvo dos inimigos e permanece reservado por cinco segundos. Se todos os participantes estiverem suspensos, o ciclo Dia/Horda e os inimigos congelam. A retomada reativa o mesmo participante; no HUD do companheiro, o nome permanece sem caixa e recebe a indicação discreta `reconectando`, enquanto a contagem mostra somente conexões ativas.

Validacao automatizada: 48 testes passaram. Casos novos confirmam que movimento não avança durante suspensão, pacotes são rejeitados até a retomada, o jogador desconectado não recebe dano e o ciclo só volta a avançar depois de uma reconexão. Lint, TypeScript e build PWA passaram. Os servidores LAN foram reiniciados com esta versão em `192.168.1.15`, mas a interação entre dois aparelhos físicos e a avaliação humana dessa transição permanecem pendentes. O multiplayer continua EM ANDAMENTO.


## Fase 2 — rotação interpolada e telemetria de reconciliação
A apresentação remota agora interpola também a rotação de jogadores e inimigos usando o arco angular mais curto, inclusive na passagem entre -180° e 180°. Isso remove giros longos e mudanças secas causadas por snapshots fora de ordem. A bancada passou a mostrar a maior correção local acumulada, em centímetros, e contar ajustes acima do limite de três unidades. Esses números tornam divergências reais observáveis durante o playtest em vez de depender apenas da aparência suavizada.

Validacao automatizada: 49 testes passaram, incluindo a interpolação angular na descontinuidade de PI. Lint, TypeScript e build PWA passaram. A interpolação matemática está validada; a percepção visual, os valores de correção ao longo de vários dias e a frequência aceitável de ajustes bruscos ainda precisam ser avaliados em dois aparelhos e rede real. O multiplayer continua EM ANDAMENTO e o chat de texto permanece aguardando essa validação.


## Fase 2 — heartbeat e retomada após expiração
O servidor agora envia heartbeat nativo do WebSocket e encerra conexões que deixam de responder. Isso cobre quedas em que o navegador, roteador ou sistema operacional não produz um fechamento imediato. O mecanismo não depende do `setInterval` do cliente, que pode ser reduzido pelo navegador em uma aba minimizada. O fluxo normal de suspensão, proteção e reserva de cinco segundos é acionado pelo fechamento detectado. Se essa reserva já tiver expirado, uma conexão posterior recebe uma nova identidade e o cliente reinicia sua predição, sequência e métricas de correção, evitando carregar divergência da sessão anterior.

Validacao automatizada: 50 testes passaram. O caso novo cria um cliente WebSocket que deliberadamente não responde ao heartbeat, confirma encerramento pelo código esperado e verifica que a vaga é removida após a tolerância. Clientes normais continuam respondendo ao heartbeat automaticamente nos demais testes de transporte. Lint, TypeScript e build PWA passaram. Detecção em suspensão real de celular e retomada após troca de Wi-Fi continuam pendentes de aparelho físico. O multiplayer permanece EM ANDAMENTO.


## Fase 2 — telemetria confiável de perda e jitter
A medição simples de intervalo foi substituída por telemetria baseada nos ticks autoritativos. Ela ignora snapshots duplicados, tolera reordenação por uma janela de 12 ticks e só classifica como perda posições já finalizadas. O jitter compara o tempo real de chegada com o intervalo esperado para a diferença de ticks, evitando interpretar um salto normal de sequência como instabilidade. A HUD da bancada agora mostra ping, jitter, perda percentual, maior correção local e quantidade de ajustes bruscos. Ping, jitter e perda reiniciam a cada conexão para não misturar o tempo offline com a qualidade do novo enlace.

Validacao automatizada: 53 testes passaram. Os novos casos cobrem duplicatas, reordenação recuperada dentro da tolerância, perda realmente finalizada e variação de chegada sem perda. Lint, TypeScript e build PWA passaram. A precisão matemática da métrica está validada; limites aceitáveis para uma experiência boa ainda dependem do playtest prolongado em rede real e aparelhos físicos. O multiplayer permanece EM ANDAMENTO.


## Fase 2 — relatório de playtest por aparelho
A bancada cooperativa agora permite baixar um relatório JSON ao final da sessão. Cada aparelho agrega duração, amostras, último dia/tick, média e máximo de ping, jitter e perda, maior correção, ajustes bruscos, desconexões, retomadas e novas identidades. O relatório guarda somente números técnicos: não inclui nick, ID do jogador, comandos, mensagens ou conteúdo pessoal. Comparar os dois arquivos permitirá identificar problemas assimétricos durante uma partida prolongada sem depender apenas da memória dos participantes.

Validacao automatizada: 54 testes passaram. O novo teste confirma cálculos de média/máximo, duração, progressão de dia, correções e eventos de conexão, além da ausência de identidade no JSON. Lint, TypeScript e build PWA passaram. O botão existe apenas na bancada cooperativa de desenvolvimento, que continua excluída do pacote público. A coleta em dois aparelhos físicos ainda não foi realizada; portanto nenhuma conclusão de rede real foi inferida. O multiplayer permanece EM ANDAMENTO.


## Fase 2 — entrega confiável de ações pontuais
Pulo e recarga agora permanecem marcados nos comandos seguintes por uma janela máxima de 30 ticks, até que um snapshot autoritativo confirme a sequência em que a ação começou. Assim, perder o pacote original não elimina a ação, e o limite impede repetição indefinida quando a conexão desaparece. No servidor, a intenção de disparo é consumida e limpa a cada tick. Um jogador segurando o botão continua enviando `fire`, mas um clique isolado não deixa o gatilho preso durante uma lacuna de pacotes, evitando tiros, munição ou dano adicionais.

Validacao automatizada: 56 testes passaram. Os casos novos confirmam repetição de pulo/recarga até o acknowledgement, remoção após confirmação, expiração da redundância e apenas uma bala consumida quando um único comando de tiro é seguido por 120 ticks sem novas entradas. Lint, TypeScript e build PWA passaram. WebSocket já fornece entrega ordenada no transporte real; essa redundância protege também a camada de comandos durante reconexão e condicionamento artificial. Sensação de pulo e recarga sob rede física ainda depende do playtest em dois aparelhos. O multiplayer permanece EM ANDAMENTO.


## Fase 2 — existência histórica dos alvos
A compensação de tiro agora filtra os candidatos pelo conjunto de inimigos que realmente existia no tick visto. Um inimigo surgido depois daquele instante permanece no mundo atual, mas não participa do raycast rebobinado. Cada evento de tiro registra também a profundidade do rewind em ticks; o relatório de sessão apresenta o maior valor convertido em milissegundos para comparação com ping, jitter e sensação humana do disparo.

Validacao automatizada: 57 testes passaram. O caso novo cria o histórico sem inimigo, faz o alvo surgir depois, dispara solicitando o tick anterior e confirma vida intacta, `hit: false` e rewind de um tick. Os testes anteriores continuam verificando acerto em alvo que existia e se moveu, restauração imediata da posição atual, dano e recompensa únicos. Lint, TypeScript e build PWA passaram. A coerência perceptiva com alvos em movimento sob internet real continua pendente de playtest físico. O multiplayer permanece EM ANDAMENTO.


## Fase 2 — snapshots monotônicos e tick visual do tiro
O cliente agora separa a aceitação de estado da coleta de telemetria. Um snapshot reordenado ainda pode preencher uma lacuna e corrigir a taxa de perda, porém não pode substituir snapshot mais novo, reconciliar a posição local para trás ou regredir vida, munição, inimigos e Dia/Horda. Duplicatas também deixam de executar efeitos novamente. O `viewTick` enviado no disparo passou a considerar o tempo transcorrido desde a chegada do snapshot e o atraso real de seis ticks da interpolação. Ele avança junto com a apresentação e é limitado ao estado mais novo, evitando até cerca de 50 ms de rewind adicional entre snapshots de 20 Hz.

Validacao automatizada: 58 testes passaram. Os novos casos confirmam que a telemetria conserva o maior tick diante de reordenação e que o tick apresentado avança corretamente sem extrapolar além do snapshot disponível. Lint, TypeScript e build PWA passaram. A eliminação da regressão está coberta em nível de lógica; observação de teleportes e sensação do tiro em uma sessão física prolongada continuam pendentes. O multiplayer permanece EM ANDAMENTO.


## Fase 2 — retomada sem rajada de comandos
Corrigido acúmulo de tempo enquanto o cliente estava desconectado ou aguardava seu primeiro snapshot. Esse tempo podia gerar centenas de comandos no mesmo quadro ao retomar, atingir o limite do servidor e causar nova desconexão. O relógio de entradas agora descarta tempo offline e limita a recuperação a seis passos por quadro. Toda conexão recomeça a predição a partir do primeiro estado recebido e limpa os buffers visuais antigos, preservando a sequência quando a identidade é retomada.

Validação automatizada: 60 testes passaram; os novos casos simulam 60 segundos offline, travamento de dez segundos e cadência a 30, 60 e 144 FPS. Lint e build passaram. Esta entrega não foi validada visualmente em navegador nem em aparelho físico. Multiplayer permanece em desenvolvimento; a contagem de testes não substitui a partida humana prolongada.


## Fase 2 — detecção de falha em uma direção
O heartbeat do servidor agora considera somente `pong` nativo como prova de conexão saudável. Comandos recebidos não renovam esse prazo, pois uma rede pode continuar entregando jogador → servidor enquanto perdeu o caminho servidor → jogador. Ao expirar, o servidor termina o socket imediatamente; isso dispara suspensão, proteção do personagem e tentativa de reconexão sem depender da confirmação de um fechamento normal.

Validação automatizada: 60 testes passaram. O teste de heartbeat mantém o cliente enviando comandos válidos a cada 20 ms, desativa deliberadamente suas respostas `pong`, confirma encerramento anormal pelo servidor e remoção da vaga depois da tolerância. Lint, TypeScript e build PWA passaram. Troca de Wi-Fi e perda unilateral em aparelho real ainda precisam de validação física. O multiplayer permanece EM ANDAMENTO.
