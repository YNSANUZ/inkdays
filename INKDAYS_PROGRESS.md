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

