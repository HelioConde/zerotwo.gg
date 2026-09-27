# ZeroTwo.gg

> **You're 01. Find your 02.**

ZeroTwo.gg é uma plataforma de **player analytics + Looking For Group**, inicialmente integrada ao **League of Legends**. O produto entrega valor antes do cadastro: busca pública por Riot ID, histórico, dados oficiais e Gaming DNA multimodo. Find Your 02 e 02 Sync entram depois, quando o jogador quer encontrar companhia para jogar.

**Produto:** busca pública → Player 01 → Gaming DNA → Find Your 02 → jogar juntos → 02 Sync → algoritmo aprende.

A visão expandida está em [docs/PRODUCT.md](docs/PRODUCT.md).

---


### Product UX rules — current

- **Information first:** Riot ID search, player stats and recent history work before account creation.
- **Account later:** authentication is required only when the player wants to claim Player 01 / use Find Your 02.
- **Player value does not depend on network size:** ZeroTwo must remain useful even with one user.
- **Gaming DNA is context-aware:** Ranked, Normal, ARAM and Arena are separate contexts. Never force a Summoner's Rift metric onto another mode.
- **No fake precision:** ZeroTwo does not create unofficial MMR/ELO or expose matching weights as player-facing truth.
- **Mode intent is explicit:** Find 02 asks what the player wants to play instead of assuming Ranked.
- **Discovery intent is explicit:** **NOW** solves the next session; **RECURRING** looks for a player to build a repeatable gaming routine with.
- **02 Sync is post-match learning:** the match creates a hypothesis; shared games and voluntary feedback test it.
- **Multi-game identity:** ZeroTwo is the platform. League is one integration; VALORANT will require its own opt-in/RSO flow.
- **Narrative + depth:** YearIn.LoL is the reference for storytelling and emotional presentation; Rewind.LoL is the reference for deep history, trends and exploration. ZeroTwo must combine both without copying either.
- **Relationship layer:** historical co-players are not just a stats feature. They are the bridge into Find 02 and 02 Sync.

## North Star de UX

### Primeiro valor em segundos

The primary activation event is now **First Value**, not First 02.

Target public flow:

**Landing → Riot ID → useful player profile**

The player should receive useful information before creating an account.

### Activation ladder

1. **First Value** — first useful public player result.
2. **First 01** — user claims/saves a Player 01 identity.
3. **First 02** — first relevant candidate displayed.
4. **First Match** — mutual interest.
5. **First Sync** — first shared-match learning signal.

Primary metrics:

- Time to First Value.
- Search success rate.
- Public profile return rate.
- Public profile → Player 01 conversion.
- Player 01 → First 02.
- First 02 → mutual match.
- Match → first shared game.
- D1 / D7 / D30 return.

## Jornada alvo

### Visitante

1. Opens ZeroTwo.gg.
2. Searches Riot ID `GameName#TagLine`.
3. Immediately receives:
   - Riot player identity and level;
   - official Ranked data;
   - Champion Mastery;
   - recent champion form;
   - game-mode distribution;
   - Gaming DNA by mode;
   - recent match history;
   - expandable match details.
4. Can filter history by Ranked / Normal / ARAM / Arena / Other.
5. Can share the player-profile URL.
6. On a later visit, ZeroTwo can locally show what changed since the previous lookup.
7. Can leave without creating an account.

### Conversão para Player 01

1. Player chooses what they want to play: Ranked / Normal / ARAM / Arena / Any.
2. Chooses **Use as Player 01**.
3. Authentication is requested.
4. Riot ID, server and selected mode survive the auth flow.
5. Player 01 opens without automatically forcing Find 02.

### Find Your 02

1. Player chooses a discovery intent:
   - **NOW** — someone for the next session; active for up to 2 hours.
   - **RECURRING** — someone they may want to play with repeatedly; active for up to 14 days.
2. Player can change desired mode at any time.
3. Server and search type are operational filters, not fake behavioral compatibility points.
4. Matching then uses mode, availability, stated intent and gameplay evidence where meaningful.
5. Player sees one candidate at a time.
6. Human-readable reasons appear before technical details.
7. Both players must express interest before a connection is created.
8. After a match, Riot ID can be copied directly so the players can actually connect without ZeroTwo needing to build chat first.

### 02 Sync

1. Mutual interest creates the pair.
2. ZeroTwo asks them to play together.
3. After shared matches, 02 Sync begins to learn.
4. Voluntary post-play feedback can improve future recommendations.

### Minha História

The authenticated Player 01 has a private, progressively loaded history layer inspired by the strengths of YearIn.LoL and Rewind.LoL:

1. **Story** — large, memorable facts instead of raw tables.
2. **History/Trends** — activity rhythm, modes, champions, streaks and period comparison.
3. **Circle** — recurring teammates found in the player's own match history.
4. **Relationship bridge** — Circle can later connect historical co-players to ZeroTwo accounts and 02 Sync.
5. History grows progressively from Riot Match-V5 and reuses the server-side cache instead of pretending complete coverage.

### Usuário recorrente

ZeroTwo should answer **what changed?**

- new matches;
- mode distribution changes;
- recent KDA/form changes;
- Gaming DNA changes;
- new relevant 02 candidates;
- 02 Sync evolution.

## Estado atual

### Feito — infraestrutura e produto

- [x] React + TypeScript + Vite.
- [x] Deploy automático no GitHub Pages.
- [x] Supabase Auth.
- [x] Login com Google.
- [x] Perfil ZeroTwo persistido no Supabase.
- [x] Riot ID informado como `Nome#TAG`; Riot não é usado como login.
- [x] Edge Function segura para Account-V1 + Summoner-V4.
- [x] Riot API key somente no backend.
- [x] Cache server-side inicial para consultas Riot.
- [x] Persistência de Riot ID, PUUID, servidor e Summoner Level.
- [x] Match-V5 integrado para análise de partidas.
- [x] Public Riot ID lookup before account creation.
- [x] Official League-V4 Ranked data on public profile.
- [x] Champion-Mastery-V4 integration.
- [x] Recent champion performance summaries.
- [x] Shareable player-profile URLs.
- [x] Local "what changed since last visit" comparison.
- [x] Match history filters and expandable match details.
- [x] Server-side Match-V5 cache reused by public and authenticated analysis.
- [x] Gaming DNA multimode (Ranked / Normal / ARAM / Arena / other supported contexts).
- [x] Context-aware metrics so SR-specific metrics do not contaminate other modes.
- [x] Gaming DNA with observable metrics.
- [x] Confiança do DNA baseada no tamanho da amostra.
- [x] Explicações/evidências para a leitura do DNA.
- [x] Find Your 02 session-first matching with explicit desired-mode intent and explainable compatibility.
- [x] Discovery presence TTL; NOW sessions expire after 2 hours.
- [x] NOW vs RECURRING discovery intent; recurring searches expire after 14 days.
- [x] Match context preserves mode and search type into 02 Sync.
- [x] One-click Riot ID handoff after match; no chat dependency in the MVP.
- [x] Pool LAB com jogadores sintéticos para testes.
- [x] Interesse e match reais preparados para usuários UUID.
- [x] LAB Match para candidatos sintéticos.
- [x] Estrutura inicial de 02 Sync.
- [x] Player Client responsivo com Central, Minha História, Find 02, DNA e Sync.
- [x] Authenticated progressive `player-history` Edge Function.
- [x] Incremental match-history loading that reuses `lol_match_cache`.
- [x] My Story: time played, activity rhythm, modes, champions, streaks and highlights.
- [x] Private recent Circle derived from recurring same-team players.
- [x] Contextual bridge from history to recurring Find 02.

### Feito — validações reais

- [x] Riot ID real localizado pela API.
- [x] Summoner Level real carregado.
- [x] Partida válida de Summoner's Rift analisada.
- [x] Posição e campeão obtidos de partida real.
- [x] Gaming DNA inicial gerado com dados reais.
- [x] Find Your 02 retornando candidatos LAB.
- [x] Match LAB funcionando.

---

## Problemas UX encontrados

- [x] Primeiro valor exigia cliques demais — public Riot ID search now delivers value before auth.
- [ ] Central expõe funcionamento interno antes do resultado.
- [ ] Excesso de informação simultânea aumenta carga cognitiva.
- [ ] Ações operacionais como “Analisar partidas” e “Atualizar busca” exigem trabalho do usuário.
- [x] Gaming DNA funcionava como portão — public profile and DNA now work independently of Find 02.
- [x] Configuração de perfil acontecia cedo demais — removida do caminho crítico; perfil mínimo é preparado automaticamente.
- [x] Resultado do 02 ganhou uma superfície de decisão própria, sem competir com módulos técnicos.
- [x] Score heurístico `70/100` saiu da primeira camada; resultado usa faixa qualitativa e cálculo fica em detalhes.
- [ ] Estados como STANDBY, READY, 03/04 e telemetria têm peso excessivo para usuários novos.
- [ ] Detalhes do DNA são mostrados antes de o usuário demonstrar interesse neles.
- [ ] Alguns estados do frontend ainda podem ficar inconsistentes após atualização/deploy/cache.
- [x] LAB Match persistido no Supabase e independente de localStorage.

---

# Plano de melhoria UX

## P0 — First Value → contextual Find

Objetivo: **entregar valor antes do cadastro e transformar o contexto real do jogador em uma próxima ação natural.**

- [x] Primeira viewport orientada à busca pública e First Value.
- [x] Perfil público oferece Find 02 somente depois de entregar informação.
- [x] CTA contextual usa o modo recente: **Encontrar agora** ou **Procurar parceria**.
- [ ] Simplificar autenticação inicial; Google como caminho principal.
- [x] Remover Riot como opção de login.
- [x] Após login, pedir somente Riot ID quando ainda não existir.
- [x] Remover nickname/preferências obrigatórias antes do primeiro resultado quando não forem tecnicamente necessárias.
- [ ] Criar pipeline automático após Riot ID:
  - [ ] localizar Riot ID;
  - [ ] atualizar dados do jogador;
  - [ ] analisar partidas;
  - [ ] atualizar DNA;
  - [ ] procurar 02.
- [ ] Criar tela única de processamento com progresso automático.
- [x] Não bloquear Find 02 por baixa amostra de DNA.
- [ ] Usar perfil/Riot/sinais disponíveis enquanto DNA amadurece.
- [x] Resultado do candidato substitui o dashboard como primeira recompensa quando o fluxo começou em Find 02.
- [x] CTA principal do resultado: **Tenho interesse**.
- [x] CTA secundário: **Mostrar outro 02**.
- [x] Explicação detalhada/evidências recolhida por padrão.
- [ ] Remover botões operacionais do critical path.
- [ ] Corrigir estados 03/04, READY/STANDBY e singular/plural.
- [x] Persistir LAB Match no backend para testes consistentes.

### Critério de conclusão P0

Um usuário novo consegue ir de login + Riot ID até um candidato sem navegar manualmente por Central, Gaming DNA ou Find 02.

---

## P1 — Progressive disclosure e clareza

Objetivo: manter profundidade sem sobrecarregar o primeiro uso.

- [ ] Transformar Gaming DNA em descoberta secundária: **Veja o que descobrimos sobre seu jogo**.
- [ ] Exibir resumo do DNA primeiro.
- [ ] Colocar métricas avançadas em **Ver detalhes**.
- [ ] Colocar evidências em **Por que chegamos nisso?**.
- [ ] Trocar scores heurísticos públicos por faixas compreensíveis até existir calibração suficiente:
  - compatibilidade forte;
  - compatibilidade possível;
  - poucos sinais disponíveis.
- [ ] Mostrar quantidade de sinais usados.
- [ ] Comunicar DNA de baixa amostra como **Ainda estamos conhecendo seu jogo**.
- [ ] Progressive profiling: pedir horário, intenção e preferências quando elas puderem melhorar um resultado já apresentado.
- [ ] Redesenhar Central para usuário recorrente.
- [ ] Reduzir quantidade de HUD/status técnico visível simultaneamente.
- [ ] Tornar a navegação mobile orientada às tarefas principais.
- [ ] Criar empty states que levem diretamente à próxima ação útil.

---

## P1 — Find Your 02 / relationship loop

- [x] Corrigir complementaridade de posições e usar funções só em Ranked/Normal.
- [x] Usar Gaming DNA quando disponível sem torná-lo obrigatório.
- [x] Separar compatibilidade operacional de sinais de estilo.
- [x] Mesmo servidor é filtro obrigatório, não evidência comportamental.
- [ ] Adicionar preferências progressivamente.
- [x] Adicionar controle de sessão e **Encerrar busca**.
- [x] Separar **NOW** de **RECURRING**.
- [x] Melhorar tratamento de candidatos esgotados/ignorados — skip é persistido e remove o candidato da fila.
- [ ] LAB fallback também quando candidatos reais forem filtrados e o resultado final ficar vazio.

---

## P2 — 02 Sync real

Objetivo: validar o diferencial central do ZeroTwo.

- [x] Detectar partidas contendo os PUUIDs de 01 e 02.
- [x] Identificar partidas realmente jogadas juntos no mesmo time e após o match.
- [x] Registrar histórico compartilhado.
- [x] Calcular vitórias/derrotas juntos.
- [x] Registrar modos e pares de campeões jogados juntos.
- [x] Separar evidência de aprendizado no Sync.
- [x] Evitar conclusões com amostra insuficiente.
- [x] Atualizar Sync sob demanda reutilizando cache Riot.
- [ ] Mostrar mudança da hipótese inicial após partidas reais.
- [ ] Alimentar futuras recomendações com resultados observados.

---

## P2 — Qualidade do Gaming DNA

- [ ] Corrigir/validar cache de `lol_match_cache`.
- [ ] Registrar erros de cache em vez de falhar silenciosamente.
- [ ] Tratar rate limits Riot com retry/backoff apropriado.
- [ ] Diferenciar 404 de falhas temporárias.
- [ ] Invalidar snapshots antigos gerados por algoritmos incompatíveis.
- [ ] Adicionar versão do algoritmo ao snapshot.
- [ ] Normalizar métricas por posição quando houver amostra suficiente.
- [ ] Estudar normalização por champion/rank/patch sem criar falsa precisão.
- [ ] Melhorar tratamento de zero deaths no KDA.
- [ ] Atualização incremental em vez de reprocessamento desnecessário.

---

## P2 — Retenção

- [ ] Depois de novas partidas: **Seu Gaming DNA mudou**.
- [ ] Depois de match: **Jogue com seu 02 para começar o Sync**.
- [ ] Depois de partida conjunta: **02 Sync atualizado**.
- [ ] Recomendações novas quando o DNA mudar significativamente.
- [ ] 02 Streak.
- [ ] Evolução do jogador.
- [ ] Descobertas contextuais.
- [ ] ZeroTwo Wrapped futuro.

---

## Analytics obrigatório

Antes de otimizar retenção, medir o funil real.

Eventos mínimos:

- [ ] `landing_view`
- [ ] `find_02_cta_clicked`
- [ ] `auth_started`
- [ ] `auth_completed`
- [ ] `riot_id_started`
- [ ] `riot_id_submitted`
- [ ] `riot_player_found`
- [ ] `dna_started`
- [ ] `dna_ready`
- [ ] `first_02_shown`
- [ ] `candidate_details_opened`
- [ ] `candidate_skipped`
- [ ] `candidate_interested`
- [ ] `02_match_created`
- [ ] `sync_opened`
- [ ] `first_shared_match_found`

Métricas principais:

- **Activation rate:** % que chega a `first_02_shown`.
- **Time to First 02:** tempo entre entrada/login e primeiro candidato.
- **Actions to First 02:** ações conscientes até primeiro candidato.
- Drop-off por etapa.
- Riot ID success rate.
- First 02 → interesse.
- Interesse → match.
- Match → retorno.
- Match → primeira partida conjunta.
- D1 / D7 / D30 retention.

Não assumir metas como benchmarks de mercado. Criar baseline com usuários reais e melhorar por experimento.

---

## Experimentos UX

Depois da instrumentação:

- [ ] Search hero variants focused on faster First Value.
- [x] Riot ID before account creation for League public lookup.
- [ ] Score numérico vs. compatibilidade qualitativa.
- [ ] Resultado direto vs. Central após onboarding.
- [ ] DNA resumido vs. DNA completo.
- [ ] Uma recomendação por vez vs. grid de candidatos.
- [ ] CTA **Tenho interesse** vs. **Quero jogar com este 02**.

Alterar uma hipótese relevante por experimento e medir ativação + retenção, não apenas CTR.

---

## Roadmap de execução

### Agora

**P0 UX → First Value rápido → perfil público útil → analytics → medir retorno.**

### Depois

**Progressive disclosure → mode-aware Find 02 → 02 Sync real.**

### Em seguida

**DNA avançado → aprendizado de dupla → retenção → VALORANT.**

Não aumentar a quantidade de funcionalidades visíveis antes de validar que novos usuários chegam rapidamente ao First Value e retornam ao perfil público.

---

## Segurança

- Riot API key somente no backend.
- Supabase service role somente no backend.
- Publishable key pode ser usado pelo cliente conforme políticas/RLS.
- Nunca persistir tokens OAuth em logs.
- Dados LAB devem permanecer separados de dados reais.
- Não representar jogadores sintéticos como pessoas reais.

---

## Desenvolvimento

```bash
npm install
npm run dev
npm run build
```

Pushes em `main` disparam o workflow de GitHub Pages.

## Disclaimer

ZeroTwo.gg é independente e não é endossado pela Riot Games. League of Legends, VALORANT e Riot Games são marcas de seus respectivos proprietários.
