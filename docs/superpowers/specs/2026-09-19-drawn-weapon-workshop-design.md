# Oficina de armas desenhadas — especificação

## Objetivo

Transformar o desenho da arma em uma atividade jogável do INKDAYS. Durante a preparação, o jogador encontra um baú/oficina, escolhe uma categoria liberada e desenha com giz sobre um molde. A prévia é gratuita e o dinheiro só é descontado quando o jogador confirma a fabricação ou o redesenho.

Esta entrega preserva o combate atual: somente a Pistola de Rascunho está implementada e pode ser redesenhada. Categorias futuras aparecem como indisponíveis, com preço e dia de desbloqueio, até receberem mecânica, animação, áudio e balanceamento próprios.

## Experiência do jogador

- Um baú/oficina fica em posição fixa e reconhecível no Vale do Papel.
- A interação só é aceita durante `PREPARAÇÃO`. Na horda, o baú permanece visível, mas fechado.
- Ao se aproximar, aparece uma indicação discreta para abrir a oficina.
- A oficina pausa os controles locais de câmera, movimento e tiro enquanto está aberta.
- A tela mostra o molde da categoria, os pontos de empunhadura e cano, saldo, preço, cor, desfazer, limpar, prévia, confirmar e cancelar.
- Mouse, caneta e toque desenham sobre o mesmo canvas responsivo.
- O jogador pode testar visualmente o desenho sem pagar. Cancelar preserva dinheiro e arma anterior.
- Confirmar troca a aparência da arma imediatamente. No multiplayer, os outros jogadores recebem a nova arma e cor.

## Economia

- A arma inicial continua gratuita.
- O primeiro redesenho da pistola custa `$120`; redesenhos posteriores também custam `$120` nesta etapa.
- O custo é por confirmação, nunca por pincelada, tempo ou uso da borracha.
- Os preços já catalogados para armas futuras continuam sendo o preço do molde da categoria: Taco `$250`, Espada `$450`, SMG `$700`, Escopeta `$900`, Arco `$1100`, Sniper `$1600` e Lança-chamas `$2400`.
- Comprar um molde e redesenhar são operações diferentes. Categorias não implementadas não podem ser compradas.
- Saldo insuficiente mantém o editor aberto e mostra uma mensagem curta, sem alterar arma ou dinheiro.
- Repetir ou duplicar a mesma solicitação de compra não pode descontar duas vezes.

## Regras do desenho

- O molde é uma orientação visual e não vira parte do desenho final.
- Cada desenho aceita no máximo 24 traços, 64 pontos por traço e 1.024 pontos no total.
- Coordenadas são normalizadas entre `0` e `1`; largura do traço fica entre `0,012` e `0,065`.
- Pontos são simplificados antes do envio para reduzir ruído, tamanho e tráfego.
- O desenho precisa tocar zonas mínimas do molde: empunhadura, corpo e cano. A validação serve para manter a leitura da arma, sem exigir precisão perfeita.
- A silhueta pode escapar moderadamente do molde. Dimensões são normalizadas e nunca alteram dano, alcance, cadência, carregador ou recarga.
- Nesta etapa o jogador escolhe uma cor em uma paleta curta e legível. Vermelho puro permanece reservado para vida, dano e inimigos.
- Conteúdo vazio, não finito, excessivo ou fora dos limites é rejeitado pelo servidor.

## Autoridade e rede

- O cliente envia `weapon-purchase` com `requestId`, categoria, cor e desenho normalizado.
- O servidor valida fase, distância do baú, jogador vivo, categoria implementada, limites do desenho, zonas mínimas e saldo.
- O servidor desconta o dinheiro e incrementa a revisão da arma em uma única operação.
- `requestId` torna a confirmação idempotente durante repetição, atraso ou reconexão.
- O snapshot frequente carrega somente `weaponId`, categoria, cor e revisão. Os traços não são repetidos a cada snapshot.
- O servidor envia `weapon-definition` apenas ao entrar/reconectar, quando uma revisão muda ou quando um cliente ainda não conhece aquela revisão.
- O cliente mantém um cache por `weaponId + revision`. Isso preserva tráfego e permite que armas dos companheiros sejam reconstruídas.
- Tiro, munição, dano, saldo e compra continuam autoritativos. O desenho nunca modifica o raycast.

## Solo e persistência

- No modo solo, a mesma validação e tabela de preços são usadas localmente.
- A arma criada e o saldo da partida ficam no estado salvo local da PWA.
- Falha ou corrupção do dado salvo restaura a Pistola de Rascunho sem impedir a abertura do jogo.
- Multiplayer não confia no desenho ou saldo gravado no navegador.

## Interface e direção visual

- A oficina parece uma folha de desenho presa ao baú, com linhas pretas, papel branco e pequenos acentos na cor escolhida.
- O molde aparece em cinza claro; o traço do jogador é firme e irregular como giz/canetinha.
- A interface ocupa o centro no computador e quase toda a área útil em celular horizontal, respeitando recortes e controles de toque.
- O resultado usa a mesma geometria desenhada em primeira e terceira pessoa.
- A tela não apresenta atributos falsos de categorias ainda indisponíveis.

## Componentes

- `WeaponWorkshopRules`: preços, limites, validação de desenho, simplificação e cálculo de zonas.
- `WeaponWorkshopState`: arma equipada, revisões conhecidas, idempotência e aplicação atômica da compra.
- `WeaponWorkshopUI`: canvas, molde, ferramentas, saldo, prévia e mensagens.
- `WorkshopChest`: posição, distância de interação e indicação no mundo.
- Extensões de protocolo e servidor: compra, definição sob demanda e referência leve no snapshot.
- Adaptadores solo e multiplayer usam as mesmas regras, com autoridades de armazenamento diferentes.

## Falhas e recuperação

- Durante a horda, longe do baú, morto, saldo insuficiente ou desenho inválido: rejeitar sem desconto.
- Desconexão após confirmar: ao reconectar, `requestId` e revisão revelam se a compra já ocorreu.
- Definição desconhecida: mostrar temporariamente a Pistola de Rascunho e solicitar a revisão ao servidor.
- Canvas perdido por rotação ou redimensionamento: manter os traços normalizados e redesenhar sem perda.

## Validação

- Testes unitários para limites, simplificação, zonas, preço, saldo e idempotência.
- Testes do servidor para fase, distância, morte, categoria indisponível, compra válida e repetição de pacote.
- Teste de transporte com dois clientes comprovando o mesmo saldo, revisão e desenho após reconexão.
- Teste de codec comprovando que traços não entram nos snapshots frequentes.
- Testes de interface com mouse e eventos de ponteiro, além de inspeção visual em computador e celular horizontal.
- Suíte completa, lint, TypeScript, build PWA e medição do tamanho das mensagens antes da publicação.

## Fora desta entrega

- Mecânicas jogáveis de SMG, escopeta, sniper, armas brancas, arco ou lança-chamas.
- Venda, troca ou drop de armas entre jogadores.
- Mercado com dinheiro real.
- Cobrança por pincelada.
- Drops de munição no mapa; eles formam uma entrega posterior e autoritativa própria.
