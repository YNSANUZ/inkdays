# INKDAYS — protocolo multiplayer econômico

## Objetivo

Reduzir em pelo menos 85% o tráfego de saída do servidor multiplayer sem transferir autoridade para os clientes e sem degradar de forma perceptível movimento, mira, combate, hordas ou reconexão.

O transporte atual envia um snapshot JSON completo a cada três ticks, aproximadamente 20 vezes por segundo. Uma medição local com oito jogadores e 17 inimigos encontrou média de 3.626 bytes por snapshot, equivalente a cerca de 261 MB por jogador/hora e 2,09 GB por sala cheia/hora. O novo protocolo terá um teste automatizado de orçamento para impedir que esse custo volte silenciosamente.

## Restrições preservadas

- O servidor continua sendo a única autoridade para movimento validado, dano, munição relevante, morte, recompensa, inimigos, horda, ciclo do dia e chefe.
- A predição e reconciliação do jogador local continuam funcionando.
- Jogadores e inimigos remotos continuam usando interpolação.
- WebSocket permanece confiável e ordenado durante uma conexão.
- Toda conexão nova ou retomada recebe estado completo antes de receber deltas.
- Reconexão nunca depende do histórico da conexão anterior.
- O protocolo rejeita versões incompatíveis de forma explícita.

## Formato do transporte

O protocolo de saída passa para a versão 2 e separa dois tipos de pacote.

### Keyframe

Um `keyframe` contém o estado necessário para reconstruir a partida inteira. Ele é enviado:

- na entrada e na reconexão;
- depois de reiniciar uma partida;
- periodicamente, a cada dois segundos;
- quando o servidor detectar que não existe uma base válida para o cliente.

O cliente substitui sua base pelo keyframe e descarta deltas de uma base anterior.

### Delta

Um `delta` referencia o identificador do keyframe vigente e contém somente:

- campos globais alterados;
- jogadores criados, removidos ou modificados;
- inimigos criados, removidos ou modificados;
- novos tiros, impactos e mensagens;
- mudanças de chefe, resultado do dia e horda.

Como WebSocket entrega mensagens em ordem, o cliente aplica deltas sequencialmente. Sequência inválida, base desconhecida ou lacuna detectada faz o cliente ignorar deltas até receber o próximo keyframe. Isso evita mascarar divergências com suavização.

## Representação compacta

Os pacotes usam arrays posicionais documentados para entidades de alta frequência, evitando repetir nomes extensos de propriedades. Identificadores permanecem estáveis durante a partida.

Posições e velocidades são quantizadas em centímetros; ângulos usam precisão de um décimo de grau; temporizadores usam centésimos de segundo quando necessário. Valores de vida, munição, dinheiro, sequência e seriais permanecem inteiros. A precisão escolhida fica abaixo do limiar visual da câmera e da tolerância de reconciliação.

O codec fica isolado em um módulo compartilhado pelo servidor e cliente. A simulação continua usando seus tipos atuais; somente a fronteira de transporte converte para o formato compacto.

## Frequência adaptativa

- Jogadores ativos: até 20 atualizações por segundo.
- Inimigos próximos, atacando ou perseguindo: até 10 atualizações por segundo.
- Inimigos distantes em `WANDER`: até 4 atualizações por segundo.
- Estado global sem alteração: não é repetido em deltas.
- Eventos efêmeros são enviados uma vez por conexão e confirmados implicitamente pela ordem do WebSocket.

O cliente mantém interpolação por timestamp/tick. Uma entidade que não recebe atualização continua sendo renderizada a partir do último estado válido, sem inventar dano, morte ou mudança de alvo.

## Geração de deltas

Cada sala calcula uma representação compacta por faixa de atualização. Cada conexão mantém apenas:

- chave do keyframe atual;
- último estado enviado por entidade;
- último serial enviado de cada fluxo de eventos;
- momento do último keyframe.

O servidor compara valores já quantizados. Mudanças inferiores à precisão do transporte não geram tráfego. Remoções usam listas de identificadores, evitando reenviar todas as entidades sobreviventes.

O controle de `bufferedAmount` permanece ativo. Cliente lento é desconectado com motivo recuperável antes que o servidor acumule memória ilimitada.

## Cliente e recuperação

O cliente decodifica keyframes e deltas para o mesmo formato de snapshot atualmente consumido pela apresentação. Dessa forma HUD, minimapa, animações, predição e áudio não precisam conhecer o formato compacto.

Na reconexão, os buffers de interpolação e cursores de evento são reiniciados como hoje. O primeiro keyframe estabelece a nova base. Eventos presentes no keyframe servem como linha de base e não são reproduzidos novamente.

Se o estado reconstruído ficar desatualizado, a lógica existente de freshness força reconexão. Nenhum cliente tenta decidir dano, morte, alvo ou término da horda para compensar ausência de pacote.

## Observabilidade e orçamento

O servidor contabiliza bytes enviados por sala e por conexão sem registrar conteúdo pessoal do chat. Métricas locais e testes apresentam:

- bytes totais;
- bytes por jogador/minuto;
- keyframes e deltas enviados;
- tamanho médio e máximo dos pacotes;
- redução relativa ao protocolo atual.

O teste de orçamento simula oito jogadores, preparação, horda com pelo menos 17 inimigos, tiros e eventos. Para aprovação, o protocolo novo deve reduzir o total em pelo menos 85% comparado ao snapshot completo de 20 Hz no mesmo cenário.

## Testes de aceitação

1. O codec reconstrói exatamente os campos autoritativos, dentro da tolerância de quantização documentada.
2. Criação, alteração e remoção de jogadores e inimigos sobrevivem a uma sequência de deltas.
3. Tiros, impactos e mensagens são entregues uma vez.
4. Um delta com base ou sequência inválida é rejeitado.
5. Reconexão começa por keyframe e recupera identidade, estado e sala.
6. Dois clientes reconstruem o mesmo estado autoritativo para o mesmo tick.
7. Predição, reconciliação e rewind de tiro continuam passando nos testes existentes.
8. Levas, contador, último inimigo, WANDER/CHASE, chefe e transição de dia permanecem corretos.
9. A suíte completa, lint, TypeScript e build passam.
10. O orçamento medido demonstra redução mínima de 85%.

## Implantação

Servidor e cliente serão publicados juntos, pois a versão 2 altera o protocolo. Primeiro o backend será implantado no Back4app e validado diretamente. Em seguida o frontend do GitHub Pages receberá a nova URL e será validado com dois clientes, reconexão e uma horda. O endpoint antigo do Render permanecerá apenas como referência de rollback enquanto estiver indisponível por quota.

O progresso e as medições reais serão registrados em `INKDAYS_PROGRESS.md`. A implantação não será considerada concluída apenas porque o socket abre: o teste público precisa confirmar entrada na mesma sala, estado compartilhado e reconexão.
