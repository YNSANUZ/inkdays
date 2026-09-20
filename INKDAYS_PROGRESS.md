# INKDAYS — progresso

## Visão do projeto
Sobreviva mais um dia. Jogo cooperativo futuro, terceira pessoa, tinta preta sobre papel. Fase 1: vertical slice solo offline, sem serviços externos.

## Fase 2 — primeira integração de rig Mixamo

Foi criada a ponte visual entre a simulação existente e um personagem esquelético. O X Bot contido nos pacotes fornecidos foi usado como base técnica temporária, com materiais brancos, sombra, contorno preto, mochila/arma e olhos vermelhos somente nos inimigos. Jogador e Borrão possuem transições independentes de idle, corrida, agachamento, salto, caminhada de zumbi e ataque. A movimentação horizontal gravada nos FBX é removida: as animações não controlam posição, colisão, dano ou autoridade de rede.

Os oito GLBs foram convertidos para glTF 2.0, reamostrados a 30 FPS e quantizados. A malha-base foi simplificada para 48% dos triângulos, com tolerância geométrica de 0,1%; o conjunto caiu de aproximadamente 1,31 MB para 0,76 MB. O modelo é carregado uma vez e clonado com esqueleto compartilhando geometrias; a arte procedural anterior permanece como fallback enquanto os arquivos carregam ou se houver falha. Isso permite trocar depois a malha-base por um soldado Mixamo escolhido ou por um modelo autoral sem reestruturar multiplayer.

Validação: TypeScript e build PWA passaram; o jogo abriu em 1280×720, carregou o jogador e um inimigo criado pela bancada sem erros de console. Uma horda real chegou a quatro inimigos animados, manteve 60 FPS na sessão automatizada e registrou 71 draw calls e 313.950 triângulos no instante medido. As capturas estão em `qa/rigged-avatar-desktop.png`, `qa/rigged-avatar-enemy.png`, `qa/rigged-avatar-optimized.png`, `qa/rigged-avatar-horde.png` e `qa/rigged-avatar-mobile.png`. O módulo 3D é carregado sob demanda e mantém o boneco procedural caso algum GLB falhe. Ainda faltam movimento por toque e desempenho em celular físico; o modelo técnico X Bot ainda não representa a aparência final do soldado. A próxima entrega deve avaliar movimento humano e ajustar arma/mochila antes da substituição pela malha definitiva.

## Fase 2 — rig no multiplayer público

O cliente cooperativo passou a reproduzir também o ataque esquelético do inimigo a partir do estado `ATTACK` recebido no snapshot autoritativo. A animação continua apenas apresentacional: escolha de alvo, alcance, dano e morte permanecem calculados pelo servidor.

Validação pública automatizada: dois contextos independentes do Chrome entraram simultaneamente em `https://ynsanuz.github.io/inkdays/?coop=1`, carregaram os novos personagens, receberam o mesmo dia/cronômetro e localizaram o nome do companheiro. Após 1,5 s de movimento de um cliente, foram observados aproximadamente 159–162 ms de ping, 2 ms de jitter, 0% de perda, correção máxima de 13 cm e zero ajustes bruscos; o cliente parado registrou 0 cm. Em uma segunda conexão, a mensagem `Bruno Rede: teste sincronizado` apareceu igualmente nos dois clientes. Não houve erro de console. A contagem temporária de 4/8 incluiu conexões reservadas pelo intervalo de reconexão dos ensaios anteriores e retornou depois do prazo; não indica quatro pessoas reais. A automação confirma regressão técnica, mas não substitui avaliação humana em dois aparelhos físicos.

## Fase 2 — locomoção visual direcional

O jogador agora escolhe animações distintas para avançar, recuar e deslocar-se para esquerda ou direita. A direção é calculada da velocidade autoritativa em relação ao rumo do personagem, portanto os demais clientes veem a mesma intenção de locomoção publicada no snapshot. Velocidades muito baixas conservam a direção frontal para impedir alternância nervosa durante a desaceleração. Foram acrescentados somente 73 KB de animações quantizadas; o conjunto visual completo permanece em aproximadamente 0,83 MB.

Validação: testes unitários cobrem as quatro direções, rotação de 90 graus e estabilidade em baixa velocidade. Uma execução real percorreu W, S, A e D, confirmou HTTP 200 para os três novos GLBs e terminou sem erro de carregamento ou console. A captura está em `qa/directional-locomotion.png`. A aparência e o ritmo ainda precisam ser julgados por uma pessoa em jogo, especialmente no touch e sob interpolação de um jogador remoto.

## Fase 2 — primeira silhueta autoral e noite em tinta

O esqueleto Mixamo passou a dirigir uma apresentação mais próxima da referência: cabeça esférica ampliada, tronco arredondado, corpo visualmente compacto, olhos mínimos, mochila e arma. Jogadores permanecem brancos; inimigos usam cinza mais marcado e olhos vermelhos. O contorno duplicado por malha foi removido e substituído por `OutlineEffect`, que desenha uma espessura coerente também durante deformações do esqueleto. Isso aproxima a leitura de ilustração viva e reduz a aparência de manequim técnico.

Durante a horda, fundo, névoa, luz direcional e uma vinheta radial passam gradualmente a tons mais escuros. O centro conserva contraste para mira e identificação de alvos, enquanto as bordas comunicam a noite. Não foi criada barra de chefão nesta entrega porque ainda não existe uma entidade de boss autoritativa cuja vida possa alimentar a interface; exibir uma barra sem boss real produziria estado enganoso.

Validação visual automatizada: dia com um inimigo, horda com cinco inimigos e horda em 844×390 com quatro inimigos, sem erros de console. As capturas estão em `qa/stylized-character-day.png`, `qa/stylized-character-horde.png` e `qa/stylized-character-mobile-horde.png`. O efeito de contorno aumenta o custo de renderização e ainda precisa de medição em celular físico; qualidade baixa poderá precisar desativar ou reduzir esse passe conforme o resultado real.

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


## Fase 2 — soak acelerado do ciclo pelo transporte real
O servidor de teste ganhou parâmetros internos para executar vários passos autoritativos por pulso sem alterar a cadência padrão usada pelo jogo. Isso permite atravessar vários dias pelo WebSocket real em poucos segundos e procurar divergência acumulada entre clientes. O novo soak conecta dois clientes, aplica simultaneamente atraso, jitter, perda, duplicação e reordenação, conserva apenas uma janela de snapshots e procura um mesmo tick recebido pelos dois depois de três ciclos completos.

Validação automatizada: 61 testes passaram. Os dois clientes chegaram ao Dia 4, fase de preparação, com snapshots integralmente iguais no mesmo tick, dois participantes e IDs únicos. O teste durou cerca de 5,7 segundos e executou 10.800 passos autoritativos. Os spawns foram desativados nesse caso para isolar transporte e ciclo; portanto ele não valida combate contínuo nem sensação humana durante vários dias. Lint, TypeScript e build PWA passaram. Partida prolongada com inimigos em dois aparelhos físicos permanece pendente e o multiplayer continua EM ANDAMENTO.


## Fase 2 — soak com hordas reais
Foi adicionado um segundo soak acelerado mantendo o sistema real de spawn, perseguição, movimento, estados de IA e limpeza ao amanhecer. Somente o dano recebido foi neutralizado dentro desse teste para impedir que a morte coletiva congelasse o calendário antes da medição. Dois clientes WebSocket recebem a mesma autoridade através do condicionador com atraso, jitter, perda, duplicação e reordenação.

Validação automatizada: 62 testes passaram. Ambos os clientes observaram pelo menos cinco inimigos durante as hordas e chegaram ao Dia 3 com snapshot integralmente igual, jogadores com 100 de vida e lista de inimigos vazia após o amanhecer. O caso percorreu 7.200 passos autoritativos em cerca de 3,7 segundos. Isso valida consistência do transporte para spawn, IA e remoção ao longo de dois ciclos, mas não valida dano contínuo, combate executado por pessoas ou qualidade visual em aparelhos reais. Lint, TypeScript e build PWA passaram. O multiplayer permanece EM ANDAMENTO.


## Fase 2 — eliminação e recompensa pelo WebSocket degradado
Um cenário controlado de combate agora percorre o transporte real com atraso, jitter, duplicação e reordenação nas duas direções. O primeiro cliente dispara duas vezes respeitando a cadência autoritativa; duplicatas com a mesma sequência são rejeitadas. O segundo cliente não participa da eliminação. O teste aguarda um tick comum recebido pelos dois antes de comparar todo o snapshot.

Validação automatizada: 63 testes passaram. O cenário confirmou inimigo removido uma única vez, dois impactos registrados, exatamente duas balas consumidas do atirador, uma eliminação e $20 somente para ele; o companheiro preservou oito balas, zero eliminações e zero dinheiro. Os snapshots dos dois clientes foram integralmente iguais. O caso isolado passou cinco vezes consecutivas e depois na suíte completa. Lint, TypeScript e build PWA passaram. Sensação visual, compensação histórica percebida e combate humano prolongado ainda dependem de dois aparelhos físicos. O multiplayer permanece EM ANDAMENTO.


## Fase 2 — dano e morte individual pelo transporte
Um inimigo controlado agora ataca um dos dois participantes através da simulação normal enquanto os snapshots atravessam atraso, jitter, perda, duplicação e reordenação. O teste procura o primeiro tick de morte recebido em comum e compara o estado completo dos dois clientes. A autoridade precisa manter o outro participante vivo e a partida ativa.

Validação automatizada: 64 testes passaram. O cenário de morte individual passou quatro execuções isoladas e a suíte completa: ambos os clientes receberam o mesmo snapshot, o alvo chegou a zero de vida, o companheiro permaneceu com vida, o inimigo continuou único e `gameOver` permaneceu falso. Lint, TypeScript e build PWA passaram. A animação de morte, percepção do dano e continuidade jogável pelo sobrevivente ainda precisam de avaliação humana em dois aparelhos. O multiplayer permanece EM ANDAMENTO.

## Fase 2 — derrota coletiva e congelamento da partida

O complemento do fluxo de morte deixa um inimigo controlado derrubar os dois participantes pela simulação normal enquanto os snapshots atravessam atraso, jitter, perda, duplicação e reordenação. Os clientes precisam convergir no mesmo tick de derrota, com ambos em zero de vida e `gameOver` verdadeiro. Depois disso, o teste avança a autoridade por pelo menos mais 60 ticks e exige que o tempo restante e os inimigos permaneçam inalterados.

Validação automatizada: 65 testes passaram. O cenário de derrota coletiva passou quatro execuções isoladas e a suíte completa: os dois clientes receberam snapshots integralmente iguais na derrota e depois dela, e o calendário e a IA ficaram congelados enquanto o tick técnico continuou avançando. Lint, TypeScript e build PWA passaram. Tela de derrota, sensação da transição e recuperação ou reinício após uma partida real ainda dependem de avaliação humana em dois aparelhos. O multiplayer permanece EM ANDAMENTO.

## Fase 2 — reinício autoritativo da sala

A bancada cooperativa agora oferece JOGAR NOVAMENTE após a derrota coletiva. A solicitação passa pelo WebSocket e somente o servidor pode aceitá-la, apenas para um participante conectado e quando todos morreram. O cliente repete a solicitação até observar a nova partida, cobrindo descarte artificial da mensagem. A autoridade preserva IDs e o tick crescente, remove inimigos e tiros antigos e restaura conjuntamente calendário, vida, posição, munição, eliminações e dinheiro. Repetições recebidas depois do primeiro reinício são rejeitadas sem reiniciar novamente.

Validação automatizada: 66 testes passaram. O caso direto verifica restauração integral, identidades preservadas, tick sem regressão e idempotência. O cenário WebSocket com atraso, jitter, perda, duplicação e reordenação passou quatro vezes isoladamente e depois na suíte completa: ambos os clientes convergiram no mesmo snapshot reiniciado. Lint, TypeScript e build PWA passaram. A apresentação visual do botão e a retomada efetiva dos controles ainda precisam de playtest humano em dois aparelhos. O multiplayer permanece EM ANDAMENTO.

## Fase 2 — divisão autoritativa dos alvos da horda

Cada inimigo agora conserva a referência do jogador vivo mais próximo escolhido pela simulação do servidor. O snapshot publica essa decisão como `targetId`, junto com posição, rotação e estado da IA. Assim, a divisão da horda deixa de ser uma inferência visual local e passa a ser um dado autoritativo comum aos clientes. Inimigos sem alvo vivo publicam `null`.

Validação automatizada: 68 testes passaram. O caso direto posiciona um inimigo próximo de cada participante e confirma dois alvos e dois estados de perseguição distintos. O cenário WebSocket condicionado passou quatro vezes isoladamente e depois na suíte completa, exigindo snapshots integralmente iguais e o conjunto de alvos igual ao conjunto dos dois jogadores. Lint, TypeScript e build PWA passaram. A legibilidade visual de uma horda dividida e eventuais trocas rápidas de alvo ainda precisam de observação humana em dois aparelhos e ping real. O multiplayer permanece EM ANDAMENTO.

## Fase 2 — troca de alvo em desconexão e retomada

A seleção autoritativa exclui imediatamente participantes suspensos ou mortos. Quando o jogador mais próximo desconecta, o inimigo passa a perseguir o companheiro vivo; ao retomar a mesma sessão dentro da tolerância, a identidade é preservada e ele volta a ser elegível conforme a distância. A decisão continua sendo calculada apenas no servidor e publicada por `targetId`.

Validação automatizada: 70 testes passaram. O caso direto confirma a sequência de alvo A → B → A após suspensão e retomada. O cenário WebSocket com atraso, jitter, perda, duplicação e reordenação passou quatro vezes isoladamente e depois na suíte completa: o cliente restante observou o jogador suspenso e o alvo transferido, e após a reconexão os dois clientes receberam o mesmo snapshot, com dois IDs e o alvo restaurado. Lint, TypeScript e build PWA passaram. Mudanças visuais bruscas de direção e o comportamento durante troca real de Wi-Fi ainda dependem de avaliação humana em dois aparelhos. O multiplayer permanece EM ANDAMENTO.

## Fase 2 — transferência de alvo após morte individual

O fluxo de morte individual agora exige explicitamente que o participante caído saia da seleção de IA no passo autoritativo seguinte. O inimigo sobrevivente precisa apontar seu `targetId` para o companheiro ainda vivo, enquanto a partida continua com `gameOver` falso. Isso impede que um cliente represente perseguição persistente ao corpo caído.

Validação automatizada: 71 testes passaram. O novo caso direto derruba o jogador mais próximo pela simulação normal e confirma a transferência ao sobrevivente. O teste WebSocket existente foi fortalecido para aguardar e comparar o primeiro snapshot comum que contenha simultaneamente morte, alvo transferido e partida ativa; passou quatro vezes isoladamente e depois na suíte completa sob atraso, jitter, perda, duplicação e reordenação. Lint, TypeScript e build PWA passaram. A percepção da virada do inimigo e a continuidade do combate pelo sobrevivente ainda precisam de avaliação humana em dois aparelhos. O multiplayer permanece EM ANDAMENTO.

## Fase 2 — evento visual compartilhado de disparo

Foi isolada a verificação do disparo que precisa ser apresentado aos outros participantes. O evento autoritativo contém serial monotônico, ID do atirador, origem, destino, resultado do impacto e quantidade de ticks de compensação histórica. O consumo de munição permanece associado apenas ao autor. A bancada já converte cada serial novo em traçante, impacto e efeito sonoro, ignorando repetições trazidas por snapshots posteriores.

Validação automatizada: 72 testes passaram. O novo cenário WebSocket dispara deliberadamente sem alvo e exige que os dois clientes recebam um snapshot integralmente igual, com o mesmo evento, coordenadas finitas, erro sem recompensa, sete balas para o autor e oito para o companheiro. O cenário passou quatro vezes isoladamente e depois na suíte completa sob atraso, jitter, perda, duplicação e reordenação. Lint, TypeScript e build PWA passaram. A percepção do traçante e do som remoto, especialmente em mobile e com ping real, ainda precisa de playtest humano em dois aparelhos. O multiplayer permanece EM ANDAMENTO.

## Fase 2 — corrida e salto compartilhados

Foi adicionado um cenário dedicado às ações locomotoras visíveis pelo companheiro. Um cliente envia corrida e salto enquanto o outro permanece neutro. O resultado só é aceito quando os dois clientes recebem o mesmo tick com o corredor acima do chão, velocidade vertical positiva e velocidade horizontal superior à caminhada, mantendo o observador exatamente no ponto inicial.

Validação automatizada: 73 testes passaram. O cenário WebSocket passou quatro vezes isoladamente e depois na suíte completa sob atraso, jitter, perda, duplicação e reordenação. Ele confirma estado autoritativo compartilhado e isolamento entre participantes; a suavidade percebida da animação remota, o arco completo do salto e a resposta dos controles touch continuam dependendo de playtest humano em dois aparelhos. Lint, TypeScript e build PWA passaram. O multiplayer permanece EM ANDAMENTO.

## Fase 2 — geração de partida e limpeza visual no reinício

O snapshot agora inclui `round`, uma geração autoritativa que aumenta em cada reinício sem interromper a monotonicidade do tick do servidor. Quando o cliente observa uma geração diferente, ele descarta a predição local e os buffers de posição e rotação de jogadores e inimigos antes de processar o novo estado. Isso evita interpolar entre a posição da derrota e o ponto inicial como se fosse movimento normal.

Validação automatizada: os 73 testes continuam aprovados. O teste direto passou a exigir incremento unitário da geração e tick preservado; o cenário WebSocket de derrota e reinício passou quatro vezes isoladamente e depois na suíte completa, exigindo o mesmo `round` novo nos dois clientes sob atraso, jitter, perda, duplicação e reordenação. Lint, TypeScript e build PWA passaram. A ausência perceptiva do arrasto entre posições ainda precisa ser confirmada visualmente em duas telas reais. O multiplayer permanece EM ANDAMENTO.

## Fase 2 — inspeção visual local de ciclo, morte e reinício

Duas sessões do navegador integrado foram abertas em 1280×720 contra o servidor WebSocket local. Ambas mostraram Dia 1, 2/2, mesmo cronômetro, vida e munição; cada perspectiva renderizou os dois avatares e o nome do companheiro sem caixa. A transição natural chegou à Horda no mesmo segundo nas duas telas, com inimigos presentes nas duas perspectivas e dano diferente por participante. Depois da morte coletiva, ambas exibiram `FIM DE PARTIDA` no mesmo estado. Um clique em JOGAR NOVAMENTE em apenas uma sessão restaurou as duas para preparação do Dia 1, 100 de vida, 8/48, $0 e posições iniciais. As capturas seguintes não mostraram posição intermediária persistente, e não houve erro ou aviso nos consoles. Ping observado: 0–1 ms; jitter: 0–2 ms; perda: 0%; correção máxima: 0 cm.

Esta foi uma inspeção visual automatizada em duas sessões na mesma máquina e loopback. Teclas sintéticas curtas não produziram deslocamento suficiente para avaliar honestamente a suavidade do movimento, e a aglomeração de inimigos ao redor dos corpos continua visivelmente bruta. Portanto, o resultado não substitui playtest humano, dois aparelhos físicos, controles touch, rede Wi-Fi ou internet real. O multiplayer permanece EM ANDAMENTO e o chat de texto ainda aguarda a validação física do núcleo.

## Fase 2 — separação de inimigos durante o ataque

A inspeção visual revelou que a separação da IA era aplicada somente durante perseguição e cessava ao entrar no alcance de ataque. Inimigos podiam então se sobrepor ao redor do jogador ou do corpo. A mesma força de afastamento agora continua durante `ATTACK`, em intensidade reduzida, preservando o alvo, a linha de visão, o alcance e a aplicação autoritativa de dano.

Validação automatizada: 74 testes passaram. O novo caso inicia dois inimigos com apenas 10 cm entre eles, executa um segundo de ataque e exige aumento superior a 50 cm na distância, mantendo ambos em `ATTACK`. O soak WebSocket existente com hordas reais também chegou novamente ao Dia 3 com snapshots iguais sob transporte degradado. Lint, TypeScript e build PWA passaram. A melhoria matemática está validada; densidade visual com uma horda completa, cantos e corpos ainda precisa ser reavaliada por uma pessoa em duas telas e aparelhos físicos. O multiplayer permanece EM ANDAMENTO.

## Fase 2 — compensação histórica pelo transporte

A compensação de tiro, antes validada diretamente na autoridade, agora possui um cenário completo pelo WebSocket condicionado. Um inimigo permanece na linha de mira durante o tick apresentado ao jogador e é movido para fora dela antes de o comando chegar. O servidor consulta apenas a posição histórica válida para o raycast, aplica o dano no inimigo atual e restaura sua posição presente antes de gerar qualquer snapshot.

Validação automatizada: 75 testes passaram. O cenário exige rewind positivo, um único dano de 26 pontos, inimigo com 22 de vida ainda em sua posição atual e snapshots integralmente iguais nos dois clientes. Passou quatro vezes isoladamente e depois na suíte completa sob atraso, jitter, perda, duplicação e reordenação. Lint, TypeScript e build PWA passaram. Isso valida o caminho técnico da mira histórica; coerência perceptiva entre câmera, retículo, alvo animado e impacto ainda depende de playtest humano com ping real. O multiplayer permanece EM ANDAMENTO.

## Fase 2 — clique de tiro confiável e deduplicado

O controle agora separa fogo mantido de clique pontual. Cada clique recebe um `shotId` baseado na sequência em que nasceu e esse identificador acompanha comandos posteriores até o acknowledgement autoritativo. O servidor mantém o último identificador aplicado por participante e consome cada clique somente uma vez. Assim, perder o comando original não apaga a ação, enquanto atraso, repetição ou reordenação não criam um segundo tiro. A cadência contínua permanece controlada pela pistola.

Validação automatizada: 78 testes passaram. Um caso de predição confirma repetição e encerramento no acknowledgement; um caso direto confirma que o mesmo ID não gasta outra bala depois do cooldown e que um ID novo dispara normalmente. No cenário WebSocket, duas mensagens de ping posicionam deliberadamente o clique original na mensagem descartada pelo condicionador; a cópia seguinte recupera exatamente um tiro, e repetições depois de 20 ticks mantêm sete balas e um único evento. O teste passou quatro vezes isoladamente e depois na suíte completa. Lint, TypeScript e build PWA passaram. Clique real com mouse e toque em aparelho físico sob troca de rede ainda precisa de playtest humano. O multiplayer permanece EM ANDAMENTO.

## Fase 2 — supressão de tiros históricos na reconexão

O cliente agora mantém o serial visual dos disparos em um cursor isolado e redefine esse cursor sempre que recebe uma nova conexão ou retoma a sessão. O primeiro snapshot passa a ser uma referência silenciosa: tiros antigos ainda conservados pelo servidor não criam uma rajada falsa de traçantes e sons ao voltar. Os disparos ocorridos depois dessa referência continuam sendo apresentados exatamente uma vez.

Validação automatizada: 80 testes passaram. Os casos novos cobrem referência inicial, eventos incrementais, snapshots repetidos e uma retomada que recebe três tiros históricos antes de um disparo realmente novo. Lint, TypeScript e build PWA passaram. A ausência perceptiva da rajada precisa ser confirmada em aparelho físico durante uma troca real de Wi-Fi. O multiplayer permanece EM ANDAMENTO.

## Fase 2 — nick autoritativo e persistente

A bancada permite informar um nick de até 16 caracteres antes de assumir os controles. A alteração percorre o WebSocket e somente o valor normalizado pelo servidor entra no snapshot compartilhado. Espaços são consolidados, marcação e símbolos fora do conjunto aceito são removidos, e nomes vazios são rejeitados. O nome fica associado à sessão autoritativa, permanece após reinício da partida e reconexão breve e continua sendo desenhado sem caixa sobre o companheiro.

Validação automatizada: 83 testes passaram. Os casos novos cobrem acentos, espaços, marcação, caracteres de controle, limite Unicode, conteúdo vazio, transmissão pelo WebSocket e preservação do mesmo nick e ID após reconexão. Lint, TypeScript e build PWA passaram. A entrada pelo teclado virtual e a legibilidade do nome em telas pequenas ainda precisam de aparelho físico. O multiplayer permanece EM ANDAMENTO.

## Fase 2 — confirmação e reenvio do nick

O nick solicitado agora permanece pendente no cliente até aparecer no estado autoritativo. Enquanto houver divergência, a solicitação é repetida no máximo uma vez a cada 400 ms; a confirmação do snapshot interrompe os envios. Isso cobre perda artificial de uma mensagem sem criar tráfego contínuo e também reaplica a escolha se a tolerância de reconexão expirar e o servidor atribuir uma identidade nova.

Validação automatizada: 85 testes passaram. O teste de transporte posiciona deliberadamente a primeira solicitação no terceiro pacote descartado, verifica que o nome genérico permanece, envia a cópia seguinte e confirma o nick normalizado e preservado após reconexão. Testes unitários cobrem cadência, confirmação, nome vazio e uma nova escolha posterior. Lint, TypeScript e build PWA passaram. Perda durante uma conexão física ainda precisa de validação em dois aparelhos. O multiplayer permanece EM ANDAMENTO.

## Fase 2 — coerência temporal da mira autoritativa

Cada participante agora conserva no servidor o tick mais recente que declarou estar vendo. Um comando pode avançar essa referência, mas não fazê-la regredir para escolher repetidamente uma posição histórica mais favorável. Ticks além do relógio atual do servidor são rejeitados antes de atualizar sequência, munição ou raycast. O limite anterior de 500 ms permanece como teto da compensação legítima.

Validação automatizada: 87 testes passaram. O caso direto estabelece um quadro novo sem alvo na mira e depois tenta voltar ao quadro antigo favorável, confirmando erro e vida intacta. O caso WebSocket envia um tick muito futuro, verifica oito balas e nenhum evento, e depois confirma que um comando temporalmente válido produz exatamente um disparo. Lint, TypeScript e build PWA passaram. A sensação da mira ainda requer playtest humano com ping real; estes limites validam coerência e resistência a manipulação, não percepção visual. O multiplayer permanece EM ANDAMENTO.

## Fase 2 — retomada imediata após recarregar a página

Uma recarga completa preservava o token no `sessionStorage`, mas reiniciava o contador local de comandos em zero. Como o servidor preservava a sequência anterior junto da identidade, movimento e tiros novos podiam ser rejeitados por muitos segundos. Ao receber o primeiro snapshot da sessão retomada, o cliente agora eleva seu contador para pelo menos `acknowledged + 1`, sem fazer uma conexão já ativa regredir.

Validação automatizada: 90 testes passaram. O cenário WebSocket envia e confirma a sequência 40, fecha a página simulada, retoma o mesmo token, deriva 41 do snapshot e confirma imediatamente o novo comando e a conexão ativa. Testes unitários cobrem sessão nova, página recarregada e contador local já adiantado. Lint, TypeScript e build PWA passaram. Suspensão e recarga em navegadores móveis reais ainda precisam de teste físico. O multiplayer permanece EM ANDAMENTO; chat de texto é a próxima entrega prevista.

## Fase 2 — primeira entrega do chat multiplayer

O chat de equipe foi integrado à autoridade existente. O servidor normaliza mensagens de até 100 caracteres, limita cada participante a uma mensagem a cada 30 ticks, numera os eventos, deduplica o identificador do cliente e conserva as oito mensagens recentes no snapshot. Cada jogador recebe `chatAcknowledged`; o cliente reenvia a primeira mensagem pendente a cada 400 ms até confirmação. A interface apresenta somente as três mais recentes no canto inferior esquerdo, sem painel grande. No PC, Enter abre e envia, Escape fecha, e teclas digitadas no campo não movimentam o personagem.

Validação automatizada: 94 testes passaram. Há cobertura para normalização, limite, vazio, cadência, deduplicação, outbox e acknowledgement. O cenário WebSocket descarta deliberadamente o primeiro envio, recebe a repetição e exige o mesmo snapshot e mensagem nos dois clientes. Lint, TypeScript e build PWA passaram. Na inspeção do navegador local, o chat ocupou 305 px junto à borda inferior esquerda, Enter abriu o campo com foco, e a transição de snapshots antigos sem `messages` foi tratada sem novos erros. Envio humano entre duas pessoas, legibilidade durante horda e teclado mobile continuam pendentes. O multiplayer permanece EM ANDAMENTO.

## Fase 2 — duração autoritativa das mensagens

Cada mensagem registra o tick em que foi aceita e permanece no snapshot por 720 ticks, equivalentes a 12 segundos. A expiração usa o relógio do servidor, de modo que clientes com atraso ou reconexão não mantenham linhas antigas por durações arbitrárias. O acknowledgement do remetente permanece depois da retirada visual para que uma repetição tardia não recrie a mensagem.

Validação automatizada: 95 testes passaram. O caso novo confirma presença até o tick 720, remoção no 721 e preservação do acknowledgement. Lint, TypeScript e build PWA passaram. A leitura durante combate e o tempo subjetivo adequado ainda dependem de playtest humano. O multiplayer permanece EM ANDAMENTO.

## Fase 2 — entrada de chat no celular

O modo touch horizontal ganhou um botão CHAT discreto ao lado interno do analógico. Ele abre o mesmo campo confiável com `enterkeyhint=send`, limpa qualquer intenção mantida e oculta temporariamente os controles de movimento, mira e disparo para evitar ações involuntárias enquanto o teclado do sistema está aberto. Enviar ou usar o botão de fechar devolve os controles no quadro seguinte. O desktop conserva Enter e Escape.

Validação: os 95 testes, lint, TypeScript e build PWA continuam aprovados. Em viewport 844×390, o botão apareceu em modo touch com 55 px de largura, começando em x=145; o analógico ativo ocupa até aproximadamente x=137, deixando separação entre os alvos. O foco e o teclado virtual reais, redimensionamento causado pelo teclado e envio em Android/iOS ainda dependem de aparelho físico. O multiplayer permanece EM ANDAMENTO.

## Fase 2 — percepção de dano autoritativo

A bancada agora compara a vida local somente entre snapshots aceitos e apresenta uma vinheta vermelha curta quando há redução. O efeito não antecipa o servidor nem usa colisão local: ele nasce depois que o dano autoritativo chega. O primeiro estado após conexão ou retomada estabelece uma referência silenciosa, e aumento de vida, amanhecer ou reinício não são interpretados como impacto.

Validação automatizada: 98 testes passaram. Os casos novos cobrem primeiro snapshot com vida já reduzida, dano de 14 pontos, estado repetido, cura, reset de reconexão e valores inválidos. Lint, TypeScript e build PWA passaram. Intensidade, duração e leitura do efeito em telas físicas ainda precisam de avaliação humana. O multiplayer permanece EM ANDAMENTO.

## Fase 2 — bloqueio de entrada durante reconexão

A entrada jogável agora depende simultaneamente de WebSocket aberto, primeira referência autoritativa recebida e chat fechado. Quando o transporte cai ou ainda aguarda snapshot, o relógio de comandos não avança, movimentos de câmera são descartados e os controles touch ficam ocultos. Ao receber `welcome`, o cliente limpa teclas, disparo e gestos antigos antes de aguardar o snapshot que restabelece a predição. Isso evita caminhar, mirar ou atirar imediatamente por uma intenção acumulada durante o período offline.

Validação automatizada: 99 testes passaram. O caso novo cobre todas as combinações relevantes da trava de controle; os cenários existentes continuam cobrindo queda, retomada de identidade, sequência após recarga e ausência de rajada de comandos. Lint, TypeScript e build PWA passaram. A sensação da interrupção e retomada durante troca real de Wi-Fi ainda depende de dois aparelhos físicos. O multiplayer permanece EM ANDAMENTO.

## Fase 2 — resposta local do gatilho com confirmação exata

O clique ou primeiro toque de disparo agora toca imediatamente apenas o som local, reduzindo a latência percebida sem prever acerto. Traçante, impacto, consumo de munição, dano, morte e recompensa continuam aguardando a autoridade. O `shotId` confiável passou a acompanhar também o evento de tiro do servidor; quando a confirmação retorna, o cliente elimina somente o segundo som daquele identificador. Previsões não confirmadas expiram em 600 ms e são descartadas na reconexão. Tiros remotos e disparos contínuos continuam audíveis pelo evento autoritativo.

Validação automatizada: 101 testes passaram. Os casos novos confirmam associação por identificador exato, preservação de evento remoto ou diferente, expiração e limpeza na reconexão. O cenário WebSocket de clique perdido agora exige que o evento recuperado publique `shotId: 7` igualmente aos dois clientes. Lint, TypeScript e build PWA passaram. Um clique recusado pelo servidor por cadência ou falta de munição ainda pode produzir apenas o som local; não produz traçante, impacto nem efeito de gameplay. A sensação com ping físico ainda depende de playtest humano. O multiplayer permanece EM ANDAMENTO.

## Fase 2 — confirmação visual de acerto e recompensa

Um evento autoritativo marcado como acerto e pertencente ao jogador local agora pulsa a mira em vermelho; tiros de outros participantes continuam produzindo traçante e impacto sem transformar a mira do observador em confirmação própria. O dinheiro local também possui uma referência separada: somente aumento entre snapshots aceitos mostra `+$valor` abaixo da mira. Primeiro snapshot, cura de estado, reinício, redução e reconexão não fabricam recompensa.

Validação automatizada: 103 testes passaram. Os casos novos cobrem referência inicial, aumento, repetição, redução, nova recompensa, valor inválido e reset de reconexão. Os cenários de transporte já exigem impacto, eliminação e $20 apenas para o autor em snapshots iguais. Lint, TypeScript e build PWA passaram. Contraste, duração e legibilidade durante uma horda cheia ainda dependem de avaliação humana em computador e celular. O multiplayer permanece EM ANDAMENTO.

## Fase 2 — anúncios autoritativos de horda e amanhecer

A apresentação agora observa o dia, a fase e a geração `round` recebidos no snapshot autoritativo. A passagem para a horda mostra `HORDA — DIA N`; o avanço ao período de preparação mostra `DIA N — AMANHECEU`. Cada mudança produz um único anúncio curto e um sinal sonoro de interface. Primeiro snapshot, reconexão, snapshot repetido e nova geração da partida somente redefinem a referência, evitando avisos antigos ou duplicados.

Validação automatizada: 105 testes passaram em 21 arquivos. Os casos novos cobrem transição para horda, amanhecer, repetição do mesmo estado, conexão inicial, reset de reconexão e reinício da partida. Lint, TypeScript, build e geração da PWA passaram. Sincronia percebida, duração, contraste e áudio durante uma partida real ainda precisam de avaliação humana simultânea em computador e celular. O multiplayer permanece EM ANDAMENTO.

## Fase 2 — detecção de fluxo autoritativo interrompido

O cliente agora mede a idade do último snapshot novo aceito. Se o canal servidor → jogador ficar silencioso por mais de 2,5 segundos, a entrada e a predição são bloqueadas no mesmo quadro e o WebSocket é encerrado para iniciar a retomada. O prazo começa no `welcome`, portanto também cobre uma conexão aberta que nunca entrega seu primeiro estado. Snapshots duplicados ou regressivos não renovam o vigia e não conseguem manter uma sessão obsoleta aparentemente saudável.

Validação automatizada: 107 testes passaram em 22 arquivos. Os casos novos verificam o limite temporal e a renovação por snapshot válido; as suítes existentes continuam cobrindo bloqueio de controles, retomada de identidade, sequência de comandos e heartbeat. Lint, TypeScript, build e geração da PWA passaram. O comportamento sob falha unilateral real, suspensão prolongada da aba e troca de Wi-Fi ainda precisa de teste em aparelhos físicos. O multiplayer permanece EM ANDAMENTO.

## Fase 2 — primeira publicação multiplayer pública

O build de produção agora inclui a bancada cooperativa e apresenta `JOGAR ONLINE · 2 PLAYERS` no menu principal. O cliente usa TLS em `wss://inkdays-multiplayer.onrender.com`; o processo Node respeita a porta dinâmica da hospedagem e escuta publicamente somente nesse modo. O GitHub Pages continua servindo o jogo, enquanto o Render gratuito executa a autoridade da sala.

Validação remota: dois clientes WebSocket independentes conectaram pela internet ao serviço publicado, receberam identidades distintas e observaram dois jogadores na mesma sala autoritativa. Depois da publicação do GitHub Pages, duas sessões isoladas carregaram `?coop=1`, mostraram `2/2`, o mesmo Dia 1 e o mesmo cronômetro, com nomes remotos distintos; o ping observado nessa amostra ficou entre 159 e 166 ms, jitter entre 1 e 2 ms e perda indicada em 0%. Os 107 testes, lint, TypeScript, build e geração da PWA também passaram antes da publicação. Partida completa em dois aparelhos e redes físicas diferentes ainda está pendente. O plano gratuito pode suspender a instância por inatividade e provocar uma espera inicial de cerca de 50 segundos. Existe uma única sala de dois jogadores; códigos de sala ainda não foram implementados. O multiplayer público deve ser tratado como TESTE ONLINE e permanece EM ANDAMENTO.

## Correção pública — menu da PWA em celular horizontal

O menu em telas com até 450 px de altura agora reorganiza as quatro ações em uma grade 2×2, reduz somente a tipografia decorativa, oculta o texto lateral e respeita as áreas seguras do sistema. O layout amplo de computador foi preservado. A PWA também passa a ativar o novo service worker imediatamente e recarregar uma vez quando detecta atualização, evitando manter o menu antigo depois de uma nova publicação.

Validação: em viewports 844×390 e 640×320, `JOGAR ONLINE`, `JOGAR SOZINHO`, `CONFIGURAÇÕES` e `INSTALE AQUI` ficaram integralmente visíveis; o último limite inferior medido foi 186 px. Os 107 testes, lint, TypeScript, build e geração da PWA passaram. O resultado no aparelho Android que originou a captura ainda precisa ser confirmado após a publicação.

## Estrutura de áudio — primeira identidade dinâmica

O sistema Web Audio foi refeito em camadas leves e originais. O tiro combina transiente de ruído, corpo grave e queda curta de frequência; a recarga possui três eventos metálicos distribuídos pelo tempo. Passos agora acompanham o deslocamento, com cadência e peso diferentes entre caminhada e corrida. A preparação usa uma sequência melódica calma com sustentação, enquanto a horda reinicia o compasso em uma progressão mais rápida, com pulso grave e percussão. A direção busca o contraste e a energia de RPGs de ação, sem reutilizar músicas ou efeitos de outras obras e sem adicionar arquivos pesados à PWA.

No multiplayer, os passos locais seguem a velocidade recebida no snapshot autoritativo. O som de recarga começa somente na transição confirmada pelo servidor; tiro remoto continua vindo do evento autoritativo, e o disparo local mantém a previsão sonora já deduplicada por `shotId`. Validação automatizada: os 107 testes, lint, TypeScript, build e geração da PWA passaram. Mixagem em alto-falantes de celular, fones e sessões prolongadas ainda depende de escuta humana; música, efeitos e volume geral continuarão sendo refinados durante a produção.

## Fase 2 — sala pública ampliada para oito jogadores

A única sala autoritativa passou a aceitar até oito participantes. O servidor escolhe a primeira vaga livre, distribui os personagens em oito pontos únicos numa grade 4×2 e reutiliza corretamente uma vaga depois da saída. O menu informa `MULTIPLAYER`, o contador mostra a ocupação sobre oito e a nona conexão é recusada explicitamente.

Validação automatizada: 108 testes passaram em 22 arquivos. O teste de transporte abriu oito clientes WebSocket reais, exigiu que todos recebessem os oito participantes com identidades únicas, confirmou a recusa do nono cliente e verificou a remoção após desconexão. Testes diretos cobrem também posições iniciais únicas e reutilização de vaga. Lint, TypeScript, build e geração da PWA passaram. Esta entrega valida capacidade e convergência técnica local; equilíbrio da horda, desempenho do Render gratuito, legibilidade visual e uma partida humana prolongada com três a oito aparelhos ainda não foram validados. O núcleo de qualidade para dois jogadores continua sendo a referência principal, e a escala de três a oito deve ser tratada como experimental até esses testes físicos.

Validação pública após implantação manual no Render: o serviço entrou em `Live` no commit `e1768bd` e registrou `até 8 jogadores, combate autoritativo`. Duas sessões já estavam presentes; seis clientes de teste receberam seis identidades únicas e todos observaram a sala atingir oito participantes. Três tentativas excedentes não receberam identidade nem entraram no snapshot. O fechamento WebSocket com código 1008, confirmado localmente, não chegou aos clientes excedentes dentro da janela remota de cinco segundos através do proxy do Render; o bloqueio de entrada foi confirmado, mas essa demora no handshake de recusa deve ser acompanhada. A escala de três a oito continua experimental até playtest em aparelhos físicos.

O botão principal da home foi simplificado para `MULTIPLAYER`. Chat de voz foi mantido no plano, mas depende de uma camada WebRTC com sinalização, permissões de microfone, controles de mudo/volume e serviço TURN para atravessar redes móveis e roteadores com confiabilidade; ele será iniciado depois do playtest da sala ampliada para não misturar problemas de voz com os de sincronização do gameplay.

## Fase 2 — balanceamento inicial por tamanho da equipe e sala cheia explícita

A meta de inimigos agora é calculada no início de cada horda usando o número de participantes vivos e conectados naquele momento. A base do dia permanece igual para uma pessoa e cresce 45% por participante adicional, chegando a 21 inimigos no Dia 1 para oito pessoas, em vez de multiplicar a horda linearmente por oito. O teto global de 55 inimigos continua protegendo navegador, servidor e celulares. A quantidade é fixada no começo da horda para que entradas, mortes e reconexões no meio do combate não alterem retroativamente o desafio.

Quando a oitava vaga já está ocupada, o servidor envia `room-full` com a capacidade antes de fechar o WebSocket. O cliente mostra `SALA CHEIA · 8/8 JOGADORES`, desativa a entrada e deixa de insistir em reconexões a cada segundo. Isso torna a recusa compreensível mesmo quando o proxy da hospedagem demora a entregar o código de fechamento.

Validação automatizada: 109 testes passaram em 22 arquivos. Os casos novos cobrem escala de 1, 2, 4 e 8 participantes, teto da horda, entradas numéricas inválidas e recebimento do aviso de sala cheia antes do fechamento 1008 em nove clientes WebSocket reais. Testes de transporte, lint, TypeScript, build e geração da PWA passaram. Os números são um ponto inicial conservador; diversão, duração, FPS e clareza com equipes de três a oito ainda dependem de playtest humano em aparelhos físicos.

Validação pública após o deploy `ffeb148`: oito clientes receberam oito identidades únicas e observaram a sala atingir oito participantes. A nona tentativa recebeu `room-full` com capacidade oito e não entrou no snapshot. O proxy do Render novamente não entregou o fechamento 1008 dentro da janela observada, mas agora a mensagem explícita permite ao cliente apresentar o motivo imediatamente. O escalonamento numérico da horda está ativo no servidor público; duração, FPS e diversão ainda dependem de uma partida humana com vários aparelhos.

## Polimento de áudio — ambiente, transição e tiro

A preparação ganhou uma camada ambiente procedural de vento com aparições espaçadas de aves. Essa camada usa barramento próprio e recua durante a horda para abrir espaço ao combate. Música calma e música de ação agora possuem barramentos separados; a mudança de fase cruza os volumes gradualmente durante 1,15 segundo, preservando notas que já estavam soando e evitando corte abrupto.

O tiro da pistola passou de três para cinco componentes: transiente filtrado em altas frequências, corpo de ruído, mecanismo médio, impacto grave e uma reflexão curta. Um limitador permite no máximo seis disparos sonoros novos em cada janela de 50 ms, reduzindo estouro e custo quando vários participantes atiram simultaneamente sem alterar eventos, munição, dano ou traçantes autoritativos.

Validação técnica: lint, TypeScript, build PWA e 109 testes passaram. O pacote permanece sem amostras externas e o principal JavaScript cresceu cerca de 1,3 kB antes de gzip; a PWA continua precacheando oito arquivos. Timbre, equilíbrio entre música e efeitos, repetição do ambiente e reprodução em alto-falantes de celular e fones ainda exigem escuta humana. Esta é uma melhoria da base procedural, não a mixagem definitiva.

## Fase 2 — HUD de gameplay multiplayer

A leitura técnica extensa deixou de ocupar permanentemente o canto superior esquerdo. Depois de `CONTINUAR`, o painel de entrada é recolhido para um pequeno controle `REDE`; ao abri-lo, o jogador ainda pode baixar o relatório de diagnóstico. Foi corrigido também o CSS que mantinha o campo de nick visível mesmo depois de receber o atributo `hidden`.

O multiplayer agora apresenta dia, fase e cronômetro no topo central; dinheiro, eliminações e calendário do chefão no topo direito; corações, barra e valor de vida no canto inferior esquerdo; pistola, munição, reserva e recarga no canto inferior direito. Os valores vêm do mesmo snapshot autoritativo usado pela simulação. O chat foi elevado no desktop para não cobrir a vida, enquanto o layout touch move vida e munição para o topo, respeita áreas seguras e evita os analógicos. Água permanece fora da HUD porque ainda não existe como recurso real do jogo.

Validação: lint, TypeScript, build PWA e 109 testes passaram. Em inspeção visual automatizada a 1280×720, após `CONTINUAR` ficaram visíveis apenas o pequeno botão `REDE` no canto superior esquerdo, dia/tempo, dinheiro/eliminações, vida/corações e munição; o campo de nome e o bloco técnico desapareceram corretamente. O CSS possui adaptações para celular horizontal, mas a captura em aparelho físico que originou o pedido ainda precisa ser repetida após a publicação.

## Direção visual — traço do cenário e silhuetas compactas

O pós-processamento de contorno passou a ignorar os materiais do cenário, que já possuem o próprio casco de tinta. Isso remove a segunda linha grossa que aparecia em árvores, construções, cercas, pedras e vegetação, recuperando o traço fino anterior do mapa. O contorno novo permanece nos personagens animados.

Soldados e zumbis ficaram mais baixos pela redução das coxas e canelas no rig, com cabeça, tronco e quadril arredondados maiores em relação às pernas. Os zumbis compartilham agora uma máscara facial escura e olhos vermelhos. O esqueleto, as animações, a colisão, a mira e a sincronização de rede foram preservados.

Validação visual local: cenário sem contorno duplicado, personagem com os pés apoiados no chão e proporção mais próxima da referência a 1280×720. Build PWA, lint e 111 testes passaram antes da revisão final. A leitura da máscara dos zumbis em horda cheia e a proporção em celular físico ainda devem ser confirmadas após a publicação.

## Fase 2 — fundação autoritativa do chefão do Dia 10

O calendário deixou de ser apenas uma promessa de interface. Ao começar a horda de cada múltiplo de dez dias, o servidor cria `O COLOSSO` como entidade especial, com vida dimensionada pelo patamar do dia e pela quantidade de jogadores vivos. Tamanho, velocidade, alcance, dano, intervalo de ataque e recompensa são próprios. Dano, morte e os $500 da eliminação permanecem autoritativos; somente o jogador responsável pelo último tiro recebe a recompensa.

O snapshot compartilhado identifica o chefão, sua vida atual e máxima. Enquanto ele existir, todos os clientes exibem no topo `DIA 10 — O COLOSSO`, uma grande barra vermelha e o valor de vida, e renderizam o inimigo em escala superior à horda comum. A barra desaparece pelo mesmo snapshot que confirma sua morte. Hordas comuns continuam usando suas regras anteriores.

Validação automatizada: 112 testes passaram. O caso novo força a transição autoritativa para a horda do Dia 10, confirma identidade, escala e vida cooperativa do chefão, realiza a eliminação e verifica remoção compartilhada, recompensa exclusiva do autor e ausência de dinheiro para o companheiro. Lint, TypeScript e build PWA passaram. Esta entrega cria o primeiro chefão jogável, mas a arte exclusiva, golpes próprios, anúncio musical específico, telemetria prolongada e balanceamento humano do Dia 10 continuam pendentes; por isso o sistema de chefões permanece EM ANDAMENTO.

## Polimento visual — pistola estilizada própria

O bloco retangular preso à mão do soldado foi substituído por uma pistola original construída com cinco volumes leves: corpo, ferrolho, empunhadura inclinada, cano e massa de mira. A arma mantém o acabamento preto e o contorno do personagem, produz uma silhueta reconhecível sem adicionar textura ou arquivo pesado à PWA.

O pacote externo `17-weapons-and-attachments.zip` foi inspecionado somente como referência e não foi copiado para o repositório: a página do download o identifica como `Licença de Uso Pessoal`, condição insuficiente para a distribuição pública e uma eventual publicação comercial do INKDAYS. Uma licença comercial verificável ou um modelo próprio poderá substituir a arma procedural no futuro.

O arquivo externo `94-weapons.rar` também foi catalogado apenas como referência, inclusive para uma futura bazuca. Ele reúne uma coleção única em `.blend`, `.fbx`, `.obj` e `.x3d`, mas não contém licença ou autoria verificável dentro do pacote. Nenhum desses arquivos foi extraído para os ativos públicos. A arma pesada será projetada como conteúdo próprio quando suas regras de explosão, munição rara e autoridade multiplayer entrarem no plano.

Validação visual local: a pistola carregou presa à mão do rig, preservou o personagem compacto e apresentou cano e empunhadura distintos na câmera normal. Lint, TypeScript, build PWA e os 112 testes permaneceram aprovados.

## Ferramenta de teste — reviver imediatamente

Enquanto o multiplayer estiver em teste, qualquer jogador que chegar a zero de vida recebe no centro da tela o painel `VOCÊ CAIU — MODO DE TESTE` e o botão `REVIVER AGORA`. O pedido é processado pelo servidor: o jogador reaparece em sua vaga inicial com vida completa, velocidade zerada e dois segundos de proteção, preservando dinheiro, eliminações, dia e estado da sala. Se todos caírem, o primeiro revive também libera novamente o ciclo sem reiniciar a partida.

O cliente repete o pedido até observar a vida restaurada no snapshot, cobrindo perda artificial de mensagem, e então remove o painel automaticamente. Pedidos para um jogador vivo são rejeitados. Validação automatizada: 113 testes passaram, incluindo morte, reaparecimento, posição, vida, preservação da geração e rejeição de revive duplicado. Lint, TypeScript e build PWA passaram. O recurso é deliberadamente identificado como modo de teste; o sistema final continuará prevendo resgate por companheiros e regras próprias de derrota.

## Fase 2 — fúria e música própria de O Colosso

O primeiro chefão ganhou uma segunda etapa autoritativa. Ao atingir metade da vida, O Colosso entra em fúria uma única vez: velocidade aumenta 35%, o intervalo entre ataques cai 38% e o dano aumenta 20%. Esse estado faz parte do snapshot, portanto todos os jogadores observam a mesma transição e os mesmos atributos de combate.

Durante a fúria, a barra acrescenta `FÚRIA`, pulsa discretamente em vermelho e o modelo grande recebe uma respiração visual curta. A presença do chefão também seleciona uma frase musical exclusiva mais grave, rápida e pesada do que a música normal da horda; entrada e saída continuam seguindo o sistema dinâmico de áudio já existente.

Validação automatizada: 114 testes passaram. O caso novo reduz a vida do chefão até o limiar e confirma fúria, velocidade maior, ataque mais frequente, dano maior e publicação do estado no snapshot. Lint, TypeScript e build PWA passaram. Golpes com áreas telegráficas, modelo exclusivo e balanceamento humano prolongado continuam pendentes.

## Fase 2 — impacto telegrafado de O Colosso

O Colosso ganhou seu primeiro golpe próprio com contrajogo legível. Quando um jogador entra no alcance, o servidor fixa no chão uma área circular de 4,2 metros e publica 1,25 segundo de aviso para todos os participantes. O círculo pulsa e fica mais intenso até o impacto; a barra do chefão mostra `IMPACTO` durante a preparação e um sinal sonoro curto chama atenção sem cobrir a música.

Posição, raio, sequência, tempo restante e dano pertencem à autoridade. O cliente apenas apresenta o aviso. Ao terminar a preparação, o servidor causa 42 de dano nos jogadores que ainda estão dentro da área. Em fúria, o intervalo entre impactos diminui, mas a janela de reação permanece igual. Reconexão limpa avisos antigos e cada sequência sonora é reproduzida uma única vez.

Validação automatizada: 115 testes passaram. O caso novo força o golpe em uma partida com dois participantes, confirma que o snapshot compartilhado contém o mesmo aviso e verifica que o dano só é aplicado pelo servidor após o término da janela. Lint, TypeScript, build e geração da PWA passaram. A clareza do círculo sob uma horda cheia, a sensação dos 1,25 segundo com latência real e o balanceamento dos 42 pontos ainda dependem de teste humano em computador e celular.

## Fase 2 — confirmação compartilhada do impacto do Colosso

O fim do golpe circular agora gera um evento autoritativo independente do aviso. Todos os clientes recebem a mesma sequência, posição, raio e tick do impacto. A apresentação consome cada sequência apenas uma vez, evitando repetir efeitos quando snapshots chegam duplicados ou reordenados.

No impacto, uma onda de detritos de tinta se espalha pelo chão, toca um efeito grave em camadas e aplica tremor de câmera proporcional à distância. O aviso continua sendo apenas informativo; o evento de impacto e o dano continuam partindo do servidor. Reconexões usam o primeiro snapshot como referência e não reproduzem impactos antigos retidos no histórico.

Validação automatizada: 116 testes passaram. O novo teste WebSocket executa o golpe com dois clientes sob latência, jitter, perda, duplicação e reordenação artificiais; ambos recebem um snapshot idêntico com a mesma sequência de impacto e a mesma redução de vida. Lint, TypeScript, build e geração da PWA passaram. Intensidade do tremor e graves ainda precisam ser avaliados em celular físico e fones.

## Fase 2 — impulso autoritativo do impacto do Colosso

O impacto circular passou a empurrar jogadores para longe do centro e levantá-los brevemente do chão. Direção, força horizontal e impulso vertical são calculados pelo servidor no mesmo passo que cria o evento e aplica o dano. O movimento resultante segue a colisão compartilhada, portanto não atravessa sólidos nem ultrapassa o limite da arena; o cliente recebe a velocidade no snapshot e a reconcilia pela mesma base usada na locomoção multiplayer.

Validação automatizada: 117 testes passaram. O teste de combate confirma jogadores em lados opostos recebendo velocidades opostas e o mesmo impulso vertical. O teste de transporte degradado confirma que ambos os clientes observam dano, impulso e evento idênticos. Um caso adicional posiciona o jogador na borda e verifica que a colisão contém todo o deslocamento dentro do mapa. Lint, TypeScript, build e geração da PWA passaram. Força, altura e conforto visual ainda precisam de playtest humano com ping real.

## Direção visual — silhueta própria de O Colosso

O chefão deixou de reutilizar exatamente o corpo do zumbi comum em escala maior. Ele agora possui uma variante explícita no servidor e nos clientes, mantendo a forma branca e arredondada do INKDAYS, mas com tronco mais largo, ombros pesados, máscara frontal escura, olhos vermelhos maiores e uma coroa irregular de gotas de tinta. A versão com rig Mixamo recebe os mesmos volumes autorais sobre o esqueleto; o modelo procedural de segurança conserva a identidade caso os arquivos animados ainda estejam carregando ou falhem.

A mudança é apenas visual: colisão, escala de gameplay, animações, vida, fúria, golpe circular, dano e sincronização continuam usando a implementação autoritativa existente. Validação automatizada: 117 testes passaram em 23 arquivos; o teste do Dia 10 agora exige que a entidade criada selecione a variante `inkdays-boss` e contenha a máscara exclusiva. Lint, TypeScript, build e geração da PWA passaram. Proporção, leitura à distância e desempenho durante uma horda cheia ainda precisam de avaliação visual no computador e em celular físico.

## HUD cooperativa — estado da equipe durante o gameplay

O HUD multiplayer passou a apresentar a equipe no canto esquerdo, seguindo a leitura do print mestre: cada participante possui nome, indicador circular e barra de vida. O jogador local é identificado discretamente; aliados caídos, desconectados e em retomada permanecem visíveis com estados distintos. Nomes são inseridos como texto, sem HTML, e todos os valores vêm diretamente do snapshot autoritativo.

No celular horizontal, a lista vira uma faixa compacta abaixo do relógio e reduz cada participante para preservar a área da mira e os dois analógicos. A faixa comporta as oito vagas da sala inclusive na largura mínima de 640 px. Validação automatizada: 118 testes passaram em 24 arquivos; o caso novo confirma ordem do servidor, jogador local, queda, conexão e normalização visual da vida. Lint, TypeScript, build e geração da PWA passaram. A inspeção com o servidor público confirmou cinco participantes presentes na mesma lista; legibilidade com oito pessoas em aparelhos físicos ainda requer playtest.

## HUD cooperativa — minimapa autoritativo

O canto superior direito ganhou um minimapa circular leve do Vale do Papel. A posição e direção de cada participante vêm do snapshot; o jogador local aparece em tinta preta, aliados em azul acinzentado, inimigos comuns em vermelho e O Colosso com marca maior e mais escura. O mapa contém posições no limite conhecido da arena e não antecipa movimentação, surgimento ou morte localmente.

A renderização usa um único canvas de 180 px, evitando criar dezenas de elementos HTML durante hordas com até 55 inimigos. No celular horizontal ele reduz para 58 px e ocupa a área segura do canto, enquanto dinheiro e munição permanecem deslocados para não sobrepor o círculo. Validação automatizada: 119 testes passaram em 25 arquivos; o teste novo cobre origem, eixos, bordas, pontos externos e entradas inválidas. Lint, TypeScript, build e geração da PWA passaram. A inspeção visual confirmou o círculo e a legenda integrados ao HUD em 1920×900; densidade com uma horda cheia e legibilidade em celular físico ainda precisam de playtest.

## Ciclo cooperativo — resumo autoritativo do dia

Cada amanhecer agora publica um resumo único com o dia concluído, inimigos eliminados, dinheiro conquistado, sobreviventes, participantes conectados e data do próximo chefão. Eliminações e recompensas são acumuladas somente quando o servidor confirma a morte; os contadores são zerados no começo da horda seguinte e o resultado anterior não é reapresentado para quem entra ou reconecta no meio da preparação.

Todos os jogadores que acompanham a transição recebem a mesma tela central por 3,6 segundos. Ela mantém o gameplay em andamento para facilitar os testes atuais e se reduz no celular horizontal. Validação automatizada: 120 testes passaram em 25 arquivos. Os casos confirmam resumo com um aliado caído e também uma eliminação que gera exatamente $20 no placar do dia. Lint, TypeScript, build e geração da PWA passaram. A futura tela definitiva poderá aguardar confirmação dos jogadores quando o fluxo de lobby e prontidão estiver implementado.

## Fase 2 — entrada sincronizada do chefão

O início da horda de um dia múltiplo de dez agora substitui o anúncio comum por uma apresentação própria: `CHEFÃO · DIA 10`, `O COLOSSO` e `PREPAREM-SE`. A decisão usa o mesmo snapshot autoritativo que cria o chefão; assim, participantes que já acompanhavam a partida recebem a apresentação na mesma transição, enquanto entradas tardias e reconexões não reproduzem uma chegada antiga.

A faixa central ganhou contraste escuro, nome vermelho e duração maior, aproximando a batalha do enquadramento do print mestre. A música exclusiva do Colosso já selecionada pelo estado autoritativo começa junto da presença do boss. A barra superior continua mostrando vida, fúria e preparação do impacto durante o combate.

## Fase 2 — resgate cooperativo por proximidade

Um jogador vivo pode agora reviver um companheiro conectado que caiu a até 2,6 metros. A validação é feita pelo servidor: identidade do alvo, estado dos dois participantes e distância precisam continuar válidos quando o pedido chega. O aliado recupera a vida no ponto da queda com velocidade e comandos antigos zerados. Jogadores vivos, desconectados, distantes ou o próprio solicitante são rejeitados.

Durante o gameplay aparece `F · REVIVER nome` no PC e um botão contextual no celular. O botão individual `REVIVER AGORA` continua disponível separadamente enquanto o modo de teste estiver ativo. Validação automatizada: 121 testes passaram, incluindo recusa à distância, resgate próximo, preservação da posição e rejeição de repetição; lint, TypeScript e build PWA passaram. Alcance percebido, clareza do botão sob combate e uso simultâneo em dois aparelhos ainda dependem de playtest humano.

## Fase 2 — avisos compartilhados de queda e retorno

Transições de vida confirmadas pelo snapshot agora avisam discretamente quando um companheiro cai e quando volta. O primeiro estado recebido, a reconexão, snapshots repetidos e a própria queda do jogador não geram alertas falsos. O nome flutuante do aliado caído passa para vermelho e acrescenta `CAÍDO`, mantendo a identificação sem caixa de fundo.

O aviso orienta o jogador a se aproximar para reviver e desaparece sozinho, sem bloquear movimento, mira ou disparo. Validação automatizada: 123 testes cobrem queda remota, repetição, retorno, jogador local e reset de reconexão; lint, TypeScript e build PWA passaram. Legibilidade em meio à horda e prioridade entre vários aliados caindo quase juntos ainda dependem de playtest humano.

## Fase 2 — entrega confiável do pedido de resgate

Depois de iniciar um resgate, o cliente repete o pedido a cada 250 ms até receber um snapshot no qual o alvo já está vivo. O ciclo também termina se o companheiro desconectar, sair do alcance, for revivido por outra pessoa ou se a conexão do socorrista cair. Com isso, uma única mensagem perdida ou atrasada não deixa o botão aparentando sucesso sem mudar o estado real.

O servidor continua decidindo cada tentativa e pedidos repetidos não criam vida adicional nem deslocam o alvo. O texto muda para `AJUDANDO…` enquanto aguarda a confirmação. Esta camada foi validada por lint, TypeScript, build PWA e pelos 123 testes existentes; perda e retomada em duas redes móveis físicas continuam pendentes.

## Fase 2 — fundação do lobby com entrada protegida

Abrir o multiplayer público não coloca mais um novo participante imediatamente sob ataque. A conexão nasce em estado de lobby: o ciclo fica congelado se ninguém entrou, inimigos ignoram quem ainda está escolhendo o nome e esse participante não conta para derrota, horda ou resumo do dia. O botão agora diz `ENTRAR NA PARTIDA` e envia a confirmação ao servidor antes de liberar os controles.

Depois da entrada, pausar ou liberar o mouse mantém o jogador dentro da partida, como antes. Reconexões recuperam o estado pronto da mesma identidade. Clientes de protocolo anteriores continuam compatíveis porque o modo protegido é solicitado explicitamente na URL da conexão. A próxima evolução desta base será a tela de sala com código, lista e prontidão visível, sem reestruturar a simulação já validada.

## Fase 2 — primeira apresentação da sala pública

O painel de entrada passou a mostrar as oito vagas da sala. Cada participante aparece com nome e estado `AGUARDANDO` ou `NA PARTIDA`, sempre derivado do snapshot do servidor; vagas não ocupadas ficam marcadas como livres. A identidade local recebe `VOCÊ`, sem inserir nomes como HTML.

O botão `COPIAR CONVITE` gera o endereço público do multiplayer e remove qualquer sobrescrita técnica de servidor antes de copiar. A lista e os controles de entrada somem ao iniciar o gameplay, devolvendo a tela ao HUD discreto. Esta é a apresentação inicial da sala pública; códigos independentes e liderança da sala continuam como próximas entregas arquitetônicas.

## Fase 2 — prontidão visível e compatibilidade de implantação

O título da sala passa a informar quantos dos oito participantes já entraram. Quem ainda está no lobby aparece como `AGUARDANDO` também na lista compacta da equipe, com indicador vazado e sem uma barra de vida enganosa. O estado ativo considera `ready` ausente como verdadeiro, mantendo o frontend compatível durante a janela em que o GitHub Pages já atualizou e o Render ainda executa a versão anterior do protocolo.

O botão local também segue essa compatibilidade: somente um `ready: false` explícito mostra `ENTRAR NA PARTIDA`; servidores anteriores continuam permitindo `CONTINUAR`. Isso evita bloquear o jogo durante implantações separadas de frontend e servidor.


## Fase 2 — confirmação autoritativa de entrada e código da sala

O botão de entrada agora permanece em `ENTRANDO…` e repete o pedido a cada 250 ms até um snapshot confirmar que o participante está pronto. Movimento, mira, áudio de gameplay e controles touch só são liberados depois dessa confirmação. Se a conexão cair durante a entrada, o pedido é retomado após a reconexão da mesma identidade.

A sala pública recebeu o código estável `PAPEL`, enviado pelo servidor no pacote de boas-vindas e incluído no convite copiado. O cliente conserva compatibilidade com servidores anteriores usando o mesmo código como fallback. Esta etapa prepara a interface e o protocolo para múltiplas salas futuras sem afirmar que já existe isolamento entre códigos.

## Fase 2 — separação visual entre lobby e mapa

Participantes com prontidão explicitamente desativada continuam visíveis na sala e na faixa da equipe, mas deixam de criar avatar, nome flutuante ou marcador no minimapa. Quando o servidor confirma a entrada, o mesmo snapshot cria o personagem no mundo e passa a alimentar sua interpolação. Se alguém voltar a um estado de espera em uma evolução futura, a limpeza remove também buffers e rótulos associados.

A regra considera prontidão ausente como jogador ativo para continuar compatível com versões anteriores do servidor. Assim, durante uma implantação gradual, nenhum personagem legítimo desaparece apenas porque o snapshot antigo ainda não publica esse campo.

## Fase 2 — validação de entrada tardia sob rede degradada

A proteção de entrada foi exercitada com dois clientes reais conectados ao mesmo servidor local sob latência, jitter, perda periódica, duplicação e reordenação. Um participante permaneceu no lobby como observador enquanto o outro entrou diante de um inimigo. Ambos receberam snapshots idênticos durante a janela protegida, com vida 100, e depois observaram a mesma expiração e o mesmo dano autoritativo.

O teste repete o pedido de entrada para cobrir perda de pacote e verifica a convergência pelo mesmo tick nos dois clientes. Esta validação automatizada aproxima o cenário de rede real, mas troca de Wi-Fi, suspensão da PWA e latência de rede móvel ainda exigem aparelhos físicos.

## Fase 2 — isolamento real por código de sala

O servidor agora mantém uma autoridade independente para cada código válido recebido na conexão. Jogadores em `PAPEL` e `NOITE7`, por exemplo, possuem listas, posições, inimigos, ciclo de dias, chat, recompensas e chefões separados. Snapshots são calculados uma vez por sala e entregues somente aos sockets associados a ela.

A retomada por token conserva a sala original, mesmo que a URL seja alterada durante a reconexão. Salas adicionais vazias são removidas depois do prazo de retomada; `PAPEL` permanece como sala pública estável. O frontend já encaminha o parâmetro `room`, guarda tokens por sala e copia convites com o código confirmado pelo servidor. A interface para criar ou digitar códigos ainda será adicionada; nesta etapa, links contendo `?coop=1&room=CODIGO` já possuem isolamento técnico.

## Fase 2 — proteção autoritativa para entrada tardia

Ao confirmar a entrada ou recuperar uma conexão durante a partida, o servidor concede três segundos de proteção. Ataques comuns e o impacto especial do Colosso continuam sendo processados, mas não reduzem a vida protegida. O prazo pertence ao estado autoritativo e é enviado nos snapshots, evitando diferenças entre relógios dos aparelhos.

O HUD mostra `PROTEGIDO` com a contagem restante e oculta o aviso assim que o servidor encerra o prazo. A proteção não substitui a invulnerabilidade curta de dano nem interfere no resgate de aliados. O teste novo coloca um inimigo junto ao jogador, confirma vida intacta durante o prazo e dano normal depois dele.

## Fase 2 — criação e entrada em salas pela home

O botão `MULTIPLAYER` agora abre a escolha de sala dentro da identidade visual da home. O jogador pode entrar em `PAPEL`, criar automaticamente um código legível de seis caracteres ou digitar o código recebido de um amigo. Códigos são convertidos para maiúsculas, aceitam somente letras e números e exigem ao menos quatro caracteres antes da navegação.

Criar uma sala abre o lobby isolado já sustentado pelo servidor; o convite dessa tela conserva o mesmo código. O painel foi dimensionado também para celulares em modo horizontal, sem ocupar a área inteira. A geração determinística e a formação das URLs possuem cobertura automatizada; a reunião por convite ainda deve ser conferida em dois aparelhos depois que o servidor com isolamento de salas estiver implantado no Render.

## Fase 2 — lobby apresentado como tela de jogo

A espera multiplayer deixou de usar o pequeno quadro técnico no canto. O lobby agora ocupa o centro sobre o Vale do Papel, destaca o código da sala, apresenta as oito vagas em uma grade e diferencia visualmente quem aguarda de quem já está na partida. Nome, entrada, cópia do convite e retorno ao menu ficam no fluxo principal; métricas detalhadas permanecem disponíveis em uma seção recolhida para testes.

Depois que o servidor confirma a entrada, o lobby inteiro desaparece e apenas o diagnóstico recolhido continua acessível, preservando a área de gameplay. O layout inclui uma redução específica para celular horizontal. A composição visual foi conferida no navegador local com um snapshot real. O HUD, chat e mira ficam ocultos durante a espera e retornam somente após a confirmação de entrada. O comportamento com vários aparelhos físicos ainda depende de playtest público.

## Fase 2 — fechamento da entrada involuntária pelo lobby

A verificação visual revelou que o primeiro snapshot criava a base de predição e, mesmo com o jogador ainda no lobby, o relógio de entrada começava a enviar comandos neutros. A compatibilidade do servidor com clientes antigos promovia esse participante automaticamente para a partida. Por isso uma sala recém-criada podia exibir `1 NA PARTIDA` antes de qualquer clique.

A porta de controles agora exige quatro condições simultâneas: entrada local explicitamente ativa, WebSocket conectado, referência autoritativa disponível e chat fechado. Nenhum comando de movimento sai durante a espera; portanto, o servidor mantém `ready: false`, congela uma sala sem jogadores ativos e só concede a proteção quando o botão de entrada é confirmado. O teste unitário cobre explicitamente o lobby inativo.

Validação integrada local: uma sala inédita permaneceu em `1/8 CONECTADOS · 0 NA PARTIDA` depois de vários snapshots e mostrou `ENTRAR NA PARTIDA`. Somente após o clique o lobby foi removido e o HUD voltou a ficar visível.

## Fase 2 — apelidos sincronizados antes da entrada

O nome escolhido agora é enviado enquanto o participante ainda está no lobby, após uma breve pausa de digitação. O pedido confiável continua sendo repetido até o nome aparecer no snapshot autoritativo, e o valor normalizado fica salvo no navegador para as próximas salas. Assim, os amigos conseguem se identificar na grade antes de iniciar o gameplay.

O servidor aceita a troca de nome sem alterar a prontidão. Um teste de transporte conecta um cliente protegido, envia `Mari`, confirma o nome compartilhado e comprova que `ready` permanece falso e o relógio do primeiro dia continua congelado.

## Fase 2 — percurso integrado de uma dupla pelo lobby

Dois clientes WebSocket reais agora percorrem a mesma sala em uma validação permanente. Bruno e Mari conectam, recebem identidades distintas, compartilham seus apelidos e permanecem aguardando com o relógio congelado. Bruno entra sem alterar a prontidão de Mari; depois Mari entra e os dois recebem um snapshot de mesmo tick, conteúdo idêntico, ambos ativos e o mesmo ciclo em andamento.

Esse teste cobre a fronteira entre lobby e partida que antes estava dividida em verificações isoladas. Ele não substitui o playtest em dois aparelhos e duas redes físicas, mas impede que mudanças futuras promovam o companheiro errado, iniciem o dia antes da primeira entrada ou apresentem estados autoritativos diferentes após a reunião da dupla.

## Fase 2 — isolamento e entrada validados no servidor público

Após a implantação manual da branch do servidor no Render, três clientes WebSocket reais foram conectados ao endereço público. `AZV211` recebeu Bruno e Mari, enquanto `BZV211` recebeu somente Rafa; os pacotes de boas-vindas preservaram os códigos solicitados e os snapshots não misturaram participantes entre as salas.

Na sala da dupla, o relógio permaneceu congelado com ambos aguardando. Bruno entrou sem promover Mari, depois Mari entrou e os dois clientes observaram um snapshot idêntico do mesmo tick, dia e fase. Esta validação confirma isolamento e percurso do lobby na hospedagem pública. Permanecem pendentes sensação de latência, controles e estabilidade prolongada em dois aparelhos físicos.

## Fase 2 — reconexão validada na hospedagem pública

Dois clientes WebSocket foram conectados a uma sala temporária no servidor público, entraram na partida e compartilharam o mesmo estado. Depois da queda controlada de Bruno, Mari recebeu `connected: false`; Bruno retomou pelo token dentro do prazo e Mari recebeu novamente `connected: true`.

A retomada conservou o mesmo ID, código de sala, nome, prontidão, vida, munição e dinheiro. O snapshot de mesmo tick foi byte a byte igual nos dois clientes, com exatamente duas identidades e nenhum personagem duplicado. O ensaio ficou disponível em `npm run validate:public:reconnect`, usando uma sala isolada criada a cada execução. A troca real entre Wi-Fi e rede móvel, a suspensão do PWA pelo sistema e a sensação visual durante a queda ainda dependem de teste humano em dois aparelhos.

## Fase 2 — feedback durante o despertar do servidor

O lobby agora explica o tempo de espera da hospedagem gratuita sem parecer travado. A conexão começa com um estado curto de conexão; depois de cinco segundos, a interface informa que o servidor está acordando e que a primeira resposta pode levar até 50 segundos. Se a tentativa cair, o cliente continua reconectando automaticamente e atualiza o texto conforme queda comum, aquecimento ou expiração do estado autoritativo.

O jogador continua protegido no lobby durante todo esse percurso. Movimento, mira e entrada não são liberados antes do pacote de boas-vindas e do snapshot autoritativo, e uma entrada já solicitada volta a ser enviada após a recuperação. Os temporizadores são encerrados ao conectar, encontrar a sala cheia ou fechar a página. A implementação passou pelos 135 testes automatizados, lint e build/PWA; o tempo exato de despertar ainda varia conforme a carga do Render e a rede do aparelho.

## Fase 2 — retomada sem duplicação durante troca de rede

A reserva de uma identidade desconectada foi ampliada de cinco para quinze segundos, oferecendo uma margem mais realista para troca entre Wi-Fi e rede móvel ou retomada da PWA. Durante esse intervalo o personagem continua marcado como desconectado, não recebe comandos, não é perseguido pelos inimigos e não cria uma segunda vaga na sala.

A retomada agora também funciona quando a conexão nova chega antes de o servidor detectar a queda da antiga. O token válido transfere a sessão para o transporte novo, encerra o socket anterior com um motivo específico e ignora qualquer comando atrasado dele. O cliente substituído não entra em um ciclo de disputa: informa que a sessão foi retomada em outra aba ou aparelho e para de reconectar. O teste de transporte confirma mesma identidade, um único jogador conectado, encerramento controlado do socket antigo e aceitação imediata de comandos pelo novo. Troca física entre operadoras e suspensão agressiva do sistema móvel ainda dependem de playtest humano.

## Fase 2 — convite nativo entre aparelhos

O botão da sala agora usa a folha de compartilhamento do sistema quando o navegador oferece essa função. No celular, o jogador pode enviar diretamente o convite da sala por um aplicativo instalado; o conteúdo inclui o nome do INKDAYS e o endereço com o código correto. Se o compartilhamento nativo não existir ou falhar, o cliente copia o mesmo endereço para a área de transferência. Cancelar voluntariamente a folha não produz uma cópia inesperada.

O link continua removendo qualquer endereço técnico de servidor e conserva somente a entrada pública e o código normalizado da sala. A entrega passou por 139 testes, incluindo compartilhamento, fallback e cancelamento, além de lint e build/PWA. A lista exata de aplicativos oferecidos depende do sistema operacional, e o fluxo visual ainda deve ser conferido em um celular físico após a atualização da PWA.

## Fase 2 — retomada consciente entre abas e aparelhos

Quando uma identidade é retomada por outra conexão, o cliente anterior agora sai imediatamente do gameplay, desativa movimento, mira, áudio e controles touch e volta à apresentação da sala. A mensagem informa que a sessão foi aberta em outra aba ou aparelho, e o botão `USAR NESTE APARELHO` permite recuperá-la deliberadamente com o mesmo token. Não existe tentativa automática nesse caso, evitando que dois dispositivos disputem a identidade em um ciclo de reconexões.

Depois da recuperação, o jogador ainda aguarda o pacote de boas-vindas e o snapshot autoritativo antes de voltar à partida. A tela conserva o nome e o código da sala; o servidor continua mantendo uma única identidade, posição, vida, munição e recompensa. Os 139 testes existentes, incluindo substituição antecipada do transporte, passaram junto com lint e build/PWA. A alternância visual entre dois aparelhos físicos ainda precisa de playtest humano.

## Fase 2 — perda total e retorno da internet

O cliente agora acompanha os eventos de conectividade do navegador. Ao perder Wi-Fi ou dados móveis, interrompe comandos e controles touch, fecha o transporte pendente, mostra `SEM INTERNET` e deixa de abrir conexões inúteis. Quando o sistema informa que a rede voltou, a retomada começa imediatamente usando o token da mesma sala e identidade, ainda sujeita à confirmação autoritativa antes de liberar os controles.

Falhas em que o aparelho continua online usam espera progressiva de 1 até 8 segundos, reduzindo carga sobre navegador, bateria e servidor sem abandonar a sessão. Sala cheia, página encerrada e sessão transferida continuam bloqueando novas tentativas. A política possui testes próprios para todos esses estados e limites; a suíte total passou com 141 testes, lint e build/PWA. A troca física entre Wi-Fi e rede móvel ainda deve ser avaliada em aparelhos reais, inclusive porque sistemas móveis podem suspender a PWA antes de emitir os eventos.

## PWA — disponibilidade explícita do modo solo offline

A home agora chama o modo individual de `JOGAR SOLO` e apresenta um selo pequeno no próprio botão. Na primeira abertura publicada ele informa `OFFLINE · PREPARANDO`; somente depois que o navegador confirma um service worker ativo passa para `OFFLINE · PRONTO`. Em acessos posteriores controlados pelo worker, o estado pronto aparece imediatamente. Se o navegador não oferecer esse recurso, o botão continua permitindo jogar durante uma conexão sem prometer cache concluído.

O precache continua atômico: uma versão só é instalada depois que todos os arquivos gerados forem armazenados. A inspeção do pacote confirmou 20 de 20 arquivos listados, incluindo 12 recursos de personagem e áudio, além da interface e dos módulos do modo solo. Multiplayer permanece dependente da internet e do servidor autoritativo. A suíte de 141 testes, lint, TypeScript e build/PWA passou; abertura realmente offline depois de instalar ainda precisa ser repetida em computador e celular físicos.

## Fase 2 — hordas concluídas por eliminação e ondas controladas

A horda deixou de terminar por cronômetro. Durante a noite, o servidor mantém a fase ativa até que todos os inimigos planejados tenham surgido e sido eliminados; depois da última morte há uma pausa de 1,5 segundo e o amanhecer é publicado para todos no mesmo snapshot autoritativo. O HUD mostra `HORDA · N RESTANTES`, contando inimigos ativos e ondas futuras. Se os três últimos Borrões permanecerem vivos por 35 segundos, o HUD, minimapa e modelos fornecem um auxílio visual discreto.

O balanceamento solo está centralizado em uma tabela: Dia 1 `8 (4+4), 28s, máximo 7`; Dia 2 `12 (4+4+4), 27s, máximo 8`; Dia 3 `15 (5+5+5), 26s, máximo 10`; Dia 4 `18 (6+6+6), 25s, máximo 12`; Dia 5 `21 (7+7+7), 24s, máximo 13`; Dia 6 `24 (6+6+6+6), 23s, máximo 14`; Dia 7 `28 (7+7+7+7), 22s, máximo 16`; Dia 8 `32 (8+8+8+8), 21s, máximo 18`; Dia 9 `36 (9+9+9+9), 20s, máximo 20`. Uma equipe aumenta ondas e teto simultâneo em 45% por jogador, limitado ao teto global de 55. Limpar uma onda antecipa a próxima em 4,5 segundos; não limpar faz a onda seguinte entrar no intervalo máximo e acumular somente até o limite simultâneo.

No Dia 10, O Colosso recebe quatro fases de reforço: seis Borrões na chegada, seis a 75% de vida, oito a 50% e dez a 25%, totalizando 30. A vitória exige eliminar o chefão e todos os reforços. Se o chefão cair antes de disparar alguma fase, as levas ainda pendentes são liberadas, impedindo uma vitória incompleta. A música de chefão também passou a ser acionada no modo solo.

Para sustentar esse primeiro arco usando somente a pistola, a reserva inicial passou para 72, o máximo armazenável para 192 e a reposição no amanhecer para 120. Nenhuma arma, loja ou coleta nova foi introduzida. A lógica foi validada em 146 testes, incluindo ondas rápidas e lentas, teto simultâneo, última morte, fases do chefão e dois clientes sob latência, jitter, perda, duplicação e reordenação. O balanceamento de duração e munição ainda depende de playtest humano; a sensação de uma partida real em aparelhos e redes diferentes continua sendo uma validação de campo.

## Fase 2 — percepção local e navegação WANDER dos Borrões

Borrões comuns agora nascem em `WANDER` e não recebem conhecimento global dos jogadores. Sem alvo, cada um percorre o mapa em velocidade reduzida, escolhe direções próprias, muda de rumo ao encontrar bloqueio e intercala pequenas pausas. Os ângulos de nascimento usam distribuição progressiva com variação, reduzindo grupos sobrepostos sem substituir as regras existentes de spawn seguro.

A percepção autoritativa usa raio inicial de 12 metros, desistência em 18 metros e consultas escalonadas em aproximadamente 0,25 segundo. Dentro do raio, o Borrão prefere o jogador vivo mais próximo; jogadores mortos ou desconectados são retirados imediatamente da seleção. O alvo é mantido enquanto estiver entre os dois raios, evitando oscilações na borda, e é descartado ao ultrapassar a distância de desistência. O Colosso conserva sua busca agressiva e sua IA própria.

Estado, alvo, posição e morte continuam calculados exclusivamente no servidor e enviados nos snapshots. O cliente apenas interpola e anima `WANDER`, `CHASE` e `ATTACK`, portanto um mesmo Borrão não escolhe pessoas diferentes em aparelhos distintos. A assistência dos três últimos inimigos agora só acumula enquanto todos estão sem contato e aparece em pulsos de quatro segundos, em vez de permanecer fixa no minimapa.

Validação automatizada: 152 testes cobrem nascimento distante sem perseguição, deslocamento e pausa de WANDER, transições `WANDER → CHASE → WANDER`, escolha entre dois jogadores, exclusão de morto, 18 inimigos espalhados, alvo autoritativo nulo fora da percepção, levas completas, total restante e exigência da última morte. Lint, TypeScript, build e precache PWA também passaram. A naturalidade das pausas, densidade visual e valores 12/18 metros ainda devem ser calibrados por playtest no mapa público.

## Arsenal desenhado — Fase 1: fundação e Pistola de Rascunho

A arma inicial gratuita agora se chama `PISTOLA DE RASCUNHO` e deixou de usar o bloco preto genérico. O modelo é composto por traços vetoriais verdes, irregulares e tridimensionais, com leitura de giz/canetinha e pequenas imperfeições intencionais. A mesma identidade aparece na HUD solo e multiplayer. O visual é aplicado tanto ao avatar procedural quanto à mão direita do personagem animado, sem trocar o esqueleto ou as animações já validadas.

Categoria e desenho foram separados. A categoria centraliza cor, tipo de mecânica e, quando implementado, dano, alcance, cadência, carregador, reserva e recarga; o desenho armazena somente traços, escala e âncoras de empunhadura e saída do tiro. Desenhos de dimensões muito grandes são normalizados preservando proporção e imperfeições. Bastão, espada, submetralhadora roxa, escopeta, arco, rifle de precisão e lança-chamas laranja já possuem metadados centrais para as próximas fases, mas nenhum deles foi habilitado no combate, loja ou rede.

Os valores da pistola continuam idênticos aos anteriores e passaram a vir dessa fonte central: dano 26, intervalo 0,24 s, carregador 8, reserva inicial 72, reserva máxima 192, recarga 1,25 s e alcance 80. Nenhum estado de arma personalizada foi adicionado ao protocolo multiplayer nesta fase; os clientes continuam exibindo a mesma arma inicial determinística e o servidor mantém autoridade sobre tiro, munição, dano e morte.

Validação automatizada: 158 testes verificam a categoria inicial, o catálogo futuro desabilitado, dados e âncoras do rabisco, normalização proporcional, construção dos traços verdes e toda a suíte anterior de gameplay, hordas e multiplayer. Lint, TypeScript, build de produção e precache PWA com 20 arquivos passaram. Ainda dependem de playtest visual em aparelhos físicos o tamanho aparente na mão, a leitura do verde em telas pequenas e o alinhamento fino do cano durante todas as animações Mixamo. A próxima fase prevista é o quiosque/editor; ela não foi iniciada.

## Fase 2 — protocolo compacto e economia de tráfego

O multiplayer passou a usar protocolo v2 binário conceitualmente compacto em JSON: um keyframe completo abre cada conexão e novos keyframes são enviados a cada dois segundos; entre eles, deltas ordenados carregam somente entidades e campos alterados. Posições, velocidades, ângulos, vida e tempos são quantizados. Eventos de tiro, impacto e chat são enviados uma única vez por número serial. O cliente reconstrói o snapshot autoritativo e reinicia o decodificador ao reconectar, enquanto o servidor preserva o protocolo anterior nos testes de compatibilidade.

A cadência externa caiu para 20 Hz. Jogadores, Borrões em perseguição e chefão recebem atualização de movimento a 10 Hz; Borrões em `WANDER` usam 4 Hz, mantendo interpolação visual no cliente. Cada conexão mantém seu próprio encadeamento de keyframe e deltas; base ou sequência inválida é rejeitada até chegar um novo keyframe, evitando aplicar estado corrompido. Reconexões sempre começam por um keyframe novo.

Em uma simulação determinística de 60 segundos de estado, oito clientes e horda ativa, o transporte antigo consumiu 32.846.768 bytes e o novo 1.326.024 bytes, redução de 95,96%. A suíte completa passou com 167 testes, além de lint, TypeScript, build de produção e precache PWA. A economia real, estabilidade prolongada e sensação sob rede móvel ainda precisam ser validadas no novo servidor público e em dois aparelhos físicos.

O servidor otimizado foi implantado no Back4app Containers em `inkdaysmultiplayer-el5emgki.b4a.run`, plano gratuito de 256 MB, 0,25 vCPU e 100 GB de transferência. Dois clientes WebSocket reais entraram na mesma sala, receberam snapshots idênticos e a reconexão preservou ID, nome, prontidão, vida, munição e dinheiro. O GitHub Pages foi atualizado e o lobby público confirmou `1/8 CONECTADOS` usando o link normal, sem parâmetro técnico de servidor. O painel informa, porém, que a URL gratuita é temporária e permanece ativa por 60 minutos após a implantação; portanto esta hospedagem serve para testes públicos imediatos, mas ainda não é uma solução permanente sem upgrade ou outro provedor.

## Fase 2 — paisagem sonora gravada e recarga automática

A trilha procedural foi substituída por duas faixas licenciadas: `Post Apocalyptic Wastelands` acompanha a preparação e `Dark Ambience Loop` assume a horda com crossfade de 2,4 segundos. A trilha calma mantém seus 5m23s e foi comprimida de 14,2 MB para aproximadamente 2,2 MB; o conjunto completo desta atualização ocupa cerca de 2,6 MB e integra o cache offline da PWA. Os créditos e licenças estão em `public/audio/CREDITS.md`, e a atribuição obrigatória da música da horda também aparece nas configurações.

Tiro de pistola, recarga e passos passaram a usar gravações reais, com variação leve de afinação nos disparos e cadência distinta ao correr. Há amostras separadas para grama e chão firme e a API já aceita madeira e água; a seleção espacial dessas duas superfícies adicionais fica aguardando zonas físicas correspondentes no mapa. Se um arquivo falhar, o sintetizador anterior continua como fallback sem interromper o gameplay.

Ao disparar a última bala, a pistola inicia a recarga automaticamente quando ainda existe reserva. A regra vive na arma compartilhada pelo solo e pelo servidor autoritativo, portanto munição e estado de recarga permanecem sincronizados. A suíte passou com 168 testes, incluindo a nova regra; lint, TypeScript, build e geração do precache PWA também passaram. A mixagem final de volume ainda depende de escuta em celular e computador reais.

## Arsenal desenhado — câmera em primeira pessoa (entrega atual)

A câmera em primeira pessoa agora pode ser escolhida em Configurações sem remover a terceira pessoa. O modo usa uma apresentação local própria da Pistola de Rascunho, com duas mãos próximas, balanço de movimento e recuo, enquanto outros jogadores continuam enxergando o avatar completo. Armas longas já possuem um perfil visual maior separado para a etapa em que forem habilitadas.

O modo de câmera passou a acompanhar cada comando de entrada. O servidor valida `first`/`third` e calcula o raycast autoritativo com a mesma origem visual usada pelo jogador; clientes antigos sem esse campo continuam em terceira pessoa. Assim, a opção não mascara divergência entre mira local e dano. Nomes de jogadores e nomes no chat agora recebem uma cor estável por identidade, mantendo o cenário e personagens em preto e branco e o vermelho reservado a vida, dano e inimigos.

O vídeo e os prints enviados foram usados como referência de enquadramento, escala por categoria, empunhadura e leitura de arma desenhada. O baú de preparação, editor pago e drops de munição com janela de dez segundos permanecem como a próxima etapa. No multiplayer, compra, saldo, desenho equipado, nascimento e coleta do drop serão autoritativos para impedir duplicação ou estados diferentes entre aparelhos.
