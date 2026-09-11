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

## Conteúdo e gameplay
- Loja, economia e compras entre hordas.
- Armas adicionais e inventário.
- Chefões nos dias 10, 20, 30 etc.: nomes, barra de vida, música e comportamentos próprios.
- Mapas adicionais, variação ambiental e objetivos de preparação.
- Arte autoral refinada, animação de recarga, áudio e mixagem definitivos.

## Plataformas
- PWA com cache e atualização versionada.
- APK Android após perfis de memória, GPU, suspensão/retomada e navegação.
- Mobile horizontal / tablet e controles touch através da mesma interface de comandos.
- Cross-play, limites de partidas e testes com redes instáveis.

## Otimizações condicionais
- Pool de inimigos / efeitos se o perfil demonstrar necessidade.
- Instancing e LOD por regiões para mapas maiores.
- Testes em GPUs integradas e aparelhos Android antes de ampliar o limite de entidades.
