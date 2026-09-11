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

`dist/` contém os arquivos estáticos de distribuição. Não requer API, conta, serviços remotos, CDN nem IA durante a partida. Sem PWA nesta fase: offline significa execução local e nenhuma dependência de rede do gameplay, não instalação/cache via service worker.

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
Controles automáticos em aparelhos touch: analógico esquerdo para mover; arrastar à direita para mirar; segurar ATIRAR dispara e permite arrastar a mira. Botões de recarga, pulo, corrida e agachamento; pausa no canto superior direito. Girar para vertical pausa a partida. Interface validada em viewport mobile; desempenho e multitoque em aparelho físico ainda precisam de teste. PWA e multiplayer continuam fora deste slice.

