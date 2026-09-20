# INKDAYS — backlog posterior à Fase 1

Nenhum item abaixo está implementado ou prometido como parte do vertical slice offline.

## Primeira tarefa da Fase 2
Fazer uma sessão curta de playtest do slice, registrar sensação de câmera/tiro, dificuldade e FPS em hardware alvo. Depois definir um contrato de comandos e snapshots da simulação e provar uma sala cooperativa autoritativa com dois jogadores, antes de construir interfaces sociais.

## Cooperação e serviços
- Multiplayer com servidor autoritativo, reconciliação e interpolação.
- Criação de sala e entrada por ID; lobby e estados de prontidão.
- Chat e mensagens discretas durante a partida.
- Nomes sobre jogadores e identificação dos amigos.
- Entrada tardia e sincronização de partida em andamento.
- Revive / DOWNED, separado da morte solo atual.
- Drop e transferência de itens com validação no servidor.
- Espectador e catálogo de partidas em andamento.
- Ranking, XP e progressão permanente.
- Avaliar Firebase para identidade e metadados; não assumir que substitui servidor de simulação.

### Voice Chat Multiplayer — futuro, não iniciado
- Comunicação por voz restrita aos jogadores da mesma sala, com **VOZ DA SALA** como primeira implementação.
- Microfone aberto após permissão: o jogador continua andando, correndo, mirando, atirando, usando itens e ajudando amigos enquanto conversa; não exige manter tecla ou botão pressionado.
- Controle discreto para alternar entre microfone ligado e mutado. Push-to-talk poderá existir como opção adicional nas configurações.
- Indicação discreta junto ao nome, sem caixa ou balão, enquanto a pessoa estiver falando.
- Controles futuros: mutar/desmutar individualmente, volume geral, volume individual quando apropriado e desligar completamente o voice chat.
- Permissões claras e compatibilidade planejada com desktop, navegador mobile, PWA, futuro APK e cross-play.
- Salas privadas poderão favorecer voz aberta simples. Partidas públicas exigirão decisão própria sobre segurança, privacidade e moderação antes da implementação.
- Avaliar WebRTC ou a tecnologia mais apropriada quando esta etapa começar.
- Evolução posterior: **VOICE CHAT POR PROXIMIDADE**, com volume reduzido pela distância e escolha do criador entre VOZ DA SALA e VOZ POR PROXIMIDADE.

## Conteúdo e gameplay
- Loja, economia e compras entre hordas.
- Armas adicionais e inventário.
- Chefões nos dias 10, 20, 30 etc.: nomes, barra de vida, música e comportamentos próprios.
- Mapas adicionais, variação ambiental e objetivos de preparação.
- Arte autoral refinada, animação de recarga, áudio e mixagem definitivos.

## Sistema de áudio e imersão
O playtest humano registrou que o áudio será parte central da identidade do INKDAYS. Preservar uma arquitetura leve e modular para permitir esta evolução sem interromper agora a robustez do multiplayer.

- **Música dinâmica:** preparação/exploração calma, agradável e atmosférica; transição gradual para música rápida e intensa durante a horda; retorno gradual ao período tranquilo. Chefões dos dias 10, 20, 30 etc. devem combinar apresentação, nome, barra de vida, efeito de entrada e música especial, com possibilidade de temas próprios.
- **Passos por superfície:** identificar grama, terra, concreto/pedra, madeira e materiais futuros. Diferenciar caminhada e corrida, sincronizar o ritmo ao movimento e reduzir repetição com variações adequadas de sample, pitch e volume.
- **Armas:** cada categoria terá identidade sonora própria. Pistola curta e seca; SMG rápida; rifle forte; escopeta pesada; sniper potente e distante; faca com lâmina e impacto; granada com preparação, lançamento e explosão; lança-chamas contínuo. Não reutilizar um único efeito apenas mudando o volume.
- **Problema atual de polimento:** o som placeholder da pistola foi percebido no playtest humano como estranho e pouco convincente. Melhorá-lo em uma oportunidade de polimento do core que não atrapalhe a validação de rede.
- **Áudio espacial:** posicionar fogo, máquinas, água, explosões, chefões, inimigos e tiros de outros jogadores; direção, distância e atenuação devem corresponder ao mundo.
- **Fogo:** casas, objetos, barris, fogueiras, inimigos incendiados e lança-chamas poderão emitir áudio espacial com distância, prioridade e limite de fontes.
- **Inimigos:** movimentação, aproximação, grunhido, ataque, dano e morte reconhecíveis. Tipos especiais poderão ser identificados apenas pelo som.
- **Chefões:** entrada, passos, ataques, gritos, habilidades, dano, morte e música devem transmitir identidade e peso.
- **Ambiente:** vento, folhas, pássaros, insetos, madeira e paisagem distante, de modo sutil durante a exploração para aumentar o contraste da horda.
- **Prioridade e distância:** limitar fontes simultâneas e priorizar tiro próximo, dano recebido, chefão e ataque inimigo sobre sons ambientes e repetitivos.
- **Performance:** manter abordagem web-first compatível com navegador mobile, PWA e futuro APK; carregar e administrar assets de forma eficiente.
- **Copyright:** usar durante o desenvolvimento apenas placeholders próprios, gerados ou licenciados; na versão pública, distribuir somente áudio permitido e registrar origem/licença quando necessário.

## Plataformas
- PWA com cache e atualização versionada.
- APK Android após perfis de memória, GPU, suspensão/retomada e navegação.
- Mobile horizontal / tablet e controles touch através da mesma interface de comandos.
- Cross-play, limites de partidas e testes com redes instáveis.

## Otimizações condicionais
- Pool de inimigos / efeitos se o perfil demonstrar necessidade.
- Instancing e LOD por regiões para mapas maiores.
- Testes em GPUs integradas e aparelhos Android antes de ampliar o limite de entidades.

## Arsenal desenhado — próximas entregas confirmadas
- Baú/quiosque físico no mapa, utilizável durante a preparação para gastar dinheiro.
- Editor de giz para desenhar a arma e escolher sua cor; o desenho equipado será visível em primeira pessoa e para os demais jogadores.
- Compras adicionais no mesmo baú somente após definir catálogo e balanceamento.
- Drops de munição em pontos válidos do mapa: tentativa a cada 10 segundos, duração de 10 segundos, flutuação visual e coleta decidida pelo servidor.
- Sincronizar saldo, compra, arma equipada, desenho e cor no multiplayer antes de habilitar o recurso público.
