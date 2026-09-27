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
- **Mode intent is explicit:** Find 02 asks what the player wants to play now instead of assuming Ranked.
- **02 Sync is post-match learning:** the match creates a hypothesis; shared games and voluntary feedback test it.
- **Multi-game identity:** ZeroTwo is the platform. League is one integration; VALORANT will require its own opt-in/RSO flow.

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

1. Player can change desired mode at any time.
2. Mode intent is persisted in discovery settings.
3. Matching considers mode intent together with server, availability, intent and compatible gameplay signals.
4. Player sees one candidate at a time.
5. Human-readable reasons appear before technical details.
6. Both players must express interest before a connection is created.

### 02 Sync

1. Mutual interest creates the pair.
2. ZeroTwo asks them to play together.
3. After shared matches, 02 Sync begins to learn.
4. Voluntary post-play feedback can improve future recommendations.

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
- [x] Find Your 02 v2 with explicit desired-mode intent and explainable compatibility.
- [x] Pool LAB com jogadores sintéticos para testes.
- [x] Interesse e match reais preparados para usuários UUID.
- [x] LAB Match para candidatos sintéticos.
- [x] Estrutura inicial de 02 Sync.
- [x] Player Client responsivo com Central, Find 02, DNA e Sync.

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
- [ ] Resultado do 02 compete visualmente com módulos técnicos.
- [x] Score heurístico `70/100` saiu da primeira camada; resultado usa faixa qualitativa e cálculo fica em detalhes.
- [ ] Estados como STANDBY, READY, 03/04 e telemetria têm peso excessivo para usuários novos.
- [ ] Detalhes do DNA são mostrados antes de o usuário demonstrar interesse neles.
- [ ] Alguns estados do frontend ainda podem ficar inconsistentes após atualização/deploy/cache.
- [x] LAB Match persistido no Supabase e independente de localStorage.

---

# Plano de melhoria UX

## P0 — Retenção e First 02

Objetivo: **encurtar drasticamente o caminho até o primeiro candidato.**

- [ ] Redesenhar primeira viewport da landing em torno de **Encontrar seu 02**.
- [ ] Um único CTA dominante: **Encontrar meu 02**.
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
- [ ] Resultado do candidato deve substituir o dashboard como primeira recompensa.
- [ ] CTA principal do resultado: **Tenho interesse**.
- [ ] CTA secundário: **Mostrar outro 02**.
- [ ] Explicação: **Por que combinamos?** recolhida por padrão.
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

## P1 — Find Your 02 v2

- [ ] Corrigir complementaridade de posições.
- [ ] Usar Gaming DNA quando disponível sem torná-lo obrigatório.
- [ ] Separar claramente sinais fortes, fracos e ausentes.
- [ ] Não tratar mesmo servidor como evidência de sinergia comportamental; é filtro/compatibilidade operacional.
- [ ] Adicionar preferências progressivamente.
- [ ] Adicionar controle **Pausar busca / Estou procurando 02**.
- [ ] Melhorar tratamento de candidatos esgotados/ignorados.
- [ ] LAB fallback também quando candidatos reais forem filtrados e o resultado final ficar vazio.

---

## P2 — 02 Sync real

Objetivo: validar o diferencial central do ZeroTwo.

- [ ] Detectar partidas contendo os PUUIDs de 01 e 02.
- [ ] Identificar partidas realmente jogadas juntos.
- [ ] Registrar histórico compartilhado.
- [ ] Calcular vitórias/derrotas juntos.
- [ ] Definir métricas de dupla.
- [ ] Definir confiança mínima antes de interpretar sinergia.
- [ ] Evitar conclusões com amostra insuficiente.
- [ ] Atualizar Sync automaticamente.
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
